import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Войти в Reqst",
    console: "Открыть консоль",
    billing: "Открыть оплату",
    compareTitle: "Что входит",
    flowTitle: "Как это работает",
    fitTitle: "Кому подойдёт",
    faqTitle: "Частые вопросы",
    dev: {
      badge: "Reqst Dev",
      title: "API-интеграция для продуктовых команд.",
      body: "Self-serve решение для быстрого запуска приема крипто-платежей. Мгновенная активация доступа, выпуск ключей и настройка вебхуков без участия sales-отдела.",
      price: "149 USDT / 30 дней",
      bullets: ["До 3 активных ключей", "До 50 000 запросов в месяц", "До 90 запросов в минуту на ключ", "Единая панель управления нагрузкой"],
      stats: [
        { value: "3", label: "активных ключа" },
        { value: "50k", label: "запросов в месяц" },
        { value: "90 rpm", label: "лимит на ключ" },
      ],
      sections: [
        {
          title: "Продуктовые команды",
          body: "Решение для глубокой интеграции в личные кабинеты, SaaS-платформы или внутренние админ-панели.",
        },
        {
          title: "Мгновенный старт",
          body: "Активация доступа происходит автоматически после оплаты инвойса внутри Reqst. Никаких анкет и долгих согласований.",
        },
        {
          title: "Единый рабочий контур",
          body: "Ключи, квоты, лимиты, биллинг и точки уведомлений собраны в одном интерфейсе управления.",
        },
      ],
      flow: [
        "Авторизация в кабинете и создание инвойса за план.",
        "Автоматическое открытие доступа после подтверждения платежа.",
        "Выпуск API-ключа и настройка адреса для вебхуков.",
      ],
      fit: [
        "Сервисы по подписке, требующие автоматизации выставления счетов.",
        "Команды, интегрирующие статус оплаты в логику своего продукта.",
        "Интеграторы, которым нужен надежный блокчейн-мониторинг без разработки своего решения.",
      ],
      faq: [
        {
          question: "Нужен ли договор или звонок с sales-отделом?",
          answer: "Нет. План активируется самостоятельно через интерфейс Reqst.",
        },
        {
          question: "Где хранятся средства клиентов?",
          answer: "Средства поступают напрямую на ваши реквизиты. Reqst не участвует в расчетах и не удерживает балансы.",
        },
        {
          question: "Какие инструменты доступны кроме API?",
          answer: "Управление лимитами, отслеживание нагрузки, настройка точек доставки уведомлений и мониторинг связанных оплат.",
        },
      ],
      tone: "Эффективный запуск интеграции без бюрократии.",
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Инфраструктурный уровень для масштабирования.",
      body: "Решение для высокой нагрузки и командной работы. Расширенные лимиты, приоритетная доставка уведомлений и полный контроль операционного контура.",
      price: "499 USDT / 30 дней",
      bullets: ["До 20 активных ключей", "До 500 000 запросов в месяц", "До 600 запросов в минуту на ключ", "Приоритетный контур доставки и поддержки"],
      stats: [
        { value: "20", label: "активных ключей" },
        { value: "500k", label: "запросов в месяц" },
        { value: "600 rpm", label: "лимит на ключ" },
      ],
      sections: [
        {
          title: "Высокая нагрузка",
          body: "Поддержка стабильного потока инвойсов и автоматических обновлений статусов в реальном времени.",
        },
        {
          title: "Разделение окружений",
          body: "Запас по ключам позволяет изолировать продакшн, стейджинг и различные продуктовые направления.",
        },
        {
          title: "Операционная устойчивость",
          body: "Широкие лимиты и приоритетная обработка для критичных бизнес-процессов, где важна скорость каждой транзакции.",
        },
      ],
      flow: [
        "Активация Enterprise плана через штатный биллинг Reqst.",
        "Мгновенное обновление лимитов и открытие доступа к полному функционалу.",
        "Распределение ключей по сервисам и настройка приоритетных эндпоинтов.",
      ],
      fit: [
        "Платформы с большим объемом ежедневных транзакций.",
        "Команды с необходимостью разделения доступов между отделами или продуктами.",
        "Проекты, в которых скорость доставки вебхуков критична для работы сервиса.",
      ],
      faq: [
        {
          question: "Это кастомное решение через отдел продаж?",
          answer: "Нет. Это по-прежнему self-serve план с автоматической активацией через оплату.",
        },
        {
          question: "В чем главное преимущество перед Dev-планом?",
          answer: "В повышенной устойчивости контура, расширенном запасе квот и приоритетной обработке событий.",
        },
        {
          question: "Подходит ли план для небольших команд?",
          answer: "Да, если сложность внутренних процессов или объем трафика требуют повышенной стабильности.",
        },
      ],
      tone: "Решение для команд, где платежи — критическая часть инфраструктуры.",
    },
  },
  en: {
    back: "Back home",
    auth: "Sign in to Reqst",
    console: "Open console",
    billing: "Open billing",
    compareTitle: "What is included",
    flowTitle: "How it works",
    fitTitle: "Who it fits",
    faqTitle: "Common questions",
    dev: {
      badge: "Reqst Dev",
      title: "A compact API layer for teams that need crypto payments inside their product.",
      body: "Reqst Dev gives product teams a self-serve path: activate the plan, issue keys, connect delivery endpoints, and start generating invoices from your own app.",
      price: "149 USDT / 30 days",
      bullets: ["Up to 3 active keys", "Up to 50,000 requests per month", "Up to 90 requests per minute per key", "Usage controls and delivery endpoints in one console"],
      stats: [
        { value: "3", label: "active keys" },
        { value: "50k", label: "monthly requests" },
        { value: "90 rpm", label: "per-key limit" },
      ],
      sections: [
        {
          title: "Built for product teams",
          body: "Useful when invoice creation needs to live inside your own dashboard, subscription flow, or internal tooling.",
        },
        {
          title: "Fast activation",
          body: "The plan is activated through a normal Reqst billing flow, without manual sales steps.",
        },
        {
          title: "One operating surface",
          body: "Keys, limits, invoice billing links, and event delivery live in one place.",
        },
      ],
      flow: [
        "Sign in and create a billing checkout.",
        "After payment confirmation, API access is enabled automatically.",
        "Create a key, connect endpoints, and start issuing invoices from your product.",
      ],
      fit: [
        "Subscription services that need automated invoice creation.",
        "Teams connecting payment status to internal product logic.",
        "Integrators who want a ready crypto payment layer without building blockchain monitoring.",
      ],
      faq: [
        {
          question: "Do I need a contract or a call?",
          answer: "No. It is a self-serve plan with direct activation.",
        },
        {
          question: "Where do customer funds go?",
          answer: "Directly to your wallet. Reqst does not custody balances.",
        },
        {
          question: "What comes with the API access?",
          answer: "Key management, usage visibility, delivery endpoints, and billing links live in the same console.",
        },
      ],
      tone: "A plan for launching integrations without extra process overhead.",
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "A stricter B2B operating layer for teams that have outgrown a basic API plan.",
      body: "Reqst Enterprise is for higher load, more internal services, and stronger delivery expectations. It keeps the same direct-to-wallet payment model, but adds wider limits and a steadier operating setup.",
      price: "499 USDT / 30 days",
      bullets: ["Up to 20 active keys", "Up to 500,000 requests per month", "Up to 600 requests per minute per key", "Priority delivery and support path"],
      stats: [
        { value: "20", label: "active keys" },
        { value: "500k", label: "monthly requests" },
        { value: "600 rpm", label: "per-key limit" },
      ],
      sections: [
        {
          title: "For high-load systems",
          body: "Useful when invoices are generated across several services and status updates need to move cleanly through your stack.",
        },
        {
          title: "For multi-team setups",
          body: "When multiple products, environments, or teams share the same billing surface, the headroom on keys and limits becomes operationally important.",
        },
        {
          title: "For steadier operations",
          body: "A broader limit profile and priority delivery path matter when payment events affect revenue, support, and daily operations.",
        },
      ],
      flow: [
        "Create an Enterprise billing checkout inside Reqst.",
        "After payment confirmation, expanded limits are enabled automatically.",
        "Split keys across environments and services without constantly managing around caps.",
      ],
      fit: [
        "Platforms with larger payment volume and multiple backend services.",
        "Teams that separate prod, staging, and different product lines.",
        "Projects where payment status delivery is critical to daily operations.",
      ],
      faq: [
        {
          question: "Is this a custom sales-only plan?",
          answer: "No. It still uses a self-serve activation flow inside Reqst.",
        },
        {
          question: "What changes in practice?",
          answer: "The main difference is more room on limits, more keys, and a stronger operating profile for larger teams.",
        },
        {
          question: "Is it only for very large companies?",
          answer: "No. It is for teams with higher operational complexity, not just bigger brand size.",
        },
      ],
      tone: "A plan for mature teams where payments are part of critical infrastructure.",
    },
  },
} as const;

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const product = text[variant];

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <Link className="topbar-brand topbar-brand--minimal" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="topbar-actions">
          <Link className="ghost-button compact-button" to="/">
            {text.back}
          </Link>
          <Link className="lend-primary" to="/auth">
            {text.auth}
          </Link>
        </div>
      </header>

      <div className="checkout-flow" style={{ marginTop: "1.5rem" }}>
        <section className="checkout-story">
          <article className="checkout-card checkout-card--lux">
            <div className="receipt-hero">
              <div className="receipt-copy">
                <div className="receipt-brandline">
                  <span>Reqst Protocol</span>
                </div>
                <div className="receipt-heading">
                  <span className={`checkout-badge checkout-badge--${variant}`}>{product.badge}</span>
                  <span className="status-pill receipt-status">Active Layer</span>
                </div>
                <h1>{product.title}</h1>
                <p className="hero-copy">{product.body}</p>
                <div className="receipt-docmeta">
                  <div>
                    <span>Type</span>
                    <strong>SaaS Integration</strong>
                  </div>
                  <div>
                    <span>SLA</span>
                    <strong>99.9% Delivery</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="plan-page__stats" style={{ marginTop: "2rem", gridTemplateColumns: "repeat(3, 1fr)" }}>
              {product.stats.map((item) => (
                <div key={item.label} className="metric-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="plan-page__actions" style={{ marginTop: "2rem" }}>
              <Link className="lend-primary lend-primary--large" style={{ width: "100%", textAlign: "center" }} to={`/console?plan=${variant}`}>
                {text.billing}
              </Link>
              <Link className="lend-secondary" style={{ width: "100%", textAlign: "center", marginTop: "0.5rem" }} to="/console">
                {text.console}
              </Link>
            </div>
          </article>

          <section className="payment-sheet payment-sheet--receipt">
            <div className="payment-sheet-header">
              <span className="payment-sheet-kicker">{text.compareTitle}</span>
            </div>
            <div className="payment-essentials">
              {product.sections.map((section) => (
                <div key={section.title} className="payment-field">
                  <div>
                    <label>{section.title}</label>
                    <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>{section.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="payment-rail">
          <div className="amount-totem amount-totem--receipt amount-totem--rail">
            <span>{language === "ru" ? "Стоимость" : "Price"}</span>
            <strong style={{ fontSize: "2.4rem" }}>{product.price.split(" / ")[0]}</strong>
            <div className="network-badge">
              <b>{product.price.split(" / ")[1]}</b>
              <small>{language === "ru" ? "период доступа" : "access period"}</small>
            </div>
          </div>

          <article className="checkout-card checkout-card--lux" style={{ padding: "1.25rem" }}>
            <span className="receipt-brandline" style={{ marginBottom: "1rem" }}>{text.flowTitle}</span>
            <div className="plan-page__stack">
              {product.flow.map((item, index) => (
                <div key={item} className="detail-row" style={{ marginBottom: "0.75rem", background: "transparent" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <strong style={{ color: "var(--accent)" }}>{String(index + 1).padStart(2, "0")}</strong>
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="checkout-card checkout-card--lux" style={{ padding: "1.25rem" }}>
            <span className="receipt-brandline" style={{ marginBottom: "1rem" }}>{text.fitTitle}</span>
            <div className="plan-page__fit-list">
              {product.fit.map((item) => (
                <div key={item} className="detail-row" style={{ marginBottom: "0.5rem", background: "transparent", border: "0", padding: "0" }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent)", marginTop: "0.6rem", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>{item}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <section className="plan-page__section" style={{ marginTop: "3rem" }}>
        <div className="plan-page__section-heading">
          <span className="eyebrow">{text.faqTitle}</span>
          <h2>{variant === "enterprise" ? "Protocol FAQ" : "Integration FAQ"}</h2>
        </div>
        <div className="plan-page__faq-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {product.faq.map((item) => (
            <article key={item.question} className="console-link-card">
              <span>Question</span>
              <strong style={{ fontSize: "1.1rem", marginBottom: "0.5rem", display: "block" }}>{item.question}</strong>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

