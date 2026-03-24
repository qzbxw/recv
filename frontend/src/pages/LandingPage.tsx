import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    nav: {
      overview: "О продукте",
      capabilities: "Технологии",
      networks: "Сети",
      faq: "FAQ",
      bot: "Telegram-бот",
      console: "Вход",
    },
    hero: {
      title: "Принимайте крипто-платежи без посредников.",
      body:
        "Автоматизированный прием криптовалюты напрямую на ваши кошельки. Полный контроль, мгновенные уведомления и честная модель без комиссий с оборота.",
      subcopy:
        "Non-custodial решение для бизнеса. Ваши деньги — только на ваших адресах.",
      primary: "Начать работу",
      secondary: "Открыть в Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% комиссии", "Ready-to-use API", "B2B решение"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Демонстрация оплаты",
      body: "Посмотрите, как выглядит процесс оплаты для вашего клиента: от выбора сети до моментального подтверждения транзакции.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Ожидает оплату",
      primary: "Открыть чекаут",
      secondary: "Вход в консоль",
      helper: "Идеально для демонстрации продукта, обучения команды и первого знакомства.",
      chips: ["TON", "TRON", "Base", "Live status"],
    },
    overview: {
      kicker: "ОБЗОР",
      title: "Профессиональный прием платежей.",
      body:
        "Reqst превращает прямые переводы в структурированный бизнес-процесс. Забудьте о ручной сверке транзакций и бесконечных скриншотах в чатах.",
      cards: [
        {
          title: "Для бизнеса",
          body: "Единый хаб для управления инвойсами, аналитикой и доступом команды.",
        },
        {
          title: "Для клиентов",
          body: "Бесшовный процесс оплаты в пару кликов с мгновенным подтверждением.",
        },
        {
          title: "Для разработчиков",
          body: "Чистый API и вебхуки для глубокой интеграции в любой ваш продукт.",
        },
      ],
    },
    capabilities: {
      kicker: "ТЕХНОЛОГИИ",
      title: "Инфраструктура для вашего роста.",
      body: "Все необходимые инструменты для работы с крипто-платежами в одной платформе.",
      items: [
        {
          kicker: "01",
          title: "Прямые выплаты",
          body: "Средства поступают сразу на ваш кошелек. Мы не удерживаем ваши деньги ни на секунду.",
        },
        {
          kicker: "02",
          title: "Мульти-сети",
          body: "Поддержка TON, TRON, Solana и всех популярных EVM-сетей из коробки.",
        },
        {
          kicker: "03",
          title: "Интеллектуальный мониторинг",
          body: "Система автоматически распознает частичную оплату, переплаты и переводы в неверных сетях.",
        },
        {
          kicker: "04",
          title: "Telegram Native",
          body: "Выставляйте счета и следите за продажами прямо в любимом мессенджере.",
        },
        {
          kicker: "05",
          title: "Модель фиксированной подписки",
          body: "Никаких процентов с вашего оборота. Платите только за использование сервиса, а не за свой успех.",
        },
        {
          kicker: "06",
          title: "B2B-решения",
          body: "Готовность к высоким нагрузкам и командной работе над проектами.",
        },
      ],
    },
    compare: {
      kicker: "ЭВОЛЮЦИЯ",
      title: "Забудьте про ручной поиск транзакций.",
      body: "Как меняется работа с платежами после перехода на Reqst.",
      rows: [
        {
          legacy: "Ручной поиск транзакций в эксплорере и ожидание скриншотов.",
          reqst: "Автоматическое подтверждение и мгновенные Webhook-уведомления.",
        },
        {
          legacy: "Ошибки клиентов: не та сеть, неверная сумма, отсутствие комментария.",
          reqst: "Четкие инструкции, QR-коды и автоматическая обработка ошибок.",
        },
        {
          legacy: "Комиссии платежных шлюзов, съедающие до 10% вашей прибыли.",
          reqst: "Прозрачная подписка без скрытых платежей и сборов с транзакций.",
        },
      ],
    },
    networks: {
      kicker: "СЕТИ",
      title: "Работайте там, где ваши клиенты.",
      body: "Мы поддерживаем самые ликвидные и удобные сети для ваших платежей.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Лучший выбор для интеграции с Telegram и работы с TON-кошельками.",
        },
        {
          name: "TRON",
          title: "TRON",
          body: "Классика стейблкоинов с низкими комиссиями и высокой скоростью.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Ультра-быстрые транзакции для тех, кто ценит скорость и минимальные издержки.",
        },
        {
          name: "EVM",
          title: "L2 & Ethereum",
          body: "Base, Arbitrum, BSC и другие сети — принимайте платежи как удобно.",
        },
      ],
      soon: {
        title: "В разработке",
        api: "Public API 2.0",
        b2b: "Team Access",
        body: "Мы постоянно расширяем возможности для крупного бизнеса и командной работы.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Ответы на вопросы.",
      body: "Коротко о том, как устроены продажи, биллинг и API внутри Reqst.",
      items: [
        {
          question: "Reqst хранит мои деньги или приватные ключи?",
          answer: "Нет. Reqst — это non-custodial сервис. Покупатель переводит средства напрямую на ваш кошелек. Мы лишь обеспечиваем интерфейс оплаты, мониторинг блокчейна и уведомления о статусе платежа.",
        },
        {
          question: "Какие тарифы доступны?",
          answer: "PRO covers the core seller flow. Reqst Dev adds API keys, webhooks, and developer-facing integration tools. Reqst Enterprise pushes the same model further with higher limits, more keys, and a stronger B2B operating setup.",
        },
        {
          question: "Как оплатить PRO, Dev или Enterprise?",
          answer: "Через обычные Reqst checkout links. Мы используем собственную инфраструктуру для процессинга всех платежей за подписки. Никаких внешних шлюзов, только наш протокол. Вы создаете billing checkout внутри сервиса, оплачиваете его, и план активируется автоматически.",
        },
        {
          question: "Доступны ли API и вебхуки?",
          answer: "Да. В Reqst Dev и Reqst Enterprise доступны API-ключи, Seller API для создания и чтения инвойсов, управление лимитами и Webhook-эндпоинты для событий оплаты и активации подписки.",
        },
        {
          question: "Какие сети отслеживаются автоматически?",
          answer: "На данный момент Reqst автоматически отслеживает TON, TRON, Solana и EVM-сети (Ethereum, Base, Arbitrum, BSC). Для каждой сети мы используем наиболее надежные методы индексации транзакций.",
        },
        {
          question: "Что если клиент отправил неверную сумму или не в ту сеть?",
          answer: "Система автоматически подтверждает корректные платежи. Если клиент отправил неверную сумму или совершил платеж слишком поздно, транзакция будет помечена соответствующим статусом в консоли для вашего решения.",
        },
      ],
    },
    final: {
      kicker: "ЗАПУСК",
      title: "Готовы автоматизировать свои продажи?",
      body:
        "Присоединяйтесь к продавцам, которые уже перевели свой прием крипты на профессиональный уровень.",
      primary: "Создать первый инвойс",
      secondary: "Документация",
    },
    footer: {
      title: "reqst",
      body: "Автоматизация крипто-платежей с прямыми выплатами на ваш кошелек. Честно, быстро, профессионально.",
      product: "Продукт",
      privacy: "Конфиденциальность",
      terms: "Условия",
      console: "Консоль",
      status: "Роадмап",
      api: "API",
      b2b: "B2B",
    },
  },
  en: {
    nav: {
      overview: "Product",
      capabilities: "Technology",
      networks: "Networks",
      faq: "FAQ",
      bot: "Bot",
      console: "Login",
    },
    hero: {
      title: "Accept crypto payments directly to your wallet.",
      body:
        "Automate checkout, transaction tracking, and notifications. Full control, zero middlemen, and a fair flat-fee model with no percentage-based charges.",
      subcopy:
        "Non-custodial infrastructure for business. Your money, your keys, your control.",
      primary: "Get Started",
      secondary: "Open in Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "0% Fee", "Ready-to-use API", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "live demo",
      title: "Demo Checkout",
      body: "Experience the flow as your customer: from network selection to instant transaction confirmation.",
      amount: "149 USDT",
      invoice: "REQST-DEMO-149",
      status: "Awaiting payment",
      primary: "Open Checkout",
      secondary: "Open Console",
      helper: "Perfect for demos, onboarding, and a strong first product impression.",
      chips: ["TON", "TRON", "Base", "Live status"],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Professional Payment Processing.",
      body:
        "Reqst turns chaotic wallet transfers into a transparent business process. No more manual verification or endless screenshots from clients.",
      cards: [
        {
          title: "For Business",
          body: "A unified hub for managing invoices, analytics, and team access.",
        },
        {
          title: "For Clients",
          body: "A seamless payment flow in just a few clicks with instant confirmation.",
        },
        {
          title: "For Developers",
          body: "Clean API and webhooks for deep integration into any product.",
        },
      ],
    },
    capabilities: {
      kicker: "TECHNOLOGY",
      title: "Infrastructure built to scale.",
      body: "All the tools you need to handle crypto payments in one platform.",
      items: [
        {
          kicker: "01",
          title: "Direct Payouts",
          body: "Funds never touch our platform. They go straight from the customer to your designated address.",
        },
        {
          kicker: "02",
          title: "Multi-Network",
          body: "Support for TON, TRON, Solana, and all major EVM chains out of the box.",
        },
        {
          kicker: "03",
          title: "Intelligent Monitoring",
          body: "Automated detection of partial payments, overpayments, and transfers in wrong networks.",
        },
        {
          kicker: "04",
          title: "Telegram Native",
          body: "Issue invoices and track sales directly in your favorite messenger.",
        },
        {
          kicker: "05",
          title: "Flat Pricing",
          body: "Stop paying percentage fees on your turnover. One transparent subscription, no matter how much you process.",
        },
        {
          kicker: "06",
          title: "B2B Ready",
          body: "Built for high loads and collaborative team workflows.",
        },
      ],
    },
    compare: {
      kicker: "EVOLUTION",
      title: "Stop chasing transactions manually.",
      body: "How your workflow changes after switching to Reqst.",
      rows: [
        {
          legacy: "Manual explorer checks and waiting for payment screenshots.",
          reqst: "Automated confirmation and instant Webhook notifications.",
        },
        {
          legacy: "Customer errors: wrong network, incorrect amount, missing comment.",
          reqst: "Clear instructions, QR codes, and automated error handling.",
        },
        {
          legacy: "Hidden gateway fees eating up to 10% of your profit.",
          reqst: "Transparent subscription with no hidden charges or transaction taxes.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Be where your customers are.",
      body: "We support the most liquid and convenient networks for your payments.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Best choice for Telegram integration and TON ecosystem users.",
        },
        {
          name: "TRON",
          title: "TRON",
          body: "The stablecoin classic with low fees and high reliability.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Ultra-fast transactions for those who value speed and minimal costs.",
        },
        {
          name: "EVM",
          title: "L2 & Ethereum",
          body: "Base, Arbitrum, BSC, and more — accept payments your way.",
        },
      ],
      soon: {
        title: "In Progress",
        api: "Public API 2.0",
        b2b: "Team Access",
        body: "We are constantly expanding features for enterprise and team collaboration.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Frequently Asked Questions.",
      body: "A quick overview of how billing, payouts, and the Dev API work inside Reqst.",
      items: [
        {
          question: "Does Reqst custody funds or private keys?",
          answer: "No. Reqst is non-custodial: the buyer pays directly to your payout wallet, while the service handles checkout UX, blockchain monitoring, and status updates.",
        },
        {
          question: "What plans are available?",
          answer: "Reqst PRO covers the core seller flow. Reqst Dev adds API keys, webhooks, and developer-facing integration tools. Reqst Enterprise pushes the same model further with higher limits, more keys, and a stronger B2B operating setup.",
        },
        {
          question: "How do I pay for PRO, Dev, or Enterprise?",
          answer: "Through normal Reqst checkout links. We use our own infrastructure to process every subscription payment. No external gateways — just our protocol in action.",
        },
        {
          question: "Is there an API and webhook layer available?",
          answer: "Yes. Reqst Dev and Reqst Enterprise include API keys, a Seller API for invoice management, usage caps, and webhook endpoints for payment events.",
        },
        {
          question: "Which networks are monitored automatically?",
          answer: "Reqst currently auto-monitors TON, TRON, Solana, and the EVM family including Ethereum, Base, Arbitrum, and BSC. We use the most reliable indexing methods per network.",
        },
        {
          question: "What if the buyer sends the wrong amount or uses the wrong network?",
          answer: "Clean matches are confirmed automatically. If the user sends an incorrect amount or pays too late, the transaction is flagged in the console for your review.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Ready to automate your sales?",
      body:
        "Join sellers who have already professionalized their crypto intake.",
      primary: "Create First Invoice",
      secondary: "Documentation",
    },
    footer: {
      title: "reqst",
      body: "Automated crypto payments with direct-to-wallet payouts. Fair, fast, professional.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
      status: "Roadmap",
      api: "API",
      b2b: "B2B",
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

export function LandingPage() {
  const { language, setLanguage } = useUI();
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);
  const reveal = useReveal();

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

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
              <div className="lend-language" role="group" aria-label="language switcher">
                <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>RU</button>
                <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button>
              </div>
              <Link className="lend-primary" to="/auth">{copy.nav.console}</Link>
            </div>
          </div>

          <nav className="lend-topnav">
            <a className="lend-nav-link" href="#overview">{copy.nav.overview}</a>
            <a className="lend-nav-link" href="#capabilities">{copy.nav.capabilities}</a>
            <a className="lend-nav-link" href="#networks">{copy.nav.networks}</a>
          </nav>
        </header>

        <section className="lend-hero" ref={reveal}>
          <div className="lend-hero-copy">
            <h1 className="lend-reveal--1">{copy.hero.title}</h1>
            <p className="lend-reveal--2">{copy.hero.body}</p>
            <p className="lend-hero-subcopy lend-reveal--2">{copy.hero.subcopy}</p>

            <div className="lend-cta-row lend-reveal--3">
              <Link className="lend-primary" to="/auth">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

          </div>

          <aside className="lend-hero-side lend-reveal--3" aria-label={copy.heroPanel.title}>
            <div className="lend-hero-panel">
              <div className="lend-panel-heading">
                <h2>{copy.heroPanel.title}</h2>
                <p>{copy.heroPanel.body}</p>
              </div>

              <div className="lend-panel-actions">
                <Link className="lend-primary" to="/checkout/demo">
                  {copy.heroPanel.primary}
                </Link>
                <Link className="lend-secondary" to="/auth">
                  {copy.heroPanel.secondary}
                </Link>
              </div>
            </div>
          </aside>
        </section>

        <section id="overview" className="lend-split-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid lend-reveal--2">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded lend-reveal--2">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className="lend-card lend-card--feature">
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board lend-reveal--2">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>BEFORE REQST</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-reqst">
                  <span>WITH REQST</span>
                  <p>{row.reqst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section" ref={reveal}>
          <div className="lend-section-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-grid lend-reveal--2">
            {copy.networks.rails.map((rail) => (
              <article key={rail.title} className="lend-network-card">
                <div className="lend-network-badge">{rail.name}</div>
                <h3>{rail.title}</h3>
                <p>{rail.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="lend-faq-section" ref={reveal}>
          <div className="lend-section-copy lend-faq-copy lend-reveal--1">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-stack lend-reveal--2">
            {copy.faq.items.map((item, index) => {
              const isOpen = index === openFaq;
              const answerId = `landing-faq-answer-${index}`;
              return (
                <article key={item.question} className={`lend-faq-item${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="lend-faq-trigger"
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <div className="lend-faq-trigger-copy">
                      <span className="lend-faq-kicker">Protocol Q&A</span>
                      <span className="lend-faq-question-text">{item.question}</span>
                    </div>
                    <div className="lend-faq-icon">
                      <div className="lend-faq-icon-line" />
                      <div className="lend-faq-icon-line" />
                    </div>
                  </button>
                  <div
                    id={answerId}
                    className={`lend-faq-answer-wrapper${isOpen ? " is-open" : ""}`}
                    aria-hidden={!isOpen}
                  >
                    <div className="lend-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lend-final" ref={reveal}>
          <div className="lend-reveal--1">
            <span className="lend-section-kicker">{copy.final.kicker}</span>
            <h2>{copy.final.title}</h2>
            <p>{copy.final.body}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/auth">
                {copy.final.primary}
              </Link>
              <div className="lend-inline-links">
                <Link className="lend-secondary" to="/dev">
                  {copy.footer.api}
                </Link>
                <Link className="lend-secondary" to="/enterprise">
                  {copy.footer.b2b}
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-links">
            <Link to="/privacy">{copy.footer.privacy}</Link>
            <Link to="/terms">{copy.footer.terms}</Link>
            <Link to="/dev">{copy.footer.api}</Link>
            <Link to="/enterprise">{copy.footer.b2b}</Link>
            <Link to="/auth">{copy.footer.console}</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
