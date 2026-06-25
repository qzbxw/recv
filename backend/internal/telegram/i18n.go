package telegram

import "recv/backend/internal/store"

// botCopy is the full localized surface of the Telegram bot. Templates use
// printf verbs and are filled in bot.go with HTML-escaped values. The voice
// matches recv on the web: lowercase brand, confident, terse, action-first.
type botCopy struct {
	lang string

	// Home
	homeTitle      string
	homeWorkspace  string // %s username
	homePlan       string // %s plan label
	homeWallets    string // %d count
	homeLatest     string // %s latest line
	homeNoInvoices string
	homeTagline    string
	homePlanActive string // %s plan, %s = formatted date
	homeTrialLeft  string // %d remaining

	// Acquisition start
	startTitle string
	startBody  string
	startProof string

	// Buttons
	btnNewInvoice      string
	btnRecentInvoices  string
	btnWallets         string
	btnPlans           string
	btnExtendPlan      string
	btnHome            string
	btnBack            string
	btnCancel          string
	btnLanguage        string
	btnOpenCheckout    string
	btnOpenConsole     string
	btnOpenStats       string
	btnPricing         string
	btnDocs            string
	btnSetWallet       string // %s = network label
	btnAddWallet       string
	btnDisable         string // %s = network label
	btnNewInvoiceShort string
	btnPayPlan         string // %s = plan name
	btnStartSetup      string
	btnHowPlans        string
	minuteSuffix       string // e.g. "min" / "мин"

	// Login
	loginTitle string
	loginSteps string

	// Unknown command / fallback
	unknownCommand string

	// Recent invoices
	invoicesTitle string
	invoicesEmpty string
	invoiceLine   string // public id, title, amount, network, status

	// Wallets
	walletsTitle      string
	walletsEmpty      string
	walletsSaved      string
	walletsDisabled   string
	walletsAddFirst   string
	walletPromptEVM   string
	walletPromptSOL   string
	walletPromptTRON  string
	walletPromptOther string // %s = network
	walletInvalidHint string // appended note line, %s = error

	// Invoice wizard
	invoicePickWallet   string
	invoicePickNetwork  string // %s wallet label
	invoiceStep1        string // %s wallet label
	invoiceStep2        string // %s wallet, %s title
	invoiceStep3        string // %s wallet, %s title, %s amount
	invoiceTitleEmpty   string
	invoiceAmountBad    string
	invoiceCreated      string // %s id, %s title, %s amount_usd, %s network, %s expires_at, %s checkout_url
	invoiceTrialReached string

	// Upgrade
	plansTitle      string
	plansBody       string
	plansCurrent    string // %s plan, %s date
	planLine        string // %s name, %s price, %s features
	planMerchant    string
	planDeveloper   string
	planBusiness    string
	planPickNetwork string // %s plan name, %s price, %s features
	checkoutCreated string // %s plan, %s id, %s amount, %s network

	// Manual-review callbacks
	markedPaid    string // %s id
	keptUnderpaid string // %s id
	keptReview    string // %s id

	// Language screen
	languageTitle string

	// Retention reminders
	reminderNoWallet         string
	reminderNoWallet2        string
	reminderNoWallet3        string
	reminderNoWallet4        string
	reminderNoWallet5        string
	reminderNoInvoice        string
	reminderNoInvoice2       string
	reminderNoInvoice3       string
	reminderNoInvoice4       string
	reminderNoInvoice5       string
	reminderTrialExhausted   string
	reminderTrialExhausted2  string
	reminderTrialExhausted3  string
	reminderExpired          string
	reminderExpired2         string
	reminderExpired3         string
	reminderExpired4         string
	reminderExpired5         string
	reminderInactive         string
	reminderInactive2        string
	reminderInactive3        string
	reminderInactive4        string
	reminderInactive5        string

	// Callback toasts (answerCallbackQuery)
	toastWalletDisabled      string
	toastActionFailed        string
	toastWaitingTopUp        string
	toastMarkedPaid          string
	toastLeftReview          string
	toastPlanCheckoutCreated string
	toastLanguageSet         string
	toastUnknownAction       string
}

var enCopy = botCopy{
	lang: "en",

	homeTitle:      "<b>recv</b> — payments on autopilot",
	homeWorkspace:  "Workspace · %s",
	homePlan:       "Plan · %s",
	homeWallets:    "Payout wallets · %d",
	homeLatest:     "Last invoice · %s",
	homeNoInvoices: "No invoices yet — let's fix that.",
	homeTagline:    "Payment links, wallets, plan, recent invoices — the whole counter fits in this chat.",
	homePlanActive: "⭐ %s active until %s",
	homeTrialLeft:  "Trial · %d free invoices left",

	startTitle: "<b>Welcome to recv</b> — non-custodial crypto acquiring for your business",
	startBody:  "Accept USDT and other crypto payments directly in Telegram. No intermediaries, holds or hidden fees — funds go straight to your own wallet.",
	startProof: "Set up payment acceptance in 1 minute.",

	btnNewInvoice:      "＋ New invoice",
	btnRecentInvoices:  "🧾 Recent",
	btnWallets:         "👛 Wallets",
	btnPlans:           "⭐ Plans",
	btnExtendPlan:      "⭐ Extend plan",
	btnHome:            "← Home",
	btnBack:            "← Back",
	btnCancel:          "✕ Cancel",
	btnLanguage:        "🌐 Language",
	btnOpenCheckout:    "💳 Open checkout",
	btnOpenConsole:     "↗ Try Mini app",
	btnOpenStats:       "📊 Stats in Mini app",
	btnPricing:         "Plans on site",
	btnDocs:            "Docs",
	btnSetWallet:       "Set %s",
	btnAddWallet:       "＋ Add wallet",
	btnDisable:         "Remove %s",
	btnNewInvoiceShort: "＋ One more",
	btnPayPlan:         "Pay for %s",
	btnStartSetup:      "⚙️ Setup wallet",
	btnHowPlans:        "What's the cost?",
	minuteSuffix:       "min",

	loginTitle: "🔑 <b>Sign in on the web</b>",
	loginSteps: "1. Open the recv sign-in page in your browser.\n2. Type your @username.\n3. Tap “Get code”.\n4. Paste the code we send you here. Done.",

	unknownCommand: "I know /invoice, /invoices, /wallets, /plans and /language. Or just use the buttons — faster.",

	invoicesTitle: "🧾 <b>Recent invoices</b>",
	invoicesEmpty: "No invoices yet. Create one here and send the checkout link wherever the buyer is.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Payout wallets</b>",
	walletsEmpty:      "No wallets yet. Add one and money lands straight in your pocket — recv never touches it.",
	walletsSaved:      "✅ Wallet saved.",
	walletsDisabled:   "Wallet removed.",
	walletsAddFirst:   "<b>A payout wallet is required to create an invoice.</b>\n\nTo let customers pay invoices and route funds to you, connect a payout wallet first. It only takes a few seconds.",
	walletPromptEVM:   "<b>Wallet connection: EVM</b>\n\nPlease send your EVM wallet address in this chat. Customer payments on supported EVM networks will be routed to this address.\n\nExample: <code>0x...</code>\n\nCheck that the address is copied exactly.",
	walletPromptSOL:   "<b>Wallet connection: Solana</b>\n\nPlease send your Solana wallet address in this chat. Customer payments on Solana will be routed to this address.\n\nExample: <code>So...</code>\n\nCheck that the address is copied exactly.",
	walletPromptTRON:  "<b>Wallet connection: TRON (TRC-20)</b>\n\nPlease send your TRON wallet address in this chat. Customer payments on TRON will be routed to this address.\n\nExample: <code>T...</code>\n\nCheck that the address is copied exactly.",
	walletPromptOther: "<b>Wallet connection: %s</b>\n\nPlease send your wallet address in this chat. Customer payments will be routed to this address.\n\nCheck that the address is copied exactly.",
	walletInvalidHint: "⚠️ %s — give it another shot.",

	invoicePickWallet:   "<b>New invoice</b>\n\nWhich wallet should get paid?",
	invoicePickNetwork:  "<b>New invoice</b>\nWallet · %s\n\nWhich network is this invoice for?",
	invoiceStep1:        "<b>New invoice</b> · step 1 of 3\nWallet · %s\n\nWhat are you charging for? Send the title.",
	invoiceStep2:        "<b>New invoice</b> · step 2 of 3\nWallet · %s\nTitle · %s\n\nHow much, in USD? Send the amount.",
	invoiceStep3:        "<b>New invoice</b> · step 3 of 3\nWallet · %s\nTitle · %s\nAmount · %s USD\n\nHow long should this link stay live?",
	invoiceTitleEmpty:   "A title can't be empty — send a few words.",
	invoiceAmountBad:    "That's not a valid amount. Send a positive number in USD, like 49.90.",
	invoiceCreated:      "✅ <b>Invoice created successfully</b>\n\nID: <code>%s</code>\nPurpose: %s\nAmount: %s USD\nNetwork: %s\nValid until: %s\n\nCopy the link below and send it to your customer:\n<code>%s</code>",
	invoiceTrialReached: "The trial links are spent. Pick Merchant for simple payment links, or Developer if you want API and webhooks too.",

	plansTitle:      "⭐ <b>recv plans</b>",
	plansBody:       "0% turnover fees. Funds go straight to your wallet. Pick the amount of machinery you need.",
	plansCurrent:    "Current · %s until %s",
	planLine:        "<b>%s</b> · $%s / 30 days\n%s",
	planMerchant:    "Payment links, Telegram flow, manual review.",
	planDeveloper:   "Full API, webhooks, idempotency, MCP tools.",
	planBusiness:    "Teams, audit logs, higher limits, priority workflow.",
	planPickNetwork: "<b>%s</b> · $%s / 30 days\n\n%s\n\nChoose the network for this payment:",
	checkoutCreated: "✅ <b>%s checkout is ready</b>\n\nInvoice %s\n%s %s · 30 days\n\nPay below. After confirmation the plan turns on automatically.",

	markedPaid:    "✅ Invoice %s marked as paid. Nice.",
	keptUnderpaid: "⏳ Invoice %s left open. We'll watch for the top-up.",
	keptReview:    "🔍 Invoice %s stays in manual review.",

	languageTitle: "🌐 <b>Language</b>\n\nThis applies everywhere — bot, app and payment alerts stay in sync.",

	reminderNoWallet:        "<b>Your recv account is almost ready.</b>\n\nYou are one step away from accepting crypto payments. Add your wallet address to create your first invoice. Your funds always remain under your control.",
	reminderNoWallet2:       "<b>Need help with setup?</b>\n\nAdding a wallet is safe: we use it only to route payments directly to you. Choose a network and send the address to start.",
	reminderNoWallet3:       "💬 <b>Need help setting up your wallet?</b>\n\nWe noticed you haven't added a wallet yet. If you have any questions or face any issues, reach out to our support at @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Self-custody is freedom</b>\n\nUnlike traditional payment gateways, recv goes straight to your wallet. You keep 100% of your earnings. Set up your wallet now!",
	reminderNoWallet5:       "📞 <b>Let's set it up together</b>\n\nStill haven't added a wallet? It's okay if you are new to crypto. Message @recvmoneysupport and we'll guide you step by step!",
	reminderNoInvoice:       "<b>Your wallet is connected and ready to receive payments.</b>\n\nCreate your first test invoice now to see how easily your customers can complete payment.",
	reminderNoInvoice2:      "⚡ <b>Start accepting USDT today!</b>\n\nYour payout wallet is configured and ready. Generate a checkout link right here in the chat and send it to your clients.",
	reminderNoInvoice3:      "🙋 <b>Stuck on creating your first invoice?</b>\n\nWe are here to help! If you have custom requirements or questions about integrations, contact our support team at @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Accept USDT in 10 seconds</b>\n\nReady to get paid? Type /invoice right now to generate your first secure payment link.",
	reminderNoInvoice5:      "⚙️ <b>Custom integration?</b>\n\nIf you need APIs, custom bots, webhooks, or shopping cart plugins, reach out to @recvmoneysupport and we will build it for you.",
	reminderTrialExhausted:  "⚠️ <b>Your trial has ended.</b>\n\nYou have used the free invoice limit. To keep accepting payments without interruption and access advanced analytics, activate the right plan.",
	reminderTrialExhausted2: "<b>Do not miss customer payments.</b>\n\nNew payment acceptance is paused. Switch to Merchant, Business or Developer to restore full workspace functionality.",
	reminderTrialExhausted3: "💬 <b>Custom limits or questions?</b>\n\nIf you have a high volume, special requirements, or want to discuss pricing, chat with us at @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Need help with checkouts?</b>\n\nYour checkout link has expired unpaid. Let us know if you need help testing the payment flow or setting up your integration!",
	reminderExpired2:        "🔄 <b>Give it another try!</b>\n\nCreate a new checkout link and try paying it yourself using a test network or real USDT to see how fast and easy the payment confirmation works!",
	reminderExpired3:        "💬 <b>Need help testing checkouts?</b>\n\nIf you have questions about payment confirmation or fees, feel free to ask our support team at @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Need webhooks or integration help?</b>\n\nIf you're having issues with payment callbacks, API, or just testing flows, let's look at it. Message @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Let's make checkout work</b>\n\nWe want to make sure you successfully receive your first payment. Reach out to @recvmoneysupport for help.",
	reminderInactive:        "<b>We noticed you have not created new invoices recently.</b>\n\nrecv has new business features available for your workspace. Open the app to issue an invoice or review current statistics.",
	reminderInactive2:       "<b>We noticed you have not created new invoices recently.</b>\n\nrecv has new business features available for your workspace. Open the app to issue an invoice or review current statistics.",
	reminderInactive3:       "👋 <b>We miss you!</b>\n\nYour automated payment flow is still waiting for you. Create a checkout link now or let us know at @recvmoneysupport if you have any feedback!",
	reminderInactive4:       "🚀 <b>Accept payments directly in Telegram</b>\n\nOur Telegram Mini App and bot make it easier than ever to accept USDT. Start a new checkout link today.",
	reminderInactive5:       "🎁 <b>Have feedback for us?</b>\n\nWe'd love to hear how we can improve. Reach out to @recvmoneysupport to share feedback or request custom features.",

	toastWalletDisabled:      "Wallet removed",
	toastActionFailed:        "Something went wrong",
	toastWaitingTopUp:        "Watching for top-up",
	toastMarkedPaid:          "Marked as paid",
	toastLeftReview:          "Left in review",
	toastPlanCheckoutCreated: "Checkout ready",
	toastLanguageSet:         "Language updated",
	toastUnknownAction:       "Unknown action",
}

