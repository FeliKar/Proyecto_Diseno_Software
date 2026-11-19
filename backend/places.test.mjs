import assert from 'node:assert/strict'
import { createHandler, selectRestaurants, validateSearch } from './places.mjs'

const input = { latitude: -33.4489, longitude: -70.6693 }

function request(body = input) {
    return new Request('http://localhost:8000/api/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

Deno.test('invalid searches do not reach Google', async () => {
    const handler = createHandler({
        apiKey: 'test', fetcher: () => {
            throw new Error('This request must not reach Google')
        }
    })
    for (const body of [null, {}, { ...input, latitude: 91 },
        { ...input, longitude: '0' }, { ...input, search: 'x'.repeat(81) },
        { ...input, language: 'fr' }, { ...input, category: 'unknown' }]) {
        assert.equal((await handler(request(body))).status, 400)
    }
})

Deno.test('filters before limiting to five and preserves distance order', () => {
    const places = Array.from({ length: 9 }, (_, index) => ({
        id: String(index), displayName: { text: 'Café Jardín' },
        priceLevel: index === 0 ? 'PRICE_LEVEL_EXPENSIVE' : 'PRICE_LEVEL_MODERATE',
    }))
    const filters = validateSearch({ ...input, search: ' CAFE ', priceLevel: 'moderate' })
    const selected = selectRestaurants(places, filters)
    assert.deepEqual(selected.map((place) => place.id), ['1', '2', '3', '4', '5'])
    assert.equal(selected[0].address, null)
    assert.deepEqual(selectRestaurants([], filters), [])
    assert.deepEqual(selectRestaurants([{ ...places[1], businessStatus: 'CLOSED_PERMANENTLY' }], filters), [])
    assert.deepEqual(selectRestaurants([{ id: 'missing', displayName: { text: 'Café' } }], filters), [])
})

Deno.test('sends the filters and keeps the key out of the response', async () => {
    const handler = createHandler({
        apiKey: 'test-secret', fetcher: (_url, options) => {
            const body = JSON.parse(options.body)
            assert.equal(body.locationRestriction.circle.radius, 3000)
            assert.equal(body.maxResultCount, 20)
            assert.equal(body.rankPreference, 'DISTANCE')
            assert.deepEqual(body.includedTypes, ['italian_restaurant'])
            assert.equal(body.languageCode, 'en')
            assert.equal(options.headers['X-Goog-Api-Key'], 'test-secret')
            return Promise.resolve(Response.json({ places: [] }))
        }
    })
    const response = await handler(request({ ...input, category: 'italian', language: 'en' }))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.deepEqual(await response.json(), { restaurants: [], radiusMeters: 3000 })
})

Deno.test('handles missing configuration and provider failures', async () => {
    assert.equal((await createHandler({})(request())).status, 503)
    const unavailable = createHandler({
        apiKey: 'test', fetcher: () =>
            Promise.resolve(new Response('private provider details', { status: 403 }))
    })
    const response = await unavailable(request())
    assert.equal(response.status, 502)
    assert.deepEqual(await response.json(), { error: 'places_unavailable' })
    const timeout = createHandler({
        apiKey: 'test', fetcher: () => {
            throw new DOMException('Timeout', 'TimeoutError')
        }
    })
    assert.equal((await timeout(request())).status, 504)
})

Deno.test('rejects requests from other websites', async () => {
    const req = request()
    req.headers.set('Origin', 'https://another-site.example')
    assert.equal((await createHandler({})(req)).status, 403)
})
