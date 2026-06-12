import type { Metadata } from "next";
import localFont from "next/font/local";
import { UIProvider } from "@/components/UIProvider";
import { OptionalAnalytics } from "@/components/OptionalAnalytics";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { LOCALES } from "@/i18n";
import { publicSiteUrl } from "@/lib/seo";
import "../tailwind.css";
import "../globals.css";

const manrope = localFont({
  src: "../fonts/manrope-variable.woff2",
  display: "swap",
  variable: "--font-manrope",
  weight: "200 800",
});

const montserrat = localFont({
  src: "../fonts/montserrat-variable.woff2",
  display: "swap",
  variable: "--font-montserrat",
  weight: "100 900",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;

  return {
    metadataBase: new URL(publicSiteUrl()),
    title: {
      default: "recv | Crypto Payments Infrastructure",
      template: "%s",
    },
    description: "Professional crypto processing with instant payouts directly to your wallets. Non-custodial, fixed fees, and support for major networks like TON, TRON, Solana, and Base.",
    alternates: {
      canonical: `/${locale}`,
      languages: {
        "en": "/en",
        "ru": "/ru",
        "x-default": "/en",
      },
    },
    openGraph: {
      type: "website",
      siteName: "recv",
      title: "recv | Crypto Payments Infrastructure",
      description: "Professional crypto processing with instant payouts directly to your wallets.",
    },
    twitter: {
      card: "summary_large_image",
      title: "recv | Crypto Payments Infrastructure",
      description: "Professional crypto processing with instant payouts directly to your wallets.",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "theme-color": "#7c3aed",
      ...(process.env.YANDEX_VERIFICATION
        ? { "yandex-verification": process.env.YANDEX_VERIFICATION }
        : {}),
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manrope.variable} ${montserrat.variable}`}
    >
      <body suppressHydrationWarning>
        <UIProvider initialLanguage={locale as "ru" | "en"}>
          {props.children}
        </UIProvider>
        <WebVitalsReporter />
        <OptionalAnalytics
          gtmId={process.env.GTM_ID}
          yandexMetrikaId={process.env.YANDEX_METRIKA_ID}
        />
      </body>
    </html>
  );
}