var ruCopy = botCopy{
	lang: "ru",

	homeTitle:      "<b>recv</b> — платежи на автопилоте",
	homeWorkspace:  "Воркспейс · %s",
	homePlan:       "План · %s",
	homeWallets:    "Кошельки для выплат · %d",
	homeLatest:     "Последний счёт · %s",
	homeNoInvoices: "Счетов пока нет — сейчас исправим.",
	homeTagline:    "Ссылки на оплату, кошельки, тариф, последние счета — вся касса прямо в чате.",
	homePlanActive: "⭐ %s активен до %s",
	homeTrialLeft:  "Пробный период · осталось %d бесплатных счетов",

	startTitle: "<b>Добро пожаловать в recv</b> — Ваш некастодиальный криптоэквайринг.",
	startBody:  "Принимайте платежи в USDT и других криптовалютах напрямую в Telegram. Никаких посредников, холдов и скрытых комиссий — средства поступают мгновенно на Ваш личный кошелёк.",
	startProof: "Настройте приём платежей за 1 минуту.",

	btnNewInvoice:      "＋ Новый счёт",
	btnRecentInvoices:  "🧾 Последние",
	btnWallets:         "👛 Кошельки",
	btnPlans:           "⭐ Тарифы",
	btnExtendPlan:      "⭐ Продлить тариф",
	btnHome:            "← Домой",
	btnBack:            "← Назад",
	btnCancel:          "✕ Отмена",
	btnLanguage:        "🌐 Язык",
	btnOpenCheckout:    "💳 Открыть оплату",
	btnOpenConsole:     "↗ Попробовать Mini app",
	btnOpenStats:       "📊 Статистика в Mini App",
	btnPricing:         "Тарифы на сайте",
	btnDocs:            "Документация",
	btnSetWallet:       "Указать %s",
	btnAddWallet:       "➕ Привязать кошелёк",
	btnDisable:         "Убрать %s",
	btnNewInvoiceShort: "＋ Ещё один",
	btnPayPlan:         "Оплатить %s",
	btnStartSetup:      "⚙️ Настроить кошелёк",
	btnHowPlans:        "Сколько это стоит?",
	minuteSuffix:       "мин",

	loginTitle: "🔑 <b>Вход через браузер</b>",
	loginSteps: "1. Откройте страницу входа recv в браузере.\n2. Введите свой @username.\n3. Нажмите «Получить код».\n4. Вставьте код, который придёт сюда. Готово.",

	unknownCommand: "Я понимаю /invoice, /invoices, /wallets, /plans и /language. Но кнопками быстрее.",

	invoicesTitle: "🧾 <b>Последние счета</b>",
	invoicesEmpty: "Счетов пока нет. Создайте первый здесь и отправьте покупателю ссылку на оплату.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Кошельки для выплат</b>",
	walletsEmpty:      "Кошельков пока нет. Добавьте — деньги пойдут напрямую вам, recv их не касается.",
	walletsSaved:      "✅ Кошелёк сохранён.",
	walletsDisabled:   "Кошелёк убран.",
	walletsAddFirst:   "<b>Для создания счёта необходим кошелёк.</b>\n\nЧтобы Ваши клиенты могли оплатить счёт, а Вы — получить средства, пожалуйста, привяжите кошелёк для выплат. Это займет несколько секунд.",
	walletPromptEVM:   "<b>Подключение кошелька: EVM</b>\n\nПожалуйста, отправьте в чат адрес Вашего EVM-кошелька. На этот адрес будут автоматически поступать платежи клиентов в поддерживаемых EVM-сетях.\n\nПример: <code>0x...</code>\n\nУбедитесь, что копируете точный адрес.",
	walletPromptSOL:   "<b>Подключение кошелька: Solana</b>\n\nПожалуйста, отправьте в чат адрес Вашего кошелька в сети Solana. На этот адрес будут автоматически поступать платежи клиентов в Solana.\n\nПример: <code>So...</code>\n\nУбедитесь, что копируете точный адрес.",
	walletPromptTRON:  "<b>Подключение кошелька: TRON (TRC-20)</b>\n\nПожалуйста, отправьте в чат адрес Вашего кошелька в сети TRON.\nНа этот адрес будут автоматически поступать все платежи от Ваших клиентов.\n\nПример: <code>T...</code>\n\nУбедитесь, что копируете точный адрес.",
	walletPromptOther: "<b>Подключение кошелька: %s</b>\n\nПожалуйста, отправьте в чат адрес Вашего кошелька. На этот адрес будут автоматически поступать платежи клиентов.\n\nУбедитесь, что копируете точный адрес.",
	walletInvalidHint: "⚠️ %s — попробуйте ещё раз.",

	invoicePickWallet:   "<b>Новый счёт</b>\n\nНа какой кошелёк принять оплату?",
	invoicePickNetwork:  "<b>Новый счёт</b>\nКошелёк · %s\n\nВ какой сети выставить счёт?",
	invoiceStep1:        "<b>Новый счёт</b> · шаг 1 из 3\nКошелёк · %s\n\nЗа что берём оплату? Пришлите название.",
	invoiceStep2:        "<b>Новый счёт</b> · шаг 2 из 3\nКошелёк · %s\nНазвание · %s\n\nСколько в USD? Пришлите сумму.",
	invoiceStep3:        "<b>Новый счёт</b> · шаг 3 из 3\nКошелёк · %s\nНазвание · %s\nСумма · %s USD\n\nСколько ссылка должна быть активна?",
	invoiceTitleEmpty:   "Название не может быть пустым — пришлите пару слов.",
	invoiceAmountBad:    "Это не похоже на сумму. Пришлите положительное число в USD, например 49.90.",
	invoiceCreated:      "✅ <b>Счёт успешно создан</b>\n\nID: <code>%s</code>\nНазначение: %s\nСумма: %s USD\nСеть: %s\nДействителен до: %s\n\nСкопируйте ссылку ниже и отправьте её клиенту для оплаты:\n<code>%s</code>",
	invoiceTrialReached: "Пробные ссылки закончились. Берите Merchant для обычных оплат или Developer, если нужны API и вебхуки.",

	plansTitle:      "⭐ <b>Тарифы recv</b>",
	plansBody:       "0% комиссии с оборота. Деньги идут сразу на ваш кошелёк. Выберите уровень под вашу механику.",
	plansCurrent:    "Сейчас · %s до %s",
	planLine:        "<b>%s</b> · $%s / 30 дней\n%s",
	planMerchant:    "Платёжные ссылки, Telegram-flow, ручная проверка.",
	planDeveloper:   "Полный API, вебхуки, идемпотентность, MCP-инструменты.",
	planBusiness:    "Команды, audit logs, высокие лимиты, приоритетный workflow.",
	planPickNetwork: "<b>%s</b> · $%s / 30 дней\n\n%s\n\nВыберите сеть для оплаты:",
	checkoutCreated: "✅ <b>Счёт на %s готов</b>\n\nИнвойс %s\n%s %s · 30 дней\n\nОплатите ниже. После подтверждения тариф включится автоматически.",

	markedPaid:    "✅ Счёт %s отмечен оплаченным. Отлично.",
	keptUnderpaid: "⏳ Счёт %s оставлен открытым. Ждём доплату.",
	keptReview:    "🔍 Счёт %s остаётся на ручной проверке.",

	languageTitle: "🌐 <b>Язык</b>\n\nПрименяется везде — бот, приложение и уведомления об оплате синхронизированы.",

	reminderNoWallet:        "<b>Ваш аккаунт recv почти готов к работе.</b>\n\nВы находитесь в одном шаге от приёма криптоплатежей. Добавьте адрес Вашего кошелька, чтобы создать первый счёт. Ваши средства всегда остаются под Вашим контролем.",
	reminderNoWallet2:       "<b>Возникли сложности с настройкой?</b>\n\nДобавление кошелька безопасно: мы используем его только для маршрутизации платежей напрямую Вам. Выберите сеть и отправьте адрес, чтобы начать.",
	reminderNoWallet3:       "💬 <b>Нужна помощь с настройкой кошелька?</b>\n\nМы заметили, что вы ещё не добавили кошелёк. Если у вас возникли вопросы или трудности, напишите в нашу поддержку @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Некастодиальные платежи — это свобода</b>\n\nВ отличие от других систем, recv отправляет средства прямо на ваш личный кошелёк. 100% дохода остаётся вам. Привяжите кошелёк прямо сейчас!",
	reminderNoWallet5:       "📞 <b>Давайте настроим кошелёк вместе</b>\n\nВсё ещё не добавили кошелёк? Если вы новичок в крипте, напишите нам в поддержку @recvmoneysupport — мы поможем во всём разобраться!",
	reminderNoInvoice:       "<b>Ваш кошелёк подключен и готов к приёму платежей.</b>\n\nСоздайте первый тестовый счёт прямо сейчас, чтобы увидеть, как легко Ваши клиенты смогут производить оплату.",
	reminderNoInvoice2:      "⚡ <b>Начните принимать USDT уже сегодня!</b>\n\nВаш кошелёк для выплат настроен и готов к работе. Создайте ссылку на оплату прямо в этом чате и отправьте её клиентам.",
	reminderNoInvoice3:      "🙋 <b>Не получается создать первый счёт?</b>\n\nМы поможем! Если у вас есть особые требования или вопросы по интеграции, напишите нашей команде поддержки @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Принимайте USDT за 10 секунд</b>\n\nГотовы получить первую оплату? Напишите /invoice прямо сейчас, чтобы создать ссылку на оплату.",
	reminderNoInvoice5:      "⚙️ <b>Нужна интеграция?</b>\n\nЕсли вам нужны API, вебхуки, кастомные боты или плагины для корзины, напишите в @recvmoneysupport, и мы поможем с интеграцией.",
	reminderTrialExhausted:  "⚠️ <b>Ваш пробный период завершен.</b>\n\nВы успешно использовали лимит бесплатных счетов. Чтобы продолжить принимать платежи без остановок и получить доступ к расширенной аналитике, пожалуйста, активируйте подходящий тарифный план.",
	reminderTrialExhausted2: "<b>Не упускайте платежи от Ваших клиентов.</b>\n\nПриём новых оплат приостановлен. Перейдите на тариф Merchant, Business или Developer, чтобы вернуть полную функциональность Вашего воркспейса.",
	reminderTrialExhausted3: "💬 <b>Индивидуальные условия?</b>\n\nЕсли у вас большие объёмы, особые требования или вопросы по тарифам, напишите нам в @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Нужна помощь со счетами?</b>\n\nСрок оплаты по вашей ссылке истек. Напишите нам, если нужна помощь с тестированием платежей или интеграцией!",
	reminderExpired2:        "🔄 <b>Попробуйте ещё раз!</b>\n\nСоздайте новую ссылку на оплату и попробуйте оплатить её сами в тестовой сети или реальным USDT, чтобы увидеть, как быстро и просто работает подтверждение!",
	reminderExpired3:        "💬 <b>Нужна помощь в тестировании оплаты?</b>\n\nЕсли у вас есть вопросы по поводу подтверждения платежей или комиссий, не стесняйтесь писать нашей поддержке @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Нужна помощь с интеграцией или вебхуками?</b>\n\nЕсли возникли сложности с коллбэками оплаты, API или тестированием, напишите нам в @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Давайте запустим ваши продажи</b>\n\nМы хотим, чтобы вы успешно приняли свой первый платёж. Наша поддержка всегда на связи в @recvmoneysupport.",
	reminderInactive:        "<b>Мы заметили, что Вы давно не создавали новых счетов.</b>\n\nВ recv появились новые функции для Вашего бизнеса. Откройте приложение, чтобы выставить счёт или проверить актуальную статистику.",
	reminderInactive2:       "<b>Мы заметили, что Вы давно не создавали новых счетов.</b>\n\nВ recv появились новые функции для Вашего бизнеса. Откройте приложение, чтобы выставить счёт или проверить актуальную статистику.",
	reminderInactive3:       "👋 <b>Мы скучаем по вам!</b>\n\nВаша автоматическая касса всё ещё ждёт вас. Создайте ссылку на оплату прямо сейчас или поделитесь отзывом с нашей поддержкой @recvmoneysupport!",
	reminderInactive4:       "🚀 <b>Принимайте оплаты прямо в Telegram</b>\n\nНаше Mini App и бот делают приём USDT максимально простым. Создайте новый счёт уже сегодня!",
	reminderInactive5:       "🎁 <b>Поделитесь вашим отзывом</b>\n\nМы хотим сделать сервис лучше. Напишите нам в @recvmoneysupport и расскажите, каких функций вам не хватает!",

	toastWalletDisabled:      "Кошелёк убран",
	toastActionFailed:        "Что-то пошло не так",
	toastWaitingTopUp:        "Ждём доплату",
	toastMarkedPaid:          "Отмечено оплаченным",
	toastLeftReview:          "Оставлено на проверке",
	toastPlanCheckoutCreated: "Счёт готов",
	toastLanguageSet:         "Язык обновлён",
	toastUnknownAction:       "Неизвестное действие",
}

