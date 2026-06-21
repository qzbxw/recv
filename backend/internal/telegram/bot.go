package telegram

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/metrics"
	"recv/backend/internal/service"
	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

type botFlow string

const (
	flowIdle          botFlow = ""
	flowWalletAddress botFlow = "wallet_address"
	flowInvoiceTitle  botFlow = "invoice_title"
	flowInvoiceAmount botFlow = "invoice_amount"
)

type BotWorker struct {
	store          *store.Store
	invoiceService *service.InvoiceService
	token          string
	publicAppURL   string
	httpClient     *http.Client
	webhookClient  *http.Client
	logger         *slog.Logger
	offset         int64
	sessions       map[int64]*botSession
}

type botSession struct {
	MenuMessageID int64
	Flow          botFlow
	WalletNetwork store.Network
	DraftInvoice  botInvoiceDraft
}

type botInvoiceDraft struct {
	WalletID       int64
	WalletNetwork  store.Network
	PayableNetwork store.Network
	WalletLabel    string
	Title          string
	Amount         string
}

type tgAPIResponse[T any] struct {
	OK          bool   `json:"ok"`
	Description string `json:"description"`
	Result      T      `json:"result"`
}

type tgUpdate struct {
	UpdateID      int64            `json:"update_id"`
	Message       *tgMessage       `json:"message"`
	CallbackQuery *tgCallbackQuery `json:"callback_query"`
}

type tgMessage struct {
	MessageID int64  `json:"message_id"`
	Text      string `json:"text"`
	Chat      struct {
		ID int64 `json:"id"`
	} `json:"chat"`
	From *tgUser `json:"from"`
}

type tgUser struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
}

type tgCallbackQuery struct {
	ID      string     `json:"id"`
	Data    string     `json:"data"`
	From    tgUser     `json:"from"`
	Message *tgMessage `json:"message"`
}

type tgInlineKeyboardMarkup struct {
	InlineKeyboard [][]tgInlineKeyboardButton `json:"inline_keyboard"`
}

type tgInlineKeyboardButton struct {
	Text         string `json:"text"`
	CallbackData string `json:"callback_data,omitempty"`
	URL          string `json:"url,omitempty"`
}

type notificationPayload struct {
	InvoiceID      int64                `json:"invoice_id"`
	PublicID       string               `json:"public_id"`
	InvoiceActions []notificationAction `json:"invoice_actions"`
}

type notificationAction struct {
	Kind string `json:"kind"`
	Text string `json:"text"`
	Data string `json:"data"`
	URL  string `json:"url"`
}

func NewBotWorker(st *store.Store, invoiceService *service.InvoiceService, token string, publicAppURL string, logger *slog.Logger) *BotWorker {
	return &BotWorker{
		store:          st,
		invoiceService: invoiceService,
		token:          token,
		publicAppURL:   publicAppURL,
		logger:         logger,
		sessions:       map[int64]*botSession{},
		httpClient: &http.Client{
			Timeout: 35 * time.Second,
		},
		// Seller webhook endpoints get a much tighter budget than Telegram
		// long-polling so one slow endpoint cannot stall the delivery batch.
		webhookClient: &http.Client{
			Timeout:   15 * time.Second,
			Transport: safeWebhookTransport(),
			CheckRedirect: func(req *http.Request, via []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
	}
}

func (b *BotWorker) Run(ctx context.Context) error {
	ctx = metrics.WithSource(ctx, "telegram_bot")

	// Seller webhook deliveries run on their own cadence so Telegram
	// long-polling and notification sends never delay them (and vice versa).
	webhookDone := make(chan struct{})
	go func() {
		defer close(webhookDone)
		b.runWebhookDeliveryLoop(ctx)
	}()
	defer func() { <-webhookDone }()

	if strings.TrimSpace(b.token) == "" {
		b.logger.Info("telegram bot token is empty, running webhook delivery worker without Telegram polling")
		<-ctx.Done()
		return ctx.Err()
	}

	for {
		if err := b.flush(ctx); err != nil {
			b.logger.Error("flush delivery jobs", "error", err)
		}

		updates, err := b.getUpdates(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return ctx.Err()
			}
			b.logger.Error("poll telegram updates", "error", err)
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(2 * time.Second):
			}
			continue
		}

		for _, update := range updates {
			b.offset = update.UpdateID + 1
			if err := b.handleUpdate(ctx, update); err != nil {
				b.logger.Error("handle telegram update", "update_id", update.UpdateID, "error", err)
			}
		}
	}
}

