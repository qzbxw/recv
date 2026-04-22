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
    expect(getCopy("en").hero.title).toContain("Keep 100%");
    expect(getCopy("ru").hero.title).toContain("100%");
    expect(copyByLocale.en.footer.console).toBe("Console");
    expect(copyByLocale.ru.footer.console).toBe("Консоль");
  });

  it("keeps public copy keys aligned between locales", () => {
    expect(Object.keys(copyByLocale.en)).toEqual(Object.keys(copyByLocale.ru));
  });
});
