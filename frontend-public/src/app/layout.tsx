import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
