const views = {
    restaurants: 'explore',
    'saved-restaurants': 'lists',
    account: 'account',
}

export function readRoute(hash) {
    const match = /^#(restaurants|saved-restaurants|account)(?:\/([A-Za-z0-9_-]{1,255}))?$/.exec(hash)
    if (!match || (match[1] === 'account' && match[2])) return { name: 'explore', placeId: null }
    return { name: views[match[1]], placeId: match[2] || null }
}
