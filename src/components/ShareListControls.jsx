import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getHostedOptions } from '../lib/search-session'
import { sharingRequest } from '../lib/sharing.mjs'

export default function ShareListControls({ userId, status }) {
    const { t } = useTranslation()
    const busy = useRef(false)
    const [loading, setLoading] = useState(false)
    const [link, setLink] = useState('')
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    async function manage(action) {
        if (busy.current) return
        busy.current = true
        setLoading(true)
        setError('')
        setNotice('')
        try {
            const options = await getHostedOptions('sharing', userId)
            const data = await sharingRequest({ action, status }, options)
            if (action === 'share') {
                const url = new URL(window.location.pathname, window.location.origin)
                url.searchParams.set('list', data.token)
                setLink(url.href)
            } else {
                setLink('')
                setNotice('revoked')
            }
        } catch (failure) {
            setError(failure.message)
        } finally {
            busy.current = false
            setLoading(false)
        }
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(link)
            setNotice('copied')
        } catch {
            setNotice('manualCopy')
        }
    }

    return <div>
        <p>{t('sharing.help')}</p>
        <div className="filters">
            <button type="button" className="clear-filters" disabled={loading}
                onClick={() => manage('share')}>{t('sharing.create')}</button>
            <button type="button" className="clear-filters" disabled={loading}
                onClick={() => manage('revoke')}>{t('sharing.revoke')}</button>
        </div>
        {link && <div className="filter-field">
            <label htmlFor={`share-link-${status}`}>{t('sharing.link')}</label>
            <input id={`share-link-${status}`} readOnly value={link}
                onFocus={(event) => event.target.select()} />
            <button type="button" className="clear-filters" onClick={copy}>{t('sharing.copy')}</button>
        </div>}
        {loading && <p role="status">{t('sharing.loading')}</p>}
        {notice && <p role="status">{t(`sharing.${notice}`)}</p>}
        {error && <p role="alert" className="auth-error">{t(`sharing.${error}`)}</p>}
    </div>
}
