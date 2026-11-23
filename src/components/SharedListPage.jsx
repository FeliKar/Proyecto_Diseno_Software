import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { sharingRequest } from '../lib/sharing.mjs'
import { safeLink } from '../lib/restaurant-search.mjs'

export default function SharedListPage({ token }) {
    const { t, i18n } = useTranslation()
    const busy = useRef(false)
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(null)
    const [offset, setOffset] = useState(0)
    const [error, setError] = useState('')

    async function open(nextOffset = 0) {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setPage(null)
        setOffset(nextOffset)
        try {
            const baseUrl = import.meta.env.VITE_SUPABASE_URL
            if (!baseUrl) throw new Error('service')
            const data = await sharingRequest({
                token, offset: nextOffset,
                language: i18n.resolvedLanguage?.startsWith('en') ? 'en' : 'es'
            }, {
                url: `${baseUrl.replace(/\/$/, '')}/functions/v1/shared-list`,
                publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            })
            setPage(data)
        } catch (failure) {
            setError(failure.message)
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    return <>
        <header className="site-header">
            <div className="container header-content shared-header">
                <a className="brand" href={window.location.pathname}>{t('appName')}</a>
                <label className="language-control">
                    <span>{t('language')}</span>
                    <select value={i18n.resolvedLanguage}
                        onChange={(event) => i18n.changeLanguage(event.target.value)}>
                        <option value="es">Español</option>
                        <option value="en">English</option>
                    </select>
                </label>
            </div>
        </header>
        <main className="container">
            <section className="restaurants-section" aria-labelledby="shared-title">
                <h1 id="shared-title" className="screen-title">{t('sharing.title')}</h1>
                <p>{t('sharing.readOnly')}</p>
                <button type="button" className="clear-filters" disabled={loading}
                    onClick={() => open(offset)}>{t(page ? 'lists.refresh' : 'sharing.open')}</button>
                {loading && <p role="status">{t('sharing.loading')}</p>}
                {error && <p role="alert" className="auth-error">{t(`sharing.${error}`)}</p>}
                {page && <>
                    <h2>{t(`lists.${page.status}`)}</h2>
                    {!page.restaurants.length && <p>{t('lists.empty')}</p>}
                    {page.restaurants.length > 0 && <p className="maps-attribution" translate="no">Google Maps</p>}
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
                                {restaurant.attributions?.map((item, index) => <p key={index}>
                                    {safeLink(item.providerUri)
                                        ? <a href={safeLink(item.providerUri)} target="_blank" rel="noopener noreferrer">
                                            {item.provider || item.providerUri}</a>
                                        : item.provider}
                                </p>)}
                            </div>
                        </article>)}
                    </div>
                    <div className="filters saved-pagination">
                        {offset > 0 && <button type="button" className="clear-filters" disabled={loading}
                            onClick={() => open(Math.max(0, offset - 5))}>{t('lists.previous')}</button>}
                        {page.hasMore && <button type="button" className="clear-filters" disabled={loading}
                            onClick={() => open(offset + 5)}>{t('lists.next')}</button>}
                    </div>
                </>}
            </section>
        </main>
    </>
}
