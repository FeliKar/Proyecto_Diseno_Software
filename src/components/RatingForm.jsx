import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function RatingForm({ restaurant, disabled, onSave }) {
    const { t } = useTranslation()
    const [rating, setRating] = useState(restaurant.userRating ?? '')
    const [category, setCategory] = useState(restaurant.userCategory || '')
    const [priceLevel, setPriceLevel] = useState(restaurant.userPriceLevel || '')
    const prefix = `rating-${restaurant.id}`

    function submit(event) {
        event.preventDefault()
        onSave({ rating: Number(rating), category, priceLevel })
    }

    return <form onSubmit={submit}>
        <p>{restaurant.userRating != null
            ? t('ratings.current', { value: restaurant.userRating })
            : t('ratings.unrated')}</p>
        <fieldset disabled={disabled}>
            <legend>{t('ratings.title')}</legend>
            <div className="filters">
                <div className="filter-field">
                    <label htmlFor={`${prefix}-score`}>{t('ratings.score')}</label>
                    <select id={`${prefix}-score`} required value={rating}
                        onChange={(event) => setRating(event.target.value)}>
                        <option value="">{t('ratings.choose')}</option>
                        {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                </div>
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
