import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(LanguageDetector) // Detects user language
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: en
      },
      vi: {
        translation: vi
      }
    },
    fallbackLng: 'en', // Fallback language if detection fails
    debug: process.env.NODE_ENV === 'development', // Enable debug in development
    
    interpolation: {
      escapeValue: false // React already escapes values
    },
    
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys to lookup language from
      lookupLocalStorage: 'preferredLanguage',
      
      // Cache user language
      caches: ['localStorage'],
      
      // Exclude certain languages from being detected
      excludeCacheFor: ['cimode']
    }
  });

export default i18n;