var esCopy = botCopy{
	lang: "es",

	homeTitle:      "<b>recv</b> — pagos en piloto automático",
	homeWorkspace:  "Espacio de trabajo · %s",
	homePlan:       "Plan · %s",
	homeWallets:    "Billeteras de pago · %d",
	homeLatest:     "Última factura · %s",
	homeNoInvoices: "Aún no hay facturas — solucionemos eso.",
	homeTagline:    "Enlaces de pago, billeteras, plan, facturas recientes — toda la caja cabe en este chat.",
	homePlanActive: "⭐ %s activo hasta %s",
	homeTrialLeft:  "Prueba · te quedan %d facturas gratis",

	startTitle: "<b>recv</b> — olvídate de pasarelas complejas. Acepta USDT en Telegram",
	startBody:  "Genera un enlace de pago en 10 segundos y recibe cripto directo a tu billetera. Sin comisiones de tus ventas.",
	startProof: "Las primeras facturas corren por nuestra cuenta. Pasa a un plan de pago cuando empiece a entrar el dinero real.",

	btnNewInvoice:      "＋ Nueva factura",
	btnRecentInvoices:  "🧾 Recientes",
	btnWallets:         "👛 Billeteras",
	btnPlans:           "⭐ Planes",
	btnExtendPlan:      "⭐ Extender plan",
	btnHome:            "← Inicio",
	btnBack:            "← Volver",
	btnCancel:          "✕ Cancelar",
	btnLanguage:        "🌐 Idioma",
	btnOpenCheckout:    "💳 Abrir pago",
	btnOpenConsole:     "↗ Probar Mini app",
	btnOpenStats:       "📊 Estadísticas en Mini app",
	btnPricing:         "Planes en la web",
	btnDocs:            "Docs",
	btnSetWallet:       "Configurar %s",
	btnAddWallet:       "＋ Agregar billetera",
	btnDisable:         "Quitar %s",
	btnNewInvoiceShort: "＋ Una más",
	btnPayPlan:         "Pagar %s",
	btnStartSetup:      "Configurar billetera",
	btnHowPlans:        "¿Cuánto cuesta?",
	minuteSuffix:       "min",

	loginTitle: "🔑 <b>Iniciar sesión en la web</b>",
	loginSteps: "1. Abre la página de inicio de sesión de recv en tu navegador.\n2. Escribe tu @usuario.\n3. Presiona “Obtener código”.\n4. Pega aquí el código que te enviemos. Listo.",

	unknownCommand: "Entiendo /invoice, /invoices, /wallets, /plans y /language. O usa los botones, es más rápido.",

	invoicesTitle: "🧾 <b>Facturas recientes</b>",
	invoicesEmpty: "Aún no hay facturas. Crea una aquí y envía el enlace a tu comprador.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Billeteras de pago</b>",
	walletsEmpty:      "Aún no hay billeteras. Agrega una y el dinero irá directo a ti — recv nunca lo toca.",
	walletsSaved:      "✅ Billetera guardada.",
	walletsDisabled:   "Billetera eliminada.",
	walletsAddFirst:   "Agrega una billetera de pago primero — ahí es donde va el dinero.",
	walletPromptEVM:   "<b>Configura tu billetera EVM</b>\n\nUna sola dirección cubre Ethereum, Base, Arbitrum y BSC. Envíala en tu próximo mensaje.",
	walletPromptSOL:   "<b>Configura tu billetera Solana</b>\n\nEsta dirección recibe tus pagos de stablecoins en Solana. Envíala en tu próximo mensaje.",
	walletPromptTRON:  "<b>Conexión de billetera: TRON (TRC-20)</b>\n\nEnvía en este chat la dirección de tu billetera TRON. Los pagos de tus clientes en TRON se dirigirán a esta dirección.\n\nEjemplo: <code>T...</code>\n\nComprueba que la dirección esté copiada exactamente.",
	walletPromptOther: "<b>Configura tu billetera %s</b>\n\nEnvía la dirección en tu próximo mensaje.",
	walletInvalidHint: "⚠️ %s — inténtalo de nuevo.",

	invoicePickWallet:   "<b>Nueva factura</b>\n\n¿Qué billetera debe recibir el pago?",
	invoicePickNetwork:  "<b>Nueva factura</b>\nBilletera · %s\n\n¿Para qué red es esta factura?",
	invoiceStep1:        "<b>Nueva factura</b> · paso 1 de 3\nBilletera · %s\n\n¿Por qué estás cobrando? Envía el título.",
	invoiceStep2:        "<b>Nueva factura</b> · paso 2 de 3\nBilletera · %s\nTítulo · %s\n\n¿Cuánto, en USD? Envía el monto.",
	invoiceStep3:        "<b>Nueva factura</b> · paso 3 de 3\nBilletera · %s\nTítulo · %s\nMonto · %s USD\n\n¿Cuánto tiempo debe estar activo este enlace?",
	invoiceTitleEmpty:   "El título no puede estar vacío — envía unas palabras.",
	invoiceAmountBad:    "Monto no válido. Envía un número positivo en USD, como 49.90.",
	invoiceCreated:      "✅ <b>Factura creada correctamente</b>\n\nID: <code>%s</code>\nConcepto: %s\nImporte: %s USD\nRed: %s\nVálida hasta: %s\n\nCopia el enlace de abajo y envíalo a tu cliente:\n<code>%s</code>",
	invoiceTrialReached: "Se agotaron los enlaces de prueba. Elige Merchant para enlaces de pago simples, o Developer si quieres API y webhooks.",

	plansTitle:      "⭐ <b>Planes recv</b>",
	plansBody:       "0% de comisiones por volumen. Los fondos van directo a tu billetera. Elige el nivel que necesites.",
	plansCurrent:    "Actual · %s hasta %s",
	planLine:        "<b>%s</b> · $%s / 30 dias\n%s",
	planMerchant:    "Enlaces de pago, flujo de Telegram, revisión manual.",
	planDeveloper:   "API completa, webhooks, idempotencia, herramientas MCP.",
	planBusiness:    "Equipos, registros de auditoría, límites más altos, flujo prioritario.",
	planPickNetwork: "<b>%s</b> · $%s / 30 dias\n\n%s\n\nElige la red para este pago:",
	checkoutCreated: "✅ <b>El pago para %s está listo</b>\n\nFactura %s\n%s %s · 30 dias\n\nPaga abajo. Tras la confirmación, el plan se activa automáticamente.",

	markedPaid:    "✅ Factura %s marcada como pagada. Excelente.",
	keptUnderpaid: "⏳ Factura %s dejada abierta. Esperamos el saldo.",
	keptReview:    "🔍 Factura %s sigue en revisión manual.",

	languageTitle: "🌐 <b>Idioma</b>\n\nEsto se aplica en todas partes — el bot, la app y las alertas de pago se sincronizan.",

	reminderNoWallet:        "👛 <b>Configura tu billetera de pago</b>\n\nAún no has agregado una billetera de pago. Agrégala ahora para recibir pagos en USDT directo a tu dirección de autocustodia.",
	reminderNoWallet2:       "⚠️ <b>¿Aún sin billetera de pago?</b>\n\nSin una billetera, no puedes aceptar cripto. ¡Vincula tu billetera en 10 segundos para empezar a cobrar directamente!",
	reminderNoWallet3:       "💬 <b>¿Necesitas ayuda para configurar tu billetera?</b>\n\nNotamos que no has agregado una billetera. Si tienes dudas o problemas, ¡escríbenos al soporte en @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>La autocustodia es libertad</b>\n\nA diferencia de las pasarelas tradicionales, con recv el dinero va directo a tu billetera. Te quedas con el 100% de tus ventas. ¡Configura tu billetera ya!",
	reminderNoWallet5:       "📞 <b>Configurémosla juntos</b>\n\n¿Aún no has agregado una billetera? No te preocupes si eres nuevo en cripto. Escríbenos a @recvmoneysupport y te guiaremos paso a paso.",
	reminderNoInvoice:       "＋ <b>Crea tu primera factura</b>\n\nYa configuraste tu billetera, ¡pero no has creado ninguna factura! Genera un enlace de pago en 10 segundos y compártelo con tus clientes.",
	reminderNoInvoice2:      "⚡ <b>¡Empieza a aceptar USDT hoy mismo!</b>\n\nTu billetera de pago está lista. Crea un enlace de pago aquí mismo en el chat y envíaselo a tus clientes.",
	reminderNoInvoice3:      "🙋 <b>¿Problemas para crear tu primera factura?</b>\n\n¡Estamos para ayudarte! Si tienes requisitos personalizados o preguntas sobre integraciones, contacta a nuestro equipo en @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Acepta USDT en 10 segundos</b>\n\n¿Listo para cobrar? Escribe /invoice ahora mismo para generar tu primer enlace de pago seguro.",
	reminderNoInvoice5:      "⚙️ <b>¿Integración personalizada?</b>\n\nSi necesitas APIs, bots a medida, webhooks o módulos para carritos de compra, contacta a @recvmoneysupport y lo construiremos para ti.",
	reminderTrialExhausted:  "💡 <b>Límite de prueba alcanzado</b>\n\nHas agotado tus facturas de prueba gratuitas. Elige un plan para seguir aceptando USDT sin fricciones en el pago.",
	reminderTrialExhausted2: "💰 <b>Sin comisiones por volumen</b>\n\nCon los planes de recv, pagas una tarifa fija mensual y te quedas con el 100% de tus ingresos. ¡Desbloquea tu plan hoy!",
	reminderTrialExhausted3: "💬 <b>¿Preguntas o límites personalizados?</b>\n\nSi manejas mucho volumen, tienes requisitos especiales o quieres hablar de precios, escríbenos a @recvmoneysupport.",
	reminderExpired:         "⏳ <b>¿Necesitas ayuda con los pagos?</b>\n\nTu enlace de pago expiró sin pagarse. ¡Avísanos si necesitas ayuda probando el flujo o configurando tu integración!",
	reminderExpired2:        "🔄 <b>¡Inténtalo de nuevo!</b>\n\nCrea un nuevo enlace de pago y pruébalo tú mismo usando una red de prueba o USDT reales para ver qué rápido y fácil se confirma.",
	reminderExpired3:        "💬 <b>¿Dudas al probar los pagos?</b>\n\nSi tienes preguntas sobre la confirmación de pagos o comisiones, no dudes en consultar a nuestro soporte en @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>¿Ayuda con webhooks o integraciones?</b>\n\nSi tienes problemas con callbacks de pago, APIs o pruebas de flujo, lo revisamos juntos. ¡Escríbenos a @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Hagamos que funcione</b>\n\nQueremos asegurarnos de que recibas tu primer pago con éxito. Contacta a @recvmoneysupport para ayudarte.",
	reminderInactive:        "📈 <b>Mantén activas tus ventas</b>\n\nHa pasado una semana desde tu último enlace de pago. Automatiza y simplifica tus cobros con recv.",
	reminderInactive2:       "⭐ <b>¡Mejora tu conversión de pago!</b>\n\n¿Sabías que los enlaces de recv se pueden integrar en webs, apps y Mini Apps de Telegram? Escribe a @recvmoneysupport para tips de configuración.",
	reminderInactive3:       "👋 <b>¡Te extrañamos!</b>\n\nTu sistema de pagos automático te está esperando. Crea un enlace ahora o cuéntanos qué opinas en @recvmoneysupport.",
	reminderInactive4:       "🚀 <b>Cobra directamente en Telegram</b>\n\nNuestra Mini App y bot hacen que aceptar USDT sea más fácil que nunca. Crea un nuevo enlace de pago hoy.",
	reminderInactive5:       "🎁 <b>¿Tienes comentarios para nosotros?</b>\n\nNos encantaría saber cómo mejorar. Escríbenos a @recvmoneysupport para darnos tu feedback o pedir funciones a medida.",

	toastWalletDisabled:      "Billetera eliminada",
	toastActionFailed:        "Algo salió mal",
	toastWaitingTopUp:        "Esperando saldo",
	toastMarkedPaid:          "Marcado como pagado",
	toastLeftReview:          "Dejado en revisión",
	toastPlanCheckoutCreated: "Pago listo",
	toastLanguageSet:         "Idioma actualizado",
	toastUnknownAction:       "Acción desconocida",
}

