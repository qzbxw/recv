import { expect, test } from "@playwright/test";
import articleSource from "../content/blog/articles.json";

const articleSlugs = [...new Set(articleSource.map((article) => article.slug))];

test("required page families expose visible breadcrumbs", async ({ page }) => {
  for (const path of [
    "/en/products",
    "/en/products/api",
    "/en/networks/tron",
    "/en/use-cases/telegram-shops",
    "/en/compare/coingate",
    "/en/docs/webhooks",
    "/en/blog",
    "/en/blog/author/recv-core",
  ]) {
    await page.goto(path);
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
  }
});

test("language switch keeps the translated article slug", async ({ page }) => {
  await page.goto("/en/blog/trc20-payment-api");
  await page.getByRole("link", { name: "RU", exact: true }).click();
  await expect(page).toHaveURL(/\/ru\/blog\/trc20-payment-api$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TRC20");
});

test("localized 404 search preserves the query", async ({ page }) => {
  const response = await page.goto("/ru/definitely-missing-page");
  expect(response?.status()).toBe(404);
  await page.getByRole("searchbox").fill("вебхуки");
  await page.getByRole("button", { name: "Поиск по справке" }).click();
  await expect(page).toHaveURL(/\/ru\/help\?q=/);
  expect(new URL(page.url()).searchParams.get("q")).toBe("вебхуки");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
});

test.describe("bilingual article routes", () => {
  for (const slug of articleSlugs) {
    test(`${slug} renders reciprocal alternates`, async ({ page }) => {
    for (const locale of ["en", "ru"] as const) {
      const response = await page.goto(`/${locale}/blog/${slug}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${locale}/${slug}`).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(`link[rel="alternate"][hreflang="${locale === "en" ? "ru" : "en"}"]`)).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/recv\.money\/og\/blog\//);
    }
    });
  }
});

test("service documents are noindex and unknown pages are real 404s", async ({ request }) => {
  const openapi = await request.get("/openapi.json");
  expect([200, 503]).toContain(openapi.status());
  expect(openapi.headers()["x-robots-tag"]).toContain("noindex");

  const missing = await request.get("/en/not-a-real-route");
  expect(missing.status()).toBe(404);
});

test("structured articles expose TOC and lightbox interactions when present", async ({ page }) => {
  const structuredArticle = process.env.PLAYWRIGHT_STRUCTURED_ARTICLE;
  test.skip(!structuredArticle, "Set PLAYWRIGHT_STRUCTURED_ARTICLE to a published article containing headings and a media image.");

  await page.goto(structuredArticle!);
  const toc = page.getByRole("navigation", { name: /contents|оглавление/i });
  await expect(toc).toBeVisible();

  const imageButton = page.getByRole("button", { name: /open full size|открыть/i }).first();
  await imageButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
