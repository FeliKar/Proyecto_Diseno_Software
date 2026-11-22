import assert from 'node:assert/strict'
import { createSavedHandler, validateSavedRequest } from '../supabase/functions/_shared/saved-restaurants.mjs'
import { createPublicHandler } from '../supabase/functions/_shared/public-handler.mjs'

const context = { user: { id: 'user-a' }, authorization: 'Bearer caller-session' }
const request = (body) => new Request('http://internal/api/restaurants', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const config = { supabaseUrl: 'https://example.supabase.co', publicKey: 'public-key', apiKey: 'private-key' }

Deno.test('list validation rejects invalid operations and ignores supplied user identities', () => {
    for (const input of [null, [], {}, { action: 'list', status: 'other' },
        { action: 'list', status: 'visited', offset: -1 },
        { action: 'list', status: 'visited', language: 'xx' },
        { action: 'save', status: 'visited', placeId: '../secret' },
        { action: 'remove', placeId: '' }]) {
        assert.throws(() => validateSavedRequest(input))
    }
    assert.deepEqual(validateSavedRequest({ action: 'save', status: 'visited', placeId: 'ChIJ_1', user_id: 'victim' }),
        { action: 'save', status: 'visited', placeId: 'ChIJ_1' })
})

Deno.test('saving and removing use verified identity and caller RLS token without calling Google', async () => {
    const calls = []
    const handler = createSavedHandler({
        ...config, fetcher: (url, options) => {
            assert.equal(url.hostname, 'example.supabase.co')
            assert.equal(options.headers.Authorization, context.authorization)
            assert.equal(options.headers.apikey, 'public-key')
            calls.push({ url, options })
            return Promise.resolve(new Response(null, { status: 204 }))
        }
    })
    assert.equal((await handler(request({ action: 'save', status: 'wishlist', placeId: 'ChIJ_1', user_id: 'victim' }), context)).status, 200)
    assert.deepEqual(JSON.parse(calls[0].options.body), { user_id: 'user-a', place_id: 'ChIJ_1', status: 'wishlist' })
    assert.equal(calls[0].url.searchParams.get('on_conflict'), 'user_id,place_id')
    await handler(request({ action: 'remove', placeId: 'ChIJ_1' }), context)
    assert.equal(calls[1].options.method, 'DELETE')
    assert.equal(calls[1].url.searchParams.get('user_id'), 'eq.user-a')
    assert.equal(calls[1].url.searchParams.get('place_id'), 'eq.ChIJ_1')
})

Deno.test('lists load five details at most and keep entries if Google fails', async () => {
    let googleCalls = 0
    const handler = createSavedHandler({
        ...config, fetcher: (url, options) => {
            if (url.hostname === 'example.supabase.co') {
                assert.equal(url.searchParams.get('user_id'), 'eq.user-a')
                assert.equal(url.searchParams.get('status'), 'eq.wishlist')
                assert.equal(url.searchParams.get('offset'), '5')
                assert.equal(url.searchParams.get('limit'), '6')
                return Promise.resolve(Response.json(Array.from({ length: 6 }, (_, i) => ({ place_id: `id${i}`, status: 'wishlist' }))))
            }
            googleCalls++
            assert.equal(url.searchParams.get('languageCode'), 'en')
            assert.equal(options.headers['X-Goog-Api-Key'], 'private-key')
            return Promise.resolve(url.pathname.endsWith('id0')
                ? new Response('', { status: 404 })
                : Response.json({ displayName: { text: 'Restaurant' }, formattedAddress: 'Address' }))
        }
    })
    const response = await handler(request({ action: 'list', status: 'wishlist', offset: 5, language: 'en' }), context)
    const data = await response.json()
    assert.equal(googleCalls, 5)
    assert.equal(data.hasMore, true)
    assert.equal(data.restaurants.length, 5)
    assert.equal(data.restaurants[0].id, 'id0')
    assert.equal(data.restaurants[0].name, null)
    assert.equal(data.restaurants[1].name, 'Restaurant')
    assert.equal(JSON.stringify(data).includes('private-key'), false)
})

Deno.test('empty lists never call Google and database failures never report success', async () => {
    const handler = createSavedHandler({
        ...config, fetcher: (url) => {
            assert.equal(url.hostname, 'example.supabase.co')
            return Promise.resolve(Response.json([]))
        }
    })
    assert.deepEqual(await (await handler(request({ action: 'list', status: 'visited' }), context)).json(),
        { restaurants: [], hasMore: false })
    const failed = createSavedHandler({ ...config, fetcher: () => Promise.resolve(new Response('private details', { status: 500 })) })
    const response = await failed(request({ action: 'remove', placeId: 'id1' }), context)
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'service' })
})

Deno.test('public wrapper validates list requests and forwards verified context', async () => {
    let reached = false
    const handler = createPublicHandler({
        allowedOrigins: [], validateInput: validateSavedRequest,
        verifyUser: () => context.user,
        consumeQuota: (_id, input) => input.action === 'save',
        placesHandler: (_request, verified) => {
            reached = true
            assert.deepEqual(verified, context)
            return Response.json({ ok: true })
        },
    })
    const req = request({ action: 'save', status: 'visited', placeId: 'id1' })
    req.headers.set('Authorization', context.authorization)
    assert.equal((await handler(req)).status, 200)
    assert.equal(reached, true)
    reached = false
    const limited = request({ action: 'list', status: 'visited' })
    limited.headers.set('Authorization', context.authorization)
    assert.equal((await handler(limited)).status, 429)
    assert.equal(reached, false)
})
