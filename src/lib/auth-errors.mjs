export function authErrorKey(error) {
    const messages = {
        invalid_credentials: 'invalidCredentials',
        user_already_exists: 'accountExists',
        email_exists: 'accountExists',
        email_not_confirmed: 'emailNotConfirmed',
        weak_password: 'weakPassword',
        over_request_rate_limit: 'rateLimit',
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
