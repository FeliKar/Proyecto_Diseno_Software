import { useTranslation } from 'react-i18next'
import StarRating from './StarRating'
import PlacePhoto from './PlacePhoto'
import { safeLink } from '../lib/restaurant-search.mjs'

export default function RestaurantCard({ restaurant, href, number, showPhoto = false }) {
    const { t } = useTranslation()
    const name = restaurant.name || t('lists.unknown', { number })
    return <article className="restaurant-card compact-card">
        {showPhoto && <figure className="card-photo">
            <PlacePhoto key={restaurant.photo?.uri || 'unavailable'} photo={restaurant.photo} name={name} compact />
        </figure>}
        <div className="restaurant-content">
            <h3><a href={href}>{number ? `${number}. ` : ''}{name}</a></h3>
            <p className="card-facts">
                {restaurant.rating != null && <StarRating value={restaurant.rating} />}
                {restaurant.priceLevel && <span>{t(`priceLevels.${restaurant.priceLevel}`)}</span>}
            </p>
            <p className="card-address">{restaurant.address || t('nearby.addressUnknown')}</p>
            <a className="detail-link" href={href} aria-label={t('restaurantPage.openNamed', { name })}>
                {t('restaurantPage.open')} <span aria-hidden="true">→</span>
            </a>
            {restaurant.attributions?.map((item, index) => <p className="card-attribution" key={index}>
                {safeLink(item.providerUri)
                    ? <a href={safeLink(item.providerUri)} target="_blank" rel="noopener noreferrer">
                        {item.provider || item.providerUri}</a>
                    : item.provider}
            </p>)}
        </div>
    </article>
}