func (b *BotWorker) runWebhookDeliveryLoop(ctx context.Context) {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()
	for {
		if err := b.flushWebhookDeliveries(ctx); err != nil {
			b.logger.Error("flush webhook deliveries", "error", err)
		}
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (b *BotWorker) flush(ctx context.Context) error {
	if strings.TrimSpace(b.token) == "" {
		return nil
	}
	jobs, err := b.store.ClaimNotificationJobs(ctx, 20)
	if err != nil {
		return err
	}

	for _, job := range jobs {
		keyboard := b.notificationKeyboard(job.Payload)
		if _, err := b.sendMessage(ctx, job.RecipientTelegramID, job.Message, keyboard); err != nil {
			_ = b.store.MarkNotificationFailed(ctx, job.ID, err.Error())
			continue
		}
		_ = b.store.MarkNotificationSent(ctx, job.ID)
	}
	return nil
}

func (b *BotWorker) handleUpdate(ctx context.Context, update tgUpdate) error {
	switch {
	case update.CallbackQuery != nil:
		return b.handleCallback(ctx, update.CallbackQuery)
	case update.Message != nil:
		return b.handleMessage(ctx, update.Message)
	default:
		return nil
	}
}

func (b *BotWorker) handleMessage(ctx context.Context, message *tgMessage) error {
	if message == nil || message.From == nil {
		return nil
	}

	workspace, err := b.ensureWorkspace(ctx, *message.From)
	if err != nil {
		return err
	}

	text := strings.TrimSpace(message.Text)
	if strings.HasPrefix(text, "/") {
		fields := strings.Fields(text)
		if len(fields) > 0 {
			cmd := fields[0]
			if strings.ToLower(cmd) == "/start" && len(fields) > 1 {
				param := fields[1]
				utm, refCode := parseStartParam(param)
				if utm != nil {
					attrID := fmt.Sprintf("tg-bot-%d-%d", workspace.ID, time.Now().UTC().UnixNano())
					utm.AttributionID = attrID
					utm.LandingPath = "/tg-bot"
					_ = b.store.RecordUTMVisit(ctx, *utm)
					_ = b.store.RecordUTMAttribution(ctx, workspace.ID, *utm)
				}
				if refCode != "" {
					_ = b.store.AttachReferralSignup(ctx, workspace.ID, refCode)
				}
			}
			return b.handleCommand(ctx, workspace, message, cmd)
		}
	}

	session := b.session(message.Chat.ID)
	switch session.Flow {
	case flowWalletAddress:
		return b.handleWalletAddressInput(ctx, workspace, message, text)
	case flowInvoiceTitle:
		return b.handleInvoiceTitleInput(ctx, workspace, message, text)
	case flowInvoiceAmount:
		return b.handleInvoiceAmountInput(ctx, workspace, message, text)
	default:
		return nil
	}
}

func (b *BotWorker) handleCommand(ctx context.Context, workspace store.Workspace, message *tgMessage, command string) error {
	c := copyFor(workspace.Language)
	switch strings.ToLower(command) {
	case "/start", "/menu":
		b.resetSession(message.Chat.ID)
		return b.renderHome(ctx, workspace, message.Chat.ID, 0)
	case "/login":
		msg := c.loginTitle + "\n\n" + c.loginSteps
		_, err := b.sendMessage(ctx, message.Chat.ID, msg, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
		return err
	case "/invoice":
		return b.renderInvoiceWalletPicker(ctx, workspace, message.Chat.ID, 0)
	case "/invoices", "/recent":
		return b.renderRecentInvoices(ctx, workspace, message.Chat.ID, 0)
	case "/wallets":
		return b.renderWallets(ctx, workspace, message.Chat.ID, 0, "")
	case "/upgrade", "/plans", "/billing":
		return b.renderPlans(ctx, workspace, message.Chat.ID, 0, "")
	case "/language", "/lang":
		return b.renderLanguage(ctx, workspace, message.Chat.ID, 0)
	default:
		_, err := b.sendMessage(ctx, message.Chat.ID, c.unknownCommand, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
		return err
	}
}

func (b *BotWorker) handleCallback(ctx context.Context, query *tgCallbackQuery) error {
	if query == nil || query.Message == nil {
		return nil
	}

	workspace, err := b.ensureWorkspace(ctx, query.From)
	if err != nil {
		return err
	}

	session := b.session(query.Message.Chat.ID)
	session.MenuMessageID = query.Message.MessageID
	data := strings.TrimSpace(query.Data)
	c := copyFor(workspace.Language)

	var callbackText string
	switch {
	case data == "nav:home":
		b.resetSession(query.Message.Chat.ID)
		err = b.renderHome(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case data == "screen:wallets":
		err = b.renderWallets(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID, "")
	case data == "screen:invoice":
		err = b.renderInvoiceWalletPicker(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case data == "screen:invoices":
		err = b.renderRecentInvoices(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case data == "screen:upgrade":
		err = b.renderPlans(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID, "")
	case data == "screen:language":
		err = b.renderLanguage(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case strings.HasPrefix(data, "lang:set:"):
		language := store.NormalizeLanguage(strings.TrimPrefix(data, "lang:set:"))
		updated, setErr := b.store.UpdateWorkspaceLanguage(ctx, workspace.ID, language)
		if setErr != nil {
			err = setErr
			break
		}
		workspace = updated
		callbackText = copyFor(updated.Language).toastLanguageSet
		b.resetSession(query.Message.Chat.ID)
		err = b.renderHome(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case strings.HasPrefix(data, "wallet:set:"):
		network := store.Network(strings.TrimPrefix(data, "wallet:set:"))
		session.Flow = flowWalletAddress
		session.WalletNetwork = network
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.walletAddressPrompt(c, network), b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnBack, CallbackData: "screen:wallets"}},
		}))
	case strings.HasPrefix(data, "wallet:disable:"):
		walletID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "wallet:disable:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		err = b.store.DeactivateWallet(ctx, workspace.ID, walletID)
		if err == nil {
			err = b.renderWallets(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID, c.walletsDisabled)
			callbackText = c.toastWalletDisabled
		}
	case strings.HasPrefix(data, "invoice:new:"):
		walletID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:new:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		wallet, getErr := b.store.GetWalletByID(ctx, workspace.ID, walletID)
		if getErr != nil {
			err = getErr
			break
		}
		session.DraftInvoice = botInvoiceDraft{
			WalletID:      wallet.ID,
			WalletNetwork: wallet.Network,
			WalletLabel:   fmt.Sprintf("%s • %s", networkButtonLabel(wallet.Network), shortAddress(wallet.Address)),
		}
		rows := make([][]tgInlineKeyboardButton, 0, 5)
		for _, network := range payableNetworksForWallet(wallet.Network) {
			rows = append(rows, []tgInlineKeyboardButton{{
				Text:         networkButtonLabel(network),
				CallbackData: fmt.Sprintf("invoice:network:%d:%s", wallet.ID, network),
			}})
		}
		rows = append(rows, []tgInlineKeyboardButton{{Text: c.btnCancel, CallbackData: "invoice:cancel"}})
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.invoiceNetworkPrompt(c, session.DraftInvoice), b.recvKeyboard(rows))
	case strings.HasPrefix(data, "invoice:network:"):
		parts := strings.Split(data, ":")
		if len(parts) != 4 {
			err = fmt.Errorf("invalid invoice network callback")
			break
		}
		walletID, parseErr := strconv.ParseInt(parts[2], 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		wallet, getErr := b.store.GetWalletByID(ctx, workspace.ID, walletID)
		if getErr != nil {
			err = getErr
			break
		}
		network := store.Network(parts[3])
		if !network.IsSupportedPayableNetwork() || wallet.Network != network.WalletBucket() {
			err = fmt.Errorf("wallet does not support network %s", network)
			break
		}
		session.Flow = flowInvoiceTitle
		session.DraftInvoice = botInvoiceDraft{
			WalletID:       wallet.ID,
			WalletNetwork:  wallet.Network,
			PayableNetwork: network,
			WalletLabel:    fmt.Sprintf("%s • %s", networkButtonLabel(network), shortAddress(wallet.Address)),
		}
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, b.invoiceTitlePrompt(c, session.DraftInvoice), b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnCancel, CallbackData: "invoice:cancel"}},
		}))
	case strings.HasPrefix(data, "invoice:lifetime:"):
		minutes, parseErr := strconv.Atoi(strings.TrimPrefix(data, "invoice:lifetime:"))
		if parseErr != nil {
			err = parseErr
			break
		}
		err = b.finishInvoiceWizard(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID, minutes)
	case strings.HasPrefix(data, "plan:select:"):
		planCode := store.NormalizePlanCode(strings.TrimPrefix(data, "plan:select:"))
		if planCode == store.PlanCodeTrial {
			err = fmt.Errorf("trial plan does not require checkout")
			break
		}
		err = b.renderPlanNetworkPicker(ctx, workspace, planCode, query.Message.Chat.ID, query.Message.MessageID)
	case strings.HasPrefix(data, "plan:network:"):
		parts := strings.Split(data, ":")
		if len(parts) != 4 {
			err = fmt.Errorf("invalid plan network callback")
			break
		}
		planCode := store.NormalizePlanCode(parts[2])
		network := store.Network(parts[3])
		invoice, createErr := b.invoiceService.CreatePlanInvoice(ctx, workspace, planCode, network)
		if createErr != nil {
			err = createErr
			break
		}
		plan := store.ResolvePlan(planCode)
		callbackText = c.toastPlanCheckoutCreated
		checkoutText := fmt.Sprintf(c.checkoutCreated, esc(plan.Name), esc(invoice.PublicID), esc(invoice.PayableAmount.StringFixed(6)), esc(string(invoice.PayableNetwork)))
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, checkoutText, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnOpenCheckout, URL: b.appURL("/checkout/" + invoice.PublicID)}},
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
	case strings.HasPrefix(data, "upgrade:network:"):
		network := store.Network(strings.TrimPrefix(data, "upgrade:network:"))
		invoice, createErr := b.invoiceService.CreatePlanInvoice(ctx, workspace, store.PlanCodeMerchant, network)
		if createErr != nil {
			err = createErr
			break
		}
		plan := store.ResolvePlan(store.PlanCodeMerchant)
		callbackText = c.toastPlanCheckoutCreated
		checkoutText := fmt.Sprintf(c.checkoutCreated, esc(plan.Name), esc(invoice.PublicID), esc(invoice.PayableAmount.StringFixed(6)), esc(string(invoice.PayableNetwork)))
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, checkoutText, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnOpenCheckout, URL: b.appURL("/checkout/" + invoice.PublicID)}},
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
	case data == "invoice:cancel":
		b.resetSession(query.Message.Chat.ID)
		err = b.renderHome(ctx, workspace, query.Message.Chat.ID, query.Message.MessageID)
	case strings.HasPrefix(data, "invoice:mark_paid:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:mark_paid:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, markErr := b.store.MarkInvoicePaidManual(ctx, workspace.ID, invoiceID)
		if markErr != nil {
			err = markErr
			break
		}
		callbackText = c.toastMarkedPaid
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf(c.markedPaid, esc(invoice.PublicID)), b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
	case strings.HasPrefix(data, "invoice:keep_underpaid:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:keep_underpaid:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, getErr := b.store.GetInvoiceByID(ctx, workspace.ID, invoiceID)
		if getErr != nil {
			err = getErr
			break
		}
		callbackText = c.toastWaitingTopUp
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf(c.keptUnderpaid, esc(invoice.PublicID)), b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
	case strings.HasPrefix(data, "invoice:keep_review:"):
		invoiceID, parseErr := strconv.ParseInt(strings.TrimPrefix(data, "invoice:keep_review:"), 10, 64)
		if parseErr != nil {
			err = parseErr
			break
		}
		invoice, getErr := b.store.GetInvoiceByID(ctx, workspace.ID, invoiceID)
		if getErr != nil {
			err = getErr
			break
		}
		callbackText = c.toastLeftReview
		err = b.editMessage(ctx, query.Message.Chat.ID, query.Message.MessageID, fmt.Sprintf(c.keptReview, esc(invoice.PublicID)), b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnHome, CallbackData: "nav:home"}},
		}))
	default:
		callbackText = c.toastUnknownAction
	}

	if callbackText != "" {
		_ = b.answerCallbackQuery(ctx, query.ID, callbackText)
	}
	if err != nil {
		_ = b.answerCallbackQuery(ctx, query.ID, c.toastActionFailed)
	}
	return err
}

