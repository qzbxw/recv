import { LOCALES } from "@/i18n";
import { getAllDocSlugs, getDocBySlug } from "@/lib/docs";
import { PUBLIC_ROUTES, publicSiteUrl } from "@/lib/seo";

export const revalidate = 3600;
export const runtime = "nodejs";

function routeEntries(baseUrl: string) {
  return LOCALES.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => ({
      locale,
      path: `/${locale}${route}`,
      url: `${baseUrl}/${locale}${route}`,
    })),
  );
}

function localizedRoutePairs(baseUrl: string) {
  return PUBLIC_ROUTES.map((route) => ({
    route,
    en: `${baseUrl}/en${route}`,
    ru: `${baseUrl}/ru${route}`,
    x_default: `${baseUrl}/en${route}`,
  }));
}

function docsEntries(baseUrl: string) {
  return LOCALES.flatMap((locale) =>
    getAllDocSlugs(locale).map((slug) => {
      const doc = getDocBySlug(slug, locale);
      const joined = slug.join("/");
      return {
        locale,
        slug: joined,
        title: String(doc?.data.title || joined),
        description: String(doc?.data.description || ""),
        rendered_url: `${baseUrl}/${locale}/docs/${joined}`,
        raw_url: `${baseUrl}/${locale}/docs/raw/${joined}`,
      };
    }),
  );
}

export async function GET() {
  const baseUrl = publicSiteUrl();
  return Response.json(
    {
      name: "recv",
      canonical_site: baseUrl,
      locales: LOCALES,
      organization_id: `${baseUrl}/#organization`,
      website_id: `${baseUrl}/#website`,
      entity_ids: {
        organization: `${baseUrl}/#organization`,
        website: `${baseUrl}/#website`,
        pricing_product_en: `${baseUrl}/en/pricing#product`,
        pricing_product_ru: `${baseUrl}/ru/pricing#product`,
        products_collection_en: `${baseUrl}/en/products#item-list`,
        networks_collection_en: `${baseUrl}/en/networks#item-list`,
        use_cases_collection_en: `${baseUrl}/en/use-cases#item-list`,
        docs_intro_article_en: `${baseUrl}/en/docs/introduction#article`,
      },
      public_routes: routeEntries(baseUrl),
      localized_route_pairs: localizedRoutePairs(baseUrl),
      developer_docs: docsEntries(baseUrl),
      machine_readable_resources: {
        llms: `${baseUrl}/llms.txt`,
        llms_full: `${baseUrl}/llms-full.txt`,
        agent_actions: `${baseUrl}/agent-actions.json`,
        openapi: `${baseUrl}/openapi.json`,
        rss_en: `${baseUrl}/en/rss.xml`,
        rss_ru: `${baseUrl}/ru/rss.xml`,
        sitemap: `${baseUrl}/sitemap.xml`,
      },
      primary_actions: [
        { id: "read_docs", href: `${baseUrl}/en/docs/introduction` },
        { id: "view_pricing", href: `${baseUrl}/en/pricing` },
        { id: "sign_in", href: `${baseUrl}/app/auth` },
        { id: "try_checkout_demo", href: `${baseUrl}/app/checkout/demo` },
        { id: "inspect_openapi", href: `${baseUrl}/openapi.json` },
      ],
      support_contacts: {
        support: "support@recv.money",
        legal: "legal@recv.money",
      },
      api_resources: {
        openapi: `${baseUrl}/openapi.json`,
        docs: `${baseUrl}/en/docs/introduction`,
        authentication: `${baseUrl}/en/docs/authentication`,
        invoices: `${baseUrl}/en/docs/invoices`,
        webhooks: `${baseUrl}/en/docs/webhooks`,
      },
      api: {
        base_url: `${baseUrl}/v1`,
        authentication: "API keys are sent in request headers, never in URLs.",
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
