import { Metadata } from "next";
import { StatusPageClient } from "@/components/StatusPageClient";
import { PUBLIC_MARKETING_COPY } from "@/i18n";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale } = await props.params;
  const lang = locale === "ru" ? "ru" : "en";
  const copy = PUBLIC_MARKETING_COPY[lang];

  return {
    title: `${copy.statusHub.title} | recv`,
    description: copy.statusHub.description,
    alternates: {
      canonical: `/${lang}/status`,
      languages: {
        en: "/en/status",
        ru: "/ru/status",
        "x-default": "/en/status",
      },
    },
    openGraph: {
      title: `${copy.statusHub.title} | recv`,
      description: copy.statusHub.description,
    },
  };
}

export default function Page() {
  return <StatusPageClient />;
}
