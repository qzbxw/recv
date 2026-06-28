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

	// Telegram Channel Redirection
	tgcRedirTitle string
	tgcRedirBody  string
	btnTgcRedir   string

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
	btnPayCrypto       string
	btnPayStars        string
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
	plansTitle       string
	plansBody        string
	plansCurrent     string // %s plan, %s date
	planLine         string // %s name, %s price, %s features
	planMerchant     string
	planDeveloper    string
	planBusiness     string
	planPickNetwork  string // %s plan name, %s price, %s features
	planPickPeriod   string // %s plan name, %s features
	planPickMethod   string // %s plan name, %d days, %s usd, %d stars
	checkoutCreated  string // %s plan, %s id, %s amount, %s network
	starsInvoiceSent string // %s plan, %d days, %d stars
	starsPaid        string // %s plan, %d days

	// Manual-review callbacks
	markedPaid    string // %s id
	keptUnderpaid string // %s id
	keptReview    string // %s id

	// Language screen
	languageTitle string

	// Retention reminders
	reminderNoWallet        string
	reminderNoWallet2       string
	reminderNoWallet3       string
	reminderNoWallet4       string
	reminderNoWallet5       string
	reminderNoInvoice       string
	reminderNoInvoice2      string
	reminderNoInvoice3      string
	reminderNoInvoice4      string
	reminderNoInvoice5      string
	reminderTrialExhausted  string
	reminderTrialExhausted2 string
	reminderTrialExhausted3 string
	reminderExpired         string
	reminderExpired2        string
	reminderExpired3        string
	reminderExpired4        string
	reminderExpired5        string
	reminderInactive        string
	reminderInactive2       string
	reminderInactive3       string
	reminderInactive4       string
	reminderInactive5       string

	// Callback toasts (answerCallbackQuery)
	toastWalletDisabled      string
	toastActionFailed        string
	toastWaitingTopUp        string
	toastMarkedPaid          string
	toastLeftReview          string
	toastPlanCheckoutCreated string
	toastStarsInvoiceSent    string
	toastLanguageSet         string
	toastUnknownAction       string
}

