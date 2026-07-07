// src/i18n/index.js
import i18n from 'i18next'; 
import { initReactI18next as initReact } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en';
import fr from './locales/fr';

i18n
  .use(LanguageDetector) // Automatically detects user browser language [1]
  .use(initReact)        // Binds react-i18next to React
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr }
    },
    fallbackLng: 'en', // Default language if no preference is found [1]
    interpolation: {
      escapeValue: false // React already escapes values to prevent XSS attacks
    }
  });

export default i18n;