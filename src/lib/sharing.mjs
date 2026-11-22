export async function sharingRequest(input, options, fetcher = fetch) {
    try {
        const response = await fetcher(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
                apikey: options.publishableKey,
            },
            body: JSON.stringify(input),
            signal: AbortSignal.timeout(35000),
        })
        if (response.status === 401) throw new Error('signin')
        if (response.status === 404 || response.status === 400) throw new Error('notFound')
        if (response.status === 429) throw new Error('rateLimit')
        if (!response.ok) throw new Error('service')
        const data = await response.json()
        if (input.action === 'share') {
            if (typeof data.token !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.token)) throw new Error('service')
        } else if (input.action === 'revoke') {
            if (data.ok !== true) throw new Error('service')
        } else if (!Array.isArray(data.restaurants) || typeof data.hasMore !== 'boolean' ||
            !['wishlist', 'visited'].includes(data.status)) throw new Error('service')
        return data
    } catch (error) {
        throw new Error(['signin', 'notFound', 'rateLimit'].includes(error.message) ? error.message : 'service')
    }
}
