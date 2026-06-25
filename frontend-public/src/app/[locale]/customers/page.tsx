import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { getStaticPageCopy } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = getStaticPageCopy("customers", locale);
  return {
    title: `${copy.title} | recv`,
    description: metadataDescription(locale, copy.body),
    keywords: locale === "ru"
      ? "кто использует recv, крипто платежи для SaaS, Telegram магазины, цифровые товары крипто оплата, платные сообщества"
      : "who uses recv, crypto payments for SaaS, Telegram shops crypto, digital goods crypto payment, paid communities crypto",
    alternates: { canonical: `/${locale}/customers`, languages: { en: "/en/customers", ru: "/ru/customers", "x-default": "/en/customers" } },
    openGraph: { images: socialImages(locale, copy.title, locale === "ru" ? "Клиенты" : "Customers") },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  const normalizedLocale = normalizeLocale(locale);
  return <StaticMarketingPage locale={locale} path="/customers" copy={getStaticPageCopy("customers", normalizedLocale)} />;
}
