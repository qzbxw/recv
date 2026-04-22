import { PlanPage } from "@/components/PlanPageClient";
import { Metadata } from "next";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    title: "Reqst Developer | API & Webhooks",
    description: "Professional API v1 Beta and Webhook notifications for high-load projects.",
    alternates: {
      canonical: `/${locale}/dev`,
    },
    openGraph: {
      title: "Reqst Developer",
      description: "API and Webhooks for direct-to-wallet processing.",
    },
  };
}

export default function Page() {
  return <PlanPage variant="developer" />;
}
