import assert from 'node:assert/strict'
import {
    preferredFilters, validatePersonalSearch, validateHistory, createHistoryStore,
    createPersonalSearchHandler, createHistoryHandler,
} from '../supabase/functions/_shared/history.mjs'
import { createPublicHandler } from '../supabase/functions/_shared/public-handler.mjs'

const context = { user: { id: 'user-a' }, authorization: 'Bearer session-a' }
const filters = { latitude: -32.92, longitude: -71.51, category: 'seafood', priceLevel: 'expensive', language: 'en' }
const request = (body) => new Request('http://internal/api/restaurants', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})

Deno.test('preferences handle empty history, no filters, frequencies and recent ties', () => {
    assert.deepEqual(preferredFilters([]), { category: '', priceLevel: '', hasHistory: false })
    assert.deepEqual(preferredFilters([{ category: '', price_level: '' }]), {
        category: '', priceLevel: '', hasHistory: true,
    })
    assert.deepEqual(preferredFilters([
        { category: 'seafood', price_level: 'moderate' },
        { category: 'italian', price_level: 'inexpensive' },
        { category: 'italian', price_level: '' },
    ]), { category: 'italian', priceLevel: 'moderate', hasHistory: true })
})

Deno.test('validation rejects invalid modes and does not accept user identity from the body', () => {
    assert.throws(() => validatePersonalSearch({ ...filters, mode: 'other' }))
    assert.throws(() => validatePersonalSearch({ ...filters, latitude: 100 }))
    assert.equal(validatePersonalSearch(filters).mode, 'search')
    assert.equal(validatePersonalSearch({ ...filters, user_id: 'user-b' }).user_id, undefined)
    assert.deepEqual(validateHistory({ action: 'clear', user_id: 'user-b' }), { action: 'clear' })
    for (const input of [null, {}, { action: 'save' }]) assert.throws(() => validateHistory(input))
})

Deno.test('history store uses caller permissions and verified identity for list, insert and delete', async () => {
    const calls = []
    const store = createHistoryStore({
        supabaseUrl: 'https://example.supabase.co', publicKey: 'public',
        fetcher: (url, options) => {
            calls.push({ url, ...options })
            return Promise.resolve(options.method === 'GET' ? Response.json([]) : new Response(null, { status: 204 }))
        },
    })
    await store.list(context)
    await store.save(context, { ...filters, user_id: 'user-b' })
    await store.clear(context)
    for (const call of calls) {
        assert.equal(call.url.searchParams.get('user_id'), 'eq.user-a')
        assert.equal(call.headers.Authorization, 'Bearer session-a')
        assert.equal(call.headers.apikey, 'public')
    }
    assert.equal(calls[0].url.searchParams.get('limit'), '20')
    assert.equal(calls[0].url.searchParams.get('order'), 'created_at.desc,id.desc')
    assert.deepEqual(JSON.parse(calls[1].body), {
        user_id: 'user-a', category: 'seafood', price_level: 'expensive',
    })
    assert.equal(calls[2].method, 'DELETE')
    const failing = createHistoryStore({
        supabaseUrl: 'https://example.test', publicKey: 'public',
        fetcher: () => Promise.resolve(new Response(null, { status: 500 }))
    })
    await assert.rejects(failing.list(context), /history_unavailable/)
})

Deno.test('successful searches including empty results save filters; failed searches do not', async () => {
    let saved = 0
    const store = {
        save: (received, input) => {
            assert.equal(received, context)
            assert.equal(input.category, 'seafood')
            saved++
        }
    }
    const handler = createPersonalSearchHandler({
        store,
        placesHandler: () => Response.json({ restaurants: [] })
    })
    const data = await (await handler(request(filters), context)).json()
    assert.equal(data.historySaved, true)
    assert.equal(data.recommendation, null)
    assert.equal(saved, 1)
    const failing = createPersonalSearchHandler({
        store,
        placesHandler: () => Response.json({ error: 'provider' }, { status: 502 })
    })
    assert.equal((await failing(request(filters), context)).status, 502)
    assert.equal(saved, 1)
    const unavailable = createPersonalSearchHandler({
        store: { save: () => { throw new Error('database') } },
        placesHandler: () => Response.json({ restaurants: [{ id: 'place' }] }),
    })
    const result = await (await unavailable(request(filters), context)).json()
    assert.equal(result.historySaved, false)
    assert.equal(result.restaurants[0].id, 'place')
})

Deno.test('recommendations use history but preserve location and language, without feeding themselves', async () => {
    let received
    const handler = createPersonalSearchHandler({
        store: {
            list: () => [{ category: 'italian', price_level: 'moderate' }],
            save: () => { throw new Error('recommendations must not change preferences') },
        },
        placesHandler: async (req) => {
            received = await req.json()
            return Response.json({ restaurants: [] })
        },
    })
    const result = await (await handler(request({ ...filters, mode: 'recommend' }), context)).json()
    assert.deepEqual(received, { ...filters, category: 'italian', priceLevel: 'moderate' })
    assert.equal(result.recommendation.hasHistory, true)
    assert.equal(result.historySaved, null)
    const empty = createPersonalSearchHandler({
        store: { list: () => [] },
        placesHandler: async (req) => {
            const input = await req.json()
            assert.equal(input.category, '')
            assert.equal(input.priceLevel, '')
            return Response.json({ restaurants: [] })
        }
    })
    const data = await (await empty(request({ ...filters, mode: 'recommend' }), context)).json()
    assert.equal(data.recommendation.hasHistory, false)
    const failed = createPersonalSearchHandler({
        store: { list: () => { throw new Error('database') } },
        placesHandler: () => { throw new Error('Google must not run') },
    })
    await assert.rejects(failed(request({ ...filters, mode: 'recommend' }), context), /database/)
})

Deno.test('history endpoint enforces authentication and only clears verified user history', async () => {
    let cleared = null
    const handler = createPublicHandler({
        verifyUser: (token) => token === context.authorization ? context.user : null,
        allowedOrigins: [], validateInput: validateHistory, consumeQuota: () => true,
        placesHandler: createHistoryHandler({
            list: () => [], clear: (received) => { cleared = received.user.id },
        }),
    })
    assert.equal((await handler(request({ action: 'list' }))).status, 401)
    const authorized = request({ action: 'clear', user_id: 'user-b' })
    authorized.headers.set('Authorization', context.authorization)
    assert.deepEqual(await (await handler(authorized)).json(), { ok: true })
    assert.equal(cleared, 'user-a')
})
