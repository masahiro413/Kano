import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import ja from './locales/ja.json'
import vi from './locales/vi.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      vi: { translation: vi },
    },
    fallbackLng: 'ja',
    supportedLngs: ['ja', 'vi'],
    interpolation: {
      escapeValue: false,
    },
  })

export default i18n
