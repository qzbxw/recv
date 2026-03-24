import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Консоль",
    billing: "Связаться",
    discuss: "Обсудить условия",
    compareTitle: "Технологический стек",
    flowTitle: "Интеграция",
    priceTitle: "Доступ",
    codeTitle: "Пример реализации",
    processingNote: "Мы используем проприетарную не-кастодиальную архитектуру. Все транзакции проходят через ваши ноды или наши высокопроизводительные кластеры напрямую в блокчейн.",
    compareSectionTitle: "Техническое превосходство",
    compareSectionBody: "В отличие от кастодиальных решений, Reqst — это программный слой (middleware), который дает вам полный контроль над жизненным циклом транзакции, исключая риски блокировок и удержания средств третьими лицами.",
    dev: {
      badge: "Reqst Developer",
      title: "API-инфраструктура для хайлоад-проектов.",
      body: "Полный программный контроль над приемом криптоплатежей. Seller API 2.0, WebSocket-стримы и глубокая кастомизация логики чекаута под ваш стек.",
      priceLabel: "Индивидуально",
      period: "на базе ваших объемов",
      stats: [
        { value: "0ms", label: "задержка нотификаций" },
        { value: "100%", label: "Direct-to-Wallet" },
        { value: "Full", label: "Mempool Access" },
        { value: "∞", label: "Webhook Endpoints" },
      ],
      features: [
        {
          title: "Atomic Webhooks",
          body: "Гарантированная доставка (at-least-once) с автоматическими ретраями и подписью каждой посылки через Ed25519.",
        },
        {
          title: "Mempool Monitoring",
          body: "Отслеживание транзакций до момента включения в блок. Позволяет отображать статус «Платеж обнаружен» мгновенно.",
        },
        {
          title: "Typed SDK & OpenAPI",
          body: "Полная поддержка TypeScript, Go и Python. Сгенерированные клиенты для максимально быстрого старта разработки.",
        },
        {
          title: "Idempotency Keys",
          body: "Встроенная защита от дублирования инвойсов и повторных списаний на уровне API протокола.",
        },
      ],
      flow: [
        { title: "API Provisioning", body: "Генерация ключей с разграничением прав доступа (Read/Write/Admin)." },
        { title: "Logic Mapping", body: "Настройка коллбэков и метаданных для сквозной аналитики заказов." },
        { title: "Mainnet Sync", body: "Запуск процессинга в режиме реального времени с мониторингом состояния сети." },
      ],
      code: `// Create Invoice via Reqst API
const invoice = await reqst.invoices.create({
  amount: "149.00",
  currency: "USDT",
  network: "TRC20",
  orderId: "ref_9921",
  metadata: { userId: "user_1" },
  webhookUrl: "https://api.yoursite.com/hook"
});`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Корпоративный стандарт децентрализованных финансов.",
      body: "Инфраструктура для масштабируемых систем с повышенными требованиями к безопасности и производительности. Индивидуальные ноды и SLA 99.9%.",
      priceLabel: "Enterprise",
      period: "кастомное решение",
      stats: [
        { value: "SLA", label: "99.9% Uptime" },
        { value: "Dedicated", label: "RPC Clusters" },
        { value: "Unlimited", label: "Throughput" },
        { value: "24/7", label: "DevOps Support" },
      ],
      features: [
        {
          title: "Isolated Infrastructure",
          body: "Ваш трафик обрабатывается на выделенных кластерах нод, что исключает влияние других участников сети на скорость ваших транзакций.",
        },
        {
          title: "Custom Smart Contracts",
          body: "Возможность развертывания кастомной логики распределения средств (Split-payments) на уровне протокола.",
        },
        {
          title: "Advanced RBAC",
          body: "Ролевая модель доступа для больших команд: аудит-логи всех действий, ограничение по IP и двухфакторная защита API.",
        },
        {
          title: "Compliance-ready Logs",
          body: "Полная выгрузка данных для бухгалтерии и финансового мониторинга в форматах CSV/JSON/SQL.",
        },
      ],
      flow: [
        { title: "Architecture Design", body: "Проектирование инфраструктуры под ваши нагрузки и требования безопасности." },
        { title: "Deployment", body: "Развертывание выделенных ресурсов и миграция данных без простоя системы." },
        { title: "Continuous Support", body: "Персональный инженер в канале связи для оперативного решения любых задач." },
      ],
      code: `// Enterprise Bulk Settlement
const settlement = await reqst.payments.distribute({
  source: "main_vault",
  recipients: [
    { address: "0x...", share: "0.85" },
    { address: "0x...", share: "0.15" }
  ],
  strategy: "immediate_split"
});`
    },
  },
  en: {
    back: "Back to Home",
    auth: "Console",
    billing: "Contact",
    discuss: "Discuss Terms",
    compareTitle: "Tech Stack",
    flowTitle: "Integration",
    priceTitle: "Access",
    codeTitle: "Code Implementation",
    processingNote: "We use a proprietary non-custodial architecture. All transactions go through your nodes or our high-performance clusters directly to the blockchain.",
    compareSectionTitle: "Technical Superiority",
    compareSectionBody: "Unlike custodial solutions, Reqst is a software layer (middleware) that gives you total control over the transaction lifecycle, eliminating the risks of third-party freezes.",
    dev: {
      badge: "Reqst Developer",
      title: "API infrastructure for high-load projects.",
      body: "Full programmatic control over crypto payments. Seller API 2.0, WebSocket streams, and deep checkout logic customization for your stack.",
      priceLabel: "Custom",
      period: "based on your volume",
      stats: [
        { value: "0ms", label: "notification latency" },
        { value: "100%", label: "Direct-to-Wallet" },
        { value: "Full", label: "Mempool Access" },
        { value: "∞", label: "Webhook Endpoints" },
      ],
      features: [
        {
          title: "Atomic Webhooks",
          body: "Guaranteed delivery (at-least-once) with automatic retries and Ed25519 payload signing.",
        },
        {
          title: "Mempool Monitoring",
          body: "Track transactions before they hit the block. Show 'Payment Detected' status instantly.",
        },
        {
          title: "Typed SDK & OpenAPI",
          body: "Full support for TypeScript, Go, and Python. Generated clients for the fastest possible dev start.",
        },
        {
          title: "Idempotency Keys",
          body: "Built-in protection against duplicate invoices and double-spending at the protocol level.",
        },
      ],
      flow: [
        { title: "API Provisioning", body: "Generate keys with granular permissions (Read/Write/Admin)." },
        { title: "Logic Mapping", body: "Configure callbacks and metadata for end-to-end order analytics." },
        { title: "Mainnet Sync", body: "Launch real-time processing with network state monitoring." },
      ],
      code: `// Create Invoice via Reqst API
const invoice = await reqst.invoices.create({
  amount: "149.00",
  currency: "USDT",
  network: "TRC20",
  orderId: "ref_9921",
  metadata: { userId: "user_1" },
  webhookUrl: "https://api.yoursite.com/hook"
});`
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "Corporate standard for decentralized finance.",
      body: "Infrastructure for scalable systems with high security and performance requirements. Dedicated nodes and 99.9% SLA.",
      priceLabel: "Enterprise",
      period: "custom solution",
      stats: [
        { value: "SLA", label: "99.9% Uptime" },
        { value: "Dedicated", label: "RPC Clusters" },
        { value: "Unlimited", label: "Throughput" },
        { value: "24/7", label: "DevOps Support" },
      ],
      features: [
        {
          title: "Isolated Infrastructure",
          body: "Your traffic is processed on dedicated node clusters, ensuring no 'noisy neighbor' effects on transaction speed.",
        },
        {
          title: "Custom Smart Contracts",
          body: "Deploy custom fund distribution logic (Split-payments) directly at the protocol level.",
        },
        {
          title: "Advanced RBAC",
          body: "Role-based access for large teams: full audit logs, IP whitelisting, and 2FA API protection.",
        },
        {
          title: "Compliance-ready Logs",
          body: "Full data exports for accounting and financial monitoring in CSV/JSON/SQL formats.",
        },
      ],
      flow: [
        { title: "Architecture Design", body: "Design infrastructure tailored to your load and security requirements." },
        { title: "Deployment", body: "Deploy dedicated resources and migrate data with zero downtime." },
        { title: "Continuous Support", body: "Personal engineer in your communication channel for rapid task resolution." },
      ],
      code: `// Enterprise Bulk Settlement
const settlement = await reqst.payments.distribute({
  source: "main_vault",
  recipients: [
    { address: "0x...", share: "0.85" },
    { address: "0x...", share: "0.15" }
  ],
  strategy: "immediate_split"
});`
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
            <p className="lend-reveal--2" style={{ color: '#f7f0e7', opacity: 0.8 }}>{product.body}</p>

            <div className="lend-cta-row lend-reveal--3">
              <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer">
                {text.discuss}
              </a>
              <Link className="lend-secondary" to="/auth">
                {text.auth}
              </Link>
            </div>
            
            <div className="lend-architecture-card lend-reveal--4" style={{ marginTop: '2.5rem', minHeight: 'auto', borderLeft: '4px solid var(--accent)', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ color: 'var(--accent)' }}>DEVELOPER-FIRST STACK</span>
              <p style={{ fontSize: '0.9rem', color: '#afbac4', marginTop: '0.5rem' }}>{text.processingNote}</p>
            </div>
          </div>

          <aside className="lend-hero-side lend-reveal--3">
            <div className="lend-overview-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {product.stats.map((stat, i) => (
                <article key={i} className="lend-card" style={{ padding: '1.8rem 1.2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.2em' }}>{stat.label}</span>
                  <h3 style={{ fontSize: '2.2rem', margin: '0.6rem 0', color: '#f7f0e7', fontFamily: 'Space Grotesk' }}>{stat.value}</h3>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="lend-split-section" ref={reveal} style={{ marginTop: '4rem' }}>
          <div className="lend-section-copy lend-reveal--1" style={{ background: 'transparent', border: 'none', paddingLeft: 0 }}>
            <span className="lend-section-kicker">{text.compareTitle}</span>
            <h2 style={{ fontSize: '3rem', marginTop: '1rem' }}>{text.compareSectionTitle}</h2>
            <p style={{ fontSize: '1.15rem', lineHeight: '1.8' }}>{text.compareSectionBody}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            {product.features.map((feat, i) => (
              <article key={i} className="lend-card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', color: 'var(--accent)' }}>{feat.title}</h3>
                <p style={{ fontSize: '0.98rem', opacity: 0.8, lineHeight: '1.6' }}>{feat.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-stacked-section" ref={reveal} style={{ margin: '6rem 0' }}>
           <div className="lend-card lend-reveal--1" style={{ padding: '3rem', background: '#0a0d12', borderColor: 'rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'center' }}>
                <div>
                  <span className="lend-section-kicker">{text.codeTitle}</span>
                  <h2 style={{ fontSize: '2.5rem', margin: '1.5rem 0' }}>Ready for production in minutes.</h2>
                  <p style={{ color: '#afbac4', fontSize: '1.1rem' }}>
                    Seamlessly integrate our protocol into your existing workflow using our high-performance API.
                  </p>
                </div>
                <div style={{ background: '#010409', borderRadius: '16px', padding: '1.5rem', border: '1px solid #30363d', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                  <pre style={{ margin: 0, color: '#79c0ff', fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace', lineHeight: '1.6' }}>
                    <code>{product.code}</code>
                  </pre>
                </div>
              </div>
           </div>
        </section>

        <section className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1" style={{ textAlign: 'center', background: 'transparent', border: 'none' }}>
            <span className="lend-section-kicker">{text.flowTitle}</span>
            <h2 style={{ fontSize: '3.2rem' }}>Seamless Integration Flow</h2>
          </div>

          <div className="lend-timeline lend-reveal--2" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {product.flow.map((step, i) => (
              <article key={i} className="lend-step" style={{ padding: '2.5rem 2rem', borderBottom: 'none', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <strong style={{ fontSize: '1.8rem', opacity: 0.1, color: 'var(--accent)' }}>{String(i + 1).padStart(2, '0')}</strong>
                <h3 style={{ fontSize: '1.4rem', marginTop: '0.8rem' }}>{step.title}</h3>
                <p style={{ marginTop: '0.8rem', fontSize: '1rem', color: '#afbac4' }}>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-final" ref={reveal} style={{ padding: '6rem 2rem', background: 'radial-gradient(circle at center, rgba(255, 148, 77, 0.08), transparent 70%)', marginTop: '4rem' }}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{text.priceTitle}</span>
            <h2 style={{ fontSize: '5.5rem', margin: '1.5rem 0', letterSpacing: '-0.04em', fontFamily: 'Space Grotesk' }}>{product.priceLabel}</h2>
            <p style={{ fontSize: '1.5rem', opacity: 0.6, marginBottom: '3.5rem' }}>{product.period}</p>

            <div className="lend-cta-row" style={{ justifyContent: 'center' }}>
              <a className="lend-primary" href="https://t.me/kynexq" target="_blank" rel="noopener noreferrer" style={{ padding: '1.5rem 4rem', fontSize: '1.25rem', borderRadius: '18px' }}>
                {text.discuss}
              </a>
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
