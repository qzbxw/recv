import { describe, expect, it } from "vitest";
import { copyByLocale, DEFAULT_LOCALE, getCopy, LOCALES, normalizeLocale } from "./index";

describe("public site i18n", () => {
  it("normalizes unsupported locales to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALES).toEqual(["en", "ru", "uk", "uz", "de"]);
    expect(normalizeLocale("ru")).toBe("ru");
    expect(normalizeLocale("uk-UA")).toBe("uk");
    expect(normalizeLocale("uz")).toBe("uz");
    expect(normalizeLocale("de")).toBe("de");
    expect(normalizeLocale("fr")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });

  it("returns localized landing copy", () => {
    expect(getCopy("en").hero.title).toContain("Crypto Payments");
    expect(getCopy("ru").hero.title).toContain("Прием платежей");
    expect(copyByLocale.en.footer.console).toBe("Console");
    expect(copyByLocale.ru.footer.console).toBe("Консоль");
    expect(copyByLocale.uk.footer.console).toBeTruthy();
    expect(copyByLocale.uz.footer.console).toBeTruthy();
    expect(copyByLocale.de.footer.console).toBeTruthy();
  });

  it("keeps public copy keys aligned between locales", () => {
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.ru));
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.uk));
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.uz));
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.de));
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual([
      "telegram-shops",
      "saas-billing",
      "digital-goods",
      "paid-communities",
    ]);
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual(
      Object.keys(copyByLocale.ru.marketing.useCasePages)
    );
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual(
      Object.keys(copyByLocale.uk.marketing.useCasePages)
    );
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual(
      Object.keys(copyByLocale.uz.marketing.useCasePages)
    );
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual(
      Object.keys(copyByLocale.de.marketing.useCasePages)
    );
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual([
      "ton",
      "tron",
      "ton_usdt",
      "solana",
      "base",
      "bsc",
      "arbitrum",
    ]);
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual(
      Object.keys(copyByLocale.ru.marketing.networkPages)
    );
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual(
      Object.keys(copyByLocale.uk.marketing.networkPages)
    );
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual(
      Object.keys(copyByLocale.uz.marketing.networkPages)
    );
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual(
      Object.keys(copyByLocale.de.marketing.networkPages)
    );
  });
});
