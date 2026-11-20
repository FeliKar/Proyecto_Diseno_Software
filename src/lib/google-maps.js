let mapsPromise

export function loadGoogleMaps() {
    if (mapsPromise) return mapsPromise
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key) return Promise.reject(new Error('missing'))

    mapsPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        const timer = setTimeout(() => reject(new Error('unavailable')), 20000)
        window.mesaCercaMapReady = () => {
            clearTimeout(timer)
            resolve(window.google.maps)
        }
        window.gm_authFailure = () => {
            clearTimeout(timer)
            reject(new Error('unavailable'))
            window.dispatchEvent(new Event('mesa-cerca-map-error'))
        }
        script.onerror = () => {
            clearTimeout(timer)
            reject(new Error('unavailable'))
        }
        const params = new URLSearchParams({
            key, v: 'weekly', loading: 'async', callback: 'mesaCercaMapReady',
        })
        script.src = `https://maps.googleapis.com/maps/api/js?${params}`
        script.async = true
        document.head.append(script)
    })
    return mapsPromise
}
