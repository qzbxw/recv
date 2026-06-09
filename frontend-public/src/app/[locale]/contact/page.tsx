import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { STATIC_PAGE_COPY } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = STATIC_PAGE_COPY.contact[locale];
  return {
    title: `${copy.title} | recv`,
    description: copy.body,
    keywords: locale === "ru"
      ? "контакт recv, recv поддержка, recv продажи, интеграция recv, recv демо"
      : "contact recv, recv support, recv sales, recv integration help, recv demo",
    alternates: { canonical: `/${locale}/contact`, languages: { en: "/en/contact", ru: "/ru/contact", "x-default": "/en/contact" } },
  };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <StaticMarketingPage locale={locale} path="/contact" copy={STATIC_PAGE_COPY.contact[normalizeLocale(locale)]} />;
}
