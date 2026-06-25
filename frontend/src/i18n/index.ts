import en from "./en";
import ru from "./ru";
import uk from "./uk";
import uz from "./uz";
import de from "./de";

export type Language = "ru" | "en" | "uk" | "uz" | "de";
export const SUPPORTED_LANGUAGES: Array<{ value: Language; label: string; shortLabel: string }> = [
  { value: "ru", label: "Русский", shortLabel: "RU" },
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "uk", label: "Українська", shortLabel: "UK" },
  { value: "uz", label: "O'zbekcha", shortLabel: "UZ" },
  { value: "de", label: "Deutsch", shortLabel: "DE" },
];
export const BOT_URL = "https://t.me/recvmoney_bot";
export const APP_COPY = { en, ru, uk, uz, de } as const;

export const LANDING_COPY = { en: en.landing, ru: ru.landing, uk: uk.landing, uz: uz.landing, de: de.landing } as const;
export const PLAN_COPY = { en: en.plan, ru: ru.plan, uk: uk.plan, uz: uz.plan, de: de.plan } as const;
export const AUTH_COPY = { en: en.auth, ru: ru.auth, uk: uk.auth, uz: uz.auth, de: de.auth } as const;
export const CHECKOUT_COPY = { en: en.checkout, ru: ru.checkout, uk: uk.checkout, uz: uz.checkout, de: de.checkout } as const;
export const SELLER_CONSOLE_COPY = { en: en.sellerConsole, ru: ru.sellerConsole, uk: uk.sellerConsole, uz: uz.sellerConsole, de: de.sellerConsole } as const;
export const DEVELOPER_PORTAL_COPY = { en: en.developerPortal, ru: ru.developerPortal, uk: uk.developerPortal, uz: uz.developerPortal, de: de.developerPortal } as const;
export const LEGAL_COPY = {
  privacy: { en: en.legal.privacy, ru: ru.legal.privacy, uk: uk.legal.privacy, uz: uz.legal.privacy, de: de.legal.privacy },
  terms: { en: en.legal.terms, ru: ru.legal.terms, uk: uk.legal.terms, uz: uz.legal.terms, de: de.legal.terms },
  dpa: { en: en.legal.dpa, ru: ru.legal.dpa, uk: uk.legal.dpa, uz: uz.legal.dpa, de: de.legal.dpa },
  subprocessors: { en: en.legal.subprocessors, ru: ru.legal.subprocessors, uk: uk.legal.subprocessors, uz: uz.legal.subprocessors, de: de.legal.subprocessors },
} as const;
