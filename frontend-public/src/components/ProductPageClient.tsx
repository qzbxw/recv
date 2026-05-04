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
} from "lucide-react";
import { MarketingLayout, useReveal } from "./marketing/MarketingLayout";
import { useUI } from "./UIProvider";
import { JsonLd } from "./JsonLd";
import { getCopy, Locale } from "@/i18n";

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
      overviewTitle: "Жизненный цикл инвойса",
      overviewBody:
        "Reqst Invoicing - это рабочий процесс мерчанта для создания, отправки и закрытия профессиональных крипто-счетов до того, как покупатель попадет на тарифную страницу.",
      primaryCta: "Активировать Merchant",
      primaryPath: "merchant",
      lifecycle: [
        "Черновик счета",
        "Публичная checkout-ссылка",
        "Ожидание оплаты",
        "Детекция перевода",
        "Ручная проверка при необходимости",
        "Оплачен и заархивирован",
      ],
      dashboardTitle: "Дашборд и ручное подтверждение",
      dashboardRows: [
        { id: "INV-1042", client: "Northwind Studio", state: "Paid", amount: "420 USDT" },
        { id: "INV-1043", client: "Arcade Labs", state: "Underpaid", amount: "116 / 120 USDT" },
        { id: "INV-1044", client: "Solo Founder", state: "Awaiting", amount: "89 USDT" },
      ],
      linksTitle: "Публичные checkout-ссылки",
      links: [
        "Hosted-страницы для каждого счета",
        "Бренд и описание под конкретный запрос",
        "QR и адресная механика как в Checkout",
      ],
      telegramTitle: "Telegram-уведомления",
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

  const applicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.title,
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <MarketingLayout language={language}>
      <JsonLd schema={applicationSchema} />

      <section className="product-hero" ref={reveal}>
        <div className="product-hero__copy">
          <span className="lend-section-kicker lend-reveal--1">{product.kicker}</span>
          <h1 className="lend-reveal--2">{product.hero.title}</h1>
          <p className="lend-reveal--3">{product.hero.body}</p>
          <div className="lend-cta-row lend-reveal--4">
            <PrimaryCta variant={variant} language={language} text={text} />
            <SecondaryCtas variant={variant} language={language} text={text} />
          </div>
        </div>

        <div className="product-hero__surface lend-reveal--3" aria-hidden="true">
          {variant === "checkoutProduct" && <CheckoutSurface language={language} />}
          {variant === "apiProduct" && <ApiSurface language={language} />}
          {variant === "invoicingProduct" && <InvoicingSurface language={language} />}
        </div>
      </section>

      <section className="product-stats" ref={reveal}>
        {product.stats.map((stat, index) => (
          <article key={stat.label} className={`product-stat lend-reveal--${index + 1}`}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="product-section product-section--split" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1">
          <span className="lend-section-kicker">{text.overviewTitle}</span>
          <h2>{product.title}</h2>
          <p>{text.overviewBody}</p>
        </div>
        <div className="product-flow lend-reveal--2">
          {variant === "checkoutProduct" && <CheckoutDetails text={text as CheckoutText} />}
          {variant === "apiProduct" && <ApiDetails text={text as ApiText} />}
          {variant === "invoicingProduct" && <InvoicingDetails text={text as InvoicingText} />}
        </div>
      </section>

      <section className="product-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1 product-section__center">
          <span className="lend-section-kicker">{product.comparison.title}</span>
          <h2>{language === "ru" ? "Почему продукт нужен до выбора тарифа" : "Why this comes before pricing"}</h2>
        </div>
        <div className="product-compare lend-reveal--2">
          {product.comparison.items.map((item) => (
            <article key={item.legacy} className="product-compare__row">
              <div>
                <span>{commonText.oldWay}</span>
                <p>{item.legacy}</p>
              </div>
              <div>
                <span>{commonText.reqstWay}</span>
                <p>{item.reqst}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="product-section" ref={reveal}>
        <div className="lend-section-copy lend-reveal--1 product-section__center">
          <span className="lend-section-kicker">{language === "ru" ? "ВОЗМОЖНОСТИ" : "CAPABILITIES"}</span>
          <h2>{product.bento.title}</h2>
        </div>
        <div className="product-capability-grid lend-reveal--2">
          {product.bento.items.map((item, index) => (
            <article key={item.title} className="product-capability">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {variant === "apiProduct" && <ApiCodeSection text={text as ApiText} reveal={reveal} />}

      <section className="product-section" ref={reveal}>
        <div className="product-deep-dive">
          {product.deepDive.map((item, index) => (
            <article key={item.title} className={`product-deep-card lend-reveal--${index + 1}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lend-final product-final" ref={reveal}>
        <span className="lend-section-kicker lend-reveal--1">{product.kicker}</span>
        <h2 className="lend-reveal--2">
          {language === "ru" ? "Теперь можно выбирать тариф осознанно" : "Now pricing has context"}
        </h2>
        <p className="lend-reveal--3">{product.description}</p>
        <div className="lend-cta-row lend-reveal--4">
          <PrimaryCta variant={variant} language={language} text={text} />
          <SecondaryCtas variant={variant} language={language} text={text} />
        </div>
      </section>

      <section className="product-seo" ref={reveal}>
        <p className="lend-reveal--1">{product.seo}</p>
      </section>
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

function CheckoutSurface({ language }: { language: Locale }) {
  const isRu = language === "ru";

  return (
    <div className="checkout-surface">
      <div className="checkout-surface__top">
        <span>REQST-CHECKOUT</span>
        <b>{isRu ? "Awaiting payment" : "Awaiting payment"}</b>
      </div>
      <div className="checkout-surface__amount">
        <span>{isRu ? "К оплате" : "Pay"}</span>
        <strong>149.00 USDT</strong>
      </div>
      <div className="checkout-surface__main">
        <div className="checkout-qr">
          <div className="lend-demo-qr-grid" />
        </div>
        <div className="checkout-address">
          <span>TRON USDT</span>
          <code>TQDt...n4V7</code>
          <button type="button">
            <Copy size={15} />
            {isRu ? "Копировать" : "Copy"}
          </button>
        </div>
      </div>
      <div className="checkout-status-rail">
        {["Awaiting", "Detected", "Underpaid", "Paid", "Expired"].map((status, index) => (
          <span key={status} className={index === 0 ? "is-active" : ""}>
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

function ApiSurface({ language }: { language: Locale }) {
  const isRu = language === "ru";

  return (
    <div className="api-surface">
      <div className="api-surface__header">
        <TerminalSquare size={18} />
        <span>{isRu ? "Создание инвойса" : "Create invoice"}</span>
      </div>
      <pre>{`POST /v1/invoices
Idempotency-Key: order_9841

201 Created
{
  "status": "awaiting_payment",
  "checkout_url": "https://reqst.xyz/c/..."
}`}</pre>
      <div className="api-surface__event">
        <Webhook size={17} />
        <div>
          <b>invoice.paid</b>
          <span>HMAC-SHA256 verified</span>
        </div>
      </div>
    </div>
  );
}

function InvoicingSurface({ language }: { language: Locale }) {
  const isRu = language === "ru";

  return (
    <div className="invoice-surface">
      <div className="invoice-surface__header">
        <FileText size={18} />
        <span>{isRu ? "Merchant dashboard" : "Merchant dashboard"}</span>
      </div>
      {[
        ["INV-1042", "Paid", "420 USDT"],
        ["INV-1043", "Underpaid", "116 / 120 USDT"],
        ["INV-1044", "Awaiting", "89 USDT"],
      ].map(([id, state, amount]) => (
        <div key={id} className="invoice-row">
          <span>{id}</span>
          <b className={`invoice-state invoice-state--${state.toLowerCase()}`}>{state}</b>
          <strong>{amount}</strong>
        </div>
      ))}
      <div className="invoice-surface__telegram">
        <Bell size={16} />
        <span>{isRu ? "Telegram: платеж обнаружен" : "Telegram: payment detected"}</span>
      </div>
    </div>
  );
}

function CheckoutDetails({ text }: { text: CheckoutText }) {
  return (
    <>
      <div className="product-flow__steps">
        {text.flow.map((step, index) => (
          <article key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </article>
        ))}
      </div>

      <div className="product-detail-card">
        <div className="product-detail-card__title">
          <QrCode size={18} />
          <h3>{text.networksTitle}</h3>
        </div>
        <div className="product-network-list">
          {text.networks.map((network) => (
            <span key={network}>{network}</span>
          ))}
        </div>
        <code>{text.address}</code>
        <p>{text.qrCaption}</p>
      </div>

      <div className="product-status-grid">
        <h3>{text.statusesTitle}</h3>
        {text.statuses.map((status) => (
          <article key={status.label} className={`product-status product-status--${status.tone}`}>
            <span>{status.label}</span>
            <p>{status.body}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function ApiDetails({ text }: { text: ApiText }) {
  const icons = [Code2, Webhook, KeyRound, ShieldCheck, RefreshCw];

  return (
    <div className="product-api-grid">
      {text.capabilities.map((capability, index) => {
        const Icon = icons[index];
        return (
          <article key={capability.title} className="product-detail-card">
            <div className="product-detail-card__title">
              <Icon size={18} />
              <h3>{capability.title}</h3>
            </div>
            <p>{capability.body}</p>
          </article>
        );
      })}
    </div>
  );
}

function InvoicingDetails({ text }: { text: InvoicingText }) {
  return (
    <>
      <div className="product-flow__steps product-flow__steps--compact">
        {text.lifecycle.map((step, index) => (
          <article key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </article>
        ))}
      </div>

      <div className="product-detail-card">
        <div className="product-detail-card__title">
          <WalletCards size={18} />
          <h3>{text.dashboardTitle}</h3>
        </div>
        <div className="invoice-mini-table">
          {text.dashboardRows.map((row) => (
            <div key={row.id}>
              <span>{row.id}</span>
              <b>{row.state}</b>
              <strong>{row.amount}</strong>
            </div>
          ))}
        </div>
        <button type="button" className="product-inline-button">
          <CheckCircle2 size={16} />
          Manual confirm
        </button>
      </div>

      <div className="product-detail-pair">
        <article className="product-detail-card">
          <div className="product-detail-card__title">
            <Link2 size={18} />
            <h3>{text.linksTitle}</h3>
          </div>
          {text.links.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </article>
        <article className="product-detail-card">
          <div className="product-detail-card__title">
            <Bell size={18} />
            <h3>{text.telegramTitle}</h3>
          </div>
          {text.notifications.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </article>
      </div>
    </>
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
    <section className="product-section product-code-section" ref={reveal}>
      <div className="lend-section-copy lend-reveal--1">
        <span className="lend-section-kicker">API</span>
        <h2>{text.codeTitle}</h2>
      </div>
      <div className="product-code-grid lend-reveal--2">
        <article>
          <span>create invoice</span>
          <pre>
            <code>{text.invoiceCode}</code>
          </pre>
        </article>
        <article>
          <span>verify webhook</span>
          <pre>
            <code>{text.webhookCode}</code>
          </pre>
        </article>
      </div>
    </section>
  );
}
