import test from 'node:test'
import assert from 'node:assert/strict'
import { savedRequest } from '../src/lib/saved-restaurants.mjs'

const options = { url: 'https://example.supabase.co/functions/v1/saved-restaurants', token: 'session', publishableKey: 'public' }

test('saved requests send the session and validate list and mutation responses', async () => {
    const input = { action: 'list', status: 'wishlist' }
    const result = await savedRequest(input, options, async (url, request) => {
        assert.equal(url, options.url)
        assert.equal(request.headers.Authorization, 'Bearer session')
        assert.deepEqual(JSON.parse(request.body), input)
        return Response.json({ restaurants: [], hasMore: false })
    })
    assert.deepEqual(result, { restaurants: [], hasMore: false })
    assert.deepEqual(await savedRequest({ action: 'remove' }, options,
        async () => Response.json({ ok: true })), { ok: true })
    await assert.rejects(savedRequest(input, options, async () => Response.json({ restaurants: [] })), /service/)
    await assert.rejects(savedRequest({ action: 'save' }, options, async () => Response.json({})), /service/)
})

test('saved requests distinguish expired sessions, quota and network failures', async () => {
    for (const [status, message] of [[401, 'signin'], [429, 'rateLimit'], [503, 'service']]) {
        await assert.rejects(savedRequest({ action: 'list' }, options,
            async () => new Response('', { status })), new RegExp(message))
    }
    await assert.rejects(savedRequest({ action: 'save' }, options,
        async () => { throw new TypeError('network') }), /service/)
})