func (b *BotWorker) handleWalletAddressInput(ctx context.Context, workspace store.Workspace, message *tgMessage, text string) error {
	c := copyFor(workspace.Language)
	session := b.session(message.Chat.ID)
	address := strings.TrimSpace(text)
	if err := validateWallet(session.WalletNetwork, address); err != nil {
		hint := fmt.Sprintf(c.walletInvalidHint, esc(err.Error()))
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.walletAddressPrompt(c, session.WalletNetwork)+"\n\n"+hint, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnBack, CallbackData: "screen:wallets"}},
		}))
	}

	if _, err := b.store.CreateWallet(ctx, workspace.ID, session.WalletNetwork, address); err != nil {
		return err
	}
	session.Flow = flowIdle
	session.WalletNetwork = ""
	return b.renderWallets(ctx, workspace, message.Chat.ID, session.MenuMessageID, c.walletsSaved)
}

func (b *BotWorker) handleInvoiceTitleInput(ctx context.Context, workspace store.Workspace, message *tgMessage, text string) error {
	c := copyFor(workspace.Language)
	session := b.session(message.Chat.ID)
	title := strings.TrimSpace(text)
	if title == "" {
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceTitlePrompt(c, session.DraftInvoice)+"\n\n"+c.invoiceTitleEmpty, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnCancel, CallbackData: "invoice:cancel"}},
		}))
	}
	session.DraftInvoice.Title = title
	session.Flow = flowInvoiceAmount
	return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceAmountPrompt(c, session.DraftInvoice), b.recvKeyboard([][]tgInlineKeyboardButton{
		{{Text: c.btnCancel, CallbackData: "invoice:cancel"}},
	}))
}

