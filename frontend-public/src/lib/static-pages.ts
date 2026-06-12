import type { StaticMarketingPageCopy } from "@/components/marketing/StaticMarketingPage";

type StaticPageKey = "security" | "about" | "contact" | "integrations" | "customers" | "changelog" | "help";

export const STATIC_PAGE_COPY: Record<StaticPageKey, { en: StaticMarketingPageCopy; ru: StaticMarketingPageCopy }> = {
  security: {
    en: {
      kicker: "SECURITY",
      title: "Security for non-custodial crypto payments",
      body: "recv never holds merchant funds. Payments settle straight to your wallets while we secure payment detection, API access, HMAC-signed webhooks, and admin review for production crypto operations.",
      points: [
        { title: "Non-custodial by design", body: "Every payment settles directly to merchant-controlled wallets, so there is no platform balance to drain, freeze, or lose in a breach." },
        { title: "HMAC-signed webhooks", body: "Each delivery is signed with a per-endpoint secret and includes a timestamp, so your backend can verify authenticity and reject replays." },
        { title: "On-chain confirmation", body: "Payments are confirmed against the blockchain with required confirmations per network before an invoice is marked paid." },
        { title: "Operational controls", body: "Scoped API keys, an admin audit log, manual-review queues, and strict environment separation keep production access accountable." },
      ],
      cta: "Build without custody risk",
    },
    ru: {
      kicker: "БЕЗОПАСНОСТЬ",
      title: "Безопасность non-custodial криптоплатежей",
      body: "recv не хранит средства продавца. Платежи приходят сразу на ваши кошельки, а мы защищаем детекцию платежей, доступ к API, подписанные HMAC вебхуки и админ-контроль для продакшена.",
      points: [
        { title: "Non-custodial по умолчанию", body: "Каждый платёж зачисляется напрямую на кошельки продавца — нет платформенного баланса, который можно украсть, заморозить или потерять при взломе." },
        { title: "Вебхуки с подписью HMAC", body: "Каждая доставка подписывается секретом эндпоинта и содержит timestamp — ваш backend проверяет подлинность и отбрасывает повторы." },
        { title: "Подтверждение в сети", body: "Платежи подтверждаются в блокчейне нужным числом подтверждений для сети, прежде чем инвойс становится оплаченным." },
        { title: "Операционный контроль", body: "Ограниченные по правам API-ключи, админ audit log, очереди ручной проверки и разделение окружений держат доступ к продакшену под контролем." },
      ],
      cta: "Запуск без custodial-риска",
    },
  },
  about: {
    en: {
      kicker: "ABOUT",
      title: "About recv — payment infrastructure you control",
      body: "recv is crypto payment infrastructure for merchants, SaaS platforms, and creators who want automated checkout in USDT, TON, and TRON without handing funds to a third-party processor.",
      points: [
        { title: "Direct settlement", body: "We monitor supported payment networks and coordinate invoices end to end, while wallet ownership and funds stay entirely with the merchant." },
        { title: "Developer-first", body: "A versioned REST API, signed webhooks, docs, and status surfaces are core product, not an afterthought bolted on later." },
        { title: "Built for operators", body: "A seller console and admin tools cover daily payment support, manual review, reconciliation, and revenue analytics." },
      ],
    },
    ru: {
      kicker: "О ПРОДУКТЕ",
      title: "О recv — платёжная инфраструктура под вашим контролем",
      body: "recv — крипто-платёжная инфраструктура для продавцов, SaaS и авторов, которым нужен автоматический checkout в USDT, TON и TRON без передачи средств стороннему процессору.",
      points: [
        { title: "Прямое зачисление", body: "Мы наблюдаем поддерживаемые платёжные сети и ведём инвойсы от начала до конца, а кошельки и средства полностью остаются у продавца." },
        { title: "Для разработчиков", body: "Версионированный REST API, подписанные вебхуки, документация и статусные страницы — это ядро продукта, а не надстройка." },
        { title: "Для операторов", body: "Консоль продавца и админ-инструменты закрывают поддержку платежей, ручную проверку, сверку и аналитику выручки." },
      ],
    },
  },
  contact: {
    en: {
      kicker: "CONTACT",
      title: "Contact recv — sales, integration & support",
      body: "Talk to the recv team about high-volume pricing, API and webhook integration, partnerships, or production onboarding for non-custodial crypto payments.",
      points: [
        { title: "Sales and demos", body: "Business and high-volume merchants get a direct line to pricing, volume terms, and a guided walkthrough of the platform." },
        { title: "Integration support", body: "Stuck on API keys, webhook signatures, or wallet setup? Reach engineers who can unblock your launch quickly." },
        { title: "Legal and abuse", body: "A stable destination for compliance, abuse reports, and infrastructure or security contact." },
      ],
    },
    ru: {
      kicker: "КОНТАКТЫ",
      title: "Контакты recv — продажи, интеграция, поддержка",
      body: "Свяжитесь с командой recv по тарифам для большого объёма, интеграции API и вебхуков, партнёрствам или запуску в продакшене для non-custodial криптоплатежей.",
      points: [
        { title: "Продажи и демо", body: "Business и high-volume продавцы получают прямой контакт по ценам, условиям объёма и разбор платформы." },
        { title: "Помощь с интеграцией", body: "Застряли на API-ключах, подписи вебхуков или настройке кошельков? Свяжитесь с инженерами, которые быстро разблокируют запуск." },
        { title: "Legal и abuse", body: "Стабильный адрес для комплаенса, жалоб на злоупотребления и контактов по инфраструктуре и безопасности." },
      ],
    },
  },
  integrations: {
    en: {
      kicker: "INTEGRATIONS",
      title: "Crypto payment API, webhooks & checkout links",
      body: "Connect recv to your stack with a REST API, signed webhooks, and hosted checkout links — built for Telegram Mini Apps, SaaS billing, digital goods, and custom commerce.",
      points: [
        { title: "REST API", body: "Create invoices, read live status, and automate the full payment lifecycle in USDT, TON, TRON, Solana, Base, Arbitrum, and BSC from your backend." },
        { title: "Signed webhooks", body: "Receive HMAC-signed status changes to drive fulfillment, subscription state, and your internal ledger without polling." },
        { title: "Hosted checkout", body: "Send buyers to a payment screen with QR, wallet deep link, exact amount, network, and live confirmation state." },
      ],
    },
    ru: {
      kicker: "ИНТЕГРАЦИИ",
      title: "API криптоплатежей, вебхуки и checkout-ссылки",
      body: "Подключите recv к своему стеку через REST API, подписанные вебхуки и hosted checkout — для Telegram Mini Apps, SaaS-биллинга, digital goods и кастомной коммерции.",
      points: [
        { title: "REST API", body: "Создавайте инвойсы, читайте статус в реальном времени и автоматизируйте весь lifecycle платежа в USDT, TON, TRON, Solana, Base, Arbitrum и BSC из своего backend." },
        { title: "Подписанные вебхуки", body: "Получайте изменения статуса с подписью HMAC для выдачи товара, состояния подписок и учёта — без постоянного опроса." },
        { title: "Hosted checkout", body: "Отправляйте покупателей на экран оплаты с QR, deep link кошелька, точной суммой, сетью и live-статусом подтверждения." },
      ],
    },
  },
  customers: {
    en: {
      kicker: "CUSTOMERS",
      title: "Who recv is built for",
      body: "recv is built for crypto revenue teams that need fast confirmation and direct settlement: digital goods sellers, paid Telegram communities, and SaaS or agency operators.",
      points: [
        { title: "Digital goods", body: "Fast confirmation and webhook-driven fulfillment for files, license keys, courses, and gated content the moment payment clears." },
        { title: "Paid communities", body: "Telegram-native checkout for groups, channels, and creator access, with instant unlock on confirmed payment." },
        { title: "SaaS and agencies", body: "Recurring billing, client-separated wallets, and predictable fixed platform cost instead of percentage-of-revenue fees." },
      ],
    },
    ru: {
      kicker: "КЛИЕНТЫ",
      title: "Для кого создан recv",
      body: "recv создан для команд, которые принимают криптовыручку и которым нужны быстрое подтверждение и прямое зачисление: продавцы digital goods, платные Telegram-сообщества, SaaS и агентства.",
      points: [
        { title: "Digital goods", body: "Быстрое подтверждение и webhook-выдача файлов, лицензионных ключей, курсов и закрытого контента сразу после оплаты." },
        { title: "Платные сообщества", body: "Telegram-native checkout для групп, каналов и creator access с мгновенным доступом по подтверждённому платежу." },
        { title: "SaaS и агентства", body: "Рекуррентный биллинг, раздельные кошельки клиентов и предсказуемая фиксированная стоимость вместо процента с выручки." },
      ],
    },
  },
  changelog: {
    en: {
      kicker: "CHANGELOG",
      title: "recv changelog — product & network updates",
      body: "Track what changes in recv: API and webhook updates, new blockchain support, checkout improvements, and operational changes that matter to merchants and developers.",
      points: [
        { title: "API changes", body: "Versioned endpoint, schema, and webhook payload updates, with notes on anything that affects existing integrations." },
        { title: "Network support", body: "Additions and reliability changes across TON, USDT on TON, TRON, Base, and BSC." },
        { title: "Operational improvements", body: "Updates to admin tooling, reconciliation, analytics, and the checkout flow." },
      ],
    },
    ru: {
      kicker: "CHANGELOG",
      title: "Changelog recv — обновления продукта и сетей",
      body: "Отслеживайте изменения в recv: обновления API и вебхуков, поддержку новых блокчейнов, улучшения checkout и операционные изменения, важные продавцам и разработчикам.",
      points: [
        { title: "Изменения API", body: "Версионированные изменения эндпоинтов, схем и payload вебхуков с пометками о влиянии на текущие интеграции." },
        { title: "Поддержка сетей", body: "Добавления и изменения надёжности по TON, USDT в TON, TRON, Base и BSC." },
        { title: "Операционные улучшения", body: "Обновления админ-инструментов, сверки, аналитики и процесса checkout." },
      ],
    },
  },
  help: {
    en: {
      kicker: "HELP",
      title: "recv help center — setup, API & payments",
      body: "Get answers fast: wallet and network setup, API keys and webhook verification, and how recv handles late, under-, and overpayments before you ever contact support.",
      points: [
        { title: "Setup", body: "Connect wallets and networks, create your first invoice, test checkout, and keep test and production environments separate." },
        { title: "Developers", body: "API keys, webhook HMAC verification, rate limits, error codes, and retry behavior for reliable integrations." },
        { title: "Payments", body: "How late payments, underpayments, overpayments, manual review, and reconciliation are resolved on recv." },
      ],
    },
    ru: {
      kicker: "ПОМОЩЬ",
      title: "Центр помощи recv — настройка, API, платежи",
      body: "Быстрые ответы: настройка кошельков и сетей, API-ключи и проверка вебхуков, а также как recv обрабатывает поздние, недо- и переплаты — ещё до обращения в поддержку.",
      points: [
        { title: "Настройка", body: "Подключение кошельков и сетей, создание первого инвойса, тест checkout и разделение тестового и продакшен-окружений." },
        { title: "Разработчикам", body: "API-ключи, проверка HMAC вебхуков, лимиты запросов, коды ошибок и поведение повторов для надёжных интеграций." },
        { title: "Платежи", body: "Как в recv решаются поздние платежи, недоплаты, переплаты, ручная проверка и сверка." },
      ],
    },
  },
};

export type { StaticPageKey };
