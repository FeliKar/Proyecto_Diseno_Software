import assert from 'node:assert/strict'
import { validateSearch } from '../supabase/functions/_shared/places.mjs'
import { createPublicHandler } from '../supabase/functions/_shared/public-handler.mjs'

const input = { latitude: -32.922, longitude: -71.5162 }
const origin = 'https://proyectodisenosoftware.vercel.app'
function request({ token = 'valid', body = input, site = origin, method = 'POST' } = {}) {
    return new Request('https://example.supabase.co/functions/v1/restaurants', {
        method,
        headers: {
            Origin: site, 'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
    })
}
function setup(overrides = {}) {
    let calls = 0
    const handler = createPublicHandler({
        allowedOrigins: [origin],
        validateInput: validateSearch,
        verifyUser: () => ({ id: 'user-1' }),
        consumeQuota: () => true,
        placesHandler: () => { calls++; return Response.json({ restaurants: [] }) },
        ...overrides,
    })
    return { handler, calls: () => calls }
}

Deno.test('public search requires a real authenticated user', async () => {
    for (const user of [null, { id: 'anon', is_anonymous: true }]) {
        const app = setup({ verifyUser: () => user })
        assert.equal((await app.handler(request())).status, 401)
        assert.equal(app.calls(), 0)
    }
    const app = setup()
    assert.equal((await app.handler(request({ token: '' }))).status, 401)
    assert.equal(app.calls(), 0)
})

Deno.test('quota denial and quota outage never reach Google', async () => {
    for (const [consumeQuota, status] of [
        [() => false, 429],
        [() => { throw new Error('database unavailable') }, 503],
    ]) {
        const app = setup({ consumeQuota })
        assert.equal((await app.handler(request())).status, status)
        assert.equal(app.calls(), 0)
    }
})

Deno.test('CORS preflight skips auth, other websites cannot call the function', async () => {
    const app = setup({ verifyUser: () => { throw new Error('must not run') } })
    const response = await app.handler(request({ method: 'OPTIONS', token: '' }))
    assert.equal(response.status, 204)
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
    assert.equal((await app.handler(request({ site: 'https://other.example' }))).status, 403)
    assert.equal(app.calls(), 0)
})

Deno.test('valid input consumes the verified user quota and preserves response headers', async () => {
    let counted = ''
    const app = setup({ consumeQuota: (userId) => { counted = userId; return true } })
    assert.equal((await app.handler(request({ body: {} }))).status, 400)
    assert.equal(counted, '')
    const response = await app.handler(request())
    assert.equal(response.status, 200)
    assert.equal(counted, 'user-1')
    assert.equal(app.calls(), 1)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin)
    assert.deepEqual(await response.json(), { restaurants: [] })
})
