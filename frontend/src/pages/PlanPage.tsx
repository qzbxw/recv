import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Консоль",
    billing: "Выбрать тариф",
    compareTitle: "Преимущества",
    flowTitle: "Как начать",
    priceTitle: "Тариф",
    processingNote: "Для обработки платежей за подписки мы используем собственную инфраструктуру. Никаких внешних сервисов — только прямой процессинг Reqst.",
    compareSectionTitle: "В чем отличие Reqst?",
    compareSectionBody: "В отличие от кастодиальных шлюзов (например, Cryptomus), Reqst никогда не удерживает ваши средства. Все платежи поступают напрямую (Direct-to-Wallet). Вы полностью контролируете свои приватные ключи и ликвидность.",
    dev: {
      badge: "Reqst Dev",
      title: "API-интеграция для технологичных продуктов.",
      body: "Доступ к Seller API, Webhooks и управлению ключами. Оптимальное решение для SaaS, маркетплейсов и автоматизации внутренних процессов.",
      price: "149 USDT",
      period: "30 дней",
      stats: [
        { value: "3", label: "активных API-ключа" },
        { value: "50k", label: "запросов в месяц" },
        { value: "90 rpm", label: "RPM (лимит в минуту)" },
      ],
      features: [
        {
          title: "Public API 2.0",
          body: "Программное создание инвойсов и управление заказами.",
        },
        {
          title: "Webhooks",
          body: "Мгновенные уведомления о статусах оплаты в вашу систему.",
        },
        {
          title: "Developer Portal",
          body: "Единая панель для мониторинга лимитов, квот и логов уведомлений.",
        },
      ],
      flow: [
        { title: "Биллинг", body: "Создайте инвойс на оплату тарифа в один клик." },
        { title: "Настройка", body: "Укажите ваши API-ключи и Webhook URL в панели управления." },
        { title: "Запуск", body: "Начните принимать автоматические платежи через API в режиме реального времени." },
      ],
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B-инфраструктура для масштабируемого бизнеса.",
      body: "Решение для высоких нагрузок. Расширенные квоты, приоритетная доставка уведомлений и поддержка командного доступа.",
      price: "499 USDT",
      period: "30 дней",
      stats: [
        { value: "20", label: "ключей" },
        { value: "500k", label: "запросов/мес" },
        { value: "600 rpm", label: "лимит на ключ" },
      ],
      features: [
        {
          title: "High-Load Ready",
          body: "Выделенные ресурсы для обработки транзакций без задержек.",
        },
        {
          title: "Team Access",
          body: "Управление доступом для разработчиков и бухгалтерии проекта.",
        },
        {
          title: "Advanced Webhooks",
          body: "Кастомные эндпоинты, расширенная аналитика и история событий.",
        },
      ],
      flow: [
        { title: "Активация", body: "Выберите Enterprise-план и оплатите его через нашу систему." },
        { title: "Масштабирование", body: "Повышенные лимиты и новые функции станут доступны мгновенно." },
        { title: "Сопровождение", body: "Получите доступ к приоритетной линии технической поддержки." },
      ],
    },
  },
  en: {
    back: "Back to Home",
    auth: "Console",
    billing: "Choose Plan",
    compareTitle: "Features",
    flowTitle: "How it Works",
    priceTitle: "Pricing",
    processingNote: "We use our own non-custodial infrastructure for subscription processing. No third-party gateways — just the Reqst protocol.",
    compareSectionTitle: "The Reqst Advantage",
    compareSectionBody: "Unlike custodial gateways (e.g., Cryptomus), Reqst never holds your funds. All payments are Direct-to-Wallet. You own your keys and control your liquidity at all times.",
    dev: {
      badge: "Reqst Dev",
      title: "API integration for scaling products.",
      body: "Full access to Seller API, webhooks, and key management. Perfect for SaaS platforms, marketplaces, and internal automation tools.",
      price: "149 USDT",
      period: "30 days",
      stats: [
        { value: "3", label: "active API keys" },
        { value: "50k", label: "requests per month" },
        { value: "90 rpm", label: "RPM (rate limit)" },
      ],
      features: [
        {
          title: "Public API 2.0",
          body: "Programmatic invoice creation and order management.",
        },
        {
          title: "Webhooks",
          body: "Instant payment status notifications for your system.",
        },
        {
          title: "Dashboard",
          body: "Unified panel for monitoring limits and quotas.",
        },
      ],
      flow: [
        { title: "Billing", body: "Generate a billing checkout link in one click." },
        { title: "Payment", body: "Pay via Reqst Checkout in your preferred network." },
        { title: "Access", body: "API features unlock instantly upon confirmation." },
      ],
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B infrastructure for high-performance scale.",
      body: "Built for scale. Expanded limits, priority notification delivery, and team collaboration features.",
      price: "499 USDT",
      period: "30 days",
      stats: [
        { value: "20", label: "api keys" },
        { value: "500k", label: "req/month" },
        { value: "600 rpm", label: "limit per key" },
      ],
      features: [
        {
          title: "High-Load Ready",
          body: "Dedicated resources for zero-latency transaction processing.",
        },
        {
          title: "Team Access",
          body: "Role-based management for devs and finance teams.",
        },
        {
          title: "Advanced Logic",
          body: "Extended analytics and custom webhook endpoints.",
        },
      ],
      flow: [
        { title: "Activation", body: "Select Enterprise and generate your payment link." },
        { title: "Processing", body: "Our system confirms the transfer within seconds." },
        { title: "Scale", body: "Limits update immediately across your account." },
      ],
    },
  },
} as const;


