import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import vi from './locales/vi.json';

// Workaround for TypeScript module resolution issue with react-i18next in TypeScript 4.9.5
// The package exports work at runtime but TypeScript's module resolution has issues
// @ts-ignore
const { initReactI18next } = require('react-i18next');

// TypeScript 4.9.5 has issues resolving .use() method from i18next package.json exports
// The code works at runtime, so we suppress the type error
// @ts-ignore
i18n.use(initReactI18next).use(LanguageDetector)
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
