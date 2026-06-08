import { ProductPageClient } from "@/components/ProductPageClient";
import { Metadata } from "next";
import { getCopy } from "@/i18n";
import { languageAlternates } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = getCopy(locale).marketing.apiProduct;
  
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: `/${locale}/products/api`,
      languages: languageAlternates("/products/api"),
    },
    openGraph: {
      title: copy.metadata.title,
      description: copy.metadata.description,
      url: `/${locale}/products/api`,
      siteName: "recv",
      locale: locale,
      type: "website",
      images: [
        {
          url: `/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "recv Blockchain API",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadata.title,
      description: copy.metadata.description,
      images: [`/${locale}/opengraph-image`],
    },
  };
}

export default function Page() {
  return <ProductPageClient variant="apiProduct" />;
}
