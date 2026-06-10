import fs from "node:fs";
import path from "node:path";

// Parses neural-net article exports (```text metadata + ```markdown body blocks)
// and emits upsert SQL for the live blog_posts table. Articles always land as
// drafts so they can be reviewed, edited, and published from the admin panel.

function parseArticles(content) {
  const articleBlocks = content.split(/## ARTICLE \d+ — [A-Z]+/i);
  const articles = [];

  for (const block of articleBlocks) {
    if (!block.trim()) continue;

    const textMatch = block.match(/```text\r?\n([\s\S]*?)```/);
    if (!textMatch) continue;

    const metadata = {};
    for (const line of textMatch[1].split(/\r?\n/)) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;
      const key = line.slice(0, colonIndex).trim();
      const val = line.slice(colonIndex + 1).trim();
      metadata[key] = val;
    }

    // The body fence may be 3 or 4+ backticks (4 when the article embeds
    // ```code blocks); the closing fence must match the opening length.
    const markdownMatch = block.match(/(`{3,})markdown\r?\n([\s\S]*?)\r?\n\1/);
    let markdownContent = "";
    if (markdownMatch) {
      markdownContent = markdownMatch[2];
    } else {
      // Fallback: everything after the metadata block
      const textBlockEnd = block.indexOf("```", block.indexOf("```text") + 7);
      if (textBlockEnd !== -1) {
        markdownContent = block
          .slice(textBlockEnd + 3)
          .replace(/^`*\s*markdown/, "")
          .replace(/`+\s*$/, "")
          .trim();
      }
    }

    if (!metadata.Slug || !metadata.Locale) {
      console.warn("Skipping block: missing Slug or Locale in metadata");
      continue;
    }
    if (!markdownContent.trim()) {
      console.warn(`Skipping ${metadata.Slug}: empty article body`);
      continue;
    }

    articles.push({ metadata, body: markdownContent });
  }

  return articles;
}

function injectInternalLinks(body, instructionsRaw) {
  if (!instructionsRaw) return body;
  let updated = body;
  for (const inst of instructionsRaw.split(",").map((s) => s.trim())) {
    const parts = inst.split("→").map((s) => s.trim());
    if (parts.length !== 2) continue;
    const [phrase, target] = parts;
    const escapedPhrase = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    // Link only the first occurrence that is not already inside a markdown link
    const regex = new RegExp(`(?<!\\[)${escapedPhrase}(?![\\]\\w])`);
    updated = updated.replace(regex, `[${phrase}](${target})`);
  }
  return updated;
}

function processArticle({ metadata, body }) {
  const contentMd = injectInternalLinks(body, metadata["Internal links to add"]).trim();
  const internalLinks = [...contentMd.matchAll(/\]\(\/(?:en|ru)\b/g)].length;
  const orEmpty = (v) => (v && v.trim() ? v.trim() : null);

  return {
    slug: metadata.Slug,
    locale: metadata.Locale.toLowerCase(),
    title: metadata.Title || metadata.Slug,
    content_md: contentMd,
    excerpt: orEmpty(metadata.Excerpt),
    cover_image_url: orEmpty(metadata["Cover image URL"]),
    author: orEmpty(metadata.Author) || "Recv Core Team",
    meta_title: orEmpty(metadata["Meta title"]),
    meta_description: orEmpty(metadata["Meta description"]),
    canonical_url: orEmpty(metadata["Canonical URL"]),
    tags: metadata.Tags ? metadata.Tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    internal_links_count: internalLinks,
    internal_linking_status: internalLinks >= 2 ? "complete" : "pending",
  };
}

function validateArticle(article) {
  const key = `${article.slug}:${article.locale}`;
  if (!["en", "ru"].includes(article.locale)) {
    throw new Error(`${key}: locale must be en or ru`);
  }
  const md = article.meta_description || "";
  if (md.length < 120 || md.length > 160) {
    console.warn(`[Warning] ${key}: meta_description is ${md.length} chars (expected 120-160)`);
  }
  if (/^#\s/m.test(article.content_md)) {
    console.warn(`[Warning] ${key}: body contains an H1 heading; admin will reject publishing until it is removed`);
  }
  if (article.internal_links_count < 2) {
    console.warn(`[Warning] ${key}: only ${article.internal_links_count} internal links (recommended: 2+)`);
  }
}

let literalCounter = 0;
function literal(value) {
  if (value === null || value === undefined) return "NULL";
  const tag = `$imp${literalCounter++}$`;
  if (String(value).includes(tag)) throw new Error(`value contains SQL marker ${tag}`);
  return `${tag}${value}${tag}`;
}

function articleToSQL(article) {
  const tagsArray = article.tags.length
    ? `ARRAY[${article.tags.map((t) => literal(t)).join(", ")}]::text[]`
    : "'{}'::text[]";

  return `INSERT INTO blog_posts (
  slug, title, h1, content_md, content_json, content_version, excerpt,
  cover_image_url, author, is_published, status,
  meta_title, meta_description, canonical_url, og_title, og_description,
  robots_index, robots_follow, include_in_sitemap, author_slug,
  tags, locale, internal_links_count, internal_linking_status
) VALUES (
  ${literal(article.slug)}, ${literal(article.title)}, ${literal(article.title)},
  ${literal(article.content_md)}, NULL, 1, ${literal(article.excerpt)},
  ${literal(article.cover_image_url)}, ${literal(article.author)}, FALSE, 'draft',
  ${literal(article.meta_title || article.title)}, ${literal(article.meta_description)},
  ${literal(article.canonical_url)}, ${literal(article.meta_title || article.title)},
  ${literal(article.meta_description)},
  TRUE, TRUE, TRUE, 'recv-core',
  ${tagsArray}, ${literal(article.locale)},
  ${article.internal_links_count}, ${literal(article.internal_linking_status)}
)
ON CONFLICT (slug, locale) DO UPDATE SET
  title = EXCLUDED.title,
  h1 = EXCLUDED.h1,
  content_md = EXCLUDED.content_md,
  content_json = NULL,
  content_version = 1,
  excerpt = EXCLUDED.excerpt,
  cover_image_url = EXCLUDED.cover_image_url,
  author = EXCLUDED.author,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  canonical_url = EXCLUDED.canonical_url,
  og_title = EXCLUDED.og_title,
  og_description = EXCLUDED.og_description,
  tags = EXCLUDED.tags,
  internal_links_count = EXCLUDED.internal_links_count,
  internal_linking_status = EXCLUDED.internal_linking_status,
  updated_at = NOW()
WHERE blog_posts.status <> 'published';`;
}

function main() {
  const args = process.argv.slice(2);
  let sqlOut = null;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--sql") {
      sqlOut = args[++i];
    } else {
      positional.push(args[i]);
    }
  }

  let content;
  if (positional.length > 0) {
    const filePath = path.resolve(positional[0]);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    content = fs.readFileSync(filePath, "utf8");
  } else {
    content = fs.readFileSync(0, "utf-8");
  }

  const parsed = parseArticles(content);
  if (parsed.length === 0) {
    console.error("No valid articles found in input.");
    process.exit(1);
  }

  const statements = [];
  const keys = [];
  for (const raw of parsed) {
    const article = processArticle(raw);
    validateArticle(article);
    statements.push(articleToSQL(article));
    keys.push(`(${literal(article.slug)}, ${literal(article.locale)})`);
    console.log(`Prepared draft: ${article.slug} (${article.locale})`);
  }

  const sql = [
    "-- Generated by frontend-public/scripts/import-articles.mjs",
    "-- Inserts/updates blog drafts. Published posts are never overwritten.",
    "BEGIN;",
    ...statements,
    `SELECT id, slug, locale, status, updated_at FROM blog_posts WHERE (slug, locale) IN (${keys.join(", ")});`,
    "COMMIT;",
    "",
  ].join("\n\n");

  if (sqlOut) {
    fs.writeFileSync(path.resolve(sqlOut), sql);
    console.log(`SQL written to ${sqlOut}`);
  } else {
    process.stdout.write(sql);
  }
}

main();
