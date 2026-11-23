import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// The callback error is captured before the SDK consumes the URL fragment.
const callback = new URLSearchParams(window.location.hash.slice(1))
const query = new URLSearchParams(window.location.search)

export const callbackError =
    callback.get('error_code') ||
    callback.get('error') ||
    query.get('error')

let client = null

try {
    if (url && key) {
        client = createClient(url, key)
    }
} catch {
    // The interface remains available when the Supabase configuration is invalid.
}

export const supabase = client