var enCopy = botCopy{
	lang: "en",

	homeTitle:      "<b>recv</b> — Automated Crypto Acquiring",
	homeWorkspace:  "Workspace · %s",
	homePlan:       "Plan · %s",
	homeWallets:    "Payout wallets · %d",
	homeLatest:     "Last invoice · %s",
	homeNoInvoices: "No invoices generated yet. Create your first invoice to start accepting payments.",
	homeTagline:    "Manage payment links, payout wallets, and subscriptions securely within Telegram.",
	homePlanActive: "⭐ %s plan is active until %s",
	homeTrialLeft:  "Trial · %d free invoices remaining",

	startTitle: "<b>Welcome to recv</b> — Non-custodial acquiring for your business",
	startBody:  "Accept USDT and other cryptocurrencies directly via Telegram. Zero intermediaries, zero holds, and no hidden fees — funds are routed instantly to your personal wallet.",
	startProof: "Set up your payment infrastructure in 1 minute.",

	tgcRedirTitle: "📢 <b>Join Telegram Channel</b>",
	tgcRedirBody:  "Click the button below to join our official channel, where we share analytics, updates, and crypto insights.",
	btnTgcRedir:   "📢 Open @recvmoney",

	btnNewInvoice:      "＋ Create invoice",
	btnRecentInvoices:  "🧾 History",
	btnWallets:         "👛 Payout wallets",
	btnPlans:           "⭐ Billing & Plans",
	btnExtendPlan:      "⭐ Renew plan",
	btnHome:            "🏠 Dashboard",
	btnBack:            "← Back",
	btnCancel:          "✕ Cancel",
	btnLanguage:        "🌐 Language",
	btnOpenCheckout:    "💳 Open checkout",
	btnOpenConsole:     "↗ Open Dashboard",
	btnOpenStats:       "📊 View Analytics",
	btnPricing:         "Pricing & Limits",
	btnDocs:            "API Documentation",
	btnSetWallet:       "Connect %s",
	btnAddWallet:       "＋ Add wallet",
	btnDisable:         "Remove %s",
	btnNewInvoiceShort: "＋ Create another",
	btnPayPlan:         "Pay for %s",
	btnPayCrypto:       "Pay with crypto",
	btnPayStars:        "Pay with Stars",
	btnStartSetup:      "⚙️ Configure wallet",
	btnHowPlans:        "Pricing and fees",
	minuteSuffix:       "min",

	loginTitle: "🔑 <b>Secure Web Authentication</b>",
	loginSteps: "1. Open recv.money in your browser.\n2. Enter your @username.\n3. Click \"Get code\".\n4. Paste the authorization code here.",

	unknownCommand: "Command not recognized. Please use the navigation menu below or commands: /invoice, /wallets, /billing.",

	invoicesTitle: "🧾 <b>Invoice History</b>",
	invoicesEmpty: "No invoices generated yet. Issue your first invoice and share the secure checkout link with your client.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Payout Wallets</b>",
	walletsEmpty:      "No payout wallets configured. Funds are routed directly to your addresses. recv operates strictly non-custodial.",
	walletsSaved:      "✅ Payout wallet securely saved.",
	walletsDisabled:   "Payout wallet disconnected.",
	walletsAddFirst:   "<b>A payout wallet is required to generate an invoice.</b>\n\nTo ensure your funds are routed directly to you without intermediaries, please configure a payout wallet first.",
	walletPromptEVM:   "<b>Wallet configuration: EVM</b>\n\nPlease submit your EVM wallet address to receive customer payments on supported EVM networks.\n\nExample: 0x...\n\nEnsure the exact address is copied.",
	walletPromptSOL:   "<b>Wallet configuration: Solana</b>\n\nPlease submit your Solana wallet address to receive customer payments on the Solana network.\n\nExample: So...\n\nEnsure the exact address is copied.",
	walletPromptTRON:  "<b>Wallet configuration: TRON (TRC-20)</b>\n\nPlease submit your TRON wallet address to receive customer payments on the TRON network.\n\nExample: T...\n\nEnsure the exact address is copied.",
	walletPromptOther: "<b>Wallet configuration: %s</b>\n\nPlease submit your wallet address for this network.\n\nEnsure the exact address is copied.",
	walletInvalidHint: "⚠️ Invalid %s address format. Please verify the data and try again.",

	invoicePickWallet:   "<b>New Invoice</b>\n\nSelect the destination wallet for this payment.",
	invoicePickNetwork:  "<b>New Invoice</b>\nDestination · %s\n\nSelect the blockchain network for this invoice.",
	invoiceStep1:        "<b>New Invoice</b> · Step 1 of 3\nDestination · %s\n\nEnter the invoice description or product name.",
	invoiceStep2:        "<b>New Invoice</b> · Step 2 of 3\nDestination · %s\nDescription · %s\n\nEnter the payable amount in USD.",
	invoiceStep3:        "<b>New Invoice</b> · Step 3 of 3\nDestination · %s\nDescription · %s\nAmount · %s USD\n\nSelect the invoice validity duration.",
	invoiceTitleEmpty:   "Description cannot be empty. Please provide valid details.",
	invoiceAmountBad:    "Invalid amount format. Please enter a valid positive number in USD (e.g., 49.90).",
	invoiceCreated:      "✅ <b>Invoice generated successfully</b>\n\nID: %s\nDescription: %s\nAmount: %s USD\nNetwork: %s\nValid until: %s\n\nShare this secure checkout link with your client:\n%s",
	invoiceTrialReached: "Free invoice limit exhausted. Upgrade to the Merchant plan for standard checkouts or Developer tier for API and webhooks access.",

	plansTitle:       "⭐ <b>recv Billing & Plans</b>",
	plansBody:        "0% processing fees. Funds route instantly to your non-custodial wallets. Select the infrastructure tier that meets your business volume.",
	plansCurrent:     "Active plan · %s (Expires: %s)",
	planLine:         "<b>%s</b> · $%s / 30 days\n%s",
	planMerchant:     "Checkout links, Telegram flow, manual invoice review.",
	planDeveloper:    "Full API access, webhooks, idempotency keys, MCP tools.",
	planBusiness:     "Team access, audit logs, extended limits, priority workflow.",
	planPickNetwork:  "<b>%s</b> · $%s / 30 days\n\n%s\n\nSelect the payment network to proceed:",
	planPickPeriod:   "<b>%s</b>\n\n%s\n\nBilling period:",
	planPickMethod:   "<b>%s</b> · %d days\n\nPrice: $%s or %d Stars\n\nPayment method:",
	checkoutCreated:  "✅ <b>Checkout for %s is generated</b>\n\nInvoice ID: %s\n%s %s\n\nComplete the transaction below. Plan activates automatically upon network confirmation.",
	starsInvoiceSent: "✅ <b>Stars invoice sent</b>\n\n%s · %d days\nAmount: %d Stars\n\nComplete the payment in Telegram. The plan activates automatically.",
	starsPaid:        "✅ <b>%s activated</b>\n\nStars payment received. Access extended by %d days.",

	markedPaid:    "✅ Invoice %s successfully marked as paid.",
	keptUnderpaid: "⏳ Invoice %s remains open pending additional funds.",
	keptReview:    "🔍 Invoice %s requires manual resolution.",

	languageTitle: "🌐 <b>Language Configuration</b>\n\nSystem-wide setting applied to bot interfaces, web dashboard, and payment notifications.",

	reminderNoWallet:        "<b>Your recv workspace requires configuration.</b>\n\nConnect your payout wallet to generate your first invoice. Your private keys and funds remain strictly under your control.",
	reminderNoWallet2:       "<b>Wallet configuration assistance.</b>\n\nConnecting a wallet is secure: recv only utilizes the public address to route payments automatically to you. Select a network to finalize setup.",
	reminderNoWallet3:       "💬 <b>Need technical support?</b>\n\nWe noticed your payout infrastructure isn't fully configured. For integration assistance, contact our technical support at @recvmoneysupport.",
	reminderNoWallet4:       "🔒 <b>Enterprise-grade non-custodial acquiring.</b>\n\nUnlike traditional gateways, recv routes 100% of the transaction volume directly to your addresses. Configure your destination wallet to start.",
	reminderNoWallet5:       "📞 <b>Guided technical onboarding.</b>\n\nIf you require assistance configuring your acquiring environment, our engineering support at @recvmoneysupport is ready to assist you.",
	reminderNoInvoice:       "<b>Infrastructure ready for operation.</b>\n\nYour payout wallet is successfully linked. Generate a test invoice to verify the payment routing flow.",
	reminderNoInvoice2:      "⚡ <b>Launch your USDT processing.</b>\n\nYour workspace is active. You can now generate payment links via the bot interface or our API.",
	reminderNoInvoice3:      "🙋 <b>Integration inquiries?</b>\n\nIf you have specific architectural requirements or B2B processing needs, our team at @recvmoneysupport is available to consult.",
	reminderNoInvoice4:      "💸 <b>Automated cryptocurrency acceptance.</b>\n\nExecute the /invoice command to generate your first secure payment interface for your clients.",
	reminderNoInvoice5:      "⚙️ <b>Custom API infrastructure.</b>\n\nRequire webhooks, API keys, or custom bot logic? Contact @recvmoneysupport to discuss advanced integration options.",
	reminderTrialExhausted:  "⚠️ <b>Free tier capacity reached.</b>\n\nYour trial limits have been utilized. To maintain uninterrupted processing and unlock advanced analytics, please upgrade your workspace plan.",
	reminderTrialExhausted2: "<b>Prevent payment interruptions.</b>\n\nNew invoice generation is currently suspended. Upgrade to Merchant, Developer, or Business tiers to restore full infrastructure capacity.",
	reminderTrialExhausted3: "💬 <b>Enterprise volume requirements?</b>\n\nIf your project exceeds standard throughput limits, contact @recvmoneysupport to discuss custom SLA and pricing.",
	reminderExpired:         "⏳ <b>Invoice expiration notice.</b>\n\nA recent checkout link expired without payment. If you require assistance testing the confirmation logic, our support team is available.",
	reminderExpired2:        "🔄 <b>Verify transaction flow.</b>\n\nGenerate a new checkout link and process a test transaction to validate network confirmation speeds.",
	reminderExpired3:        "💬 <b>Payment confirmation logic.</b>\n\nShould you have technical questions regarding transaction fees or status webhooks, please reach out to @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Webhook configuration.</b>\n\nExperiencing issues with server callbacks or API testing? Contact @recvmoneysupport for engineering assistance.",
	reminderExpired5:        "👋 <b>Ensure seamless checkouts.</b>\n\nWe monitor infrastructure performance to guarantee your payments process correctly. Reach out to @recvmoneysupport if any issues arise.",
	reminderInactive:        "<b>Workspace activity report.</b>\n\nNo recent invoice generation detected. New B2B features have been deployed to recv. Access the dashboard to review your financial metrics.",
	reminderInactive2:       "<b>Workspace activity report.</b>\n\nNo recent invoice generation detected. New B2B features have been deployed to recv. Access the dashboard to review your financial metrics.",
	reminderInactive3:       "👋 <b>Automated acquiring awaits.</b>\n\nYour payment infrastructure remains active. Generate a new checkout link or provide feedback regarding your experience at @recvmoneysupport.",
	reminderInactive4:       "🚀 <b>Optimized cryptocurrency processing.</b>\n\nOur Telegram Mini App dashboard provides real-time access to your USDT flows. Generate a new invoice today to resume operations.",
	reminderInactive5:       "🎁 <b>Product improvement feedback.</b>\n\nWe continuously iterate on our infrastructure. Contact @recvmoneysupport to submit feature requests or architectural feedback.",

	toastWalletDisabled:      "Payout wallet disconnected",
	toastActionFailed:        "System error. Please try again",
	toastWaitingTopUp:        "Pending additional funds",
	toastMarkedPaid:          "Status updated: Paid",
	toastLeftReview:          "Status updated: Manual Review",
	toastPlanCheckoutCreated: "Billing invoice generated",
	toastStarsInvoiceSent:    "Stars invoice sent",
	toastLanguageSet:         "Language preferences updated",
	toastUnknownAction:       "Invalid action requested",
}

