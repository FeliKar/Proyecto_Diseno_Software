import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { savedRequest } from '../lib/saved-restaurants.mjs'
import RatingForm from './RatingForm'
import RestaurantPage from './RestaurantPage'
import RestaurantCard from './RestaurantCard'
import ShareListControls from './ShareListControls'

export default function SavedRestaurants({ userId, placeId }) {
    const { t, i18n } = useTranslation()
    const busy = useRef(false)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState('wishlist')
    const [offset, setOffset] = useState(0)
    const [page, setPage] = useState(null)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    async function run(operation) {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setNotice('')
        try {
            const options = await getHostedOptions('saved-restaurants', userId)
            await operation(options)
        } catch (failure) {
            setError(['signin', 'rateLimit'].includes(failure.message) ? failure.message : 'service')
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    function openList(nextStatus = status, nextOffset = 0) {
        run(async (options) => {
            setPage(null)
            setStatus(nextStatus)
            setOffset(nextOffset)
            const data = await savedRequest({
                action: 'list', status: nextStatus, offset: nextOffset,
                language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es'
            }, options)
            setPage(data)
        })
    }

    function change(restaurant, action) {
        run(async (options) => {
            await savedRequest({
                action, placeId: restaurant.id,
                ...(action === 'save' ? { status: status === 'wishlist' ? 'visited' : 'wishlist' } : {}),
            }, options)
            setPage((current) => ({
                ...current,
                restaurants: current.restaurants.filter((item) => item.id !== restaurant.id)
            }))
            setNotice(action === 'remove' ? 'removed' : 'moved')
            window.location.hash = 'saved-restaurants'
        })
    }

    function rate(restaurant, values) {
        return run(async (options) => {
            await savedRequest({ action: 'rate', placeId: restaurant.id, ...values }, options)
            setPage((current) => ({
                ...current,
                restaurants: current.restaurants.map((item) => item.id === restaurant.id
                    ? {
                        ...item, userRating: values.rating,
                        userCategory: values.category, userPriceLevel: values.priceLevel
                    }
                    : item),
            }))
            setNotice('ratingSaved')
        })
    }

    if (placeId) {
        const restaurant = page?.restaurants.find((item) => item.id === placeId)
        return <RestaurantPage restaurant={restaurant} userId={userId} backHref="#saved-restaurants">
            {restaurant && <>
                {loading && <p role="status">{t('lists.working')}</p>}
                {error && <p role="alert" className="auth-error">{t(`lists.${error}`)}</p>}
                {notice && <p role="status">{t(`lists.${notice}`)}</p>}
                {status === 'visited' && <RatingForm
                    key={`${restaurant.id}:${restaurant.userRating}:${restaurant.userCategory}:${restaurant.userPriceLevel}`}
                    restaurant={restaurant} disabled={loading}
                    onSave={(values) => rate(restaurant, values)} />}
                <div className="filters">
                    <button type="button" className="clear-filters" disabled={loading}
                        onClick={() => change(restaurant, 'save')}>
                        {t('lists.move', { list: t(`lists.${status === 'wishlist' ? 'visited' : 'wishlist'}`) })}
                    </button>
                    <button type="button" className="clear-filters" disabled={loading}
                        onClick={() => change(restaurant, 'remove')}>{t('lists.remove')}</button>
                </div>
            </>}
        </RestaurantPage>
    }

    return <>
        <p>{t('lists.help')}</p>
        <div className="filters">
            {['wishlist', 'visited'].map((value) => <button key={value} type="button"
                className="clear-filters" disabled={loading}
                aria-pressed={page !== null && status === value} onClick={() => openList(value)}>
                {t(`lists.${value}`)}
            </button>)}
        </div>
        {loading && <p role="status">{t('lists.working')}</p>}
        {error && <p role="alert" className="auth-error">{t(`lists.${error}`)}</p>}
        {notice && <p role="status">{t(`lists.${notice}`)}</p>}
        {page && <>
            <h3>{t(`lists.${status}`)}</h3>
            <ShareListControls key={`${userId}:${status}`} userId={userId} status={status} />
            {!page.restaurants.length && <p role="status">{t('lists.empty')}</p>}
            {page.restaurants.length > 0 && <p className="maps-attribution" translate="no">Google Maps</p>}
            <div className="restaurant-grid" aria-busy={loading}>
                {page.restaurants.map((restaurant, index) => <RestaurantCard
                    key={restaurant.id} restaurant={restaurant}
                    number={restaurant.name ? undefined : offset + index + 1}
                    href={`#saved-restaurants/${restaurant.id}`} />)}
            </div>
        </>}
        {(page || error) && <div className="filters saved-pagination">
            <button type="button" className="clear-filters" disabled={loading}
                onClick={() => openList(status, offset)}>{t('lists.refresh')}</button>
            {offset > 0 && <button type="button" className="clear-filters" disabled={loading}
                onClick={() => openList(status, Math.max(0, offset - 5))}>{t('lists.previous')}</button>}
            {page?.hasMore && <button type="button" className="clear-filters" disabled={loading}
                onClick={() => openList(status, offset + page.restaurants.length)}>{t('lists.next')}</button>}
        </div>}
    </>
}
