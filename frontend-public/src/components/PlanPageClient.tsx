"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { useUI } from "./UIProvider";
import { JsonLd } from "./JsonLd";

export type Variant = "merchant" | "developer" | "business" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Консоль",
    discuss: "Обсудить условия",
    compareTitle: "Протокол",
    flowTitle: "Интеграция",
    priceTitle: "Доступ",
    priceSubtitle: "Неограниченный оборот. Фиксированная цена.",
    codeTitle: "Пример реализации",
    codeSubtitle: "Готов к продакшену за считанные минуты.",
    codeBody: "Бесшовная интеграция нашего протокола в ваш существующий рабочий процесс.",
    processingNote: "Мы используем non-custodial архитектуру. Все транзакции идут напрямую на ваши кошельки.",
    compareSectionTitle: "Архитектура прямого доступа",
    compareSectionBody: "Reqst работает как прозрачный программный слой (middleware). Транзакции идут напрямую от клиента к вам, минуя промежуточные счета. Мы лишь автоматизируем мониторинг через сеть высокопроизводительных нод.",
    merchant: {
      badge: "Reqst Merchant",
      title: "Принимайте криптоплатежи. 0% комиссии с оборота.",
      body: "Профессиональный дашборд для ручного и полуавтоматического приема платежей. Прямые выплаты на ваши кошельки и полный контроль над статусами инвойсов.",
      priceLabel: "39$",
      period: "в месяц",
      stats: [
        { value: "0%", label: "Fee" },
        { value: "100%", label: "Non-custodial" },
        { value: "Live", label: "Dashboard" },
        { value: "Basic", label: "Analytics" },
      ],
      features: [
        { title: "Unlimited Invoices", body: "Создавайте неограниченное количество счетов на любые суммы без дополнительных сборов." },
        { title: "Manual Override", body: "Возможность вручную подтвердить оплату в случае недоплаты или ошибки клиента." },
        { title: "Direct-to-Wallet", body: "Средства поступают напрямую от клиента на ваш адрес. Мы никогда не касаемся ваших денег." },
        { title: "Instant Alerts", body: "Мгновенные уведомления в Telegram о каждой новой транзакции." },
      ],
      flow: [
        { title: "Account Setup", body: "Быстрая регистрация через Telegram и добавление ваших реквизитов (TON, TRON, SOL, etc)." },
        { title: "Invoice Creation", body: "Генерация ссылки на оплату в пару кликов через удобный дашборд." },
        { title: "Real-time Tracking", body: "Отслеживание статуса платежа в блокчейне. Мы подтвердим транзакцию автоматически." },
      ],
      code: `// Manual Invoice Link
// https://reqst.xyz/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "Reqst Developer",
      title: "Инфраструктура криптоплатежей. Контроль в ваших руках.",
      body: "Профессиональный API и Webhook-уведомления для автоматизации вашего бизнеса. Прямые выплаты и полная свобода от комиссий с оборота.",
      priceLabel: "199$",
      period: "в месяц",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Гарантированная доставка уведомлений с автоматическими ретраями и HMAC подписью." },
        { title: "Real-time Monitoring", body: "Мониторинг транзакций в реальном времени. Обнаружение платежа происходит мгновенно." },
        { title: "Unified API v1", body: "Единый интерфейс для работы с 7+ сетями: TON, TRON, SOL, Base, Arbitrum и др." },
        { title: "Idempotency", body: "Встроенная защита от дублирования транзакций на уровне протокола API." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Генерация ключей rqst_live_. Управление правами доступа для интеграции в ваш бэкенд." },
        { title: "Webhook Config", body: "Настройка коллбэков с подписью HMAC-SHA256 для мгновенных уведомлений." },
        { title: "Automated Processing", body: "Наши вотчеры отслеживают транзакции 24/7, подтверждая платежи автоматически." },
      ],
      code: `// Create Invoice via Reqst API
const res = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: { "X-API-Key": "rqst_live_..." },
  body: JSON.stringify({
    title: "Order #99",
    base_amount_usd: "199.00",
    payable_network: "TON"
  })
});
const inv = await res.json();`
    },
    business: {
      badge: "Reqst Business",
      title: "Масштабируемый процессинг. Для растущих команд.",
      body: "Расширенные лимиты API, командный доступ и приоритетная поддержка для бизнеса с активным потоком платежей.",
      priceLabel: "499$",
      period: "в месяц",
      stats: [
        { value: "200k", label: "Requests/mo" },
        { value: "10", label: "Seats" },
        { value: "10", label: "Workspaces" },
        { value: "Priority", label: "Support" },
      ],
      features: [
        { title: "Advanced Analytics", body: "Глубокая аналитика платежей, конверсии и удержания клиентов по всем воркспейсам." },
        { title: "Team Collaboration", body: "Добавление до 10 участников в команду с гибким управлением ролями и правами." },
        { title: "Multi-Workspace", body: "Управление до 10 независимыми проектами в рамках одной подписки." },
        { title: "Extended Limits", body: "Повышенные квоты на запросы к API и количество активных вебхуков." },
      ],
      flow: [
        { title: "Team Onboarding", body: "Приглашение участников команды и распределение ролей для управления проектами." },
        { title: "Workspace Isolation", body: "Настройка независимых окружений для разных направлений вашего бизнеса." },
        { title: "Scale with Priority", body: "Работа с выделенными очередями мониторинга и приоритетной поддержкой 24/7." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Корпоративный стандарт. Инфраструктура без границ.",
      body: "Индивидуальные лимиты, SLA гарантии и персональная поддержка для крупнейших игроков рынка.",
      priceLabel: "Custom",
      period: "индивидуально",
      stats: [
        { value: "1M+", label: "Requests/mo" },
        { value: "∞", label: "Seats" },
        { value: "SLA", label: "Guarantee" },
        { value: "Dedicated", label: "Support" },
      ],
      features: [
        { title: "Custom Rate Limits", body: "Индивидуальная настройка пропускной способности API под ваши пиковые нагрузки." },
        { title: "SLA & B2B Contracts", body: "Юридические гарантии доступности сервиса и работа по официальным контрактам." },
        { title: "Dedicated Engineering", body: "Прямой канал связи с core-разработчиками для консультаций и быстрой помощи." },
        { title: "Onboarding Assist", body: "Персональный менеджер для помощи в интеграции и миграции с других решений." },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Анализ ваших потоков платежей и проектирование оптимальной архитектуры мониторинга." },
        { title: "Dedicated Provisioning", body: "Развертывание изолированной инфраструктуры для максимальной надежности." },
        { title: "Hyper-scale Support", body: "Запуск с неограниченными лимитами под прямым присмотром нашей команды." },
      ],
      code: `// Enterprise SLA Integration
