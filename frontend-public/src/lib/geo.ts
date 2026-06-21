import type { Locale } from "@/i18n";

const SITE_NAME = "recv";
const DEFAULT_SITE_URL = "https://recv.money";
const BRAND_LOGO_PATH = "/logo-transparent.png";

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type JsonLdObject = { [key: string]: JsonLdValue };
type WebPageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "ProfilePage" | "ItemPage";

function publicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    DEFAULT_SITE_URL
  ).replace(/\/+$/, "");
}

function absoluteBrandLogoUrl() {
  return `${publicSiteUrl()}${BRAND_LOGO_PATH}`;
}

function absoluteUrl(pathname = "") {
  if (/^https?:\/\//i.test(pathname)) return pathname;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${publicSiteUrl()}${path}`;
}

export function schemaId(pathname: string, fragment: string) {
  return `${absoluteUrl(pathname)}#${fragment}`;
}

export function organizationRef() {
  return { "@id": `${publicSiteUrl()}/#organization` };
}

export function websiteRef() {
  return { "@id": `${publicSiteUrl()}/#website` };
}

export function publisherSchema() {
  return {
    "@type": "Organization",
    "@id": `${publicSiteUrl()}/#organization`,
    name: SITE_NAME,
    url: publicSiteUrl(),
    logo: {
      "@type": "ImageObject",
      url: absoluteBrandLogoUrl(),
      width: 500,
      height: 500,
    },
  };
}

export function webPageJsonLd({
  locale,
  pathname,
  name,
  description,
  type = "WebPage",
  mainEntity,
}: {
  locale: Locale;
  pathname: string;
  name?: string;
  description?: string;
  type?: WebPageType;
  mainEntity?: JsonLdObject;
}) {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": type,
    "@id": schemaId(pathname, "webpage"),
    url: absoluteUrl(pathname),
    name,
    description,
    inLanguage: locale,
    isPartOf: websiteRef(),
    publisher: organizationRef(),
    mainEntity,
  });
}

export function softwareApplicationJsonLd({
  locale,
  pathname,
  name,
  description,
  featureList,
  applicationCategory = "PaymentApplication",
  applicationSubCategory = "PaymentGateway",
}: {
  locale: Locale;
  pathname: string;
  name: string;
  description: string;
  featureList?: string | readonly string[];
  applicationCategory?: string;
  applicationSubCategory?: string;
}) {
  const features = Array.isArray(featureList) ? featureList.join(", ") : featureList;
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": schemaId(pathname, "software"),
    name,
    description,
    url: absoluteUrl(pathname),
    inLanguage: locale,
    operatingSystem: "Web",
    applicationCategory,
    applicationSubCategory,
    publisher: organizationRef(),
    featureList: features,
  });
}

export function productJsonLd({
  locale,
  pathname,
  name,
  description,
  offers,
}: {
  locale: Locale;
  pathname: string;
  name: string;
  description: string;
  offers?: JsonLdObject[];
}) {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": schemaId(pathname, "product"),
    name,
    description,
    url: absoluteUrl(pathname),
    inLanguage: locale,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers,
  });
}

export function serviceJsonLd({
  locale,
  pathname,
  name,
  description,
  serviceType = "Cryptocurrency payment processing",
  areaServed = "Worldwide",
}: {
  locale: Locale;
  pathname: string;
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
}) {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": schemaId(pathname, "service"),
    name,
    description,
    url: absoluteUrl(pathname),
    inLanguage: locale,
    serviceType,
    areaServed,
    provider: organizationRef(),
  });
}

export function itemListJsonLd({
  locale,
  pathname,
  name,
  description,
  items,
}: {
  locale: Locale;
  pathname: string;
  name: string;
  description?: string;
  items: readonly { name: string; url: string }[];
}) {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": schemaId(pathname, "item-list"),
    name,
    description,
    inLanguage: locale,
    url: absoluteUrl(pathname),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.url),
    })),
  });
}

export function techArticleJsonLd({
  locale,
  pathname,
  headline,
  description,
}: {
  locale: Locale;
  pathname: string;
  headline: string;
  description: string;
}) {
  return stripUndefined({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": schemaId(pathname, "article"),
    headline,
    description,
    inLanguage: locale,
    url: absoluteUrl(pathname),
    mainEntityOfPage: { "@id": schemaId(pathname, "webpage") },
    author: organizationRef(),
    publisher: publisherSchema(),
  });
}

export function stripUndefined<T extends JsonLdObject>(schema: T): T {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        value && typeof value === "object" && !Array.isArray(value)
          ? stripUndefined(value as JsonLdObject)
          : value,
      ]),
  ) as T;
}
