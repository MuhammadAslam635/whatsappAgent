import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

const resources = {
  EN: { translation: en },
  ES: { translation: es },
  FR: { translation: fr },
  DE: { translation: de },
  ZH: { translation: zh },
  AR: { translation: ar },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'EN', // Default language
    fallbackLng: 'EN',
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
