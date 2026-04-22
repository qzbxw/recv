import type { Metadata } from "next";
import "./globals.css";

const publicSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || "https://reqst.xyz").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: "Reqst | Crypto Payments Infrastructure",
  description: "Professional crypto processing with instant payouts directly to your wallets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
