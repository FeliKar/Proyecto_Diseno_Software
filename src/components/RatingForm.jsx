import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function RatingForm({ restaurant, disabled, onSave }) {
    const { t } = useTranslation()
    const [rating, setRating] = useState(restaurant.userRating ?? '')
    const [category, setCategory] = useState(restaurant.userCategory || '')
    const [priceLevel, setPriceLevel] = useState(restaurant.userPriceLevel || '')
    const prefix = `rating-${restaurant.id}`

    // Native required radio inputs provide keyboard access and prevent empty submissions.
    function submit(event) {
        event.preventDefault()
        onSave({ rating: Number(rating), category, priceLevel })
    }

    return <form className="rating-form" onSubmit={submit}>
        <p>{restaurant.userRating != null
            ? t('ratings.current', { value: restaurant.userRating })
            : t('ratings.unrated')}</p>
        <fieldset disabled={disabled}>
            <legend>{t('ratings.title')}</legend>
            <div className="rating-stars" role="radiogroup" aria-label={t('ratings.score')}>
                {[1, 2, 3, 4, 5].map((value) => <label key={value}
                    className={`rating-star${Number(rating) >= value ? ' is-selected' : ''}`}>
                    <input type="radio" name={prefix} value={value} required
                        checked={Number(rating) === value} onChange={() => setRating(value)}
                        aria-label={t('ratings.option', { value })} />
                    <span className="star-symbol" aria-hidden="true">★</span>
                </label>)}
            </div>
            <details className="rating-preferences">
                <summary>{t('ratings.preferences')}</summary>
                <div className="filters">
                    <div className="filter-field">
                        <label htmlFor={`${prefix}-category`}>{t('categoryLabel')}</label>
                        <select id={`${prefix}-category`} value={category}
                            onChange={(event) => setCategory(event.target.value)}>
                            <option value="">{t('ratings.unspecified')}</option>
                            {['vegetarian', 'italian', 'seafood'].map((value) =>
                                <option key={value} value={value}>{t(`categories.${value}`)}</option>)}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label htmlFor={`${prefix}-price`}>{t('priceLabel')}</label>
                        <select id={`${prefix}-price`} value={priceLevel}
                            onChange={(event) => setPriceLevel(event.target.value)}>
                            <option value="">{t('ratings.unspecified')}</option>
                            {['inexpensive', 'moderate', 'expensive'].map((value) =>
                                <option key={value} value={value}>{t(`priceLevels.${value}`)}</option>)}
                        </select>
                    </div>
                </div>
                <p>{t('ratings.help')}</p>
            </details>
            <div className="filters">
                <button type="submit" className="clear-filters">{t('ratings.save')}</button>
                {restaurant.userRating != null && <button type="button" className="clear-filters"
                    onClick={() => onSave({ rating: null, category: '', priceLevel: '' })}>
                    {t('ratings.remove')}
                </button>}
            </div>
        </fieldset>
    </form>
}
