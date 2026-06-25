import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { getCopy } from "@/i18n";
import { schemaId } from "@/lib/geo";

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
  const tiers: Tier[] = ["trial", "merchant", "developer", "business"];


  const isRu = locale === "ru";

  return (
    <MarketingLayout language={locale as "en" | "ru"} path="/pricing" mainEntityId={schemaId(`/${locale}/pricing`, "product")}>
      {/* HERO */}
      <section className="lend-hero--centered lend-pricing-hero relative overflow-hidden is-revealed">
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
      <section className="lend-pricing-cards-section py-12 md:py-20 pb-24" data-reveal>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lend-reveal--2">
            {tiers.map((tier, idx) => {
              const item = copy.pricing[tier];
              const isPopular = tier === POPULAR_TIER;
              const isPro = tier === "business";
              const isCustom = isNaN(Number(item.price));
              const href = tier === "trial" ? "/app/auth" : `/${locale}/${TIER_LINKS[tier]}`;

              return (
                <div 
                  key={tier} 
                  className={`lend-pricing-card lend-spotlight-card ${isPro ? 'lend-pricing-card--pro' : ''} ${isPopular ? 'is-popular' : ''} group`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="lend-card-spotlight" />
                  <div className="lend-pricing-glow" />
                  {isPopular && (
                    <div className="lend-popular-badge">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse mr-2" />
                      <span>{copy.pricing.popular || "Popular"}</span>
                    </div>
                  )}
                  
                  <div className="relative z-10 w-full flex flex-col h-full">
                    {/* Background number */}
                    <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-4 block text-left">{String(idx + 1).padStart(2, "0")}</span>
                    <h3 className="lend-tier-name text-left">{item.name}</h3>
                    
                    <div className="lend-price-container flex justify-start">
                      {isCustom ? (
                        <p className="text-3xl font-black text-white/70">{item.price}</p>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="lend-price-symbol">$</span>
                          <span className={`lend-price-amount inline-block ${isPopular ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(124,58,237,0.3)]" : ""}`}>{item.price}</span>
                          <span className="lend-price-period">/mo</span>
                        </div>
                      )}
                    </div>

                    <div className="h-px w-full bg-white/5 my-8 group-hover:bg-accent/20 transition-colors" />

                    <ul className="lend-features-list flex-1">
                      {item.features.map((feature: string) => (
                        <li key={feature} className="lend-feature-item">
                          <svg className="lend-feature-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link 
                      className={`lend-pricing-button ${isPro ? 'is-pro' : ''} ${isPopular ? 'lend-primary bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 border-none hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]' : ''} mt-auto`}
                      href={href}
                    >
                      <span>{item.cta}</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1.5 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST ROW */}
      <section className="py-14 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 flex flex-wrap justify-center gap-8 md:gap-14">
            {[
              { stat: "0%", label: isRu ? "Комиссии с оборота" : "Turnover fees" },
              { stat: "100%", label: isRu ? "Non-custodial" : "Non-custodial" },
              { stat: "6", label: isRu ? "Платежных сетей" : "Payment networks" },
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
      <section className="py-28 relative overflow-hidden lend-spotlight-card group" data-reveal>
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
