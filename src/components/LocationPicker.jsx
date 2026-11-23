import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { loadGoogleMaps } from '../lib/google-maps'

export default function LocationPicker({ initialLocation, onSelect }) {
    const { t } = useTranslation()
    const container = useRef(null)
    const mapRef = useRef(null)
    const [ready, setReady] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        let listener
        const authError = () => { if (active) setError('unavailable') }
        window.addEventListener('mesa-cerca-map-error', authError)
        loadGoogleMaps().then((maps) => {
            if (!active) return
            // The default center shows central Chile without inferring the user's location.
            const center = initialLocation
                ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
                : { lat: -33.2, lng: -71 }
            const map = new maps.Map(container.current, {
                center,
                zoom: initialLocation ? 15 : 7,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                clickableIcons: false,
                keyboardShortcuts: true,
            })
            mapRef.current = map
            listener = map.addListener('click', (event) => {
                if (event.latLng) map.panTo(event.latLng)
            })
            setReady(true)
        }).catch((failure) => {
            if (active) setError(failure.message === 'missing' ? 'missing' : 'unavailable')
        })
        return () => {
            active = false
            listener?.remove()
            mapRef.current = null
            window.removeEventListener('mesa-cerca-map-error', authError)
        }
    }, [initialLocation])

    function selectCenter() {
        const center = mapRef.current?.getCenter()
        if (center) onSelect({ latitude: center.lat(), longitude: center.lng() })
    }

    return (
        <div className="location-picker">
            <p>{t('locationPicker.help')}</p>
            {!ready && !error && <p role="status">{t('locationPicker.loading')}</p>}
            {error && <p role="alert" className="auth-error">{t(`locationPicker.${error}`)}</p>}
            <div className="location-map-frame" hidden={Boolean(error)}>
                <div className="location-map" ref={container} aria-label={t('locationPicker.label')} />
                {ready && <span className="location-map-cross" aria-hidden="true">+</span>}
            </div>
            <button type="button" className="clear-filters" disabled={!ready || Boolean(error)}
                onClick={selectCenter}>
                {t('locationPicker.confirm')}
            </button>
        </div>
    )
}