var ptCopy = botCopy{
	lang: "pt",

	homeTitle:      "<b>recv</b> — pagamentos no piloto automático",
	homeWorkspace:  "Espaço de trabalho · %s",
	homePlan:       "Plano · %s",
	homeWallets:    "Carteiras de saque · %d",
	homeLatest:     "Última fatura · %s",
	homeNoInvoices: "Sem faturas ainda — vamos resolver isso.",
	homeTagline:    "Links de pagamento, carteiras, plano, faturas recentes — o caixa inteiro cabe neste chat.",
	homePlanActive: "⭐ %s ativo até %s",
	homeTrialLeft:  "Teste · restam %d faturas grátis",

	startTitle: "<b>recv</b> — esqueça intermediários complexos. Aceite USDT no Telegram",
	startBody:  "Gere um link de pagamento em 10 segundos e receba cripto direto na sua carteira. Sem taxas sobre suas vendas.",
	startProof: "As primeiras faturas são por nossa conta. Mude para um plano pago apenas quando o faturamento real começar.",

	btnNewInvoice:      "＋ Nova fatura",
	btnRecentInvoices:  "🧾 Recentes",
	btnWallets:         "👛 Carteiras",
	btnPlans:           "⭐ Planos",
	btnExtendPlan:      "⭐ Renovar plano",
	btnHome:            "← Início",
	btnBack:            "← Voltar",
	btnCancel:          "✕ Cancelar",
	btnLanguage:        "🌐 Idioma",
	btnOpenCheckout:    "💳 Abrir pagamento",
	btnOpenConsole:     "↗ Testar Mini app",
	btnOpenStats:       "📊 Estatísticas no Mini app",
	btnPricing:         "Planos no site",
	btnDocs:            "Docs",
	btnSetWallet:       "Configurar %s",
	btnAddWallet:       "＋ Vincular carteira",
	btnDisable:         "Remover %s",
	btnNewInvoiceShort: "＋ Mais um",
	btnPayPlan:         "Pagar %s",
	btnStartSetup:      "Configurar carteira",
	btnHowPlans:        "Quanto custa?",
	minuteSuffix:       "min",

	loginTitle: "🔑 <b>Entrar no site</b>",
	loginSteps: "1. Abra a página de login do recv no seu navegador.\n2. Digite seu @usuário.\n3. Toque em “Obter código”.\n4. Cole o código que enviarmos aqui. Pronto.",

	unknownCommand: "Eu entendo /invoice, /invoices, /wallets, /plans e /language. Ou use os botões, é mais rápido.",

	invoicesTitle: "🧾 <b>Faturas recentes</b>",
	invoicesEmpty: "Nenhuma fatura ainda. Crie uma aqui e envie o link para o comprador.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Carteiras de saque</b>",
	walletsEmpty:      "Nenhuma carteira ainda. Adicione uma e o dinheiro vai direto para você — o recv nunca toca nele.",
	walletsSaved:      "✅ Carteira salva.",
	walletsDisabled:   "Carteira removida.",
	walletsAddFirst:   "Adicione uma carteira de saque primeiro — é para lá que vai o dinheiro.",
	walletPromptEVM:   "<b>Configure sua carteira EVM</b>\n\nUm único endereço serve para Ethereum, Base, Arbitrum e BSC. Envie na próxima mensagem.",
	walletPromptSOL:   "<b>Configure sua carteira Solana</b>\n\nEste endereço receberá seus pagamentos de stablecoins na Solana. Envie na próxima mensagem.",
	walletPromptTRON:  "<b>Conexão de carteira: TRON (TRC-20)</b>\n\nEnvie neste chat o endereço da sua carteira TRON. Os pagamentos dos clientes em TRON serão roteados para este endereço.\n\nExemplo: <code>T...</code>\n\nConfira se o endereço foi copiado exatamente.",
	walletPromptOther: "<b>Configure sua carteira %s</b>\n\nEnvie o endereço na próxima mensagem.",
	walletInvalidHint: "⚠️ %s — tente novamente.",

	invoicePickWallet:   "<b>Nova fatura</b>\n\nQual carteira deve receber o pagamento?",
	invoicePickNetwork:  "<b>Nova fatura</b>\nCarteira · %s\n\nEm qual rede deseja faturar?",
	invoiceStep1:        "<b>Nova fatura</b> · etapa 1 de 3\nCarteira · %s\n\nO que você está cobrando? Envie o título.",
	invoiceStep2:        "<b>Nova fatura</b> · etapa 2 de 3\nCarteira · %s\nTítulo · %s\n\nQuanto, em USD? Envie o valor.",
	invoiceStep3:        "<b>Nova fatura</b> · etapa 3 de 3\nCarteira · %s\nTítulo · %s\nValor · %s USD\n\nPor quanto tempo o link deve ficar ativo?",
	invoiceTitleEmpty:   "O título não pode ser vazio — envie algumas palavras.",
	invoiceAmountBad:    "Valor inválido. Envie um número positivo em USD, como 49.90.",
	invoiceCreated:      "✅ <b>Fatura criada com sucesso</b>\n\nID: <code>%s</code>\nFinalidade: %s\nValor: %s USD\nRede: %s\nVálida até: %s\n\nCopie o link abaixo e envie ao cliente:\n<code>%s</code>",
	invoiceTrialReached: "Os links de teste acabaram. Escolha Merchant para links simples, ou Developer para ter API e webhooks.",

	plansTitle:      "⭐ <b>Planos recv</b>",
	plansBody:       "0% de taxas de volume. Os fundos vão direto para sua carteira. Escolha o plano ideal para você.",
	plansCurrent:    "Atual · %s até %s",
	planLine:        "<b>%s</b> · $%s / 30 dias\n%s",
	planMerchant:    "Links de pagamento, fluxo no Telegram, revisão manual.",
	planDeveloper:   "API completa, webhooks, idempotencia, ferramentas MCP.",
	planBusiness:    "Equipes, logs de auditoria, limites maiores, fluxo prioritário.",
	planPickNetwork: "<b>%s</b> · $%s / 30 dias\n\n%s\n\nEscolha a rede para o pagamento:",
	checkoutCreated: "✅ <b>O pagamento para %s está pronto</b>\n\nFatura %s\n%s %s · 30 dias\n\nPague abaixo. Após a confirmação, o plano ativa automaticamente.",

	markedPaid:    "✅ Fatura %s marcada como paga. Ótimo.",
	keptUnderpaid: "⏳ Fatura %s mantida aberta. Aguardando o restante.",
	keptReview:    "🔍 Fatura %s mantida em revisão manual.",

	languageTitle: "🌐 <b>Idioma</b>\n\nIsso se aplica em todo lugar — bot, app e alertas de pagamento ficam sincronizados.",

	reminderNoWallet:        "👛 <b>Configure sua carteira de saque</b>\n\nVocê ainda não adicionou uma carteira de saque. Adicione agora para receber pagamentos em USDT direto na sua carteira de autocustodia.",
	reminderNoWallet2:       "⚠️ <b>Ainda sem carteira de saque?</b>\n\nSem carteira, você não pode receber cripto. Vincule sua carteira em 10 segundos para começar a receber pagamentos direto no seu endereço!",
	reminderNoWallet3:       "💬 <b>Precisa de ajuda para configurar sua carteira?</b>\n\nNotamos que você ainda não adicionou uma carteira. Em caso de dúvidas ou problemas, fale com o suporte em @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Autocustodia é liberdade</b>\n\nDiferente de intermediários tradicionais, o recv envia direto para sua carteira. 100% das vendas são suas. Configure sua carteira agora!",
	reminderNoWallet5:       "📞 <b>Vamos configurar juntos</b>\n\nAinda sem carteira? Tudo bem se você é novo em cripto. Envie uma mensagem para @recvmoneysupport e te guiaremos passo a passo!",
	reminderNoInvoice:       "＋ <b>Crie sua primeira fatura</b>\n\nSua carteira está configurada, mas você ainda não criou nenhuma fatura! Gere um link de pagamento em 10 segundos e envie aos seus clientes.",
	reminderNoInvoice2:      "⚡ <b>Comece a aceitar USDT hoje mesmo!</b>\n\nSua carteira de saque está pronta. Crie um link de pagamento direto no chat e envie para os seus clientes.",
	reminderNoInvoice3:      "🙋 <b>Dificuldades para criar sua primeira fatura?</b>\n\nEstamos aqui para ajudar! Se tiver requisitos especiais ou dúvidas sobre integrações, fale com o suporte em @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Receba USDT em 10 segundos</b>\n\nPronto para receber? Digite /invoice agora mesmo para gerar seu primeiro link de pagamento seguro.",
	reminderNoInvoice5:      "⚙️ <b>Integração personalizada?</b>\n\nSe você precisa de APIs, bots sob medida, webhooks ou plugins de carrinho, fale com o suporte em @recvmoneysupport e nós desenvolvemos para você.",
	reminderTrialExhausted:  "💡 <b>Limite de teste atingido</b>\n\nVocê esgotou suas faturas de teste grátis. Escolha um plano para voltar a receber USDT sem fricção no checkout.",
	reminderTrialExhausted2: "💰 <b>Sem taxas sobre vendas</b>\n\nCom os planos do recv, você paga um valor fixo mensal e fica com 100% do seu faturamento. Libere seu plano hoje!",
	reminderTrialExhausted3: "💬 <b>Limites personalizados ou dúvidas?</b>\n\nSe você tem grande volume de vendas, requisitos específicos ou quer negociar preços, fale conosco em @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Precisa de ajuda com faturas?</b>\n\nSeu link de pagamento expirou sem ser pago. Fale conosco se precisar de ajuda para testar o fluxo ou configurar sua integração!",
	reminderExpired2:        "🔄 <b>Tente novamente!</b>\n\nCrie uma nova fatura e tente pagar você mesmo em uma rede de teste ou USDT real para ver como a confirmação é rápida e fácil!",
	reminderExpired3:        "💬 <b>Dúvidas ao testar pagamentos?</b>\n\nSe tiver dúvidas sobre confirmação de pagamentos ou taxas, sinta-se à vontade para perguntar ao suporte em @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Ajuda com webhooks ou integração?</b>\n\nSe estiver tendo problemas com callbacks de pagamento, API ou testes de fluxo, fale com o suporte em @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Vamos fazer o checkout funcionar</b>\n\nQueremos garantir que você receba seu primeiro pagamento com sucesso. Entre em contato com @recvmoneysupport para ajudar.",
	reminderInactive:        "📈 <b>Mantenha as vendas ativas</b>\n\nJá se passou uma semana desde a sua última atividade com links de pagamento. Automatize seu fluxo de caixa com o recv.",
	reminderInactive2:       "⭐ <b>Aumente a conversão do seu checkout!</b>\n\nVocê sabia que links de pagamento recv podem ser integrados em sites, apps e Mini Apps do Telegram? Fale com o suporte em @recvmoneysupport para dicas.",
	reminderInactive3:       "👋 <b>Sentimos sua falta!</b>\n\nSeu fluxo de pagamentos automático ainda está esperando por você. Crie uma fatura agora ou fale conosco em @recvmoneysupport se tiver sugestões!",
	reminderInactive4:       "🚀 <b>Receba diretamente no Telegram</b>\n\nNosso Mini App e bot tornam aceitar USDT mais fácil do que nunca. Crie um novo link de pagamento hoje.",
	reminderInactive5:       "🎁 <b>Tem algum feedback para nós?</b>\n\nAdoraríamos saber como podemos melhorar. Entre em contato com @recvmoneysupport para compartilhar ideias ou pedir recursos.",

	toastWalletDisabled:      "Carteira removida",
	toastActionFailed:        "Algo deu errado",
	toastWaitingTopUp:        "Aguardando restante",
	toastMarkedPaid:          "Marcado como pago",
	toastLeftReview:          "Mantido em revisão",
	toastPlanCheckoutCreated: "Pagamento pronto",
	toastLanguageSet:         "Idioma atualizado",
	toastUnknownAction:       "Ação desconhecida",
}