func (b *BotWorker) handleInvoiceAmountInput(ctx context.Context, workspace store.Workspace, message *tgMessage, text string) error {
	c := copyFor(workspace.Language)
	session := b.session(message.Chat.ID)
	amountText := strings.TrimSpace(strings.ReplaceAll(text, ",", "."))
	amount, err := decimal.NewFromString(amountText)
	if err != nil || !amount.IsPositive() {
		return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceAmountPrompt(c, session.DraftInvoice)+"\n\n"+c.invoiceAmountBad, b.recvKeyboard([][]tgInlineKeyboardButton{
			{{Text: c.btnCancel, CallbackData: "invoice:cancel"}},
		}))
	}
	session.DraftInvoice.Amount = amount.StringFixed(2)
	session.Flow = flowIdle
	return b.editMessage(ctx, message.Chat.ID, session.MenuMessageID, b.invoiceLifetimePrompt(c, session.DraftInvoice), b.recvKeyboard([][]tgInlineKeyboardButton{
		{
			{Text: "15 " + c.minuteSuffix, CallbackData: "invoice:lifetime:15"},
			{Text: "30 " + c.minuteSuffix, CallbackData: "invoice:lifetime:30"},
			{Text: "60 " + c.minuteSuffix, CallbackData: "invoice:lifetime:60"},
		},
		{
			{Text: c.btnCancel, CallbackData: "invoice:cancel"},
		},
	}))
}

func (b *BotWorker) finishInvoiceWizard(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64, minutes int) error {
	c := copyFor(workspace.Language)
	session := b.session(chatID)
	amount, err := decimal.NewFromString(session.DraftInvoice.Amount)
	if err != nil {
		return err
	}

	invoice, err := b.invoiceService.CreateInvoice(ctx, workspace, service.CreateInvoiceInput{
		Title:            session.DraftInvoice.Title,
		BaseAmountUSD:    amount,
		WalletID:         session.DraftInvoice.WalletID,
		PayableNetwork:   session.DraftInvoice.PayableNetwork,
		ExpiresInMinutes: minutes,
	})
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "trial limit reached") {
			return b.renderPlans(ctx, workspace, chatID, messageID, c.invoiceTrialReached)
		}
		return err
	}

	b.resetSession(chatID)
	checkoutURL := b.appURL("/checkout/" + invoice.PublicID)
	text := fmt.Sprintf(c.invoiceCreated, esc(invoice.PublicID), esc(invoice.Title), esc(invoice.PayableAmount.StringFixed(6)), esc(string(invoice.PayableNetwork)), minutes)
	return b.editMessage(ctx, chatID, messageID, text, b.recvKeyboard([][]tgInlineKeyboardButton{
		{{Text: c.btnOpenCheckout, URL: checkoutURL}},
		{{Text: c.btnNewInvoiceShort, CallbackData: "screen:invoice"}, {Text: c.btnHome, CallbackData: "nav:home"}},
	}))
}

