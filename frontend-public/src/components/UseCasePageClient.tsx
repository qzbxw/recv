import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Globe
} from "lucide-react";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { JsonLd } from "./JsonLd";
import { BreadcrumbJsonLd } from "./BreadcrumbJsonLd";
import { Locale } from "@/i18n";
import { schemaId, softwareApplicationJsonLd } from "@/lib/geo";
import "./marketing/plans/plans.css";

type LinkCopy = {
  readonly kicker: string;
  readonly label: string;
  readonly body: string;
  readonly href: string;
};

type UseCaseCopy = {
  readonly name: string;
  readonly metadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly kicker: string;
  readonly hero: {
    readonly title: string;
    readonly body: string;
  };
  readonly problem: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
  };
  readonly solution: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
  };
  readonly productPlan: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly product: {
      readonly label: string;
      readonly title: string;
      readonly body: string;
      readonly href: string;
      readonly linkLabel: string;
    };
    readonly plan: {
      readonly label: string;
      readonly title: string;
      readonly body: string;
      readonly href: string;
      readonly linkLabel: string;
    };
  };
  readonly networks: {
    readonly kicker: string;
    readonly title: string;
    readonly body: string;
    readonly items: readonly {
      readonly name: string;
      readonly body: string;
    }[];
  };
  readonly flow: {
    readonly kicker: string;
    readonly title: string;
    readonly steps: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
  readonly related: {
    readonly kicker: string;
    readonly title: string;
    readonly links: readonly LinkCopy[];
  };
  readonly cta: {
    readonly title: string;
    readonly body: string;
    readonly primary: {
      readonly label: string;
      readonly href: string;
    };
    readonly secondary: {
      readonly label: string;
      readonly href: string;
    };
  };
  readonly features: readonly string[];
  readonly seoLabel: string;
  readonly seo: string;
};

const GRADIENT_WORDS = new Set([
  "telegram",
  "shops",
  "saas",
  "billing",
  "digital",
  "goods",
  "paid",
  "communities",
  "crypto",
  "checkout",
  "webhooks",
  "recv",
]);

function isGradientWord(raw: string) {
  const clean = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()—]/g, "").toLowerCase();
  return GRADIENT_WORDS.has(clean);
}

type Props = {
  usecase: string;
  locale: Locale;
  copy: UseCaseCopy;
};

function localizedHref(locale: Locale, path: string) {
  if (path.startsWith("/app/")) return path;
  return `/${locale}${path}`;
}

