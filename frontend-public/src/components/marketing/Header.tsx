"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X, Zap, CreditCard, Code, Bot } from "lucide-react";
import type { PublicCopy } from "@/lib/copy";
import { LOCALES, type Locale } from "@/i18n";
import { NetworkLogo } from "@/components/NetworkLogo";
import { useLocaleAlternates } from "./localeAlternates";

const LANGUAGE_LABELS: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  uk: "UK",
  uz: "UZ",
  de: "DE",
};

/** Swap the leading locale segment of the current path to the target locale. */
function swapLocaleInPath(pathname: string | null, target: Locale) {
  if (!pathname) return `/${target}`;
  const segments = pathname.split("/");
  if (LOCALES.includes(segments[1] as Locale)) {
    segments[1] = target;
    return segments.join("/") || `/${target}`;
  }
  return `/${target}`;
}

export function Header({ language, nav }: { language: Locale; nav: PublicCopy["nav"] }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const localeAlternates = useLocaleAlternates();
  const localeHref = (target: Locale) =>
    localeAlternates?.[target] ?? swapLocaleInPath(pathname, target);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMenuOpen]);


  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/5 py-3" : "bg-transparent py-5"
      }`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href={`/${language}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/logo-transparent.png" alt="recv" width={32} height={32} priority />
            <span className="text-2xl font-black tracking-tighter text-white">recv<span className="text-purple-500">.</span></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Products Mega Menu */}
            <div className="group relative">
              <Link href={`/${language}/products`} className="header-nav-btn flex items-center gap-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {nav.products.title} <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                <div className="mega-menu-card rounded-2xl p-3 w-[460px] grid grid-cols-2 gap-1">
                  <Link href={`/${language}/products/checkout`} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover/item:bg-purple-500 group-hover/item:text-white transition-colors flex-shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{nav.products.checkout.title}</div>
                      <div className="text-[10px] leading-tight text-white/40 mt-0.5">{nav.products.checkout.desc}</div>
                    </div>
                  </Link>
                  <Link href={`/${language}/products/api`} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors flex-shrink-0">
                      <Code className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{nav.products.api.title}</div>
                      <div className="text-[10px] leading-tight text-white/40 mt-0.5">{nav.products.api.desc}</div>
                    </div>
                  </Link>
                  <Link href={`/${language}/products/invoicing`} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors flex-shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{nav.products.invoicing.title}</div>
                      <div className="text-[10px] leading-tight text-white/40 mt-0.5">{nav.products.invoicing.desc}</div>
                    </div>
                  </Link>
                  <Link href={`/${language}/products/mcp`} className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors group/item">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-colors flex-shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{nav.products.mcp.title}</div>
                      <div className="text-[10px] leading-tight text-white/40 mt-0.5">{nav.products.mcp.desc}</div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Use Cases Menu */}
            <div className="group relative">
              <Link href={`/${language}/use-cases`} className="header-nav-btn flex items-center gap-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {nav.useCases.title} <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                <div className="mega-menu-card rounded-2xl p-2 w-[220px] flex flex-col gap-0.5">
                  {[
                    { title: nav.useCases.tgShops, href: "telegram-shops" },
                    { title: nav.useCases.saas, href: "saas-billing" },
                    { title: nav.useCases.digital, href: "digital-goods" },
                    { title: nav.useCases.communities, href: "paid-communities" },
                  ].map((item) => (
                    <Link key={item.href} href={`/${language}/use-cases/${item.href}`} className="p-2.5 rounded-xl hover:bg-white/5 text-xs font-semibold text-white/80 hover:text-white transition-colors">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Networks Menu */}
            <div className="group relative">
              <Link href={`/${language}/networks`} className="header-nav-btn flex items-center gap-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {nav.networks.title} <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </Link>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                <div className="mega-menu-card rounded-2xl p-3 w-[360px] grid grid-cols-2 gap-1">
                  {[
                    { name: nav.networks.ton, slug: "ton" },
                    { name: nav.networks.tron, slug: "tron" },
                    { name: nav.networks.solana, slug: "solana" },
                    { name: nav.networks.base, slug: "base" },
                    { name: "Arbitrum", slug: "arbitrum" },
                    { name: nav.networks.bsc, slug: "bsc" },
                  ].map((net) => (
                    <Link key={net.slug} href={`/${language}/networks/${net.slug}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 text-[11px] font-semibold text-white/60 hover:text-white transition-colors">
                      <NetworkLogo network={net.slug} className="network-logo--sm" /> {net.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Menu */}
            <div className="group relative">
              <button className="header-nav-btn flex items-center gap-1 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {nav.pricing.title} <ChevronDown className="w-4 h-4 opacity-50 group-hover:rotate-180 transition-transform" />
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                <div className="mega-menu-card rounded-2xl p-2 w-[180px] flex flex-col gap-0.5">
                  {[
                    { title: nav.pricing.merchant, href: "merchant" },
                    { title: nav.pricing.developer, href: "dev" },
                    { title: nav.pricing.business, href: "business" },
                  ].map((item) => (
                    <Link key={item.href} href={`/${language}/${item.href}`} className="p-2.5 rounded-xl hover:bg-white/5 text-xs font-semibold text-white/80 hover:text-white transition-colors">
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href={`/${language}/docs/introduction`} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              {nav.docs}
            </Link>
            <Link href={`/${language}/blog`} className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              {nav.blog}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
              {LOCALES.map((locale) => (
                <Link key={locale} href={localeHref(locale)} className={`px-2 py-1 text-[9px] font-bold rounded-full transition-all ${language === locale ? "lang-btn-active" : "lang-btn-inactive"}`}>
                  {LANGUAGE_LABELS[locale]}
                </Link>
              ))}
            </div>
            
            <Link href="/app/auth" className="hidden sm:flex header-console-btn transition-all">
              {nav.console}
            </Link>

            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label={isMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMenuOpen} className="lg:hidden p-2 text-white/70 hover:text-white transition-colors">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-0 bg-black/95 backdrop-blur-2xl z-[90] overflow-y-auto pt-24 px-6 pb-12 flex flex-col gap-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div className="text-[10px] font-bold tracking-widest text-white/20 uppercase">{nav.products.title}</div>
              <div className="grid gap-4">
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/products/checkout`} className="text-2xl font-bold text-white tracking-tight">{nav.products.checkout.title}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/products/api`} className="text-2xl font-bold text-white tracking-tight">{nav.products.api.title}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/products/invoicing`} className="text-2xl font-bold text-white tracking-tight">{nav.products.invoicing.title}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/products/mcp`} className="text-2xl font-bold text-white tracking-tight">{nav.products.mcp.title}</Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-bold tracking-widest text-white/20 uppercase">{nav.useCases.title}</div>
              <div className="grid gap-4">
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/use-cases`} className="text-2xl font-bold text-white tracking-tight">{nav.useCases.title}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/use-cases/telegram-shops`} className="text-2xl font-bold text-white tracking-tight">{nav.useCases.tgShops}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/use-cases/saas-billing`} className="text-2xl font-bold text-white tracking-tight">{nav.useCases.saas}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/use-cases/digital-goods`} className="text-2xl font-bold text-white tracking-tight">{nav.useCases.digital}</Link>
                <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/use-cases/paid-communities`} className="text-2xl font-bold text-white tracking-tight">{nav.useCases.communities}</Link>
              </div>
            </div>

            <div className="flex flex-col gap-6 pt-8 border-t border-white/5">
              <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/docs/introduction`} className="text-xl font-bold text-white/60">{nav.docs}</Link>
              <Link onClick={() => setIsMenuOpen(false)} href={`/${language}/blog`} className="text-xl font-bold text-white/60">{nav.blog}</Link>
              <Link onClick={() => setIsMenuOpen(false)} href="/app/auth" className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 !text-white text-center font-bold text-lg mt-4 shadow-[0_12px_32px_rgba(124,58,237,0.4)] flex items-center justify-center gap-2">
                {nav.console}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
