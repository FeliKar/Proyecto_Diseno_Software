import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LocationPicker from './LocationPicker'
import RestaurantMap from './RestaurantMap'
import RestaurantPage from './RestaurantPage'
import RestaurantCard from './RestaurantCard'
import SaveRestaurantButtons from './SaveRestaurantButtons'
import { getLocation, searchRestaurants } from '../lib/restaurant-search.mjs'
import { getHostedOptions, getSearchOptions } from '../lib/search-session'

export default function RestaurantSearch({ userId, onSaved, active, placeId, search, setSearch }) {
    const { t, i18n } = useTranslation()
    const { category, priceLevel, location } = search
    const [restaurants, setRestaurants] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showMap, setShowMap] = useState(false)
    const [showResultsMap, setShowResultsMap] = useState(false)
    const busy = useRef(false)
    const hosted = import.meta.env.VITE_USE_HOSTED_BACKEND === 'true'
    const [recommendation, setRecommendation] = useState(null)
    const [historyWarning, setHistoryWarning] = useState(false)

    function updateSearch(values) {
        setSearch((current) => ({ ...current, ...values }))
    }

    function resetResults() {
        setRestaurants(null)
        setShowResultsMap(false)
        setError('')
        setRecommendation(null)
        setHistoryWarning(false)
    }

    function clearFilters() {
        updateSearch({ category: '', priceLevel: '' })
        resetResults()
    }

    async function handleSearch(event, useDevice = false, mode = 'search') {
        event.preventDefault()
        if (busy.current) return
        if (hosted && !userId) {
            window.location.hash = 'account'
            return
        }
        busy.current = true
        setLoading(true)
        resetResults()
        try {
            const options = hosted
                ? await getHostedOptions('restaurants', userId)
                : await getSearchOptions()

            // The search keeps the selected point when the filters change.
            const point = useDevice || !location
                ? await getLocation()
                : location

            updateSearch({ location: point })

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

    if (placeId) {
        const restaurant = restaurants?.find((item) => item.id === placeId)
        return <RestaurantPage restaurant={restaurant} userId={userId} backHref="#restaurants">
            {restaurant && userId && <SaveRestaurantButtons key={`${placeId}:${userId}`}
                userId={userId} placeId={placeId} onSaved={onSaved} />}
        </RestaurantPage>
    }

    return (
        <section id="restaurants" className="restaurants-section" aria-labelledby="restaurants-title">
            <div className="section-heading">
                <h1 id="restaurants-title" className="screen-title" tabIndex={-1}>{t('nearby.title')}</h1>
                <p>{t('nearby.description')}</p>
            </div>

            <form onSubmit={(event) => handleSearch(event)} className="restaurant-search">
                <fieldset disabled={loading}>
                    <div className="search-location">
                        <h2 className="control-heading">{t('usability.location')}</h2>
                        <div className="filters location-actions">
                            <button type="button" className="clear-filters" aria-expanded={showMap}
                                aria-controls={showMap && active ? 'search-location-map' : undefined} onClick={() => setShowMap(!showMap)}>
                                {t(showMap ? 'locationPicker.close' : location ? 'usability.changeLocation' : 'locationPicker.open')}
                            </button>
                            {location && <button type="button" className="clear-filters"
                                onClick={(event) => handleSearch(event, true)}>{t('locationPicker.device')}</button>}
                        </div>
                        <p className="search-hint">{t(location ? 'locationPicker.selected' : 'nearby.initial')}</p>
                        {showMap && active && <div id="search-location-map">
                            <LocationPicker initialLocation={location} onSelect={(point) => {
                                updateSearch({ location: point })
                                setShowMap(false)
                                resetResults()
                            }} />
                        </div>}
                    </div>
                    <h2 className="control-heading">{t('usability.filters')}</h2>
                    <div className="filters">
                        <div className="filter-field">
                            <label htmlFor="category-filter">{t('categoryLabel')}</label>
                            <select id="category-filter" value={category}
                                onChange={(event) => { updateSearch({ category: event.target.value }); resetResults() }}>
                                <option value="">{t('allCategories')}</option>
                                {['vegetarian', 'italian', 'seafood'].map((value) => (
                                    <option key={value} value={value}>{t(`categories.${value}`)}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-field">
                            <label htmlFor="price-filter">{t('priceLabel')}</label>
                            <select id="price-filter" value={priceLevel}
                                onChange={(event) => { updateSearch({ priceLevel: event.target.value }); resetResults() }}>
                                <option value="">{t('allPrices')}</option>
                                {['inexpensive', 'moderate', 'expensive'].map((value) => (
                                    <option key={value} value={value}>{t(`priceLevels.${value}`)}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(category || priceLevel) && <button type="button" className="auth-link reset-search"
                        onClick={clearFilters}>{t('clearFilters')}</button>}
                    <div className="search-actions">
                        <button type="submit" className="auth-submit">
                            {t(loading ? 'nearby.loading' : 'usability.search')}
                        </button>
                        {hosted && <button type="button" className="clear-filters"
                            onClick={(event) => handleSearch(event, false, 'recommend')}>
                            {t('recommendations.submit')}
                        </button>}
                    </div>
                    {hosted && <p className="search-hint recommendation-hint">{t('recommendations.help')}</p>}
                </fieldset>
            </form>

            {loading && <p role="status">{t('nearby.loading')}</p>}
            {!loading && !error && restaurants?.length === 0 &&
                <p role="status">{t('nearby.empty')}</p>}
            {error && <p role="alert" className="auth-error">{t(`nearby.errors.${error}`)}</p>}
            {historyWarning && <p role="status">{t('history.saveFailed')}</p>}
            {recommendation && <p role="status">
                {!recommendation.hasHistory && !recommendation.hasRatings
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

            {restaurants?.length > 0 && <h2 className="results-title">{t(recommendation ? 'usability.recommended' : 'usability.results')}</h2>}
            {restaurants !== null && <p className="maps-attribution" translate="no">Google Maps</p>}
            {restaurants?.length > 0 && <div className="results-map-toggle">
                <button type="button" className="clear-filters" aria-expanded={showResultsMap}
                    onClick={() => setShowResultsMap((value) => !value)}>
                    {t(showResultsMap ? 'restaurantMap.close' : 'restaurantMap.open')}
                </button>
                {showResultsMap && active && <RestaurantMap restaurants={restaurants} />}
            </div>}
            <div className="restaurant-grid" aria-busy={loading}>
                {restaurants?.map((restaurant, index) => <RestaurantCard
                    key={restaurant.id} restaurant={restaurant} number={index + 1} showPhoto
                    href={`#restaurants/${restaurant.id}`} />)}
            </div>
        </section>
    )
}
