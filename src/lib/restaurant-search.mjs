export function getLocation(geolocation = globalThis.navigator?.geolocation) {
    if (!geolocation) return Promise.reject(new Error('unsupported'))
    return new Promise((resolve, reject) => {
        geolocation.getCurrentPosition(
            ({ coords }) => {
                // Product choice: uncertainty above 1 km is too large for a 3 km search.
                if (!Number.isFinite(coords.accuracy) || coords.accuracy > 1000) {
                    reject(new Error('imprecise'))
                    return
                }
                resolve({ latitude: coords.latitude, longitude: coords.longitude })
            },
            (error) => reject(new Error(error.code === 1 ? 'denied' : 'location')),
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            },
        )
    })
}

export async function searchRestaurants(
    filters,
    fetcher = fetch,
    options = {},
) {
    try {
        const response = await fetcher(
            options.url || '/api/restaurants',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.token
                        ? {
                            Authorization: `Bearer ${options.token}`,
                            apikey: options.publishableKey,
                        }
                        : {}),
                },
                body: JSON.stringify(filters),
                signal: AbortSignal.timeout(25000),
            },
        )

        if (response.status === 401) {
            throw new Error('signin')
        }

        if (response.status === 429) {
            throw new Error('rateLimit')
        }

        if (response.status === 504) {
            throw new Error('timeout')
        }

        if (!response.ok) {
            throw new Error('service')
        }

        const data = await response.json()

        if (!Array.isArray(data.restaurants)) {
            throw new Error('service')
        }

        return data.restaurants
    } catch (error) {
        if (['signin', 'rateLimit', 'timeout'].includes(error.message)) {
            throw error
        }

        throw new Error(
            error.name === 'TimeoutError' ? 'timeout' : 'service',
        )
    }
}

export function safeLink(value) {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' ? url.href : undefined
    } catch {
        return undefined
    }
}
