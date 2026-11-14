import { useTranslation } from 'react-i18next'

const restaurants = [
  { id: 'garden', icon: '🥗', priceLevel: 'inexpensive' },
  { id: 'oven', icon: '🍕', priceLevel: 'moderate' },
  { id: 'coast', icon: '🐟', priceLevel: 'expensive' },
]

function RestaurantCard({ restaurant }) {
  const { t } = useTranslation()
  const translationKey = `restaurants.${restaurant.id}`

  return (
    <article className="restaurant-card">
      <div className={`restaurant-art restaurant-art--${restaurant.id}`}>
        <span aria-hidden="true">{restaurant.icon}</span>
      </div>

      <div className="restaurant-content">
        <span className="category">
          {t(`${translationKey}.category`)}
        </span>

        <h3>{t(`${translationKey}.name`)}</h3>
        <p>{t(`${translationKey}.description`)}</p>

        <div className="price">
          <span>{t('priceLabel')}</span>
          <strong>{t(`priceLevels.${restaurant.priceLevel}`)}</strong>
        </div>
      </div>
    </article>
  )
}

export default function App() {
  const { t, i18n } = useTranslation()


  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <a className="brand" href="#home">
            <span aria-hidden="true">◉</span>
            {t('appName')}
          </a>

          <div className="header-actions">
            <a className="navigation-link" href="#restaurants">
              {t('explore')}
            </a>

            <label className="language-control">
              <span>{t('language')}</span>
              <select
                value={i18n.resolvedLanguage}
                onChange={(event) => {
                  i18n.changeLanguage(event.target.value)
                }}
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <main id="home" className="container">
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">{t('eyebrow')}</p>
          <h1 id="hero-title">{t('title')}</h1>
          <p className="hero-description">{t('description')}</p>
          <a className="primary-link" href="#restaurants">
            {t('explore')} <span aria-hidden="true">↗</span>
          </a>
        </section>

        <p className="demo-notice">{t('demoNotice')}</p>

        <section
          id="restaurants"
          className="restaurants-section"
          aria-labelledby="restaurants-title"
        >
          <div className="section-heading">
            <h2 id="restaurants-title">{t('restaurantsTitle')}</h2>
            <p>{t('restaurantsDescription')}</p>
          </div>

          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>
        </section>
      </main>

      
    </>
  )
}