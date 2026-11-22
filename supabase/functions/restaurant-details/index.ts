import { createPublicHandler } from '../_shared/public-handler.mjs'
import { createDetailsHandler, validateDetails } from '../_shared/restaurant-details.mjs'
import { verifyUser, consumeQuota, allowedOrigins } from '../_shared/access.ts'

Deno.serve(createPublicHandler({
    verifyUser, consumeQuota, allowedOrigins,
    validateInput: validateDetails,
    placesHandler: createDetailsHandler({ apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY') }),
}))
