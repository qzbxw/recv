"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Code2,
  Copy,
  FileText,
  KeyRound,
  Link2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  TerminalSquare,
  WalletCards,
  Webhook,
  Zap,
} from "lucide-react";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { useUI } from "./UIProvider";
import { JsonLd } from "./JsonLd";
import { getCopy, Locale } from "@/i18n";
import "./marketing/plans/plans.css";

export type ProductVariant = "checkoutProduct" | "apiProduct" | "invoicingProduct";

type ProductCopy = {
  metadata: {
    title: string;
    description: string;
    keywords: string;
  };
  kicker: string;
  title: string;
  description: string;
  hero: {
    title: string;
    body: string;
    cta: string;
  };
  comparison: {
    title: string;
    items: ReadonlyArray<{ legacy: string; reqst: string }>;
  };
  bento: {
    title: string;
    items: ReadonlyArray<{ title: string; body: string }>;
  };
  deepDive: ReadonlyArray<{ title: string; body: string }>;
  stats: ReadonlyArray<{ value: string; label: string }>;
  finalTitle: string;
  seo: string;
};

const productContent = {
  en: {
    oldWay: "Without Reqst",
    reqstWay: "With Reqst",
    checkoutProduct: {
      overviewTitle: "Customer payment flow",
      overviewBody:
        "The checkout page is the conversion layer between your cart and the customer's wallet. It explains the amount, network, QR, address and live payment state without sending the customer to pricing or plan details.",
      primaryCta: "Demo checkout",
      secondaryCta: "Merchant",
      tertiaryCta: "Business",
      primaryHref: "/app/checkout/demo",
      secondaryPath: "merchant",
      tertiaryPath: "business",
      flow: [
        "Customer opens a hosted checkout link from your store or bot.",
        "Reqst locks the amount, network and recipient address.",
        "Customer scans QR or copies the address into a wallet.",
        "Watchers detect the transfer and move the order through the payment states.",
        "Your system receives a settled result and can fulfill the order.",
      ],
      statusesTitle: "Payment states",
      statuses: [
        { label: "Awaiting payment", body: "Invoice is open and the QR/address are ready.", tone: "idle" },
        { label: "Detected", body: "A matching transaction is seen before final confirmation.", tone: "info" },
        { label: "Underpaid", body: "Partial amount is received and the remaining balance is shown.", tone: "warn" },
        { label: "Paid", body: "Required amount is confirmed and the invoice can be fulfilled.", tone: "success" },
        { label: "Expired", body: "The payment window has closed and the address should not be reused.", tone: "danger" },
      ],
      networksTitle: "Networks and address mechanics",
      networks: ["TON", "TRON USDT", "Solana", "Base", "Arbitrum", "BSC"],
      address: "TQDt...n4V7",
      qrCaption: "QR, copy address and network warnings live in one screen.",
    },
    apiProduct: {
      overviewTitle: "API overview",
      overviewBody:
        "Reqst API gives developers invoice creation, payment monitoring and signed callbacks while keeping pricing decisions out of the integration path.",
      primaryCta: "Open docs",
      secondaryCta: "Developer",
      tertiaryCta: "Business",
      primaryPath: "docs/introduction",
      secondaryPath: "dev",
      tertiaryPath: "business",
      capabilities: [
        { title: "Invoice creation", body: "Create hosted or API-only invoices with network, asset, amount, metadata and expiration." },
        { title: "Webhooks", body: "Receive status changes for detected, underpaid, paid and expired invoices." },
        { title: "HMAC & idempotency", body: "Verify webhook signatures and reuse idempotency keys to avoid duplicate writes." },
        { title: "Error handling", body: "Predictable HTTP codes and response bodies for validation, auth, limits and network issues." },
        { title: "Rate limits", body: "Clear request ceilings with upgrade paths for higher volume business workloads." },
      ],
      codeTitle: "Code examples",
      invoiceCode: `const invoice = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: {
    "Authorization": "Bearer rqst_live_...",
    "Idempotency-Key": "order_9841",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: "149.00",
    asset: "USDT",
    network: "TRON",
    success_url: "https://shop.example/orders/9841"
  })
});`,
      webhookCode: `const signature = req.headers["x-reqst-signature"];
const expected = hmacSha256(rawBody, webhookSecret);

if (signature !== expected) {
  return res.status(401).send("invalid signature");
}`,
    },
    invoicingProduct: {
      overviewTitle: "Invoice lifecycle",
      overviewBody:
        "Reqst Invoicing is a merchant workflow for creating, sharing and settling professional crypto invoices before the buyer ever sees a pricing page.",
      primaryCta: "Activate Merchant",
      primaryPath: "merchant",
      lifecycle: [
        "Draft invoice",
        "Share public checkout link",
        "Await payment",
        "Detect transfer",
        "Manual review if needed",
        "Paid and archived",
      ],
      dashboardTitle: "Dashboard and manual confirm",
      dashboardRows: [
        { id: "INV-1042", client: "Northwind Studio", state: "Paid", amount: "420 USDT" },
        { id: "INV-1043", client: "Arcade Labs", state: "Underpaid", amount: "116 / 120 USDT" },
        { id: "INV-1044", client: "Solo Founder", state: "Awaiting", amount: "89 USDT" },
      ],
      linksTitle: "Public checkout links",
      links: [
        "Hosted pages for each invoice",
        "Brand and description per request",
        "QR/address mechanics from checkout",
      ],
      telegramTitle: "Telegram notifications",
      notifications: [
        "Payment detected on TRON",
        "Invoice underpaid by 4 USDT",
        "Manual confirm requested",
      ],
    },
  },
  ru: {
    oldWay: "Без Reqst",
    reqstWay: "С Reqst",
    checkoutProduct: {
      overviewTitle: "Путь клиента к оплате",
      overviewBody:
        "Checkout - это слой конверсии между корзиной и кошельком клиента. Он отдельно объясняет сумму, сеть, QR, адрес и живой статус оплаты, не смешивая продукт с тарифами.",
      primaryCta: "Демо checkout",
      secondaryCta: "Merchant",
      tertiaryCta: "Business",
      primaryHref: "/app/checkout/demo",
      secondaryPath: "merchant",
      tertiaryPath: "business",
      flow: [
        "Клиент открывает hosted checkout из магазина или бота.",
        "Reqst фиксирует сумму, сеть и адрес получателя.",
        "Клиент сканирует QR или копирует адрес в кошелек.",
        "Вотчеры обнаруживают перевод и проводят заказ по статусам оплаты.",
        "Ваша система получает settled-результат и выдает товар или доступ.",
      ],
      statusesTitle: "Состояния оплаты",
      statuses: [
        { label: "Awaiting payment", body: "Инвойс открыт, QR и адрес готовы к оплате.", tone: "idle" },
        { label: "Detected", body: "Подходящая транзакция найдена до финального подтверждения.", tone: "info" },
        { label: "Underpaid", body: "Получена частичная сумма, клиент видит остаток к доплате.", tone: "warn" },
        { label: "Paid", body: "Нужная сумма подтверждена, заказ можно исполнять.", tone: "success" },
        { label: "Expired", body: "Окно оплаты закрыто, адрес не должен использоваться повторно.", tone: "danger" },
      ],
      networksTitle: "Сети, QR и адресная механика",
      networks: ["TON", "TRON USDT", "Solana", "Base", "Arbitrum", "BSC"],
      address: "TQDt...n4V7",
      qrCaption: "QR, копирование адреса и предупреждения по сети находятся на одном экране.",
    },
    apiProduct: {
      overviewTitle: "Обзор API",
      overviewBody:
        "Reqst API дает разработчикам создание инвойсов, мониторинг оплат и подписанные callback-уведомления, оставляя тарифные решения вне интеграционного сценария.",
      primaryCta: "Открыть docs",
      secondaryCta: "Developer",
      tertiaryCta: "Business",
      primaryPath: "docs/introduction",
      secondaryPath: "dev",
      tertiaryPath: "business",
      capabilities: [
        { title: "Invoice creation", body: "Создание hosted или API-only инвойсов с сетью, активом, суммой, metadata и сроком действия." },
        { title: "Webhooks", body: "Статусы detected, underpaid, paid и expired приходят на ваш backend." },
        { title: "HMAC/idempotency", body: "Проверяйте подписи вебхуков и используйте idempotency keys против дублей." },
        { title: "Error handling", body: "Предсказуемые HTTP-коды для валидации, авторизации, лимитов и сетевых ошибок." },
        { title: "Rate limits", body: "Понятные лимиты запросов с переходом на business-объемы при росте нагрузки." },
      ],
      codeTitle: "Примеры кода",
      invoiceCode: `const invoice = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: {
    "Authorization": "Bearer rqst_live_...",
    "Idempotency-Key": "order_9841",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    amount: "149.00",
    asset: "USDT",
    network: "TRON",
    success_url: "https://shop.example/orders/9841"
  })
});`,
      webhookCode: `const signature = req.headers["x-reqst-signature"];
const expected = hmacSha256(rawBody, webhookSecret);

if (signature !== expected) {
  return res.status(401).send("invalid signature");
}`,
    },
    invoicingProduct: {
      overviewTitle: "Invoice lifecycle",
      overviewBody:
        "Reqst Invoicing - это рабочий процесс мерчанта для создания, отправки и закрытия профессиональных крипто-счетов до того, как покупатель попадет на тарифную страницу.",
      primaryCta: "Активировать Merchant",
      primaryPath: "merchant",
      lifecycle: [
        "Draft invoice",
        "Share public checkout link",
        "Await payment",
        "Detect transfer",
        "Manual review if needed",
        "Paid and archived",
      ],
      dashboardTitle: "Dashboard and manual confirm",
      dashboardRows: [
        { id: "INV-1042", client: "Northwind Studio", state: "Paid", amount: "420 USDT" },
        { id: "INV-1043", client: "Arcade Labs", state: "Underpaid", amount: "116 / 120 USDT" },
        { id: "INV-1044", client: "Solo Founder", state: "Awaiting", amount: "89 USDT" },
      ],
      linksTitle: "Public checkout links",
      links: [
        "Hosted pages for each invoice",
        "Brand and description per request",
        "QR/address mechanics from checkout",
      ],
      telegramTitle: "Telegram notifications",
      notifications: [
        "Платеж обнаружен в TRON",
        "Недоплата по инвойсу на 4 USDT",
        "Запрошено ручное подтверждение",
      ],
    },
  },
} as const;

