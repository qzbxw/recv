package telegram

import "recv/backend/internal/store"

// botCopy is the full localized surface of the Telegram bot. Templates use
// printf verbs and are filled in bot.go with HTML-escaped values. The voice
// matches recv on the web: lowercase brand, confident, terse, action-first.
type botCopy struct {
	lang string

	// Home
	homeTitle       string
	homeWorkspace   string // %s username
	homeWallets     string // %d count
	homeLatest      string // %s latest line
	homeNoInvoices  string
	homeTagline     string
	homeProActive   string // %s = formatted date
	homeTrialLeft   string // %d remaining

	// Buttons
	btnNewInvoice  string
	btnWallets     string
	btnUnlockPRO   string
	btnExtendPRO   string
	btnHome        string
	btnBack        string
	btnCancel      string
	btnLanguage    string
	btnOpenCheckout string
	btnOpenRecv    string
	btnSetWallet   string // %s = network label
	btnDisable     string // %s = network label
	btnNewInvoiceShort string
	minuteSuffix   string // e.g. "min" / "мин"

	// Login
	loginTitle string
	loginSteps string

	// Unknown command / fallback
	unknownCommand string

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
	upgradeTitle   string
	upgradeBody    string
	upgradePrice   string // %s = price label
	upgradePickNet string
	checkoutCreated string // %s id, %s amount, %s network

	// Manual-review callbacks
	markedPaid     string // %s id
	keptUnderpaid  string // %s id
	keptReview     string // %s id

	// Language screen
	languageTitle string

	// Callback toasts (answerCallbackQuery)
	toastWalletDisabled  string
	toastActionFailed    string
	toastWaitingTopUp    string
	toastMarkedPaid      string
	toastLeftReview      string
	toastUpgradeCreated  string
	toastLanguageSet     string
	toastUnknownAction   string
}

var enCopy = botCopy{
	lang: "en",

	homeTitle:      "<b>recv</b> — payments on autopilot",
	homeWorkspace:  "Workspace · %s",
	homeWallets:    "Payout wallets · %d",
	homeLatest:     "Last invoice · %s",
	homeNoInvoices: "No invoices yet — let's fix that.",
	homeTagline:    "Spin up a payment link, manage payouts, or go PRO. Everything lives here.",
	homeProActive:  "⭐ PRO active until %s",
	homeTrialLeft:  "Trial · %d free invoices left",

	btnNewInvoice:      "＋ New invoice",
	btnWallets:         "👛 Wallets",
	btnUnlockPRO:       "⭐ Unlock PRO",
	btnExtendPRO:       "⭐ Extend PRO",
	btnHome:            "← Home",
	btnBack:            "← Back",
	btnCancel:          "✕ Cancel",
	btnLanguage:        "🌐 Language",
	btnOpenCheckout:    "💳 Open checkout",
	btnOpenRecv:        "↗ Open recv",
	btnSetWallet:       "Set %s",
	btnDisable:         "Remove %s",
	btnNewInvoiceShort: "＋ One more",
	minuteSuffix:       "min",

	loginTitle: "🔑 <b>Sign in on the web</b>",
	loginSteps: "1. Open the recv sign-in page in your browser.\n2. Type your @username.\n3. Tap “Get code”.\n4. Paste the code we send you here. Done.",

	unknownCommand: "Not a command I know. Try /invoice for a payment link, /wallets to manage payouts, or /upgrade to go PRO.",

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
	invoiceTrialReached: "You're out of free invoices. Unlock PRO and keep the links flowing.",

	upgradeTitle:    "⭐ <b>recv PRO</b>",
	upgradeBody:     "Unlimited invoices for 30 days. No turnover fees, ever.",
	upgradePrice:    "Price · %s",
	upgradePickNet:  "Pick how you'd like to pay:",
	checkoutCreated: "✅ <b>PRO checkout ready</b>\n\n%s\n%s %s · 30 days of unlimited invoices\n\nPay below and you're in.",

	markedPaid:    "✅ Invoice %s marked as paid. Nice.",
	keptUnderpaid: "⏳ Invoice %s left open. We'll watch for the top-up.",
	keptReview:    "🔍 Invoice %s stays in manual review.",

	languageTitle: "🌐 <b>Language</b>\n\nThis applies everywhere — bot, app and payment alerts stay in sync.",

	toastWalletDisabled: "Wallet removed",
	toastActionFailed:   "Something went wrong",
	toastWaitingTopUp:   "Watching for top-up",
	toastMarkedPaid:     "Marked as paid",
	toastLeftReview:     "Left in review",
	toastUpgradeCreated: "Checkout ready",
	toastLanguageSet:    "Language updated",
	toastUnknownAction:  "Unknown action",
}