var ruCopy = botCopy{
	lang: "ru",

	homeTitle:      "<b>recv</b> — Автоматизированный криптоэквайринг",
	homeWorkspace:  "Воркспейс · %s",
	homePlan:       "Тариф · %s",
	homeWallets:    "Кошельки для выплат · %d",
	homeLatest:     "Последний счет · %s",
	homeNoInvoices: "Вы еще не выставляли счета. Создайте первый счет для начала приема платежей.",
	homeTagline:    "Управление ссылками на оплату, кошельками и подписками в безопасной среде Telegram.",
	homePlanActive: "⭐ Тариф %s активен до %s",
	homeTrialLeft:  "Пробный период · Доступно %d бесплатных счетов",

	startTitle: "<b>Добро пожаловать в recv</b> — Некастодиальный эквайринг для Вашего бизнеса",
	startBody:  "Принимайте платежи в USDT и других криптовалютах через Telegram. Без посредников, заморозок и скрытых комиссий — средства поступают мгновенно на Ваш кошелек.",
	startProof: "Настройте Вашу платежную инфраструктуру за 1 минуту.",

	tgcRedirTitle: "📢 <b>Вступить в Telegram-канал</b>",
	tgcRedirBody:  "Нажмите кнопку ниже, чтобы перейти в наш официальный Telegram-канал, где мы публикуем аналитику, обновления и новости.",
	btnTgcRedir:   "📢 Перейти в @recvmoney",

	btnNewInvoice:      "＋ Выставить счет",
	btnRecentInvoices:  "🧾 История счетов",
	btnWallets:         "👛 Кошельки для выплат",
	btnPlans:           "⭐ Тарифы и биллинг",
	btnExtendPlan:      "⭐ Продлить тариф",
	btnHome:            "🏠 Главная",
	btnBack:            "← Назад",
	btnCancel:          "✕ Отмена",
	btnLanguage:        "🌐 Язык",
	btnOpenCheckout:    "💳 Открыть форму оплаты",
	btnOpenConsole:     "↗ Открыть Дашборд",
	btnOpenStats:       "📊 Посмотреть аналитику",
	btnPricing:         "Тарифы и лимиты",
	btnDocs:            "API Документация",
	btnSetWallet:       "Подключить %s",
	btnAddWallet:       "＋ Добавить кошелек",
	btnDisable:         "Отключить %s",
	btnNewInvoiceShort: "＋ Создать еще один",
	btnPayPlan:         "Оплатить %s",
	btnPayCrypto:       "Оплатить криптовалютой",
	btnPayStars:        "Оплатить Stars",
	btnStartSetup:      "⚙️ Настроить кошелек",
	btnHowPlans:        "Тарифы и комиссии",
	minuteSuffix:       "мин",

	loginTitle: "🔑 <b>Безопасная веб-авторизация</b>",
	loginSteps: "1. Откройте recv.money в Вашем браузере.\n2. Введите Ваш @username.\n3. Нажмите «Получить код».\n4. Вставьте полученный код аутентификации в этот чат.",

	unknownCommand: "Команда не распознана. Пожалуйста, используйте навигационное меню ниже или команды: /invoice, /wallets, /billing.",

	invoicesTitle: "🧾 <b>История счетов</b>",
	invoicesEmpty: "Вы еще не выставляли счета. Создайте первый счет и отправьте клиенту безопасную ссылку на оплату.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Кошельки для выплат</b>",
	walletsEmpty:      "Кошельки не настроены. Средства направляются напрямую на Ваши адреса. recv работает строго по некастодиальной модели.",
	walletsSaved:      "✅ Кошелек для выплат успешно сохранен.",
	walletsDisabled:   "Кошелек отключен.",
	walletsAddFirst:   "**Для выставления счета требуется кошелек для выплат.**\n\nЧтобы Ваши средства направлялись напрямую Вам без участия посредников, пожалуйста, подключите кошелек.",
	walletPromptEVM:   "**Настройка кошелька: EVM**\n\nПожалуйста, отправьте Ваш EVM-адрес для получения платежей в поддерживаемых сетях.\n\nПример: 0x...\n\nВнимательно проверьте корректность адреса.",
	walletPromptSOL:   "**Настройка кошелька: Solana**\n\nПожалуйста, отправьте Ваш адрес для получения платежей в сети Solana.\n\nПример: So...\n\nВнимательно проверьте корректность адреса.",
	walletPromptTRON:  "**Настройка кошелька: TRON (TRC-20)**\n\nПожалуйста, отправьте Ваш адрес для получения платежей в сети TRON.\n\nПример: T...\n\nВнимательно проверьте корректность адреса.",
	walletPromptOther: "**Настройка кошелька: %s**\n\nПожалуйста, отправьте Ваш адрес для получения платежей в данной сети.\n\nВнимательно проверьте корректность адреса.",
	walletInvalidHint: "⚠️ Некорректный формат адреса %s. Пожалуйста, проверьте данные и повторите попытку.",

	invoicePickWallet:   "**Новый счет**\n\nВыберите кошелек для зачисления средств.",
	invoicePickNetwork:  "**Новый счет**\nЗачисление на · %s\n\nВыберите блокчейн-сеть для выставления счета.",
	invoiceStep1:        "**Новый счет** · Шаг 1 из 3\nЗачисление на · %s\n\nУкажите назначение платежа или название продукта.",
	invoiceStep2:        "**Новый счет** · Шаг 2 из 3\nЗачисление на · %s\nНазначение · %s\n\nУкажите сумму к оплате в USD.",
	invoiceStep3:        "**Новый счет** · Шаг 3 из 3\nЗачисление на · %s\nНазначение · %s\nСумма · %s USD\n\nВыберите срок действия ссылки на оплату.",
	invoiceTitleEmpty:   "Назначение платежа не может быть пустым. Укажите корректные данные.",
	invoiceAmountBad:    "Некорректный формат суммы. Введите положительное число в USD (например, 49.90).",
	invoiceCreated:      "✅ **Счет успешно сформирован**\n\nID: %s\nНазначение: %s\nСумма: %s USD\nСеть: %s\nДействителен до: %s\n\nОтправьте данную ссылку клиенту для оплаты:\n%s",
	invoiceTrialReached: "Лимит бесплатных счетов исчерпан. Перейдите на тариф Merchant для стандартных продаж или Developer для доступа к API и вебхукам.",

	plansTitle:       "⭐ <b>Тарифы и Биллинг recv</b>",
	plansBody:        "0% комиссий за эквайринг. Мгновенная маршрутизация средств на Ваши некастодиальные кошельки. Выберите уровень инфраструктуры для Вашего бизнеса.",
	plansCurrent:     "Активный тариф · %s (Действует до: %s)",
	planLine:         "<b>%s</b> · $%s / 30 дней\n%s",
	planMerchant:     "Платежные ссылки, касса в Telegram, ручная проверка платежей.",
	planDeveloper:    "Полный доступ к API, вебхуки, ключи идемпотентности, MCP-инструменты.",
	planBusiness:     "Доступ для команд, аудит-логи, расширенные лимиты, приоритетная поддержка.",
	planPickNetwork:  "**%s** · $%s / 30 дней\n\n%s\n\nВыберите сеть для проведения оплаты:",
	planPickPeriod:   "<b>%s</b>\n\n%s\n\nПериод оплаты:",
	planPickMethod:   "<b>%s</b> · %d дн.\n\nЦена: $%s или %d Stars\n\nСпособ оплаты:",
	checkoutCreated:  "✅ <b>Счет на оплату тарифа %s сформирован</b>\n\nID счета: %s\n%s %s\n\nОплатите счет ниже. Тариф активируется автоматически после подтверждения сетью.",
	starsInvoiceSent: "✅ <b>Счет в Stars отправлен</b>\n\n%s · %d дн.\nСумма: %d Stars\n\nЗавершите оплату в Telegram. Тариф активируется автоматически.",
	starsPaid:        "✅ <b>%s активирован</b>\n\nОплата в Stars получена. Доступ продлен на %d дн.",

	markedPaid:    "✅ Счет %s успешно переведен в статус оплаченного.",
	keptUnderpaid: "⏳ Счет %s оставлен открытым до поступления полной суммы.",
	keptReview:    "🔍 Счет %s оставлен на ручном рассмотрении.",

	languageTitle: "🌐 **Настройки языка**\n\nГлобальные настройки, применяемые к интерфейсу бота, веб-дашборду и уведомлениям об оплате.",

	reminderNoWallet:        "<b>Ваш воркспейс recv требует настройки.</b>\n\nПодключите кошелек для выплат, чтобы выставить первый счет. Ваши закрытые ключи и средства остаются исключительно под Вашим контролем.",
	reminderNoWallet2:       "<b>Помощь в настройке кошелька.</b>\n\nПодключение кошелька полностью безопасно: recv использует только публичный адрес для автоматической маршрутизации платежей. Выберите сеть для завершения настройки.",
	reminderNoWallet3:       "💬 **Требуется техническая поддержка?**\n\nМы заметили, что Ваша платежная инфраструктура настроена не до конца. Для помощи с интеграцией обратитесь к специалистам @recvmoneysupport.",
	reminderNoWallet4:       "🔒 **Некастодиальный эквайринг корпоративного уровня.**\n\nВ отличие от классических шлюзов, recv маршрутизирует 100% объема транзакций на Ваши адреса. Настройте кошелек для начала работы.",
	reminderNoWallet5:       "📞 **Технический онбординг.**\n\nЕсли Вам требуется помощь в настройке эквайринговой среды, наша служба поддержки @recvmoneysupport готова предоставить консультацию.",
	reminderNoInvoice:       "<b>Инфраструктура готова к работе.</b>\n\nВаш кошелек для выплат успешно привязан. Сформируйте тестовый счет для проверки маршрутизации платежей.",
	reminderNoInvoice2:      "⚡ **Запуск процессинга USDT.**\n\nВаш воркспейс активен. Вы можете генерировать ссылки на оплату через интерфейс бота или API.",
	reminderNoInvoice3:      "🙋 **Вопросы по интеграции?**\n\nЕсли у Вас есть специфические архитектурные требования или запросы по B2B-процессингу, команда @recvmoneysupport готова проконсультировать Вас.",
	reminderNoInvoice4:      "💸 **Автоматизированный прием криптовалют.**\n\nИспользуйте команду /invoice для генерации Вашего первого безопасного платежного интерфейса для клиентов.",
	reminderNoInvoice5:      "⚙️ **Кастомная API-инфраструктура.**\n\nТребуются вебхуки, API-ключи или нестандартная логика бота? Свяжитесь с @recvmoneysupport для обсуждения интеграции.",
	reminderTrialExhausted:  "⚠️ **Лимиты бесплатного тарифа исчерпаны.**\n\nДля обеспечения бесперебойного процессинга и доступа к расширенной аналитике, пожалуйста, обновите тарифный план Вашего воркспейса.",
	reminderTrialExhausted2: "**Избегайте остановок в приеме платежей.**\n\nГенерация новых счетов приостановлена. Перейдите на тариф Merchant, Developer или Business для восстановления полной работоспособности инфраструктуры.",
	reminderTrialExhausted3: "💬 **Корпоративные объемы процессинга?**\n\nЕсли Ваш проект превышает стандартные лимиты пропускной способности, свяжитесь с @recvmoneysupport для обсуждения индивидуальных условий.",
	reminderExpired:         "⏳ **Истек срок действия счета.**\n\nСрок действия недавней ссылки на оплату истек. Если Вам требуется помощь в тестировании логики подтверждений, наша поддержка на связи.",
	reminderExpired2:        "🔄 **Проверка транзакционной логики.**\n\nСформируйте новую ссылку и проведите тестовую транзакцию для верификации скорости сетевых подтверждений.",
	reminderExpired3:        "💬 **Логика подтверждения платежей.**\n\nПри возникновении технических вопросов по сетевым комиссиям или вебхукам статусов, обращайтесь в @recvmoneysupport.",
	reminderExpired4:        "🛠️ **Настройка вебхуков.**\n\nВозникли сложности с серверными коллбэками или тестированием API? Обратитесь в @recvmoneysupport за помощью инженеров.",
	reminderExpired5:        "👋 **Обеспечение бесперебойной оплаты.**\n\nМы следим за стабильностью инфраструктуры для гарантии корректного процессинга. При возникновении ошибок свяжитесь с @recvmoneysupport.",
	reminderInactive:        "**Отчет об активности воркспейса.**\n\nГенерация новых счетов не зафиксирована. В recv развернуты новые B2B-инструменты. Откройте дашборд для анализа Ваших финансовых метрик.",
	reminderInactive2:       "**Отчет об активности воркспейса.**\n\nГенерация новых счетов не зафиксирована. В recv развернуты новые B2B-инструменты. Откройте дашборд для анализа Ваших финансовых метрик.",
	reminderInactive3:       "👋 **Автоматизированный эквайринг ожидает.**\n\nВаша платежная инфраструктура активна. Выставьте новый счет или оставьте отзыв о работе сервиса в @recvmoneysupport.",
	reminderInactive4:       "🚀 **Оптимизированный процессинг.**\n\nДашборд внутри Telegram Mini App обеспечивает доступ к Вашим USDT-потокам в реальном времени. Сформируйте новый счет для возобновления работы.",
	reminderInactive5:       "🎁 **Обратная связь по продукту.**\n\nМы непрерывно совершенствуем нашу инфраструктуру. Свяжитесь с @recvmoneysupport для запроса новых функций или обратной связи.",

	toastWalletDisabled:      "Кошелек для выплат отключен",
	toastActionFailed:        "Системная ошибка. Повторите попытку",
	toastWaitingTopUp:        "Ожидается поступление средств",
	toastMarkedPaid:          "Статус обновлен: Оплачен",
	toastLeftReview:          "Статус обновлен: Ручная проверка",
	toastPlanCheckoutCreated: "Счет на оплату сформирован",
	toastStarsInvoiceSent:    "Счет Stars отправлен",
	toastLanguageSet:         "Языковые настройки обновлены",
	toastUnknownAction:       "Запрошено недопустимое действие",
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

	tgcRedirTitle: "📢 <b>Unirse al canal de Telegram</b>",
	tgcRedirBody:  "Haga clic en el botón de abajo para unirse a nuestro canal oficial, donde compartimos análisis, actualizaciones y novedades.",
	btnTgcRedir:   "📢 Abrir @recvmoney",

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

	tgcRedirTitle: "📢 <b>Juntar-se ao canal do Telegram</b>",
	tgcRedirBody:  "Clique no botão abaixo para se juntar ao nosso canal oficial, onde compartilhamos análises, atualizações e novidades.",
	btnTgcRedir:   "📢 Abrir @recvmoney",

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

	tgcRedirTitle: "📢 <b>Telegram-Kanal beitreten</b>",
	tgcRedirBody:  "Klicken Sie auf die Schaltfläche unten, um unserem offiziellen Kanal beizutreten, auf dem wir Analysen, Updates und Krypto-Einblicke teilen.",
	btnTgcRedir:   "📢 Öffnen @recvmoney",

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

	walletsTitle:      "👛 <b>Auszahlungs-Wallets</b>",
	walletsEmpty:      "Noch keine Wallets. Fügen Sie eine hinzu und Zahlungen landen direkt bei Ihnen — recv berührt sie nicht.",
	walletsSaved:      "✅ Wallet gespeichert.",
	walletsDisabled:   "Wallet entfernt.",
	walletsAddFirst:   "<b>Eine Auszahlungs-Wallet ist erforderlich, um eine Rechnung zu erstellen.</b>\n\nDamit Kunden Rechnungen bezahlen können und das Geld bei Ihnen ankommt, verbinden Sie bitte zuerst eine Auszahlungs-Wallet. Das dauert nur wenige Sekunden.",
	walletPromptEVM:   "<b>Wallet-Verbindung: EVM</b>\n\nBitte senden Sie Ihre EVM-Wallet-Adresse in diesen Chat. Kundenzahlungen in den unterstützten EVM-Netzwerken werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>0x...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletPromptSOL:   "<b>Wallet-Verbindung: Solana</b>\n\nBitte senden Sie Ihre Solana-Wallet-Adresse in diesen Chat. Kundenzahlungen auf Solana werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>So...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
	walletPromptTRON:  "<b>Wallet-Verbindung: TRON (TRC-20)</b>\n\nBitte senden Sie Ihre TRON-Wallet-Adresse in diesen Chat. Kundenzahlungen auf TRON werden an diese Adresse weitergeleitet.\n\nBeispiel: <code>T...</code>\n\nStellen Sie sicher, dass die Adresse exakt kopiert wurde.",
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

	tgcRedirTitle: "📢 <b>Telegram kanalga a'zo bo'lish</b>",
	tgcRedirBody:  "Rasmiy kanalimizga qo'shilish uchun quyidagi tugmani bosing, u yerda biz tahlillar, yangiliklar va yangilanishlarni ulashamiz.",
	btnTgcRedir:   "📢 @recvmoney-ga o'tish",

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

	homeTitle:      "<b>recv</b> — платежі на автопілоті",
	homeWorkspace:  "Воркспейс · %s",
	homePlan:       "Тариф · %s",
	homeWallets:    "Кошельки для виплат · %d",
	homeLatest:     "Останній рахунок · %s",
	homeNoInvoices: "Рахунків поки немає — зараз це виправимо.",
	homeTagline:    "Посилання на оплату, гаманці, тариф, останні рахунки — вся каса прямо в чаті.",
	homePlanActive: "⭐ %s активний до %s",
	homeTrialLeft:  "Пробний період · залишилося %d безкоштовних рахунків",

	startTitle: "<b>Ласкаво просимо до recv</b> — некастодіальний криптоеквайринг для вашого бізнесу",
	startBody:  "Приймайте платежі в USDT та інших криптовалютах напряму в Telegram. Жодних посередників, холдів чи прихованих комісій — кошти надходять прямо на ваш особистий гаманець.",
	startProof: "Налаштуйте прийом платежів за 1 хвилину.",

	tgcRedirTitle: "📢 <b>Приєднатися до Telegram-каналу</b>",
	tgcRedirBody:  "Натисніть кнопку нижче, щоб перейти до нашого офіційного Telegram-каналу, де ми ділимося аналітикою, оновленнями та новинами.",
	btnTgcRedir:   "📢 Перейти до @recvmoney",

	btnNewInvoice:      "＋ Новий рахунок",
	btnRecentInvoices:  "🧾 Останні",
	btnWallets:         "👛 Гаманці",
	btnPlans:           "⭐ Тарифи",
	btnExtendPlan:      "⭐ Продовжити тариф",
	btnHome:            "← Додому",
	btnBack:            "← Назад",
	btnCancel:          "✕ Скасувати",
	btnLanguage:        "🌐 Мова",
	btnOpenCheckout:    "💳 Відкрити оплату",
	btnOpenConsole:     "↗ Спробувати Mini app",
	btnOpenStats:       "📊 Статистика в Mini app",
	btnPricing:         "Тарифи на сайті",
	btnDocs:            "Документація",
	btnSetWallet:       "Вказати %s",
	btnAddWallet:       "＋ Додати гаманець",
	btnDisable:         "Прибрати %s",
	btnNewInvoiceShort: "＋ Ще один",
	btnPayPlan:         "Оплатити %s",
	btnStartSetup:      "⚙️ Налаштувати гаманець",
	btnHowPlans:        "Скільки це коштує?",
	minuteSuffix:       "хв",

	loginTitle: "🔑 <b>Вхід через браузер</b>",
	loginSteps: "1. Відкрийте сторінку входу recv у браузері.\n2. Введіть @username.\n3. Натисніть «Отримати код».\n4. Вставте код, який прийде сюди. Готово.",

	unknownCommand: "Я розумію /invoice, /invoices, /wallets, /plans та /language. Але кнопками швидше.",

	invoicesTitle: "🧾 <b>Останні рахунки</b>",
	invoicesEmpty: "Рахунок поки що немає. Створіть перший тут і надішліть покупцю посилання на оплату.",
	invoiceLine:   "<b>%s</b> · %s\n%s %s · %s",

	walletsTitle:      "👛 <b>Гаманці для виплат</b>",
	walletsEmpty:      "Гаманців поки що немає. Додайте - гроші підуть безпосередньо вам, recv їх не стосується.",
	walletsSaved:      "✅ Гаманець збережений.",
	walletsDisabled:   "Гаманець прибраний.",
	walletsAddFirst:   "<b>Для створення рахунку потрібен гаманець.</b>\n\nЩоб Ваші клієнти могли сплатити рахунок, а Ви отримати кошти, будь ласка, прив'яжіть гаманець для виплат. Це триватиме кілька секунд.",
	walletPromptEVM:   "<b>Підключення гаманця: EVM</b>\n\nБудь ласка, відправте в чат адресу EVM-гаманця. На цю адресу будуть автоматично надходити платежі клієнтів у підтримуваних мережах EVM.\n\nПриклад: <code>0x...</code>\n\nПереконайтеся, що копіюєте точну адресу.",
	walletPromptSOL:   "<b>Підключення гаманця: Solana</b>\n\nБудь ласка, відправте в чат адресу Вашого гаманця в мережі Solana. На цю адресу автоматично надходитимуть платежі клієнтів у Solana.\n\nПриклад: <code>So...</code>\n\nПереконайтеся, що копіюєте точну адресу.",
	walletPromptTRON:  "<b>Підключення гаманця: TRON (TRC-20)</b>\n\nБудь ласка, відправте в чат адресу Вашого гаманця в мережі TRON.\nНа цю адресу будуть автоматично надходити всі платежі від Ваших клієнтів.",
	walletPromptOther: "<b>Підключення гаманця: %s</b>\n\nБудь ласка, надішліть адресу Вашого гаманця в чат. На цю адресу будуть автоматично надходити платежі клієнтів.\n\nПереконайтеся, що копіюєте точну адресу.",
	walletInvalidHint: "⚠️ %s — спробуйте ще раз.",

	invoicePickWallet:   "<b>Новий рахунок</b>\n\nНа який гаманець прийняти оплату?",
	invoicePickNetwork:  "<b>Новий рахунок</b>\nГаманець · %s\n\nУ якій мережі виставити рахунок?",
	invoiceStep1:        "<b>Новий рахунок</b> · крок 1 з 3\nГаманець · %s\n\nЗа що беремо оплату? Надішліть назву.",
	invoiceStep2:        "<b>Новий рахунок</b> · крок 2 з 3\nГаманець · %s\nНазва · %s\n\nСкільки в USD? Надішліть суму.",
	invoiceStep3:        "<b>Новий рахунок</b> · крок 3 з 3\nГаманець · %s\nНазва · %s\nСума · %s USD\n\nСкільки посилання має бути активним?",
	invoiceTitleEmpty:   "Назва не може бути порожньою - надішліть пару слів.",
	invoiceAmountBad:    "Це не схоже на суму. Надішліть позитивне число в USD, наприклад 49.90.",
	invoiceCreated:      "✅ <b>Рахунок успішно створений</b>\n\nID: <code>%s</code>\nПризначення: %s\nСума: %s USD\nМережа: %s\nДійсно до: %s\n\nСкопіюйте посилання нижче і надішліть його клієнту для оплати:\n<code>%s",
	invoiceTrialReached: "Пробні заслання закінчилися. Беріть Merchant для звичайних оплат або Developer, якщо потрібні API та веб-хуки.",

	plansTitle:      "⭐ <b>Тарифи recv</b>",
	plansBody:       "0% комісії з обігу. Гроші йдуть одразу на ваш гаманець. Виберіть рівень під вашу механіку.",
	plansCurrent:    "Зараз · %s до %s",
	planLine:        "<b>%s</b> · $%s / 30 днів\n%s",
	planMerchant:    "Платіжні посилання, Telegram-Flow, ручна перевірка.",
	planDeveloper:   "Повний API, веб-хуки, ідемпотентність, MCP-інструменти.",
	planBusiness:    "Команди, audit logs, високі ліміти, пріоритетний workflow.",
	planPickNetwork: "<b>%s</b> · $%s / 30 днів\n\n%s\n\nВиберіть мережу для оплати:",
	checkoutCreated: "✅ <b>Рахунок на %s готовий</b>\n\nІнвойс %s\n%s %s · 30 днів\n\nСплатіть нижче. Після підтвердження тариф увімкнеться автоматично.",

	markedPaid:    "✅ Рахунок %s відзначений оплаченим. Чудово.",
	keptUnderpaid: "⏳ Рахунок %s залишено відкритим. Чекаємо на доплату.",
	keptReview:    "🔍 Рахунок %s залишається на ручній перевірці.",

	languageTitle: "🌐 <b>Мова</b>\n\nЗастосовується скрізь — бот, додаток та повідомлення про оплату синхронізовані.",

	reminderNoWallet:        "<b>Ваш обліковий запис recv майже готовий до роботи.</b>\n\nВи знаходитесь в одному кроці від прийому криптоплатежів. Додайте адресу Вашого гаманця, щоб створити перший рахунок. Ваші кошти залишаються під Вашим контролем.",
	reminderNoWallet2:       "<b>Виникли труднощі з налаштуванням?</b>\n\nДодавання гаманця безпечне: ми використовуємо його тільки для маршрутизації платежів безпосередньо Вам. Виберіть мережу та надішліть адресу, щоб почати.",
	reminderNoWallet3:       "💬 <b>Потрібна допомога з налаштування гаманця?</b>\n\nМи помітили, що ви ще не додали гаманець. Якщо у вас виникли питання чи труднощі, напишіть на нашу підтримку @recvmoneysupport!",
	reminderNoWallet4:       "🔒 <b>Некастодіальні платежі - це свобода</b>\n\nНа відміну від інших систем, recv відправляє кошти прямо на ваш особистий гаманець. 100% прибутку залишається вам. Прив'яжіть гаманець прямо зараз!",
	reminderNoWallet5:       "📞 <b>Давайте налаштуємо гаманець разом</b>\n\nВсе ще не додали гаманець? Якщо ви новачок у крипті, напишіть нам на підтримку @recvmoneysupport - ми допоможемо у всьому розібратися!",
	reminderNoInvoice:       "<b>Ваш гаманець підключений і готовий до прийому платежів.</b>\n\nСтворіть перший тестовий рахунок прямо зараз, щоб побачити, як легко Ваші клієнти зможуть робити оплату.",
	reminderNoInvoice2:      "⚡ <b>Почніть приймати USDT вже сьогодні!</b>\n\nВаш гаманець для виплат налаштований і готовий до роботи. Створіть посилання на оплату прямо в цьому чаті та надішліть його клієнтам.",
	reminderNoInvoice3:      "🙋 <b>Не вдається створити перший рахунок?</b>\n\nМи допоможемо! Якщо у вас є особливі вимоги або питання інтеграції, напишіть нашій команді підтримки @recvmoneysupport.",
	reminderNoInvoice4:      "💸 <b>Приймайте USDT за 10 секунд</b>\n\nГотові отримати першу оплату? Напишіть /invoice зараз, щоб створити посилання на оплату.",
	reminderNoInvoice5:      "⚙️ <b>Потрібна інтеграція?</b>\n\nЯкщо вам потрібні API, вебхуки, кастомні боти або плагіни для кошика, напишіть @recvmoneysupport, і ми допоможемо з інтеграцією.",
	reminderTrialExhausted:  "⚠️ <b>Ваш пробний період завершено.</b>\n\nВи успішно використовували ліміт безкоштовних рахунків. Щоб продовжити приймати платежі без зупинок та отримати доступ до розширеної аналітики, будь ласка, активуйте відповідний тарифний план.",
	reminderTrialExhausted2: "<b>Не втрачайте платежі від Ваших клієнтів.</b>\n\nПрийом нових сплат припинено. Перейдіть на тариф Merchant, Business або Developer, щоб повернути повну функціональність Вашого воркспейсу.",
	reminderTrialExhausted3: "💬 <b>Індивідуальні умови?</b>\n\nЯкщо у вас великі обсяги, особливі вимоги або питання щодо тарифів, напишіть нам @recvmoneysupport.",
	reminderExpired:         "⏳ <b>Потрібна допомога з рахунками?</b>\n\nТермін оплати за вашим посиланням минув. Напишіть нам, якщо потрібна допомога із тестуванням платежів чи інтеграцією!",
	reminderExpired2:        "🔄 <b>Спробуйте ще раз!</b>\n\nСтворіть нове посилання на оплату і спробуйте оплатити його самі в тестовій мережі або реальним USDT, щоб побачити, як швидко та просто працює підтвердження!",
	reminderExpired3:        "💬 <b>Потрібна допомога в тестуванні оплати?</b>\n\nЯкщо у вас є питання щодо підтвердження платежів або комісій, не соромтеся писати нашій підтримці @recvmoneysupport.",
	reminderExpired4:        "🛠️ <b>Потрібна допомога з інтеграцією або вебхуками?</b>\n\nЯкщо виникли труднощі з коллбеками оплати, API або тестуванням, напишіть нам @recvmoneysupport!",
	reminderExpired5:        "👋 <b>Давайте запустимо ваші продажі</b>\n\nМи хочемо, щоб ви успішно прийняли свій перший платіж. Наша підтримка завжди на зв'язку в @recvmoneysupport.",
	reminderInactive:        "<b>Ми помітили, що Ви давно не створювали нових рахунків.</b>\n\nУ recv з'явилися нові функції для Вашого бізнесу. Відкрийте програму, щоб виставити рахунок або перевірити актуальну статистику.",
	reminderInactive2:       "<b>Ми помітили, що Ви давно не створювали нових рахунків.</b>\n\nУ recv з'явилися нові функції для Вашого бізнесу. Відкрийте програму, щоб виставити рахунок або перевірити актуальну статистику.",
	reminderInactive3:       "👋 <b>Ми сумуємо за вами!</b>\n\nВаша автоматична каса все ще чекає на вас. Створіть посилання на оплату прямо зараз або поділіться відгуком із нашою підтримкою @recvmoneysupport!",
	reminderInactive4:       "🚀 <b>Приймайте оплати прямо в Telegram</b>\n\nНаші Mini App і бот роблять прийом USDT максимально простим. Створіть новий рахунок вже сьогодні!",
	reminderInactive5:       "🎁 <b>Поділіться вашим відгуком</b>\n\nМи хочемо зробити сервіс кращим. Напишіть нам @recvmoneysupport і розкажіть, яких функцій вам не вистачає!",

	toastWalletDisabled:      "Гаманець прибраний",
	toastActionFailed:        "Щось пішло не так",
	toastWaitingTopUp:        "Чекаємо на доплату",
	toastMarkedPaid:          "Позначено оплаченим",
	toastLeftReview:          "Залишено на перевірці",
	toastPlanCheckoutCreated: "Рахунок готовий",
	toastLanguageSet:         "Мова оновлена",
	toastUnknownAction:       "Невідома дія",
}

