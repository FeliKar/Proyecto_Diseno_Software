import { createHandler, validateSearch } from '../_shared/places.mjs'
import { createPublicHandler } from '../_shared/public-handler.mjs'
import { verifyUser, consumeQuota, allowedOrigins } from '../_shared/access.ts'

Deno.serve(createPublicHandler({
    verifyUser,
    validateInput: validateSearch,
    consumeQuota,
    allowedOrigins,
    placesHandler: createHandler({ apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY') }),
}))
