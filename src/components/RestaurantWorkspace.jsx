import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import AuthPanel from './AuthPanel'
import RestaurantSearch from './RestaurantSearch'
import SavedRestaurants from './SavedRestaurants'
import SearchHistory from './SearchHistory'

const initialSearch = { category: '', priceLevel: '', location: null }

export default function RestaurantWorkspace({ view, placeId }) {
    const { t } = useTranslation()
    const [userId, setUserId] = useState(null)
    const [sessionReady, setSessionReady] = useState(!supabase)
    const [revision, setRevision] = useState(0)
    const [search, setSearch] = useState(initialSearch)
    const previousUser = useRef(null)

    useEffect(() => {
        if (!supabase) return
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user.id || null
            // Preserve the chosen location on first login, clear it on logout/account changes.
            if (previousUser.current && previousUser.current !== nextUser) setSearch(initialSearch)
            previousUser.current = nextUser
            setUserId(nextUser)
            setSessionReady(true)
        })
        return () => data.subscription.unsubscribe()
    }, [])

    return <>
        <div hidden={view !== 'explore'}>
            {!placeId && sessionReady && !userId && import.meta.env.VITE_USE_HOSTED_BACKEND === 'true' && <p className="signin-prompt">
                <a href="#account">{t('auth.searchPrompt')}</a>
            </p>}
            <RestaurantSearch key={userId || 'guest'} userId={userId}
                active={view === 'explore' && !placeId} placeId={view === 'explore' ? placeId : null} search={search} setSearch={setSearch}
                onSaved={() => setRevision((value) => value + 1)} />
        </div>
        <section id="saved-restaurants" hidden={view !== 'lists'}
            className="restaurants-section" aria-labelledby="lists-title">
            <h1 hidden={Boolean(placeId && userId)} id="lists-title" className="screen-title" tabIndex={-1}>{t('lists.title')}</h1>
            {userId
                ? <SavedRestaurants key={`${userId}:${revision}`} userId={userId} placeId={view === 'lists' ? placeId : null} />
                : <p><a href="#account">{t('lists.signin')}</a></p>}
        </section>
        <div hidden={view !== 'account'}>
            <AuthPanel />
            {userId && import.meta.env.VITE_USE_HOSTED_BACKEND === 'true' &&
                <details className="account-preferences">
                    <summary>{t('history.title')}</summary>
                    <SearchHistory key={userId} userId={userId} />
                </details>}
        </div>
    </>
}
