import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    nav: {
      overview: "Обзор",
      capabilities: "Возможности",
      networks: "Сети",
      faq: "FAQ",
      bot: "Telegram бот",
      console: "Вход для продавцов",
    },
    hero: {
      title: "Принимайте крипто-платежи без посредников и ручной сверки.",
      body:
        "Reqst автоматизирует весь цикл: от создания инвойса до подтверждения транзакции. Дайте клиентам профессиональный чекаут, а себе — порядок в учете без бесконечных проверок в блокчейн-эксплорерах.",
      subcopy:
        "Non-custodial: средства поступают напрямую на ваш кошелек. Прозрачная модель подписки вместо скрытых комиссий с каждого платежа.",
      primary: "Начать работу",
      secondary: "Открыть в Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "No Transaction Fees", "API Ready", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "product snapshot",
      title: "Профессиональный интерфейс для вашего бизнеса",
      items: [
        {
          label: "checkout",
          title: "Страница оплаты",
          body: "QR-код, выбор сети, таймер и автоматическое обновление статуса в одном интерфейсе.",
        },
        {
          label: "status",
          title: "Контроль транзакций",
          body: "Мгновенные уведомления о недоплатах, переплатах или поздних транзакциях.",
        },
        {
          label: "ops",
          title: "Гибкое управление",
          body: "Управляйте продажами там, где удобно: в веб-консоли или через мощного Telegram-бота.",
        },
      ],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Полный контроль над входящими платежами.",
      body:
        "Reqst превращает хаотичные переводы по адресу в структурированный бизнес-процесс. Больше не нужно переспрашивать «пришли?» — система всё сделает за вас.",
      cards: [
        {
          title: "Для продавца",
          body: "Единая панель управления инвойсами, кошельками и аналитикой продаж.",
        },
        {
          title: "Для покупателя",
          body: "Безопасный и понятный процесс оплаты с мгновенным подтверждением.",
        },
        {
          title: "Для масштабирования",
          body: "Готов к интеграции в ваши сервисы через API и командной работе.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "Всё, что нужно для приема крипты.",
      body: "Инструменты, которые экономят часы рутины каждый день.",
      items: [
        {
          kicker: "01",
          title: "Прямые выплаты",
          body: "Средства не замораживаются на платформе. Покупатель платит напрямую на ваш адрес.",
        },
        {
          kicker: "02",
          title: "Умный чекаут",
          body: "Динамические страницы с поддержкой популярных сетей и четким контекстом платежа.",
        },
        {
          kicker: "03",
          title: "Точный трекинг",
          body: "Автоматическое сопоставление транзакций. Обработка частичных оплат и ошибок сети.",
        },
        {
          kicker: "04",
          title: "Telegram-экосистема",
          body: "Выставляйте счета и получайте уведомления о продажах прямо в мессенджере.",
        },
        {
          kicker: "05",
          title: "Фиксированная цена",
          body: "Платите за доступ к сервису, а не процент от вашего оборота. Никаких налогов на рост.",
        },
        {
          kicker: "06",
          title: "Масштабируемость",
          body: "От индивидуальных продаж до B2B-решений с интеграцией по API.",
        },
      ],
    },
    compare: {
      kicker: "THE DIFFERENCE",
      title: "Забудьте про ручной поиск транзакций.",
      body: "Как меняется работа с Reqst.",
      rows: [
        {
          legacy: "Копировать адрес, ждать скриншот, проверять эксплорер.",
          reqst: "Отправить одну ссылку и получить уведомление об успехе.",
        },
        {
          legacy: "Объяснять клиенту, какую сеть и сумму выбрать.",
          reqst: "Клиент видит всё на готовой странице с QR-кодом.",
        },
        {
          legacy: "Тратить часы на сверку спорных платежей.",
          reqst: "Система сама подсветит инвойсы, требующие внимания.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Работайте в любой популярной сети.",
      body: "Единый стандарт приема платежей для всех основных блокчейнов.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Бесшовная интеграция с экосистемой Telegram и TON-кошельками.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "Самый востребованный способ оплаты стейблкоинами с минимальными комиссиями.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Мгновенные транзакции и низкие издержки для высокочастотных платежей.",
        },
        {
          name: "EVM",
          title: "Ethereum & L2",
          body: "Поддержка Base, Arbitrum, BSC и основной сети Ethereum.",
        },
      ],
      soon: {
        title: "Скоро",
        api: "Public API",
        b2b: "B2B Accounts",
        body: "Мы готовим инструменты для глубокой интеграции в ваш продукт и управления командой.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Часто задаваемые вопросы.",
      body: "Коротко о главном.",
      items: [
        {
          question: "Где хранятся мои деньги?",
          answer: "Деньги не хранятся в Reqst. Мы — технический слой, который направляет платежи напрямую на ваши кошельки.",
        },
        {
          question: "Кому подходит сервис?",
          answer: "Индивидуальным предпринимателям, digital-агентствам и любым онлайн-сервисам, принимающим оплату в крипте.",
        },
        {
          question: "Как работает подписка?",
          answer: "Вы оплачиваете фиксированный период доступа. Мы не берем комиссию с ваших транзакций, сколько бы вы ни зарабатывали.",
        },
        {
          question: "Что если клиент перевел не ту сумму?",
          answer: "Система пометит такой платеж как 'Review Required'. Вы сможете вручную подтвердить его или запросить доплату.",
        },
        {
          question: "Можно ли подключить свой домен?",
          answer: "Эта функция запланирована в рамках B2B-пакета, который выйдет в ближайшее время.",
        },
        {
          question: "Есть ли ограничения по количеству инвойсов?",
          answer: "Нет, количество создаваемых инвойсов не ограничено в рамках активной подписки.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Переведите прием платежей на автопилот.",
      body:
        "Присоединяйтесь к продавцам, которые ценят свое время и комфорт своих клиентов. Начните принимать крипту профессионально уже сегодня.",
      primary: "Зайти в консоль",
      secondary: "Условия использования",
    },
    footer: {
      title: "reqst",
      body: "Автоматизация крипто-платежей напрямую на ваш кошелек. Порядок в финансах без лишних усилий.",
      product: "Продукт",
      privacy: "Privacy",
      terms: "Terms",
      console: "Консоль",
      status: "Roadmap",
      api: "API",
      b2b: "B2B",
    },
  },
  en: {
    nav: {
      overview: "Overview",
      capabilities: "Features",
      networks: "Networks",
      faq: "FAQ",
      bot: "Telegram Bot",
      console: "Seller Console",
    },
    hero: {
      title: "Accept crypto payments without the manual hassle.",
      body:
        "Reqst automates the entire flow from invoice creation to payment confirmation. Give your customers a professional checkout experience and keep your records clean without manually checking explorers.",
      subcopy:
        "Non-custodial by design. Funds go straight to your wallet. Flat subscription model instead of transaction fees.",
      primary: "Get Started",
      secondary: "Open in Telegram",
      badges: ["Direct-to-Wallet", "Telegram Native", "No Transaction Fees", "API Ready", "B2B Scale"],
    },
    heroPanel: {
      eyebrow: "product snapshot",
      title: "Professional interface for your business",
      items: [
        {
          label: "checkout",
          title: "Payment Page",
          body: "QR codes, network selection, countdown timers, and live status updates in one clean UI.",
        },
        {
          label: "status",
          title: "Transaction Control",
          body: "Real-time alerts for underpayments, overpayments, or late transactions.",
        },
        {
          label: "ops",
          title: "Flexible Operations",
          body: "Manage sales wherever you are: via our web console or a powerful Telegram bot.",
        },
      ],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Full control over your incoming payments.",
      body:
        "Reqst turns chaotic wallet transfers into a structured business process. Stop asking 'did it arrive?' — let the system handle the verification for you.",
      cards: [
        {
          title: "For the Seller",
          body: "A unified dashboard for managing invoices, wallets, and sales analytics.",
        },
        {
          title: "For the Buyer",
          body: "A secure, intuitive payment flow with instant confirmation.",
        },
        {
          title: "For Scaling",
          body: "Built for integration via API and ready for collaborative team workflows.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "Everything you need to accept crypto.",
      body: "Tools designed to save you hours of manual work every single day.",
      items: [
        {
          kicker: "01",
          title: "Direct Payouts",
          body: "No platform holdings. Customers pay directly to your designated payout address.",
        },
        {
          kicker: "02",
          title: "Smart Checkout",
          body: "Dynamic payment pages with multi-network support and clear payment context.",
        },
        {
          kicker: "03",
          title: "Precise Tracking",
          body: "Automated transaction matching. Graceful handling of partial payments and network delays.",
        },
        {
          kicker: "04",
          title: "Telegram Ecosystem",
          body: "Issue invoices and receive instant sales notifications right in your messenger.",
        },
        {
          kicker: "05",
          title: "Fixed Pricing",
          body: "Pay for product access, not a percentage of your revenue. No success tax.",
        },
        {
          kicker: "06",
          title: "Scalability",
          body: "From solo sellers to enterprise-grade B2B solutions with API integrations.",
        },
      ],
    },
    compare: {
      kicker: "THE DIFFERENCE",
      title: "Stop chasing transactions manually.",
      body: "How Reqst upgrades your workflow.",
      rows: [
        {
          legacy: "Copy address, wait for screenshot, check explorer.",
          reqst: "Send one link and get an instant success notification.",
        },
        {
          legacy: "Explain network and amount details to the client.",
          reqst: "The client sees everything on a polished page with a QR code.",
        },
        {
          legacy: "Spend hours reconciling disputed or messy payments.",
          reqst: "The system flags invoices that need your attention automatically.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Accept payments on any major rail.",
      body: "A unified standard for crypto intake across all popular blockchains.",
      rails: [
        {
          name: "TON",
          title: "The Open Network",
          body: "Seamless integration with the Telegram ecosystem and TON wallets.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "The most popular stablecoin rail with minimal fees and high reliability.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Instant transactions and near-zero costs for high-velocity payments.",
        },
        {
          name: "EVM",
          title: "Ethereum & L2s",
          body: "Support for Base, Arbitrum, BSC, and the Ethereum mainnet.",
        },
      ],
      soon: {
        title: "Coming Soon",
        api: "Public API",
        b2b: "B2B Accounts",
        body: "We are building tools for deep product integration and professional team management.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Frequently Asked Questions.",
      body: "Quick answers to help you get started.",
      items: [
        {
          question: "Where is my money stored?",
          answer: "Reqst never holds your funds. We are a technical layer that routes payments directly to your wallets.",
        },
        {
          question: "Who is this for?",
          answer: "Solo entrepreneurs, digital agencies, and any online service looking to professionalize their crypto intake.",
        },
        {
          question: "How does the subscription work?",
          answer: "You pay a flat fee for access. We don't take a cut from your sales, no matter how much you earn.",
        },
        {
          question: "What if a customer sends the wrong amount?",
          answer: "The system flags it as 'Review Required'. You can then manually approve it or request the remaining balance.",
        },
        {
          question: "Can I use my own domain?",
          answer: "This feature is part of our upcoming B2B package. Stay tuned for updates.",
        },
        {
          question: "Is there a limit on invoices?",
          answer: "No, you can create unlimited invoices as long as your subscription is active.",
        },
      ],
    },
    final: {
      kicker: "GET STARTED",
      title: "Put your payments on autopilot.",
      body:
        "Join sellers who value their time and their customers' experience. Start accepting crypto professionally today.",
      primary: "Open Console",
      secondary: "Terms of Service",
    },
    footer: {
      title: "reqst",
      body: "Automated crypto checkout directly to your wallet. Financial order with zero effort.",
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

export function LandingPage() {
  const { language, setLanguage, theme } = useUI();
  const copy = COPY[language];
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
    return () => {
      document.documentElement.dataset.theme = theme;
    };
  }, [theme]);

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <Link className="lend-brand" to="/">
            <strong>reqst</strong>
          </Link>

          <nav className="lend-topnav" aria-label="landing sections">
            <a className="lend-nav-link" href="#overview">
              {copy.nav.overview}
            </a>
            <a className="lend-nav-link" href="#capabilities">
              {copy.nav.capabilities}
            </a>
            <a className="lend-nav-link" href="#networks">
              {copy.nav.networks}
            </a>
            <a className="lend-nav-link" href="#faq">
              {copy.nav.faq}
            </a>
          </nav>

          <div className="lend-topbar-actions">
            <div className="lend-language" role="group" aria-label="language switcher">
              <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
                РУ
              </button>
              <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
                EN
              </button>
            </div>
            <a className="lend-nav-link lend-nav-link--bot" href={BOT_URL} target="_blank" rel="noreferrer">
              {copy.nav.bot}
            </a>
            <Link className="lend-primary" to="/auth">
              {copy.nav.console}
            </Link>
          </div>
        </header>

        <section className="lend-hero">
          <div className="lend-hero-copy lend-fade lend-fade--1">
            <h1>{copy.hero.title}</h1>
            <p>{copy.hero.body}</p>
            <p className="lend-hero-subcopy">{copy.hero.subcopy}</p>

            <div className="lend-cta-row">
              <Link className="lend-primary" to="/auth">
                {copy.hero.primary}
              </Link>
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {copy.hero.secondary}
              </a>
            </div>

            <div className="lend-chip-grid">
              {copy.hero.badges.map((badge) => (
                <span key={badge} className="lend-chip">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <aside className="lend-hero-side lend-fade lend-fade--2" aria-label={copy.heroPanel.title}>
            <div className="lend-hero-panel">
              <div className="lend-panel-heading">
                <span className="lend-kicker">{copy.heroPanel.eyebrow}</span>
                <h2>{copy.heroPanel.title}</h2>
              </div>

              <div className="lend-panel-grid">
                {copy.heroPanel.items.map((item) => (
                  <article key={item.title} className="lend-panel-card">
                    <span>{item.label}</span>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <section id="overview" className="lend-split-section lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.overview.kicker}</span>
            <h2>{copy.overview.title}</h2>
            <p>{copy.overview.body}</p>
          </div>

          <div className="lend-overview-grid">
            {copy.overview.cards.map((card) => (
              <article key={card.title} className="lend-card lend-card--overview">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="capabilities" className="lend-stacked-section lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.capabilities.kicker}</span>
            <h2>{copy.capabilities.title}</h2>
            <p>{copy.capabilities.body}</p>
          </div>

          <div className="lend-feature-grid lend-feature-grid--expanded">
            {copy.capabilities.items.map((feature, index) => (
              <article key={feature.title} className={`lend-card lend-card--feature lend-fade lend-fade--${(index % 4) + 1}`}>
                <span>{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lend-compare lend-fade lend-fade--2">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.compare.kicker}</span>
            <h2>{copy.compare.title}</h2>
            <p>{copy.compare.body}</p>
          </div>

          <div className="lend-compare-board">
            {copy.compare.rows.map((row) => (
              <article key={row.legacy} className="lend-compare-row">
                <div className="lend-compare-legacy">
                  <span>before</span>
                  <p>{row.legacy}</p>
                </div>
                <div className="lend-compare-reqst">
                  <span>reqst</span>
                  <p>{row.reqst}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="networks" className="lend-stacked-section lend-fade lend-fade--3">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.networks.kicker}</span>
            <h2>{copy.networks.title}</h2>
            <p>{copy.networks.body}</p>
          </div>

          <div className="lend-network-layout">
            <div className="lend-network-grid">
              {copy.networks.rails.map((rail) => (
                <article key={rail.title} className="lend-network-card">
                  <div className="lend-network-badge">{rail.name}</div>
                  <h3>{rail.title}</h3>
                  <p>{rail.body}</p>
                </article>
              ))}
            </div>

            <aside className="lend-soon-card">
              <span className="lend-section-kicker">{copy.networks.soon.title}</span>
              <div className="lend-soon-tags">
                <strong>{copy.networks.soon.api}</strong>
                <strong>{copy.networks.soon.b2b}</strong>
              </div>
              <p>{copy.networks.soon.body}</p>
            </aside>
          </div>
        </section>

        <section id="faq" className="lend-stacked-section lend-fade lend-fade--4">
          <div className="lend-section-copy">
            <span className="lend-section-kicker">{copy.faq.kicker}</span>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.body}</p>
          </div>

          <div className="lend-faq-grid">
            {copy.faq.items.map((item, index) => {
              const isOpen = index === openFaq;
              return (
                <article key={item.question} className={`lend-faq-item${isOpen ? " is-open" : ""}`}>
                  <button type="button" className="lend-faq-trigger" onClick={() => setOpenFaq(isOpen ? -1 : index)}>
                    <span>{item.question}</span>
                    <strong aria-hidden="true">{isOpen ? "−" : "+"}</strong>
                  </button>
                  <div className="lend-faq-answer" hidden={!isOpen}>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="lend-final lend-fade lend-fade--4">
          <span className="lend-section-kicker">{copy.final.kicker}</span>
          <h2>{copy.final.title}</h2>
          <p>{copy.final.body}</p>

          <div className="lend-cta-row">
            <Link className="lend-primary" to="/auth">
              {copy.final.primary}
            </Link>
            <div className="lend-inline-links">
              <Link className="lend-secondary" to="/privacy">
                Privacy
              </Link>
              <Link className="lend-secondary" to="/terms">
                Terms
              </Link>
            </div>
          </div>
        </section>

        <footer className="lend-footer">
          <div className="lend-footer-copy">
            <strong>{copy.footer.title}</strong>
            <p>{copy.footer.body}</p>
          </div>

          <div className="lend-footer-meta">
            <div className="lend-footer-links">
              <Link to="/privacy">{copy.footer.privacy}</Link>
              <Link to="/terms">{copy.footer.terms}</Link>
              <Link to="/auth">{copy.footer.console}</Link>
            </div>

            <div className="lend-footer-roadmap" aria-label={copy.footer.status}>
              <span>{copy.footer.api}</span>
              <span>{copy.footer.b2b}</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
