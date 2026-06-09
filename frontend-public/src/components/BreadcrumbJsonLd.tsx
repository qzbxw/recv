import { JsonLd } from "@/components/JsonLd";
import { publicSiteUrl } from "@/lib/seo";

export type BreadcrumbSchemaItem = {
  name: string;
  href: string;
};

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbSchemaItem[] }) {
  const baseUrl = publicSiteUrl();
  return (
    <JsonLd
      schema={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: new URL(item.href, baseUrl).toString(),
        })),
      }}
    />
  );
}
