export function authErrorKey(error) {
    const messages = {
        invalid_credentials: 'invalidCredentials',
        email_not_confirmed: 'emailNotConfirmed',
        weak_password: 'weakPassword',
        same_password: 'samePassword',
        over_email_send_rate_limit: 'rateLimit',
        over_request_rate_limit: 'rateLimit',
        otp_expired: 'expiredLink',
        access_denied: 'cancelled',
    }

    if (
        error?.name === 'AuthRetryableFetchError' ||
        error instanceof TypeError
    ) {
        return 'auth.errors.network'
    }

    return `auth.errors.${messages[error?.code] || 'generic'}`
}