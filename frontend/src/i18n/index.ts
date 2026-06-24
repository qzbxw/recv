import en from "./en";
import ru from "./ru";

export type Language = "ru" | "en";
export const SUPPORTED_LANGUAGES: Array<{ value: Language; label: string; shortLabel: string }> = [
  { value: "ru", label: "Русский", shortLabel: "RU" },
  { value: "en", label: "English", shortLabel: "EN" },
];
export const BOT_URL = "https://t.me/recvmoney_bot";
export const APP_COPY = { en, ru } as const;

export const LANDING_COPY = { en: en.landing, ru: ru.landing } as const;
export const PLAN_COPY = { en: en.plan, ru: ru.plan } as const;
export const AUTH_COPY = { en: en.auth, ru: ru.auth } as const;
export const CHECKOUT_COPY = { en: en.checkout, ru: ru.checkout } as const;
export const SELLER_CONSOLE_COPY = { en: en.sellerConsole, ru: ru.sellerConsole } as const;
export const DEVELOPER_PORTAL_COPY = { en: en.developerPortal, ru: ru.developerPortal } as const;
export const LEGAL_COPY = { privacy: { en: en.legal.privacy, ru: ru.legal.privacy }, terms: { en: en.legal.terms, ru: ru.legal.terms } } as const;
