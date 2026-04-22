"use client";

import Link from "next/link";
import { COPY } from "@/lib/copy";

export function Footer({ language }: { language: "ru" | "en" }) {
  const copy = COPY[language];
  return (
    <footer className="lend-footer">
      <div className="lend-footer-links">
        <Link href={`/${language}/privacy`}>{copy.footer.privacy}</Link>
        <Link href={`/${language}/terms`}>{copy.footer.terms}</Link>
        <Link href="/docs">Docs</Link>
        <Link href={`/${language}/products/api`}>{copy.footer.api}</Link>
        <Link href={`/${language}/enterprise`}>{copy.footer.b2b}</Link>
        <Link href="/app/auth">{copy.footer.console}</Link>
      </div>
    </footer>
  );
}
