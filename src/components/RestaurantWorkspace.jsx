import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import RestaurantSearch from './RestaurantSearch'
import SavedRestaurants from './SavedRestaurants'

export default function RestaurantWorkspace() {
    const { t } = useTranslation()
    const [userId, setUserId] = useState(null)
    const [revision, setRevision] = useState(0)

    useEffect(() => {
        if (!supabase) return
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user.id || null)
        })
        return () => data.subscription.unsubscribe()
    }, [])

    return <>
        <RestaurantSearch key={userId || 'guest'} userId={userId}
            onSaved={() => setRevision((value) => value + 1)} />
        <section id="saved-restaurants" className="restaurants-section" aria-labelledby="lists-title">
            <h2 id="lists-title">{t('lists.title')}</h2>
            {userId
                ? <SavedRestaurants key={`${userId}:${revision}`} userId={userId} />
                : <p>{t('lists.signin')}</p>}
        </section>
    </>
}
