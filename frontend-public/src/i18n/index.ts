import en from "./en";
import ru from "./ru";
import uk from "./uk";
import uz from "./uz";
import de from "./de";

export type Locale = "en" | "ru" | "uk" | "uz" | "de";

export const LOCALES = ["en", "ru", "uk", "uz", "de"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export const copyByLocale = { en, ru, uk, uz, de } as const;
export type PublicCopy = (typeof copyByLocale)[Locale];

export function isSupportedLocale(locale: string | undefined): locale is Locale {
  return LOCALES.includes(locale as Locale);
}

export function normalizeLocale(locale: string | undefined): Locale {
  const normalized = locale?.toLowerCase().replace("_", "-");
  if (normalized === "ru" || normalized === "ru-ru" || normalized === "russian") return "ru";
  if (normalized === "uk" || normalized === "uk-ua" || normalized === "ua" || normalized === "ukrainian") return "uk";
  if (normalized === "uz" || normalized === "uz-uz" || normalized === "uzbek") return "uz";
  if (normalized === "de" || normalized === "de-de" || normalized === "de-at" || normalized === "de-ch" || normalized === "german") return "de";
  return "en";
}

export function getCopy(locale: string | undefined): PublicCopy {
  return copyByLocale[normalizeLocale(locale)];
}
export const PUBLIC_PLAN_COPY = { en: en.plan, ru: ru.plan, uk: uk.plan, uz: uz.plan, de: de.plan } as const;
export const PUBLIC_MARKETING_COPY = { 
  en: { ...en.marketing, hero: en.hero, final: en.final, nav: en.nav, networks: en.networks }, 
  ru: { ...ru.marketing, hero: ru.hero, final: ru.final, nav: ru.nav, networks: ru.networks },
  uk: { ...uk.marketing, hero: uk.hero, final: uk.final, nav: uk.nav, networks: uk.networks },
  uz: { ...uz.marketing, hero: uz.hero, final: uz.final, nav: uz.nav, networks: uz.networks },
  de: { ...de.marketing, hero: de.hero, final: de.final, nav: de.nav, networks: de.networks },
} as const;
export const PUBLIC_LEGAL_COPY = { 
  privacy: { en: en.legal.privacy, ru: ru.legal.privacy, uk: uk.legal.privacy, uz: uz.legal.privacy, de: de.legal.privacy }, 
  terms: { en: en.legal.terms, ru: ru.legal.terms, uk: uk.legal.terms, uz: uz.legal.terms, de: de.legal.terms },
  dpa: { en: en.legal.dpa, ru: ru.legal.dpa, uk: uk.legal.dpa, uz: uz.legal.dpa, de: de.legal.dpa },
  subprocessors: { en: en.legal.subprocessors, ru: ru.legal.subprocessors, uk: uk.legal.subprocessors, uz: uz.legal.subprocessors, de: de.legal.subprocessors }
} as const;
