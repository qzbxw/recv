"use client";

import Link from "next/link";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";
import { getCopy } from "@/i18n";

const TIER_LINKS = {
  trial: "auth",
  merchant: "merchant",
  developer: "dev",
  business: "business",
} as const;

const POPULAR_TIER = "developer";

type Tier = keyof typeof TIER_LINKS;

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-accent" aria-hidden>
      <circle cx="7" cy="7" r="7" fill="currentColor" fillOpacity="0.12" />
      <path d="M4 7l2.5 2.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PricingClient({ locale }: { locale: string }) {
  const copy = getCopy(locale as "en" | "ru");
  const reveal = useReveal();
  const tiers: Tier[] = ["trial", "merchant", "developer", "business"];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  const isRu = locale === "ru";

  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      {/* HERO */}
      <section className="lend-hero--centered relative overflow-hidden" ref={reveal}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{isRu ? "Главная" : "Home"}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{copy.pricing.kicker}</span>
          </nav>
          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{copy.pricing.kicker}</span>
          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-6 text-white">
            {copy.pricing.title}
          </h1>
          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto">
            {isRu
              ? "Выберите тариф под текущий объём. 0% комиссии на всех планах, выплаты идут напрямую на ваши кошельки."
              : "Choose the plan that matches your volume. 0% commission on all plans, with payouts going directly to your wallets."}
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="py-12 md:py-20 pb-24" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lend-reveal--2">
            {tiers.map((tier, idx) => {
              const item = copy.pricing[tier];
              const isPopular = tier === POPULAR_TIER;
              const isCustom = isNaN(Number(item.price));
              const href = tier === "trial" ? "/app/auth" : `/${locale}/${TIER_LINKS[tier]}`;

              return (
                <article
                  key={tier}
                  className={`lend-card lend-spotlight-card group relative flex flex-col p-8 transition-all duration-700 hover:scale-[1.02] ${isPopular ? "border-accent/40 bg-accent/[0.04]" : ""}`}
                  onMouseMove={handleMouseMove}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="lend-card-spotlight" />
                  {isPopular && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <span className="block text-[9px] font-black tracking-[0.3em] uppercase text-accent bg-accent/[0.1] border border-accent/30 px-4 py-1 rounded-b-xl">
                        {copy.pricing.popular}
                      </span>
                    </div>
                  )}

                  {/* Background number */}
                  <div className="absolute top-0 right-0 p-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity pointer-events-none select-none">
                    <span className="text-[6rem] font-black italic leading-none font-['Montserrat']">{String(idx + 1).padStart(2, "0")}</span>
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-4 block">{String(idx + 1).padStart(2, "0")}</span>
                    <h2 className="text-lg font-black tracking-tight mb-6 group-hover:text-white transition-colors">{item.name}</h2>

                    {/* Price */}
                    <div className="mb-8 pb-6 border-b border-white/[0.06]">
                      {isCustom ? (
                        <p className="text-3xl font-black text-white/70">{item.price}</p>
                      ) : (
                        <div className="flex items-end gap-1">
                          <span className="text-2xl font-bold text-white/40 self-start mt-1">$</span>
                          <span className="text-5xl font-black tracking-tighter text-white">{item.price}</span>
                          <span className="text-sm text-white/30 mb-2">/mo</span>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="flex flex-col gap-3 flex-1 mb-8">
                      {item.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm text-white/55 group-hover:text-white/70 transition-colors">
                          <CheckIcon />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={href}
                      className={`mt-auto block text-center py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
                        isPopular
                          ? "bg-accent text-white hover:bg-accent/90 shadow-[0_8px_24px_rgba(124,58,237,0.3)]"
                          : "border border-white/15 text-white/70 hover:border-accent/50 hover:text-white bg-white/[0.02] hover:bg-accent/[0.06]"
                      }`}
                    >
                      {item.cta}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST ROW */}
      <section className="py-14 border-t border-white/[0.04]" ref={reveal}>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 flex flex-wrap justify-center gap-8 md:gap-14">
            {[
              { stat: "0%", label: isRu ? "Комиссии с оборота" : "Turnover fees" },
              { stat: "100%", label: isRu ? "Non-custodial" : "Non-custodial" },
              { stat: "5", label: isRu ? "Платежных сетей MVP" : "MVP payment networks" },
              { stat: "∞", label: isRu ? "Объём транзакций" : "Transaction volume" },
            ].map(({ stat, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-400 to-violet-500 bg-clip-text text-transparent">{stat}</p>
                <p className="text-xs font-bold tracking-[0.15em] uppercase text-white/35 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 relative overflow-hidden lend-spotlight-card group" onMouseMove={handleMouseMove} ref={reveal}>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
          <h2 className="lend-reveal--1 text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
            {isRu ? "Запустить recv" : "Launch recv"}
          </h2>
          <p className="lend-reveal--2 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium mb-12">
            {isRu
              ? "Non-custodial криптоплатежи напрямую на ваши кошельки. Без комиссии с оборота."
              : "Non-custodial crypto payments straight to your wallets. Zero turnover fees."}
          </p>
          <div className="lend-reveal--3 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.25)]" href="/app/auth">
              {copy.hero.primary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center" href={`/${locale}/dev`}>
              {copy.nav.pricing.developer}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
