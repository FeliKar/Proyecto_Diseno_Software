import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadGoogleMaps } from '../lib/google-maps'

export default function RestaurantMap({ restaurants }) {
    const { t } = useTranslation()
    const container = useRef(null)
    const [ready, setReady] = useState(false)
    const [error, setError] = useState(false)
    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID
    const locatedCount = restaurants.filter((restaurant) => restaurant.location).length

    useEffect(() => {
        if (!mapId || !locatedCount) return
        let active = true
        let info
        const markers = []
        const listeners = []
        const authError = () => { if (active) setError(true) }
        window.addEventListener('mesa-cerca-map-error', authError)

        async function showResults() {
            try {
                const maps = await loadGoogleMaps()
                const { AdvancedMarkerElement } = await maps.importLibrary('marker')
                if (!active) return

                const first = restaurants.find((restaurant) => restaurant.location).location
                const map = new maps.Map(container.current, {
                    mapId,
                    center: { lat: first.latitude, lng: first.longitude },
                    zoom: 15,
                    maxZoom: 17,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                    clickableIcons: false,
                })
                const bounds = new maps.LatLngBounds()
                info = new maps.InfoWindow()

                restaurants.forEach((restaurant, index) => {
                    if (!restaurant.location) return
                    const position = {
                        lat: restaurant.location.latitude,
                        lng: restaurant.location.longitude,
                    }
                    const marker = new AdvancedMarkerElement({
                        map, position, title: `${index + 1}. ${restaurant.name}`,
                    })
                    const label = document.createElement('span')
                    label.className = 'restaurant-map-marker'
                    label.textContent = String(index + 1)
                    marker.append(label)
                    markers.push(marker)
                    bounds.extend(position)
                    listeners.push(marker.addListener('click', () => {
                        // Provider text is inserted as text, never as HTML.
                        const name = document.createElement('strong')
                        name.textContent = restaurant.name
                        info.setContent(name)
                        info.open({ map, anchor: marker })
                    }))
                })
                if (locatedCount > 1) map.fitBounds(bounds, 40)
                setReady(true)
            } catch {
                if (active) setError(true)
            }
        }
        showResults()

        return () => {
            active = false
            window.removeEventListener('mesa-cerca-map-error', authError)
            listeners.forEach((listener) => listener.remove())
            markers.forEach((marker) => { marker.map = null })
            info?.close()
        }
    }, [restaurants, mapId, locatedCount])

    const message = !locatedCount ? 'noLocations' : !mapId ? 'missing' : error ? 'unavailable' : null

    return (
        <section className="restaurant-results-map" aria-labelledby="results-map-title">
            <h3 id="results-map-title">{t('restaurantMap.title')}</h3>
            <p>{t('restaurantMap.help')}</p>
            {message && <p role="status">{t(`restaurantMap.${message}`)}</p>}
            {!message && !ready && <p role="status">{t('restaurantMap.loading')}</p>}
            <div className="location-map" ref={container} hidden={Boolean(message)}
                aria-label={t('restaurantMap.title')} />
            {locatedCount > 0 && locatedCount < restaurants.length && (
                <p>{t('restaurantMap.partial')}</p>
            )}
        </section>
    )
}
