import { createSharedListHandler } from '../_shared/sharing.mjs'
import { allowedOrigins, consumeQuota, url, serverKey } from '../_shared/access.ts'

Deno.serve(createSharedListHandler({
    supabaseUrl: url, serverKey, allowedOrigins, consumeQuota,
    apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY'),
}))
