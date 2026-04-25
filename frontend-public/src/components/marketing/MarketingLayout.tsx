"use client";

import { useEffect, useRef } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { usePathname } from "next/navigation";

export function useReveal() {
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { threshold: 0.1 }
    );
    refs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, []);
  return (el: HTMLElement | null) => {
    if (el && !refs.current.includes(el)) refs.current.push(el);
  };
}

export function MarketingLayout({
  children,
  language,
}: {
  children: React.ReactNode;
  language: "ru" | "en";
}) {
  const pathname = usePathname();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://reqst.xyz").replace(/\/+$/, "");
  const canonicalUrl = `${baseUrl}${pathname}`.replace(/\/+$/, "");

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    
    let link: HTMLLinkElement | null = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonicalUrl || baseUrl);
  }, [canonicalUrl, baseUrl]);

  return (
    <div className="lend-page min-h-screen bg-black text-white selection:bg-purple-500/30">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <Header language={language} />
      
      <main className="lend-shell relative z-10 pt-40 min-h-[calc(100vh-200px)]">
        {children}
      </main>

      <Footer language={language} />
    </div>
  );
}
