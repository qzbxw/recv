import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCopy, normalizeLocale } from "@/i18n";
import { UseCasePageClient } from "@/components/UseCasePageClient";

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
  const description = page.metadata.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/use-cases/${usecase}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
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
