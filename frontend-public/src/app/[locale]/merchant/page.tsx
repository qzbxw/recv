import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "Reqst Merchant | Direct-to-Wallet Crypto Payments",
    description: "Accept crypto payments with 0% turnover fees. Professional dashboard and instant notifications.",
    alternates: {
      canonical: `/${locale}/merchant`,
    },
    openGraph: {
      title: "Reqst Merchant",
      description: "Non-custodial crypto processing for everyone.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="merchant" />;
}
