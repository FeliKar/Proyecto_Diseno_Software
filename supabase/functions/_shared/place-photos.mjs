export function https(value) {
    try {
        const url = new URL(value)
        return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
    } catch {
        return null
    }
}

export function authors(values) {
    return (Array.isArray(values) ? values : []).map((author) => ({
        name: typeof author?.displayName === 'string' ? author.displayName : '', uri: https(author?.uri),
        avatar: https(author?.photoUri),
    })).filter((author) => author.name || author.avatar || author.uri)
}

export function selectPhotos(values, placeId, limit) {
    const prefix = `places/${placeId}/photos/`
    return (Array.isArray(values) ? values : []).filter((photo) =>
        typeof photo?.name === 'string' && photo.name.startsWith(prefix) &&
        /^[A-Za-z0-9_-]+$/.test(photo.name.slice(prefix.length))).slice(0, limit)
}

export async function loadPhoto(selected, { apiKey, fetcher, maxWidth = 900 }) {
    if (!selected) return null
    try {
        const photoUrl = new URL(`https://places.googleapis.com/v1/${selected.name}/media`)
        photoUrl.searchParams.set('maxWidthPx', String(maxWidth))
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
        // A failed photo must not hide the rest of the restaurant data.
    }
    return null
}
