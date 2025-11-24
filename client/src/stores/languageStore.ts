import { create } from 'zustand';
import { translations, type Language } from '../i18n/translations';

interface LanguageStore {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

export const useLanguageStore = create<LanguageStore>((set) => ({
  language: 'en',
  t: translations.en,
  setLanguage: (lang: Language) => set({ language: lang, t: translations[lang] }),
}));
