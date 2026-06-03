import { describe, expect, it } from "vitest";
import {
  APP_COPY,
  AUTH_COPY,
  CHECKOUT_COPY,
  DEVELOPER_PORTAL_COPY,
  LANDING_COPY,
  PLAN_COPY,
  SELLER_CONSOLE_COPY,
} from "./index";

describe("Vite app i18n", () => {
  it("exports page copy for both supported locales", () => {
    expect(APP_COPY.en.landing.hero.title).toContain("Keep 100%");
    expect(APP_COPY.ru.landing.hero.title).toContain("100%");
    expect(AUTH_COPY.en.browserTitle).toBeTruthy();
    expect(CHECKOUT_COPY.ru.loading).toBeTruthy();
    expect(DEVELOPER_PORTAL_COPY.en.nav.docs).toBe("Documentation");
    expect(LANDING_COPY.ru.footer.console).toBe("Консоль");
    expect(PLAN_COPY.en.dev.badge).toBe("recv Developer");
    expect(SELLER_CONSOLE_COPY.ru.nav.invoices).toBe("Транзакции");
  });

  it("keeps top-level page keys aligned between locales", () => {
    expect(Object.keys(APP_COPY.en)).toEqual(Object.keys(APP_COPY.ru));
    for (const key of Object.keys(APP_COPY.en) as Array<keyof typeof APP_COPY.en>) {
      expect(Object.keys(APP_COPY.en[key])).toEqual(Object.keys(APP_COPY.ru[key]));
    }
  });
});