type CheckoutText = (typeof productContent)[Locale]["checkoutProduct"];
type ApiText = (typeof productContent)[Locale]["apiProduct"];
type InvoicingText = (typeof productContent)[Locale]["invoicingProduct"];
type ProductText = CheckoutText | ApiText | InvoicingText;

function localizedPath(language: Locale, path: string) {
  return `/${language}/${path}`;
}

function getProduct(copy: ReturnType<typeof getCopy>, variant: ProductVariant): ProductCopy {
  return copy.marketing[variant] as ProductCopy;
}

export function ProductPageClient({ variant }: { variant: ProductVariant }) {
  const { language } = useUI();
  const fullCopy = getCopy(language);
  const product = getProduct(fullCopy, variant);
  const text = productContent[language][variant];
  const commonText = productContent[language];
  const reveal = useReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variant]);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": fullCopy.marketing.breadcrumbs.home,
        "item": `https://reqst.xyz/${language}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": fullCopy.marketing.breadcrumbs.products,
        "item": `https://reqst.xyz/${language}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.title,
        "item": `https://reqst.xyz/${language}/products/${variant === "checkoutProduct" ? "checkout" : variant === "apiProduct" ? "api" : "invoicing"}`
      }
    ]
  };

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": product.title,
    "description": product.metadata.description,
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "PaymentGateway",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
    "featureList": product.bento.items.map(i => i.title).join(", "),
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "128"
    }
  };

  return (
    <MarketingLayout language={language}>
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={applicationSchema} />

      {/* Hero Section */}
      <header className="lend-hero lend-hero--centered" ref={reveal}>
        <div className="lend-hero-copy">
          <span className="lend-section-kicker lend-reveal--1">{product.kicker}</span>
          <h1 className="lend-reveal--2">{product.hero.title}</h1>
          <p className="lend-reveal--3">{product.hero.body}</p>
          <div className="lend-cta-row lend-reveal--4">
            <PrimaryCta variant={variant} language={language} text={text} />
            <SecondaryCtas variant={variant} language={language} text={text} />
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {product.stats.map((stat, index) => (
            <article key={stat.label} className={`lend-card text-center flex flex-col items-center justify-center p-6 lend-reveal--${index + 1}`}>
              <span className="lend-stat-label mb-2">{stat.label}</span>
              <strong className="lend-stat-value text-2xl md:text-3xl">{stat.value}</strong>
            </article>
          ))}
        </div>
      </section>

      {/* Overview Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16 md:mb-24">
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker font-bold">{text.overviewTitle}</span>
            <h2 className="font-extrabold">{product.title}</h2>
            <p className="text-lg opacity-80 font-medium">{text.overviewBody}</p>
          </div>
        </div>
        <div className="lend-reveal--2">
          {variant === "checkoutProduct" && <CheckoutDetails text={text as CheckoutText} />}
          {variant === "apiProduct" && <ApiDetails text={text as ApiText} />}
          {variant === "invoicingProduct" && <InvoicingDetails text={text as InvoicingText} />}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy text-center max-w-3xl mx-auto mb-12 lend-reveal--1 flex flex-col items-center">
          <span className="lend-section-kicker font-bold">{product.comparison.title}</span>
          <h2 className="font-extrabold">{language === "ru" ? "Почему продукт нужен до выбора тарифа" : "Why this comes before pricing"}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 lend-reveal--2">
          {product.comparison.items.map((item, index) => (
            <article key={item.legacy} className={`lend-card flex flex-col md:flex-row gap-6 md:gap-12 lend-reveal--${index + 1}`}>
              <div className="flex-1">
                <span className="text-xs font-bold opacity-50 uppercase tracking-widest mb-2 block">{commonText.oldWay}</span>
                <p className="text-lg opacity-70 italic">{item.legacy}</p>
              </div>
              <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-12">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2 block">{commonText.reqstWay}</span>
                <p className="text-lg font-medium">{item.reqst}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="lend-section-copy text-center max-w-3xl mx-auto mb-12 lend-reveal--1 flex flex-col items-center">
          <span className="lend-section-kicker uppercase tracking-widest font-bold">{language === "ru" ? "ВОЗМОЖНОСТИ" : "CAPABILITIES"}</span>
          <h2 className="font-extrabold">{product.bento.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lend-reveal--2">
          {product.bento.items.map((item, index) => (
            <article key={item.title} className={`lend-card lend-reveal--${index + 1}`}>
              <span className="text-3xl font-bold opacity-10 mb-4 block leading-none">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="opacity-70 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {variant === "apiProduct" && <ApiCodeSection text={text as ApiText} reveal={reveal} />}

      {/* Deep Dive Cards */}
      <section className="lend-stacked-section" ref={reveal}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {product.deepDive.map((item, index) => (
            <article key={item.title} className={`lend-card lend-reveal--${index + 1} flex flex-col`}>
              <span className="text-sm font-bold opacity-30 mb-4 block">{String(index + 1).padStart(2, "0")}</span>
              <h3 className="text-xl font-bold mb-4">{item.title}</h3>
              <p className="opacity-80 leading-relaxed">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="lend-final" ref={reveal}>
        <span className="lend-section-kicker lend-reveal--1 font-bold">{product.kicker}</span>
        <h2 className="lend-reveal--2 font-extrabold">
          {product.finalTitle}
        </h2>
        <p className="lend-reveal--3 max-w-2xl mx-auto mb-10 opacity-80 font-medium">{product.description}</p>
        <div className="lend-cta-row lend-reveal--4">
          <PrimaryCta variant={variant} language={language} text={text} />
          <SecondaryCtas variant={variant} language={language} text={text} />
        </div>
      </section>

      {/* Hidden SEO text for search engines only */}
      <div className="sr-only" aria-hidden="true">
        {product.seo}
      </div>
    </MarketingLayout>
  );
}

function PrimaryCta({
  variant,
  language,
  text,
}: {
  variant: ProductVariant;
  language: Locale;
  text: ProductText;
}) {
  if (variant === "checkoutProduct") {
    const checkoutText = text as CheckoutText;
    return (
      <Link className="lend-primary" href={checkoutText.primaryHref}>
        {checkoutText.primaryCta}
      </Link>
    );
  }

  const planText = text as ApiText | InvoicingText;
  return (
    <Link className="lend-primary" href={localizedPath(language, planText.primaryPath)}>
      {planText.primaryCta}
    </Link>
  );
}

function SecondaryCtas({
  variant,
  language,
  text,
}: {
  variant: ProductVariant;
  language: Locale;
  text: ProductText;
}) {
  if (variant === "invoicingProduct") return null;

  const secondaryText = text as CheckoutText | ApiText;
  return (
    <>
      <Link className="lend-secondary" href={localizedPath(language, secondaryText.secondaryPath)}>
        {secondaryText.secondaryCta}
      </Link>
      <Link className="lend-secondary" href={localizedPath(language, secondaryText.tertiaryPath)}>
        {secondaryText.tertiaryCta}
      </Link>
    </>
  );
}

function CheckoutDetails({ text }: { text: CheckoutText }) {
  return (
    <div className="space-y-24">
      {/* Horizontal Flow */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/10 hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {text.flow.map((step, index) => (
            <article key={step} className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all relative z-10 mx-auto md:mx-0">
                <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">{index + 1}</span>
              </div>
              <p className="text-sm opacity-60 leading-relaxed text-center md:text-left">{step}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Payment States */}
        <div className="lend-card p-8 border-white/10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Zap size={20} className="text-purple-400" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">{text.statusesTitle}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {text.statuses.map((status) => (
              <div key={status.label} className="flex gap-4 group">
                <div className={`w-1 h-auto rounded-full group-hover:scale-y-110 transition-transform ${
                  status.tone === 'success' ? 'bg-green-500' : 
                  status.tone === 'danger' ? 'bg-red-500' : 
                  status.tone === 'warn' ? 'bg-orange-500' : 
                  status.tone === 'info' ? 'bg-blue-500' : 'bg-white/20'
                }`} />
                <div>
                  <h4 className="text-sm font-bold mb-1 opacity-90">{status.label}</h4>
                  <p className="text-xs opacity-50 leading-relaxed">{status.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiDetails({ text }: { text: ApiText }) {
  const icons = [Code2, Webhook, KeyRound, ShieldCheck, RefreshCw];

  return (
    <div className="space-y-24">
      {/* Horizontal Capabilities */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/10 hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {text.capabilities.map((capability, index) => {
            const Icon = icons[index];
            return (
              <article key={capability.title} className="relative group">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all relative z-10 mx-auto md:mx-0">
                  <Icon size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-center md:text-left">{capability.title}</h3>
                <p className="text-xs opacity-50 leading-relaxed text-center md:text-left">{capability.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvoicingDetails({ text }: { text: InvoicingText }) {
  return (
    <div className="space-y-24">
      {/* Horizontal Lifecycle */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/10 hidden lg:block" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {text.lifecycle.map((step, index) => (
            <article key={step} className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all relative z-10 mx-auto lg:mx-0">
                <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">{index + 1}</span>
              </div>
              <p className="text-xs opacity-60 leading-relaxed text-center lg:text-left font-medium">{step}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <article className="lend-card p-8 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Link2 size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold uppercase tracking-widest">{text.linksTitle}</h3>
          </div>
          <ul className="space-y-4">
            {text.links.map((item) => (
              <li key={item} className="text-sm opacity-60 leading-relaxed flex gap-3 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
                {item}
              </li>
            ))}
          </ul>
        </article>
        <article className="lend-card p-8 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={20} className="text-blue-400" />
            <h3 className="text-lg font-bold uppercase tracking-widest">{text.telegramTitle}</h3>
          </div>
          <ul className="space-y-4">
            {text.notifications.map((item) => (
              <li key={item} className="text-sm opacity-60 leading-relaxed flex gap-3 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400/40" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

function ApiCodeSection({
  text,
  reveal,
}: {
  text: ApiText;
  reveal: (el: HTMLElement | null) => void;
}) {
  return (
    <section className="lend-stacked-section" ref={reveal}>
      <div className="lend-section-copy text-center max-w-3xl mx-auto mb-12 lend-reveal--1 flex flex-col items-center">
        <span className="lend-section-kicker">API</span>
        <h2>{text.codeTitle}</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lend-reveal--2">
        <article className="lend-card p-0 overflow-hidden border-white/10">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">create invoice</span>
             <span className="text-[10px] opacity-20">Node.js / Fetch</span>
          </div>
          <pre className="p-6 text-xs overflow-x-auto bg-black/20">
            <code className="opacity-80">{text.invoiceCode}</code>
          </pre>
        </article>
        <article className="lend-card p-0 overflow-hidden border-white/10">
          <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex justify-between items-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">verify webhook</span>
             <span className="text-[10px] opacity-20">Express / Webhook</span>
          </div>
          <pre className="p-6 text-xs overflow-x-auto bg-black/20">
            <code className="opacity-80">{text.webhookCode}</code>
          </pre>
        </article>
      </div>
    </section>
  );
}
