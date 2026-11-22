import assert from 'node:assert/strict'
import {
    createSharingHandler, createSharedListHandler, validateSharing,
    validateSharedList
} from '../supabase/functions/_shared/sharing.mjs'
import { createPublicHandler } from '../supabase/functions/_shared/public-handler.mjs'

const token = '123e4567-e89b-42d3-a456-426614174000'
const config = { supabaseUrl: 'https://example.supabase.co', publicKey: 'public-key' }
const context = { user: { id: 'owner-a' }, authorization: 'Bearer session-a' }
const req = (input = { token }, method = 'POST', origin) => new Request('https://example.test/shared-list', {
    method,
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify(input) } : {}),
})

Deno.test('sharing validates actions and tokens and drops client supplied owner information', () => {
    for (const body of [null, [], {}, { action: 'edit', status: 'visited' }, { action: 'share', status: 'other' }]) {
        assert.throws(() => validateSharing(body))
    }
    assert.deepEqual(validateSharing({ action: 'share', status: 'visited', user_id: 'victim' }), {
        action: 'share', status: 'visited',
    })
    for (const body of [{ token: '../secret' }, { token, offset: -1 }, { token, language: 'xx' }, { token, offset: 0.5 }]) {
        assert.throws(() => validateSharedList(body))
    }
    assert.deepEqual(validateSharedList({ token, user_id: 'victim', status: 'wishlist' }), { token, offset: 0, language: 'es' })
})

Deno.test('creating and revoking links use the verified owner and caller database permissions', async () => {
    const calls = []
    const handler = createSharingHandler({
        ...config, fetcher: (url, options) => {
            calls.push({ url, options })
            assert.equal(options.headers.Authorization, context.authorization)
            assert.equal(options.headers.apikey, 'public-key')
            return Promise.resolve(options.method === 'POST' || options.method === 'DELETE'
                ? new Response(null, { status: 204 }) : Response.json([{ token }]))
        }
    })
    const body = { action: 'share', status: 'visited', user_id: 'victim' }
    assert.deepEqual(await (await handler(req(body), context)).json(), { token })
    assert.deepEqual(JSON.parse(calls[0].options.body), { user_id: 'owner-a', status: 'visited' })
    assert.equal(calls[0].options.headers.Prefer, 'resolution=ignore-duplicates,return=minimal')
    assert.equal(calls[1].url.searchParams.get('user_id'), 'eq.owner-a')
    assert.equal(calls[1].url.searchParams.get('status'), 'eq.visited')
    assert.deepEqual(await (await handler(req({ action: 'revoke', status: 'wishlist' }), context)).json(), { ok: true })
    assert.equal(calls[2].options.method, 'DELETE')
    assert.equal(calls[2].url.searchParams.get('user_id'), 'eq.owner-a')
    assert.equal(calls[2].url.searchParams.get('status'), 'eq.wishlist')
})

Deno.test('link management requires a real user session', async () => {
    const handler = createPublicHandler({
        allowedOrigins: [], validateInput: validateSharing,
        verifyUser: () => null, consumeQuota: () => true,
        placesHandler: () => { throw new Error('must not run') },
    })
    assert.equal((await handler(req({ action: 'share', status: 'visited' }))).status, 401)
    const unauthorized = req({ action: 'revoke', status: 'visited' })
    unauthorized.headers.set('Authorization', 'Bearer bad-session')
    assert.equal((await handler(unauthorized)).status, 401)
})

