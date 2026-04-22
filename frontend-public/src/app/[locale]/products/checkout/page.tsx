"use client";

import { use } from "react";
import Link from "next/link";
import { COPY } from "@/lib/copy";
import { MarketingLayout, useReveal } from "@/components/marketing/MarketingLayout";

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const params = use(props.params);
  const language = params.locale as "ru" | "en";
  const reveal = useReveal();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const content = {
    ru: {
      title: "Checkout: Бесшовная оплата для ваших клиентов",
      description: "Современный и быстрый интерфейс оплаты, который увеличивает конверсию и минимизирует ошибки.",
      kicker: "ПРОДУКТ",
    },
    en: {
      title: "Checkout: Seamless Payment Experience",
      description: "Modern, high-converting checkout UI designed to minimize friction and eliminate payment errors.",
      kicker: "PRODUCT",
    }
  }[language];

  return (
    <MarketingLayout language={language}>
      <section className="lend-hero lend-hero--centered" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">{content.kicker}</span>
          <h1 className="lend-reveal--2">{content.title}</h1>
          <p className="lend-reveal--3">{content.description}</p>
          <div className="lend-cta-row lend-reveal--4">
            <Link className="lend-primary" href="/app/auth">
              {language === "ru" ? "Попробовать демо" : "Try Demo"}
            </Link>
            <Link className="lend-secondary" href="/docs">
              {language === "ru" ? "Документация" : "Documentation"}
            </Link>
          </div>
        </div>
      </section>

      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-overview-grid lend-reveal--2">
          <article className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <h3>{language === "ru" ? "Адаптивность" : "Responsive Design"}</h3>
            <p>{language === "ru" ? "Идеально работает на мобильных устройствах, в браузерах и внутри Telegram WebApps." : "Works perfectly on mobile, web browsers, and within Telegram WebApps."}</p>
          </article>
          <article className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <h3>{language === "ru" ? "Умный мониторинг" : "Smart Monitoring"}</h3>
            <p>{language === "ru" ? "Автоматическое распознавание транзакций, обработка недоплат и переплат." : "Automatic transaction detection, underpayment and overpayment handling."}</p>
          </article>
          <article className="lend-card lend-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="lend-card-spotlight" />
            <h3>{language === "ru" ? "Безопасность" : "Security First"}</h3>
            <p>{language === "ru" ? "Non-custodial решение: средства идут напрямую на ваш кошелек." : "Non-custodial solution: funds flow directly to your wallet."}</p>
          </article>
        </div>
      </section>
    </MarketingLayout>
  );
}
