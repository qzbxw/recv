import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getCopy, normalizeLocale } from "@/i18n";
import { PricingClient } from "@/components/PricingClient";

type Props = {
  params: Promise<{ locale: string }>;
};

const tierLinks = {
  merchant: "merchant",
  developer: "dev",
  business: "business",
  enterprise: "enterprise",
} as const;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  return {
    title: locale === "ru"
      ? "Тарифы крипто-платёжного шлюза — 0% с оборота | Reqst"
      : "Crypto Payment Gateway Pricing — 0% Turnover Fees | Reqst",
    description: locale === "ru"
      ? "Тарифы Reqst для non-custodial криптоплатежей: Merchant, Developer, Business и Enterprise без комиссии с оборота."
      : "Reqst pricing for non-custodial crypto payments: Merchant, Developer, Business and Enterprise plans with no turnover fees.",
    keywords: locale === "ru"
      ? "тарифы крипто-шлюз, non-custodial, 0% комиссия, криптоплатежи цены"
      : "crypto payment gateway pricing, non-custodial, zero fees, crypto payment plans",
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        en: "/en/pricing",
        ru: "/ru/pricing",
        "x-default": "/en/pricing",
      },
    },
    openGraph: {
      title: locale === "ru" ? "Тарифы | Reqst" : "Pricing | Reqst",
      description: locale === "ru"
        ? "Non-custodial крипто-платежи. 0% комиссии с оборота."
        : "Non-custodial crypto payments. 0% turnover fees.",
    },
  };
}

export default async function PricingPage(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const tiers = ["merchant", "developer", "business", "enterprise"] as const;

  const offers = tiers
    .map((tier) => {
      const item = copy.pricing[tier];
      const numeric = Number(item.price);
      if (item.price === "Custom" || Number.isNaN(numeric)) return null;
      return {
        "@type": "Offer",
        name: item.name,
        price: numeric,
        priceCurrency: "USD",
        url: `https://reqst.xyz/${locale}/${tierLinks[tier]}`,
        availability: "https://schema.org/InStock",
      };
    })
    .filter(Boolean);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Reqst Crypto Payment Gateway",
    description: locale === "ru"
      ? "Non-custodial крипто-платёжный шлюз с прямым зачислением на кошельки и без комиссии с оборота."
      : "Non-custodial crypto payment gateway with direct-to-wallet settlement and no turnover fees.",
    brand: { "@type": "Brand", name: "Reqst" },
    offers,
  };

  return (
    <>
      <JsonLd schema={productSchema} />
      <PricingClient locale={locale} />
    </>
  );
}
