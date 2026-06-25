import Link from "next/link";
import { COPY } from "@/lib/copy";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { NetworkLogo } from "@/components/NetworkLogo";
import type { Locale } from "@/i18n";

export default function HomeClient({ language }: { language: Locale }) {
  const copy = COPY[language];
  const docsLocale = language === "ru" ? "ru" : "en";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": copy.faq.items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": { "@type": "Answer", "text": item.answer }
    }))
  };

  return (
    <MarketingLayout language={language} path="/">
      <JsonLd schema={faqSchema} />

      {/* 1. MASSIVE HERO */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1 !text-5xl md:!text-7xl lg:!text-8xl font-black tracking-tighter leading-tight">
              {copy.hero.title.split(' ').map((word, i) => {
                const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").toLowerCase();
                const isGradient = ["direct-to-wallet", "direct", "wallet", "0%", "выплаты", "кошелек", "кошельки", "комиссии"].includes(cleanWord);
                return (
                  <span 
                    key={i} 
                    className={`inline-block mr-[0.2em] last:mr-0 transition-all duration-300 hover:scale-105 hover:text-white ${
                      isGradient 
                        ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]" 
                        : "text-white"
                    }`}
                  >
                    {word}
                  </span>
                );
              })}
            </h1>
            
            <p className="lend-reveal--2 !text-lg md:!text-xl opacity-60">
              {copy.hero.body}
            </p>

            <div className="lend-reveal--3 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-14 sm:mb-24 w-full sm:w-auto">
              <div className="relative group/btn-wrap w-full sm:w-auto">
                {/* Expansive Glowing Aura */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-75 group-hover/btn-wrap:scale-110 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <Link className="lend-primary relative z-10 w-full sm:w-auto px-10 py-5 text-lg sm:min-w-[240px] rounded-2xl group/btn flex items-center justify-center" href="/app/auth">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {copy.hero.primary}
                    <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
                  </span>
                </Link>
              </div>

              <Link className="lend-secondary w-full sm:w-auto px-10 py-5 text-lg sm:min-w-[240px] rounded-2xl group/sec flex items-center justify-center" href={`/${docsLocale}/docs`}>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {copy.hero.secondary}
                  <span className="group-hover/sec:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
                </span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 2. BENTO GRID */}
      <section id="infrastructure" className="py-20 md:py-28 lg:py-32" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-12 md:mb-16 lg:mb-20 text-center lg:text-left">
            <span className="lend-section-kicker">{copy.bento.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight mb-8">{copy.bento.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 lend-reveal--2">
            {copy.bento.items.map((item) => {
              const gridClasses = {
                large: "md:col-span-4 md:row-span-2 min-h-[480px]",
                medium: "md:col-span-2 md:row-span-2 min-h-[480px]",
                small: "md:col-span-2 md:row-span-1 min-h-[240px]"
              }[item.size] || "md:col-span-2 md:row-span-1 min-h-[240px]";

              return (
                <Link 
                  key={item.id} 
                  href={`/${language}/products/${item.id}`}
                  className={`${gridClasses} lend-card lend-spotlight-card group p-7 md:p-8 lg:p-10 flex flex-col justify-between transition-all duration-700 ease-in-out hover:scale-[1.02]`}
                >
                  <div className="lend-card-spotlight" />
                  <div className="lend-dogfood-glow" />
                  
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-accent">
                      {item.id === 'api' && <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />}
                      {item.id === 'checkout' && <rect x="3" y="4" width="18" height="16" rx="2" />}
                      {item.id === 'direct' && <path d="M7 11l5 5 5-5M12 4v12" />}
                      {item.id === 'monitoring' && <path d="M22 12h-4l-3 9L9 3l-3 9H2" />}
                      {item.id === 'tg' && <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />}
                    </svg>
                  </div>
                  
                  <div className="relative z-10">
                    <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 mb-6 block uppercase">{item.kicker}</span>
                    <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 tracking-tight group-hover:text-white transition-colors">{item.title}</h3>
                    <p className="opacity-40 text-sm md:text-base lg:text-lg leading-relaxed max-w-[340px] group-hover:opacity-70 transition-opacity">{item.body}</p>
                  </div>

                  <div className="lend-explore-link relative z-10 flex items-center gap-4 text-accent font-bold text-[10px] tracking-[0.2em] uppercase w-fit pb-2">
                    <span>{language === "ru" ? "Изучить технологию" : "Explore Technology"}</span>
                    <span className="lend-arrow">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. NETWORKS MARQUEE */}
      <section className="py-14 md:py-20 lg:py-24 border-y border-white/5 overflow-hidden relative bg-white/[0.01]">
        <div className="absolute inset-0 bg-radial-gradient from-accent/5 via-transparent to-transparent opacity-30 pointer-events-none" />
        <div className="lend-marquee">
          <div className="lend-marquee-track">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-12 items-center">
                {copy.networks.list.map((net) => (
                  <Link
                    key={`${i}-${net.slug}`}
                    href={`/${language}/networks/${net.slug}`}
                    className="lend-marquee-item group flex items-center gap-3 transition-all duration-500 hover:text-accent hover:border-accent/30 hover:bg-accent/5"
                  >
                    <NetworkLogo network={net.slug} className="network-logo--sm" />
                    <span className="font-bold">{net.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. REDESIGNED USE CASES (GRID) */}
      <section id="solutions" className="py-20 md:py-28 lg:py-32" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-12 md:mb-16 lg:mb-20 text-center lg:text-left">
            <span className="lend-section-kicker mx-auto lg:mx-0">{copy.useCases.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{copy.useCases.title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lend-reveal--2">
            {copy.useCases.tabs.map((uc, idx) => (
              <Link 
                key={uc.id} 
                href={`/${language}/use-cases/${uc.id}`}
                className="lend-card lend-spotlight-card group relative p-7 md:p-10 lg:p-14 transition-all duration-700 ease-in-out hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                
                <div className="relative z-10">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 group-hover:border-accent/40 transition-all duration-500 shadow-2xl">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                      {uc.id === 'tg-shops' && (
                        <>
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z" />
                          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                        </>
                      )}
                      {uc.id === 'saas' && (
                        <>
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                          <path d="M7 15h.01" />
                          <path d="M11 15h.01" />
                        </>
                      )}
                      {uc.id === 'digital' && (
                        <>
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </>
                      )}
                      {uc.id === 'communities' && (
                        <>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </>
                      )}
                    </svg>
                  </div>

                  <span className="text-[10px] font-bold tracking-[0.4em] text-white/20 mb-4 md:mb-6 block uppercase">Scenario 0{idx + 1}</span>
                  <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-5 md:mb-8 tracking-tight group-hover:text-accent transition-colors !font-['Montserrat']">{uc.title}</h3>
                  <p className="text-base md:text-xl lg:text-2xl opacity-40 leading-relaxed mb-8 md:mb-12 max-w-sm group-hover:opacity-60 transition-opacity">
                    {uc.body}
                  </p>

                  <div className="lend-explore-link relative z-10 flex items-center gap-4 text-accent font-bold text-[10px] tracking-[0.2em] uppercase w-fit pb-2">
                    <span>{uc.cta}</span>
                    <span className="lend-arrow">→</span>
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                  <div className="text-[12rem] font-black italic select-none leading-none -mb-8 -mr-4 font-['Montserrat']">
                    {idx + 1}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4.5 AI / MCP */}
      <section id="mcp" className="py-20 md:py-28 lg:py-32" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-10 md:mb-14 lg:mb-16 text-center lg:text-left max-w-3xl">
            <span className="lend-section-kicker mx-auto lg:mx-0">{copy.mcp.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight mt-6 mb-6">
              {copy.mcp.title}
            </h2>
            <p className="text-lg md:text-xl opacity-60 leading-relaxed">{copy.mcp.body}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lend-reveal--2">
            {copy.mcp.tools.map((tool) => (
              <div
                key={tool.name}
                className="lend-card group relative p-7 transition-all duration-500 hover:border-accent/30"
              >
                <code className="inline-block text-sm font-bold text-accent bg-accent/10 border border-accent/20 rounded-lg px-3 py-1.5 mb-4">
                  {tool.name}
                </code>
                <p className="text-sm md:text-base opacity-55 leading-relaxed">{tool.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center lg:justify-start lend-reveal--3">
            <Link
              href={`/${language}/docs/mcp`}
              className="lend-secondary px-8 py-4 rounded-2xl flex items-center gap-3 group/mcp"
            >
              {copy.mcp.cta}
              <span className="lend-arrow transition-transform group-hover/mcp:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. VISUAL DIFF (COMPARE) */}
      <section className="py-20 md:py-28 lg:py-32 overflow-hidden" data-reveal>
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-12 md:mb-16 lg:mb-20 text-center lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">{copy.compare.title}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center group">
            {/* Manual workflow card */}
            <div className="relative p-10 md:p-14 rounded-[3.5rem] bg-[#050101] border border-red-500/10 transition-all duration-700 ease-in-out group-hover:scale-[0.98] group-hover:opacity-40 group-hover:blur-[1px] group-hover:grayscale lg:-rotate-1 hover:rotate-0 hover:border-red-500/25 hover:shadow-[0_20px_50px_rgba(220,38,38,0.05)] shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-red-500/[0.02] via-transparent to-transparent blur-[120px] pointer-events-none" />
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-700">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-red-500">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </div>

              <div className="inline-flex items-center gap-3 mb-10 px-5 py-2 rounded-full bg-red-500/[0.03] border border-red-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold tracking-[0.4em] text-red-500/60 uppercase">{language === "ru" ? "Ручной процесс" : "Manual Workflow"}</span>
              </div>

              <ul className="space-y-8">
                {copy.compare.rows.map((row) => (
                  <li key={row.legacy} className="flex items-start gap-6 group/item transition-all duration-300">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 group-hover/item:bg-red-500/20 transition-all duration-300">
                      <span className="text-red-500 text-sm font-black">✕</span>
                    </div>
                    <p className="text-lg md:text-xl text-white/30 italic leading-relaxed group-hover/item:text-white/50 transition-colors duration-300 line-through decoration-red-500/20">{row.legacy}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* recv protocol card */}
            <div className="relative p-10 md:p-16 rounded-[3.5rem] bg-white/[0.01] border border-accent/20 backdrop-blur-3xl transition-all duration-700 ease-in-out scale-100 lg:scale-[1.03] group-hover:scale-[1.06] group-hover:-translate-y-3 group-hover:border-accent/65 shadow-[0_30px_70px_rgba(0,0,0,0.8)] hover:shadow-[0_40px_100px_rgba(168,85,247,0.18)] overflow-hidden">
              {/* Custom border/background mouse spotlight overrides */}
              <div className="lend-card-spotlight" />
              
              {/* Background Radiant Glows */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-[140px] opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[140px] opacity-20 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-12">
                  <div className="relative w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                    {/* Pulsing beacon behind icon */}
                    <div className="absolute inset-0 bg-accent/20 rounded-2xl animate-ping opacity-30" />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent relative z-10">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold tracking-[0.4em] text-accent block uppercase">{language === "ru" ? "Протокол recv" : "recv Protocol"}</span>
                </div>

                <ul className="space-y-8">
                  {copy.compare.rows.map((row) => (
                    <li 
                      key={row.recv} 
                      className="flex items-center gap-6 group/row p-4 -mx-4 rounded-2xl hover:bg-accent/[0.03] border border-transparent hover:border-accent/10 transition-all duration-500"
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover/row:bg-green-500/20 group-hover/row:border-green-500/40 transition-all duration-500 shadow-md">
                        <span className="text-green-400 text-base font-bold drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">✓</span>
                      </div>
                      <p className="text-lg md:text-xl font-bold text-white/90 leading-snug tracking-tight group-hover/row:text-white transition-colors duration-300">{row.recv}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING */}
      <section id="pricing" className="py-20 md:py-28 lg:py-32" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-reveal--1 mb-12 md:mb-16 lg:mb-20 text-center">
            <span className="lend-section-kicker justify-center">{copy.pricing.kicker}</span>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tight">{copy.pricing.title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lend-reveal--2">
            {(["trial", "merchant", "developer", "business"] as const).map((tier) => {
              const t = copy.pricing[tier];
              const isPro = tier === "business";
              const isPopular = tier === "business";
              
              return (
                <div 
                  key={tier} 
                  className={`lend-pricing-card lend-spotlight-card ${isPro ? 'lend-pricing-card--pro' : ''} ${isPopular ? 'is-popular' : ''} group`}
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
                    <h3 className="lend-tier-name text-center">{t.name}</h3>
                    
                    <div className="lend-price-container flex justify-center">
                      <div className="flex items-baseline gap-1">
                        <span className="lend-price-symbol">$</span>
                        <span className={`lend-price-amount inline-block ${isPopular ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(124,58,237,0.3)]" : ""}`}>{t.price}</span>
                        <span className="lend-price-period">/mo</span>
                      </div>
                    </div>

                    <div className="h-px w-full bg-white/5 my-8 group-hover:bg-accent/20 transition-colors" />

                    <ul className="lend-features-list">
                      {t.features.map((f: string) => (
                        <li key={f} className="lend-feature-item">
                          <svg className="lend-feature-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link 
                      className={`lend-pricing-button ${isPro ? 'is-pro' : ''} ${isPopular ? 'lend-primary bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 border-none hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]' : ''} mt-auto`}
                      href={tier === "trial" ? "/app/auth" : `/${language}/${tier === "merchant" ? "merchant" : tier === "developer" ? "dev" : tier}`}
                    >
                      <span>{t.cta}</span>
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

      {/* 7. FAQ */}
      <section id="faq" className="py-20 md:py-28 lg:py-32" data-reveal>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="lend-reveal--1 mb-14 md:mb-20 lg:mb-24 text-center">
            <span className="lend-section-kicker justify-center">{copy.faq.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight">{copy.faq.title}</h2>
          </div>

          <div className="lend-reveal--2 max-w-4xl mx-auto">
            <FaqAccordion
              items={copy.faq.items.map((item) => ({ question: item.question, answer: item.answer }))}
              eyebrow={language === "ru" ? "Деталь протокола" : "Protocol Detail"}
            />
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section
        className="py-32 md:py-48 lg:py-64 relative overflow-hidden lend-spotlight-card group"
        data-reveal
      >
        {/* Custom border/background mouse spotlight */}
        <div className="lend-card-spotlight opacity-10" />

        {/* Massive Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black text-white/[0.01] select-none pointer-events-none whitespace-nowrap font-['Montserrat'] tracking-tighter">
          RECV PROTOCOL
        </div>

        {/* Multi-layered neon glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/20 rounded-full blur-[250px] opacity-25 pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-[180px] opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="lend-reveal--1 mb-16 max-w-4xl mx-auto">
            <h2 className="text-[clamp(1.6rem,7.6vw,2.5rem)] sm:text-6xl md:text-8xl font-extrabold tracking-tight sm:tracking-tighter leading-[1.06] sm:leading-[0.9] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-8">
              {copy.final.title}
            </h2>
            
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-medium">
              {copy.final.body}
            </p>
          </div>

          <div className="lend-reveal--2 flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <Link
              className="lend-primary w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-6 text-lg sm:text-xl font-bold rounded-2xl sm:min-w-[280px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.3)] transition-all duration-300"
              href="/app/auth"
            >
              {copy.final.primary}
              <svg className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            
            <Link
              className="lend-secondary w-full sm:w-auto px-10 sm:px-16 py-5 sm:py-6 text-lg sm:text-xl font-bold rounded-2xl sm:min-w-[280px] flex items-center justify-center gap-3 transition-all duration-300"
              href={`/${language}/docs`}
            >
              {copy.final.secondary}
              <svg className="w-5 h-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </Link>
          </div>
          
          <div className="lend-reveal--3 text-white/30 text-[11px] sm:text-xs font-semibold tracking-wider uppercase flex flex-wrap justify-center items-center gap-x-4 gap-y-2 sm:gap-6 px-4">
            <span>0% TURNOVER FEES</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span>NON-CUSTODIAL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span>INSTANT PAYOUTS</span>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