func (b *BotWorker) renderHome(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64) error {
	c := copyFor(workspace.Language)
	now := time.Now()
	wallets, err := b.store.ListWallets(ctx, workspace.ID)
	if err != nil {
		return err
	}
	invoices, _, err := b.store.ListInvoices(ctx, workspace.ID, store.ListInvoicesFilter{Limit: 1})
	if err != nil {
		return err
	}

	lines := []string{
		c.homeTitle,
		"",
		fmt.Sprintf(c.homeWorkspace, "<code>"+esc(workspaceHandle(workspace))+"</code>"),
		fmt.Sprintf(c.homePlan, esc(workspace.EffectivePlan(now).Name)),
		fmt.Sprintf(c.homeWallets, len(wallets)),
	}
	if len(invoices) > 0 {
		latest := fmt.Sprintf("%s · %s %s", invoices[0].Title, invoices[0].PayableAmount.StringFixed(6), invoices[0].PayableNetwork)
		lines = append(lines, fmt.Sprintf(c.homeLatest, esc(latest)))
	} else {
		lines = append(lines, c.homeNoInvoices)
	}

	if workspace.HasActiveSubscription(now) && workspace.SubscriptionEndsAt != nil {
		lines = append(lines, "", fmt.Sprintf(c.homePlanActive, esc(workspace.EffectivePlan(now).Name), workspace.SubscriptionEndsAt.Format("2006-01-02")))
	} else {
		remaining := service.TrialInvoiceLimit - workspace.FreeInvoicesUsed
		if remaining < 0 {
			remaining = 0
		}
		lines = append(lines, "", fmt.Sprintf(c.homeTrialLeft, remaining))
	}
	lines = append(lines, "", c.homeTagline)

	planButton := tgInlineKeyboardButton{Text: c.btnPlans, CallbackData: "screen:upgrade"}
	if workspace.HasActiveSubscription(now) {
		planButton = tgInlineKeyboardButton{Text: c.btnExtendPlan, CallbackData: "screen:upgrade"}
	}

	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.recvKeyboard([][]tgInlineKeyboardButton{
		{
			{Text: c.btnNewInvoice, CallbackData: "screen:invoice"},
			{Text: c.btnRecentInvoices, CallbackData: "screen:invoices"},
		},
		{
			{Text: c.btnWallets, CallbackData: "screen:wallets"},
			planButton,
		},
		{
			{Text: c.btnLanguage, CallbackData: "screen:language"},
		},
	}))
}

func (b *BotWorker) renderLanguage(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64) error {
	c := copyFor(workspace.Language)
	check := func(lang string) string {
		if store.NormalizeLanguage(workspace.Language) == lang {
			return " ✓"
		}
		return ""
	}
	return b.sendOrEdit(ctx, chatID, messageID, c.languageTitle, b.recvKeyboard([][]tgInlineKeyboardButton{
		{
			{Text: "🇬🇧 English" + check("en"), CallbackData: "lang:set:en"},
			{Text: "🇷🇺 Русский" + check("ru"), CallbackData: "lang:set:ru"},
		},
		{{Text: c.btnHome, CallbackData: "nav:home"}},
	}))
}

func (b *BotWorker) renderRecentInvoices(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64) error {
	c := copyFor(workspace.Language)
	invoices, _, err := b.store.ListInvoices(ctx, workspace.ID, store.ListInvoicesFilter{Limit: 5})
	if err != nil {
		return err
	}

	lines := []string{c.invoicesTitle}
	rows := [][]tgInlineKeyboardButton{}
	if len(invoices) == 0 {
		lines = append(lines, "", c.invoicesEmpty)
	} else {
		for _, invoice := range invoices {
			lines = append(
				lines,
				"",
				fmt.Sprintf(
					c.invoiceLine,
					esc(invoice.PublicID),
					esc(invoice.Title),
					esc(invoice.PayableAmount.StringFixed(6)),
					esc(string(invoice.PayableNetwork)),
					esc(invoiceStatusLabel(c.lang, invoice.Status)),
				),
			)
			rows = append(rows, []tgInlineKeyboardButton{{
				Text: c.btnOpenCheckout + " · " + invoice.PublicID,
				URL:  b.appURL("/checkout/" + invoice.PublicID),
			}})
		}
	}
	rows = append(rows, []tgInlineKeyboardButton{
		{Text: c.btnNewInvoiceShort, CallbackData: "screen:invoice"},
		{Text: c.btnHome, CallbackData: "nav:home"},
	})
	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.recvKeyboard(rows))
}

func workspaceTelegramLabel(telegramID *int64) string {
	if telegramID == nil {
		return "unlinked"
	}
	return strconv.FormatInt(*telegramID, 10)
}

func workspaceHandle(workspace store.Workspace) string {
	if strings.TrimSpace(workspace.Username) != "" {
		return "@" + workspace.Username
	}
	return workspaceTelegramLabel(workspace.OwnerTelegramID)
}

