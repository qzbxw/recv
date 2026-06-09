import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export type HubCard = {
  title: string;
  body: string;
  slug: string;
  href: string;
  /** Optional label for the link button */
  linkLabel?: string;
};

export type HubPageProps = {
  language: "en" | "ru";
  kicker: string;
  title: string;
  description: string;
  cards: HubCard[];
  finalTitle: string;
  finalBody: string;
  finalPrimary: string;
  finalSecondaryLabel: string;
  finalSecondaryHref: string;
  path: string;
};

// Keywords that get gradient treatment in hub hero titles
const GRADIENT_WORDS = new Set([
  "universal", "smarter", "solutions", "every", "better",
  "universal", "scale",
  "криптo", "умный", "лучше", "решение",
]);

function isGradient(word: string) {
  return GRADIENT_WORDS.has(word.replace(/[^a-zа-яё]/gi, "").toLowerCase());
}

export function HubPageClient({
  language, kicker, title, description, cards,
  finalTitle, finalBody, finalPrimary, finalSecondaryLabel, finalSecondaryHref, path,
}: HubPageProps) {


  const gridCols = cards.length % 3 === 0 ? "lg:grid-cols-3" : "lg:grid-cols-2";

  return (
    <MarketingLayout language={language}>
      <BreadcrumbJsonLd
        items={[
          { name: language === "ru" ? "Главная" : "Home", href: `/${language}` },
          { name: kicker, href: `/${language}${path}` },
        ]}
      />
      {/* HERO */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${language}`} className="hover:text-accent transition-colors">
              {language === "ru" ? "Главная" : "Home"}
            </Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{kicker}</span>
          </nav>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{kicker}</span>

          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8">
            {title.split(" ").map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-[0.22em] last:mr-0 transition-all duration-300 hover:scale-105 ${
                  isGradient(word)
                    ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto">
            {description}
          </p>
        </div>
      </section>

      {/* CARDS GRID */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols} gap-6 lend-reveal--2`}>
            {cards.map((card, idx) => (
              <Link
                key={card.slug}
                href={card.href}
                className="lend-card lend-spotlight-card group relative p-10 flex flex-col justify-between min-h-[280px] transition-all duration-700 ease-in-out hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />

                {/* Background index number */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none select-none">
                  <span className="text-[8rem] font-black italic leading-none font-['Montserrat']">{String(idx + 1).padStart(2, "0")}</span>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 mb-6 block uppercase">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight group-hover:text-white transition-colors">{card.title}</h2>
                  <p className="opacity-50 text-sm md:text-base leading-relaxed group-hover:opacity-75 transition-opacity flex-1">{card.body}</p>
                  <span className="mt-8 text-xs font-bold tracking-[0.15em] uppercase text-accent/50 group-hover:text-accent transition-colors flex items-center gap-2">
                    {card.linkLabel ?? (language === "ru" ? "Подробнее" : "Learn more")}
                    <span className="group-hover:translate-x-1.5 transition-transform duration-500">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 relative overflow-hidden lend-spotlight-card group" data-reveal>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
          <h2 className="lend-reveal--1 text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
            {finalTitle}
          </h2>
          <p className="lend-reveal--2 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium mb-12">
            {finalBody}
          </p>
          <div className="lend-reveal--3 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.25)]" href="/app/auth">
              {finalPrimary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center" href={finalSecondaryHref}>
              {finalSecondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
