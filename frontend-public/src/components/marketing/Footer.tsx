import Link from "next/link";
import { getCopy } from "@/lib/copy";
import type { Locale } from "@/i18n";

export function Footer({ language }: { language: Locale }) {
  const copy = getCopy(language);
  const nav = copy.nav;
  const f = copy.footer;

  return (
    <footer className="relative bg-[#020202] border-t border-purple-500/10 pt-24 pb-12 overflow-hidden">
      {/* Background glow overlays */}
      <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[200px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href={`/${language}`} className="text-2xl font-black tracking-tighter text-white hover:opacity-90 transition-opacity">
              recv<span className="text-purple-500 animate-pulse inline-block">.</span>
            </Link>
            <p className="mt-4 text-sm text-white/55 leading-relaxed max-w-[240px] font-medium">
              {f.body}
            </p>
          </div>

          {/* Product Column */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">{f.product}</div>
            <ul className="space-y-4">
              <li><Link href={`/${language}/products/checkout`} className="lend-footer-link">{nav.products.checkout.title}</Link></li>
              <li><Link href={`/${language}/products/api`} className="lend-footer-link">{nav.products.api.title}</Link></li>
              <li><Link href={`/${language}/products/invoicing`} className="lend-footer-link">{nav.products.invoicing.title}</Link></li>
              <li><Link href={`/${language}/products/mcp`} className="lend-footer-link">{nav.products.mcp.title}</Link></li>
              <li><Link href={`/${language}/compare`} className="lend-footer-link">{copy.marketing.breadcrumbs.compare}</Link></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">{f.solutions}</div>
            <ul className="space-y-4">
              <li><Link href={`/${language}/use-cases/telegram-shops`} className="lend-footer-link">{nav.useCases.tgShops}</Link></li>
              <li><Link href={`/${language}/use-cases/saas-billing`} className="lend-footer-link">{nav.useCases.saas}</Link></li>
              <li><Link href={`/${language}/use-cases/digital-goods`} className="lend-footer-link">{nav.useCases.digital}</Link></li>
              <li><Link href={`/${language}/use-cases/paid-communities`} className="lend-footer-link">{nav.useCases.communities}</Link></li>
            </ul>
          </div>

          {/* Pricing/Company Column */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">{f.company}</div>
            <ul className="space-y-4">
              <li><Link href={`/${language}/merchant`} className="lend-footer-link">{nav.pricing.merchant}</Link></li>
              <li><Link href={`/${language}/dev`} className="lend-footer-link">{nav.pricing.developer}</Link></li>
              <li><Link href={`/${language}/business`} className="lend-footer-link">{nav.pricing.business}</Link></li>
            </ul>
          </div>

          {/* Resources/Legal Column */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6">{f.resources}</div>
            <ul className="space-y-4">
              <li><Link href={`/${language}/docs/introduction`} className="lend-footer-link">{nav.docs}</Link></li>
              <li><Link href={`/${language}/blog`} className="lend-footer-link">{nav.blog}</Link></li>
              <li><Link href={`/${language}/privacy`} className="lend-footer-link">{f.privacy}</Link></li>
              <li><Link href={`/${language}/terms`} className="lend-footer-link">{f.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-white/50 font-medium">
            © {new Date().getFullYear()} recv. All rights reserved.
          </div>
          <div className="flex items-center gap-8">
            <Link href="/app/auth" className="lend-footer-meta-link">
              {f.console}
            </Link>
            
            <Link href={`/${language}/status`} className="lend-footer-meta-link flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              {f.status}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
