import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'

// Spanish resources remain localized while source comments and documentation use English.
i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es',
  fallbackLng: 'es',
  interpolation: {
    escapeValue: false,
  },
})

document.documentElement.lang = 'es'

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

export default i18n