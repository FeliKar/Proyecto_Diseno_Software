export async function requestDetails(input, options, fetcher = fetch) {
    try {
        const response = await fetcher(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${options.token}`, apikey: options.publishableKey
            },
            body: JSON.stringify(input), signal: AbortSignal.timeout(35000),
        })
        if (response.status === 401) throw new Error('signin')
        if (response.status === 429) throw new Error('rateLimit')
        if (response.status === 404) throw new Error('notFound')
        if (response.status === 504) throw new Error('timeout')
        if (!response.ok) throw new Error('service')
        const data = await response.json()
        if (!data || typeof data.name !== 'string' || !Array.isArray(data.reviews) ||
            !Array.isArray(data.attributions) || !Number.isInteger(data.photoCount) ||
            data.photoCount < 0 || data.photoCount > 5 ||
            (data.photos !== undefined && (!Array.isArray(data.photos) || data.photos.length > 5 ||
                data.photos.some((photo) => !photo || typeof photo.uri !== 'string' || !Array.isArray(photo.authors))))) throw new Error('service')
        return data
    } catch (error) {
        if (['signin', 'rateLimit', 'notFound', 'timeout'].includes(error.message)) throw error
        throw new Error(error.name === 'TimeoutError' ? 'timeout' : 'service')
    }
}