var deCopy = botCopy{
	lang: "de",

	homeTitle:      "<b>recv</b> — Zahlungen auf Autopilot",
	homeWorkspace:  "Workspace · %s",
	homePlan:       "Tarif · %s",
	homeWallets:    "Auszahlungs-Wallets · %d",
	homeLatest:     "Letzte Rechnung · %s",
	homeNoInvoices: "Noch keine Rechnungen — das lässt sich ändern.",
	homeTagline:    "Zahlungslinks, Wallets, Tarife, letzte Rechnungen — alles in diesem Chat.",
	homePlanActive: "⭐ %s aktiv bis %s",
	homeTrialLeft:  "Testphase · noch %d kostenlose Rechnungen",

	startTitle: "<b>Willkommen bei recv</b> — Non-Custodial Krypto-Acquiring für Ihr Unternehmen",
	startBody:  "Akzeptieren Sie USDT und andere Krypto-Zahlungen direkt in Telegram. Keine Zwischenhändler, Holds oder versteckten Gebühren — Zahlungen gehen direkt auf Ihre eigene Wallet.",
	startProof: "Zahlungsempfang in 1 Minute einrichten.",

	btnNewInvoice:      "＋ Neue Rechnung",
	btnRecentInvoices:  "🧾 Letzte",
	btnWallets:         "👛 Wallets",
	btnPlans:           "⭐ Tarife",
	btnExtendPlan:      "⭐ Tarif verlängern",
	btnHome:            "← Home",
	btnBack:            "← Zurück",
	btnCancel:          "✕ Abbrechen",
	btnLanguage:        "🌐 Sprache",
	btnOpenCheckout:    "💳 Checkout öffnen",
	btnOpenConsole:     "↗ Mini-App testen",
	btnOpenStats:       "📊 Statistiken in Mini-App",
	btnPricing:         "Tarife auf Website",
	btnDocs:            "Doku",
	btnSetWallet:       "%s einrichten",
	btnAddWallet:       "＋ Wallet hinzufügen",
	btnDisable:         "%s entfernen",
	btnNewInvoiceShort: "＋ Noch eine",
	btnPayPlan:         "%s bezahlen",
	btnStartSetup:      "⚙️ Wallet einrichten",
	btnHowPlans:        "Was kostet das?",
	minuteSuffix:       "Min.",

	loginTitle: "🔑 <b>Im Web anmelden</b>",
	loginSteps: "1. Öffnen Sie die recv-Anmeldeseite im Browser.\n2. Geben Sie Ihren @username ein.\n3. Tippen Sie auf „Get code“.\n4. Fügen Sie den erhaltenen Code hier ein. Fertig.",

	unknownCommand: "Ich kenne /invoice, /invoices, /wallets, /plans und /language. Oder nutzen Sie die Buttons — das geht schneller.",

	invoicesTitle: "🧾 <b>Letzte Rechnungen</b>",
	invoicesEmpty: "Noch keine Rechnungen. Erstellen Sie eine und senden Sie den Checkout-Link an den Käufer.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:    "👛 <b>Auszahlungs-Wallets</b>",
	walletsEmpty:    "Noch keine Wallets. Fügen Sie eine hinzu und Zahlungen landen direkt bei Ihnen — recv berührt sie nicht.",
	walletsSaved:    "✅ Wallet gespeichert.",
	walletsDisabled: "Wallet entfernt.",
	walletsAddFirst: "<b>Eine Auszahlungs-Wallet ist erforderlich, um eine Rechnung zu erstellen.</b>\n\nDamit Kunden Rechnungen bezahlen können und das Geld bei Ihnen ankommt, verbinden Sie bitte zuerst eine Auszahlungs-Wallet. Das dauert nur wenige Sekunden.",
	walletPromptEVM: "<b>Wallet-Verbindung: EVM</b>\n\nBitte senden Sie Ihre EVM-Wallet-Adresse in diesen Chat. Kundenzahlungen in den unterstützten EVM-Netzwerken werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>0x...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletPromptSOL: "<b>Wallet-Verbindung: Solana</b>\n\nBitte senden Sie Ihre Solana-Wallet-Adresse in diesen Chat. Kundenzahlungen auf Solana werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>So...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletPromptTRON: "<b>Wallet-Verbindung: TRON (TRC-20)</b>\n\nBitte senden Sie Ihre TRON-Wallet-Adresse in diesen Chat. Kundenzahlungen auf TRON werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>T...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletPromptOther: "<b>Wallet-Verbindung: %s</b>\n\nBitte senden Sie Ihre Wallet-Adresse in diesen Chat. Kundenzahlungen werden an diese Adresse weitergeleitet.\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletInvalidHint: "⚠️ %s — versuchen Sie es noch einmal.",

	invoicePickWallet:   "<b>Neue Rechnung</b>\n\nWelche Wallet soll die Zahlung erhalten?",
	invoicePickNetwork:  "<b>Neue Rechnung</b>\nWallet · %s\n\nFür welches Netzwerk ist diese Rechnung?",
	invoiceStep1:        "<b>Neue Rechnung</b> · Schritt 1 von 3\nWallet · %s\n\nWofür stellen Sie die Rechnung aus? Senden Sie den Titel.",
	invoiceStep2:        "<b>Neue Rechnung</b> · Schritt 2 von 3\nWallet · %s\nTitel · %s\n\nWie hoch ist der Betrag in USD? Senden Sie den Betrag.",
	invoiceStep3:        "<b>Neue Rechnung</b> · Schritt 3 von 3\nWallet · %s\nTitel · %s\nBetrag · %s USD\n\nWie lange soll dieser Link aktiv bleiben?",
	invoiceTitleEmpty:   "Der Titel darf nicht leer sein — senden Sie ein paar Worte.",
	invoiceAmountBad:    "Das ist kein gültiger Betrag. Senden Sie einen positiven Betrag in USD, z. B. 49.90.",
	invoiceCreated:      "✅ <b>Rechnung erfolgreich erstellt</b>\n\nID: <code>%s</code>\nZweck: %s\nBetrag: %s USD\nNetzwerk: %s\nGültig bis: %s\n\nKopieren Sie den folgenden Link und senden Sie ihn an Ihren Kunden:\n<code>%s</code>",
	invoiceTrialReached: "Die Test-Links sind aufgebraucht. Wählen Sie Merchant für einfache Zahlungslinks oder Developer, wenn Sie zusätzlich API und Webhooks nutzen möchten.",

	plansTitle:      "⭐ <b>recv-Tarife</b>",
	plansBody:       "0% Umsatzgebühren. Zahlungen gehen direkt auf Ihre Wallet. Wählen Sie den passenden Leistungsumfang.",
	plansCurrent:    "Aktuell · %s bis %s",
	planLine:        "<b>%s</b> · $%s / 30 Tage\n%s",
	planMerchant:    "Zahlungslinks, Telegram-Flow, manuelle Prüfung.",
	planDeveloper:   "Vollständige API, Webhooks, Idempotenz, MCP-Tools.",
	planBusiness:    "Teams, Audit-Logs, höhere Limits, Priority-Workflow.",
	planPickNetwork: "<b>%s</b> · $%s / 30 Tage\n\n%s\n\nWählen Sie das Netzwerk für diese Zahlung aus:",
	checkoutCreated: "✅ <b>%s Checkout ist bereit</b>\n\nRechnung %s\n%s %s · 30 Tage\n\nZahlen Sie unten. Nach der Bestätigung wird der Tarif automatisch aktiviert.",

	markedPaid:    "✅ Rechnung %s als bezahlt markiert. Hervorragend.",
	keptUnderpaid: "⏳ Rechnung %s offen gelassen. Wir warten auf die Nachzahlung.",
	keptReview:    "🔍 Rechnung %s bleibt in manueller Prüfung.",

	languageTitle: "🌐 <b>Sprache</b>\n\nDies gilt überall — Bot, App und Zahlungsbenachrichtigungen bleiben synchron.",

	reminderNoWallet:        "<b>Ihr recv-Konto ist fast bereit.</b>\n\nSie sind nur noch einen Schritt von der Akzeptanz von Krypto-Zahlungen entfernt. Fügen Sie Ihre Wallet-Adresse hinzu, um Ihre erste Rechnung zu erstellen. Ihre Gelder bleiben immer unter Ihrer Kontrolle.",
	reminderNoWallet2:       "<b>Benötigen Sie Hilfe bei der Einrichtung?</b>\n\nDas Hinzufügen einer Wallet ist sicher: Wir nutzen sie nur, um Zahlungen direkt an Sie weiterzuleiten. Wählen Sie ein Netzwerk und senden Sie die Adresse, um zu starten.",
	reminderNoWallet3:       "💬 <b>Hilfe bei der Wallet-Einrichtung benötigt?</b>\n\nWir haben festgestellt, dass Sie noch keine Wallet hinzugefügt haben. Bei Fragen oder Problemen wenden Sie sich an unseren Support unter @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Self-Custody bedeutet Freiheit</b>\n\nIm Gegensatz zu herkömmlichen Payment-Gateways fließen die Gelder bei recv direkt auf Ihre Wallet. Sie behalten 100 % Ihrer Einnahmen. Richten Sie jetzt Ihre Wallet ein!",
	reminderNoWallet5:       "📞 <b>Lassen Sie es uns gemeinsam einrichten</b>\n\nNoch keine Wallet hinzugefügt? Kein Problem, wenn Sie neu im Krypto-Bereich sind. Schreiben Sie an @recvmoneysupport und wir führen Sie Schritt für Schritt durch!",
	reminderNoInvoice:       "<b>Ihre Wallet ist verbunden und bereit für den Zahlungsempfang.</b>\n\nErstellen Sie jetzt Ihre erste Testrechnung, um zu sehen, wie einfach Ihre Kunden bezahlen können.",
	reminderNoInvoice2:      "⚡ <b>Starten Sie noch heute mit USDT!</b>\n\nIhre Auszahlungs-Wallet ist konfiguriert und bereit. Erstellen Sie direkt im Chat einen Checkout-Link und senden Sie ihn an Ihre Kunden.",
	reminderNoInvoice3:      "🙋 <b>Probleme bei der Erstellung der ersten Rechnung?</b>\n\nWir helfen Ihnen gerne! Bei individuellen Anforderungen oder Fragen zur Integration wenden Sie sich an unser Support-Team unter @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>USDT in 10 Sekunden akzeptieren</b>\n\nBereit für Zahlungen? Geben Sie jetzt /invoice ein, um Ihren ersten sicheren Zahlungslink zu erstellen.",
	reminderNoInvoice5:      "⚙️ <b>Individuelle Integration?</b>\n\nWenn Sie APIs, eigene Bots, Webhooks oder Warenkorb-Plugins benötigen, schreiben Sie uns an @recvmoneysupport und wir entwickeln die passende Lösung für Sie.",
	reminderTrialExhausted:  "⚠️ <b>Ihre Testphase ist beendet.</b>\n\nSie haben das Limit für kostenlose Rechnungen erreicht. Um weiterhin unterbrechungsfrei Zahlungen zu akzeptieren und Zugriff auf erweiterte Analysen zu erhalten, aktivieren Sie den passenden Tarif.",
	reminderTrialExhausted2: "<b>Verpassen Sie keine Kundenzahlungen.</b>\n\nDer Empfang neuer Zahlungen ist pausiert. Wechseln Sie zu Merchant, Business oder Developer, um den vollen Funktionsumfang Ihres Workspaces wiederherzustellen.",
	reminderTrialExhausted3: "💬 <b>Individuelle Limits oder Fragen?</b>\n\nWenn Sie ein hohes Volumen oder spezielle Anforderungen haben oder über Preise sprechen möchten, schreiben Sie uns unter @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Hilfe bei Checkouts benötigt?</b>\n\nIhr Checkout-Link ist unbezahlt abgelaufen. Lassen Sie uns wissen, wenn Sie Hilfe beim Testen des Zahlungsflusses oder bei der Einrichtung Ihrer Integration benötigen!",
	reminderExpired2:        "🔄 <b>Versuchen Sie es noch einmal!</b>\n\nErstellen Sie einen neuen Checkout-Link und bezahlen Sie ihn testweise selbst über ein Testnetzwerk oder mit echtem USDT, um zu sehen, wie schnell und einfach die Bestätigung funktioniert!",
	reminderExpired3:        "💬 <b>Hilfe beim Testen von Checkouts benötigt?</b>\n\nBei Fragen zur Zahlungsbestätigung oder zu Gebühren können Sie sich gerne an unser Support-Team unter @recvmoneysupport wenden.",
	reminderExpired4:        "🛠️ <b>Hilfe bei Webhooks oder der Integration benötigt?</b>\n\nWenn Sie Probleme mit Zahlungs-Callbacks, der API oder dem Testen von Abläufen haben, lassen Sie uns gemeinsam nachsehen. Schreiben Sie an @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Bringen wir den Checkout zum Laufen</b>\n\nWir möchten sicherstellen, dass Sie Ihre erste Zahlung erfolgreich empfangen. Wenden Sie sich an @recvmoneysupport für Unterstützung.",
	reminderInactive:        "<b>Wir haben festgestellt, dass Sie kürzlich keine neuen Rechnungen erstellt haben.</b>\n\nrecv bietet neue Business-Funktionen für Ihren Workspace. Öffnen Sie die App, um eine Rechnung zu erstellen oder aktuelle Statistiken einzusehen.",
	reminderInactive2:       "<b>Wir haben festgestellt, dass Sie kürzlich keine neuen Rechnungen erstellt haben.</b>\n\nrecv bietet neue Business-Funktionen für Ihren Workspace. Öffnen Sie die App, um eine Rechnung zu erstellen oder aktuelle Statistiken einzusehen.",
	reminderInactive3:       "👋 <b>Wir vermissen Sie!</b>\n\nIhr automatisierter Zahlungsfluss wartet auf Sie. Erstellen Sie jetzt einen Checkout-Link oder teilen Sie uns Ihr Feedback unter @recvmoneysupport mit!",
	reminderInactive4:       "🚀 <b>Zahlungen direkt in Telegram akzeptieren</b>\n\nUnsere Telegram Mini-App und unser Bot machen das Akzeptieren von USDT einfacher denn je. Erstellen Sie noch heute einen neuen Checkout-Link.",
	reminderInactive5:       "🎁 <b>Haben Sie Feedback für uns?</b>\n\nWir würden uns freuen zu hören, wie wir uns verbessern können. Schreiben Sie an @recvmoneysupport, um Feedback zu teilen oder individuelle Funktionen anzufragen.",

	toastWalletDisabled:      "Wallet entfernt",
	toastActionFailed:        "Etwas ist schiefgelaufen",
	toastWaitingTopUp:        "Warten auf Nachzahlung",
	toastMarkedPaid:          "Als bezahlt markiert",
	toastLeftReview:          "In Prüfung belassen",
	toastPlanCheckoutCreated: "Checkout bereit",
	toastLanguageSet:         "Sprache aktualisiert",
	toastUnknownAction:       "Unbekannte Aktion",
}

