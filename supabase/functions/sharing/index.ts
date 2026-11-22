import { createPublicHandler } from '../_shared/public-handler.mjs'
import { createSharingHandler, validateSharing } from '../_shared/sharing.mjs'
import { verifyUser, allowedOrigins, url, publicKey } from '../_shared/access.ts'

Deno.serve(createPublicHandler({
    verifyUser, allowedOrigins,
    validateInput: validateSharing,
    consumeQuota: () => true,
    placesHandler: createSharingHandler({ supabaseUrl: url, publicKey }),
}))
