import { loadRestaurantDetails } from './saved-restaurants.mjs'

export function validateSharing(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) ||
        !['share', 'revoke'].includes(input.action) ||
        !['wishlist', 'visited'].includes(input.status)) throw new Error('invalid_request')
    return { action: input.action, status: input.status }
}

export function validateSharedList(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_request')
    const { token, offset = 0, language = 'es' } = input
    if (typeof token !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token) ||
        !Number.isInteger(offset) || offset < 0 || offset > 10000 ||
        !['es', 'en'].includes(language)) throw new Error('invalid_request')
    return { token, offset, language }
}

export function createSharingHandler({ supabaseUrl, publicKey, fetcher = fetch }) {
    return async (request, { user, authorization }) => {
        const input = validateSharing(await request.json())
        const url = new URL(`${supabaseUrl}/rest/v1/shared_lists`)
        const headers = {
            apikey: publicKey, Authorization: authorization,
            'Content-Type': 'application/json'
        }
        if (input.action === 'revoke') {
            url.searchParams.set('user_id', `eq.${user.id}`)
            url.searchParams.set('status', `eq.${input.status}`)
            const response = await fetcher(url, {
                method: 'DELETE', headers, signal: AbortSignal.timeout(5000),
            })
            if (!response.ok) throw new Error('sharing_unavailable')
            return Response.json({ ok: true })
        }
        // Sharing the same list again preserves its active link.
        url.searchParams.set('on_conflict', 'user_id,status')
        const created = await fetcher(url, {
            method: 'POST',
            headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
            body: JSON.stringify({ user_id: user.id, status: input.status }),
            signal: AbortSignal.timeout(5000),
        })
        if (!created.ok) throw new Error('sharing_unavailable')
        url.search = ''
        url.searchParams.set('user_id', `eq.${user.id}`)
        url.searchParams.set('status', `eq.${input.status}`)
        url.searchParams.set('select', 'token')
        url.searchParams.set('limit', '1')
        const response = await fetcher(url, { headers, signal: AbortSignal.timeout(5000) })
        if (!response.ok) throw new Error('sharing_unavailable')
        const rows = await response.json()
        if (!Array.isArray(rows) || rows.length !== 1) throw new Error('sharing_unavailable')
        const { token } = validateSharedList({ token: rows[0].token })
        return Response.json({ token })
    }
}

export function createSharedListHandler({ supabaseUrl, serverKey, apiKey,
    allowedOrigins, consumeQuota, fetcher = fetch }) {
    return async (request) => {
        const origin = request.headers.get('Origin')
        const headers = {
            'Cache-Control': 'no-store', Vary: 'Origin',
            ...(allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
            'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }
        const json = (body, status = 200) => Response.json(body, { status, headers })
        if (origin && !allowedOrigins.includes(origin)) return json({ error: 'origin_not_allowed' }, 403)
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
        if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
        if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
            return json({ error: 'json_required' }, 415)
        }
        let input
        try {
            const raw = await request.text()
            if (raw.length > 4096) return json({ error: 'invalid_request' }, 413)
            input = validateSharedList(JSON.parse(raw))
        } catch {
            return json({ error: 'invalid_request' }, 400)
        }
        if (!serverKey) return json({ error: 'service' }, 503)
        // This public path uses server access only after looking up an unguessable link.
        const databaseHeaders = {
            apikey: serverKey,
            ...(serverKey.startsWith('eyJ') ? { Authorization: `Bearer ${serverKey}` } : {}),
        }
        try {
            const url = new URL(`${supabaseUrl}/rest/v1/shared_lists`)
            url.searchParams.set('token', `eq.${input.token}`)
            url.searchParams.set('select', 'user_id,status')
            url.searchParams.set('limit', '1')
            const linkResponse = await fetcher(url, {
                headers: databaseHeaders, signal: AbortSignal.timeout(5000),
            })
            if (!linkResponse.ok) throw new Error('database_unavailable')
            const links = await linkResponse.json()
            if (!Array.isArray(links)) throw new Error('invalid_response')
            if (!links.length) return json({ error: 'not_found' }, 404)
            const link = links[0]
            if (!link.user_id || !['wishlist', 'visited'].includes(link.status)) throw new Error('invalid_response')
            if (!await consumeQuota(link.user_id)) return json({ error: 'rate_limit' }, 429)
            const rowsUrl = new URL(`${supabaseUrl}/rest/v1/saved_restaurants`)
            // The caller never supplies the owner or list status for this query.
            rowsUrl.searchParams.set('user_id', `eq.${link.user_id}`)
            rowsUrl.searchParams.set('status', `eq.${link.status}`)
            rowsUrl.searchParams.set('select', 'place_id,status')
            rowsUrl.searchParams.set('order', 'created_at.desc,place_id.asc')
            rowsUrl.searchParams.set('offset', String(input.offset))
            rowsUrl.searchParams.set('limit', '6')
            const rowsResponse = await fetcher(rowsUrl, {
                headers: databaseHeaders, signal: AbortSignal.timeout(5000),
            })
            if (!rowsResponse.ok) throw new Error('database_unavailable')
            const rows = await rowsResponse.json()
            if (!Array.isArray(rows)) throw new Error('invalid_response')
            const restaurants = await Promise.all(rows.slice(0, 5).map(async (row) => {
                const place = await loadRestaurantDetails(row, input.language, { apiKey, fetcher })
                // The public response includes only restaurant fields and excludes private account data.
                return {
                    id: place.id, name: place.name, address: place.address,
                    googleMapsUrl: place.googleMapsUrl, attributions: place.attributions
                }
            }))
            return json({ status: link.status, restaurants, hasMore: rows.length > 5 })
        } catch {
            return json({ error: 'service' }, 503)
        }
    }
}
