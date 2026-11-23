import { useTranslation } from 'react-i18next'
import { safeLink } from '../lib/restaurant-search.mjs'
import RestaurantDetails from './RestaurantDetails'
import StarRating from './StarRating'

export default function RestaurantPage({ restaurant, userId, backHref, children }) {
    const { t, i18n } = useTranslation()
    // shortcut: details use loaded results; independent links would require fetching by ID.
    return <section className="restaurant-page restaurants-section" aria-labelledby="restaurant-detail-title">
        <a className="restaurant-back" href={backHref}>← {t(backHref === '#saved-restaurants' ? 'usability.backToLists' : 'usability.backToResults')}</a>
        <h1 id="restaurant-detail-title" className="screen-title" tabIndex={-1}>
            {restaurant?.name || t('restaurantPage.title')}
        </h1>
        {!restaurant ? <p>{t('restaurantPage.unavailable')}</p> : <>
            <div className="restaurant-overview">
                {restaurant.rating != null && <p><StarRating value={restaurant.rating} />{restaurant.ratingCount != null && <> · {t('nearby.ratingCount', {
                    total: new Intl.NumberFormat(i18n.resolvedLanguage).format(restaurant.ratingCount),
                })}</>}</p>}
                <p>{restaurant.address || t('nearby.addressUnknown')}</p>
                <p>{t('priceLabel')}: {restaurant.priceLevel
                    ? t(`priceLevels.${restaurant.priceLevel}`) : t('nearby.priceUnknown')}</p>
                {safeLink(restaurant.googleMapsUrl) && <a href={safeLink(restaurant.googleMapsUrl)}
                    target="_blank" rel="noopener noreferrer">{t('nearby.maps')}</a>}
                <p className="maps-attribution" translate="no">Google Maps</p>
                {restaurant.attributions?.map((item, index) => <p key={index}>
                    {safeLink(item.providerUri)
                        ? <a href={safeLink(item.providerUri)} target="_blank" rel="noopener noreferrer">
                            {item.provider || item.providerUri}</a>
                        : item.provider}
                </p>)}
            </div>
            {children && <section className="restaurant-personal" aria-labelledby="restaurant-personal-title">
                <h2 id="restaurant-personal-title">{t('restaurantPage.myRestaurant')}</h2>
                {children}
            </section>}
            {userId && import.meta.env.VITE_USE_HOSTED_BACKEND === 'true' &&
                <RestaurantDetails key={`${restaurant.id}:${userId}`} placeId={restaurant.id} userId={userId} />}
        </>}
    </section>
}
