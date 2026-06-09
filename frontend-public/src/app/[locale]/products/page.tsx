import { Metadata } from "next";
import { HubPageClient } from "@/components/HubPageClient";
import { getCopy, normalizeLocale } from "@/i18n";
import { JsonLd } from "@/components/JsonLd";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);

  return {
    title: `${copy.marketing.productsHub.title} | recv`,
    description: metadataDescription(locale, copy.marketing.productsHub.description),
    keywords: locale === "ru"
      ? "крипто-чекаут, API платежей, выставление счётов, крипто-инвойсинг"
      : "crypto checkout, payment api, crypto invoicing, webhook payments",
    alternates: {
      canonical: `/${locale}/products`,
      languages: { en: "/en/products", ru: "/ru/products", "x-default": "/en/products" },
    },
    openGraph: {
      title: copy.marketing.productsHub.title,
      images: socialImages(locale, copy.marketing.productsHub.title, locale === "ru" ? "Продукты" : "Products"),
      description: metadataDescription(locale, copy.marketing.productsHub.description),
    },
  };
}

export default async function ProductsHubPage(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const hub = copy.marketing.productsHub;

  const cards = [
    {
      title: hub.checkout.title,
      body: hub.checkout.desc,
      slug: "checkout",
      href: `/${locale}/products/checkout`,
      linkLabel: hub.checkout.link,
    },
    {
      title: hub.api.title,
      body: hub.api.desc,
      slug: "api",
      href: `/${locale}/products/api`,
      linkLabel: hub.api.link,
    },
    {
      title: hub.invoicing.title,
      body: hub.invoicing.desc,
      slug: "invoicing",
      href: `/${locale}/products/invoicing`,
      linkLabel: hub.invoicing.link,
    },
    {
      title: hub.mcp.title,
      body: hub.mcp.desc,
      slug: "mcp",
      href: `/${locale}/products/mcp`,
      linkLabel: hub.mcp.link,
    },
  ];

  const siteListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hub.title,
    description: hub.description,
    itemListElement: cards.map((card, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: card.title,
      url: `https://recv.money/${locale}/products/${card.slug}`,
    })),
  };

  return (
    <>
      <JsonLd schema={siteListSchema} />
      <HubPageClient
        language={locale}
        path="/products"
        kicker={hub.kicker}
        title={hub.title}
        description={hub.description}
        cards={cards}
        finalTitle={copy.final.title}
        finalBody={copy.final.body}
        finalPrimary={copy.final.primary}
        finalSecondaryLabel={copy.nav.pricing.title}
        finalSecondaryHref={`/${locale}/pricing`}
      />
    </>
  );
}
