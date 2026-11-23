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
        { ...input, longitude: '0' }, { ...input, priceLevel: 'unknown' },
        { ...input, language: 'fr' }, { ...input, category: 'unknown' }]) {
        assert.equal((await handler(request(body))).status, 400)
    }
})

Deno.test('filters before limiting to five and preserves distance order', () => {
    const places = Array.from({ length: 9 }, (_, index) => ({
        id: String(index), displayName: { text: `Restaurant ${index}` },
        priceLevel: index === 0 ? 'PRICE_LEVEL_EXPENSIVE' : 'PRICE_LEVEL_MODERATE',
    }))
    const filters = validateSearch({ ...input, priceLevel: 'moderate' })
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
            const fields = options.headers['X-Goog-FieldMask'].split(',')
            for (const field of ['places.rating', 'places.userRatingCount', 'places.location', 'places.photos']) {
                assert.ok(fields.includes(field))
            }
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


Deno.test('keeps valid ratings and coordinates and handles missing or invalid data', () => {
    const base = { id: 'one', displayName: { text: 'Restaurant' } }
    const filters = validateSearch(input)
    const [valid] = selectRestaurants([{
        ...base, rating: 4.5, userRatingCount: 0, location: { latitude: 0, longitude: 0 },
    }], filters)
    assert.equal(valid.rating, 4.5)
    assert.equal(valid.ratingCount, 0)
    assert.deepEqual(valid.location, { latitude: 0, longitude: 0 })
    for (const fields of [{}, { rating: 7, userRatingCount: -1, location: { latitude: 91, longitude: 0 } },
    { rating: '4.5', userRatingCount: 2.5, location: { latitude: 0 } }]) {
        const [result] = selectRestaurants([{ ...base, ...fields }], filters)
        assert.equal(result.rating, null)
        assert.equal(result.ratingCount, null)
        assert.equal(result.location, null)
    }
})

Deno.test('search loads photos only for the final five restaurants and preserves their order and credits', async () => {
    const photoCalls = []
    const handler = createHandler({
        apiKey: 'private-key', fetcher: (url, options) => {
            if (typeof url === 'string') return Promise.resolve(Response.json({
                places: Array.from({ length: 8 }, (_, index) => ({
                    id: `id_${index}`, displayName: { text: `Restaurant ${index}` },
                    priceLevel: index === 0 ? 'PRICE_LEVEL_EXPENSIVE' : 'PRICE_LEVEL_MODERATE',
                    photos: [{
                        name: `places/id_${index}/photos/image`,
                        authorAttributions: [{ displayName: `Author ${index}`, uri: 'https://maps.google.com/author' }],
                        googleMapsUri: `https://maps.google.com/photo/${index}`
                    }],
                })),
            }))
            photoCalls.push(url.pathname)
            assert.equal(options.headers['X-Goog-Api-Key'], 'private-key')
            assert.equal(url.searchParams.get('maxWidthPx'), '600')
            assert.equal(url.searchParams.get('skipHttpRedirect'), 'true')
            return Promise.resolve(Response.json({ photoUri: `https://lh3.googleusercontent.com/${url.pathname.split('/')[3]}` }))
        }
    })
    const response = await handler(request({ ...input, priceLevel: 'moderate' }))
    const data = await response.json()
    assert.equal(photoCalls.length, 5)
    assert.deepEqual(data.restaurants.map((item) => item.id), ['id_1', 'id_2', 'id_3', 'id_4', 'id_5'])
    assert.equal(data.restaurants[0].photo.authors[0].name, 'Author 1')
    assert.equal(data.restaurants[0].photo.mapsUrl, 'https://maps.google.com/photo/1')
    assert.equal(JSON.stringify(data).includes('private-key'), false)
    assert.equal(JSON.stringify(data).includes('/photos/image'), false)
})

Deno.test('missing, foreign, unsafe and failed photos never discard restaurants', async () => {
    for (const mode of ['missing', 'foreign', 'unsafe', 'failed']) {
        let photoCalls = 0
        const handler = createHandler({
            apiKey: 'private-key', fetcher: (url) => {
                if (typeof url === 'string') return Promise.resolve(Response.json({
                    places: [{
                        id: 'id', displayName: { text: 'Restaurant' },
                        photos: mode === 'missing' ? [] : [{ name: `places/${mode === 'foreign' ? 'other' : 'id'}/photos/image` }],
                    }]
                }))
                photoCalls++
                if (mode === 'failed') throw new Error('photo unavailable')
                return Promise.resolve(Response.json({ photoUri: 'https://evil.test/image' }))
            }
        })
        const response = await handler(request())
        assert.equal(response.status, 200)
        const data = await response.json()
        assert.equal(data.restaurants.length, 1)
        assert.equal(data.restaurants[0].photo, null)
        assert.equal(photoCalls, ['missing', 'foreign'].includes(mode) ? 0 : 1)
    }
})
