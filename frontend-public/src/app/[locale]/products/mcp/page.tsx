import { ProductPageClient } from "@/components/ProductPageClient";
import { Metadata } from "next";
import { getCopy } from "@/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = getCopy(locale).marketing.mcpProduct;
  
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: `/${locale}/products/mcp`,
    },
    openGraph: {
      title: copy.metadata.title,
      description: copy.metadata.description,
      url: `/${locale}/products/mcp`,
      siteName: "Reqst",
      locale: locale,
      type: "website",
      images: [
        {
          url: "/logo.jpg",
          width: 1200,
          height: 630,
          alt: "Reqst MCP Agent Integration",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metadata.title,
      description: copy.metadata.description,
      images: ["/logo.jpg"],
    },
  };
}

export default function Page() {
  return <ProductPageClient variant="mcpProduct" />;
}