export function UseCasePageClient({ usecase, locale, copy }: Props) {



  const softwareSchema = softwareApplicationJsonLd({
    locale,
    pathname: `/${locale}/use-cases/${usecase}`,
    name: `recv ${copy.name}`,
    description: copy.metadata.description,
    featureList: copy.features,
  });

  return (
    <MarketingLayout language={locale} path={`/use-cases/${usecase}`} pageType="ItemPage" mainEntityId={schemaId(`/${locale}/use-cases/${usecase}`, "software")}>
      <JsonLd schema={softwareSchema} />
      <BreadcrumbJsonLd
        items={[
          { name: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
          { name: locale === "ru" ? "Кейсы" : "Use Cases", href: `/${locale}/use-cases` },
          { name: copy.kicker, href: `/${locale}/use-cases/${usecase}` },
        ]}
      />

      {/* Hero Section */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{locale === "ru" ? "Главная" : "Home"}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/use-cases`} className="hover:text-accent transition-colors">{locale === "ru" ? "Кейсы" : "Use Cases"}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{copy.kicker}</span>
          </nav>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{copy.kicker}</span>

          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8 text-white">
            {copy.hero.title.split(" ").map((word, i) => (
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
            {copy.hero.body}
          </p>

          <div className="lend-reveal--4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-70 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <Link href={copy.cta.primary.href} className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {copy.cta.primary.label}
                  <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
                </span>
              </Link>
            </div>
            <Link href={localizedHref(locale, copy.cta.secondary.href)} className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {copy.cta.secondary.label}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Narrative Section (Problem/Solution) */}
      <section className="py-16 md:py-24" data-reveal>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lend-reveal--2">
            <article
              className="lend-card lend-spotlight-card group relative p-8 md:p-12 transition-all duration-500 hover:scale-[1.01]"
            >
              <div className="lend-card-spotlight" />
              <div className="relative z-10">
                <span className="text-xs font-bold text-red-400/80 uppercase tracking-widest mb-4 block">
                  {copy.problem.kicker}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white group-hover:text-white transition-colors">{copy.problem.title}</h2>
                <p className="text-base text-white/55 leading-relaxed group-hover:text-white/75 transition-opacity">{copy.problem.body}</p>
              </div>
            </article>

            <article
              className="lend-card lend-spotlight-card group relative p-8 md:p-12 border-accent/20 bg-accent/[0.03] transition-all duration-500 hover:scale-[1.01]"
            >
              <div className="lend-card-spotlight" />
              <div className="relative z-10">
                <span className="text-xs font-bold text-accent uppercase tracking-widest mb-4 block">
                  {copy.solution.kicker}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white group-hover:text-white transition-colors">{copy.solution.title}</h2>
                <p className="text-base text-white/65 leading-relaxed font-medium group-hover:text-white/85 transition-opacity">{copy.solution.body}</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Product & Plan Recommendations */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
            <div className="lend-section-copy lend-reveal--1">
              <span className="lend-section-kicker justify-center mx-auto">{copy.productPlan.kicker}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 text-white">{copy.productPlan.title}</h2>
              <p className="text-base md:text-lg text-white/55 leading-relaxed">{copy.productPlan.body}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto lend-reveal--2">
            <article
              className="lend-card lend-spotlight-card group relative p-10 flex flex-col transition-all duration-500 hover:scale-[1.02]"
            >
              <div className="lend-card-spotlight" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6">
                  <Layers size={24} className="text-accent group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{copy.productPlan.product.label}</span>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white group-hover:text-white transition-colors">{copy.productPlan.product.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-8 flex-grow group-hover:text-white/70 transition-opacity">{copy.productPlan.product.body}</p>
                <Link href={localizedHref(locale, copy.productPlan.product.href)} className="flex items-center gap-2 text-accent font-bold hover:gap-3 transition-all group/link">
                  {copy.productPlan.product.linkLabel}
                  <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>

            <article
              className="lend-card lend-spotlight-card group relative p-10 flex flex-col transition-all duration-500 hover:scale-[1.02]"
            >
              <div className="lend-card-spotlight" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6">
                  <ShieldCheck size={24} className="text-accent group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 block">{copy.productPlan.plan.label}</span>
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-white group-hover:text-white transition-colors">{copy.productPlan.plan.title}</h3>
                <p className="text-sm text-white/55 leading-relaxed mb-8 flex-grow group-hover:text-white/70 transition-opacity">{copy.productPlan.plan.body}</p>
                <Link href={localizedHref(locale, copy.productPlan.plan.href)} className="flex items-center gap-2 text-accent font-bold hover:gap-3 transition-all group/link">
                  {copy.productPlan.plan.linkLabel}
                  <ArrowRight size={18} className="group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Network Support */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
            <div className="lend-section-copy lend-reveal--1">
              <span className="lend-section-kicker justify-center mx-auto">{copy.networks.kicker}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 mb-4 text-white">{copy.networks.title}</h2>
              <p className="text-base md:text-lg text-white/55 leading-relaxed">{copy.networks.body}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lend-reveal--2">
            {copy.networks.items.map((network) => (
              <article
                key={network.name}
                className="lend-card lend-spotlight-card group relative p-8 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe size={20} className="text-accent group-hover:scale-115 transition-transform duration-500" />
                    <strong className="text-lg font-bold text-white group-hover:text-white transition-colors">{network.name}</strong>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/70 transition-opacity">{network.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Section (Horizontal) */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16 md:mb-24">
            <div className="lend-section-copy lend-reveal--1">
              <span className="lend-section-kicker justify-center mx-auto">{copy.flow.kicker}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 text-white">{copy.flow.title}</h2>
            </div>
          </div>

          <div className="relative lend-reveal--2">
            <div className="absolute top-8 left-0 w-full h-px bg-white/[0.06] hidden md:block" />
            <div className={`grid grid-cols-1 gap-6 relative z-10 ${
              copy.flow.steps.length === 1 ? "md:grid-cols-1" :
              copy.flow.steps.length === 2 ? "md:grid-cols-2" :
              copy.flow.steps.length === 3 ? "md:grid-cols-3" :
              copy.flow.steps.length === 5 ? "md:grid-cols-5" :
              copy.flow.steps.length === 6 ? "md:grid-cols-6" :
              "md:grid-cols-4"
            }`}>
              {copy.flow.steps.map((step, index) => (
                <article key={step.title} className="text-center md:text-left group">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-accent/40 group-hover:bg-accent/[0.05] transition-all relative z-10 mx-auto md:mx-0">
                    <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent font-['Montserrat']">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-3 text-white/90 group-hover:text-white transition-colors">{step.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed">{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16">
            <div className="lend-section-copy lend-reveal--1">
              <span className="lend-section-kicker justify-center mx-auto">{copy.related.kicker}</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-2 text-white">{copy.related.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lend-reveal--2">
            {copy.related.links.map((link) => (
              <Link
                key={link.href}
                href={localizedHref(locale, link.href)}
                className="lend-card lend-spotlight-card group relative p-8 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4 block group-hover:text-accent transition-colors">
                    {link.kicker}
                  </span>
                  <strong className="text-lg font-bold mb-3 block text-white group-hover:text-white transition-colors">{link.label}</strong>
                  <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/70 transition-opacity">{link.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 relative overflow-hidden lend-spotlight-card group" data-reveal>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />

        <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
          <span className="lend-section-kicker justify-center mx-auto lend-reveal--1">{copy.kicker}</span>
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6 lend-reveal--2">
            {copy.cta.title}
          </h2>
          <p className="text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed font-medium mb-12 lend-reveal--3">
            {copy.cta.body}
          </p>
          <div className="lend-reveal--4 flex flex-col sm:flex-row justify-center items-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-75 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <Link href={copy.cta.primary.href} className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center">
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {copy.cta.primary.label}
                  <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
                </span>
              </Link>
            </div>
            <Link href={localizedHref(locale, copy.cta.secondary.href)} className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center">
              <span className="relative z-10 flex items-center justify-center gap-2">
                {copy.cta.secondary.label}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Hidden SEO Text */}
      <div className="sr-only" aria-hidden="true">
        <section className="use-case-seo" aria-label={copy.seoLabel}>
          <p>{copy.seo}</p>
        </section>
      </div>
    </MarketingLayout>
  );
}
