import { describe, expect, it } from "vitest";
import { copyByLocale, DEFAULT_LOCALE, getCopy, LOCALES, normalizeLocale } from "./index";

describe("public site i18n", () => {
  it("normalizes unsupported locales to English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALES).toEqual(["en", "ru"]);
    expect(normalizeLocale("ru")).toBe("ru");
    expect(normalizeLocale("de")).toBe("en");
    expect(normalizeLocale(undefined)).toBe("en");
  });

  it("returns localized landing copy", () => {
    expect(getCopy("en").hero.title).toContain("Crypto Payments");
    expect(getCopy("ru").hero.title).toContain("Прием платежей");
    expect(copyByLocale.en.footer.console).toBe("Console");
    expect(copyByLocale.ru.footer.console).toBe("Консоль");
  });

  it("keeps public copy keys aligned between locales", () => {
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.ru));
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual([
      "telegram-shops",
      "saas-billing",
      "digital-goods",
      "paid-communities",
    ]);
    expect(Object.keys(copyByLocale.en.marketing.useCasePages)).toEqual(
      Object.keys(copyByLocale.ru.marketing.useCasePages)
    );
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual([
      "ton",
      "tron",
      "ton_usdt",
      "base",
      "bsc",
      "arbitrum",
    ]);
    expect(Object.keys(copyByLocale.en.marketing.networkPages)).toEqual(
      Object.keys(copyByLocale.ru.marketing.networkPages)
    );
  });
});
