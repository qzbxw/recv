import Link from "next/link";
import {
  Bell,
  Code2,
  KeyRound,
  Link2,
  RefreshCw,
  ShieldCheck,
  Webhook,
  Zap,
} from "lucide-react";
import { MarketingLayout } from "./marketing/MarketingLayout";
import { JsonLd } from "./JsonLd";
import { getCopy, Locale } from "@/i18n";
import "./marketing/plans/plans.css";

export type ProductVariant = "checkoutProduct" | "apiProduct" | "invoicingProduct" | "mcpProduct";

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
    items: ReadonlyArray<{ legacy: string; recv: string }>;
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
    oldWay: "Without recv",
    recvWay: "With recv",
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
        "recv locks the amount, network and recipient address.",
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
      networks: ["TON", "USDT on TON", "TRON USDT", "Solana", "Base", "Arbitrum", "BSC"],
      address: "TQDt...n4V7",
      qrCaption: "QR, copy address and network warnings live in one screen.",
    },
    apiProduct: {
      overviewTitle: "API overview",
      overviewBody:
        "recv API gives developers invoice creation, payment monitoring and signed callbacks while keeping pricing decisions out of the integration path.",
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
      invoiceCode: `const invoice = await fetch("https://recv.money/v1/invoices", {
  method: "POST",
  headers: {
    "Authorization": "Bearer live_...",
    "Idempotency-Key": "order_9841",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Order #9841",
    base_amount_usd: "149.00",
    payable_network: "TRON",
    expires_in_minutes: 60
  })
});`,
      webhookCode: `const signature = req.headers["x-recv-signature"];
const timestamp = req.headers["x-recv-timestamp"];
const expected = "v1=" + hmacSha256(timestamp + "." + rawBody, webhookSecret);

if (signature !== expected) {
  return res.status(401).send("invalid signature");
}`,
    },
    invoicingProduct: {
      overviewTitle: "Invoice lifecycle",
      overviewBody:
        "recv Invoicing is a merchant workflow for creating, sharing and settling professional crypto invoices before the buyer ever sees a pricing page.",
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
    mcpProduct: {
      overviewTitle: "How it works",
      overviewBody:
        "Drop the recv MCP server into any MCP-compatible host. Your agent immediately gets 12 tools for onboarding, billing, and payment verification — no dashboard, no manual setup.",
      primaryCta: "Read MCP Docs",
      primaryPath: "docs/mcp",
      configTitle: "Add to claude_desktop_config.json",
      configCode: `{
  "mcpServers": {
    "recv": {
      "command": "npx",
      "args": ["-y", "recv-mcp"],
      "env": {
        "RECV_API_KEY": "live_...",
        "RECV_ACCESS_TOKEN": "your_token"
      }
    }
  }
}`,
      toolsTitle: "12 Agent Tools",
      tools: [
        { name: "bootstrap_agent_workspace", desc: "Self-register a new workspace and get an access token" },
        { name: "create_subscription_checkout", desc: "Buy a plan — merchant, developer, or business" },
        { name: "get_checkout_invoice", desc: "Poll subscription payment until confirmed" },
        { name: "get_account", desc: "Read current workspace, plan, and balance" },
        { name: "create_invoice", desc: "Create a payment invoice on any supported network" },
        { name: "get_invoice", desc: "Fetch status of an existing invoice" },
        { name: "list_invoices", desc: "Paginate your invoice history" },
        { name: "simulate_payment", desc: "Trigger a test payment in sandbox mode" },
        { name: "create_api_key", desc: "Issue a scoped API key after plan is active" },
        { name: "create_webhook_endpoint", desc: "Register an HTTPS endpoint for events" },
        { name: "verify_webhook", desc: "Validate HMAC-SHA256 signature locally" },
        { name: "list_supported_networks", desc: "List all payable blockchain networks" },
      ],
    },
  },
  ru: {
    oldWay: "Без recv",
    recvWay: "С recv",
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
        "recv фиксирует сумму, сеть и адрес получателя.",
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
      networks: ["TON", "USDT в TON", "TRON USDT", "Solana", "Base", "Arbitrum", "BSC"],
      address: "TQDt...n4V7",
      qrCaption: "QR, копирование адреса и предупреждения по сети находятся на одном экране.",
    },
    apiProduct: {
      overviewTitle: "Обзор API",
      overviewBody:
        "recv API дает разработчикам создание инвойсов, мониторинг оплат и подписанные callback-уведомления, оставляя тарифные решения вне интеграционного сценария.",
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
      invoiceCode: `const invoice = await fetch("https://recv.money/v1/invoices", {
  method: "POST",
  headers: {
    "Authorization": "Bearer live_...",
    "Idempotency-Key": "order_9841",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "Order #9841",
    base_amount_usd: "149.00",
    payable_network: "TRON",
    expires_in_minutes: 60
  })
});`,
      webhookCode: `const signature = req.headers["x-recv-signature"];
const timestamp = req.headers["x-recv-timestamp"];
const expected = "v1=" + hmacSha256(timestamp + "." + rawBody, webhookSecret);

if (signature !== expected) {
  return res.status(401).send("invalid signature");
}`,
    },
    invoicingProduct: {
      overviewTitle: "Invoice lifecycle",
      overviewBody:
        "recv Invoicing - это рабочий процесс мерчанта для создания, отправки и закрытия профессиональных крипто-счетов до того, как покупатель попадет на тарифную страницу.",
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
    mcpProduct: {
      overviewTitle: "Как это работает",
      overviewBody:
        "Добавьте MCP-сервер recv в любой MCP-совместимый хост. Агент сразу получает 12 инструментов для онбординга, биллинга и проверки платежей — без дашборда и ручной настройки.",
      primaryCta: "Документация MCP",
      primaryPath: "docs/mcp",
      configTitle: "Добавить в claude_desktop_config.json",
      configCode: `{
  "mcpServers": {
    "recv": {
      "command": "npx",
      "args": ["-y", "recv-mcp"],
      "env": {
        "RECV_API_KEY": "live_...",
        "RECV_ACCESS_TOKEN": "your_token"
      }
    }
  }
}`,
      toolsTitle: "12 инструментов агента",
      tools: [
        { name: "bootstrap_agent_workspace", desc: "Саморегистрация воркспейса, получение access token" },
        { name: "create_subscription_checkout", desc: "Покупка плана — merchant, developer или business" },
        { name: "get_checkout_invoice", desc: "Поллинг оплаты подписки до подтверждения" },
        { name: "get_account", desc: "Чтение воркспейса, плана и баланса" },
        { name: "create_invoice", desc: "Создание платежного инвойса на любой сети" },
        { name: "get_invoice", desc: "Получение статуса существующего инвойса" },
        { name: "list_invoices", desc: "Пагинация истории инвойсов" },
        { name: "simulate_payment", desc: "Тестовый платеж в sandbox-режиме" },
        { name: "create_api_key", desc: "Выдача скопированного API-ключа после активации плана" },
        { name: "create_webhook_endpoint", desc: "Регистрация HTTPS-эндпойнта для событий" },
        { name: "verify_webhook", desc: "Проверка HMAC-SHA256 подписи локально" },
        { name: "list_supported_networks", desc: "Список доступных блокчейн-сетей" },
      ],
    },
  },
} as const;

