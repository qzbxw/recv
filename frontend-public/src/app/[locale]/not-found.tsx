"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

// Client component on purpose: a server not-found reading headers() embeds a
// dynamic API into every route shell of the segment, which opted the whole
// [locale] tree out of static prerendering.
export default function NotFound() {
  const pathname = usePathname();
  const language = pathname === "/ru" || pathname?.startsWith("/ru/") ? "ru" : "en";
  const copy = language === "ru"
    ? {
        title: "Страница не найдена",
        body: "Запрошенная страница recv не существует или была перемещена.",
        search: "Поиск по справке",
        placeholder: "Например, webhooks",
        home: "Главная",
        docs: "Документация",
        products: "Продукты",
        help: "Помощь",
      }
    : {
        title: "Page not found",
        body: "The requested recv page does not exist or has moved.",
        search: "Search help",
        placeholder: "For example, webhooks",
        home: "Home",
        docs: "Documentation",
        products: "Products",
        help: "Help",
      };

  return (
    <MarketingLayout language={language} path={pathname || `/${language}`}>
      <section className="min-h-[70vh] grid place-items-center px-6 pb-24 text-center relative z-10">
        <div className="max-w-2xl">
          <span className="lend-section-kicker justify-center mx-auto">404</span>
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
            {copy.title}
          </h1>
          <p className="mt-6 text-base md:text-lg text-white/55 leading-relaxed">
            {copy.body}
          </p>
          <form action={`/${language}/help`} method="get" role="search" className="mt-8 flex gap-3">
            <label htmlFor="not-found-search" className="sr-only">{copy.search}</label>
            <input id="not-found-search" name="q" type="search" placeholder={copy.placeholder} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none focus:border-accent" />
            <button type="submit" className="lend-primary px-6 py-4 rounded-2xl font-bold">{copy.search}</button>
          </form>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={`/${language}`} className="lend-primary px-7 py-4 rounded-2xl font-bold">{copy.home}</Link>
            <Link href={`/${language}/docs/introduction`} className="lend-secondary px-7 py-4 rounded-2xl font-bold">{copy.docs}</Link>
            <Link href={`/${language}/products`} className="lend-secondary px-7 py-4 rounded-2xl font-bold">{copy.products}</Link>
            <Link href={`/${language}/help`} className="lend-secondary px-7 py-4 rounded-2xl font-bold">{copy.help}</Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
