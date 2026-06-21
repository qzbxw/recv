import { Metadata } from "next";
import { HubPageClient } from "@/components/HubPageClient";
import { getCopy, normalizeLocale } from "@/i18n";
import { JsonLd } from "@/components/JsonLd";
import { itemListJsonLd } from "@/lib/geo";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);

  return {
    title: `${copy.marketing.compareHub.title} | recv`,
    description: metadataDescription(locale, copy.marketing.compareHub.description),
    alternates: {
      canonical: `/${locale}/compare`,
      languages: { en: "/en/compare", ru: "/ru/compare", "x-default": "/en/compare" },
    },
    keywords: locale === "ru"
      ? "сравнение крипто шлюзов, альтернатива NowPayments, альтернатива BitPay, альтернатива Coinbase Commerce, recv vs конкуренты, non-custodial платёжный шлюз"
      : "crypto payment gateway comparison, NowPayments alternative, BitPay alternative, Coinbase Commerce alternative, recv vs competitors, non-custodial payment gateway",
    openGraph: {
      title: copy.marketing.compareHub.title,
      images: socialImages(locale, copy.marketing.compareHub.title, locale === "ru" ? "Сравнения" : "Comparisons"),
      description: metadataDescription(locale, copy.marketing.compareHub.description),
    },
  };
}

export default async function CompareHubPage(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const hub = copy.marketing.compareHub;

  const cards = hub.items.map((item) => ({
    title: item.title,
    body: item.body,
    slug: item.slug,
    href: `/${locale}/compare/${item.slug}`,
    linkLabel: locale === "ru" ? "Сравнить →" : "See comparison →",
  }));

  const siteListSchema = itemListJsonLd({
    locale,
    pathname: `/${locale}/compare`,
    name: hub.title,
    description: hub.description,
    items: hub.items.map((item) => ({
      name: item.title,
      url: `/${locale}/compare/${item.slug}`,
    })),
  });

  return (
    <>
      <JsonLd schema={siteListSchema} />
      <HubPageClient
        language={locale}
        path="/compare"
        kicker={hub.kicker}
        title={hub.title}
        description={hub.description}
        cards={cards}
        finalTitle={locale === "ru" ? "Готовы обновить инфраструктуру?" : "Ready to upgrade your infrastructure?"}
        finalBody={locale === "ru"
          ? "Подключите recv для безопасного non-custodial процессинга без комиссий с оборота."
          : "Join forward-thinking companies that choose recv for secure, non-custodial processing."}
        finalPrimary={copy.hero.primary}
        finalSecondaryLabel={copy.nav.docs}
        finalSecondaryHref={`/${locale}/docs`}
      />
    </>
  );
}
