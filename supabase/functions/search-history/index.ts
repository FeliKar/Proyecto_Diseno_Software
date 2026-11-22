import { createPublicHandler } from '../_shared/public-handler.mjs'
import { verifyUser, allowedOrigins, url, publicKey } from '../_shared/access.ts'
import { createHistoryStore, createHistoryHandler, validateHistory } from '../_shared/history.mjs'

Deno.serve(createPublicHandler({
    verifyUser,
    validateInput: validateHistory,
    allowedOrigins,
    // Reading or clearing history does not call Google.
    consumeQuota: () => true,
    placesHandler: createHistoryHandler(createHistoryStore({ supabaseUrl: url, publicKey })),
}))
