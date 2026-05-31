import { Metadata } from "next";
import { HubPageClient } from "@/components/HubPageClient";
import { getCopy, normalizeLocale } from "@/i18n";
import { JsonLd } from "@/components/JsonLd";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);

  return {
    title: `${copy.marketing.useCasesHub.title} | Reqst`,
    description: copy.marketing.useCasesHub.description,
    keywords: locale === "ru"
      ? "кейсы использования, Telegram крипто-шоп, SaaS биллинг криптовалюты, цифровые товары"
      : "crypto payment use cases, telegram shop crypto, saas crypto billing, digital goods payments",
    alternates: {
      canonical: `/${locale}/use-cases`,
      languages: { en: "/en/use-cases", ru: "/ru/use-cases", "x-default": "/en/use-cases" },
    },
    openGraph: {
      title: copy.marketing.useCasesHub.title,
      description: copy.marketing.useCasesHub.description,
    },
  };
}

export default async function UseCasesHubPage(props: Props) {
  const { locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const hub = copy.marketing.useCasesHub;

  const useCases = [
    {
      slug: "telegram-shops",
      title: copy.nav.useCases.tgShops,
      body: locale === "ru"
        ? "Принимайте криптоплатежи в Telegram-ботах и Mini Apps. TON-первый чекаут с прямым зачислением на ваши кошельки."
        : "Accept crypto payments in Telegram bots and Mini Apps. TON-first checkout with direct-to-wallet settlement.",
    },
    {
      slug: "saas-billing",
      title: copy.nav.useCases.saas,
      body: locale === "ru"
        ? "Автоматизируйте подписочный биллинг в крипте. Webhook-уведомления для CRM-интеграции и мгновенная верификация."
        : "Automate subscription billing in crypto. Webhook notifications for CRM integration and instant payment verification.",
    },
    {
      slug: "digital-goods",
      title: copy.nav.useCases.digital,
      body: locale === "ru"
        ? "Продавайте цифровые товары с мгновенным подтверждением оплаты. Поддержка всех мажорных сетей и стейблкоинов."
        : "Sell digital goods with instant payment confirmation across all major networks and stablecoins.",
    },
    {
      slug: "paid-communities",
      title: copy.nav.useCases.communities,
      body: locale === "ru"
        ? "Монетизируйте закрытые сообщества и контент с помощью крипто-подписок и разовых платежей."
        : "Monetize exclusive communities and content with crypto subscriptions and one-time payments.",
    },
  ];

  const cards = useCases.map((uc) => ({
    title: uc.title,
    body: uc.body,
    slug: uc.slug,
    href: `/${locale}/use-cases/${uc.slug}`,
    linkLabel: locale === "ru" ? "Изучить кейс →" : "Read use case →",
  }));

  const siteListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: hub.title,
    description: hub.description,
    itemListElement: useCases.map((uc, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: uc.title,
      url: `https://reqst.xyz/${locale}/use-cases/${uc.slug}`,
    })),
  };

  return (
    <>
      <JsonLd schema={siteListSchema} />
      <HubPageClient
        language={locale}
        kicker={hub.kicker}
        title={hub.title}
        description={hub.description}
        cards={cards}
        finalTitle={hub.customUseCase.title}
        finalBody={hub.customUseCase.body}
        finalPrimary={copy.final.primary}
        finalSecondaryLabel={copy.nav.pricing.enterprise}
        finalSecondaryHref={`/${locale}/enterprise`}
      />
    </>
  );
}
