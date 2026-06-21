import { publicSiteUrl } from "@/lib/seo";

export const revalidate = 3600;

export async function GET() {
  const baseUrl = publicSiteUrl();

  return Response.json(
    {
      name: "recv agent actions",
      canonical_site: baseUrl,
      actions: [
        {
          id: "read_docs",
          label: "Read developer documentation",
          href: `${baseUrl}/en/docs/introduction`,
          machine_resource: `${baseUrl}/llms-full.txt`,
        },
        {
          id: "view_pricing",
          label: "View pricing",
          href: `${baseUrl}/en/pricing`,
        },
        {
          id: "sign_in",
          label: "Sign in or create workspace",
          href: `${baseUrl}/app/auth`,
        },
        {
          id: "try_checkout_demo",
          label: "Try hosted checkout demo",
          href: `${baseUrl}/app/checkout/demo`,
        },
        {
          id: "inspect_openapi",
          label: "Inspect OpenAPI schema",
          href: `${baseUrl}/openapi.json`,
        },
        {
          id: "contact_support",
          label: "Contact support",
          email: "support@recv.money",
        },
        {
          id: "contact_legal",
          label: "Contact legal",
          email: "legal@recv.money",
        },
      ],
      notes: [
        "API keys must be sent in headers, never in URLs.",
        "Public marketing and documentation pages are indexable; machine context endpoints are noindex retrieval aids.",
      ],
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}