var uzCopy = botCopy{
	lang: "uz",

	homeTitle:      "<b>recv</b> — to'lovlar avtopilotda",
	homeWorkspace:  "Ishchi maydon · %s",
	homePlan:       "Tarif · %s",
	homeWallets:    "Yechib olish hamyonlari · %d",
	homeLatest:     "Oxirgi hisob · %s",
	homeNoInvoices: "Hisoblar hali yo'q — buni hozir tuzatamiz.",
	homeTagline:    "To'lov havolalari, hamyonlar, tarif, oxirgi hisoblar — butun kassa shu chatda joylashadi.",
	homePlanActive: "⭐ %s faol, amal qilish muddati: %s",
	homeTrialLeft:  "Sinov muddati · %d ta bepul hisob qoldi",

	startTitle: "<b>recv-ga xush kelibsiz</b> — biznesingiz uchun nokastodial kripto-ekvayring",
	startBody:  "Telegram-da USDT va boshqa kriptovalyutalarda to'lovlarni to'g'ridan-to'g'ri qabul qiling. Vositachilar, xoldlar (ushlab turishlar) va yashirin komissiyalar yo'q — mablag'lar to'g'ridan-to'g'ri shaxsiy hamyoningizga tushadi.",
	startProof: "To'lovlarni qabul qilishni 1 daqiqada sozlang.",

	btnNewInvoice:      "＋ Yangi hisob",
	btnRecentInvoices:  "🧾 Oxirgilari",
	btnWallets:         "👛 Hamyonlar",
	btnPlans:           "⭐ Tariflar",
	btnExtendPlan:      "⭐ Tarifni uzaytirish",
	btnHome:            "← Bosh sahifa",
	btnBack:            "← Orqaga",
	btnCancel:          "✕ Bekor qilish",
	btnLanguage:        "🌐 Til",
	btnOpenCheckout:    "💳 To'lovni ochish",
	btnOpenConsole:     "↗ Mini ilovani sinash",
	btnOpenStats:       "📊 Mini ilovadagi statistika",
	btnPricing:         "Saytdagi tariflar",
	btnDocs:            "Hujjatlar",
	btnSetWallet:       "%s sozlash",
	btnAddWallet:       "＋ Hamyon qo'shish",
	btnDisable:         "%s olib tashlash",
	btnNewInvoiceShort: "＋ Yana bitta",
	btnPayPlan:         "%s uchun to'lash",
	btnStartSetup:      "⚙️ Hamyonni sozlash",
	btnHowPlans:        "Narxi qancha?",
	minuteSuffix:       "daq",

	loginTitle: "🔑 <b>Veb-saytga kirish</b>",
	loginSteps: "1. Brauzeringizda recv kirish sahifasini oching.\n2. @username-ni kiriting.\n3. “Kodni olish” tugmasini bosing.\n4. Biz yuborgan kodni bu yerga joylashtiring. Tayyor.",

	unknownCommand: "Men /invoice, /invoices, /wallets, /plans va /language buyruqlarini tushunaman. Yoki tugmalardan foydalaning — tezroq.",

	invoicesTitle: "🧾 <b>Oxirgi hisoblar</b>",
	invoicesEmpty: "Hisoblar hali yo'q. Bu yerda birinchi hisobni yarating va to'lov havolasini xaridorga yuboring.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Mablag'larni yechib olish hamyonlari</b>",
	walletsEmpty:      "Hamyonlar hali yo'q. Hamyon qo'shing va pul to'g'ridan-to'g'ri sizga tushadi — recv unga hech qachon tegmaydi.",
	walletsSaved:      "✅ Hamyon saqlandi.",
	walletsDisabled:   "Hamyon olib tashlandi.",
	walletsAddFirst:   "<b>Hisob yaratish uchun hamyon talab qilinadi.</b>\n\nMijozlar hisobni to'lashlari va mablag'lar sizga kelib tushishi uchun birinchi navbatda yechib olish hamyonini ulang. Bu bir necha soniya vaqt oladi.",
	walletPromptEVM:   "<b>Hamyonni ulash: EVM</b>\n\nIltimos, ushbu chatga EVM hamyon manzilingizni yuboring. Qo'llab-quvvatlanadigan EVM tarmoqlaridagi mijozlar to'lovlari ushbu manzildan o'tadi.\n\nMisol: <code>0x...</code>\n\nManzil aniq nusxalanganligini tekshiring.",
	walletPromptSOL:   "<b>Hamyonni ulash: Solana</b>\n\nIltimos, ushbu chatga Solana hamyon manzilingizni yuboring. Solana tarmog'idagi mijozlar to'lovlari ushbu manzildan o'tadi.\n\nMisol: <code>So...</code>\n\nManzil aniq nusxalanganligini tekshiring.",
	walletPromptTRON:  "<b>Hamyonni ulash: TRON (TRC-20)</b>\n\nIltimos, ushbu chatga TRON hamyon manzilingizni yuboring. TRON tarmog'idagi mijozlar to'lovlari ushbu manzildan o'tadi.\n\nMisol: <code>T...</code>\n\nManzil aniq nusxalanganligini tekshiring.",
	walletPromptOther: "<b>Hamyonni ulash: %s</b>\n\nIltimos, ushbu chatga hamyon manzilingizni yuboring. Mijozlar to'lovlari ushbu manzildan o'tadi.\n\nManzil aniq nusxalanganligini tekshiring.",
	walletInvalidHint: "⚠️ %s — qaytadan urinib ko'ring.",

	invoicePickWallet:   "<b>Yangi hisob</b>\n\nTo'lov qaysi hamyonga qabul qilinsin?",
	invoicePickNetwork:  "<b>Yangi hisob</b>\nHamyon · %s\n\nBu hisob qaysi tarmoq uchun mo'ljallangan?",
	invoiceStep1:        "<b>Yangi hisob</b> · 3 ning 1-bosqichi\nHamyon · %s\n\nNima uchun haq olyapsiz? Nomini yuboring.",
	invoiceStep2:        "<b>Yangi hisob</b> · 3 ning 2-bosqichi\nHamyon · %s\nNomi · %s\n\nQancha, USD da? Summani yuboring.",
	invoiceStep3:        "<b>Yangi hisob</b> · 3 ning 3-bosqichi\nHamyon · %s\nNomi · %s\nSumma · %s USD\n\nUshbu havola qancha vaqt faol turishi kerak?",
	invoiceTitleEmpty:   "Nom bo'sh bo'lishi mumkin emas — bir nechta so'z yuboring.",
	invoiceAmountBad:    "Bu noto'g'ri summa. USD da musbat son yuboring, masalan, 49.90.",
	invoiceCreated:      "✅ <b>Hisob muvaffaqiyatli yaratildi</b>\n\nID: <code>%s</code>\nMaqsad: %s\nSumma: %s USD\nTarmoq: %s\nAmal qilish muddati: %s\n\nQuyidagi havolani nusxalang va mijozingizga yuboring:\n<code>%s</code>",
	invoiceTrialReached: "Sinov havolalari tugadi. Oddiy to'lov havolalari uchun Merchant tarifini, agar API va vebhuklar ham kerak bo'lsa, Developer tarifini tanlang.",

	plansTitle:      "⭐ <b>recv tariflari</b>",
	plansBody:       "0% aylanma komissiyasi. Mablag'lar to'g'ridan-to'g'ri hamyoningizga tushadi. O'zingizga kerakli bo'lgan tarif darajasini tanlang.",
	plansCurrent:    "Joriy · %s, %s gacha faol",
	planLine:        "<b>%s</b> · $%s / 30 kun\n%s",
	planMerchant:    "To'lov havolalari, Telegram oqimi, qo'lda tekshirish.",
	planDeveloper:   "To'liq API, vebhuklar, idempotentlik, MCP vositalari.",
	planBusiness:    "Jamoalar, audit jurnallari (audit logs), yuqoriroq limitlar, ustuvor ish oqimi.",
	planPickNetwork: "<b>%s</b> · $%s / 30 kun\n\n%s\n\nUshbu to'lov uchun tarmoqni tanlang:",
	checkoutCreated: "✅ <b>%s chekauti tayyor</b>\n\nHisob-faktura %s\n%s %s · 30 kun\n\nQuyida to'lovni amalga oshiring. Tasdiqlangandan so'ng tarif avtomatik ravishda faollashadi.",

	markedPaid:    "✅ Hisob %s to'langan deb belgilandi. Ajoyib.",
	keptUnderpaid: "⏳ Hisob %s ochiq qoldirildi. Qo'shimcha to'lovni kutamiz.",
	keptReview:    "🔍 Hisob %s qo'lda tekshirish holatida qoladi.",

	languageTitle: "🌐 <b>Til</b>\n\nBu hamma joyda qo'llaniladi — bot, ilova va to'lov bildirishnomalari sinxron holatda qoladi.",

	reminderNoWallet:        "<b>recv hisobingiz deyarli tayyor.</b>\n\nKripto to'lovlarni qabul qilishga bir qadam qoldi. Birinchi hisobingizni yaratish uchun hamyon manzilingizni qo'shing. Mablag'laringiz har doim o'zingizning nazoratingizda qoladi.",
	reminderNoWallet2:       "<b>Sozlash bo'yicha yordam kerakmi?</b>\n\nHamyon qo'shish xavfsiz: biz undan faqat to'lovlarni to'g'ridan-to'g'ri sizga yo'naltirish uchun foydalanamiz. Tarmoqni tanlang va boshlash uchun manzilni yuboring.",
	reminderNoWallet3:       "💬 <b>Hamyonni sozlashda yordam kerakmi?</b>\n\nHali hamyon qo'shmaganingizni payqadik. Agar sizda biror bir savol yoki muammo bo'lsa, @recvmoneysupport orqali qo'llab-quvvatlash xizmatimizga murojaat qiling!",
	reminderNoWallet4:       "🔒 <b>Nokastodial saqlash (self-custody) — bu erkinlik</b>\n\nAn'anaviy to'lov shlyuzlaridan farqli o'laroq, recv to'lovlarni to'g'ridan-to'g'ri hamyoningizga yuboradi. Daromadning 100% sizda qoladi. Hamyoningizni hozir sozlang!",
	reminderNoWallet5:       "📞 <b>Keling, birgalikda sozlaymiz</b>\n\nHali ham hamyon qo'shmadingizmi? Kriptoga yangi bo'lsangiz ham xavotirlanmang. @recvmoneysupport manziliga yozing, biz sizga bosqichma-bosqich yordam beramiz!",
	reminderNoInvoice:       "<b>Hamyoningiz ulandi va to'lovlarni qabul qilishga tayyor.</b>\n\nMijozlaringiz to'lovni qanchalik oson amalga oshira olishini ko'rish uchun hozir birinchi sinov hisobingizni yarating.",
	reminderNoInvoice2:      "⚡ <b>Bugundanoq USDT qabul qilishni boshlang!</b>\n\nYechib olish hamyoningiz sozlangan va tayyor. To'g'ridan-to'g'ri chatda chekaut havolasini yarating va uni mijozlaringizga yuboring.",
	reminderNoInvoice3:      "🙋 <b>Birinchi hisobni yaratishda muammo bo'lyaptimi?</b>\n\nBiz yordam berishga tayyormiz! Agar sizda maxsus talablar bo'lsa yoki integratsiya bo'yicha savollaringiz bo'lsa, @recvmoneysupport orqali biz bilan bog'laning.",
	reminderNoInvoice4:      "💸 <b>10 soniyada USDT qabul qiling</b>\n\nTo'lov olishga tayyormi? Birinchi xavfsiz to'lov havolangizni yaratish uchun hozir /invoice deb yozing.",
	reminderNoInvoice5:      "⚙️ <b>Maxsus integratsiya?</b>\n\nAgar sizga API-lar, maxsus botlar, vebhuklar yoki savat plaginlari kerak bo'lsa, @recvmoneysupport bilan bog'laning va biz buni siz uchun ishlab chiqamiz.",
	reminderTrialExhausted:  "⚠️ <b>Sinov muddatingiz tugadi.</b>\n\nSiz bepul hisob-faktura limitidan foydalanib bo'ldingiz. To'lovlarni uzluksiz qabul qilishni davom ettirish va kengaytirilgan tahlillarga kirish uchun mos tarifni faollashtiring.",
	reminderTrialExhausted2: "<b>Mijozlaringiz to'lovlarini o'tkazib yubormang.</b>\n\nYangi to'lovlarni qabul qilish vaqtincha to'xtatildi. Ishchi maydoningizning to'liq funksionalligini tiklash uchun Merchant, Business yoki Developer tarifiga o'ting.",
	reminderTrialExhausted3: "💬 <b>Maxsus limitlar yoki savollar bormi?</b>\n\nAgar sizda katta hajmdagi to'lovlar bo'lsa, maxsus talablar yoki tariflar bo'yicha gaplashmoqchi bo'lsangiz, biz bilan @recvmoneysupport orqali bog'laning.",
	reminderExpired:         "⏳ <b>Chekautlar bo'yicha yordam kerakmi?</b>\n\nSizning to'lov havolangiz to'lanmasdan muddati tugadi. Agar to'lov oqimini sinab ko'rish yoki integratsiyani sozlashda yordam kerak bo'lsa, bizga xabar bering!",
	reminderExpired2:        "🔄 <b>Yana bir bor urinib ko'ring!</b>\n\nYangi chekaut havolasini yarating va to'lov tasdiqlanishi qanchalik tez va oson ishlashini ko'rish uchun test tarmog'i yoki haqiqiy USDT orqali o'zingiz to'lab ko'ring!",
	reminderExpired3:        "💬 <b>Chekautlarni sinashda yordam kerakmi?</b>\n\nAgar to'lovlarni tasdiqlash yoki komissiyalar haqida savollaringiz bo'lsa, @recvmoneysupport orqali qo'llab-quvvatlash jamoamizdan so'rashdan tortinmang.",
	reminderExpired4:        "🛠️ <b>Vebhuklar yoki integratsiya bo'yicha yordam kerakmi?</b>\n\nAgar to'lov qayta aloqalari (callbacks), API yoki jarayonlarni sinash bilan bog'liq muammolar mavjud bo'lsa, keling, birga ko'rib chiqamiz. @recvmoneysupport manziliga yozing!",
	reminderExpired5:        "👋 <b>Chekautni ishga tushiraylik</b>\n\nBirinchi to'lovingizni muvaffaqiyatli qabul qilishingizga ishonch hosil qilishni istaymiz. Yordam uchun @recvmoneysupport bilan bog'laning.",
	reminderInactive:        "<b>Yaqin orada yangi hisoblar yaratmaganingizni payqadik.</b>\n\nrecv loyihasi sizning ishchi maydoningiz uchun yangi biznes funksiyalarini taqdim etdi. Hisob yaratish yoki joriy statistikani ko'rib chiqish uchun ilovani oching.",
	reminderInactive2:       "<b>Yaqin orada yangi hisoblar yaratmaganingizni payqadik.</b>\n\nrecv loyihasi sizning ishchi maydoningiz uchun yangi biznes funksiyalarini taqdim etdi. Hisob yaratish yoki joriy statistikani ko'rib chiqish uchun ilovani oching.",
	reminderInactive3:       "👋 <b>Sizni sog'indik!</b>\n\nSizning avtomatlashtirilgan to'lov oqimingiz hali ham sizni kutmoqda. Hozir chekaut havolasini yarating yoki biron bir fikringiz bo'lsa, @recvmoneysupport orqali bizga xabar bering!",
	reminderInactive4:       "🚀 <b>To'lovlarni to'g'ridan-to'g'ri Telegram-da qabul qiling</b>\n\nBizning Telegram Mini ilovamiz va botimiz USDT qabul qilishni har qachongidan ham osonlashtiradi. Bugunoq yangi to'lov havolasini yarating.",
	reminderInactive5:       "🎁 <b>Fikrlaringiz bormi?</b>\n\nQanday yaxshilanishimiz mumkinligini bilishdan mamnun bo'lardik. Fikr-mulohazalaringizni baham ko'rish yoki maxsus funksiyalar so'rash uchun @recvmoneysupport bilan bog'laning.",

	toastWalletDisabled:      "Hamyon olib tashlandi",
	toastActionFailed:        "Nimadir noto'g'ri ketdi",
	toastWaitingTopUp:        "Qo'shimcha to'lov kutilmoqda",
	toastMarkedPaid:          "To'langan deb belgilandi",
	toastLeftReview:          "Tekshiruvda qoldirildi",
	toastPlanCheckoutCreated: "Chekaut tayyor",
	toastLanguageSet:         "Til yangilandi",
	toastUnknownAction:       "Noma'lum amal",
}

