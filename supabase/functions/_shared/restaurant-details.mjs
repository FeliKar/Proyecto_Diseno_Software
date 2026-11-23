export function validateDetails(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_request')
    const { placeId, language = 'es', photoIndex = 0, gallery = false } = input
    if (typeof placeId !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(placeId) ||
        !['es', 'en'].includes(language) || !Number.isInteger(photoIndex) ||
        photoIndex < 0 || photoIndex > 4 || typeof gallery !== 'boolean') throw new Error('invalid_request')
    return { placeId, language, photoIndex, gallery }
}

function text(value) {
    return typeof value === 'string' ? value : ''
}

function https(value) {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
    } catch {
        return null
    }
}

function authors(values) {
    return (Array.isArray(values) ? values : []).map((author) => ({
        name: text(author?.displayName), uri: https(author?.uri),
        avatar: https(author?.photoUri),
    })).filter((author) => author.name || author.avatar || author.uri)
}

export function selectDetails(place) {
    const rating = Number.isFinite(place.rating) && place.rating >= 1 && place.rating <= 5 ? place.rating : null
    const reviews = (Array.isArray(place.reviews) ? place.reviews : []).slice(0, 5)
        .filter((review) => review && Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5)
        .map((review) => ({
            rating: review.rating, text: text(review.text?.text),
            originalText: text(review.originalText?.text),
            author: authors([review.authorAttribution])[0] || null,
            mapsUrl: https(review.googleMapsUri), reportUrl: https(review.flagContentUri),
            published: Number.isFinite(Date.parse(review.publishTime)) ? review.publishTime : null,
            visitDate: Number.isInteger(review.visitDate?.year) && review.visitDate.year > 0 &&
                Number.isInteger(review.visitDate?.month) && review.visitDate.month >= 1 && review.visitDate.month <= 12
                ? `${review.visitDate.year}-${String(review.visitDate.month).padStart(2, '0')}` : null,
        }))
    const summary = place.reviewSummary
    // Show Google's summary only with its disclosure and review source link.
    const reviewSummary = text(summary?.text?.text) && text(summary?.disclosureText?.text) && https(summary?.reviewsUri) && https(summary?.flagContentUri)
        ? {
            text: summary.text.text, disclosure: summary.disclosureText.text,
            reviewsUrl: https(summary.reviewsUri), reportUrl: https(summary.flagContentUri)
        } : null
    return {
        name: text(place.displayName?.text), mapsUrl: https(place.googleMapsUri), rating,
        ratingCount: Number.isInteger(place.userRatingCount) && place.userRatingCount >= 0 ? place.userRatingCount : null,
        reviews, reviewSummary,
        sampleRatings: {
            high: reviews.filter((review) => review.rating >= 4).length,
            middle: reviews.filter((review) => review.rating === 3).length,
            low: reviews.filter((review) => review.rating <= 2).length,
        },
        attributions: (Array.isArray(place.attributions) ? place.attributions : []).map((item) => ({
            provider: text(item?.provider), providerUri: https(item?.providerUri),
        })),
    }
}

export function createDetailsHandler({ apiKey, fetcher = fetch }) {
    const json = (body, status = 200) => Response.json(body, {
        status, headers: { 'Cache-Control': 'no-store' },
    })
    return async (request) => {
        const { placeId, language, photoIndex, gallery } = validateDetails(await request.json())
        if (!apiKey) return json({ error: 'service' }, 503)
        try {
            const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`)
            url.searchParams.set('languageCode', language)
            const response = await fetcher(url, {
                headers: {
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': 'displayName,googleMapsUri,rating,userRatingCount,reviews,reviewSummary,photos,attributions'
                },
                signal: AbortSignal.timeout(10000),
            })
            if (response.status === 404) return json({ error: 'not_found' }, 404)
            if (!response.ok) {
                console.error('Restaurant details request failed:', response.status)
                return json({ error: 'service' }, 502)
            }
            const place = await response.json()
            if (!place || typeof place !== 'object' || Array.isArray(place) || !text(place.displayName?.text)) {
                throw new Error('invalid_response')
            }
            const photos = (Array.isArray(place.photos) ? place.photos : []).filter((photo) =>
                typeof photo?.name === 'string' &&
                photo.name.startsWith(`places/${placeId}/photos/`) &&
                /^[A-Za-z0-9_-]+$/.test(photo.name.slice(`places/${placeId}/photos/`.length)))
                .slice(0, gallery ? 5 : 3)
            const loadPhoto = async (selected) => {
                if (!selected) return null
                try {
                    const photoUrl = new URL(`https://places.googleapis.com/v1/${selected.name}/media`)
                    photoUrl.searchParams.set('maxWidthPx', '900')
                    photoUrl.searchParams.set('skipHttpRedirect', 'true')
                    const photoResponse = await fetcher(photoUrl, {
                        headers: { 'X-Goog-Api-Key': apiKey }, signal: AbortSignal.timeout(8000),
                    })
                    if (photoResponse.ok) {
                        const media = await photoResponse.json()
                        const uri = https(media.photoUri)
                        const host = uri ? new URL(uri).hostname : ''
                        if (uri && !uri.includes(apiKey) &&
                            (host === 'googleusercontent.com' || host.endsWith('.googleusercontent.com'))) {
                            return {
                                uri, authors: authors(selected.authorAttributions),
                                mapsUrl: https(selected.googleMapsUri), reportUrl: https(selected.flagContentUri)
                            }
                        }
                    }
                } catch {
                    // A failed photo must not hide available reviews and summary.
                }
                return null
            }
            const selectedIndex = photoIndex < photos.length ? photoIndex : 0
            // Existing clients request one photo; the carousel requests the gallery.
            if (gallery) {
                const loaded = (await Promise.all(photos.map(loadPhoto))).filter(Boolean)
                return json({
                    ...selectDetails(place), photos: loaded,
                    photo: loaded[0] || null, photoIndex: 0, photoCount: loaded.length
                })
            }
            const photo = await loadPhoto(photos[selectedIndex])
            return json({ ...selectDetails(place), photo, photoIndex: selectedIndex, photoCount: photos.length })
        } catch (error) {
            return json({ error: 'service' }, error.name === 'TimeoutError' ? 504 : 502)
        }
    }
}
