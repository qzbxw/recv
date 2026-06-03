import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "recv Business | Scalable Crypto Processing",
    description: "Extended API limits, team access, and priority support for businesses with high payment volume.",
    alternates: {
      canonical: `/${locale}/business`,
    },
    openGraph: {
      title: "recv Business",
      description: "Scale your crypto processing with advanced analytics and team support.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="business" />;
}
