import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Definim traducerile pentru română și engleză (poți adăuga altele)
const resources = {
  ro: {
    translation: {
      weatherAlerts: "Alerte meteo",
      validFrom: "Valabil de la",
      validUntil: "Până la",
      // alte traduceri
    }
  },
  en: {
    translation: {
      weatherAlerts: "Weather alerts",
      validFrom: "Valid from",
      validUntil: "Valid until",
      // alte traduceri
    }
  }
};

// Detectăm limba device-ului
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    const locales = RNLocalize.getLocales();
    if (locales && locales.length > 0) {
      callback(locales[0].languageTag);
    } else {
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: () => {}
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
