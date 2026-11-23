import { useTranslation } from 'react-i18next'

export default function StarRating({ value }) {
    const { t, i18n } = useTranslation()
    if (!Number.isFinite(value) || value < 1 || value > 5) return <span>{t('nearby.ratingUnknown')}</span>
    const formatted = new Intl.NumberFormat(i18n.resolvedLanguage, {
        minimumFractionDigits: 1, maximumFractionDigits: 1,
    }).format(value)
    return <span className="star-rating" role="img" aria-label={t('placeDetails.reviewScore', { value: formatted })}>
        <span className="star-rating-track" aria-hidden="true">
            <span>★★★★★</span>
            <span className="star-rating-fill" style={{ width: `${value / 5 * 100}%` }}>★★★★★</span>
        </span>
        <strong aria-hidden="true">{formatted}</strong>
    </span>
}
