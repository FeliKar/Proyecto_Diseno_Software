import test from 'node:test'
import assert from 'node:assert/strict'
import { getLocation, safeLink, searchRestaurants } from '../src/lib/restaurant-search.mjs'

test('handles location success, unavailable browsers and denied permission', async () => {
    await assert.rejects(getLocation(null), /unsupported/)
    await assert.rejects(getLocation({ getCurrentPosition: (_ok, fail) => fail({ code: 1 }) }), /denied/)
    assert.deepEqual(await getLocation({
        getCurrentPosition: (ok) =>
            ok({ coords: { latitude: 10, longitude: 20, accuracy: 30 } })
    }), { latitude: 10, longitude: 20 })
})

test('sends filters to the backend and accepts empty results', async () => {
    const filters = { latitude: 10, longitude: 20, search: 'cafe', language: 'en' }
    const results = await searchRestaurants(filters, async (url, options) => {
        assert.equal(url, '/api/restaurants')
        assert.equal(options.method, 'POST')
        assert.deepEqual(JSON.parse(options.body), filters)
        return Response.json({ restaurants: [] })
    })
    assert.deepEqual(results, [])
})

test('handles provider failures, timeouts and unexpected responses', async () => {
    await assert.rejects(searchRestaurants({}, async () => new Response('', { status: 502 })), /service/)
    await assert.rejects(searchRestaurants({}, async () => new Response('', { status: 504 })), /timeout/)
    await assert.rejects(searchRestaurants({}, async () => Response.json({})), /service/)
    await assert.rejects(searchRestaurants({}, async () => { throw new TypeError('network') }), /service/)
})

test('only exposes valid HTTPS links', () => {
    assert.equal(safeLink('javascript:alert(1)'), undefined)
    assert.equal(safeLink(null), undefined)
    assert.equal(safeLink('https://maps.google.com/'), 'https://maps.google.com/')
})


test('rejects imprecise positions before a restaurant search', async () => {
    for (const accuracy of [1001, 25000, 1450128, undefined]) {
        await assert.rejects(getLocation({
            getCurrentPosition: (ok) => ok({ coords: { latitude: 10, longitude: 20, accuracy } }),
        }), /imprecise/)
    }
    assert.deepEqual(await getLocation({
        getCurrentPosition: (ok) => ok({ coords: { latitude: 10, longitude: 20, accuracy: 1000 } }),
    }), { latitude: 10, longitude: 20 })
})
