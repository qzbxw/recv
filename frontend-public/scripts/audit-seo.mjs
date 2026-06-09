const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const canonicalOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://recv.money").replace(/\/+$/, "");

function matches(html, pattern) {
  return [...html.matchAll(pattern)];
}

function textContent(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeEntities(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "manual" });
  return { response, body: await response.text() };
}

function metaContent(html, attribute, value) {
  const tags = matches(html, /<meta\b[^>]*>/gi).map((match) => match[0]);
  const tag = tags.find((candidate) =>
    new RegExp(`${attribute}=["']${value}["']`, "i").test(candidate),
  );
  return decodeEntities(tag?.match(/content=["']([^"']*)["']/i)?.[1] || "");
}

function pngSize(buffer) {
  if (
    buffer.length < 24 ||
    buffer.toString("ascii", 1, 4) !== "PNG"
  ) {
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

async function sitemapUrls() {
  const { response, body } = await fetchText(`${baseUrl}/sitemap.xml`);
  if (!response.ok) throw new Error(`sitemap index returned ${response.status}`);
  const sitemapLocations = matches(body, /<loc>([^<]+)<\/loc>/g).map((match) =>
    match[1].replace(canonicalOrigin, baseUrl),
  );
  const urls = [];
  for (const sitemap of sitemapLocations) {
    const result = await fetchText(sitemap);
    if (!result.response.ok) {
      throw new Error(`${sitemap} returned ${result.response.status}`);
    }
    urls.push(
      ...matches(result.body, /<loc>([^<]+)<\/loc>/g).map((match) =>
        match[1].replace(canonicalOrigin, baseUrl),
      ),
    );
  }
  return [...new Set(urls)];
}

function auditHTML(url, html) {
  const failures = [];
  const schemas = [];
  const titles = matches(html, /<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/gi);
  const h1s = matches(html, /<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/gi);
  const canonicals = matches(html, /<link[^>]+rel=["']canonical["'][^>]*>/gi);
  const descriptions = matches(html, /<meta[^>]+name=["']description["'][^>]*>/gi);
  const openGraphImage = metaContent(html, "property", "og:image");
  const twitterImage = metaContent(html, "name", "twitter:image");
  const lang = /<html[^>]+lang=["']([^"']+)["']/i.exec(html)?.[1];
  const path = new URL(url).pathname;
  const requiresBreadcrumb = /^\/(?:en|ru)\/(?:products|networks|use-cases|compare|blog|docs)(?:\/|$)/.test(path);

  if (titles.length !== 1) failures.push(`expected one title, found ${titles.length}`);
  if (h1s.length !== 1) failures.push(`expected one H1, found ${h1s.length}`);
  if (canonicals.length !== 1) failures.push(`expected one canonical, found ${canonicals.length}`);
  if (descriptions.length !== 1) failures.push(`expected one description, found ${descriptions.length}`);
  if (path.startsWith("/ru") && lang !== "ru") failures.push(`expected html lang=ru, found ${lang}`);
  if (path.startsWith("/en") && lang !== "en") failures.push(`expected html lang=en, found ${lang}`);

  const canonical = canonicals[0]?.[0].match(/href=["']([^"']+)["']/i)?.[1];
  if (canonical && !canonical.startsWith(canonicalOrigin)) {
    failures.push(`canonical is not absolute on ${canonicalOrigin}: ${canonical}`);
  }
  const description = decodeEntities(descriptions[0]?.[0].match(/content=["']([^"']*)["']/i)?.[1] || "");
  if (description.length < 120 || description.length > 160) {
    failures.push(`description length is ${description.length}, expected 120-160`);
  }
  if (!openGraphImage) failures.push("missing og:image");
  if (!twitterImage) failures.push("missing twitter:image");
  if (openGraphImage && !openGraphImage.startsWith(canonicalOrigin)) {
    failures.push(`og:image is not absolute on ${canonicalOrigin}: ${openGraphImage}`);
  }
  if (twitterImage && !twitterImage.startsWith(canonicalOrigin)) {
    failures.push(`twitter:image is not absolute on ${canonicalOrigin}: ${twitterImage}`);
  }

  let previousHeading = 0;
  for (const heading of matches(html, /<h([1-3])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi)) {
    const level = Number(heading[1]);
    if (previousHeading && level > previousHeading + 1) {
      failures.push(`heading hierarchy skips H${previousHeading} to H${level}`);
      break;
    }
    previousHeading = level;
  }

  for (const script of matches(html, /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      schemas.push(JSON.parse(script[1]));
    } catch {
      failures.push("invalid JSON-LD");
    }
  }
  if (requiresBreadcrumb && !/<nav[^>]+aria-label=["']Breadcrumb["']/i.test(html)) {
    failures.push("missing visible breadcrumb navigation");
  }
  if (requiresBreadcrumb && !schemas.some((schema) => schema?.["@type"] === "BreadcrumbList")) {
    failures.push("missing BreadcrumbList schema");
  }
  if (schemas.some((schema) => schema?.["@type"] === "Person" || schema?.["@type"] === "LocalBusiness")) {
    failures.push("forbidden Person or LocalBusiness schema");
  }

  const visibleText = textContent(html);
  for (const faq of schemas.filter((schema) => schema?.["@type"] === "FAQPage")) {
    for (const question of faq.mainEntity || []) {
      if (question?.name && !visibleText.includes(question.name)) {
        failures.push(`FAQPage question is not visible: ${question.name}`);
      }
      const answer = question?.acceptedAnswer?.text;
      if (answer && !visibleText.includes(answer)) {
        failures.push(`FAQPage answer is not visible for: ${question.name || "unknown question"}`);
      }
    }
  }

  for (const article of schemas.filter((schema) => schema?.["@type"] === "BlogPosting")) {
    if (article.author?.["@type"] !== "Organization") failures.push("BlogPosting author is not Organization");
    if (!article.publisher?.logo?.url) failures.push("BlogPosting publisher logo is missing");
    if (!article.datePublished || !article.dateModified) failures.push("BlogPosting dates are incomplete");
    if (!article.image) failures.push("BlogPosting image is missing");
    if (!article.inLanguage) failures.push("BlogPosting locale is missing");
    if (!article.mainEntityOfPage?.["@id"]) failures.push("BlogPosting canonical mainEntityOfPage is missing");
  }

  return {
    failures,
    title: textContent(titles[0]?.[1] || ""),
    socialImages: [openGraphImage, twitterImage].filter(Boolean),
  };
}

const urls = await sitemapUrls();
const privatePattern = /^\/(?:app|api|v1)(?:\/|$)/;
const privateUrls = urls.filter((url) => privatePattern.test(new URL(url).pathname));
if (privateUrls.length) {
  throw new Error(`private URLs found in sitemap: ${privateUrls.join(", ")}`);
}

const errors = [];
const seenTitles = new Map();
const socialImages = new Set();
for (const url of urls) {
  const { response, body } = await fetchText(url);
  if (response.status !== 200) {
    errors.push(`${url}: HTTP ${response.status}`);
    continue;
  }
  const result = auditHTML(url, body);
  for (const failure of result.failures) errors.push(`${url}: ${failure}`);
  for (const image of result.socialImages) socialImages.add(image);
  if (result.title) {
    const previous = seenTitles.get(result.title);
    if (previous) errors.push(`${url}: duplicate title also used by ${previous}`);
    seenTitles.set(result.title, url);
  }
}

const imageQueue = [...socialImages];
const workers = Array.from({ length: Math.min(6, imageQueue.length) }, async () => {
  while (imageQueue.length) {
    const imageUrl = imageQueue.shift();
    const localUrl = imageUrl.replace(canonicalOrigin, baseUrl);
    try {
      const response = await fetch(localUrl, { redirect: "manual" });
      const contentType = response.headers.get("content-type") || "";
      const body = Buffer.from(await response.arrayBuffer());
      if (response.status !== 200) {
        errors.push(`${imageUrl}: social image HTTP ${response.status}`);
        continue;
      }
      if (!contentType.startsWith("image/")) {
        errors.push(`${imageUrl}: social asset is ${contentType || "missing content type"}`);
        continue;
      }
      const dimensions = contentType.startsWith("image/png") ? pngSize(body) : null;
      if (dimensions && (dimensions.width !== 1200 || dimensions.height !== 630)) {
        errors.push(`${imageUrl}: expected 1200x630, got ${dimensions.width}x${dimensions.height}`);
      }
    } catch (error) {
      errors.push(`${imageUrl}: social image fetch failed: ${error.message}`);
    }
  }
});
await Promise.all(workers);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`SEO audit passed for ${urls.length} sitemap URLs`);
