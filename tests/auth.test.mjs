import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { authErrorKey } from '../src/lib/auth-errors.mjs'

const es = JSON.parse(
    await readFile(
        new URL('../src/locales/es.json', import.meta.url),
    ),
)

const en = JSON.parse(
    await readFile(
        new URL('../src/locales/en.json', import.meta.url),
    ),
)

function keys(value, prefix = '') {
    return Object.entries(value).flatMap(([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key

        return typeof child === 'object'
            ? keys(child, path)
            : [path]
    }).sort()
}

test('both languages cover the same interface', () => {
    assert.deepEqual(keys(es), keys(en))
})

test(
    'authentication failures have translated messages, without leaking server details',
    () => {
        const codes = {
            invalid_credentials: 'invalidCredentials',
            email_not_confirmed: 'emailNotConfirmed',
            weak_password: 'weakPassword',
            same_password: 'samePassword',
            over_email_send_rate_limit: 'rateLimit',
            over_request_rate_limit: 'rateLimit',
            otp_expired: 'expiredLink',
            access_denied: 'cancelled',
            unknown: 'generic',
        }

        for (const [code, expected] of Object.entries(codes)) {
            const key = authErrorKey({
                code,
                message: 'internal server detail',
            })

            assert.equal(key, `auth.errors.${expected}`)
            assert.ok(keys(es).includes(key))
            assert.ok(keys(en).includes(key))
        }

        assert.equal(
            authErrorKey(null),
            'auth.errors.generic',
        )

        assert.equal(
            authErrorKey(new TypeError('Failed to fetch')),
            'auth.errors.network',
        )

        assert.equal(
            authErrorKey({ name: 'AuthRetryableFetchError' }),
            'auth.errors.network',
        )
    },
)