import { supabase } from './supabase'

export async function getSearchOptions() {
    if (import.meta.env.VITE_USE_HOSTED_BACKEND !== 'true') {
        return {}
    }

    if (!supabase) {
        throw new Error('signin')
    }

    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
        throw new Error('signin')
    }

    return {
        url: `${import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '')}/functions/v1/restaurants`,
        token: data.session.access_token,
        publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    }
}