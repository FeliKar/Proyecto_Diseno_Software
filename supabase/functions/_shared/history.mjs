import { validateSearch } from './places.mjs'

export function validatePersonalSearch(input) {
    const filters = validateSearch(input)
    const mode = input.mode ?? 'search'
    if (!['search', 'recommend'].includes(mode)) throw new Error('invalid_search')
    return { ...filters, mode }
}

export function validateHistory(input) {
    if (!input || !['list', 'clear'].includes(input.action)) throw new Error('invalid_request')
    return { action: input.action }
}

// Rows arrive newest first. A tie therefore favors the most recently used value.
export function preferredFilters(rows) {
    function mostFrequent(field) {
        const counts = new Map()
        for (const row of rows) {
            const value = row[field]
            if (value) counts.set(value, (counts.get(value) || 0) + 1)
        }
        return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    }
    return {
        category: mostFrequent('category'),
        priceLevel: mostFrequent('price_level'),
        hasHistory: rows.length > 0,
    }
}

export function createHistoryStore({ supabaseUrl, publicKey, fetcher = fetch }) {
    async function query(context, method, filters) {
        const url = new URL(`${supabaseUrl}/rest/v1/search_history`)
        url.searchParams.set('user_id', `eq.${context.user.id}`)
        if (method === 'GET') {
            url.searchParams.set('select', 'id,category,price_level,created_at')
            url.searchParams.set('order', 'created_at.desc,id.desc')
            url.searchParams.set('limit', '20')
        }
        const response = await fetcher(url, {
            method,
            headers: {
                apikey: publicKey,
                Authorization: context.authorization,
                'Content-Type': 'application/json',
                Prefer: 'return=minimal',
            },
            ...(method === 'POST' ? {
                body: JSON.stringify({
                    user_id: context.user.id,
                    category: filters.category,
                    price_level: filters.priceLevel,
                })
            } : {}),
            signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error('history_unavailable')
        if (method !== 'GET') return
        const rows = await response.json()
        if (!Array.isArray(rows)) throw new Error('invalid_history')
        return rows
    }
    return {
        list: (context) => query(context, 'GET'),
        save: (context, filters) => query(context, 'POST', filters),
        clear: (context) => query(context, 'DELETE'),
    }
}

export function createHistoryHandler(store) {
    return async (request, context) => {
        const { action } = validateHistory(await request.json())
        if (action === 'clear') {
            await store.clear(context)
            return Response.json({ ok: true })
        }
        return Response.json({ history: await store.list(context) })
    }
}

export function createPersonalSearchHandler({ placesHandler, store }) {
    return async (request, context) => {
        const { mode, ...filters } = validatePersonalSearch(await request.json())
        let recommendation = null
        if (mode === 'recommend') {
            // A database failure must not be mistaken for an empty history.
            recommendation = preferredFilters(await store.list(context))
            filters.category = recommendation.category
            filters.priceLevel = recommendation.priceLevel
        }
        const response = await placesHandler(new Request('http://internal/api/restaurants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
        }))
        if (!response.ok) return response
        const data = await response.json()
        let historySaved = null
        if (mode === 'search') {
            try {
                await store.save(context, filters)
                historySaved = true
            } catch {
                // Keep valid search results even if saving history fails.
                historySaved = false
            }
        }
        return Response.json({ ...data, recommendation, historySaved }, {
            headers: { 'Cache-Control': 'no-store' },
        })
    }
}
