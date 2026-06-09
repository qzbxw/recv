import type { Metadata } from "next";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { OptionalAnalytics } from "@/components/OptionalAnalytics";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import "./tailwind.css";
import "./globals.css";

const manrope = localFont({
  src: "./fonts/manrope-variable.woff2",
  display: "swap",
  variable: "--font-manrope",
  weight: "200 800",
});

const montserrat = localFont({
  src: "./fonts/montserrat-variable.woff2",
  display: "swap",
  variable: "--font-montserrat",
  weight: "100 900",
});

const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://recv.money").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "recv | Crypto Payments Infrastructure",
    template: "%s"
  },
  description: "Professional crypto processing with instant payouts directly to your wallets. Non-custodial, fixed fees, and support for major networks like TON, TON_USDT, and TRON.",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-recv-locale") === "ru" ? "ru" : "en";

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manrope.variable} ${montserrat.variable}`}
    >
      <body suppressHydrationWarning>
        {children}
        <WebVitalsReporter />
        <OptionalAnalytics
          gtmId={process.env.GTM_ID}
          yandexMetrikaId={process.env.YANDEX_METRIKA_ID}
        />
      </body>
    </html>
  );
}
