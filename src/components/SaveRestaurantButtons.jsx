import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { savedRequest } from '../lib/saved-restaurants.mjs'

export default function SaveRestaurantButtons({ userId, placeId, onSaved }) {
    const { t } = useTranslation()
    const busy = useRef(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState('')
    const [error, setError] = useState('')

    async function save(status) {
        if (busy.current) return
        busy.current = true
        setSaving(true)
        setError('')
        setSaved('')
        try {
            const options = await getHostedOptions('saved-restaurants', userId)
            await savedRequest({ action: 'save', placeId, status }, options)
            setSaved(status)
            onSaved()
        } catch (failure) {
            setError(failure.message === 'signin' ? 'signin' : 'service')
        } finally {
            busy.current = false
            setSaving(false)
        }
    }

    return <div className="saved-actions">
        <div className="filters">
            {['wishlist', 'visited'].map((status) => <button key={status} type="button"
                className="clear-filters" disabled={saving} onClick={() => save(status)}>
                {t(`lists.${status}`)}
            </button>)}
        </div>
        {saving && <p role="status">{t('lists.working')}</p>}
        {saved && <p role="status">{t('lists.saved', { list: t(`lists.${saved}`) })}{' '}
            <a href="#saved-restaurants">{t('lists.title')}</a></p>}
        {error && <p role="alert" className="auth-error">{t(`lists.${error}`)}</p>}
    </div>
}
