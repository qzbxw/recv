import { Metadata } from "next";
import { normalizeLocale } from "@/i18n";
import HomeClient from "@/components/HomeClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const isRu = locale === "ru";
  return {
    title: isRu
      ? "recv — крипто-платёжный шлюз для USDT, TON и TRON"
      : "recv — Crypto Payment Gateway for USDT, TON & TRON",
    description: isRu
      ? "Принимайте криптоплатежи напрямую на свои кошельки. Non-custodial checkout, API и вебхуки для USDT, TON, TON_USDT, TRON, Base и BSC. Без комиссии с оборота."
      : "Accept crypto payments directly to your own wallets. Non-custodial checkout, API, and webhooks for USDT, TON, TON_USDT, TRON, Base, and BSC — with zero turnover fees.",
    keywords: isRu
      ? "крипто платёжный шлюз, принять криптоплатежи, USDT платежи, TON платежи, non-custodial криптоплатежи, recv, TRON платежи"
      : "crypto payment gateway, accept crypto payments, USDT payments, TON payments, non-custodial crypto, recv, TRON payments, crypto checkout API",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ru: "/ru",
        "x-default": "/en",
      },
    },
  };
}

export default async function Page(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  return <HomeClient language={locale} />;
}