func (b *BotWorker) renderWallets(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64, note string) error {
	c := copyFor(workspace.Language)
	wallets, err := b.store.ListWallets(ctx, workspace.ID)
	if err != nil {
		return err
	}

	lines := []string{c.walletsTitle}
	if note != "" {
		lines = append(lines, "", esc(note))
	}
	if len(wallets) == 0 {
		lines = append(lines, "", c.walletsEmpty)
	} else {
		for _, wallet := range wallets {
			lines = append(lines, "", fmt.Sprintf("<b>%s</b>\n<code>%s</code>", esc(networkButtonLabel(wallet.Network)), esc(wallet.Address)))
		}
	}

	rows := [][]tgInlineKeyboardButton{
		{
			{Text: fmt.Sprintf(c.btnSetWallet, "TON"), CallbackData: "wallet:set:TON"},
			{Text: fmt.Sprintf(c.btnSetWallet, "TRON"), CallbackData: "wallet:set:TRON"},
		},
		{
			{Text: fmt.Sprintf(c.btnSetWallet, "SOLANA"), CallbackData: "wallet:set:SOLANA"},
			{Text: fmt.Sprintf(c.btnSetWallet, "EVM"), CallbackData: "wallet:set:EVM"},
		},
	}
	for _, wallet := range wallets {
		rows = append(rows, []tgInlineKeyboardButton{
			{Text: fmt.Sprintf(c.btnDisable, networkButtonLabel(wallet.Network)), CallbackData: fmt.Sprintf("wallet:disable:%d", wallet.ID)},
		})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: c.btnHome, CallbackData: "nav:home"}})
	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.recvKeyboard(rows))
}

func (b *BotWorker) renderInvoiceWalletPicker(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64) error {
	c := copyFor(workspace.Language)
	wallets, err := b.store.ListWallets(ctx, workspace.ID)
	if err != nil {
		return err
	}
	if len(wallets) == 0 {
		return b.renderWallets(ctx, workspace, chatID, messageID, c.walletsAddFirst)
	}

	rows := make([][]tgInlineKeyboardButton, 0, len(wallets)+1)
	for _, wallet := range wallets {
		rows = append(rows, []tgInlineKeyboardButton{
			{Text: fmt.Sprintf("%s • %s", networkButtonLabel(wallet.Network), shortAddress(wallet.Address)), CallbackData: fmt.Sprintf("invoice:new:%d", wallet.ID)},
		})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: c.btnHome, CallbackData: "nav:home"}})
	return b.sendOrEdit(ctx, chatID, messageID, c.invoicePickWallet, b.recvKeyboard(rows))
}

func (b *BotWorker) renderPlans(ctx context.Context, workspace store.Workspace, chatID int64, messageID int64, note string) error {
	c := copyFor(workspace.Language)
	lines := []string{
		c.plansTitle,
		"",
		c.plansBody,
	}
	if note != "" {
		lines = append(lines, "", esc(note))
	}
	if workspace.HasActiveSubscription(time.Now()) {
		lines = append(lines, "", fmt.Sprintf(c.plansCurrent, esc(workspace.EffectivePlan(time.Now()).Name), workspace.SubscriptionEndsAt.Format("2006-01-02")))
	}
	for _, plan := range store.ListPaidPlans() {
		lines = append(lines, "", fmt.Sprintf(c.planLine, esc(plan.Name), esc(plan.PriceUSDString), esc(planDescription(c, plan.Code))))
	}

	rows := make([][]tgInlineKeyboardButton, 0, 6)
	for _, plan := range store.ListPaidPlans() {
		rows = append(rows, []tgInlineKeyboardButton{{
			Text:         fmt.Sprintf("%s · $%s", fmt.Sprintf(c.btnPayPlan, plan.Name), plan.PriceUSDString),
			CallbackData: "plan:select:" + string(plan.Code),
		}})
	}
	rows = append(rows, []tgInlineKeyboardButton{
		{Text: c.btnPricing, URL: b.siteURL("/" + c.lang + "/pricing")},
		{Text: c.btnDocs, URL: b.siteURL("/" + c.lang + "/docs")},
	})
	rows = append(rows, []tgInlineKeyboardButton{{Text: c.btnHome, CallbackData: "nav:home"}})
	return b.sendOrEdit(ctx, chatID, messageID, strings.Join(lines, "\n"), b.recvKeyboard(rows))
}

func (b *BotWorker) renderPlanNetworkPicker(ctx context.Context, workspace store.Workspace, planCode store.PlanCode, chatID int64, messageID int64) error {
	c := copyFor(workspace.Language)
	plan := store.ResolvePlan(planCode)
	text := fmt.Sprintf(c.planPickNetwork, esc(plan.Name), esc(plan.PriceUSDString), esc(planDescription(c, plan.Code)))

	rows := make([][]tgInlineKeyboardButton, 0, 8)
	for _, network := range []store.Network{store.NetworkTRON, store.NetworkSOLANA, store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC, store.NetworkTON, store.NetworkTON_USDT} {
		rows = append(rows, []tgInlineKeyboardButton{{
			Text:         networkButtonLabel(network),
			CallbackData: fmt.Sprintf("plan:network:%s:%s", plan.Code, network),
		}})
	}
	rows = append(rows, []tgInlineKeyboardButton{{Text: c.btnBack, CallbackData: "screen:upgrade"}})
	return b.sendOrEdit(ctx, chatID, messageID, text, b.recvKeyboard(rows))
}

func (b *BotWorker) notificationKeyboard(raw json.RawMessage) *tgInlineKeyboardMarkup {
	if len(raw) == 0 {
		return b.recvKeyboard(nil)
	}

	var payload notificationPayload
	if err := json.Unmarshal(raw, &payload); err != nil {
		return b.recvKeyboard(nil)
	}

	rows := make([][]tgInlineKeyboardButton, 0, len(payload.InvoiceActions)+1)
	for _, action := range payload.InvoiceActions {
		switch action.Kind {
		case "callback":
			rows = append(rows, []tgInlineKeyboardButton{{Text: action.Text, CallbackData: action.Data}})
		case "url":
			rows = append(rows, []tgInlineKeyboardButton{{Text: action.Text, URL: action.URL}})
		}
	}
	if payload.PublicID != "" {
		rows = append(rows, []tgInlineKeyboardButton{{Text: "Open checkout", URL: b.appURL("/checkout/" + payload.PublicID)}})
	}
	return b.recvKeyboard(rows)
}

