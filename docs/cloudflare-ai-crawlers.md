# Cloudflare AI crawler access

Cloudflare can block AI crawler user agents before requests reach Caddy or the
application. The origin serves an open `robots.txt`, Markdown documentation,
`llms.txt`, `llms-full.txt`, and OpenAPI, but Cloudflare must allow those bots.

In the Cloudflare dashboard for `recv.money`:

1. Open **Security → Settings → Bot traffic**.
2. Set **Block AI bots** to **Do not block**.
3. Disable **Instruct AI bot traffic with robots.txt** so Cloudflare does not
   prepend managed `Disallow` rules to the application's `robots.txt`.
4. Open **AI Crawl Control → Crawlers** and set ClaudeBot, GPTBot,
   Google-Extended, PerplexityBot, and Amazonbot to **Allow**.

Verify after the settings propagate:

```bash
curl -A 'ClaudeBot/1.0' -I https://recv.money/llms.txt
curl -A 'GPTBot/1.0' -I https://recv.money/en/docs/raw/introduction
curl https://recv.money/robots.txt
```

The first two requests must return `200`. The robots file must be the short
application-owned version and must not contain `BEGIN Cloudflare Managed`.
