import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
    supabase,
    callbackError,
} from '../lib/supabase'
import { authErrorKey } from '../lib/auth-errors.mjs'

export default function AuthPanel() {
    const { t } = useTranslation()

    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(Boolean(supabase))
    const [mode, setMode] = useState('signin')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState(
        callbackError ? authErrorKey({ code: callbackError }) : ''
    )

    useEffect(() => {
        if (!supabase) return

        let active = true
        let receivedEvent = false

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (!active) return

            receivedEvent = true
            setSession(nextSession)
            setLoading(false)

            if (event === 'SIGNED_OUT') {
                setMode('signin')
            }
        })

        supabase.auth.getSession()
            .then(({ data, error: sessionError }) => {
                if (!active || receivedEvent) return

                setSession(data.session)
                setLoading(false)

                if (sessionError) {
                    setError(authErrorKey(sessionError))
                }
            })
            .catch((sessionError) => {
                if (!active) return

                setLoading(false)
                setError(authErrorKey(sessionError))
            })

        return () => {
            active = false
            subscription.unsubscribe()
        }
    }, [])

    function changeMode(nextMode) {
        setMode(nextMode)
        setError('')
    }

    async function submit(event) {
        event.preventDefault()

        if (busy) return

        const form = event.currentTarget
        const fields = new FormData(form)
        const email = String(fields.get('email') || '').trim()
        const password = String(fields.get('password') || '')

        if (
            mode === 'signup' &&
            password !== fields.get('confirmation')
        ) {
            setError('auth.errors.passwordMismatch')
            return
        }

        setBusy(true)
        setError('')

        try {
            const result = mode === 'signup'
                ? await supabase.auth.signUp({ email, password })
                : await supabase.auth.signInWithPassword({ email, password })

            if (result.error) throw result.error
            if (!result.data.session) throw new Error('session_missing')

            form.reset()
        } catch (requestError) {
            setError(authErrorKey(requestError))
        } finally {
            setBusy(false)
        }
    }

    async function googleLogin() {
        setBusy(true)
        setError('')

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            })

            if (error) throw error
        } catch (requestError) {
            setError(authErrorKey(requestError))
        } finally {
            setBusy(false)
        }
    }

    async function logout() {
        setBusy(true)
        setError('')

        try {
            const { error } = await supabase.auth.signOut({
                scope: 'local',
            })

            if (error) throw error

            window.history.replaceState(
                null,
                '',
                `${window.location.pathname}#account`,
            )
        } catch (requestError) {
            setError(authErrorKey(requestError))
        } finally {
            setBusy(false)
        }
    }

    const signedIn = Boolean(session)

    return (
        <section
            id="account"
            className="auth-panel"
            aria-labelledby="account-title"
            aria-busy={loading || busy}
        >
            <h1 id="account-title" className="screen-title" tabIndex={-1}>{t('auth.title')}</h1>

            {!supabase ? (
                <p>{t('auth.notConfigured')}</p>
            ) : loading ? (
                <p role="status">{t('auth.loading')}</p>
            ) : (
                <>
                    {signedIn ? (
                        <div className="auth-account">
                            <p>
                                {t('auth.signedIn', {
                                    email: session.user.email || t('auth.account'),
                                })}
                            </p>

                            <div className="auth-actions">
                                <a className="auth-submit action-link" href="#restaurants">{t('usability.explore')}</a>
                                <button
                                    className="clear-filters"
                                    type="button"
                                    disabled={busy}
                                    onClick={logout}
                                >
                                    {t('auth.signout')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3>{t(`auth.${mode}`)}</h3>

                            <form key={mode} onSubmit={submit}>
                                <fieldset disabled={busy}>
                                    <div className="search-field">
                                        <label htmlFor="auth-email">
                                            {t('auth.email')}
                                        </label>

                                        <input
                                            id="auth-email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>

                                    <div className="search-field">
                                        <label htmlFor="auth-password">
                                            {t('auth.password')}
                                        </label>

                                        <input
                                            id="auth-password"
                                            name="password"
                                            type="password"
                                            autoComplete={
                                                mode === 'signin'
                                                    ? 'current-password'
                                                    : 'new-password'
                                            }
                                            minLength={mode === 'signin' ? 1 : 8}
                                            required
                                            aria-describedby={
                                                mode === 'signin'
                                                    ? undefined
                                                    : 'password-hint'
                                            }
                                        />

                                        {mode !== 'signin' && (
                                            <small id="password-hint">
                                                {t('auth.passwordHint')}
                                            </small>
                                        )}
                                    </div>

                                    {mode === 'signup' && (
                                        <div className="search-field">
                                            <label htmlFor="auth-confirmation">
                                                {t('auth.confirmPassword')}
                                            </label>

                                            <input
                                                id="auth-confirmation"
                                                name="confirmation"
                                                type="password"
                                                autoComplete="new-password"
                                                minLength={8}
                                                required
                                            />
                                        </div>
                                    )}

                                    <button
                                        className="auth-submit"
                                        type="submit"
                                    >
                                        {t(
                                            busy
                                                ? 'auth.working'
                                                : `auth.${mode}`,
                                        )}
                                    </button>
                                </fieldset>
                            </form>

                            <div className="auth-actions">
                                <button className="clear-filters" type="button"
                                    disabled={busy} onClick={googleLogin}>
                                    {t('auth.google')}
                                </button>
                                <button className="auth-link" type="button" disabled={busy}
                                    onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}>
                                    {t(mode === 'signin' ? 'auth.signup' : 'auth.backToLogin')}
                                </button>
                            </div>
                        </>
                    )}

                    <p className="auth-error" role="alert">
                        {error ? t(error) : ''}
                    </p>
                </>
            )}
        </section>
    )
}
