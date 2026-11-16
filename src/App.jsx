import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const restaurants = [
  {
    id: 'garden',
    icon: '🥗',
    category: 'vegetarian',
    priceLevel: 'inexpensive',
  },
  {
    id: 'oven',
    icon: '🍕',
    category: 'italian',
    priceLevel: 'moderate',
  },
  {
    id: 'coast',
    icon: '🐟',
    category: 'seafood',
    priceLevel: 'expensive',
  },
]


function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}


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
          {t(`categories.${restaurant.category}`)}
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
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [priceLevel, setPriceLevel] = useState('')

  const normalizedSearch = normalizeText(search)

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const name = t(`restaurants.${restaurant.id}.name`)

    const matchesSearch = normalizeText(name).includes(normalizedSearch)
    const matchesCategory = category === '' || restaurant.category === category
    const matchesPrice = priceLevel === '' || restaurant.priceLevel === priceLevel

    return matchesSearch && matchesCategory && matchesPrice
  })

  function clearFilters() {
    setSearch('')
    setCategory('')
    setPriceLevel('')
  }
  
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


          <div className="search-field">
            <label htmlFor="restaurant-search">{t('searchLabel')}</label>
            <input
              id="restaurant-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPlaceholder')}
            />
          </div>


          <div className="filters">
            <div className="filter-field">
              <label htmlFor="category-filter">{t('categoryLabel')}</label>
              <select
                id="category-filter"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">{t('allCategories')}</option>
                <option value="vegetarian">{t('categories.vegetarian')}</option>
                <option value="italian">{t('categories.italian')}</option>
                <option value="seafood">{t('categories.seafood')}</option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="price-filter">{t('priceLabel')}</label>
              <select
                id="price-filter"
                value={priceLevel}
                onChange={(event) => setPriceLevel(event.target.value)}
              >
                <option value="">{t('allPrices')}</option>
                <option value="inexpensive">{t('priceLevels.inexpensive')}</option>
                <option value="moderate">{t('priceLevels.moderate')}</option>
                <option value="expensive">{t('priceLevels.expensive')}</option>
              </select>
            </div>

            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              {t('clearFilters')}
            </button>
          </div>


          <p role="status">
            {filteredRestaurants.length === 0 ? t('noResults') : ''}
          </p>


          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant) => (
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