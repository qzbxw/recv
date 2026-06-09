import { Suspense } from "react";
import { getCopy } from "@/lib/copy";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AttributionCapture } from "../AttributionCapture";
import { LocaleAlternatesProvider } from "./localeAlternates";
import { MarketingInteractions } from "./MarketingInteractions";

export function MarketingLayout({
  children,
  language,
}: {
  children: React.ReactNode;
  language: "ru" | "en";
}) {
  return (
    <LocaleAlternatesProvider>
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
