"use client";

import Link from "next/link";

export function Header({ language }: { language: "ru" | "en" }) {
  return (
    <header className="lend-topbar">
      <div className="lend-topbar-main">
        <Link className="lend-brand" href={`/${language}`}>
          <strong>reqst</strong>
        </Link>

        <div className="lend-topbar-actions">
          <div className="lend-language" role="group" aria-label="language switcher">
            <Link href="/ru" className={language === "ru" ? "active" : ""}>RU</Link>
            <Link href="/en" className={language === "en" ? "active" : ""}>EN</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
