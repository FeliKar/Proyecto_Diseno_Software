import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { savedRequest } from '../lib/saved-restaurants.mjs'
import { safeLink } from '../lib/restaurant-search.mjs'

export default function SavedRestaurants({ userId }) {
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
        })
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
            {!page.restaurants.length && <p role="status">{t('lists.empty')}</p>}
            {page.restaurants.length > 0 && <p>{t('nearby.source')}</p>}
            <div className="restaurant-grid" aria-busy={loading}>
                {page.restaurants.map((restaurant, index) => <article className="restaurant-card" key={restaurant.id}>
                    <div className="restaurant-content">
                        <h3>{restaurant.name || t('lists.unknown', { number: offset + index + 1 })}</h3>
                        {!restaurant.name && <p>{t('lists.detailsUnavailable')}</p>}
                        {restaurant.address && <p>{restaurant.address}</p>}
                        {safeLink(restaurant.googleMapsUrl) && <p>
                            <a href={safeLink(restaurant.googleMapsUrl)} target="_blank" rel="noopener noreferrer">
                                {t('nearby.maps')}
                            </a>
                        </p>}
                        <div className="filters">
                            <button type="button" className="clear-filters" disabled={loading}
                                onClick={() => change(restaurant, 'save')}>
                                {t('lists.move', { list: t(`lists.${status === 'wishlist' ? 'visited' : 'wishlist'}`) })}
                            </button>
                            <button type="button" className="clear-filters" disabled={loading}
                                onClick={() => change(restaurant, 'remove')}>{t('lists.remove')}</button>
                        </div>
                        {restaurant.attributions?.map((item, index) => <p key={index}>
                            {safeLink(item.providerUri)
                                ? <a href={safeLink(item.providerUri)} target="_blank" rel="noopener noreferrer">
                                    {item.provider || item.providerUri}</a>
                                : item.provider}
                        </p>)}
                    </div>
                </article>)}
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
