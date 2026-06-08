import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";
import { PUBLIC_ROUTES, publicSiteUrl, textResponse } from "@/lib/seo";

function docsSection(baseUrl: string) {
  return getAllDocSlugs("en")
    .map((slugParts) => {
      const slug = slugParts.join("/");
      const doc = getDocBySlug(slugParts, "en");
      const title = String(doc?.data.title || slug);
      const description = String(doc?.data.description || "").trim();
      return `- [${title}](${baseUrl}/en/docs/${slug})${description ? `: ${description}` : ""}`;
    })
    .join("\n");
}

function routeLinks(baseUrl: string, prefix: string) {
  return PUBLIC_ROUTES.filter((route) => route.startsWith(prefix))
    .map((route) => {
      const label = route.split("/").filter(Boolean).at(-1) || "Home";
      return `- [${label.replaceAll("-", " ")}](${baseUrl}/en${route})`;
    })
    .join("\n");
}

export async function GET() {
  const baseUrl = publicSiteUrl();
  const content = `# recv

> recv is non-custodial cryptocurrency payment infrastructure for merchants, SaaS products, Telegram businesses, developers, and AI agents. Payments settle directly to merchant-controlled wallets.

recv provides hosted checkout, invoicing, a REST API, signed webhooks, blockchain payment detection, and an MCP server. The canonical website is ${baseUrl}.

## Products
${routeLinks(baseUrl, "/products/")}

## Supported networks
${routeLinks(baseUrl, "/networks/")}

## Use cases
${routeLinks(baseUrl, "/use-cases/")}

## Developer documentation
${docsSection(baseUrl)}

## Machine-readable resources
- [OpenAPI specification](${baseUrl}/openapi.json): Current REST API schema.
- [Full LLM documentation](${baseUrl}/llms-full.txt): Combined English product and developer documentation.
- [RSS feed](${baseUrl}/en/rss.xml): English product and engineering updates.
- [Sitemap index](${baseUrl}/sitemap.xml): Canonical indexable pages.

## Authentication
The developer API is rooted at ${baseUrl}/v1. Authenticate with an API key in the \`X-API-Key\` header. Never place API keys in URLs or public prompts.

## Optional
- [Pricing](${baseUrl}/en/pricing): Current plans and product availability.
- [Security](${baseUrl}/en/security): Security and non-custodial architecture.
- [Status](${baseUrl}/en/status): Service and network status.
`;

  return textResponse(content);
}
