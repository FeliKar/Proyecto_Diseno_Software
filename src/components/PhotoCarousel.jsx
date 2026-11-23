import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PlacePhoto from './PlacePhoto'

export default function PhotoCarousel({ photos, name }) {
    const { t } = useTranslation()
    const viewport = useRef(null)
    const [current, setCurrent] = useState(0)

    function go(index) {
        const element = viewport.current
        if (!element) return
        element.scrollTo({ left: Math.max(0, Math.min(index, photos.length - 1)) * element.clientWidth })
    }

    if (!photos.length) return <p>{t('placeDetails.noPhoto')}</p>
    return <div className="photo-carousel" role="region" aria-roledescription={t('placeDetails.carousel')}
        aria-label={t('placeDetails.photos')}>
        <div className="carousel-viewport" ref={viewport} tabIndex={0}
            onScroll={(event) => {
                const element = event.currentTarget
                if (element.clientWidth) setCurrent(Math.max(0, Math.min(photos.length - 1,
                    Math.round(element.scrollLeft / element.clientWidth))))
            }}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return
                if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    go(current + (event.key === 'ArrowRight' ? 1 : -1))
                }
            }}>
            {photos.map((photo, index) => <figure className="carousel-slide" key={`${index}:${photo.uri}`}
                role="group" aria-label={t('placeDetails.photoPosition', { current: index + 1, total: photos.length })}>
                <PlacePhoto photo={photo} name={name} />
            </figure>)}
        </div>
        {photos.length > 1 && <div className="carousel-controls">
            <button type="button" className="clear-filters" disabled={current === 0}
                aria-label={t('placeDetails.previousPhoto')} onClick={() => go(current - 1)}>‹</button>
            <span role="status">{t('placeDetails.photoPosition', { current: current + 1, total: photos.length })}</span>
            <button type="button" className="clear-filters" disabled={current === photos.length - 1}
                aria-label={t('placeDetails.nextPhoto')} onClick={() => go(current + 1)}>›</button>
        </div>}
    </div>
}
