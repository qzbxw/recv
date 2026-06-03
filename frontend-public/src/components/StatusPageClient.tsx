"use client";

import Link from "next/link";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";
import { PUBLIC_MARKETING_COPY } from "@/i18n";
import { useUI } from "@/components/UIProvider";

function StatusDot({ color = "green" }: { color?: "green" | "yellow" | "red" }) {
  const colors = {
    green: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]",
    yellow: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
    red: "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.6)]",
  };
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${colors[color]}`} />
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  );
}

function StatusBadge({ label, color = "green" }: { label: string; color?: "green" | "yellow" | "red" }) {
  const textColors = { green: "text-emerald-400", yellow: "text-amber-400", red: "text-rose-400" };
  return (
    <span className={`flex items-center gap-1.5 text-xs font-bold tracking-[0.08em] uppercase shrink-0 ${textColors[color]}`}>
      <StatusDot color={color} />
      {label}
    </span>
  );
}

export function StatusPageClient() {
  const { language } = useUI();
  const copy = PUBLIC_MARKETING_COPY[language];
  const reveal = useReveal();

  const services = [
    { name: copy.statusHub.coreApi, status: copy.statusHub.operational, color: "green" as const },
    { name: copy.statusHub.watchers, status: copy.statusHub.operational, color: "green" as const },
    { name: copy.statusHub.checkout, status: copy.statusHub.operational, color: "green" as const },
  ];

  const networks = [
    { name: "TON", href: `/${language}/networks/ton`, status: copy.statusHub.operational, color: "green" as const },
    { name: "TON USDT", href: `/${language}/networks/ton_usdt`, status: copy.statusHub.operational, color: "green" as const },
    { name: "TRON", href: `/${language}/networks/tron`, status: copy.statusHub.operational, color: "green" as const },
    { name: "Base", href: `/${language}/networks/base`, status: copy.statusHub.operational, color: "green" as const },
    { name: "BSC", href: `/${language}/networks/bsc`, status: copy.statusHub.operational, color: "green" as const },
  ];

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <MarketingLayout language={language}>
      {/* HERO */}
      <section className="lend-hero--centered relative overflow-hidden" ref={reveal}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-emerald-500/15 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${language}`} className="hover:text-accent transition-colors">{copy.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <span className="text-white/50">{copy.statusHub.title}</span>
          </nav>

          <div className="lend-reveal--1 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/[0.06] mb-8">
            <StatusDot color="green" />
            <span className="text-sm font-bold text-emerald-400 tracking-wide">{copy.statusHub.allSystemsOperational}</span>
          </div>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{copy.statusHub.kicker}</span>

          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-6 text-white">
            {copy.statusHub.title}
          </h1>
          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto">
            {copy.statusHub.description}
          </p>
        </div>
      </section>

      {/* CORE SERVICES */}
      <section className="py-12 md:py-20" ref={reveal}>
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="lend-reveal--1 text-[10px] font-bold tracking-[0.35em] uppercase text-white/30 mb-6 pl-1">
            {copy.statusHub.services}
          </h2>
          <div className="lend-reveal--2 flex flex-col gap-3">
            {services.map((svc, idx) => (
              <article
                key={svc.name}
                className="lend-card lend-spotlight-card group relative flex items-center justify-between p-5 md:p-6 transition-all duration-500 hover:scale-[1.01]"
                style={{ animationDelay: `${idx * 0.08}s` }}
                onMouseMove={handleMouseMove}
              >
                <div className="lend-card-spotlight" />
                <span className="relative z-10 font-semibold text-white/85 text-sm md:text-base">{svc.name}</span>
                <StatusBadge label={svc.status} color={svc.color} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* NETWORK STATUS */}
      <section className="pb-20 md:pb-28" ref={reveal}>
        <div className="container mx-auto px-6 max-w-3xl">
          <h2 className="lend-reveal--1 text-[10px] font-bold tracking-[0.35em] uppercase text-white/30 mb-6 pl-1">
            {copy.statusHub.networks}
          </h2>
          <div className="lend-reveal--2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {networks.map((net, idx) => (
              <Link
                key={net.name}
                href={net.href}
                className="lend-card lend-spotlight-card group relative flex items-center justify-between p-5 transition-all duration-500 hover:scale-[1.02]"
                style={{ animationDelay: `${idx * 0.06}s` }}
                onMouseMove={handleMouseMove}
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10 flex items-center gap-3">
                  <span className="font-bold text-white/90">{net.name}</span>
                  <span className="text-[10px] font-bold tracking-[0.15em] text-white/25 uppercase group-hover:text-accent/50 transition-colors">→</span>
                </div>
                <StatusBadge label={net.status} color={net.color} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-28 relative overflow-hidden lend-spotlight-card group" onMouseMove={handleMouseMove} ref={reveal}>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[200px] opacity-30 pointer-events-none animate-pulse" />
        <div className="container mx-auto px-6 text-center relative z-10 max-w-2xl">
          <h2 className="lend-reveal--1 text-3xl md:text-5xl font-extrabold tracking-tighter leading-[1.05] mb-4 text-white">
            {language === "ru" ? "Надёжность — наш приоритет" : "Reliability is our priority"}
          </h2>
          <p className="lend-reveal--2 text-base md:text-lg text-white/50 leading-relaxed mb-10">
            {language === "ru"
              ? "Распределённая инфраструктура с несколькими уровнями резервирования. Ваши платежи обрабатываются вовремя."
              : "We operate a distributed infrastructure with multiple redundancy levels to ensure your payments are always processed on time."}
          </p>
          <div className="lend-reveal--3 flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link className="lend-primary px-10 py-4 text-base font-bold rounded-2xl min-w-[200px] flex items-center justify-center gap-3 group/btn" href="/app/auth">
              {copy.hero.primary}
              <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500">→</span>
            </Link>
            <Link className="lend-secondary px-10 py-4 text-base font-bold rounded-2xl min-w-[200px] flex items-center justify-center" href={`/${language}/docs`}>
              {copy.nav.docs}
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
