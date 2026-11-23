import assert from 'node:assert/strict'
import { createDetailsHandler, selectDetails, validateDetails } from '../supabase/functions/_shared/restaurant-details.mjs'
import { createPublicHandler } from '../supabase/functions/_shared/public-handler.mjs'

const input = { placeId: 'ChIJ_1', language: 'es' }
const request = (body = input) => new Request('http://internal/api/restaurants', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
})
const review = (rating) => ({
    rating, text: { text: 'A review' },
    authorAttribution: { displayName: 'Author', uri: 'https://maps.google.com/profile', photoUri: 'https://lh3.googleusercontent.com/avatar' },
    googleMapsUri: 'https://maps.google.com/review', publishTime: '2026-11-20T12:00:00Z',
})
const summary = {
    text: { text: 'A provider summary' }, disclosureText: { text: 'Summarized with Gemini' },
    reviewsUri: 'https://maps.google.com/reviews', flagContentUri: 'https://google.com/report'
}
const place = {
    displayName: { text: 'Restaurant' }, rating: 4.6, userRatingCount: 100,
    reviews: [review(5), review(4), review(3), review(2), review(1)], reviewSummary: summary,
    googleMapsUri: 'https://maps.google.com/place'
}

Deno.test('details validation rejects invalid identifiers, language and photo indices', () => {
    for (const body of [null, [], {}, { placeId: '../secret' }, { placeId: 'id', language: 'xx' },
        { placeId: 'id', photoIndex: -1 }, { placeId: 'id', photoIndex: 5 }, { placeId: 'id', gallery: 'yes' }, { placeId: 'id', photoIndex: 0.5 }]) {
        assert.throws(() => validateDetails(body))
    }
    assert.deepEqual(validateDetails({ ...input, apiKey: 'injected', user_id: 'victim' }), { ...input, photoIndex: 0, gallery: false })
})

Deno.test('details preserve provider summary disclosure and authors and count only the supplied sample', () => {
    const data = selectDetails({ ...place, reviews: [...place.reviews, review(5)] })
    assert.equal(data.reviews.length, 5)
    assert.equal(data.reviews[0].author.name, 'Author')
    assert.equal(data.reviewSummary.text, summary.text.text)
    assert.equal(data.reviewSummary.disclosure, summary.disclosureText.text)
    assert.equal(data.reviewSummary.reportUrl, summary.flagContentUri)
    assert.deepEqual(data.sampleRatings, { high: 2, middle: 1, low: 2 })
    assert.equal(data.ratingCount, 100)
})

Deno.test('missing data and invalid review links are handled without invented content', () => {
    const data = selectDetails({
        displayName: { text: 'Restaurant' }, rating: 6, userRatingCount: -2,
        reviews: [{
            ...review(5), text: {}, originalText: { text: 'Original' },
            googleMapsUri: 'javascript:alert(1)', authorAttribution: { displayName: 'Author', uri: 'http://unsafe.test' },
            visitDate: { year: 2026, month: 11 }, publishTime: 'invalid'
        }, review(9)]
    })
    assert.equal(data.rating, null)
    assert.equal(data.ratingCount, null)
    assert.equal(data.reviewSummary, null)
    assert.equal(data.reviews.length, 1)
    assert.equal(data.reviews[0].mapsUrl, null)
    assert.equal(data.reviews[0].author.uri, null)
    assert.equal(data.reviews[0].originalText, 'Original')
    assert.equal(data.reviews[0].published, null)
    assert.equal(data.reviews[0].visitDate, '2026-11')
    assert.equal(selectDetails({ reviewSummary: { text: { text: 'No disclosure or source' } } }).reviewSummary, null)
    assert.deepEqual(selectDetails({}).reviews, [])
})

Deno.test('photo lookup uses fresh provider references and never reveals the API key', async () => {
    const calls = []
    const handler = createDetailsHandler({
        apiKey: 'private-key', fetcher: (url, options) => {
            calls.push(url)
            assert.equal(options.headers['X-Goog-Api-Key'], 'private-key')
            if (url.pathname.endsWith('/media')) {
                assert.equal(url.pathname, '/v1/places/ChIJ_1/photos/photo_2/media')
                assert.equal(url.searchParams.get('maxWidthPx'), '900')
                assert.equal(url.searchParams.get('skipHttpRedirect'), 'true')
                return Promise.resolve(Response.json({ photoUri: 'https://lh3.googleusercontent.com/image' }))
            }
            assert.equal(url.searchParams.get('languageCode'), 'es')
            assert.equal(options.headers['X-Goog-FieldMask'].includes('reviews'), true)
            return Promise.resolve(Response.json({
                ...place, photos: [
                    { name: 'places/ChIJ_1/photos/photo_1' },
                    {
                        name: 'places/ChIJ_1/photos/photo_2', authorAttributions: [{ displayName: 'Photographer', uri: 'https://maps.google.com/author' }],
                        googleMapsUri: 'https://maps.google.com/photo'
                    },
                ]
            }))
        }
    })
    const response = await handler(request({ ...input, photoIndex: 1 }))
    const data = await response.json()
    assert.equal(response.headers.get('Cache-Control'), 'no-store')
    assert.equal(data.photoCount, 2)
    assert.equal(data.photoIndex, 1)
    assert.equal(data.photo.uri, 'https://lh3.googleusercontent.com/image')
    assert.equal(data.photo.authors[0].name, 'Photographer')
    assert.equal(JSON.stringify(data).includes('private-key'), false)
    assert.equal(JSON.stringify(data).includes('photo_2'), false)
    assert.equal(calls.length, 2)
})

