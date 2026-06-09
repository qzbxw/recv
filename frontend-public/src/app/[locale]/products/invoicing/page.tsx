import { ProductPageClient } from "@/components/ProductPageClient";
import { Metadata } from "next";
import { getCopy } from "@/i18n";
import { languageAlternates, metadataDescription, socialImages } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = getCopy(locale).marketing.invoicingProduct;
  const description = metadataDescription(locale === "ru" ? "ru" : "en", copy.metadata.description);
  
  return {
    title: copy.metadata.title,
    description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: `/${locale}/products/invoicing`,
      languages: languageAlternates("/products/invoicing"),
    },
    openGraph: {
      title: copy.metadata.title,
      description,
      url: `/${locale}/products/invoicing`,
      siteName: "recv",
      locale: locale,
      type: "website",
      images: socialImages(locale, copy.metadata.title, locale === "ru" ? "Продукт" : "Product"),
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadata.title,
      description,
      images: socialImages(locale, copy.metadata.title, locale === "ru" ? "Продукт" : "Product"),
    },
  };
}

export default async function Page(props: Props) {
  const { locale } = await props.params;
  return <ProductPageClient variant="invoicingProduct" language={locale === "ru" ? "ru" : "en"} />;
}
