import { Suspense } from "react";
import { getCopy } from "@/lib/copy";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AttributionCapture } from "../AttributionCapture";
import { JsonLd } from "../JsonLd";
import { LocaleAlternatesProvider, type LocaleAlternates } from "./localeAlternates";
import { MarketingInteractions } from "./MarketingInteractions";
import { webPageJsonLd } from "@/lib/geo";
import type { Locale } from "@/i18n";

type PageType = "WebPage" | "AboutPage" | "ContactPage" | "CollectionPage" | "ProfilePage" | "ItemPage";

function localizedPath(language: Locale, path?: string) {
  if (!path || path === "/") return `/${language}`;
  if (path === `/${language}` || path.startsWith(`/${language}/`)) return path;
  return `/${language}${path.startsWith("/") ? path : `/${path}`}`;
}

function inferredPageType(pathname: string): PageType {
  if (pathname.endsWith("/about")) return "AboutPage";
  if (pathname.endsWith("/contact")) return "ContactPage";
  if (/\/blog\/author\//.test(pathname)) return "ProfilePage";
  if (/\/(?:products|networks|use-cases|compare|blog)$/.test(pathname)) return "CollectionPage";
  if (/\/(?:products|networks|use-cases|compare|docs|blog)\//.test(pathname)) return "ItemPage";
  return "WebPage";
}

export function MarketingLayout({
  children,
  language,
  path,
  alternates = null,
  pageType,
  mainEntityId,
}: {
  children: React.ReactNode;
  language: Locale;
  path?: string;
  alternates?: LocaleAlternates | null;
  pageType?: PageType;
  mainEntityId?: string;
}) {
  const pathname = localizedPath(language, path);

  return (
    <LocaleAlternatesProvider initialValue={alternates}>
      <JsonLd
        schema={webPageJsonLd({
          locale: language,
          pathname,
          type: pageType || inferredPageType(pathname),
          mainEntity: mainEntityId ? { "@id": mainEntityId } : undefined,
        })}
      />
      <div className="lend-page min-h-screen bg-black text-white selection:bg-purple-500/30">
        <Suspense fallback={null}>
          <AttributionCapture />
        </Suspense>
        <MarketingInteractions />
        <div className="lend-backdrop lend-backdrop--grid" />
        <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
        <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

        <Header language={language} nav={getCopy(language).nav} />

        <main className="lend-shell relative z-10 pt-40 min-h-[calc(100vh-200px)]">
          {children}
        </main>

        <Footer language={language} />
      </div>
    </LocaleAlternatesProvider>
  );
}
