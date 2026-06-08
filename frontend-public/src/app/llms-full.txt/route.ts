import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";
import { publicSiteUrl, textResponse } from "@/lib/seo";

export async function GET() {
  const baseUrl = publicSiteUrl();
  const documents = getAllDocSlugs("en")
    .map((slug) => {
      const doc = getDocBySlug(slug, "en");
      if (!doc) return "";
      const title = String(doc.data.title || slug.join("/"));
      return `# ${title}

Source: ${baseUrl}/en/docs/${slug.join("/")}

${doc.content.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  const body = `# recv: Full Developer Context

Canonical site: ${baseUrl}
API base URL: ${baseUrl}/v1
OpenAPI: ${baseUrl}/openapi.json

recv is a non-custodial crypto payment gateway. It creates payment invoices, monitors supported blockchains, settles funds directly to merchant wallets, and sends signed webhook notifications. This file contains the English developer documentation intended for retrieval and agent context.

${documents}
`;

  return textResponse(body, "text/markdown");
}
