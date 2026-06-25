import Link from "next/link";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { FaqAccordion } from "./marketing/FaqAccordion";
import { JsonLd } from "./JsonLd";
import { type Locale, PUBLIC_MARKETING_COPY, PUBLIC_PLAN_COPY } from "@/i18n";
import { planSEOEn } from "@/i18n/plans.en";
import { planSEORu } from "@/i18n/plans.ru";
import { schemaId, softwareApplicationJsonLd } from "@/lib/geo";
import "./marketing/plans/plans.css";

export type Variant = "merchant" | "developer" | "business";

const GRADIENT_WORDS = new Set([
  "merchant",
  "developer",
  "business",
  "recv",
  "crypto",
  "payments",
  "usdt",
  "ton",
  "tron",
  "api",
]);

function isGradientWord(raw: string) {
  const clean = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()—]/g, "").toLowerCase();
  return GRADIENT_WORDS.has(clean);
}

export function PlanPage({ variant, language }: { variant: Variant; language: Locale }) {
  const text = PUBLIC_PLAN_COPY[language];
  const marketing = PUBLIC_MARKETING_COPY[language];
  const product = text[variant];
  const seoText = language === "ru" ? planSEORu[variant] : planSEOEn[variant];



  const priceMap = {
    merchant: "9.00",
    developer: "29.00",
    business: "79.00",
  };
  const pathMap = {
    merchant: "merchant",
    developer: "dev",
    business: "business",
  };

  const applicationSchema = {
    ...softwareApplicationJsonLd({
      locale: language,
      pathname: `/${language}/${pathMap[variant]}`,
      name: seoText.hero.badge,
      description: seoText.hero.body,
      featureList: seoText.deepDive.cards.map((item) => item.title),
      applicationCategory: "BusinessApplication",
    }),
    offers: {
      "@type": "Offer",
      "price": priceMap[variant],
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": seoText.faq.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <MarketingLayout language={language} path={`/${pathMap[variant]}`} mainEntityId={schemaId(`/${language}/${pathMap[variant]}`, "software")}>
      <JsonLd schema={applicationSchema} />
      <JsonLd schema={faqSchema} />

      {/* Hero Section */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{seoText.hero.badge}</span>
          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8 text-white font-['Montserrat']">
            {seoText.hero.title.split(" ").map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-[0.22em] last:mr-0 transition-all duration-300 hover:scale-105 ${
                  isGradientWord(word)
                    ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]"
                    : "text-white hover:text-white"
                }`}
              >
                {word}
              </span>
            ))}
          </h1>
          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-12">
            {seoText.hero.body}
          </p>
          <div className="lend-reveal--4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-70 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <Link className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center" href="/app/auth">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {marketing.activate}
                  <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
                </span>
              </Link>
            </div>
            <Link className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center" href="/app/auth">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {text.auth}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Deep Dive Section */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
            <span className="lend-section-kicker justify-center mx-auto">{text.compareTitle}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 text-white font-['Montserrat']">{seoText.deepDive.title}</h2>
            <p className="text-base text-white/55 leading-relaxed mt-4">{text.compareSectionBody}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lend-reveal--2">
            {seoText.deepDive.cards.map((feat, i) => (
              <article
                key={i}
                className="lend-card lend-spotlight-card group relative p-8 md:p-10 transition-all duration-500 hover:scale-[1.01]"
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4 text-white group-hover:text-white transition-colors font-['Montserrat']">{feat.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/70 transition-opacity">{feat.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 lend-reveal--3">
            {product.stats.map((stat, i) => (
              <article
                key={i}
                className="lend-card lend-spotlight-card group relative text-center flex flex-col items-center justify-center p-6 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                <span className="relative z-10 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-2 block">{stat.label}</span>
                <strong className="relative z-10 text-2xl md:text-3xl font-black text-white font-['Montserrat']">{stat.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Flow (Fully Redesigned Scenario Blocks) */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
            <span className="lend-section-kicker justify-center mx-auto">{text.flowTitle}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 text-white font-['Montserrat']">{marketing.seamlessFlow}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 lend-reveal--2">
            {product.flow.map((step, i) => (
              <article 
                key={i} 
                className="lend-card lend-spotlight-card group relative p-10 min-h-[260px] flex flex-col justify-between transition-all duration-700 ease-in-out hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="lend-dogfood-glow" />
                
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 mb-6 block uppercase">
                    {language === "ru" ? "Шаг" : "Step"} 0{i + 1}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-white group-hover:text-white transition-colors font-['Montserrat']">{step.title}</h3>
                  <p className="opacity-50 text-sm leading-relaxed group-hover:opacity-75 transition-opacity">{step.body}</p>
                </div>
                
                <div className="absolute bottom-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none select-none">
                  <span className="text-[8rem] font-black italic leading-none font-['Montserrat']">{i + 1}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Code Section (Only rendered for Developer plan to remove unnecessary block clutter on other plans) */}
      {variant === "developer" && "code" in product && product.code && (
        <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
          <div className="container mx-auto px-6 max-w-5xl">
            <div
              className="lend-card lend-spotlight-card group relative p-8 md:p-12 transition-all duration-500"
            >
              <div className="lend-card-spotlight" />
              <div className="lend-dogfood-glow" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <span className="lend-section-kicker mb-3 block">{text.codeTitle}</span>
                  <h3 className="text-2xl font-bold mb-4 text-white font-['Montserrat']">{text.codeSubtitle}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{text.codeBody}</p>
                </div>
                <div className="bg-black/20 p-6 rounded-2xl border border-white/[0.06] overflow-x-auto font-mono text-xs text-white/80">
                  <pre>
                    <code>{product.code as string}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Technical Specs */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6 max-w-4xl">
          <div
            className="lend-card lend-spotlight-card group relative p-8 md:p-12 transition-all duration-500"
          >
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
              <div>
                <span className="lend-section-kicker mb-3 block">Architecture</span>
                <h3 className="text-2xl font-bold mb-4 text-white font-['Montserrat']">{seoText.technicalSpecs.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed">{seoText.technicalSpecs.description}</p>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t lg:border-t-0 lg:border-l border-white/[0.08] pt-6 lg:pt-0 lg:pl-8">
                {seoText.technicalSpecs.specs.map((spec, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <dt className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/30 font-['Montserrat']">{spec.label}</dt>
                    <dd className="text-sm font-semibold text-white/80">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6 max-w-4xl">
          <div
            className="lend-card lend-spotlight-card group relative p-8 md:p-12 transition-all duration-500"
          >
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-[80px_1fr] gap-8 items-start">
              <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent group-hover:border-accent/50 group-hover:bg-accent/20 transition-all duration-500 shadow-lg">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <span className="lend-section-kicker mb-3 block">Security & Compliance</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-4 font-['Montserrat']">
                  {seoText.securityArchitecture.title}
                </h2>
                <p className="text-base text-white/55 leading-relaxed group-hover:text-white/70 transition-opacity">
                  {seoText.securityArchitecture.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ideal For Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6 max-w-4xl">
          <div
            className="lend-card lend-spotlight-card group relative p-8 md:p-12 transition-all duration-500"
          >
            <div className="lend-card-spotlight" />
            <div className="lend-dogfood-glow" />
            <div className="relative z-10">
              <header className="mb-8">
                <span className="lend-section-kicker mb-2 block">Target Audience</span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-['Montserrat']">{seoText.idealFor.title}</h2>
                <p className="text-sm text-white/55 leading-relaxed mt-2">{seoText.idealFor.description}</p>
              </header>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {seoText.idealFor.points.map((point, i) => (
                  <li 
                    key={i} 
                    className="flex items-center gap-4 group/item p-3 -mx-3 rounded-xl hover:bg-accent/[0.02] border border-transparent hover:border-accent/5 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 group-hover/item:bg-green-500/20 group-hover/item:border-green-500/40 transition-all duration-500 shadow-md">
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <span className="text-sm md:text-base text-white/70 group-hover/item:text-white transition-colors">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section (Adapted from HomeClient.tsx) */}
      <section id="faq" className="py-32 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="lend-reveal--1 mb-24 text-center">
            <span className="lend-section-kicker justify-center mx-auto">FAQ</span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-['Montserrat']">
              {language === "ru" ? "Часто задаваемые вопросы" : "Frequently Asked Questions"}
            </h2>
          </div>

          <div className="lend-reveal--2 max-w-4xl mx-auto">
            <FaqAccordion
              items={seoText.faq.map((item) => ({ question: item.q, answer: item.a }))}
              eyebrow={language === "ru" ? "Деталь тарифа" : "Plan Detail"}
              triggerClassName="flex items-center justify-between"
              questionClassName="text-white font-['Montserrat']"
              answerClassName="text-white/60"
            />
          </div>
        </div>
      </section>

      {/* Massive Glowing Final CTA Section (Adapted from HomeClient.tsx) */}
      <section 
        className="py-64 relative overflow-hidden lend-spotlight-card group" 
        data-reveal
      >
        <div className="lend-card-spotlight opacity-10" />

        {/* Massive Background Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black text-white/[0.01] select-none pointer-events-none whitespace-nowrap font-['Montserrat'] tracking-tighter">
          {variant.toUpperCase()} PLAN
        </div>

        {/* Multi-layered neon glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[600px] bg-accent/20 rounded-full blur-[250px] opacity-25 pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-500/10 rounded-full blur-[180px] opacity-30 pointer-events-none" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="lend-reveal--1 mb-16 max-w-4xl mx-auto">
            <span className="lend-section-kicker justify-center mx-auto mb-4">{text.priceTitle}</span>
            <h2 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.9] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-8">
              {product.priceLabel}
            </h2>
            
            <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase mb-6">{product.period}</p>
            <p className="text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed font-medium mb-12">
              {text.priceSubtitle}
            </p>
          </div>

          <div className="lend-reveal--2 flex justify-center items-center gap-6 mb-12">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-75 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <Link className="lend-primary px-16 py-6 text-xl font-bold rounded-2xl min-w-[280px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.3)] transition-all duration-300" href="/app/auth">
                {marketing.activateVerb} {product.badge}
                <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
              </Link>
            </div>
          </div>
          
          <div className="lend-reveal--3 text-white/30 text-xs font-semibold tracking-wider uppercase flex justify-center items-center gap-6">
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
