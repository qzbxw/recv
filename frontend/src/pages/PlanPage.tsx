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
      title: "Плотный API-слой для команд, которые встраивают приём крипты в свой продукт.",
      body: "Reqst Dev закрывает рабочий контур без переписки с продажниками: создаёте оплату, активируете доступ, выпускаете ключи, подключаете уведомления и сразу встраиваете выставление инвойсов в свой сервис.",
      price: "149 USDT / 30 дней",
      bullets: ["До 3 активных ключей", "До 50 000 запросов в месяц", "До 90 запросов в минуту на ключ", "Уведомления и управление из одной панели"],
      stats: [
        { value: "3", label: "активных ключа" },
        { value: "50k", label: "запросов в месяц" },
        { value: "90 rpm", label: "лимит на ключ" },
      ],
      sections: [
        {
          title: "Для продуктовых команд",
          body: "Подходит, когда нужно не просто принимать оплату вручную, а встроить инвойсы в свой личный кабинет, SaaS или внутреннюю админку.",
        },
        {
          title: "Быстрый запуск",
          body: "Доступ активируется через обычную оплату внутри Reqst, без согласований, длинных анкет и ожидания ответа от sales.",
        },
        {
          title: "Нормальный операционный контур",
          body: "Ключи, квоты, лимиты, ссылки на оплату и точки уведомлений находятся в одном кабинете и не расползаются по разным сервисам.",
        },
      ],
      flow: [
        "Заходите в кабинет и создаёте оплату за план.",
        "После подтверждения платежа доступ к API открывается автоматически.",
        "Выпускаете ключ, подключаете адрес уведомлений и начинаете создавать инвойсы из своего продукта.",
      ],
      fit: [
        "Сервисам с подпиской, где нужно автоматически выставлять инвойсы клиентам.",
        "Командам, которые хотят связать оплату, статусы и свои внутренние процессы.",
        "Интеграторам, которым нужен готовый слой приёма крипты без своего блокчейн-мониторинга.",
      ],
      faq: [
        {
          question: "Нужен ли отдельный договор или созвон?",
          answer: "Нет. Это самостоятельный план: оплатили, получили доступ, начали работу.",
        },
        {
          question: "Куда приходят деньги клиентов?",
          answer: "Сразу на ваш адрес. Reqst не хранит средства и не удерживает расчёты у себя.",
        },
        {
          question: "Что есть кроме самих запросов к API?",
          answer: "Управление ключами, лимитами, уведомлениями и всеми связанными оплатами остаётся в том же кабинете.",
        },
      ],
      tone: "План для запуска интеграции без лишней бюрократии.",
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Строгий B2B-контур для команд, которым уже тесно в обычном API-плане.",
      body: "Reqst Enterprise нужен там, где больше потоков, больше ключей, больше внутренних сервисов и выше требования к предсказуемости. Тот же прямой приём оплаты на ваши кошельки, но с более широкими лимитами и более уверенной рабочей схемой.",
      price: "499 USDT / 30 дней",
      bullets: ["До 20 активных ключей", "До 500 000 запросов в месяц", "До 600 запросов в минуту на ключ", "Приоритетный контур уведомлений и сопровождения"],
      stats: [
        { value: "20", label: "активных ключей" },
        { value: "500k", label: "запросов в месяц" },
        { value: "600 rpm", label: "лимит на ключ" },
      ],
      sections: [
        {
          title: "Для высокой нагрузки",
          body: "Подходит, когда инвойсы создаются из нескольких сервисов сразу, а история оплат и статусы нужны в стабильном потоке без ручного контроля.",
        },
        {
          title: "Для командной работы",
          body: "Если у вас несколько направлений, разные окружения или несколько продуктов, запас по ключам и лимитам перестаёт быть мелочью и становится реальной рабочей потребностью.",
        },
        {
          title: "Для операционной устойчивости",
          body: "Более широкий лимит, усиленный маршрут уведомлений и приоритетная обработка нужны там, где сбой в оплатах уже влияет на выручку, поддержку и клиентский опыт.",
        },
      ],
      flow: [
        "Создаёте оплату за Enterprise прямо внутри Reqst.",
        "После оплаты кабинет автоматически получает расширенные лимиты и доступ к полному набору инструментов.",
        "Разводите ключи по окружениям, сервисам и продуктам без постоянной борьбы за остаток квот.",
      ],
      fit: [
        "Платформам с большим числом оплат и несколькими внутренними сервисами.",
        "Командам, которым нужно разделять доступы между продом, тестом и разными направлениями.",
        "Проектам, где уведомления и подтверждение статусов уже критичны для ежедневной операционки.",
      ],
      faq: [
        {
          question: "Это уже кастомная продажа через отдел продаж?",
          answer: "Нет. Страница остаётся self-serve: вы сами активируете план через оплату внутри Reqst.",
        },
        {
          question: "Чем Enterprise отличается на практике?",
          answer: "Главное отличие не в названии, а в запасе по лимитам, числу ключей и устойчивости контура для большой команды.",
        },
        {
          question: "Это подходит только для очень больших компаний?",
          answer: "Нет. План нужен не по размеру бренда, а по реальной сложности процессов и объёму нагрузки.",
        },
      ],
      tone: "План для зрелой команды, где оплата уже часть критичной инфраструктуры.",
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
    <main className={`plan-page plan-page--${variant}`}>
      <div className="plan-page__glow plan-page__glow--left" />
      <div className="plan-page__glow plan-page__glow--right" />

      <header className="plan-page__topbar">
        <Link className="lend-brand" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="plan-page__topbar-links">
          <Link className="lend-nav-link" to="/">
            {text.back}
          </Link>
          <Link className="lend-nav-link" to="/auth">
            {text.auth}
          </Link>
        </div>
      </header>

      <section className="plan-page__hero">
        <div className="plan-page__copy">
          <span className="plan-page__badge">{product.badge}</span>
          <h1>{product.title}</h1>
          <p>{product.body}</p>
          <p className="plan-page__tone">{product.tone}</p>

          <div className="plan-page__stats">
            {product.stats.map((item) => (
              <article key={item.label} className="plan-page__stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>

          <strong className="plan-page__price">{product.price}</strong>

          <div className="plan-page__actions">
            <Link className="lend-primary" to={`/console?plan=${variant}`}>
              {text.billing}
            </Link>
            <Link className="lend-secondary" to="/console">
              {text.console}
            </Link>
          </div>
        </div>

        <div className="plan-page__card">
          {product.bullets.map((bullet) => (
            <article key={bullet} className="plan-page__bullet">
              <span />
              <p>{bullet}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-page__section">
        <div className="plan-page__section-heading">
          <span className="plan-page__badge">{text.compareTitle}</span>
          <h2>{variant === "enterprise" ? "Где Enterprise даёт запас" : "Что вы получаете сразу"}</h2>
        </div>
        <div className="plan-page__grid">
          {product.sections.map((section) => (
            <article key={section.title} className="plan-page__panel">
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="plan-page__section plan-page__section--split">
        <article className="plan-page__panel">
          <span className="plan-page__eyebrow">{text.flowTitle}</span>
          <div className="plan-page__stack">
            {product.flow.map((item, index) => (
              <article key={item} className="plan-page__timeline">
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                <p>{item}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="plan-page__panel">
          <span className="plan-page__eyebrow">{text.fitTitle}</span>
          <div className="plan-page__fit-list">
            {product.fit.map((item) => (
              <article key={item} className="plan-page__fit-item">
                <span />
                <p>{item}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="plan-page__section">
        <div className="plan-page__section-heading">
          <span className="plan-page__badge">{text.faqTitle}</span>
          <h2>{variant === "enterprise" ? "Без витрины ради витрины, только по делу" : "Ответы перед запуском интеграции"}</h2>
        </div>
        <div className="plan-page__faq-grid">
          {product.faq.map((item) => (
            <article key={item.question} className="plan-page__panel plan-page__panel--faq">
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
