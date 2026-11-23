import { loadPhoto, selectPhotos } from './place-photos.mjs'

const cuisineTypes = {
    vegetarian: 'vegetarian_restaurant',
    italian: 'italian_restaurant',
    seafood: 'seafood_restaurant',
}

const priceGroups = {
    PRICE_LEVEL_FREE: 'inexpensive',
    PRICE_LEVEL_INEXPENSIVE: 'inexpensive',
    PRICE_LEVEL_MODERATE: 'moderate',
    PRICE_LEVEL_EXPENSIVE: 'expensive',
    PRICE_LEVEL_VERY_EXPENSIVE: 'expensive',
}


export function validateSearch(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('invalid_search')
    }
    const {
        latitude, longitude, category = '',
        priceLevel = '', language = 'es',
    } = input
    if (
        !Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
        !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        !['', ...Object.keys(cuisineTypes)].includes(category) ||
        !['', 'inexpensive', 'moderate', 'expensive'].includes(priceLevel) ||
        !['es', 'en'].includes(language)
    ) {
        throw new Error('invalid_search')
    }
    return { latitude, longitude, category, priceLevel, language }
}

// Price filtering precedes the limit so valid matches are retained among the five results.
export function selectRestaurants(places, filters) {
    return places
        .filter((place) => {
            const name = place.displayName?.text || ''
            return place.id && name &&
                place.businessStatus !== 'CLOSED_PERMANENTLY' &&
                (!filters.priceLevel || priceGroups[place.priceLevel] === filters.priceLevel)
        })
        .slice(0, 5)
        .map((place) => ({
            id: place.id,
            name: place.displayName.text,
            address: place.formattedAddress || null,
            priceLevel: priceGroups[place.priceLevel] || null,
            googleMapsUrl: place.googleMapsUri || null,
            attributions: place.attributions || [],
            rating: Number.isFinite(place.rating) && place.rating >= 1 && place.rating <= 5
                ? place.rating : null,
            ratingCount: Number.isInteger(place.userRatingCount) && place.userRatingCount >= 0
                ? place.userRatingCount : null,
            location: Number.isFinite(place.location?.latitude) &&
                Math.abs(place.location.latitude) <= 90 &&
                Number.isFinite(place.location?.longitude) &&
                Math.abs(place.location.longitude) <= 180
                ? { latitude: place.location.latitude, longitude: place.location.longitude }
                : null,
        }))
}

export function createHandler({ apiKey, fetcher = fetch }) {
    return async function handler(request) {
        function json(body, status = 200) {
            return Response.json(body, {
                status,
                headers: { 'Cache-Control': 'no-store' },
            })
        }
        const path = new URL(request.url).pathname
        const origin = request.headers.get('Origin')

        // The local-only handler relies on the public wrapper for production authentication and quotas.
        if (origin && origin !== 'http://localhost:5173') {
            return json({ error: 'origin_not_allowed' }, 403)
        }
        if (path === '/api/health' && request.method === 'GET') {
            return json({ status: 'ok', placesConfigured: Boolean(apiKey) })
        }
        if (path !== '/api/restaurants') return json({ error: 'not_found' }, 404)
        if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)
        if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
            return json({ error: 'json_required' }, 415)
        }
        let filters
        try {
            filters = validateSearch(await request.json())
        } catch {
            return json({ error: 'invalid_search' }, 400)
        }
        if (!apiKey) return json({ error: 'places_not_configured' }, 503)
        try {
            const response = await fetcher('https://places.googleapis.com/v1/places:searchNearby', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': apiKey,
                    'X-Goog-FieldMask': [
                        'places.id', 'places.displayName', 'places.formattedAddress',
                        'places.priceLevel', 'places.googleMapsUri',
                        'places.businessStatus', 'places.attributions',
                        'places.rating', 'places.userRatingCount', 'places.location', 'places.photos',
                    ].join(','),
                },
                body: JSON.stringify({
                    includedTypes: [cuisineTypes[filters.category] || 'restaurant'],
                    maxResultCount: 20,
                    rankPreference: 'DISTANCE',
                    languageCode: filters.language,
                    locationRestriction: {
                        circle: {
                            center: { latitude: filters.latitude, longitude: filters.longitude },
                            radius: 3000,
                        },
                    },
                }),
                signal: AbortSignal.timeout(10000),
            })
            if (!response.ok) {
                console.error('Places request failed:', response.status)
                return json({ error: 'places_unavailable' }, 502)
            }
            const data = await response.json()
            if (data.places !== undefined && !Array.isArray(data.places)) {
                throw new Error('invalid_response')
            }
            const places = data.places || []
            const selected = selectRestaurants(places, filters)
            // The handler loads one photo per visible result after filtering and applying the five-result limit.
            const restaurants = await Promise.all(selected.map(async (restaurant) => {
                const place = places.find((item) => item.id === restaurant.id)
                const photo = selectPhotos(place.photos, restaurant.id, 1)[0]
                return { ...restaurant, photo: await loadPhoto(photo, { apiKey, fetcher, maxWidth: 600 }) }
            }))
            return json({ restaurants, radiusMeters: 3000 })
        } catch (error) {
            const timeout = error.name === 'TimeoutError'
            return json({ error: timeout ? 'places_timeout' : 'places_unavailable' }, timeout ? 504 : 502)
        }
    }
}
