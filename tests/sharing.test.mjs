import test from 'node:test'
import assert from 'node:assert/strict'
import { sharingRequest } from '../src/lib/sharing.mjs'

const options = { url: 'https://example.test/shared-list', publishableKey: 'public' }
const token = '123e4567-e89b-42d3-a456-426614174000'

test('shared lists work without a session while management sends the owner session', async () => {
    const data = { restaurants: [], status: 'wishlist', hasMore: false }
    assert.deepEqual(await sharingRequest({ token }, options, (url, req) => {
        assert.equal(url, options.url)
        assert.equal(req.headers.Authorization, undefined)
        assert.equal(req.headers.apikey, 'public')
        assert.deepEqual(JSON.parse(req.body), { token })
        return Promise.resolve(Response.json(data))
    }), data)
    assert.deepEqual(await sharingRequest({ action: 'share', status: 'visited' },
        { ...options, token: 'session' }, (_, req) => {
            assert.equal(req.headers.Authorization, 'Bearer session')
            return Promise.resolve(Response.json({ token }))
        }), { token })
    assert.deepEqual(await sharingRequest({ action: 'revoke' }, options,
        () => Promise.resolve(Response.json({ ok: true }))), { ok: true })
})

test('invalid links, rate limits and provider errors have distinct safe messages', async () => {
    for (const [status, error] of [[400, 'notFound'], [404, 'notFound'], [429, 'rateLimit'], [503, 'service'], [401, 'signin']]) {
        await assert.rejects(sharingRequest({ token }, options,
            () => Promise.resolve(new Response(null, { status }))), new RegExp(error))
    }
    await assert.rejects(sharingRequest({ action: 'share' }, options,
        () => Promise.resolve(Response.json({ token: '../bad' }))), /service/)
    await assert.rejects(sharingRequest({ token }, options,
        () => Promise.resolve(Response.json({ restaurants: [] }))), /service/)
})
