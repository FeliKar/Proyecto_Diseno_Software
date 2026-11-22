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

// Positive scores identify preferences. Recent searches win ties, then saved-list order.
export function preferredFilters(rows, ratings = []) {
    function preferred(searchField, ratingField) {
        const scores = new Map()
        function add(value, weight) {
            if (value) scores.set(value, (scores.get(value) || 0) + weight)
        }
        for (const row of rows) add(row[searchField], 1)
        for (const row of ratings) add(row[ratingField], row.user_rating - 3)
        return [...scores].filter(([, score]) => score > 0)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || ''
    }
    return {
        category: preferred('category', 'user_category'),
        priceLevel: preferred('price_level', 'user_price_level'),
        hasHistory: rows.length > 0,
        hasRatings: ratings.length > 0,
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
    async function ratings(context) {
        const url = new URL(`${supabaseUrl}/rest/v1/saved_restaurants`)
        url.searchParams.set('user_id', `eq.${context.user.id}`)
        url.searchParams.set('status', 'eq.visited')
        url.searchParams.set('user_rating', 'not.is.null')
        url.searchParams.set('select', 'user_rating,user_category,user_price_level')
        url.searchParams.set('order', 'created_at.desc,place_id.asc')
        url.searchParams.set('limit', '20')
        const response = await fetcher(url, {
            headers: { apikey: publicKey, Authorization: context.authorization },
            signal: AbortSignal.timeout(5000),
        })
        if (!response.ok) throw new Error('ratings_unavailable')
        const rows = await response.json()
        if (!Array.isArray(rows)) throw new Error('invalid_ratings')
        return rows
    }
    return {
        ratings,
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
            const [history, ratings] = await Promise.all([
                store.list(context), store.ratings(context),
            ])
            recommendation = preferredFilters(history, ratings)
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
