export async function loadRestaurantDetails(row, language, { apiKey, fetcher = fetch }) {
    const fallback = {
        id: row.place_id, status: row.status, name: null,
        address: null, googleMapsUrl: null, attributions: [],
        userRating: row.user_rating ?? null,
        userCategory: row.user_category || '',
        userPriceLevel: row.user_price_level || ''
    }
    if (!apiKey) return fallback
    try {
        const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(row.place_id)}`)
        url.searchParams.set('languageCode', language)
        const response = await fetcher(url, {
            headers: {
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'id,displayName,formattedAddress,googleMapsUri,attributions',
            },
            signal: AbortSignal.timeout(8000),
        })
        if (!response.ok) return fallback
        const place = await response.json()
        if (typeof place.displayName?.text !== 'string' || !place.displayName.text) return fallback
        return {
            ...fallback, name: place.displayName.text,
            address: place.formattedAddress || null,
            googleMapsUrl: place.googleMapsUri || null,
            attributions: Array.isArray(place.attributions) ? place.attributions : []
        }
    } catch {
        // The saved entry remains manageable when its provider data is unavailable.
        return fallback
    }
}

const statuses = ['wishlist', 'visited']

export function validateSavedRequest(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('invalid_request')
    }
    const { action, status, placeId, offset = 0, language = 'es',
        rating, category = '', priceLevel = '' } = input
    if (!['list', 'save', 'remove', 'rate'].includes(action)) throw new Error('invalid_request')
    if (['list', 'save'].includes(action) && !statuses.includes(status)) throw new Error('invalid_request')
    if (action === 'list') {
        if (!Number.isInteger(offset) || offset < 0 || offset > 10000 ||
            !['es', 'en'].includes(language)) throw new Error('invalid_request')
        return { action, status, offset, language }
    }
    if (typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(placeId)) {
        throw new Error('invalid_request')
    }
    if (action === 'rate') {
        if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
            throw new Error('invalid_request')
        }
        if (!['', 'vegetarian', 'italian', 'seafood'].includes(category) ||
            !['', 'inexpensive', 'moderate', 'expensive'].includes(priceLevel)) {
            throw new Error('invalid_request')
        }
        return {
            action, placeId, rating,
            category: rating === null ? '' : category,
            priceLevel: rating === null ? '' : priceLevel
        }
    }
    return action === 'save' ? { action, status, placeId } : { action, placeId }
}

export function createSavedHandler({ supabaseUrl, publicKey, apiKey, fetcher = fetch }) {
    const json = (body, status = 200) => Response.json(body, {
        status, headers: { 'Cache-Control': 'no-store' },
    })


    return async (request, { user, authorization }) => {
        const input = validateSavedRequest(await request.json())
        const url = new URL(`${supabaseUrl}/rest/v1/saved_restaurants`)
        // The caller's session allows the database to enforce row ownership.
        const headers = {
            apikey: publicKey, Authorization: authorization,
            'Content-Type': 'application/json'
        }
        let method = 'GET'
        let body
        if (input.action === 'save') {
            method = 'POST'
            url.searchParams.set('on_conflict', 'user_id,place_id')
            headers.Prefer = 'resolution=merge-duplicates,return=minimal'
            body = JSON.stringify({ user_id: user.id, place_id: input.placeId, status: input.status })
        } else {
            url.searchParams.set('user_id', `eq.${user.id}`)
            if (input.action === 'rate') {
                method = 'PATCH'
                url.searchParams.set('place_id', `eq.${input.placeId}`)
                url.searchParams.set('status', 'eq.visited')
                url.searchParams.set('select', 'place_id')
                headers.Prefer = 'return=representation'
                body = JSON.stringify({
                    user_rating: input.rating,
                    user_category: input.category, user_price_level: input.priceLevel
                })
            } else if (input.action === 'remove') {
                method = 'DELETE'
                url.searchParams.set('place_id', `eq.${input.placeId}`)
            } else {
                url.searchParams.set('select', 'place_id,status,user_rating,user_category,user_price_level')
                url.searchParams.set('status', `eq.${input.status}`)
                url.searchParams.set('order', 'created_at.desc,place_id.asc')
                url.searchParams.set('offset', String(input.offset))
                url.searchParams.set('limit', '6')
            }
        }
        try {
            const response = await fetcher(url, {
                method, headers, body, signal: AbortSignal.timeout(8000),
            })
            if (!response.ok) return json({ error: 'service' }, response.status === 401 ? 401 : 503)
            if (input.action === 'rate') {
                const updated = await response.json()
                if (!Array.isArray(updated) || updated.length !== 1) return json({ error: 'not_found' }, 404)
                return json({ ok: true })
            }
            if (input.action !== 'list') return json({ ok: true })
            const rows = await response.json()
            if (!Array.isArray(rows)) throw new Error('invalid_response')
            const restaurants = await Promise.all(rows.slice(0, 5).map((row) => loadRestaurantDetails(row, input.language, { apiKey, fetcher })))
            return json({ restaurants, hasMore: rows.length > 5 })
        } catch {
            return json({ error: 'service' }, 503)
        }
    }
}
