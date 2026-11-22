const statuses = ['wishlist', 'visited']

export function validateSavedRequest(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('invalid_request')
    }
    const { action, status, placeId, offset = 0, language = 'es' } = input
    if (!['list', 'save', 'remove'].includes(action)) throw new Error('invalid_request')
    if (action !== 'remove' && !statuses.includes(status)) throw new Error('invalid_request')
    if (action === 'list') {
        if (!Number.isInteger(offset) || offset < 0 || offset > 10000 ||
            !['es', 'en'].includes(language)) throw new Error('invalid_request')
        return { action, status, offset, language }
    }
    if (typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(placeId)) {
        throw new Error('invalid_request')
    }
    return action === 'save' ? { action, status, placeId } : { action, placeId }
}

export function createSavedHandler({ supabaseUrl, publicKey, apiKey, fetcher = fetch }) {
    const json = (body, status = 200) => Response.json(body, {
        status, headers: { 'Cache-Control': 'no-store' },
    })

    async function details(row, language) {
        const fallback = {
            id: row.place_id, status: row.status, name: null,
            address: null, googleMapsUrl: null, attributions: []
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
            // Keep the saved entry manageable even if Google cannot return its data.
            return fallback
        }
    }

    return async (request, { user, authorization }) => {
        const input = validateSavedRequest(await request.json())
        const url = new URL(`${supabaseUrl}/rest/v1/saved_restaurants`)
        // Use the caller's session so the database also enforces row ownership.
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
            if (input.action === 'remove') {
                method = 'DELETE'
                url.searchParams.set('place_id', `eq.${input.placeId}`)
            } else {
                url.searchParams.set('select', 'place_id,status')
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
            if (input.action !== 'list') return json({ ok: true })
            const rows = await response.json()
            if (!Array.isArray(rows)) throw new Error('invalid_response')
            const restaurants = await Promise.all(rows.slice(0, 5).map((row) => details(row, input.language)))
            return json({ restaurants, hasMore: rows.length > 5 })
        } catch {
            return json({ error: 'service' }, 503)
        }
    }
}
