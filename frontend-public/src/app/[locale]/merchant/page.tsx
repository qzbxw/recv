import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";
import { languageAlternates } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "recv Merchant | Direct-to-Wallet Crypto Payments",
    description: "Accept crypto payments with 0% turnover fees. Professional dashboard and instant notifications.",
    alternates: {
      canonical: `/${locale}/merchant`,
      languages: languageAlternates("/merchant"),
    },
    openGraph: {
      title: "recv Merchant",
      description: "Non-custodial crypto processing for everyone.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="merchant" />;
}
