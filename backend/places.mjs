// Comparte la búsqueda entre el servidor local y la función de Supabase.
export {
    createHandler,
    selectRestaurants,
    validateSearch,
} from '../supabase/functions/_shared/places.mjs'