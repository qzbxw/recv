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
    title: `${copy.marketing.networksHub.title} | recv`,
    description: metadataDescription(locale, copy.marketing.networksHub.description),
    alternates: {
      canonical: `/${locale}/networks`,
      languages: { en: "/en/networks", ru: "/ru/networks", "x-default": "/en/networks" },
    },
    keywords: locale === "ru"
      ? "крипто сети, TON платежи, TRON USDT, Solana платежи, Base платежи, Arbitrum USDT, BSC платежи, блокчейн интеграция"
      : "crypto payment networks, TON payments, TRON USDT, Solana payments, Base payments, Arbitrum USDT, BSC payments, blockchain integration",
    openGraph: {
      title: copy.marketing.networksHub.title,
      images: socialImages(locale, copy.marketing.networksHub.title, locale === "ru" ? "Сети" : "Networks"),
      description: metadataDescription(locale, copy.marketing.networksHub.description),
    },
  };
}

export default async function NetworksHubPage(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);

  const networks = [
    { name: "TON", slug: "ton", desc: locale === "ru" ? "Нативная сеть Telegram для быстрых и дешёвых переводов с поддержкой TON USDT." : "Telegram-native network for fast, low-cost transfers with TON USDT support." },
    { name: "TON USDT", slug: "ton_usdt", desc: locale === "ru" ? "Стейблкоин Tether (USDT) в сети TON для стабильных Telegram-платежей." : "Tether (USDT) stablecoin on the TON network for volatility-free Telegram payments." },
    { name: "TRON", slug: "tron", desc: locale === "ru" ? "Самая популярная сеть для USDT. Высокая ликвидность и широкое принятие." : "The most popular network for USDT payments with high liquidity and adoption." },
    { name: "Solana", slug: "solana", desc: locale === "ru" ? "Высокоскоростная сеть с ультра-низкими комиссиями и мгновенным подтверждением." : "High-speed network with ultra-low fees and near-instant confirmations." },
    { name: "Base", slug: "base", desc: locale === "ru" ? "L2 сеть от Coinbase для надёжных EVM-совместимых платежей." : "Coinbase's L2 for reliable EVM-compatible payments with institutional backing." },
    { name: "Arbitrum", slug: "arbitrum", desc: locale === "ru" ? "EVM L2 для USDT и Circle-native USDC платежей." : "EVM L2 for USDT and Circle-native USDC payments." },
    { name: "BSC", slug: "bsc", desc: locale === "ru" ? "Binance Smart Chain с широкой поддержкой токенов и высокой ликвидностью." : "Binance Smart Chain with broad token support and high DeFi liquidity." },
  ];

  const cards = networks.map((net) => ({
    title: net.name,
    body: net.desc,
    slug: net.slug,
    href: `/${locale}/networks/${net.slug}`,
    linkLabel: locale === "ru" ? "Подробнее" : "Explore network",
  }));

  const siteListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: copy.marketing.networksHub.title,
    description: copy.marketing.networksHub.description,
    itemListElement: networks.map((net, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: net.name,
      url: `https://recv.money/${locale}/networks/${net.slug}`,
    })),
  };

  return (
    <>
      <JsonLd schema={siteListSchema} />
      <HubPageClient
        language={locale}
        path="/networks"
        kicker={copy.marketing.networksHub.kicker}
        title={copy.marketing.networksHub.title}
        description={copy.marketing.networksHub.description}
        cards={cards}
        finalTitle={locale === "ru" ? "Запустить recv" : "Launch recv"}
        finalBody={locale === "ru"
          ? "Non-custodial криптоплатежи напрямую на ваши кошельки. Без комиссии с оборота."
          : "Non-custodial crypto payments straight to your wallets. Zero turnover fees."}
        finalPrimary={copy.hero.primary}
        finalSecondaryLabel={copy.nav.docs}
        finalSecondaryHref={`/${locale}/docs`}
      />
    </>
  );
}
