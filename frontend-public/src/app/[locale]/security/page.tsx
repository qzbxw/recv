import type { Metadata } from "next";
import { StaticMarketingPage } from "@/components/marketing/StaticMarketingPage";
import { STATIC_PAGE_COPY } from "@/lib/static-pages";
import { normalizeLocale } from "@/i18n";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const copy = STATIC_PAGE_COPY.security[locale];
  return { title: `${copy.title} | Reqst`, description: copy.body, alternates: { canonical: `/${locale}/security`, languages: { en: "/en/security", ru: "/ru/security", "x-default": "/en/security" } } };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  return <StaticMarketingPage locale={locale} copy={STATIC_PAGE_COPY.security[normalizeLocale(locale)]} />;
}