func (b *BotWorker) recvKeyboard(rows [][]tgInlineKeyboardButton) *tgInlineKeyboardMarkup {
	recvRow := []tgInlineKeyboardButton{{Text: copyFor("").btnOpenConsole, URL: b.appURL("/console")}}
	rows = append(rows, recvRow)
	return &tgInlineKeyboardMarkup{InlineKeyboard: rows}
}

func (b *BotWorker) walletAddressPrompt(c botCopy, network store.Network) string {
	switch network {
	case store.NetworkEVM:
		return c.walletPromptEVM
	case store.NetworkSOLANA:
		return c.walletPromptSOL
	default:
		return fmt.Sprintf(c.walletPromptOther, esc(string(network)))
	}
}

func (b *BotWorker) invoiceNetworkPrompt(c botCopy, draft botInvoiceDraft) string {
	return fmt.Sprintf(c.invoicePickNetwork, esc(draft.WalletLabel))
}

func (b *BotWorker) invoiceTitlePrompt(c botCopy, draft botInvoiceDraft) string {
	return fmt.Sprintf(c.invoiceStep1, esc(draft.WalletLabel))
}

func (b *BotWorker) invoiceAmountPrompt(c botCopy, draft botInvoiceDraft) string {
	return fmt.Sprintf(c.invoiceStep2, esc(draft.WalletLabel), esc(draft.Title))
}

func (b *BotWorker) invoiceLifetimePrompt(c botCopy, draft botInvoiceDraft) string {
	return fmt.Sprintf(c.invoiceStep3, esc(draft.WalletLabel), esc(draft.Title), esc(draft.Amount))
}

func esc(value string) string {
	return html.EscapeString(value)
}

func (b *BotWorker) session(chatID int64) *botSession {
	session, ok := b.sessions[chatID]
	if !ok {
		session = &botSession{}
		b.sessions[chatID] = session
	}
	return session
}

func (b *BotWorker) resetSession(chatID int64) {
	b.sessions[chatID] = &botSession{}
}

func (b *BotWorker) ensureWorkspace(ctx context.Context, user tgUser) (store.Workspace, error) {
	return b.store.UpsertWorkspaceByTelegram(ctx, user.ID, user.Username)
}

func (b *BotWorker) getUpdates(ctx context.Context) ([]tgUpdate, error) {
	query := url.Values{}
	query.Set("timeout", "5")
	if b.offset > 0 {
		query.Set("offset", strconv.FormatInt(b.offset, 10))
	}
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/getUpdates?%s", b.token, query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("build telegram getUpdates request: %w", err)
	}

	startedAt := time.Now()
	resp, err := b.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("telegram getUpdates: %w", err)
	}
	defer resp.Body.Close()

	var result tgAPIResponse[[]tgUpdate]
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("decode telegram getUpdates: %w", err)
	}
	if !result.OK {
		metrics.ObserveUpstream("telegram_bot_api", "get_updates", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("telegram getUpdates failed: %s", result.Description)
	}
	metrics.ObserveUpstream("telegram_bot_api", "get_updates", "success", time.Since(startedAt))
	return result.Result, nil
}

func (b *BotWorker) sendOrEdit(ctx context.Context, chatID int64, messageID int64, text string, keyboard *tgInlineKeyboardMarkup) error {
	if messageID > 0 {
		if err := b.editMessage(ctx, chatID, messageID, text, keyboard); err == nil {
			return nil
		}
	}
	newMessageID, err := b.sendMessage(ctx, chatID, text, keyboard)
	if err != nil {
		return err
	}
	b.session(chatID).MenuMessageID = newMessageID
	return nil
}

func (b *BotWorker) sendMessage(ctx context.Context, chatID int64, text string, keyboard *tgInlineKeyboardMarkup) (int64, error) {
	payload := map[string]any{
		"chat_id":                  chatID,
		"text":                     text,
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	}
	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}

	var result tgMessage
	if err := b.callTelegram(ctx, "sendMessage", payload, &result); err != nil {
		return 0, err
	}
	return result.MessageID, nil
}

func (b *BotWorker) editMessage(ctx context.Context, chatID int64, messageID int64, text string, keyboard *tgInlineKeyboardMarkup) error {
	payload := map[string]any{
		"chat_id":                  chatID,
		"message_id":               messageID,
		"text":                     text,
		"parse_mode":               "HTML",
		"disable_web_page_preview": true,
	}
	if keyboard != nil {
		payload["reply_markup"] = keyboard
	}

	var ignored json.RawMessage
	if err := b.callTelegram(ctx, "editMessageText", payload, &ignored); err != nil {
		if strings.Contains(err.Error(), "message is not modified") {
			return nil
		}
		return err
	}
	return nil
}

func (b *BotWorker) answerCallbackQuery(ctx context.Context, callbackID string, text string) error {
	payload := map[string]any{
		"callback_query_id": callbackID,
		"text":              text,
	}
	var ignored json.RawMessage
	return b.callTelegram(ctx, "answerCallbackQuery", payload, &ignored)
}