type CheckoutText = (typeof productContent)[Locale]["checkoutProduct"];
type ApiText = (typeof productContent)[Locale]["apiProduct"];
type InvoicingText = (typeof productContent)[Locale]["invoicingProduct"];
type McpText = (typeof productContent)[Locale]["mcpProduct"];
type ProductText = CheckoutText | ApiText | InvoicingText | McpText;

function localizedPath(language: Locale, path: string) {
  return `/${language}/${path}`;
}

function getProduct(copy: ReturnType<typeof getCopy>, variant: ProductVariant): ProductCopy {
  return copy.marketing[variant] as ProductCopy;
}

const GRADIENT_WORDS = new Set([
  "checkout",
  "api",
  "invoicing",
  "инвойсинг",
  "вебхуки",
  "webhooks",
  "recv",
  "usdt",
  "ton",
  "tron",
]);

function isGradientWord(raw: string) {
  const clean = raw.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()—]/g, "").toLowerCase();
  return GRADIENT_WORDS.has(clean);
}

export function ProductPageClient({ variant, language }: { variant: ProductVariant; language: "ru" | "en" }) {
  const fullCopy = getCopy(language);
  const product = getProduct(fullCopy, variant);
  const text = productContent[language][variant];
  const commonText = productContent[language];



  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": fullCopy.marketing.breadcrumbs.home,
        "item": `https://recv.money/${language}`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": fullCopy.marketing.breadcrumbs.products,
        "item": `https://recv.money/${language}/products`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.title,
        "item": `https://recv.money/${language}/products/${variant === "checkoutProduct" ? "checkout" : variant === "apiProduct" ? "api" : variant === "mcpProduct" ? "mcp" : "invoicing"}`
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
    "featureList": product.bento.items.map(i => i.title).join(", ")
  };

  return (
    <MarketingLayout language={language}>
      <JsonLd schema={breadcrumbSchema} />
      <JsonLd schema={applicationSchema} />

      {/* Hero Section */}
      <section className="lend-hero--centered relative overflow-hidden is-revealed">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none w-full h-full">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-radial-gradient from-accent/20 via-transparent to-transparent blur-[120px] opacity-40 animate-pulse" />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center max-w-4xl">
          <nav aria-label="Breadcrumb" className="lend-reveal--1 flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-white/30 mb-10">
            <Link href={`/${language}`} className="hover:text-accent transition-colors">{fullCopy.marketing.breadcrumbs.home}</Link>
            <span className="text-white/15">/</span>
            <Link href={`/${language}/products`} className="hover:text-accent transition-colors">{fullCopy.marketing.breadcrumbs.products}</Link>
            <span className="text-white/15">/</span>
            <span className="text-accent/70">{product.kicker}</span>
          </nav>

          <span className="lend-reveal--2 lend-section-kicker justify-center mx-auto">{product.kicker}</span>

          <h1 className="lend-reveal--2 !text-4xl md:!text-6xl lg:!text-7xl font-black tracking-tighter leading-[1.05] mb-8 text-white">
            {product.hero.title.split(" ").map((word, i) => (
              <span
                key={i}
                className={`inline-block mr-[0.22em] last:mr-0 transition-all duration-300 hover:scale-105 ${
                  isGradientWord(word)
                    ? "bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]"
                    : "text-white hover:text-white"
                }`}
              >
                {word}
              </span>
            ))}
          </h1>

          <p className="lend-reveal--3 !text-lg md:!text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-12">
            {product.hero.body}
          </p>

          <div className="lend-reveal--4 flex flex-col sm:flex-row items-center justify-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-70 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <PrimaryCta variant={variant} language={language} text={text} />
            </div>
            <SecondaryCtas variant={variant} language={language} text={text} />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 md:py-16" data-reveal>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lend-reveal--2">
            {product.stats.map((stat) => (
              <article
                key={stat.label}
                className="lend-card lend-spotlight-card group relative text-center flex flex-col items-center justify-center p-8 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <span className="relative z-10 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase mb-2 block">{stat.label}</span>
                <strong className="relative z-10 text-3xl md:text-4xl font-black text-white font-['Montserrat']">{stat.value}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-16 md:mb-24">
            <div className="lend-section-copy lend-reveal--1">
              <span className="lend-section-kicker justify-center mx-auto">{text.overviewTitle}</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mt-3 mb-6">{product.title}</h2>
              <p className="text-base md:text-lg text-white/55 leading-relaxed">{text.overviewBody}</p>
            </div>
          </div>
          <div className="lend-reveal--2">
            {variant === "checkoutProduct" && <CheckoutDetails text={text as CheckoutText} />}
            {variant === "apiProduct" && <ApiDetails text={text as ApiText} />}
            {variant === "invoicingProduct" && <InvoicingDetails text={text as InvoicingText} />}
            {variant === "mcpProduct" && <McpDetails text={text as McpText} />}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
            <span className="lend-section-kicker justify-center mx-auto">{product.comparison.title}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">
              {language === "ru" ? "Почему продукт нужен до выбора тарифа" : "Why this comes before pricing"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 lend-reveal--2">
            {product.comparison.items.map((item) => (
              <article
                key={item.legacy}
                className="lend-card lend-spotlight-card group relative flex flex-col md:flex-row gap-6 md:gap-12 p-8 md:p-10 transition-all duration-500 hover:scale-[1.005]"
              >
                <div className="lend-card-spotlight" />
                <div className="flex-1 relative z-10">
                  <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-2 block">{commonText.oldWay}</span>
                  <p className="text-base text-white/55 leading-relaxed italic">{item.legacy}</p>
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-white/[0.08] pt-6 md:pt-0 md:pl-12 relative z-10">
                  <span className="text-[10px] font-bold text-accent/80 uppercase tracking-widest mb-2 block">{commonText.recvWay}</span>
                  <p className="text-base text-white/80 leading-relaxed font-semibold">{item.recv}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-20 md:py-28 border-t border-white/[0.04]" data-reveal>
        <div className="container mx-auto px-6">
          <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
            <span className="lend-section-kicker justify-center mx-auto">{language === "ru" ? "ВОЗМОЖНОСТИ" : "CAPABILITIES"}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">{product.bento.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lend-reveal--2">
            {product.bento.items.map((item, index) => (
              <article
                key={item.title}
                className="lend-card lend-spotlight-card group relative p-8 flex flex-col min-h-[220px] transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-3xl font-black italic text-white/5 mb-4 block leading-none font-['Montserrat']">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-lg font-bold mb-3 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/75 transition-opacity">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {variant === "apiProduct" && <ApiCodeSection text={text as ApiText} />}
      {variant === "mcpProduct" && <McpConfigSection text={text as McpText} />}

      {/* Deep Dive Cards */}
      <section className="py-20 md:py-28" data-reveal>
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lend-reveal--2">
            {product.deepDive.map((item, index) => (
              <article
                key={item.title}
                className="lend-card lend-spotlight-card group relative p-8 flex flex-col transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="lend-card-spotlight" />
                <div className="relative z-10">
                  <span className="text-sm font-bold text-accent/60 mb-4 block">{String(index + 1).padStart(2, "0")}</span>
                  <h3 className="text-lg font-bold mb-4 group-hover:text-white transition-colors">{item.title}</h3>
                  <p className="text-sm text-white/55 leading-relaxed group-hover:text-white/75 transition-opacity">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden lend-spotlight-card group" data-reveal>
        <div className="lend-card-spotlight opacity-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-accent/15 rounded-full blur-[200px] opacity-25 pointer-events-none animate-pulse" />

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="lend-reveal--1 max-w-3xl mx-auto mb-12">
            <span className="lend-section-kicker justify-center mx-auto">{product.kicker}</span>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-[0.95] font-['Montserrat'] bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent mb-6">
              {product.finalTitle}
            </h2>
            <p className="text-base md:text-lg text-white/50 max-w-xl mx-auto leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          <div className="lend-reveal--2 flex flex-col sm:flex-row justify-center items-center gap-5">
            <div className="relative group/btn-wrap">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl blur-xl opacity-25 group-hover/btn-wrap:opacity-75 group-hover/btn-wrap:scale-110 transition-all duration-700" />
              <PrimaryCta variant={variant} language={language} text={text} />
            </div>
            <SecondaryCtas variant={variant} language={language} text={text} />
          </div>
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
      <Link className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center" href={checkoutText.primaryHref}>
        <span className="relative z-10 flex items-center justify-center gap-3">
          {checkoutText.primaryCta}
          <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
        </span>
      </Link>
    );
  }

  const planText = text as ApiText | InvoicingText | McpText;
  return (
    <Link className="lend-primary relative z-10 px-9 py-4 text-base min-w-[220px] rounded-2xl group/btn flex items-center justify-center" href={localizedPath(language, planText.primaryPath)}>
      <span className="relative z-10 flex items-center justify-center gap-3">
        {planText.primaryCta}
        <span className="group-hover/btn:translate-x-1.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">→</span>
      </span>
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
  if (variant === "invoicingProduct" || variant === "mcpProduct") return null;

  const secondaryText = text as CheckoutText | ApiText;
  return (
    <>
      <Link className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center" href={localizedPath(language, secondaryText.secondaryPath)}>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {secondaryText.secondaryCta}
        </span>
      </Link>
      <Link className="lend-secondary px-9 py-4 text-base min-w-[220px] rounded-2xl group/sec flex items-center justify-center" href={localizedPath(language, secondaryText.tertiaryPath)}>
        <span className="relative z-10 flex items-center justify-center gap-2">
          {secondaryText.tertiaryCta}
        </span>
      </Link>
    </>
  );
}

function CheckoutDetails({ text }: { text: CheckoutText }) {
  return (
    <div className="space-y-20">
      {/* Horizontal Flow */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/[0.06] hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
          {text.flow.map((step, index) => (
            <article key={step} className="text-center md:text-left group">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-accent/40 group-hover:bg-accent/[0.05] transition-all relative z-10 mx-auto md:mx-0">
                <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent font-['Montserrat']">{index + 1}</span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">{step}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto pt-10">
        {/* Payment States */}
        <div className="lend-card lend-spotlight-card group relative p-8 md:p-10 transition-all duration-500">
          <div className="lend-card-spotlight" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Zap size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white">{text.statusesTitle}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {text.statuses.map((status) => (
                <div key={status.label} className="flex gap-4 group/status">
                  <div className={`w-1 h-auto rounded-full group-hover/status:scale-y-110 transition-transform ${
                    status.tone === 'success' ? 'bg-green-500' : 
                    status.tone === 'danger' ? 'bg-red-500' : 
                    status.tone === 'warn' ? 'bg-orange-500' : 
                    status.tone === 'info' ? 'bg-blue-500' : 'bg-white/20'
                  }`} />
                  <div>
                    <h4 className="text-sm font-bold mb-1 text-white/90">{status.label}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{status.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiDetails({ text }: { text: ApiText }) {
  const icons = [Code2, Webhook, KeyRound, ShieldCheck, RefreshCw];

  return (
    <div className="space-y-20">
      {/* Horizontal Capabilities */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/[0.06] hidden md:block" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
          {text.capabilities.map((capability, index) => {
            const Icon = icons[index];
            return (
              <article key={capability.title} className="text-center md:text-left group">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 group-hover:border-accent/40 group-hover:bg-accent/[0.05] transition-all relative z-10 mx-auto md:mx-0">
                  <Icon size={24} className="text-accent group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-sm font-bold mb-2 text-white/90">{capability.title}</h3>
                <p className="text-xs text-white/55 leading-relaxed">{capability.body}</p>
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
    <div className="space-y-20">
      {/* Horizontal Lifecycle */}
      <div className="relative">
        <div className="absolute top-8 left-0 w-full h-px bg-white/[0.06] hidden lg:block" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
          {text.lifecycle.map((step, index) => (
            <article key={step} className="text-center lg:text-left group">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-xl font-bold mb-6 group-hover:border-accent/40 group-hover:bg-accent/[0.05] transition-all relative z-10 mx-auto lg:mx-0">
                <span className="bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent font-['Montserrat']">{index + 1}</span>
              </div>
              <p className="text-xs text-white/65 leading-relaxed font-medium">{step}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-10">
        <article className="lend-card lend-spotlight-card group relative p-8 border-white/10">
          <div className="lend-card-spotlight" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Link2 size={20} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">{text.linksTitle}</h3>
            </div>
            <ul className="space-y-4">
              {text.links.map((item) => (
                <li key={item} className="text-sm text-white/55 leading-relaxed flex gap-3 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </article>
        <article className="lend-card lend-spotlight-card group relative p-8 border-white/10">
          <div className="lend-card-spotlight" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Bell size={20} className="text-accent" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white">{text.telegramTitle}</h3>
            </div>
            <ul className="space-y-4">
              {text.notifications.map((item) => (
                <li key={item} className="text-sm text-white/55 leading-relaxed flex gap-3 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/40" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}

function ApiCodeSection({
  text,
}: {
  text: ApiText;
}) {
  return (
    <section className="py-20 md:py-28" data-reveal>
      <div className="container mx-auto px-6">
        <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
          <span className="lend-section-kicker justify-center mx-auto">API</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">{text.codeTitle}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lend-reveal--2">
          <article className="lend-card lend-spotlight-card group relative p-0 overflow-hidden border-white/10">
            <div className="lend-card-spotlight" />
            <div className="relative z-10">
              <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex justify-between items-center">
                 <span className="text-[10px] font-bold text-accent/80 uppercase tracking-widest">create invoice</span>
                 <span className="text-[10px] text-white/35">Node.js / Fetch</span>
              </div>
              <pre className="p-6 text-xs overflow-x-auto bg-black/10 font-mono text-white/80">
                <code>{text.invoiceCode}</code>
              </pre>
            </div>
          </article>
          <article className="lend-card lend-spotlight-card group relative p-0 overflow-hidden border-white/10">
            <div className="lend-card-spotlight" />
            <div className="relative z-10">
              <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex justify-between items-center">
                 <span className="text-[10px] font-bold text-accent/80 uppercase tracking-widest">verify webhook</span>
                 <span className="text-[10px] text-white/35">Express / Webhook</span>
              </div>
              <pre className="p-6 text-xs overflow-x-auto bg-black/10 font-mono text-white/80">
                <code>{text.webhookCode}</code>
              </pre>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function McpDetails({
  text,
}: {
  text: McpText;
}) {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto">
        <h3 className="text-xl font-bold tracking-tight text-white mb-2">{text.toolsTitle}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {text.tools.map((tool) => (
          <article
            key={tool.name}
            className="lend-card lend-spotlight-card group relative p-6 transition-all duration-500 hover:scale-[1.02] border-white/10"
          >
            <div className="lend-card-spotlight" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="font-mono text-xs text-accent font-bold mb-2 block">{tool.name}</span>
                <p className="text-xs text-white/55 leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function McpConfigSection({
  text,
}: {
  text: McpText;
}) {
  return (
    <section className="py-20 md:py-28" data-reveal>
      <div className="container mx-auto px-6">
        <div className="lend-section-copy text-center max-w-3xl mx-auto mb-16 lend-reveal--1 flex flex-col items-center">
          <span className="lend-section-kicker justify-center mx-auto">MCP CONFIG</span>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">{text.configTitle}</h2>
        </div>
        <div className="max-w-3xl mx-auto lend-reveal--2">
          <article className="lend-card lend-spotlight-card group relative p-0 overflow-hidden border-white/10">
            <div className="lend-card-spotlight" />
            <div className="relative z-10">
              <div className="bg-white/[0.03] px-5 py-3 border-b border-white/[0.06] flex justify-between items-center">
                 <span className="text-[10px] font-bold text-accent/80 uppercase tracking-widest">claude_desktop_config.json</span>
                 <span className="text-[10px] text-white/35">JSON Config</span>
              </div>
              <pre className="p-6 text-xs overflow-x-auto bg-black/10 font-mono text-white/80">
                <code>{text.configCode}</code>
              </pre>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
