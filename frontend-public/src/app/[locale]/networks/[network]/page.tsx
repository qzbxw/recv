import { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { NetworkDetailClient, type NetworkDetailPageCopy } from "@/components/NetworkDetailClient";
import { getCopy, normalizeLocale } from "@/i18n";

type Props = {
  params: Promise<{ network: string; locale: string }>;
};

type NetworkSlug = keyof ReturnType<typeof getCopy>["marketing"]["networkPages"];

const NETWORK_SLUGS = [
  "ton",
  "tron",
  "solana",
  "base",
  "bsc",
  "arbitrum",
] as const satisfies readonly NetworkSlug[];

function isNetworkSlug(value: string): value is NetworkSlug {
  return NETWORK_SLUGS.includes(value as NetworkSlug);
}

export async function generateStaticParams() {
  const locales = ["en", "ru"];
  return locales.flatMap((locale) =>
    NETWORK_SLUGS.map((network) => ({ locale, network }))
  );
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { network, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isNetworkSlug(network)) return { title: "Network Not Found" };

  const page = getCopy(locale).marketing.networkPages[network];

  return {
    title: `${page.metadata.title} | Reqst`,
    description: page.metadata.description,
    alternates: {
      canonical: `/${locale}/networks/${network}`,
      languages: {
        en: `/en/networks/${network}`,
        ru: `/ru/networks/${network}`,
        "x-default": `/en/networks/${network}`,
      },
    },
    openGraph: {
      title: page.metadata.title,
      description: page.metadata.description,
    },
  };
}

export default async function NetworkPage(props: Props) {
  const { network, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isNetworkSlug(network)) notFound();

  const copy = getCopy(locale);
  const page = copy.marketing.networkPages[network];

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `Reqst ${page.name} Payment Gateway`,
    operatingSystem: "Web",
    applicationCategory: "PaymentApplication",
    description: page.metadata.description,
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: page.assets.items.map((a) => a.name).join(", "),
  };

  return (
    <>
      <JsonLd schema={softwareSchema} />
      <NetworkDetailClient
        locale={locale}
        network={network}
        page={page as unknown as NetworkDetailPageCopy}
      />
    </>
  );
}
