import Link from "next/link";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";

export type ComparePoint = {
  readonly title: string;
  readonly competitor: string;
  readonly recv: string;
};

export type CompareFaqItem = {
  readonly q: string;
  readonly a: string;
};

export type CompareDetailPageProps = {
  locale: string;
  competitor: string;
  data: {
    readonly name: string;
    readonly title: string;
    readonly description: string;
    readonly kicker: string;
    readonly points: readonly ComparePoint[];
  };
  faq: readonly CompareFaqItem[];
  heroPrimary: string;
  heroSecondary: string;
  docsLabel: string;
};

export function CompareDetailClient({
  locale, competitor, data, faq, heroPrimary, heroSecondary, docsLabel,
}: CompareDetailPageProps) {


  return (
    <MarketingLayout language={locale as "en" | "ru"}>
      <BreadcrumbJsonLd
        items={[
          { name: locale === "ru" ? "Главная" : "Home", href: `/${locale}` },
          { name: locale === "ru" ? "Сравнение" : "Compare", href: `/${locale}/compare` },
          { name: `vs ${data.name}`, href: `/${locale}/compare/${competitor}` },
        ]}
      />
      {/* ── HERO ── */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${locale}`} className="hover:text-accent transition-colors">{locale === "ru" ? "Главная" : "Home"}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${locale}/compare`} className="hover:text-accent transition-colors">{locale === "ru" ? "Сравнение" : "Compare"}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{`vs ${data.name}`}</span>
          </nav>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{data.kicker}</span>

          <h1 className="lend-reveal--2 !text-3xl md:!text-5xl lg:!text-6xl font-black tracking-tighter leading-[1.05] mb-6 text-white">
            {data.title}
          </h1>
          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-12">
            {data.description}
          </p>
          <div className="lend-reveal--4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link className="lend-primary px-10 py-4 rounded-2xl flex items-center gap-3 group/btn" href="/app/auth">
              {heroPrimary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-10 py-4 rounded-2xl" href={`/${locale}/docs`}>{docsLabel}</Link>
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6 max-w-5xl">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-6 lend-reveal--1 px-6 md:px-8">
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/25">{locale === "ru" ? "Критерий" : "Criterion"}</div>
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/25 text-center">{data.name}</div>
            <div className="text-[10px] font-bold tracking-[0.3em] uppercase text-accent/70 text-center">recv</div>
          </div>

          <div className="flex flex-col gap-4 lend-reveal--2">
            {data.points.map((point, idx) => (
              <article
                key={point.title}
                className="lend-card lend-spotlight-card group relative transition-all duration-500 hover:scale-[1.005]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1.2fr_1.5fr_1.5fr] gap-0 md:gap-6">
                  {/* Criterion */}
                  <div className="p-5 md:p-6 md:border-r border-white/[0.06] flex items-center">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-accent/50 block mb-1">{String(idx + 1).padStart(2, "0")}</span>
                      <h2 className="font-bold text-sm md:text-base group-hover:text-white transition-colors">{point.title}</h2>
                    </div>
                  </div>
                  {/* Competitor */}
                  <div className="px-5 pb-5 md:py-6 md:border-r border-white/[0.06]">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/25 block mb-2 md:mb-3">{data.name}</span>
                    <p className="text-xs md:text-sm text-white/45 leading-relaxed">{point.competitor}</p>
                  </div>
                  {/* recv */}
                  <div className="px-5 pb-5 md:py-6 bg-accent/[0.02] rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-accent/60 block mb-2 md:mb-3">recv</span>
                    <p className="text-xs md:text-sm text-white/65 leading-relaxed font-medium">{point.recv}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      {faq.length > 0 && (
        <section className="py-20 border-t border-white/[0.04]" data-reveal>
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="mb-14">
              <span className="lend-reveal--1 lend-section-kicker">{locale === "ru" ? "FAQ" : "FAQ"}</span>
              <h2 className="lend-reveal--2 text-3xl md:text-4xl font-bold tracking-tight mt-3">
                {locale === "ru" ? "Частые вопросы" : "Frequently asked questions"}
              </h2>
            </div>
            <div className="flex flex-col gap-4 lend-reveal--2">
              {faq.map((item, idx) => (
                <article
                  key={idx}
                  className="lend-card lend-spotlight-card group relative p-8 transition-all duration-500 hover:scale-[1.01]"
                >
                  <div className="lend-card-spotlight" />
                  <div className="relative z-10">
                    <h3 className="font-bold text-base md:text-lg mb-3 group-hover:text-white transition-colors">{item.q}</h3>
                    <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{item.a}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FINAL CTA ── */}
      <section className="py-32 relative overflow-hidden lend-spotlight-card group" data-reveal>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 max-w-3xl">
          <h2 className="lend-reveal--1 text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
            {locale === "ru" ? "Готовы обновить инфраструктуру?" : "Ready to upgrade your infrastructure?"}
          </h2>
          <p className="lend-reveal--2 text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium mb-12">
            {locale === "ru"
              ? "Подключите recv для безопасного non-custodial процессинга без комиссий с оборота."
              : "Join forward-thinking companies that choose recv for secure, non-custodial processing."}
          </p>
          <div className="lend-reveal--3 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center gap-3 group/btn shadow-[0_20px_50px_rgba(124,58,237,0.25)]" href="/app/auth">
              {heroPrimary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-12 py-5 text-lg font-bold rounded-2xl min-w-[240px] flex items-center justify-center" href={`/${locale}/docs`}>
              {heroSecondary}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
