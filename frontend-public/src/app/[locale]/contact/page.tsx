import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { getStaticPageCopy } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = getStaticPageCopy("contact", locale);
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    keywords: locale === "ru"
      ? "контакт recv, recv поддержка, recv продажи, интеграция recv, recv демо"
      : "contact recv, recv support, recv sales, recv integration help, recv demo",
    alternates: { canonical: `/${locale}/contact`, languages: { en: "/en/contact", ru: "/ru/contact", "x-default": "/en/contact" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Контакты" : "Contact") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  return <StaticMarketingPage locale={locale} path="/contact" copy={getStaticPageCopy("contact", normalizedLocale)} />;
}
