import { describe, expect, it } from "vitest";
import { FALLBACK_BLOG_POSTS, fallbackBlogPost } from "./blog-articles";

describe("bilingual fallback articles", () => {
  it("contains reciprocal EN/RU article pairs", () => {
    expect(FALLBACK_BLOG_POSTS.en.length).toBeGreaterThanOrEqual(8);
    expect(FALLBACK_BLOG_POSTS.ru.length).toBeGreaterThanOrEqual(8);
    expect(FALLBACK_BLOG_POSTS.en).toHaveLength(FALLBACK_BLOG_POSTS.ru.length);
    expect(FALLBACK_BLOG_POSTS.en.map((post) => post.slug).sort()).toEqual(
      FALLBACK_BLOG_POSTS.ru.map((post) => post.slug).sort(),
    );
  });

  it("has publish-ready metadata and internal links", () => {
    for (const locale of ["en", "ru"] as const) {
      for (const post of FALLBACK_BLOG_POSTS[locale]) {
        expect(post.meta_description?.length).toBeGreaterThanOrEqual(120);
        expect(post.meta_description?.length).toBeLessThanOrEqual(160);
        expect(post.content_md.match(/^## /gm)?.length).toBeGreaterThanOrEqual(4);
        expect(post.content_md.match(/\]\(\/(?:en|ru)\b/g)?.length).toBeGreaterThanOrEqual(2);
        expect(post.author).toBe("Recv Core Team");
        expect(post.author_slug).toBe("recv-core");
        expect(post.available_locales).toEqual(["en", "ru"]);
      }
    }
  });

  it("returns a localized post by slug", () => {
    expect(fallbackBlogPost("trc20-payment-api", "en")?.locale).toBe("en");
    expect(fallbackBlogPost("trc20-payment-api", "ru")?.locale).toBe("ru");
    expect(fallbackBlogPost("missing", "en")).toBeNull();
  });
});
