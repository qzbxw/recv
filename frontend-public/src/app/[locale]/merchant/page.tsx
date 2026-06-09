import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = rawLocale === "ru" ? "ru" : "en";
  const description = metadataDescription(locale, locale === "ru"
    ? "Принимайте криптоплатежи напрямую на свои кошельки через checkout recv, консоль продавца и уведомления о статусе."
    : "Accept crypto payments directly to your wallets with recv hosted checkout, a merchant console, and payment status notifications.");
  return {
    title: locale === "ru" ? "Криптоплатежи для продавцов напрямую на кошелёк | recv" : "Direct-to-Wallet Crypto Payments for Merchants | recv",
    description,
    alternates: {
      canonical: `/${locale}/merchant`,
      languages: languageAlternates("/merchant"),
    },
    openGraph: {
      title: locale === "ru" ? "recv для продавцов" : "recv for Merchants",
      images: socialImages(locale, locale === "ru" ? "recv для продавцов" : "recv for Merchants", locale === "ru" ? "Тариф" : "Plan"),
      description,
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  return <PlanPage variant="merchant" language={locale === "ru" ? "ru" : "en"} />;
}
