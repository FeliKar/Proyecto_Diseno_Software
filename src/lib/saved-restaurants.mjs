export async function savedRequest(input, options, fetcher = fetch) {
    try {
        const response = await fetcher(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${options.token}`, apikey: options.publishableKey
            },
            body: JSON.stringify(input),
            signal: AbortSignal.timeout(25000),
        })
        if (response.status === 401) throw new Error('signin')
        if (response.status === 429) throw new Error('rateLimit')
        if (!response.ok) throw new Error('service')
        const data = await response.json()
        if (input.action === 'list'
            ? !Array.isArray(data.restaurants) || typeof data.hasMore !== 'boolean'
            : data.ok !== true) throw new Error('service')
        return data
    } catch (error) {
        throw new Error(['signin', 'rateLimit'].includes(error.message) ? error.message : 'service')
    }
}
