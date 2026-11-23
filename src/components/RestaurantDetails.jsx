import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { requestDetails } from '../lib/restaurant-details.mjs'
import PhotoCarousel from './PhotoCarousel'
import StarRating from './StarRating'
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

    const load = useCallback(async () => {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setData(null)
        try {
            const options = await getHostedOptions('restaurant-details', userId)
            const details = await requestDetails({
                placeId, gallery: true,
                language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es'
            }, options)
            setData(details)
        } catch (failure) {
            setError(failure.message)
        } finally {
            busy.current = false
            setLoading(false)
        }
    }, [placeId, userId, i18n.resolvedLanguage])

    const started = useRef(false)
    useEffect(() => {
        // StrictMode repeats effects; opening a page should make just one request.
        if (started.current) return
        started.current = true
        load()
    }, [load])

    return <section className="place-details">
        <h2>{t('restaurantPage.googleDetails')}</h2>
        {loading && <p role="status">{t('placeDetails.loading')}</p>}
        {error && <div>
            <p role="alert" className="auth-error">{t(`placeDetails.${error}`)}</p>
            <button type="button" className="clear-filters" onClick={() => load()}>
                {t('placeDetails.refresh')}
            </button>
        </div>}
        {data && <div>
            <p className="maps-attribution" translate="no">Google Maps</p>
            <button type="button" className="clear-filters" disabled={loading}
                onClick={() => load()}>{t('placeDetails.refresh')}</button>
            <h3>{t('placeDetails.photos')}</h3>
            <PhotoCarousel photos={data.photos || (data.photo ? [data.photo] : [])} name={data.name} />
            <h3>{t('placeDetails.ratings')}</h3>
            <p><StarRating value={data.rating} /></p>
            <p>{data.ratingCount != null
                ? t('nearby.ratingCount', { total: new Intl.NumberFormat(i18n.resolvedLanguage).format(data.ratingCount) })
                : t('nearby.ratingCountUnknown')}</p>
            <h3>{t('placeDetails.summary')}</h3>
            {data.reviewSummary ? <div>
                <p>{data.reviewSummary.text}</p>
                <p>{data.reviewSummary.disclosure}</p>
                <SourceLink href={data.reviewSummary.reviewsUrl}>{t('placeDetails.allReviews')}</SourceLink>
                {' '}<SourceLink href="https://support.google.com/local-listings/answer/9851099">
                    {t('placeDetails.aboutSummary')}</SourceLink>
                {' '}<SourceLink href={data.reviewSummary.reportUrl}>{t('placeDetails.report')}</SourceLink>
                <p>{t('placeDetails.reportSummary')}</p>
            </div> : <p>{t('placeDetails.noSummary')}</p>}
            <h3>{t('placeDetails.reviews')}</h3>
            <p>{t('placeDetails.sample')}</p>
            {data.reviews.length > 0 && <p>{t('placeDetails.sampleRatings', data.sampleRatings)}</p>}
            {!data.reviews.length && <p>{t('placeDetails.noReviews')}</p>}
            {data.reviews.map((review, index) => <article className="google-review" key={index}>
                <Author author={review.author} />
                <p><StarRating value={review.rating} /></p>
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
    </section>
}
