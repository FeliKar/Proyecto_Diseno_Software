import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { historyRequest } from '../lib/search-history.mjs'

export default function SearchHistory({ userId }) {
    const { t } = useTranslation()
    const busy = useRef(false)
    const [loading, setLoading] = useState(false)
    const [cleared, setCleared] = useState(false)
    const [error, setError] = useState('')
    const [confirmClear, setConfirmClear] = useState(false)

    async function clear() {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setCleared(false)
        try {
            const options = await getHostedOptions('search-history', userId)
            await historyRequest('clear', options)
            setCleared(true)
            setConfirmClear(false)
        } catch (failure) {
            setError(failure.message)
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    return <section className="restaurants-section" aria-labelledby="preferences-title">
        <h2 id="preferences-title">{t('history.title')}</h2>
        <p>{t('history.description')}</p>
        {!confirmClear && <button type="button" className="clear-filters"
            onClick={() => { setConfirmClear(true); setCleared(false); setError('') }}>
            {t('history.clear')}
        </button>}
        {confirmClear && <div>
            <p>{t('history.confirm')}</p>
            <div className="filters">
                <button type="button" className="clear-filters" disabled={loading}
                    onClick={clear}>{t('history.clear')}</button>
                <button type="button" className="clear-filters" disabled={loading}
                    onClick={() => setConfirmClear(false)}>{t('history.cancel')}</button>
            </div>
        </div>}
        {loading && <p role="status">{t('history.loading')}</p>}
        {error && <p role="alert" className="auth-error">{t(`history.${error}`)}</p>}
        {cleared && <p role="status">{t('history.cleared')}</p>}
    </section>
}