var ukCopy = botCopy{

	lang: "uk",

	homeTitle: "<b>recv</b> — платежі на автопілоті",
	homeWorkspace: "Воркспейс · %s",
	homePlan: "Тариф · %s",
	homeWallets: "Кошельки для виплат · %d",
	homeLatest: "Останній рахунок · %s",
	homeNoInvoices: "Рахунків поки немає — зараз це виправимо.",
	homeTagline: "Посилання на оплату, гаманці, тариф, останні рахунки — вся каса прямо в чаті.",
	homePlanActive: "⭐ %s активний до %s",
	homeTrialLeft: "Пробний період · залишилося %d безкоштовних рахунків",

	startTitle: "<b>Ласкаво просимо до recv</b> — некастодіальний криптоеквайринг для вашого бізнесу",
	startBody: "Приймайте платежі в USDT та інших криптовалютах напряму в Telegram. Жодних посередників, холдів чи прихованих комісій — кошти надходять прямо на ваш особистий гаманець.",
	startProof: "Налаштуйте прийом платежів за 1 хвилину.",

	btnNewInvoice: "＋ Новий рахунок",
	btnRecentInvoices: "🧾 Останні",
	btnWallets: "👛 Гаманці",
	btnPlans: "⭐ Тарифи",
	btnExtendPlan: "⭐ Продовжити тариф",
	btnHome: "← Додому",
	btnBack: "← Назад",
	btnCancel: "✕ Скасувати",
	btnLanguage: "🌐 Мова",
	btnOpenCheckout: "💳 Відкрити оплату",
	btnOpenConsole: "↗ Спробувати Mini app",
	btnOpenStats: "📊 Статистика в Mini app",
	btnPricing: "Тарифи на сайті",
	btnDocs: "Документація",
	btnSetWallet: "Вказати %s",
	btnAddWallet: "＋ Додати гаманець",
	btnDisable: "Прибрати %s",
	btnNewInvoiceShort: "＋ Ще один",
	btnPayPlan: "Оплатити %s",
	btnStartSetup: "⚙️ Налаштувати гаманець",
	btnHowPlans: "Скільки це коштує?",
	minuteSuffix: "хв",

	loginTitle: "🔑 <b>Вхід через браузер</b>",
	loginSteps: "1. Відкрийте сторінку входу recv у браузері.\n2. Введіть @username.\n3. Натисніть «Отримати код».\n4. Вставте код, який прийде сюди. Готово.",

	unknownCommand: "Я розумію /invoice, /invoices, /wallets, /plans та /language. Але кнопками швидше.",

	invoicesTitle: "🧾 <b>Останні рахунки</b>",
	invoicesEmpty: "Рахунок поки що немає. Створіть перший тут і надішліть покупцю посилання на оплату.",
	invoiceLine: "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle: "👛 <b>Гаманці для виплат</b>",
	walletsEmpty: "Гаманців поки що немає. Додайте - гроші підуть безпосередньо вам, recv їх не стосується.",
	walletsSaved: "✅ Гаманець збережений.",
	walletsDisabled: "Гаманець прибраний.",
	walletsAddFirst: "<b>Для створення рахунку потрібен гаманець.</b>\n\nЩоб Ваші клієнти могли сплатити рахунок, а Ви отримати кошти, будь ласка, прив'яжіть гаманець для виплат. Це триватиме кілька секунд.",
	walletPromptEVM: "<b>Підключення гаманця: EVM</b>\n\nБудь ласка, відправте в чат адресу EVM-гаманця. На цю адресу будуть автоматично надходити платежі клієнтів у підтримуваних мережах EVM.\n\nПриклад: <code>0x...</code>\n\nПереконайтеся, що копіюєте точну адресу.",
	walletPromptSOL: "<b>Підключення гаманця: Solana</b>\n\nБудь ласка, відправте в чат адресу Вашого гаманця в мережі Solana. На цю адресу автоматично надходитимуть платежі клієнтів у Solana.\n\nПриклад: <code>So...</code>\n\nПереконайтеся, що копіюєте точну адресу.",
	walletPromptTRON: "<b>Підключення гаманця: TRON (TRC-20)</b>\n\nБудь ласка, відправте в чат адресу Вашого гаманця в мережі TRON.\nНа цю адресу будуть автоматично надходити всі платежі від Ваших клієнтів.",
	walletPromptOther: "<b>Підключення гаманця: %s</b>\n\nБудь ласка, надішліть адресу Вашого гаманця в чат. На цю адресу будуть автоматично надходити платежі клієнтів.\n\nПереконайтеся, що копіюєте точну адресу.",
	walletInvalidHint: "⚠️ %s — спробуйте ще раз.",

	invoicePickWallet: "<b>Новий рахунок</b>\n\nНа який гаманець прийняти оплату?",
	invoicePickNetwork: "<b>Новий рахунок</b>\nГаманець · %s\n\nУ якій мережі виставити рахунок?",
	invoiceStep1: "<b>Новий рахунок</b> · крок 1 з 3\nГаманець · %s\n\nЗа що беремо оплату? Надішліть назву.",
	invoiceStep2: "<b>Новий рахунок</b> · крок 2 з 3\nГаманець · %s\nНазва · %s\n\nСкільки в USD? Надішліть суму.",
	invoiceStep3: "<b>Новий рахунок</b> · крок 3 з 3\nГаманець · %s\nНазва · %s\nСума · %s USD\n\nСкільки посилання має бути активним?",
	invoiceTitleEmpty: "Назва не може бути порожньою - надішліть пару слів.",
	invoiceAmountBad: "Це не схоже на суму. Надішліть позитивне число в USD, наприклад 49.90.",
	invoiceCreated: "✅ <b>Рахунок успішно створений</b>\n\nID: <code>%s</code>\nПризначення: %s\nСума: %s USD\nМережа: %s\nДійсно до: %s\n\nСкопіюйте посилання нижче і надішліть його клієнту для оплати:\n<code>%s",
	invoiceTrialReached: "Пробні заслання закінчилися. Беріть Merchant для звичайних оплат або Developer, якщо потрібні API та веб-хуки.",

	plansTitle: "⭐ <b>Тарифи recv</b>",
	plansBody: "0% комісії з обігу. Гроші йдуть одразу на ваш гаманець. Виберіть рівень під вашу механіку.",
	plansCurrent: "Зараз · %s до %s",
	planLine: "<b>%s</b> · $%s / 30 днів\n%s",
	planMerchant: "Платіжні посилання, Telegram-Flow, ручна перевірка.",
	planDeveloper: "Повний API, веб-хуки, ідемпотентність, MCP-інструменти.",
	planBusiness: "Команди, audit logs, високі ліміти, пріоритетний workflow.",
	planPickNetwork: "<b>%s</b> · $%s / 30 днів\n\n%s\n\nВиберіть мережу для оплати:",
	checkoutCreated: "✅ <b>Рахунок на %s готовий</b>\n\nІнвойс %s\n%s %s · 30 днів\n\nСплатіть нижче. Після підтвердження тариф увімкнеться автоматично.",

	markedPaid: "✅ Рахунок %s відзначений оплаченим. Чудово.",
	keptUnderpaid: "⏳ Рахунок %s залишено відкритим. Чекаємо на доплату.",
	keptReview: "🔍 Рахунок %s залишається на ручній перевірці.",

	languageTitle: "🌐 <b>Мова</b>\n\nЗастосовується скрізь — бот, додаток та повідомлення про оплату синхронізовані.",

	reminderNoWallet: "<b>Ваш обліковий запис recv майже готовий до роботи.</b>\n\nВи знаходитесь в одному кроці від прийому криптоплатежів. Додайте адресу Вашого гаманця, щоб створити перший рахунок. Ваші кошти залишаються під Вашим контролем.",
	reminderNoWallet2: "<b>Виникли труднощі з налаштуванням?</b>\n\nДодавання гаманця безпечне: ми використовуємо його тільки для маршрутизації платежів безпосередньо Вам. Виберіть мережу та надішліть адресу, щоб почати.",
	reminderNoWallet3: "💬 <b>Потрібна допомога з налаштування гаманця?</b>\n\nМи помітили, що ви ще не додали гаманець. Якщо у вас виникли питання чи труднощі, напишіть на нашу підтримку @recvmoneysupport!",
	reminderNoWallet4: "🔒 <b>Некастодіальні платежі - це свобода</b>\n\nНа відміну від інших систем, recv відправляє кошти прямо на ваш особистий гаманець. 100% прибутку залишається вам. Прив'яжіть гаманець прямо зараз!",
	reminderNoWallet5: "📞 <b>Давайте налаштуємо гаманець разом</b>\n\nВсе ще не додали гаманець? Якщо ви новачок у крипті, напишіть нам на підтримку @recvmoneysupport - ми допоможемо у всьому розібратися!",
	reminderNoInvoice: "<b>Ваш гаманець підключений і готовий до прийому платежів.</b>\n\nСтворіть перший тестовий рахунок прямо зараз, щоб побачити, як легко Ваші клієнти зможуть робити оплату.",
	reminderNoInvoice2: "⚡ <b>Почніть приймати USDT вже сьогодні!</b>\n\nВаш гаманець для виплат налаштований і готовий до роботи. Створіть посилання на оплату прямо в цьому чаті та надішліть його клієнтам.",
	reminderNoInvoice3: "🙋 <b>Не вдається створити перший рахунок?</b>\n\nМи допоможемо! Якщо у вас є особливі вимоги або питання інтеграції, напишіть нашій команді підтримки @recvmoneysupport.",
	reminderNoInvoice4: "💸 <b>Приймайте USDT за 10 секунд</b>\n\nГотові отримати першу оплату? Напишіть /invoice зараз, щоб створити посилання на оплату.",
	reminderNoInvoice5: "⚙️ <b>Потрібна інтеграція?</b>\n\nЯкщо вам потрібні API, вебхуки, кастомні боти або плагіни для кошика, напишіть @recvmoneysupport, і ми допоможемо з інтеграцією.",
	reminderTrialExhausted: "⚠️ <b>Ваш пробний період завершено.</b>\n\nВи успішно використовували ліміт безкоштовних рахунків. Щоб продовжити приймати платежі без зупинок та отримати доступ до розширеної аналітики, будь ласка, активуйте відповідний тарифний план.",
	reminderTrialExhausted2: "<b>Не втрачайте платежі від Ваших клієнтів.</b>\n\nПрийом нових сплат припинено. Перейдіть на тариф Merchant, Business або Developer, щоб повернути повну функціональність Вашого воркспейсу.",
	reminderTrialExhausted3: "💬 <b>Індивідуальні умови?</b>\n\nЯкщо у вас великі обсяги, особливі вимоги або питання щодо тарифів, напишіть нам @recvmoneysupport.",
	reminderExpired: "⏳ <b>Потрібна допомога з рахунками?</b>\n\nТермін оплати за вашим посиланням минув. Напишіть нам, якщо потрібна допомога із тестуванням платежів чи інтеграцією!",
	reminderExpired2: "🔄 <b>Спробуйте ще раз!</b>\n\nСтворіть нове посилання на оплату і спробуйте оплатити його самі в тестовій мережі або реальним USDT, щоб побачити, як швидко та просто працює підтвердження!",
	reminderExpired3: "💬 <b>Потрібна допомога в тестуванні оплати?</b>\n\nЯкщо у вас є питання щодо підтвердження платежів або комісій, не соромтеся писати нашій підтримці @recvmoneysupport.",
	reminderExpired4: "🛠️ <b>Потрібна допомога з інтеграцією або вебхуками?</b>\n\nЯкщо виникли труднощі з коллбеками оплати, API або тестуванням, напишіть нам @recvmoneysupport!",
	reminderExpired5: "👋 <b>Давайте запустимо ваші продажі</b>\n\nМи хочемо, щоб ви успішно прийняли свій перший платіж. Наша підтримка завжди на зв'язку в @recvmoneysupport.",
	reminderInactive: "<b>Ми помітили, що Ви давно не створювали нових рахунків.</b>\n\nУ recv з'явилися нові функції для Вашого бізнесу. Відкрийте програму, щоб виставити рахунок або перевірити актуальну статистику.",
	reminderInactive2: "<b>Ми помітили, що Ви давно не створювали нових рахунків.</b>\n\nУ recv з'явилися нові функції для Вашого бізнесу. Відкрийте програму, щоб виставити рахунок або перевірити актуальну статистику.",
	reminderInactive3: "👋 <b>Ми сумуємо за вами!</b>\n\nВаша автоматична каса все ще чекає на вас. Створіть посилання на оплату прямо зараз або поділіться відгуком із нашою підтримкою @recvmoneysupport!",
	reminderInactive4: "🚀 <b>Приймайте оплати прямо в Telegram</b>\n\nНаші Mini App і бот роблять прийом USDT максимально простим. Створіть новий рахунок вже сьогодні!",
	reminderInactive5: "🎁 <b>Поділіться вашим відгуком</b>\n\nМи хочемо зробити сервіс кращим. Напишіть нам @recvmoneysupport і розкажіть, яких функцій вам не вистачає!",

	toastWalletDisabled: "Гаманець прибраний",
	toastActionFailed: "Щось пішло не так",
	toastWaitingTopUp: "Чекаємо на доплату",
	toastMarkedPaid: "Позначено оплаченим",
	toastLeftReview: "Залишено на перевірці",
	toastPlanCheckoutCreated: "Рахунок готовий",
	toastLanguageSet: "Мова оновлена",
	toastUnknownAction: "Невідома дія",

}

func copyFor(language string) botCopy {
	switch store.NormalizeLanguage(language) {
	case "uk":
		return ukCopy
	case "ru":
		return ruCopy
	case "es":
		return esCopy
	case "pt":
		return ptCopy
	case "de":
		return deCopy
	case "uz":
		return uzCopy
	default:
		return enCopy
	}
}
