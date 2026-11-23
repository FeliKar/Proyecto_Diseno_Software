// The local server and the Supabase function share the same search implementation.
export {
    createHandler,
    selectRestaurants,
    validateSearch,
} from '../supabase/functions/_shared/places.mjs'