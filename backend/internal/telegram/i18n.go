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
	btnPricing         string
	btnDocs            string
	btnSetWallet       string // %s = network label
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
	invoiceCreated      string // %s id, %s title, %s amount, %s network, %d minutes
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

	startTitle: "<b>recv</b> — skip complex merchants. Accept USDT in Telegram",
	startBody:  "Generate a payment link in 10 seconds and get crypto straight to your wallet. No revenue cuts.",
	startProof: "First invoices are on us. Upgrade only when the real cash starts rolling in.",

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
	btnPricing:         "Plans on site",
	btnDocs:            "Docs",
	btnSetWallet:       "Set %s",
	btnDisable:         "Remove %s",
	btnNewInvoiceShort: "＋ One more",
	btnPayPlan:         "Pay for %s",
	btnStartSetup:      "Setup wallet",
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
	walletsAddFirst:   "Add a payout wallet first — that's where the money goes.",
	walletPromptEVM:   "<b>Set your EVM wallet</b>\n\nOne address covers Ethereum, Base, Arbitrum and BSC. Send it in your next message.",
	walletPromptSOL:   "<b>Set your Solana wallet</b>\n\nThis address receives your Solana stablecoin payments. Send it in your next message.",
	walletPromptOther: "<b>Set your %s wallet</b>\n\nSend the address in your next message.",
	walletInvalidHint: "⚠️ %s — give it another shot.",

	invoicePickWallet:   "<b>New invoice</b>\n\nWhich wallet should get paid?",
	invoicePickNetwork:  "<b>New invoice</b>\nWallet · %s\n\nWhich network is this invoice for?",
	invoiceStep1:        "<b>New invoice</b> · step 1 of 3\nWallet · %s\n\nWhat are you charging for? Send the title.",
	invoiceStep2:        "<b>New invoice</b> · step 2 of 3\nWallet · %s\nTitle · %s\n\nHow much, in USD? Send the amount.",
	invoiceStep3:        "<b>New invoice</b> · step 3 of 3\nWallet · %s\nTitle · %s\nAmount · %s USD\n\nHow long should this link stay live?",
	invoiceTitleEmpty:   "A title can't be empty — send a few words.",
	invoiceAmountBad:    "That's not a valid amount. Send a positive number in USD, like 49.90.",
	invoiceCreated:      "✅ <b>Invoice %s is live</b>\n\n%s\n%s %s · expires in %d min\n\nShare the checkout link below.",
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

	reminderNoWallet:        "👛 <b>Set up your payout wallet</b>\n\nYou haven't added a payout wallet yet. Add it now to receive USDT payments directly to your self-custody address.",
	reminderNoWallet2:       "⚠️ <b>Still no payout wallet?</b>\n\nWithout a payout wallet, you cannot accept crypto. Link your wallet in 10 seconds to start collecting payments directly to your address!",
	reminderNoWallet3:       "💬 <b>Need help setting up your wallet?</b>\n\nWe noticed you haven't added a wallet yet. If you have any questions or face any issues, reach out to our support at @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Self-custody is freedom</b>\n\nUnlike traditional payment gateways, recv goes straight to your wallet. You keep 100% of your earnings. Set up your wallet now!",
	reminderNoWallet5:       "📞 <b>Let's set it up together</b>\n\nStill haven't added a wallet? It's okay if you are new to crypto. Message @recvmoneysupport and we'll guide you step by step!",
	reminderNoInvoice:       "＋ <b>Create your first invoice</b>\n\nYou've set up your wallet, but haven't created an invoice yet! Generate a payment link in 10 seconds and share it with your clients.",
	reminderNoInvoice2:      "⚡ <b>Start accepting USDT today!</b>\n\nYour payout wallet is configured and ready. Generate a checkout link right here in the chat and send it to your clients.",
	reminderNoInvoice3:      "🙋 <b>Stuck on creating your first invoice?</b>\n\nWe are here to help! If you have custom requirements or questions about integrations, contact our support team at @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Accept USDT in 10 seconds</b>\n\nReady to get paid? Type /invoice right now to generate your first secure payment link.",
	reminderNoInvoice5:      "⚙️ <b>Custom integration?</b>\n\nIf you need APIs, custom bots, webhooks, or shopping cart plugins, reach out to @recvmoneysupport and we will build it for you.",
	reminderTrialExhausted:  "💡 <b>Trial limit reached</b>\n\nYou've exhausted your free trial invoices. Choose a plan to resume accepting USDT with zero checkout friction.",
	reminderTrialExhausted2: "💰 <b>Zero revenue cuts</b>\n\nWith recv plans, you pay a flat monthly fee and keep 100% of your customer volume. Unlock your plan today!",
	reminderTrialExhausted3: "💬 <b>Custom limits or questions?</b>\n\nIf you have a high volume, special requirements, or want to discuss pricing, chat with us at @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Need help with checkouts?</b>\n\nYour checkout link has expired unpaid. Let us know if you need help testing the payment flow or setting up your integration!",
	reminderExpired2:        "🔄 <b>Give it another try!</b>\n\nCreate a new checkout link and try paying it yourself using a test network or real USDT to see how fast and easy the payment confirmation works!",
	reminderExpired3:        "💬 <b>Need help testing checkouts?</b>\n\nIf you have questions about payment confirmation or fees, feel free to ask our support team at @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Need webhooks or integration help?</b>\n\nIf you're having issues with payment callbacks, API, or just testing flows, let's look at it. Message @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Let's make checkout work</b>\n\nWe want to make sure you successfully receive your first payment. Reach out to @recvmoneysupport for help.",
	reminderInactive:        "📈 <b>Keep sales running</b>\n\nIt's been a week since your last payment link activity. Keep your checkout flow smooth and automated with recv.",
	reminderInactive2:       "⭐ <b>Boost your checkout conversion!</b>\n\nDid you know that recv payment links can be integrated into websites, apps, and Telegram mini-apps? Reach out to @recvmoneysupport for setup tips.",
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

	startTitle: "<b>recv</b> — забудьте про сложные мерчанты. Принимайте USDT в Telegram",
	startBody:  "Ссылка на оплату за 10 секунд — и крипта уже на вашем кошельке. Без процентов от ваших продаж.",
	startProof: "Первые счета — за наш счёт. Переходите на тариф, когда пойдёт реальный кэш.",

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
	btnPricing:         "Тарифы на сайте",
	btnDocs:            "Документация",
	btnSetWallet:       "Указать %s",
	btnDisable:         "Убрать %s",
	btnNewInvoiceShort: "＋ Ещё один",
	btnPayPlan:         "Оплатить %s",
	btnStartSetup:      "Настроить кошелёк",
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
	walletsAddFirst:   "Сначала добавьте кошелёк — туда придут деньги.",
	walletPromptEVM:   "<b>Укажите EVM-кошелёк</b>\n\nОдин адрес для Ethereum, Base, Arbitrum и BSC. Пришлите его следующим сообщением.",
	walletPromptSOL:   "<b>Укажите Solana-кошелёк</b>\n\nНа этот адрес придут стейблкоин-платежи в Solana. Пришлите его следующим сообщением.",
	walletPromptOther: "<b>Укажите %s-кошелёк</b>\n\nПришлите адрес следующим сообщением.",
	walletInvalidHint: "⚠️ %s — попробуйте ещё раз.",

	invoicePickWallet:   "<b>Новый счёт</b>\n\nНа какой кошелёк принять оплату?",
	invoicePickNetwork:  "<b>Новый счёт</b>\nКошелёк · %s\n\nВ какой сети выставить счёт?",
	invoiceStep1:        "<b>Новый счёт</b> · шаг 1 из 3\nКошелёк · %s\n\nЗа что берём оплату? Пришлите название.",
	invoiceStep2:        "<b>Новый счёт</b> · шаг 2 из 3\nКошелёк · %s\nНазвание · %s\n\nСколько в USD? Пришлите сумму.",
	invoiceStep3:        "<b>Новый счёт</b> · шаг 3 из 3\nКошелёк · %s\nНазвание · %s\nСумма · %s USD\n\nСколько ссылка должна быть активна?",
	invoiceTitleEmpty:   "Название не может быть пустым — пришлите пару слов.",
	invoiceAmountBad:    "Это не похоже на сумму. Пришлите положительное число в USD, например 49.90.",
	invoiceCreated:      "✅ <b>Счёт %s создан</b>\n\n%s\n%s %s · истекает через %d мин\n\nСсылка на оплату — ниже.",
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

	reminderNoWallet:        "👛 <b>Настройте кошелёк для выплат</b>\n\nВы ещё не добавили кошелёк для выплат. Добавьте его сейчас, чтобы принимать платежи в USDT напрямую на свой личный адрес.",
	reminderNoWallet2:       "⚠️ <b>Всё ещё нет кошелька для выплат?</b>\n\nБез кошелька вы не сможете принимать криптовалюту. Привяжите адрес за 10 секунд, чтобы начать принимать платежи напрямую!",
	reminderNoWallet3:       "💬 <b>Нужна помощь с настройкой кошелька?</b>\n\nМы заметили, что вы ещё не добавили кошелёк. Если у вас возникли вопросы или трудности, напишите в нашу поддержку @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Некастодиальные платежи — это свобода</b>\n\nВ отличие от других систем, recv отправляет средства прямо на ваш личный кошелёк. 100% дохода остаётся вам. Привяжите кошелёк прямо сейчас!",
	reminderNoWallet5:       "📞 <b>Давайте настроим кошелёк вместе</b>\n\nВсё ещё не добавили кошелёк? Если вы новичок в крипте, напишите нам в поддержку @recvmoneysupport — мы поможем во всём разобраться!",
	reminderNoInvoice:       "＋ <b>Создайте первый счёт</b>\n\nКошелёк настроен, но вы ещё не создали ни одного счёта! Сделайте ссылку на оплату за 10 секунд и отправьте клиентам.",
	reminderNoInvoice2:      "⚡ <b>Начните принимать USDT уже сегодня!</b>\n\nВаш кошелёк для выплат настроен и готов к работе. Создайте ссылку на оплату прямо в этом чате и отправьте её клиентам.",
	reminderNoInvoice3:      "🙋 <b>Не получается создать первый счёт?</b>\n\nМы поможем! Если у вас есть особые требования или вопросы по интеграции, напишите нашей команде поддержки @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Принимайте USDT за 10 секунд</b>\n\nГотовы получить первую оплату? Напишите /invoice прямо сейчас, чтобы создать ссылку на оплату.",
	reminderNoInvoice5:      "⚙️ <b>Нужна интеграция?</b>\n\nЕсли вам нужны API, вебхуки, кастомные боты или плагины для корзины, напишите в @recvmoneysupport, и мы поможем с интеграцией.",
	reminderTrialExhausted:  "💡 <b>Лимит пробного периода исчерпан</b>\n\nВы использовали все бесплатные счета. Выберите тариф, чтобы продолжить принимать USDT без задержек.",
	reminderTrialExhausted2: "💰 <b>0% комиссии с продаж</b>\n\nНа тарифах recv вы платите фиксированную подписку и забираете 100% оборота. Активируйте тариф сегодня!",
	reminderTrialExhausted3: "💬 <b>Индивидуальные условия?</b>\n\nЕсли у вас большие объёмы, особые требования или вопросы по тарифам, напишите нам в @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Нужна помощь со счетами?</b>\n\nСрок оплаты по вашей ссылке истек. Напишите нам, если нужна помощь с тестированием платежей или интеграцией!",
	reminderExpired2:        "🔄 <b>Попробуйте ещё раз!</b>\n\nСоздайте новую ссылку на оплату и попробуйте оплатить её сами в тестовой сети или реальным USDT, чтобы увидеть, как быстро и просто работает подтверждение!",
	reminderExpired3:        "💬 <b>Нужна помощь в тестировании оплаты?</b>\n\nЕсли у вас есть вопросы по поводу подтверждения платежей или комиссий, не стесняйтесь писать нашей поддержке @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Нужна помощь с интеграцией или вебхуками?</b>\n\nЕсли возникли сложности с коллбэками оплаты, API или тестированием, напишите нам в @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Давайте запустим ваши продажи</b>\n\nМы хотим, чтобы вы успешно приняли свой первый платёж. Наша поддержка всегда на связи в @recvmoneysupport.",
	reminderInactive:        "📈 <b>Принимайте оплаты на автопилоте</b>\n\nПрошла неделя с момента создания вашего последнего счёта. recv поможет автоматизировать приём крипты без лишних сложностей.",
	reminderInactive2:       "⭐ <b>Повысьте конверсию ваших продаж!</b>\n\nЗнаете ли вы, что платежные ссылки recv можно встраивать в сайты, приложения и Telegram Mini Apps? Напишите @recvmoneysupport для получения советов по настройке.",
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
	btnPricing:         "Planes en la web",
	btnDocs:            "Docs",
	btnSetWallet:       "Configurar %s",
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
	walletPromptOther: "<b>Configura tu billetera %s</b>\n\nEnvía la dirección en tu próximo mensaje.",
	walletInvalidHint: "⚠️ %s — inténtalo de nuevo.",

	invoicePickWallet:   "<b>Nueva factura</b>\n\n¿Qué billetera debe recibir el pago?",
	invoicePickNetwork:  "<b>Nueva factura</b>\nBilletera · %s\n\n¿Para qué red es esta factura?",
	invoiceStep1:        "<b>Nueva factura</b> · paso 1 de 3\nBilletera · %s\n\n¿Por qué estás cobrando? Envía el título.",
	invoiceStep2:        "<b>Nueva factura</b> · paso 2 de 3\nBilletera · %s\nTítulo · %s\n\n¿Cuánto, en USD? Envía el monto.",
	invoiceStep3:        "<b>Nueva factura</b> · paso 3 de 3\nBilletera · %s\nTítulo · %s\nMonto · %s USD\n\n¿Cuánto tiempo debe estar activo este enlace?",
	invoiceTitleEmpty:   "El título no puede estar vacío — envía unas palabras.",
	invoiceAmountBad:    "Monto no válido. Envía un número positivo en USD, como 49.90.",
	invoiceCreated:      "✅ <b>Factura %s activa</b>\n\n%s\n%s %s · expira en %d min\n\nComparte el enlace de pago de abajo.",
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
	btnPricing:         "Planos no site",
	btnDocs:            "Docs",
	btnSetWallet:       "Configurar %s",
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
	walletPromptOther: "<b>Configure sua carteira %s</b>\n\nEnvie o endereço na próxima mensagem.",
	walletInvalidHint: "⚠️ %s — tente novamente.",

	invoicePickWallet:   "<b>Nova fatura</b>\n\nQual carteira deve receber o pagamento?",
	invoicePickNetwork:  "<b>Nova fatura</b>\nCarteira · %s\n\nEm qual rede deseja faturar?",
	invoiceStep1:        "<b>Nova fatura</b> · etapa 1 de 3\nCarteira · %s\n\nO que você está cobrando? Envie o título.",
	invoiceStep2:        "<b>Nova fatura</b> · etapa 2 de 3\nCarteira · %s\nTítulo · %s\n\nQuanto, em USD? Envie o valor.",
	invoiceStep3:        "<b>Nova fatura</b> · etapa 3 de 3\nCarteira · %s\nTítulo · %s\nValor · %s USD\n\nPor quanto tempo o link deve ficar ativo?",
	invoiceTitleEmpty:   "O título não pode ser vazio — envie algumas palavras.",
	invoiceAmountBad:    "Valor inválido. Envie um número positivo em USD, como 49.90.",
	invoiceCreated:      "✅ <b>Fatura %s ativa</b>\n\n%s\n%s %s · expira em %d min\n\nCompartilhe o link de pagamento abaixo.",
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

func copyFor(language string) botCopy {
	switch store.NormalizeLanguage(language) {
	case "ru":
		return ruCopy
	case "es":
		return esCopy
	case "pt":
		return ptCopy
	default:
		return enCopy
	}
}