func (b *BotWorker) callTelegram(ctx context.Context, method string, payload any, out any) error {
	body, _ := json.Marshal(payload)
	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/%s", b.token, method)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build telegram %s request: %w", method, err)
	}
	req.Header.Set("Content-Type", "application/json")

	startedAt := time.Now()
	resp, err := b.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s: %w", method, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s failed: %s", method, strings.TrimSpace(string(respBody)))
	}

	var result tgAPIResponse[json.RawMessage]
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("decode telegram %s: %w", method, err)
	}
	if !result.OK {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("telegram %s failed: %s", method, result.Description)
	}
	if out == nil {
		return nil
	}
	if len(result.Result) == 0 || string(result.Result) == "true" {
		return nil
	}
	if err := json.Unmarshal(result.Result, out); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", method, "failure", time.Since(startedAt))
		return fmt.Errorf("unmarshal telegram %s result: %w", method, err)
	}
	metrics.ObserveUpstream("telegram_bot_api", method, "success", time.Since(startedAt))
	return nil
}

func (b *BotWorker) appURL(path string) string {
	base := strings.TrimRight(strings.TrimSpace(b.publicAppURL), "/")
	if base == "" {
		base = "http://localhost:3000"
	}
	if path == "" {
		return base
	}
	cleanPath := "/" + strings.TrimLeft(path, "/")
	baseHasAppPrefix := strings.HasSuffix(base, "/app")
	if !baseHasAppPrefix && !strings.HasPrefix(cleanPath, "/app/") && cleanPath != "/app" {
		cleanPath = "/app" + cleanPath
	}
	return base + cleanPath
}

func (b *BotWorker) siteURL(path string) string {
	base := strings.TrimRight(strings.TrimSpace(b.publicAppURL), "/")
	if base == "" {
		base = "http://localhost:3000"
	}
	if strings.HasSuffix(base, "/app") {
		base = strings.TrimSuffix(base, "/app")
	}
	if path == "" {
		return base
	}
	return base + "/" + strings.TrimLeft(path, "/")
}

func shortAddress(address string) string {
	if len(address) <= 14 {
		return address
	}
	return address[:6] + "..." + address[len(address)-6:]
}

func validateWallet(network store.Network, address string) error {
	return store.ValidateWalletAddress(network, address)
}

func valueOrFallback(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}

func payableNetworksForWallet(network store.Network) []store.Network {
	switch network {
	case store.NetworkEVM:
		return []store.Network{store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC, store.NetworkEVM}
	case store.NetworkTON:
		return []store.Network{store.NetworkTON, store.NetworkTON_USDT}
	case store.NetworkSOLANA:
		return []store.Network{store.NetworkSOLANA}
	default:
		return []store.Network{network}
	}
}

func networkButtonLabel(network store.Network) string {
	switch network {
	case store.NetworkTON:
		return "TON / GRAM"
	case store.NetworkTRON:
		return "TRON / USDT"
	case store.NetworkTON_USDT:
		return "TON / USDT"
	case store.NetworkSOLANA:
		return "SOLANA / USDT"
	case store.NetworkEVM:
		return "EVM / USDT"
	case store.NetworkBASE:
		return "BASE / USDT"
	case store.NetworkARBITRUM:
		return "ARBITRUM / USDT"
	case store.NetworkBSC:
		return "BSC / USDT"
	default:
		return string(network)
	}
}

func planDescription(c botCopy, planCode store.PlanCode) string {
	switch store.NormalizePlanCode(string(planCode)) {
	case store.PlanCodeDeveloper:
		return c.planDeveloper
	case store.PlanCodeBusiness:
		return c.planBusiness
	default:
		return c.planMerchant
	}
}

func invoiceStatusLabel(lang string, status store.InvoiceStatus) string {
	if lang == "ru" {
		switch status {
		case store.InvoiceStatusAwaitingPayment:
			return "ждёт оплату"
		case store.InvoiceStatusPaid:
			return "оплачен"
		case store.InvoiceStatusExpired:
			return "истёк"
		case store.InvoiceStatusUnderpaid:
			return "недоплата"
		case store.InvoiceStatusOverpaid:
			return "переплата"
		case store.InvoiceStatusManualReview:
			return "ручная проверка"
		default:
			return string(status)
		}
	}
	switch status {
	case store.InvoiceStatusAwaitingPayment:
		return "awaiting payment"
	case store.InvoiceStatusPaid:
		return "paid"
	case store.InvoiceStatusExpired:
		return "expired"
	case store.InvoiceStatusUnderpaid:
		return "underpaid"
	case store.InvoiceStatusOverpaid:
		return "overpaid"
	case store.InvoiceStatusManualReview:
		return "manual review"
	default:
		return string(status)
	}
}

func parseStartParam(param string) (*store.AttributionInput, string) {
	param = strings.TrimSpace(param)
	if param == "" {
		return nil, ""
	}
	if strings.HasPrefix(param, "utm__") {
		parts := strings.Split(param, "__")
		attr := &store.AttributionInput{
			TouchType: "last",
		}
		if len(parts) > 1 {
			attr.Source = parts[1]
		}
		if len(parts) > 2 {
			attr.Medium = parts[2]
		}
		if len(parts) > 3 {
			attr.Campaign = parts[3]
		}
		if len(parts) > 4 {
			attr.Content = parts[4]
		}
		return attr, ""
	}

	if strings.HasPrefix(param, "ref__") {
		return nil, strings.TrimPrefix(param, "ref__")
	}

	return nil, param
}