func copyFor(language string) botCopy {
	withDefaults := func(c botCopy) botCopy {
		if c.btnPayCrypto == "" {
			c.btnPayCrypto = enCopy.btnPayCrypto
		}
		if c.btnPayStars == "" {
			c.btnPayStars = enCopy.btnPayStars
		}
		if c.planPickPeriod == "" {
			c.planPickPeriod = enCopy.planPickPeriod
		}
		if c.planPickMethod == "" {
			c.planPickMethod = enCopy.planPickMethod
		}
		if c.starsInvoiceSent == "" {
			c.starsInvoiceSent = enCopy.starsInvoiceSent
		}
		if c.starsPaid == "" {
			c.starsPaid = enCopy.starsPaid
		}
		if c.toastStarsInvoiceSent == "" {
			c.toastStarsInvoiceSent = enCopy.toastStarsInvoiceSent
		}
		return c
	}
	switch store.NormalizeLanguage(language) {
	case "uk":
		return withDefaults(ukCopy)
	case "ru":
		return withDefaults(ruCopy)
	case "es":
		return withDefaults(esCopy)
	case "pt":
		return withDefaults(ptCopy)
	case "de":
		return withDefaults(deCopy)
	case "uz":
		return withDefaults(uzCopy)
	default:
		return withDefaults(enCopy)
	}
}