var ruCopy = botCopy{
	lang: "ru",

	homeTitle:      "<b>recv</b> — платежи на автопилоте",
	homeWorkspace:  "Воркспейс · %s",
	homeWallets:    "Кошельки для выплат · %d",
	homeLatest:     "Последний счёт · %s",
	homeNoInvoices: "Счетов пока нет — сейчас исправим.",
	homeTagline:    "Создайте ссылку на оплату, настройте выплаты или подключите PRO. Всё здесь.",
	homeProActive:  "⭐ PRO активен до %s",
	homeTrialLeft:  "Пробный период · осталось %d бесплатных счетов",

	btnNewInvoice:      "＋ Новый счёт",
	btnWallets:         "👛 Кошельки",
	btnUnlockPRO:       "⭐ Подключить PRO",
	btnExtendPRO:       "⭐ Продлить PRO",
	btnHome:            "← Домой",
	btnBack:            "← Назад",
	btnCancel:          "✕ Отмена",
	btnLanguage:        "🌐 Язык",
	btnOpenCheckout:    "💳 Открыть оплату",
	btnOpenRecv:        "↗ Открыть recv",
	btnSetWallet:       "Указать %s",
	btnDisable:         "Убрать %s",
	btnNewInvoiceShort: "＋ Ещё один",
	minuteSuffix:       "мин",

	loginTitle: "🔑 <b>Вход через браузер</b>",
	loginSteps: "1. Откройте страницу входа recv в браузере.\n2. Введите свой @username.\n3. Нажмите «Получить код».\n4. Вставьте код, который придёт сюда. Готово.",

	unknownCommand: "Не знаю такую команду. Попробуйте /invoice для ссылки на оплату, /wallets для выплат или /upgrade для PRO.",

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
	invoiceTrialReached: "Бесплатные счета закончились. Подключите PRO — и продолжайте.",

	upgradeTitle:    "⭐ <b>recv PRO</b>",
	upgradeBody:     "Безлимит счетов на 30 дней. Без комиссий с оборота. Никогда.",
	upgradePrice:    "Цена · %s",
	upgradePickNet:  "Выберите, чем оплатить:",
	checkoutCreated: "✅ <b>Счёт на PRO готов</b>\n\n%s\n%s %s · 30 дней безлимита\n\nОплатите ниже — и вы в деле.",

	markedPaid:    "✅ Счёт %s отмечен оплаченным. Отлично.",
	keptUnderpaid: "⏳ Счёт %s оставлен открытым. Ждём доплату.",
	keptReview:    "🔍 Счёт %s остаётся на ручной проверке.",

	languageTitle: "🌐 <b>Язык</b>\n\nПрименяется везде — бот, приложение и уведомления об оплате синхронизированы.",

	toastWalletDisabled: "Кошелёк убран",
	toastActionFailed:   "Что-то пошло не так",
	toastWaitingTopUp:   "Ждём доплату",
	toastMarkedPaid:     "Отмечено оплаченным",
	toastLeftReview:     "Оставлено на проверке",
	toastUpgradeCreated: "Счёт готов",
	toastLanguageSet:    "Язык обновлён",
	toastUnknownAction:  "Неизвестное действие",
}

func copyFor(language string) botCopy {
	if store.NormalizeLanguage(language) == "ru" {
		return ruCopy
	}
	return enCopy
}
