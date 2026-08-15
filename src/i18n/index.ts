import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const APP_LANGUAGES = ['ru', 'en'] as const;
export type AppLanguage = (typeof APP_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = '@gonext/language';

function isAppLanguage(value: string | null): value is AppLanguage {
  return value === 'ru' || value === 'en';
}

export function normalizeLanguage(value: string | undefined): AppLanguage {
  return value?.startsWith('en') ? 'en' : 'ru';
}

export function getDateLocale(language: string = i18n.language): string {
  return normalizeLanguage(language) === 'en' ? 'en-US' : 'ru-RU';
}

async function readSavedLanguage(): Promise<AppLanguage | null> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isAppLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

const initPromise = i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
  },
  lng: 'ru',
  fallbackLng: 'ru',
  supportedLngs: ['ru', 'en'],
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  react: {
    useSuspense: false,
  },
});

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Выбор языка уже применён.
  }
}

export async function initI18n(): Promise<typeof i18n> {
  await initPromise;
  const savedLanguage = await readSavedLanguage();
  if (savedLanguage && normalizeLanguage(i18n.language) !== savedLanguage) {
    await i18n.changeLanguage(savedLanguage);
  }
  return i18n;
}

export default i18n;
