import { UIProvider } from "@/components/UIProvider";
import { Metadata } from "next";
import { LOCALES } from "@/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "en": "/en",
        "ru": "/ru",
        "x-default": "/en",
      },
    },
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  return (
    <div lang={locale}>
      <UIProvider initialLanguage={locale as "ru" | "en"}>
        {props.children}
      </UIProvider>
    </div>
  );
}