function publicApp({ active = true, quota = () => true, fetcher } = {}) {
    let googleCalls = 0
    let databaseCalls = 0
    const handler = createSharedListHandler({
        ...config, serverKey: 'server-secret', apiKey: 'google-secret', allowedOrigins: [],
        consumeQuota: (owner) => { assert.equal(owner, 'owner-a'); return quota() },
        fetcher: fetcher || ((url, options) => {
            if (url.hostname === 'example.supabase.co') {
                databaseCalls++
                assert.equal(options.headers.apikey, 'server-secret')
                if (url.pathname.endsWith('shared_lists')) {
                    assert.equal(url.searchParams.get('token'), `eq.${token}`)
                    return Promise.resolve(Response.json(active ? [{ user_id: 'owner-a', status: 'visited' }] : []))
                }
                assert.equal(url.searchParams.get('user_id'), 'eq.owner-a')
                assert.equal(url.searchParams.get('status'), 'eq.visited')
                assert.equal(url.searchParams.get('select'), 'place_id,status')
                assert.equal(url.searchParams.get('limit'), '6')
                return Promise.resolve(Response.json(Array.from({ length: 6 }, (_, i) => ({
                    place_id: `id${i}`, status: 'visited', user_rating: 5,
                }))))
            }
            googleCalls++
            assert.equal(options.headers['X-Goog-Api-Key'], 'google-secret')
            assert.equal(url.searchParams.get('languageCode'), 'en')
            return Promise.resolve(url.pathname.endsWith('id0')
                ? new Response(null, { status: 404 })
                : Response.json({ displayName: { text: 'Restaurant' } }))
        }),
    })
    return { handler, googleCalls: () => googleCalls, databaseCalls: () => databaseCalls }
}

Deno.test('public links reveal at most five restaurants and never expose owner or personal fields', async () => {
    const app = publicApp()
    const response = await app.handler(req({ token, language: 'en', user_id: 'victim', status: 'wishlist' }))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    const data = await response.json()
    assert.equal(data.status, 'visited')
    assert.equal(data.hasMore, true)
    assert.equal(data.restaurants.length, 5)
    assert.equal(data.restaurants[0].name, null)
    assert.equal(data.restaurants[1].name, 'Restaurant')
    assert.deepEqual(Object.keys(data.restaurants[0]).sort(), ['address', 'attributions', 'googleMapsUrl', 'id', 'name'])
    assert.equal(app.googleCalls(), 5)
    for (const secret of ['server-secret', 'google-secret', 'owner-a', 'user_rating', 'userRating', token]) {
        assert.equal(JSON.stringify(data).includes(secret), false)
    }
})

Deno.test('invalid or revoked tokens cannot reach saved restaurants or Google', async () => {
    const app = publicApp({ active: false, quota: () => { throw new Error('must not run') } })
    assert.equal((await app.handler(req({ token: 'invalid' }))).status, 400)
    assert.equal(app.databaseCalls(), 0)
    assert.equal((await app.handler(req())).status, 404)
    assert.equal(app.databaseCalls(), 1)
    assert.equal(app.googleCalls(), 0)
})

Deno.test('public quota limits and quota failures stop all Google calls', async () => {
    for (const [quota, status] of [[() => false, 429], [() => { throw new Error('unavailable') }, 503]]) {
        const app = publicApp({ quota })
        assert.equal((await app.handler(req())).status, status)
        assert.equal(app.databaseCalls(), 1)
        assert.equal(app.googleCalls(), 0)
    }
})

Deno.test('public endpoint rejects writes and unapproved origins, preflight skips database access', async () => {
    const app = publicApp()
    assert.equal((await app.handler(req({}, 'OPTIONS'))).status, 204)
    assert.equal((await app.handler(req({}, 'DELETE'))).status, 405)
    assert.equal((await app.handler(req({ token }, 'POST', 'https://other.test'))).status, 403)
    assert.equal(app.databaseCalls(), 0)
    const bad = new Request('https://example.test', { method: 'POST', body: '{}' })
    assert.equal((await app.handler(bad)).status, 415)
})

Deno.test('database failures are sanitized and empty lists do not call Google', async () => {
    const failed = publicApp({ fetcher: () => Promise.resolve(new Response('private database error', { status: 500 })) })
    const response = await failed.handler(req())
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: 'service' })
    const app = publicApp({
        fetcher: (url) => {
            assert.equal(url.hostname, 'example.supabase.co')
            return Promise.resolve(Response.json(url.pathname.endsWith('shared_lists')
                ? [{ user_id: 'owner-a', status: 'wishlist' }] : []))
        }
    })
    assert.deepEqual(await (await app.handler(req())).json(), { status: 'wishlist', restaurants: [], hasMore: false })
})
