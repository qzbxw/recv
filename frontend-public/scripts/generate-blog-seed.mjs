import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "content/blog/articles.json");
const outputPath = path.join(root, "../backend/internal/db/migrations/026_seed_bilingual_articles.sql");
const articles = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const seen = new Set();
for (const article of articles) {
  const key = `${article.slug}:${article.locale}`;
  if (seen.has(key)) throw new Error(`duplicate article ${key}`);
  seen.add(key);
  if (!["en", "ru"].includes(article.locale)) throw new Error(`invalid locale for ${key}`);
  if (article.meta_description.length < 120 || article.meta_description.length > 160) {
    throw new Error(`${key} meta_description is ${article.meta_description.length} characters`);
  }
  if (article.sections.length < 4) throw new Error(`${key} needs at least four H2 sections`);
  const content = article.sections.map(([heading, body]) => `## ${heading}\n\n${body}`).join("\n\n");
  const links = [...content.matchAll(/\]\(\/(?:en|ru)\b/g)].length;
  if (links < 2) throw new Error(`${key} needs at least two internal links`);
}
if (articles.length < 16) throw new Error(`expected at least 16 localized articles, found ${articles.length}`);
if (articles.length % 2 !== 0) throw new Error(`expected even number of localized articles (EN/RU pairs), found ${articles.length}`);

function literal(value, tag) {
  const marker = `$${tag}$`;
  if (String(value).includes(marker)) throw new Error(`value contains SQL marker ${marker}`);
  return `${marker}${value}${marker}`;
}

const rows = articles.map((article, index) => {
  const content = article.sections.map(([heading, body]) => `## ${heading}\n\n${body}`).join("\n\n");
  const links = [...content.matchAll(/\]\(\/(?:en|ru)\//g)].length;
  const values = [
    literal(article.slug, `slug${index}`),
    literal(article.title, `title${index}`),
    literal(article.title, `h1${index}`),
    literal(content, `body${index}`),
    literal(article.excerpt, `excerpt${index}`),
    literal("Recv Core Team", `author${index}`),
    literal("published", `status${index}`),
    literal(article.title, `metaTitle${index}`),
    literal(article.meta_description, `metaDescription${index}`),
    literal(article.title, `ogTitle${index}`),
    literal(article.meta_description, `ogDescription${index}`),
    literal("recv-core", `authorSlug${index}`),
    `ARRAY[${article.tags.map((tag, tagIndex) => literal(tag, `tag${index}_${tagIndex}`)).join(", ")}]::text[]`,
    literal(article.locale, `locale${index}`),
    links,
    literal("complete", `linkStatus${index}`),
    `'${article.published_at}'::timestamptz`,
  ];
  return `  (${values.join(", ")})`;
});

const sql = `-- Generated from frontend-public/content/blog/articles.json.
-- Do not edit manually; run: cd frontend-public && node scripts/generate-blog-seed.mjs
INSERT INTO blog_posts (
  slug, title, h1, content_md, excerpt, author, is_published, status,
  meta_title, meta_description, og_title, og_description,
  robots_index, robots_follow, include_in_sitemap, author_slug,
  tags, locale, internal_links_count, internal_linking_status, published_at
)
SELECT
  seed.slug, seed.title, seed.h1, seed.content_md, seed.excerpt, seed.author,
  TRUE, seed.status, seed.meta_title, seed.meta_description,
  seed.og_title, seed.og_description, TRUE, TRUE, TRUE, seed.author_slug,
  seed.tags, seed.locale, seed.internal_links_count,
  seed.internal_linking_status, seed.published_at
FROM (VALUES
${rows.join(",\n")}
) AS seed(
  slug, title, h1, content_md, excerpt, author, status,
  meta_title, meta_description, og_title, og_description, author_slug,
  tags, locale, internal_links_count, internal_linking_status, published_at
)
ON CONFLICT (slug, locale) DO NOTHING;
`;

fs.writeFileSync(outputPath, sql);
console.log(`Generated ${path.relative(root, outputPath)} with ${articles.length} localized articles`);
