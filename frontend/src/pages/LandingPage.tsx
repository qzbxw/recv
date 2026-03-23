import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    nav: {
      overview: "Обзор",
      capabilities: "Фичи",
      networks: "Сети",
      faq: "FAQ",
      bot: "Telegram bot",
      console: "Открыть консоль",
    },
    hero: {
      title: "Крипто-чекаут для тех, кто хочет принимать оплату нормально.",
      body:
        "Reqst помогает выставить инвойс, отправить красивую публичную страницу оплаты и спокойно дождаться понятного статуса, а не собирать всё вручную из кошелька, чатов и эксплорера.",
      subcopy:
        "Деньги идут напрямую в кошелек продавца. Подписка есть, но подана как нормальная часть продукта, а не как главный месседж на весь экран.",
      primary: "Зайти в консоль",
      secondary: "Открыть Telegram bot",
      badges: ["Direct to wallet", "Telegram-first", "Subscription-based", "API soon", "B2B soon"],
    },
    heroPanel: {
      eyebrow: "product snapshot",
      title: "Выглядит как продукт, а не как крипто-заглушка",
      items: [
        {
          label: "checkout",
          title: "Публичная страница оплаты",
          body: "Сумма, сеть, адрес, QR и таймер уже собраны в одном месте.",
        },
        {
          label: "status",
          title: "Понятные статусы инвойсов",
          body: "Если оплата пришла неровно или поздно, это видно сразу, без магии и догадок.",
        },
        {
          label: "ops",
          title: "Ритм под продавца",
          body: "Telegram, консоль и быстрый рабочий поток вместо тяжелого кабинета.",
        },
      ],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Reqst закрывает путь от ссылки на оплату до финального статуса.",
      body:
        "Это не просто адрес для перевода. Продавец получает цельный сценарий: создать инвойс, отправить checkout, увидеть результат и не потерять спорные кейсы по дороге.",
      cards: [
        {
          title: "Для продавца",
          body: "Кошельки, инвойсы и статусы собраны в одном месте, чтобы меньше жить в ручной сверке.",
        },
        {
          title: "Для покупателя",
          body: "Аккуратная страница оплаты без лишнего шума и с понятным следующим шагом.",
        },
        {
          title: "Для команды",
          body: "Подходит для solo use сейчас и выглядит как основа для B2B-сценариев дальше.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "Что здесь действительно важно.",
      body: "Только ключевые вещи, которые ощущаются в работе каждый день.",
      items: [
        {
          kicker: "01",
          title: "Оплата сразу продавцу",
          body: "Reqst не забирает деньги на свой баланс. Покупатель платит напрямую в payout wallet.",
        },
        {
          kicker: "02",
          title: "Нормальный checkout",
          body: "Вместо голого адреса есть страница с QR, сетью, суммой, дедлайном и контекстом платежа.",
        },
        {
          kicker: "03",
          title: "Статусы, которым можно верить",
          body: "Успешно, в ожидании или нужен ручной разбор. Без притворства, что всё ок, когда это не так.",
        },
        {
          kicker: "04",
          title: "Telegram в центре процесса",
          body: "Для небольших команд это быстрее и живее, чем отдельный тяжеловесный backoffice.",
        },
        {
          kicker: "05",
          title: "Подписка как спокойная модель",
          body: "Без ощущения налога с каждого платежа. Продукт растет вместе с продавцом, а не против него.",
        },
        {
          kicker: "06",
          title: "API и B2B на подходе",
          body: "Сейчас фокус на удобном продукте для продавцов, дальше будет более широкий сценарий для интеграций и команд.",
        },
      ],
    },
    compare: {
      kicker: "WHY IT FEELS BETTER",
      title: "Меньше хаоса, больше ощущения контроля.",
      body: "Так разница считывается быстрее всего.",
      rows: [
        {
          legacy: "Скинуть адрес и потом руками искать перевод.",
          reqst: "Отправить checkout и смотреть на готовый статус инвойса.",
        },
        {
          legacy: "Держать в голове, что именно увидит покупатель.",
          reqst: "Дать одну аккуратную страницу, где все уже разложено.",
        },
        {
          legacy: "Проверять спорные оплаты вручную без структуры.",
          reqst: "Сразу видеть, где всё ок, а где нужен review.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "Сети уже на месте, дальше шире.",
      body: "Reqst уже выглядит как multi-rail продукт, а не как одноразовая страница под одну сеть.",
      rails: [
        {
          name: "TON",
          title: "TON",
          body: "Нативный сценарий для TON-платежей с понятной логикой сопоставления.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "Привычный stablecoin path для продавцов, которым нужна простая и читаемая оплата.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "Отдельная поверхность для payout-сценариев, где Solana уже важна.",
        },
        {
          name: "EVM",
          title: "Ethereum, Base, Arbitrum, BSC",
          body: "Общий EVM-контур без ощущения, что каждую сеть надо собирать заново.",
        },
      ],
      soon: {
        title: "Что дальше",
        api: "API soon",
        b2b: "B2B soon",
        body: "Следующий слой для команд, интеграций и более системного использования продукта.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Быстрые ответы перед стартом.",
      body: "Коротко и по делу.",
      items: [
        {
          question: "Reqst хранит деньги у себя?",
          answer: "Нет. Оплата идет напрямую в кошелек продавца.",
        },
        {
          question: "Это только для соло-продавцов?",
          answer: "Сейчас продукт особенно удобен для solo sellers и небольших digital-команд, но мы сразу держим курс на B2B use cases.",
        },
        {
          question: "Что с подпиской?",
          answer: "Подписка есть, но она не доминирует над продуктом. Это спокойная модель доступа, а не процент с каждого платежа.",
        },
        {
          question: "Что видит покупатель?",
          answer: "Понятную checkout-страницу с адресом, суммой, сетью, QR и статусом без лишней путаницы.",
        },
        {
          question: "Если платеж спорный или поздний?",
          answer: "Такие кейсы не прячутся. Они остаются видимыми и уходят в отдельный статус для ручной проверки.",
        },
        {
          question: "Будет API?",
          answer: "Да. API soon, и вместе с ним более серьезный сценарий для B2B-команд.",
        },
      ],
    },
    final: {
      kicker: "REQST",
      title: "Принимать крипту можно спокойнее и аккуратнее.",
      body:
        "Если нужен не шумный web3-лендинг, а внятный продуктовый вход в сервис, reqst уже выглядит именно так: компактно, уверенно и с запасом на следующий этап.",
      primary: "Открыть консоль",
      secondary: "Privacy & Terms",
    },
    footer: {
      title: "reqst",
      body: "Direct-to-wallet checkout для продавцов, которым нужен порядок в оплатах уже сейчас.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
      status: "Roadmap",
      api: "API soon",
      b2b: "B2B soon",
    },
  },
  en: {
    nav: {
      overview: "Overview",
      capabilities: "Features",
      networks: "Networks",
      faq: "FAQ",
      bot: "Telegram bot",
      console: "Open console",
    },
    hero: {
      title: "Crypto checkout for sellers who want the flow to feel clean.",
      body:
        "Reqst helps you create an invoice, send a polished payment page, and read the final payment state without stitching the whole process together from wallets, chats, and explorer tabs.",
      subcopy:
        "Funds go straight to the seller wallet. Subscription is part of the product model, but it no longer takes over the whole landing page.",
      primary: "Open console",
      secondary: "Open Telegram bot",
      badges: ["Direct to wallet", "Telegram-first", "Subscription-based", "API soon", "B2B soon"],
    },
    heroPanel: {
      eyebrow: "product snapshot",
      title: "Feels like a product, not a crypto placeholder",
      items: [
        {
          label: "checkout",
          title: "Public payment page",
          body: "Amount, network, address, QR, and countdown are already presented in one clear place.",
        },
        {
          label: "status",
          title: "Readable invoice states",
          body: "If a payment comes in late or messy, the seller can see it immediately instead of guessing.",
        },
        {
          label: "ops",
          title: "Built for the operator",
          body: "Telegram, console, and a faster day-to-day flow instead of an overbuilt backoffice.",
        },
      ],
    },
    overview: {
      kicker: "OVERVIEW",
      title: "Reqst covers the path from payment link to final status.",
      body:
        "It is not just a wallet address generator. The product gives sellers one connected flow: create an invoice, send checkout, see what happened, and keep edge cases visible.",
      cards: [
        {
          title: "For the seller",
          body: "Wallets, invoices, and statuses live together so reconciliation does not become the whole job.",
        },
        {
          title: "For the buyer",
          body: "A clean payment page with enough context to complete the payment confidently.",
        },
        {
          title: "For the business",
          body: "Strong for solo sellers now, with clear room for broader B2B use later.",
        },
      ],
    },
    capabilities: {
      kicker: "FEATURES",
      title: "What actually matters here.",
      body: "Only the product traits that show up in real day-to-day use.",
      items: [
        {
          kicker: "01",
          title: "Direct payout to the seller",
          body: "Reqst does not pull funds into a platform balance. The buyer pays the payout wallet directly.",
        },
        {
          kicker: "02",
          title: "A proper checkout",
          body: "Instead of just an address, buyers get a page with QR, network, amount, deadline, and payment context.",
        },
        {
          kicker: "03",
          title: "Statuses you can trust",
          body: "Paid, awaiting, or review required. No pretending that every edge case is a clean success.",
        },
        {
          kicker: "04",
          title: "Telegram at the center",
          body: "For small digital teams, this feels faster and lighter than a heavy backoffice.",
        },
        {
          kicker: "05",
          title: "Subscription without the take-rate feeling",
          body: "The pricing model stays calm and predictable instead of taxing every successful payment.",
        },
        {
          kicker: "06",
          title: "API and B2B are next",
          body: "The current focus is a strong seller product, with a broader integration and team layer on the roadmap.",
        },
      ],
    },
    compare: {
      kicker: "WHY IT FEELS BETTER",
      title: "Less chaos, more control.",
      body: "The difference reads fastest like this.",
      rows: [
        {
          legacy: "Send a wallet address and manually verify what happened later.",
          reqst: "Send a checkout page and follow the invoice state.",
        },
        {
          legacy: "Hope the buyer understands what to do next.",
          reqst: "Give one clear payment page with the right context already there.",
        },
        {
          legacy: "Handle ambiguous payments as unstructured support work.",
          reqst: "Keep those cases visible and route them into review.",
        },
      ],
    },
    networks: {
      kicker: "NETWORKS",
      title: "The rails are already here, with more coming next.",
      body: "Reqst already reads like a multi-rail product rather than a one-chain landing stub.",
      rails: [
        {
          name: "TON",
          title: "TON",
          body: "A native TON payment path with matching logic built for that flow.",
        },
        {
          name: "TRON",
          title: "TRON / USDT",
          body: "A familiar stablecoin path for sellers who want straightforward payment intake.",
        },
        {
          name: "SOL",
          title: "Solana",
          body: "A dedicated surface for sellers who already care about Solana payouts.",
        },
        {
          name: "EVM",
          title: "Ethereum, Base, Arbitrum, BSC",
          body: "A shared EVM layer without forcing every network into its own scattered setup.",
        },
      ],
      soon: {
        title: "What is next",
        api: "API soon",
        b2b: "B2B soon",
        body: "The next layer is aimed at integrations, teams, and a more structured business workflow.",
      },
    },
    faq: {
      kicker: "FAQ",
      title: "Quick answers before launch.",
      body: "Short and direct.",
      items: [
        {
          question: "Does reqst hold the funds?",
          answer: "No. The payment goes directly to the seller wallet.",
        },
        {
          question: "Is it only for solo sellers?",
          answer: "Right now it is especially strong for solo sellers and small digital teams, while the product direction clearly moves toward B2B use cases too.",
        },
        {
          question: "What about subscription pricing?",
          answer: "There is a subscription model, but it is presented as calm product access rather than the main message on the page.",
        },
        {
          question: "What does the buyer actually see?",
          answer: "A clean checkout page with address, amount, network, QR, and status instead of raw payment instructions.",
        },
        {
          question: "What happens with late or messy payments?",
          answer: "Those cases stay visible and move into a separate review state instead of being hidden.",
        },
        {
          question: "Will there be an API?",
          answer: "Yes. API soon, alongside a stronger B2B-facing layer.",
        },
      ],
    },
    final: {
      kicker: "REQST",
      title: "Crypto billing can feel calmer and more polished.",
      body:
        "If the goal is not a noisy web3 landing page but a focused product entry point, reqst now reads that way: compact, confident, and ready for the next stage.",
      primary: "Open console",
      secondary: "Privacy & Terms",
    },
    footer: {
      title: "reqst",
      body: "Direct-to-wallet checkout for sellers who want payment flow clarity now.",
      product: "Product",
      privacy: "Privacy",
      terms: "Terms",
      console: "Console",
      status: "Roadmap",
      api: "API soon",
      b2b: "B2B soon",
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
