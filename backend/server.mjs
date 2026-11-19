import { createHandler } from './places.mjs'

const handler = createHandler({
    apiKey: Deno.env.get('GOOGLE_PLACES_API_KEY'),
})

Deno.serve({ hostname: '127.0.0.1', port: 8000 }, handler)