import type { Metadata } from "next";
import { Suspense } from "react";
import localFont from "next/font/local";
import { UIProvider } from "@/components/UIProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { OptionalAnalytics } from "@/components/OptionalAnalytics";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { UTMEventTracker } from "@/components/UTMEventTracker";
import { JsonLd } from "@/components/JsonLd";
import { LOCALES } from "@/i18n";
import {
  BRAND_ICON_PATH,
  BRAND_LOGO_PATH,
  organizationJsonLd,
  publicSiteUrl,
  websiteJsonLd,
} from "@/lib/seo";
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
      types: {
        "application/rss+xml": [
          { url: "/rss.xml", title: "recv RSS" },
          { url: `/${locale}/rss.xml`, title: `recv ${locale === "ru" ? "RU" : "EN"} RSS` },
        ],
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
    icons: {
      icon: [
        { url: BRAND_ICON_PATH, type: "image/png", sizes: "512x512" },
        { url: BRAND_LOGO_PATH, type: "image/png", sizes: "500x500" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [
        { url: "/apple-icon.png", type: "image/png", sizes: "192x192" },
        { url: BRAND_LOGO_PATH, type: "image/png", sizes: "500x500" },
      ],
      shortcut: ["/favicon.ico"],
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
  const normalizedLocale = locale as "ru" | "en";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manrope.variable} ${montserrat.variable}`}
    >
      <body suppressHydrationWarning>
        <UIProvider initialLanguage={normalizedLocale}>
          {props.children}
        </UIProvider>
        <JsonLd schema={organizationJsonLd(normalizedLocale)} />
        <JsonLd schema={websiteJsonLd(normalizedLocale)} />
        <CookieConsent language={normalizedLocale} />
        <Suspense fallback={null}>
          <UTMEventTracker />
        </Suspense>
        <WebVitalsReporter />
        <OptionalAnalytics
          gtmId={process.env.GTM_ID}
          yandexMetrikaId={process.env.YANDEX_METRIKA_ID}
        />
      </body>
    </html>
  );
}
