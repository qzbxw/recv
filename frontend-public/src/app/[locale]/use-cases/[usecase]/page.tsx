import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, normalizeLocale } from "@/i18n";
import { UseCasePageClient } from "@/components/UseCasePageClient";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ usecase: string; locale: string }>;
};

type UseCaseSlug = keyof ReturnType<typeof getCopy>["marketing"]["useCasePages"];

const USE_CASE_SLUGS = [
  "telegram-shops",
  "saas-billing",
  "digital-goods",
  "paid-communities",
] as const satisfies readonly UseCaseSlug[];

function isUseCaseSlug(value: string): value is UseCaseSlug {
  return USE_CASE_SLUGS.includes(value as UseCaseSlug);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { usecase, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isUseCaseSlug(usecase)) return { title: "Use Case Not Found" };

  const page = getCopy(locale).marketing.useCasePages[usecase];
  const title = `${page.metadata.title} | recv`;
  const description = metadataDescription(locale, page.metadata.description);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/use-cases/${usecase}`,
      languages: languageAlternates(`/use-cases/${usecase}`),
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: socialImages(locale, title, locale === "ru" ? "Сценарий" : "Use case"),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: socialImages(locale, title, locale === "ru" ? "Сценарий" : "Use case"),
    },
  };
}

export default async function UseCasePage(props: Props) {
  const { usecase, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);

  if (!isUseCaseSlug(usecase)) notFound();

  const copy = getCopy(locale);
  const page = copy.marketing.useCasePages[usecase];

  return (
    <UseCasePageClient 
      usecase={usecase}
      locale={locale}
      copy={page}
    />
  );
}
