import test from 'node:test'
import assert from 'node:assert/strict'
import { requestDetails } from '../src/lib/restaurant-details.mjs'

const input = { placeId: 'id1', language: 'en', photoIndex: 1 }
const options = { url: 'https://example.test/details', token: 'session', publishableKey: 'public' }

test('details sends the user session and accepts missing optional provider data', async () => {
    const data = {
        name: 'Restaurant', reviews: [], attributions: [], photo: null,
        photoCount: 0, photoIndex: 0, reviewSummary: null
    }
    assert.deepEqual(await requestDetails(input, options, (url, req) => {
        assert.equal(url, options.url)
        assert.equal(req.headers.Authorization, 'Bearer session')
        assert.equal(req.headers.apikey, 'public')
        assert.deepEqual(JSON.parse(req.body), input)
        return Promise.resolve(Response.json(data))
    }), data)
})

test('details distinguish expired sessions, quota limits, removed places and provider failures', async () => {
    for (const [status, error] of [[401, 'signin'], [429, 'rateLimit'], [404, 'notFound'], [504, 'timeout'], [502, 'service']]) {
        await assert.rejects(requestDetails(input, options,
            () => Promise.resolve(new Response(null, { status }))), new RegExp(error))
    }
    await assert.rejects(requestDetails(input, options,
        () => Promise.resolve(Response.json({ reviews: [] }))), /service/)
    await assert.rejects(requestDetails(input, options,
        () => { throw new TypeError('network') }), /service/)
})

test('gallery accepts five photos and rejects malformed or oversized collections', async () => {
    const photo = { uri: 'https://lh3.googleusercontent.com/photo', authors: [], mapsUrl: null }
    const data = {
        name: 'Restaurant', reviews: [], attributions: [], photoCount: 5,
        photos: Array.from({ length: 5 }, () => photo)
    }
    assert.equal((await requestDetails({ ...input, gallery: true }, options,
        () => Promise.resolve(Response.json(data)))).photos.length, 5)
    for (const photos of [null, [null], [{ uri: photo.uri }], Array.from({ length: 6 }, () => photo)]) {
        await assert.rejects(requestDetails(input, options,
            () => Promise.resolve(Response.json({ ...data, photos }))), /service/)
    }
})
