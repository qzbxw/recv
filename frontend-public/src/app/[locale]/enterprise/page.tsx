import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "Reqst Enterprise | Custom Infrastructure",
    description: "High throughput, expanded API limits, and priority support for large-scale systems.",
    alternates: {
      canonical: `/${locale}/enterprise`,
    },
    openGraph: {
      title: "Reqst Enterprise",
      description: "Enterprise scale direct-to-wallet infrastructure.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="enterprise" />;
}
