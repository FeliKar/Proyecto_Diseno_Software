import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { safeLink } from '../lib/restaurant-search.mjs'

export default function PlacePhoto({ photo, name, compact = false }) {
    const { t } = useTranslation()
    const [failed, setFailed] = useState(false)
    const source = safeLink(photo?.mapsUrl)
    const image = !failed && safeLink(photo?.uri)
        ? <img src={safeLink(photo?.uri)} alt={t('placeDetails.photoAlt', { name })}
            loading={compact ? 'lazy' : undefined} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <p>{t(compact ? 'nearby.noPhoto' : 'placeDetails.noPhoto')}</p>
    return <>
        <div className="carousel-image">
            {source ? <a href={source} target="_blank" rel="noopener noreferrer"
                aria-label={t('placeDetails.sourcePhoto')}>{image}</a> : image}
        </div>
        <figcaption className="photo-credit">
            {(photo?.authors || []).map((author, index) => <span className="review-author" key={index}>
                {safeLink(author.avatar) && <img src={safeLink(author.avatar)} alt="" width="24" height="24"
                    referrerPolicy="no-referrer" />}
                {safeLink(author.uri)
                    ? <a href={safeLink(author.uri)} target="_blank" rel="noopener noreferrer">{author.name || author.uri}</a>
                    : author.name}
            </span>)}
        </figcaption>
    </>
}

