/* eslint-disable import/no-named-as-default-member */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import fr from './fr.json';
import rw from './rw.json';

const LANGUAGE_KEY = 'dgshop_user_language';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  rw: { translation: rw },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export async function initLanguage() {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLang && (savedLang === 'en' || savedLang === 'fr' || savedLang === 'rw')) {
      await i18n.changeLanguage(savedLang);
      return;
    }
    const deviceLang = Localization.getLocales()[0]?.languageCode;
    if (deviceLang === 'fr' || deviceLang === 'rw') {
      await i18n.changeLanguage(deviceLang);
    } else {
      await i18n.changeLanguage('en');
    }
  } catch (err) {
    console.warn('[i18n] Failed to load saved language', err);
  }
}

export async function setAppLanguage(lang: 'en' | 'fr' | 'rw') {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
