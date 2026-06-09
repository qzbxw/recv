import { notFound } from "next/navigation";
import { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { COMPARE_FAQ } from "@/lib/compare-faq";
import { getCopy, normalizeLocale } from "@/i18n";
import { CompareDetailClient } from "@/components/CompareDetailClient";
import { metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ competitor: string; locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { competitor, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const data = copy.marketing.comparePages[competitor as keyof typeof copy.marketing.comparePages];

  if (!data) return { title: "Comparison Not Found" };

  return {
    title: `${data.title} | recv`,
    description: metadataDescription(locale, data.description),
    alternates: {
      canonical: `/${locale}/compare/${competitor}`,
      languages: {
        en: `/en/compare/${competitor}`,
        ru: `/ru/compare/${competitor}`,
        "x-default": `/en/compare/${competitor}`,
      },
    },
    openGraph: {
      title: data.title,
      images: socialImages(locale, data.title, locale === "ru" ? "Сравнение" : "Comparison"),
      description: metadataDescription(locale, data.description),
    },
  };
}

export default async function ComparePage(props: Props) {
  const { competitor, locale: rawLocale } = await props.params;
  const locale = normalizeLocale(rawLocale);
  const copy = getCopy(locale);
  const data = copy.marketing.comparePages[competitor as keyof typeof copy.marketing.comparePages];

  if (!data) notFound();

  const faq = COMPARE_FAQ[competitor]?.[locale] ?? [];
  const faqSchema = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <>
      {faqSchema ? <JsonLd schema={faqSchema} /> : null}
      <CompareDetailClient
        locale={locale}
        competitor={competitor}
        data={data}
        faq={faq}
        heroPrimary={copy.hero.primary}
        heroSecondary={copy.nav.docs}
        docsLabel={copy.nav.docs}
      />
    </>
  );
}
