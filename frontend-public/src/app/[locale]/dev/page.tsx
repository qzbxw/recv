import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";
import { languageAlternates } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "recv Developer | API & Webhooks",
    description: "Professional API v1 Beta and Webhook notifications for high-load projects.",
    alternates: {
      canonical: `/${locale}/dev`,
      languages: languageAlternates("/dev"),
    },
    openGraph: {
      title: "recv Developer",
      description: "API and Webhooks for direct-to-wallet processing.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="developer" />;
}
