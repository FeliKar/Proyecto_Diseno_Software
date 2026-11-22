import test from 'node:test'
import assert from 'node:assert/strict'
import { historyRequest } from '../src/lib/search-history.mjs'
import { searchRestaurants } from '../src/lib/restaurant-search.mjs'

const options = { url: 'https://example.test/history', token: 'session', publishableKey: 'public' }

test('history sends the session and validates list and clear responses', async () => {
    assert.deepEqual(await historyRequest('list', options, (url, req) => {
        assert.equal(url, options.url)
        assert.equal(req.headers.Authorization, 'Bearer session')
        assert.deepEqual(JSON.parse(req.body), { action: 'list' })
        return Promise.resolve(Response.json({ history: [] }))
    }), { history: [] })
    assert.deepEqual(await historyRequest('clear', options, () => Promise.resolve(Response.json({ ok: true }))), { ok: true })
    await assert.rejects(historyRequest('clear', options, () => Promise.resolve(Response.json({}))), /service/)
    await assert.rejects(historyRequest('list', options, () => Promise.resolve(new Response(null, { status: 401 }))), /signin/)
    await assert.rejects(historyRequest('list', options, () => Promise.reject(new Error('network'))), /service/)
})

test('search preserves recommendation explanations and history save warnings', async () => {
    const data = { restaurants: [], recommendation: { category: '', priceLevel: '', hasHistory: false }, historySaved: null }
    assert.deepEqual(await searchRestaurants({ mode: 'recommend' }, (_, req) => {
        assert.equal(JSON.parse(req.body).mode, 'recommend')
        return Promise.resolve(Response.json(data))
    }), data)
    const warning = { restaurants: [{ id: 'place' }], historySaved: false }
    assert.deepEqual(await searchRestaurants({}, () => Promise.resolve(Response.json(warning))), warning)
})
