import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LocationPicker from './LocationPicker'
import RestaurantMap from './RestaurantMap'
import SaveRestaurantButtons from './SaveRestaurantButtons'
import { getLocation, safeLink, searchRestaurants } from '../lib/restaurant-search.mjs'
import { getHostedOptions, getSearchOptions } from '../lib/search-session'

export default function RestaurantSearch({ userId, onSaved }) {
    const { t, i18n } = useTranslation()
    const [category, setCategory] = useState('')
    const [priceLevel, setPriceLevel] = useState('')
    const [restaurants, setRestaurants] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [location, setLocation] = useState(null)
    const [showMap, setShowMap] = useState(false)
    const busy = useRef(false)
    const hosted = import.meta.env.VITE_USE_HOSTED_BACKEND === 'true'
    const [recommendation, setRecommendation] = useState(null)
    const [historyWarning, setHistoryWarning] = useState(false)

    function resetResults() {
        setRestaurants(null)
        setError('')
        setRecommendation(null)
        setHistoryWarning(false)
    }

    function clearFilters() {
        setCategory('')
        setPriceLevel('')
        resetResults()
    }

    async function handleSearch(event, useDevice = false, mode = 'search') {
        event.preventDefault()
        if (busy.current) return
        busy.current = true
        setLoading(true)
        resetResults()
        try {
            const options = hosted
                ? await getHostedOptions('restaurants', userId)
                : await getSearchOptions()

            // Conserva el punto elegido al cambiar los filtros.
            const point = useDevice || !location
                ? await getLocation()
                : location

            setLocation(point)

            const results = await searchRestaurants(
                {
                    ...point,

                    category,
                    priceLevel,
                    mode,
                    language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es',
                },
                fetch,
                options,
            )

            setRestaurants(results.restaurants)
            setRecommendation(results.recommendation || null)
            setHistoryWarning(results.historySaved === false)
        } catch (failure) {
            const knownErrors = ['unsupported', 'denied', 'location', 'timeout', 'imprecise', 'signin', 'rateLimit']
            setError(knownErrors.includes(failure.message) ? failure.message : 'service')
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    return (
        <section id="restaurants" className="restaurants-section" aria-labelledby="restaurants-title">
            <div className="section-heading">
                <h2 id="restaurants-title">{t('nearby.title')}</h2>
                <p>{t('nearby.description')}</p>
            </div>

            <form onSubmit={(event) => handleSearch(event)} className="restaurant-search">
                <fieldset disabled={loading}>
                    <div className="filters">
                        <button type="button" className="clear-filters"
                            onClick={() => setShowMap(!showMap)}>
                            {t(showMap ? 'locationPicker.close' : 'locationPicker.open')}
                        </button>
                        {location && <button type="button" className="clear-filters"
                            onClick={(event) => handleSearch(event, true)}>
                            {t('locationPicker.device')}
                        </button>}
                    </div>
                    {location && <p role="status">
                        {t('locationPicker.selected', {
                            latitude: location.latitude.toFixed(5),
                            longitude: location.longitude.toFixed(5),
                        })}
                    </p>}
                    {showMap && <LocationPicker initialLocation={location}
                        onSelect={(point) => {
                            setLocation(point)
                            setShowMap(false)
                            resetResults()
                        }} />}
                    <div className="filters">
                        <div className="filter-field">
                            <label htmlFor="category-filter">{t('categoryLabel')}</label>
                            <select id="category-filter" value={category}
                                onChange={(event) => { setCategory(event.target.value); resetResults() }}>
                                <option value="">{t('allCategories')}</option>
                                {['vegetarian', 'italian', 'seafood'].map((value) => (
                                    <option key={value} value={value}>{t(`categories.${value}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-field">
                            <label htmlFor="price-filter">{t('priceLabel')}</label>
                            <select id="price-filter" value={priceLevel}
                                onChange={(event) => { setPriceLevel(event.target.value); resetResults() }}>
                                <option value="">{t('allPrices')}</option>
                                {['inexpensive', 'moderate', 'expensive'].map((value) => (
                                    <option key={value} value={value}>{t(`priceLevels.${value}`)}</option>
                                ))}
                            </select>
                        </div>
                        <button type="button" className="clear-filters" onClick={clearFilters}>{t('clearFilters')}</button>
                        <button type="submit" className="auth-submit">{t(location ? 'locationPicker.search' : 'nearby.submit')}</button>
                    </div>
                    {hosted && <div>
                        <p>{t('recommendations.help')}</p>
                        <button type="button" className="auth-submit"
                            onClick={(event) => handleSearch(event, false, 'recommend')}>
                            {t('recommendations.submit')}
                        </button>
                    </div>}
                </fieldset>
            </form>

            <p role="status">
                {loading ? t('nearby.loading') : !error && (
                    restaurants === null ? t(location ? 'locationPicker.ready' : 'nearby.initial') : restaurants.length === 0 ? t('nearby.empty') : ''
                )}
            </p>
            {error && <p role="alert" className="auth-error">{t(`nearby.errors.${error}`)}</p>}
            {historyWarning && <p role="status">{t('history.saveFailed')}</p>}
            {recommendation && <p role="status">
                {!recommendation.hasHistory
                    ? t('recommendations.noHistory')
                    : !recommendation.category && !recommendation.priceLevel
                        ? t('recommendations.noPreference')
                        : t('recommendations.basedOn', {
                            category: recommendation.category
                                ? t(`categories.${recommendation.category}`) : t('allCategories'),
                            price: recommendation.priceLevel
                                ? t(`priceLevels.${recommendation.priceLevel}`) : t('allPrices'),
                        })}
            </p>}
            <p>{t('nearby.limit')}</p>

            {restaurants !== null && <p>{t('nearby.source')}</p>}
            {restaurants?.length > 0 && <RestaurantMap restaurants={restaurants} />}
            <div className="restaurant-grid" aria-busy={loading}>
                {restaurants?.map((restaurant, index) => (
                    <article className="restaurant-card" key={restaurant.id}>
                        <div className="restaurant-content">
                            <h3>{index + 1}. {restaurant.name}</h3>
                            <p>{restaurant.rating != null
                                ? t('nearby.rating', {
                                    value: new Intl.NumberFormat(i18n.resolvedLanguage, {
                                        minimumFractionDigits: 1, maximumFractionDigits: 1,
                                    }).format(restaurant.rating)
                                })
                                : t('nearby.ratingUnknown')}</p>
                            <p>{restaurant.ratingCount != null
                                ? t('nearby.ratingCount', {
                                    total: new Intl.NumberFormat(i18n.resolvedLanguage)
                                        .format(restaurant.ratingCount)
                                })
                                : t('nearby.ratingCountUnknown')}</p>
                            <p>{restaurant.address || t('nearby.addressUnknown')}</p>
                            <div className="price">
                                <span>{t('priceLabel')}</span>
                                <strong>{restaurant.priceLevel
                                    ? t(`priceLevels.${restaurant.priceLevel}`) : t('nearby.priceUnknown')}</strong>
                            </div>
                            {safeLink(restaurant.googleMapsUrl) && (
                                <p className="restaurant-map-link">
                                    <a href={safeLink(restaurant.googleMapsUrl)} target="_blank" rel="noopener noreferrer">
                                        {t('nearby.maps')}
                                    </a>
                                </p>
                            )}
                            {userId && <SaveRestaurantButtons userId={userId}
                                placeId={restaurant.id} onSaved={onSaved} />}
                            {restaurant.attributions?.map((attribution, index) => (
                                <p key={index}>
                                    {safeLink(attribution.providerUri)
                                        ? <a href={safeLink(attribution.providerUri)} target="_blank" rel="noopener noreferrer">
                                            {attribution.provider || attribution.providerUri}
                                        </a>
                                        : attribution.provider}
                                </p>
                            ))}
                        </div>
                    </article>
                ))}
            </div>
        </section>
    )
}
