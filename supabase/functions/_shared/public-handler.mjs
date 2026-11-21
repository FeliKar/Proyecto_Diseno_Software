import { validateSearch } from './places.mjs'

export function createPublicHandler({
    verifyUser,
    consumeQuota,
    placesHandler,
    allowedOrigins,
}) {
    return async (request) => {
        const origin = request.headers.get('Origin')

        const headers = {
            'Cache-Control': 'no-store',
            Vary: 'Origin',
            ...(allowedOrigins.includes(origin)
                ? { 'Access-Control-Allow-Origin': origin }
                : {}),
            'Access-Control-Allow-Headers':
                'authorization, apikey, content-type, x-client-info',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
        }

        const json = (error, status) =>
            Response.json({ error }, { status, headers })

        if (origin && !allowedOrigins.includes(origin)) {
            return json('origin_not_allowed', 403)
        }

        // El navegador comprueba los permisos antes de enviar la búsqueda.
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers })
        }

        if (request.method !== 'POST') {
            return json('method_not_allowed', 405)
        }

        const authorization = request.headers.get('Authorization') || ''

        if (!authorization.startsWith('Bearer ')) {
            return json('signin', 401)
        }

        try {
            const user = await verifyUser(authorization)

            if (!user?.id || user.is_anonymous) {
                return json('signin', 401)
            }

            const contentType = request.headers
                .get('Content-Type')
                ?.split(';')[0]
                .trim()

            if (contentType !== 'application/json') {
                return json('json_required', 415)
            }

            const raw = await request.text()

            if (raw.length > 4096) {
                return json('invalid_search', 413)
            }

            let filters

            try {
                filters = validateSearch(JSON.parse(raw))
            } catch {
                return json('invalid_search', 400)
            }

            if (!await consumeQuota(user.id)) {
                return json('rate_limit', 429)
            }

            // Reutiliza la búsqueda existente después de validar el acceso.
            const response = await placesHandler(
                new Request('http://internal/api/restaurants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(filters),
                }),
            )

            return new Response(response.body, {
                status: response.status,
                headers: {
                    ...Object.fromEntries(response.headers),
                    ...headers,
                },
            })
        } catch {
            // Si falla la autenticación o el contador, no se consulta Google.
            return json('service_unavailable', 503)
        }
    }
}