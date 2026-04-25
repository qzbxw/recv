"use client";

import Link from "next/link";
import { getCopy } from "@/lib/copy";

export function Footer({ language }: { language: "ru" | "en" }) {
  const copy = getCopy(language);
  const nav = copy.nav;
  const f = copy.footer;

  return (
    <footer className="bg-zinc-950 border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-20">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href={`/${language}`} className="text-2xl font-black tracking-tighter text-white">
              reqst<span className="text-purple-500">.</span>
            </Link>
            <p className="mt-4 text-sm text-white/50 leading-relaxed max-w-[240px]">
              {f.body}
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">{f.product}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${language}/products/checkout`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.products.checkout.title}</Link></li>
              <li><Link href={`/${language}/products/api`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.products.api.title}</Link></li>
              <li><Link href={`/${language}/products/invoicing`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.products.invoicing.title}</Link></li>
              <li><Link href={`/${language}/compare`} className="text-sm text-white/60 hover:text-white transition-colors">{copy.marketing.breadcrumbs.compare}</Link></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">{f.solutions}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${language}/use-cases/telegram-shops`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.useCases.tgShops}</Link></li>
              <li><Link href={`/${language}/use-cases/saas-billing`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.useCases.saas}</Link></li>
              <li><Link href={`/${language}/use-cases/digital-goods`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.useCases.digital}</Link></li>
              <li><Link href={`/${language}/use-cases/paid-communities`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.useCases.communities}</Link></li>
            </ul>
          </div>

          {/* Pricing/Company Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">{f.company}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${language}/merchant`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.pricing.merchant}</Link></li>
              <li><Link href={`/${language}/dev`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.pricing.developer}</Link></li>
              <li><Link href={`/${language}/business`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.pricing.business}</Link></li>
              <li><Link href={`/${language}/enterprise`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.pricing.enterprise}</Link></li>
            </ul>
          </div>

          {/* Resources/Legal Column */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-6">{f.resources}</h4>
            <ul className="space-y-4">
              <li><Link href={`/${language}/docs/introduction`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.docs}</Link></li>
              <li><Link href={`/${language}/blog`} className="text-sm text-white/60 hover:text-white transition-colors">{nav.blog}</Link></li>
              <li><Link href={`/${language}/privacy`} className="text-sm text-white/60 hover:text-white transition-colors">{f.privacy}</Link></li>
              <li><Link href={`/${language}/terms`} className="text-sm text-white/60 hover:text-white transition-colors">{f.terms}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-white/30">
            © {new Date().getFullYear()} reqst. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
             <Link href="/app/auth" className="text-xs font-bold text-white hover:text-purple-500 transition-colors">{f.console}</Link>
             <Link href={`/${language}/status`} className="text-xs font-bold text-white hover:text-purple-500 transition-colors">{f.status}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
