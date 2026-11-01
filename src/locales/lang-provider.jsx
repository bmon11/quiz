'use client';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { STRINGS } from './strings';

// ----------------------------------------------------------------------

const STORAGE_KEY = 'quiz-lang';
const LangContext = createContext(null);

const readStored = () => {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'en' || v === 'mn' ? v : null;
  } catch {
    return null;
  }
};

export function LangProvider({ children }) {
  // Mongolian first; the toggle in the header switches to English.
  const [lang, setLangState] = useState('mn');

  useEffect(() => {
    const stored = readStored();
    if (stored) setLangState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode — the choice just won't be remembered
    }
  }, []);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      s: STRINGS[lang],
      // Pick the current language from a { en, mn } value, falling back to the other one.
      t: (text) => (text ? text[lang] || text.en || text.mn || '' : ''),
    }),
    [lang, setLang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside LangProvider');
  return ctx;
}
