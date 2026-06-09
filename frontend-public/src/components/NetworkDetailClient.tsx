import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

// ─── Types (mirror the i18n copy shape) ──────────────────────────────────────

type SnapshotItem = { label: string; value: string };
type AssetItem = { name: string; body: string };
type MechanicStep = { title: string; body: string };
type UseCaseItem = { name: string; body: string };
type RelatedLink = { kicker: string; label: string; body: string; href: string };

export type NetworkDetailPageCopy = {
  name: string;
  kicker: string;
  hero: { title: string; body: string };
  snapshot: { kicker: string; title: string; amount: string; items: SnapshotItem[] };
  assets: { kicker: string; title: string; body: string; items: AssetItem[] };
  why: { kicker: string; title: string; body: string };
  limitations: { kicker: string; title: string; body: string };
  mechanics: { kicker: string; title: string; steps: MechanicStep[] };
  useCases: { kicker: string; title: string; body: string; items: UseCaseItem[] };
  related: { kicker: string; title: string; links: RelatedLink[] };
  cta: { title: string; body: string; primary: { label: string; href: string }; secondary: { label: string; href: string } };
};

type Props = {
  locale: string;
  network: string;
  page: NetworkDetailPageCopy;
};

function localizedHref(locale: string, href: string) {
  if (href.startsWith("/app/")) return href;
  return `/${locale}${href}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NetworkDetailClient({ locale, network, page }: Props) {


  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <BreadcrumbJsonLd
        items={[
          { name: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
          { name: locale === "ru" ? "Сети" : "Networks", href: `/${locale}/networks` },
          { name: page.name, href: `/${locale}/networks/${network}` },
        ]}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" data-reveal>
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[140%] h-[140%] bg-radial-gradient from-accent/15 via-transparent to-transparent blur-[150px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 py-20 md:py-28 relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-12">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{locale === "ru" ? "Главная" : "Home"}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/networks`} className="hover:text-accent transition-colors">{locale === "ru" ? "Сети" : "Networks"}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{page.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Copy */}
            <div>
              <span className="lend-reveal--1 lend-section-kicker">{page.kicker}</span>
              <h1 className="lend-reveal--2 !text-4xl md:!text-5xl lg:!text-6xl font-black tracking-tighter leading-[1.05] mb-6">
                {page.hero.title}
              </h1>
              <p className="lend-reveal--3 !text-base md:!text-lg text-white/55 leading-relaxed mb-10 max-w-lg">
                {page.hero.body}
              </p>
              <div className="lend-reveal--4 flex flex-wrap gap-4">
                <div className="relative group/btn-wrap">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-60 group-hover/btn-wrap:scale-110 transition-all duration-700" />
                  <Link href={localizedHref(locale, page.cta.primary.href)} className="lend-primary relative z-10 px-8 py-4 rounded-2xl group/btn flex items-center gap-3">
                    <span>{page.cta.primary.label}</span>
                    <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
                  </Link>
                </div>
                <Link href={localizedHref(locale, page.cta.secondary.href)} className="lend-secondary px-8 py-4 rounded-2xl group/sec flex items-center gap-2">
                  <span>{page.cta.secondary.label}</span>
                  <span className="group-hover/sec:translate-x-1.5 transition-transform duration-500">→</span>
                </Link>
              </div>
            </div>

            {/* Snapshot card */}
            <div className="lend-reveal--3">
              <div
                className="lend-card lend-spotlight-card relative p-8 rounded-3xl"
                aria-label={page.snapshot.title}
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-4 block">{page.snapshot.kicker}</span>
                  <p className="text-sm font-mono text-white/50 mb-6">{page.snapshot.title}</p>
                  <div className="text-4xl md:text-5xl font-black tracking-tight font-['Montserrat'] bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-8">
                    {page.snapshot.amount}
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.06]">
                    {page.snapshot.items.map((item) => (
                      <div key={item.label} className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25">{item.label}</span>
                        <strong className="text-sm font-bold text-white/80">{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SUPPORTED ASSETS ── */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-14">
            <span className="lend-reveal--1 lend-section-kicker">{page.assets.kicker}</span>
            <h2 className="lend-reveal--2 text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4">{page.assets.title}</h2>
            <p className="lend-reveal--3 text-white/50 leading-relaxed">{page.assets.body}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lend-reveal--2">
            {page.assets.items.map((asset, idx) => (
              <article
                key={asset.name}
                className="lend-card lend-spotlight-card group relative p-8 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-4 block">{String(idx + 1).padStart(2, "0")}</span>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-white transition-colors">{asset.name}</h3>
                  <p className="text-sm text-white/45 leading-relaxed group-hover:text-white/65 transition-colors">{asset.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY + LIMITATIONS ── */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lend-reveal--2">
            {/* Why */}
            <div className="lend-card lend-spotlight-card group relative p-10 transition-all duration-500 hover:scale-[1.01]">
              <div className="lend-card-spotlight" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-5 block">{page.why.kicker}</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-5 group-hover:text-white transition-colors">{page.why.title}</h2>
                <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{page.why.body}</p>
              </div>
            </div>

            {/* Limitations */}
            <div className="lend-card lend-spotlight-card group relative p-10 transition-all duration-500 hover:scale-[1.01]">
              <div className="lend-card-spotlight" />
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-5 block">{page.limitations.kicker}</span>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-5 group-hover:text-white transition-colors">{page.limitations.title}</h2>
                <p className="text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{page.limitations.body}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-16">
            <span className="lend-reveal--1 lend-section-kicker">{page.mechanics.kicker}</span>
            <h2 className="lend-reveal--2 text-3xl md:text-4xl font-bold tracking-tight mt-3">{page.mechanics.title}</h2>
          </div>
          <div className="relative lend-reveal--2">
            {/* Vertical line */}
            <div className="absolute left-[calc(1.5rem+1px)] top-8 bottom-8 w-px bg-gradient-to-b from-accent/30 via-accent/10 to-transparent md:left-8 hidden md:block" />
            <div className="flex flex-col gap-6">
              {page.mechanics.steps.map((step, idx) => (
                <article key={step.title} className="lend-card lend-spotlight-card group relative flex gap-6 md:gap-8 p-8 transition-all duration-500 hover:scale-[1.01]">
                  <div className="lend-card-spotlight" />
                  <div className="relative z-10 flex gap-6 md:gap-8 w-full">
                    <div className="shrink-0 flex items-start">
                      <span className="flex items-center justify-center w-12 h-12 rounded-xl border border-accent/20 bg-accent/[0.06] text-accent font-black text-sm font-['Montserrat']">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold mb-2 group-hover:text-white transition-colors">{step.title}</h3>
                      <p className="text-sm text-white/45 leading-relaxed group-hover:text-white/65 transition-colors">{step.body}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-14">
            <span className="lend-reveal--1 lend-section-kicker">{page.useCases.kicker}</span>
            <h2 className="lend-reveal--2 text-3xl md:text-4xl font-bold tracking-tight mt-3 mb-4">{page.useCases.title}</h2>
            <p className="lend-reveal--3 text-white/50 leading-relaxed">{page.useCases.body}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lend-reveal--2">
            {page.useCases.items.map((item, idx) => (
              <article
                key={item.name}
                className="lend-card lend-spotlight-card group relative p-8 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase mb-4 block">{String(idx + 1).padStart(2, "0")}</span>
                  <h3 className="text-base font-bold mb-2 group-hover:text-white transition-colors">{item.name}</h3>
                  <p className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── RELATED ── */}
      <section className="py-20 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="max-w-xl mb-12">
            <span className="lend-reveal--1 lend-section-kicker">{page.related.kicker}</span>
            <h2 className="lend-reveal--2 text-3xl md:text-4xl font-bold tracking-tight mt-3">{page.related.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lend-reveal--3">
            {page.related.links.map((link) => (
              <Link
                key={link.href}
                href={localizedHref(locale, link.href)}
                className="lend-card lend-spotlight-card group relative p-8 flex flex-col gap-3 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10 flex flex-col gap-3">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-accent/60 uppercase">{link.kicker}</span>
                  <strong className="text-base font-bold group-hover:text-white transition-colors">{link.label}</strong>
                  <p className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{link.body}</p>
                  <span className="text-[10px] font-bold text-accent/50 group-hover:text-accent mt-2 transition-colors flex items-center gap-1">
                    {locale === "ru" ? "Подробнее" : "Learn more"}
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 relative overflow-hidden lend-spotlight-card group" data-reveal>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
          <h2 className="lend-reveal--1 text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
            {page.cta.title}
          </h2>
          <p className="lend-reveal--2 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium mb-12">
            {page.cta.body}
          </p>
          <div className="lend-reveal--3 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.25)]" href={localizedHref(locale, page.cta.primary.href)}>
              {page.cta.primary.label}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center" href={localizedHref(locale, page.cta.secondary.href)}>
              {page.cta.secondary.label}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
