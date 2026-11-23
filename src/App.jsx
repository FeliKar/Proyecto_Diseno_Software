import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import RestaurantWorkspace from './components/RestaurantWorkspace'
import SharedListPage from './components/SharedListPage'
import { readRoute } from './lib/navigation.mjs'

const sharedToken = new URLSearchParams(window.location.search).get('list')
const views = [
  { name: 'explore', href: '#restaurants', label: 'explore', heading: 'restaurants-title' },
  { name: 'lists', href: '#saved-restaurants', label: 'lists.title', heading: 'lists-title' },
  { name: 'account', href: '#account', label: 'auth.title', heading: 'account-title' },
]

function currentView() {
  const route = readRoute(window.location.hash)
  return { ...views.find((view) => view.name === route.name), placeId: route.placeId }
}

export default function App() {
  const { t, i18n } = useTranslation()
  const [view, setView] = useState(currentView)

  useEffect(() => {
    let frame
    function navigate() {
      const next = currentView()
      setView(next)
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        document.getElementById(next.placeId ? 'restaurant-detail-title' : next.heading)?.focus({ preventScroll: true })
        window.scrollTo(0, 0)
      })
    }
    window.addEventListener('hashchange', navigate)
    return () => {
      window.removeEventListener('hashchange', navigate)
      cancelAnimationFrame(frame)
    }
  }, [])

  if (sharedToken !== null) return <SharedListPage token={sharedToken} />

  return <>
    <header className="site-header">
      <div className="container header-content">
        <a className="brand" href="#restaurants">
          <span aria-hidden="true">◉</span>{t('appName')}
        </a>
        <nav className="main-navigation" aria-label={t('navigation')}>
          {views.map((item) => <a key={item.name} href={item.href}
            aria-current={item.name === view.name ? 'page' : undefined}>
            {t(item.label)}
          </a>)}
        </nav>
        <label className="language-control">
          <span>{t('language')}</span>
          <select value={i18n.resolvedLanguage}
            onChange={(event) => i18n.changeLanguage(event.target.value)}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
      </div>
    </header>
    <main id="home" className="container app-content">
      <RestaurantWorkspace view={view.name} placeId={view.placeId} />
    </main>
  </>
}