// 99.9% Uptime Guarantee
// Dedicated monitoring nodes
// 24/7 Incident Response
// Custom Webhook retry logic`
    },
  },
  en: {
    back: "Back Home",
    auth: "Console",
    discuss: "Discuss Terms",
    compareTitle: "Protocol",
    flowTitle: "Integration",
    priceTitle: "Access",
    priceSubtitle: "Unlimited volume. Flat monthly fee.",
    codeTitle: "Implementation",
    codeSubtitle: "Ready for production in minutes.",
    codeBody: "Seamlessly integrate our protocol into your existing workflow.",
    processingNote: "Non-custodial architecture. All transactions go directly to your wallets.",
    compareSectionTitle: "Direct Access Architecture",
    compareSectionBody: "Reqst operates as a transparent middleware. Transactions flow directly from client to merchant, bypassing intermediary accounts.",
    merchant: {
      badge: "Reqst Merchant",
      title: "Accept Crypto. 0% Turnover Fees.",
      body: "Professional dashboard for manual and semi-automated payment acceptance. Direct payouts to your wallets and full control.",
      priceLabel: "$39",
      period: "per month",
      stats: [
        { value: "0%", label: "Fee" },
        { value: "100%", label: "Non-custodial" },
        { value: "Live", label: "Dashboard" },
        { value: "Basic", label: "Analytics" },
      ],
      features: [
        { title: "Unlimited Invoices", body: "Create unlimited payment links for any amount with no extra fees." },
        { title: "Manual Override", body: "Manually confirm payments in case of underpayments or client errors." },
        { title: "Direct-to-Wallet", body: "Funds go directly from client to your address. We never touch your money." },
        { title: "Instant Alerts", body: "Real-time Telegram notifications for every single transaction." },
      ],
      flow: [
        { title: "Account Setup", body: "Quick Telegram registration and adding your payout details." },
        { title: "Invoice Creation", body: "Generate payment links in a few clicks via our intuitive dashboard." },
        { title: "Real-time Tracking", body: "Live blockchain monitoring. We confirm transactions automatically." },
      ],
      code: `// Manual Invoice Link
// https://reqst.xyz/app/checkout/demo
// No code required for Merchant plan.
// Just share the link and get paid.`
    },
    developer: {
      badge: "Reqst Developer",
      title: "Payments Infrastructure. Control in Your Hands.",
      body: "Professional API and Webhooks for full business automation. Direct payouts and zero turnover commissions.",
      priceLabel: "$199",
      period: "per month",
      stats: [
        { value: "50k", label: "Requests/mo" },
        { value: "3", label: "Seats" },
        { value: "3", label: "Workspaces" },
        { value: "Standard", label: "Support" },
      ],
      features: [
        { title: "Webhook Delivery", body: "Guaranteed delivery with automated retries and HMAC signatures." },
        { title: "Real-time Monitoring", body: "Real-time transaction monitoring. Detect payments instantly." },
        { title: "Unified API v1", body: "A single interface for 7+ networks: TON, TRON, SOL, Base, and more." },
        { title: "Idempotency", body: "Built-in protection against duplicate transactions at the API level." },
      ],
      flow: [
        { title: "API Key Provisioning", body: "Generate rqst_live_ keys. Manage scopes for secure backend integration." },
        { title: "Webhook Config", body: "Set up HMAC-SHA256 signed callbacks for instant notifications." },
        { title: "Automated Processing", body: "Our watchers track transactions 24/7, confirming payments autonomously." },
      ],
      code: `// Create Invoice via Reqst API
const res = await fetch("https://api.reqst.xyz/v1/invoices", {
  method: "POST",
  headers: { "X-API-Key": "rqst_live_..." },
  body: JSON.stringify({
    title: "Order #99",
    base_amount_usd: "199.00",
    payable_network: "TON"
  })
});
const inv = await res.json();`
    },
    business: {
      badge: "Reqst Business",
      title: "Scalable Processing. For Growing Teams.",
      body: "Extended API limits, team access, and priority support for businesses with high payment volume.",
      priceLabel: "$499",
      period: "per month",
      stats: [
        { value: "200k", label: "Requests/mo" },
        { value: "10", label: "Seats" },
        { value: "10", label: "Workspaces" },
        { value: "Priority", label: "Support" },
      ],
      features: [
        { title: "Advanced Analytics", body: "In-depth insights into payments, conversion, and retention across workspaces." },
        { title: "Team Collaboration", body: "Add up to 10 members to your team with granular role management." },
        { title: "Multi-Workspace", body: "Manage up to 10 independent projects under a single subscription." },
        { title: "Extended Limits", body: "Higher API quotas and increased active webhook limits." },
      ],
      flow: [
        { title: "Team Onboarding", body: "Invite team members and assign roles to manage your projects." },
        { title: "Workspace Isolation", body: "Set up independent environments for different business lines." },
        { title: "Scale with Priority", body: "Work with dedicated monitoring queues and 24/7 priority support." },
      ],
      code: `// Multi-Workspace Management
// Manage up to 10 workspaces
// Isolated API keys and team seats
// Advanced Analytics enabled`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Corporate Standard. Infrastructure Without Limits.",
      body: "Custom limits, SLA guarantees, and dedicated support for major market players.",
      priceLabel: "Custom",
      period: "individual pricing",
      stats: [
        { value: "1M+", label: "Requests/mo" },
        { value: "∞", label: "Seats" },
        { value: "SLA", label: "Guarantee" },
        { value: "Dedicated", label: "Support" },
      ],
      features: [
        { title: "Custom Rate Limits", body: "Individually tailored API throughput for your peak loads." },
        { title: "SLA & B2B Contracts", body: "Legal uptime guarantees and official corporate contracting." },
        { title: "Dedicated Engineering", body: "Direct communication with core developers for consultation." },
        { title: "Onboarding Assist", body: "Personal manager for integration and migration assistance." },
      ],
      flow: [
        { title: "Infrastructure Audit", body: "Analyzing your payment flows to design the optimal monitoring architecture." },
        { title: "Dedicated Provisioning", body: "Deploying isolated infrastructure for maximum reliability." },
        { title: "Hyper-scale Support", body: "Launch with unlimited quotas under direct supervision of our team." },
      ],
      code: `// Enterprise SLA Integration
// 99.9% Uptime Guarantee
// Dedicated monitoring nodes
// 24/7 Incident Response
// Custom Webhook retry logic`
    },
  },
} as const;

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const product = text[variant];
  const reveal = useReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variant]);

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": product.badge,
    "operatingSystem": "Web",
    "applicationCategory": "BusinessApplication",
    "offers": {
      "@type": "Offer",
      "price": variant === "merchant" ? "39.00" : variant === "developer" ? "199.00" : variant === "business" ? "499.00" : "0.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <MarketingLayout language={language}>
        <JsonLd schema={applicationSchema} />
        <section className="lend-hero lend-hero--centered" ref={reveal}>
          <div className="lend-hero-copy">
            <span className="lend-section-kicker lend-reveal--1">{product.badge}</span>
            <h1 className="lend-reveal--2">{product.title}</h1>
            <p className="lend-reveal--3">{product.body}</p>

            <div className="lend-cta-row lend-reveal--4">
              {variant === "enterprise" ? (
                <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                  {text.discuss}
                </a>
              ) : (
                <Link className="lend-primary" href="/app/auth">
                  {language === "ru" ? "Активировать" : "Get Started"}
                </Link>
              )}
              <Link className="lend-secondary" href="/app/auth">
                {text.auth}
              </Link>
            </div>
          </div>
        </section>

        <section className="lend-split-section lend-plan-features" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2>{text.compareSectionTitle}</h2>
            <p>{text.compareSectionBody}</p>
            <div className="lend-stats-grid" style={{ marginTop: "2rem" }}>
                {product.stats.map((stat, i) => (
                  <article key={i} className={`lend-card lend-stat-card lend-reveal--${2 + i}`}>
                    <span className="lend-stat-label">{stat.label}</span>
                    <h3 className="lend-stat-value">{stat.value}</h3>
                  </article>
                ))}
            </div>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {product.features.map((feat, i) => (
              <article key={i} className={`lend-card lend-plan-feature-card lend-reveal--${2 + i}`}>
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section lend-code-section" ref={reveal}>
           <div className="lend-card lend-code-card lend-reveal--1">
              <div className="lend-code-grid">
                <div className="lend-reveal--2">
                  <span className="lend-section-kicker">{text.codeTitle}</span>
                  <h2>{text.codeSubtitle}</h2>
                  <p>{text.codeBody}</p>
                </div>
                <div className="lend-reveal--3 lend-code-block">
                  <pre>
                    <code>{product.code}</code>
                  </pre>
                </div>
              </div>
           </div>
        </section>

        <section className="lend-stacked-section lend-flow-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2>Seamless Flow</h2>
          </div>

          <div className="lend-flow-container">
            {product.flow.map((step, i) => (
              <article key={i} className={`lend-card lend-flow-card lend-reveal--${2 + i}`}>
                <div className="lend-flow-step-number">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                {i < 2 && <div className="lend-flow-arrow">→</div>}
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final lend-plan-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
          </div>
          <div className="lend-reveal--2">
            <h2 className="lend-price-value">{product.priceLabel}</h2>
          </div>
          <div className="lend-reveal--3">
            <p className="lend-price-period">{product.period}</p>
            <p className="lend-price-subtitle">{text.priceSubtitle}</p>
          </div>

          <div className="lend-cta-row lend-reveal--4">
            {variant === "enterprise" ? (
              <a className="lend-primary lend-price-btn" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                {text.discuss}
              </a>
            ) : (
              <Link className="lend-primary lend-price-btn" href="/app/auth">
                {language === "ru" ? "Активировать " : "Activate "} {product.badge}
              </Link>
            )}
          </div>
        </section>
    </MarketingLayout>
  );
}
