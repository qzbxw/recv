import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";
import { publicSiteUrl, textResponse } from "@/lib/seo";

function localeDocuments(locale: "en" | "ru", baseUrl: string) {
  return getAllDocSlugs(locale)
    .map((slug) => {
      const doc = getDocBySlug(slug, locale);
      if (!doc) return "";
      const title = String(doc.data.title || slug.join("/"));
      return `# ${title}

Language: ${locale}
Source: ${baseUrl}/${locale}/docs/raw/${slug.join("/")}
Rendered page: ${baseUrl}/${locale}/docs/${slug.join("/")}

${doc.content.trim()}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
}

export async function GET() {
  const baseUrl = publicSiteUrl();
  const englishDocuments = localeDocuments("en", baseUrl);
  const russianDocuments = localeDocuments("ru", baseUrl);

  const body = `# recv: Full Developer Context

Canonical site: ${baseUrl}
API base URL: ${baseUrl}/v1
OpenAPI: ${baseUrl}/openapi.json

recv is a non-custodial crypto payment gateway. It creates payment invoices, monitors supported blockchains, settles funds directly to merchant wallets, and sends signed webhook notifications. This file contains the English developer documentation intended for retrieval and agent context.

## English documentation

${englishDocuments}

---

## Russian documentation

${russianDocuments}
`;

  return textResponse(body, "text/markdown");
}