Deno.test('failed or unsafe photos never hide reviews and photos from other places are ignored', async () => {
    for (const uri of ['http://unsafe.test/image', 'https://evil.test/image', 'https://lh3.googleusercontent.com/private-key']) {
        const handler = createDetailsHandler({
            apiKey: 'private-key', fetcher: (url) => Promise.resolve(Response.json(
                url.pathname.endsWith('/media') ? { photoUri: uri }
                    : { ...place, photos: [{ name: 'places/ChIJ_1/photos/photo' }] }))
        })
        const data = await (await handler(request())).json()
        assert.equal(data.photo, null)
        assert.equal(data.reviews.length, 5)
    }
    const failedPhoto = createDetailsHandler({
        apiKey: 'private-key', fetcher: (url) => {
            if (url.pathname.endsWith('/media')) throw new Error('photo unavailable')
            return Promise.resolve(Response.json({ ...place, photos: [{ name: 'places/ChIJ_1/photos/photo' }] }))
        }
    })
    assert.equal((await (await failedPhoto(request())).json()).reviewSummary.text, summary.text.text)
    const noPhoto = createDetailsHandler({
        apiKey: 'private-key', fetcher: (url) => {
            assert.equal(url.pathname.endsWith('/media'), false)
            return Promise.resolve(Response.json({ ...place, photos: [{ name: 'places/OTHER/photos/photo' }] }))
        }
    })
    assert.equal((await (await noPhoto(request())).json()).photoCount, 0)
})

Deno.test('removed places, absent configuration and provider failures return safe errors', async () => {
    assert.equal((await createDetailsHandler({ apiKey: '' })(request())).status, 503)
    for (const [status, expected] of [[404, 404], [403, 502]]) {
        const handler = createDetailsHandler({
            apiKey: 'private-key',
            fetcher: () => Promise.resolve(new Response('private provider error', { status }))
        })
        const response = await handler(request())
        assert.equal(response.status, expected)
        assert.equal((await response.text()).includes('private'), false)
    }
    const malformed = createDetailsHandler({ apiKey: 'private-key', fetcher: () => Promise.resolve(Response.json([])) })
    assert.equal((await malformed(request())).status, 502)
})

Deno.test('details wrapper requires a real session and quota before consulting Google', async () => {
    let calls = 0
    const app = createPublicHandler({
        allowedOrigins: [], validateInput: validateDetails,
        verifyUser: () => ({ id: 'owner-a' }), consumeQuota: () => false,
        placesHandler: () => { calls++; return Response.json({}) }
    })
    assert.equal((await app(request())).status, 401)
    const req = request()
    req.headers.set('Authorization', 'Bearer session')
    assert.equal((await app(req)).status, 429)
    assert.equal(calls, 0)
})

Deno.test('gallery resolves at most five photos and preserves successful photos when another fails', async () => {
    const calls = []
    const handler = createDetailsHandler({
        apiKey: 'private-key', fetcher: (url) => {
            calls.push(url.pathname)
            if (!url.pathname.endsWith('/media')) return Promise.resolve(Response.json({
                ...place,
                photos: Array.from({ length: 7 }, (_, i) => ({
                    name: `places/ChIJ_1/photos/photo_${i}`, authorAttributions: [{ displayName: `Author ${i}` }],
                    googleMapsUri: `https://maps.google.com/photo/${i}`,
                })),
            }))
            if (url.pathname.includes('photo_1/')) return Promise.resolve(new Response(null, { status: 500 }))
            return Promise.resolve(Response.json({ photoUri: `https://lh3.googleusercontent.com/${url.pathname.split('/').at(-2)}` }))
        }
    })
    const data = await (await handler(request({ ...input, gallery: true }))).json()
    assert.equal(calls.length, 6)
    assert.equal(calls.some((path) => path.includes('photo_5')), false)
    assert.equal(data.photos.length, 4)
    assert.equal(data.photoCount, 4)
    assert.equal(data.photos[0].authors[0].name, 'Author 0')
    assert.equal(data.photos[1].authors[0].name, 'Author 2')
    assert.equal(data.photos[1].mapsUrl, 'https://maps.google.com/photo/2')
    assert.equal(data.reviews.length, 5)
    assert.equal(JSON.stringify(data).includes('private-key'), false)
})