function useReveal() {
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

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const product = text[variant];
  const reveal = useReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    window.scrollTo(0, 0);
  }, [variant]);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" to="/">
              <strong>reqst</strong>
            </Link>

            <div className="lend-topbar-actions">
              <Link className="lend-secondary" to="/">{text.back}</Link>
              <Link className="lend-primary" to="/auth">{text.auth}</Link>
            </div>
          </div>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <span className="lend-section-kicker lend-reveal--1">{product.badge}</span>
            <h1 className="lend-reveal--2">{product.title}</h1>
            <p className="lend-reveal--2">{product.body}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" to={`/console?plan=${variant}`}>
                {text.billing}
              </Link>
              <Link className="lend-secondary" to="/auth">
                {text.auth}
              </Link>
            </div>
            
            <div className="lend-architecture-card lend-reveal--4" style={{ marginTop: '2rem', minHeight: 'auto' }}>
              <span>PROUDLY POWERED BY REQST</span>
              <p style={{ fontSize: '0.9rem' }}>{text.processingNote}</p>
            </div>

            <div className="lend-card lend-reveal--4" style={{ marginTop: '1rem', borderStyle: 'dashed' }}>
              <span className="lend-section-kicker">{text.compareSectionTitle}</span>
              <p style={{ fontSize: '0.95rem', marginTop: '0.8rem' }}>{text.compareSectionBody}</p>
            </div>
          </div>

          <aside className="lend-hero-side lend-reveal--3">
            <div className="lend-overview-grid" style={{ gridTemplateColumns: '1fr' }}>
              {product.stats.map((stat, i) => (
                <article key={i} className="lend-card">
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{stat.label}</span>
                  <h3 style={{ fontSize: '2.4rem', margin: '0.2rem 0' }}>{stat.value}</h3>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="lend-split-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2>Лимиты и возможности</h2>
            <p>Всё необходимое для глубокой интеграции в ваш бизнес-процесс.</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2" style={{ gridTemplateColumns: '1fr' }}>
            {product.features.map((feat, i) => (
              <article key={i} className="lend-card">
                <h3>{feat.title}</h3>
                <p>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1" style={{ textAlign: 'center' }}>
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2>Как это работает</h2>
          </div>

          <div className="lend-timeline lend-reveal--2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {product.flow.map((step, i) => (
              <article key={i} className="lend-step">
                <strong>{String(i + 1).padStart(2, '0')}</strong>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
            <h2 style={{ fontSize: '5rem' }}>{product.price}</h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.8, marginBottom: '2rem' }}>за {product.period}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to={`/console?plan=${variant}`} style={{ padding: '1.2rem 2.4rem', fontSize: '1.1rem' }}>
                {text.billing}
              </Link>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/dev">API</Link>
            <Link to="/enterprise">B2B</Link>
            <Link to="/auth">Console</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

