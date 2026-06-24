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

	toastWalletDisabled:      "Кошелёк убран",
	toastActionFailed:        "Что-то пошло не так",
	toastWaitingTopUp:        "Ждём доплату",
	toastMarkedPaid:          "Отмечено оплаченным",
	toastLeftReview:          "Оставлено на проверке",
	toastPlanCheckoutCreated: "Счёт готов",
	toastLanguageSet:         "Язык обновлён",
	toastUnknownAction:       "Неизвестное действие",
}

func copyFor(language string) botCopy {
	if store.NormalizeLanguage(language) == "ru" {
		return ruCopy
	}
	return enCopy
}
