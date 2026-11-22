import { createHandler } from '../_shared/places.mjs'
import { createPublicHandler } from '../_shared/public-handler.mjs'
import { verifyUser, consumeQuota, allowedOrigins, url, publicKey } from '../_shared/access.ts'
import { createHistoryStore, createPersonalSearchHandler, validatePersonalSearch } from '../_shared/history.mjs'

Deno.serve(createPublicHandler({
    verifyUser,
    validateInput: validatePersonalSearch,
    consumeQuota,
    allowedOrigins,
    placesHandler: createPersonalSearchHandler({
        placesHandler: createHandler({ apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY') }),
        store: createHistoryStore({ supabaseUrl: url, publicKey }),
    }),
}))
