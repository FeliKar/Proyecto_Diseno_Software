import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { requestDetails } from '../lib/restaurant-details.mjs'
import { safeLink } from '../lib/restaurant-search.mjs'

function SourceLink({ href, children }) {
    const safe = safeLink(href)
    return safe ? <a href={safe} target="_blank" rel="noopener noreferrer">{children}</a> : null
}

function Author({ author }) {
    return author && <span className="review-author">
        {safeLink(author.avatar) && <img src={safeLink(author.avatar)} alt="" width="32" height="32"
            loading="lazy" referrerPolicy="no-referrer" />}
        {safeLink(author.uri)
            ? <SourceLink href={author.uri}>{author.name || author.uri}</SourceLink>
            : author.name}
    </span>
}

export default function RestaurantDetails({ placeId, userId }) {
    const { t, i18n } = useTranslation()
    const busy = useRef(false)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [photoFailed, setPhotoFailed] = useState(false)

    async function load(photoIndex = 0) {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setData(null)
        try {
            const options = await getHostedOptions('restaurant-details', userId)
            const details = await requestDetails({
                placeId, photoIndex,
                language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es'
            }, options)
            setData(details)
            setPhotoFailed(false)
        } catch (failure) {
            setError(failure.message)
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    return <div className="place-details">
        <button type="button" className="clear-filters" disabled={loading}
            onClick={() => {
                if (data) { setData(null); setError('') }
                else load()
            }}>{t(data ? 'placeDetails.close' : 'placeDetails.open')}</button>
        {loading && <p role="status">{t('placeDetails.loading')}</p>}
        {error && <p role="alert" className="auth-error">{t(`placeDetails.${error}`)}</p>}
        {data && <div>
            <p className="maps-attribution" translate="no">Google Maps</p>
            <button type="button" className="clear-filters" disabled={loading}
                onClick={() => load(data.photoIndex)}>{t('placeDetails.refresh')}</button>
            <h4>{t('placeDetails.photos')}</h4>
            {data.photo && !photoFailed ? <figure className="place-photo">
                <img src={safeLink(data.photo.uri)} alt={t('placeDetails.photoAlt', { name: data.name })}
                    loading="lazy" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} />
                <figcaption>
                    {data.photo.authors.map((author, index) => <Author key={index} author={author} />)}
                    <SourceLink href={data.photo.mapsUrl || data.mapsUrl}>{t('placeDetails.sourcePhoto')}</SourceLink>
                    {' '}<SourceLink href={data.photo.reportUrl}>{t('placeDetails.report')}</SourceLink>
                </figcaption>
            </figure> : <p>{t('placeDetails.noPhoto')}</p>}
            {data.photoCount > 1 && <button type="button" className="clear-filters" disabled={loading}
                onClick={() => load((data.photoIndex + 1) % data.photoCount)}>{t('placeDetails.nextPhoto')}</button>}
            <h4>{t('placeDetails.ratings')}</h4>
            <p>{data.rating != null
                ? t('nearby.rating', {
                    value: new Intl.NumberFormat(i18n.resolvedLanguage, {
                        maximumFractionDigits: 1, minimumFractionDigits: 1,
                    }).format(data.rating)
                }) : t('nearby.ratingUnknown')}</p>
            <p>{data.ratingCount != null
                ? t('nearby.ratingCount', { total: new Intl.NumberFormat(i18n.resolvedLanguage).format(data.ratingCount) })
                : t('nearby.ratingCountUnknown')}</p>
            <h4>{t('placeDetails.summary')}</h4>
            {data.reviewSummary ? <div>
                <p>{data.reviewSummary.text}</p>
                <p>{data.reviewSummary.disclosure}</p>
                <SourceLink href={data.reviewSummary.reviewsUrl}>{t('placeDetails.allReviews')}</SourceLink>
                {' '}<SourceLink href="https://support.google.com/local-listings/answer/9851099">
                    {t('placeDetails.aboutSummary')}</SourceLink>
                {' '}<SourceLink href={data.reviewSummary.reportUrl}>{t('placeDetails.report')}</SourceLink>
                <p>{t('placeDetails.reportSummary')}</p>
            </div> : <p>{t('placeDetails.noSummary')}</p>}
            <h4>{t('placeDetails.reviews')}</h4>
            <p>{t('placeDetails.sample')}</p>
            {data.reviews.length > 0 && <p>{t('placeDetails.sampleRatings', data.sampleRatings)}</p>}
            {!data.reviews.length && <p>{t('placeDetails.noReviews')}</p>}
            {data.reviews.map((review, index) => <article className="google-review" key={index}>
                <Author author={review.author} />
                <p>{t('placeDetails.reviewScore', { value: review.rating })}</p>
                {review.published && <p><time dateTime={review.published}>
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' }).format(new Date(review.published))}
                </time></p>}
                {review.visitDate && <p>{t('placeDetails.visited', { date: review.visitDate })}</p>}
                <p className="review-text">{review.text || review.originalText || t('placeDetails.noText')}</p>
                {review.originalText && review.text && review.originalText !== review.text && <details>
                    <summary>{t('placeDetails.original')}</summary>
                    <p className="review-text">{review.originalText}</p>
                </details>}
                <SourceLink href={review.mapsUrl || data.mapsUrl}>{t('placeDetails.sourceReview')}</SourceLink>
                {' '}<SourceLink href={review.reportUrl}>{t('placeDetails.report')}</SourceLink>
            </article>)}
            {data.attributions.map((item, index) => <p key={index}>
                {safeLink(item.providerUri)
                    ? <SourceLink href={item.providerUri}>{item.provider || item.providerUri}</SourceLink>
                    : item.provider}
            </p>)}
        </div>}
    </div>
}
