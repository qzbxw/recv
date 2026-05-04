import { ProductPageClient } from "@/components/ProductPageClient";
import { Metadata } from "next";
import { getCopy } from "@/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = getCopy(locale).marketing.invoicingProduct;
  
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: `/${locale}/products/invoicing`,
    },
    openGraph: {
      title: copy.metadata.title,
      description: copy.metadata.description,
    },
  };
}

export default function Page() {
  return <ProductPageClient variant="invoicingProduct" />;
}
