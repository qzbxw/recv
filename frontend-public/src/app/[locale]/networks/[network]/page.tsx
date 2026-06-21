import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { NetworkDetailClient, type NetworkDetailPageCopy } from "@/components/NetworkDetailClient";
import { getCopy, normalizeLocale } from "@/i18n";
import { softwareApplicationJsonLd } from "@/lib/geo";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ network: string; locale: string }>;
};

type NetworkSlug = keyof ReturnType<typeof getCopy>["marketing"]["networkPages"];

const NETWORK_SLUGS = [
  "ton",
  "tron",
  "solana",
  "base",
  "arbitrum",
  "bsc",
] as const satisfies readonly NetworkSlug[];

type SupportedNetworkSlug = (typeof NETWORK_SLUGS)[number];

function isNetworkSlug(value: string): value is SupportedNetworkSlug {
  return NETWORK_SLUGS.includes(value as SupportedNetworkSlug);
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

  if (network === "ton_usdt") {
    return {
      title: `${locale === "ru" ? "USDT в TON" : "USDT on TON"} | recv`,
      alternates: {
        canonical: `/${locale}/networks/ton`,
        languages: {
          en: "/en/networks/ton",
          ru: "/ru/networks/ton",
          "x-default": "/en/networks/ton",
        },
      },
    };
  }

  if (!isNetworkSlug(network)) return { title: "Network Not Found" };

  const page = getCopy(locale).marketing.networkPages[network];

  return {
    title: `${page.metadata.title} | recv`,
    description: metadataDescription(locale, page.metadata.description),
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
      images: socialImages(locale, page.metadata.title, locale === "ru" ? "Сеть" : "Network"),
      description: metadataDescription(locale, page.metadata.description),
    },
  };
}

export default async function NetworkPage(props: Props) {
  const { network, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (network === "ton_usdt") {
    redirect(`/${locale}/networks/ton`);
  }

  if (!isNetworkSlug(network)) notFound();

  const copy = getCopy(locale);
  const page = copy.marketing.networkPages[network];

  const softwareSchema = softwareApplicationJsonLd({
    locale,
    pathname: `/${locale}/networks/${network}`,
    name: `recv ${page.name} Payment Gateway`,
    description: page.metadata.description,
    featureList: page.assets.items.map((a) => a.name),
  });

  return (
    <>
      <JsonLd schema={softwareSchema} />
      <NetworkDetailClient
        key={`${locale}-${network}`}
        locale={locale}
        network={network}
        page={page as unknown as NetworkDetailPageCopy}
      />
    </>
  );
}
