import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "./tailwind.css";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-montserrat",
  weight: ["600", "700", "800", "900"],
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${montserrat.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
