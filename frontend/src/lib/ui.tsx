import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { SUPPORTED_LANGUAGES, type Language } from "../i18n";

type Theme = "dark";

type UIContextValue = {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  toggleLanguage: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

const themeKey = "recv_theme";
const languageKey = "recv_language";
const supportedLanguageValues = SUPPORTED_LANGUAGES.map((language) => language.value);

function isSupportedLanguage(value: string | null): value is Language {
  return supportedLanguageValues.includes(value as Language);
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  const [language, setLanguage] = useState<Language>(() => {
    // 1. URL search params (e.g. ?lang=ru)
    try {
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get("lang");
      if (isSupportedLanguage(langParam)) {
        return langParam;
      }
    } catch (_) {}

    // 2. Local storage
    const stored = window.localStorage.getItem(languageKey);
    if (isSupportedLanguage(stored)) {
      return stored;
    }

    // 3. Document referrer (from marketing landing page locales like /en/... or /ru/...)
    try {
      const referrer = document.referrer;
      if (referrer) {
        const url = new URL(referrer);
        const pathParts = url.pathname.toLowerCase().split("/");
        const referrerLanguage = supportedLanguageValues.find((lang) => pathParts.includes(lang));
        if (referrerLanguage) return referrerLanguage;
      }
    } catch (_) {}

    // 4. Browser language
    return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeKey, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem(languageKey, language);
  }, [language]);

  const value = useMemo<UIContextValue>(() => ({
    theme,
    language,
    setTheme: () => setTheme("dark"),
    setLanguage,
    toggleTheme: () => setTheme("dark"),
    toggleLanguage: () => setLanguage((current) => {
      const currentIndex = supportedLanguageValues.indexOf(current);
      return supportedLanguageValues[(currentIndex + 1) % supportedLanguageValues.length] ?? "en";
    }),
  }), [theme, language]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const value = useContext(UIContext);
  if (!value) {
    throw new Error("useUI must be used inside UIProvider");
  }
  return value;
}
