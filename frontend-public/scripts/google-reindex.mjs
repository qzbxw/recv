#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";

const DEFAULT_SITEMAP_URL = "https://recv.money/sitemap.xml";
const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";

function argValue(name, fallback = undefined) {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix));
  if (value) return value.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function hasArg(name) {
  return process.argv.includes(name);
}

function usage() {
  console.log(`Usage:
  GOOGLE_APPLICATION_CREDENTIALS=/tmp/service-account.json node scripts/google-reindex.mjs [options]

Options:
  --sitemap <url>           Sitemap index URL. Default: ${DEFAULT_SITEMAP_URL}
  --site-url <url>          Search Console site URL. Default: sc-domain:recv.money
  --limit <n>               Max URLs to notify through Indexing API.
  --dry-run                 Collect URLs and print what would be submitted.
  --skip-search-console     Do not submit sitemap through Search Console API.
  --skip-indexing-api       Do not submit URL_UPDATED notifications.
`);
}

function base64url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function xmlLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) =>
    match[1].replaceAll("&amp;", "&"),
  );
}

async function fetchText(url, init = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
    headers: {
      "User-Agent": "recv-seo-reindex/1.0",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  }
  return body;
}

async function collectSitemapUrls(sitemapUrl) {
  const rootXml = await fetchText(sitemapUrl);
  const sitemapUrls = xmlLocs(rootXml);
  if (!sitemapUrls.length) return [];

  const childUrls = [];
  for (const childSitemapUrl of sitemapUrls) {
    const childXml = await fetchText(childSitemapUrl);
    childUrls.push(...xmlLocs(childXml));
  }
  return [...new Set(childUrls)].sort();
}

async function loadCredentials() {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) return JSON.parse(inline);

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error("Set GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_SERVICE_ACCOUNT_JSON.");
  }
  return JSON.parse(await fs.readFile(credentialsPath, "utf8"));
}

async function accessToken(credentials, scopes) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: scopes.join(" "),
    aud: credentials.token_uri || "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = crypto.sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key);
  const assertion = `${unsigned}.${base64url(signature)}`;

  const response = await fetch(payload.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function submitSitemap(token, siteUrl, sitemapUrl) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const response = await fetch(endpoint, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204) return { ok: true };
  const body = await response.text();
  return { ok: false, status: response.status, body };
}

async function notifyUrlUpdated(token, url) {
  const response = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, type: "URL_UPDATED" }),
  });
  const body = await response.text();
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  if (hasArg("--help") || hasArg("-h")) {
    usage();
    return;
  }

  const sitemapUrl = argValue("--sitemap", DEFAULT_SITEMAP_URL);
  const siteUrl = argValue("--site-url", "sc-domain:recv.money");
  const dryRun = hasArg("--dry-run");
  const skipSearchConsole = hasArg("--skip-search-console");
  const skipIndexingApi = hasArg("--skip-indexing-api");
  const limitValue = argValue("--limit");
  const limit = limitValue ? Number(limitValue) : undefined;

  const urls = await collectSitemapUrls(sitemapUrl);
  const selectedUrls = Number.isFinite(limit) ? urls.slice(0, limit) : urls;
  console.log(`Collected ${urls.length} sitemap URLs from ${sitemapUrl}.`);
  console.log(`Selected ${selectedUrls.length} URLs for Indexing API notification.`);

  if (dryRun) {
    console.log(selectedUrls.join("\n"));
    return;
  }

  const credentials = await loadCredentials();
  const token = await accessToken(credentials, [INDEXING_SCOPE, WEBMASTERS_SCOPE]);

  if (!skipSearchConsole) {
    const result = await submitSitemap(token, siteUrl, sitemapUrl);
    if (result.ok) {
      console.log(`Search Console sitemap submitted: ${sitemapUrl}`);
    } else {
      console.error(`Search Console sitemap submit failed: HTTP ${result.status} ${result.body}`);
    }
  }

  if (!skipIndexingApi) {
    let ok = 0;
    let failed = 0;
    for (const url of selectedUrls) {
      const result = await notifyUrlUpdated(token, url);
      if (result.ok) {
        ok += 1;
        console.log(`OK ${url}`);
      } else {
        failed += 1;
        console.error(`FAIL ${result.status} ${url} ${result.body}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    console.log(`Indexing API done: ${ok} OK, ${failed} failed.`);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
