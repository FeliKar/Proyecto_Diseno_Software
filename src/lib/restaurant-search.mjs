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

export async function searchRestaurants(filters, fetcher = fetch) {
    try {
        const response = await fetcher('/api/restaurants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(filters),
            signal: AbortSignal.timeout(15000),
        })
        if (response.status === 504) throw new Error('timeout')
        if (!response.ok) throw new Error('service')
        const data = await response.json()
        if (!Array.isArray(data.restaurants)) throw new Error('service')
        return data.restaurants
    } catch (error) {
        throw new Error(error.name === 'TimeoutError' || error.message === 'timeout' ? 'timeout' : 'service')
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
