export const url = Deno.env.get('SUPABASE_URL')!

const publishableKeys = JSON.parse(
    Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}',
)

const secretKeys = JSON.parse(
    Deno.env.get('SUPABASE_SECRET_KEYS') || '{}',
)

export const publicKey =
    publishableKeys.default || Deno.env.get('SUPABASE_ANON_KEY')

export const serverKey =
    secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

export async function verifyUser(authorization: string) {
    const response = await fetch(`${url}/auth/v1/user`, {
        headers: {
            apikey: publicKey,
            Authorization: authorization,
        },
        signal: AbortSignal.timeout(5000),
    })

    if (response.status === 401 || response.status === 403) {
        return null
    }

    if (!response.ok) {
        throw new Error('auth_unavailable')
    }

    return response.json()
}

export async function consumeQuota(userId: string) {
    const response = await fetch(
        `${url}/rest/v1/rpc/consume_restaurant_search`,
        {
            method: 'POST',
            headers: {
                apikey: serverKey,

                // Las claves antiguas service_role también utilizan este encabezado.
                ...(serverKey?.startsWith('eyJ')
                    ? { Authorization: `Bearer ${serverKey}` }
                    : {}),

                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ p_user_id: userId }),
            signal: AbortSignal.timeout(5000),
        },
    )

    if (!response.ok) {
        throw new Error('quota_unavailable')
    }

    const allowed = await response.json()

    if (typeof allowed !== 'boolean') {
        throw new Error('invalid_quota_response')
    }

    return allowed
}

export const allowedOrigins = [
    'http://localhost:5173',
    'https://proyectodisenosoftware.vercel.app',
]
