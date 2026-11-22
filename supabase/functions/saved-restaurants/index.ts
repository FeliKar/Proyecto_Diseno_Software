import { createPublicHandler } from '../_shared/public-handler.mjs'
import { createSavedHandler, validateSavedRequest } from '../_shared/saved-restaurants.mjs'
import { verifyUser, consumeQuota, allowedOrigins, url, publicKey } from '../_shared/access.ts'

Deno.serve(createPublicHandler({
    verifyUser,
    allowedOrigins,
    validateInput: validateSavedRequest,
    // Only opening a list calls Google; moving/removing entries remains available.
    consumeQuota: (userId: string, input: { action: string }) =>
        input.action !== 'list' || consumeQuota(userId),
    placesHandler: createSavedHandler({
        supabaseUrl: url,
        publicKey,
        apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY'),
    }),
}))
