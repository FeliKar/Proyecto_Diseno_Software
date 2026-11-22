export async function historyRequest(action, options, fetcher = fetch) {
    try {
        const response = await fetcher(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${options.token}`,
                apikey: options.publishableKey,
            },
            body: JSON.stringify({ action }),
            signal: AbortSignal.timeout(15000),
        })
        if (response.status === 401) throw new Error('signin')
        if (!response.ok) throw new Error('service')
        const data = await response.json()
        if (action === 'list' ? !Array.isArray(data.history) : data.ok !== true) {
            throw new Error('service')
        }
        return data
    } catch (error) {
        throw new Error(error.message === 'signin' ? 'signin' : 'service')
    }
}
