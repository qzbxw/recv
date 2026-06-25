package telegram

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/service"
	"recv/backend/internal/store"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/shopspring/decimal"
)

func TestBotWorkerRunWithEmptyTokenExitsOnContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	st := newTelegramBotTestStore(t, context.Background())

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"", // empty token → delivery worker mode
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)

	done := make(chan error, 1)
	go func() {
		done <- worker.Run(ctx)
	}()

	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err == nil || !errors.Is(err, context.Canceled) {
			t.Fatalf("expected context.Canceled from Run (empty token), got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run (empty token) did not exit within 5 seconds after context cancel")
	}
}

func TestBotWorkerRunWithTokenExitsOnContextCancel(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	st := newTelegramBotTestStore(t, context.Background())

	// Telegram mock server: return empty updates so Run loops and can be cancelled.
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/getUpdates"):
			// Delay a little so cancel() can fire before the next poll.
			time.Sleep(20 * time.Millisecond)
			_, _ = w.Write([]byte(`{"ok":true,"result":[]}`))
		case strings.HasSuffix(r.URL.Path, "/sendMessage"):
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":1}}`))
		case strings.HasSuffix(r.URL.Path, "/editMessageText"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		case strings.HasSuffix(r.URL.Path, "/answerCallbackQuery"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	done := make(chan error, 1)
	go func() {
		done <- worker.Run(ctx)
	}()

	// Give Run time to start polling, then cancel.
	time.Sleep(100 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err == nil || !errors.Is(err, context.Canceled) {
			t.Fatalf("expected context.Canceled from Run (with token), got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run (with token) did not exit within 5 seconds after context cancel")
	}
}

func TestBotWorkerHelpers(t *testing.T) {
	telegramID := int64(42)
	worker := &BotWorker{
		publicAppURL: "https://recv.test/app/",
		sessions:     map[int64]*botSession{},
	}

	if got := workspaceTelegramLabel(nil); got != "unlinked" {
		t.Fatalf("expected unlinked label, got %q", got)
	}
	if got := workspaceTelegramLabel(&telegramID); got != "42" {
		t.Fatalf("expected telegram label 42, got %q", got)
	}

	keyboard := worker.recvKeyboard([][]tgInlineKeyboardButton{{{Text: "Home", CallbackData: "nav:home"}}})
	if len(keyboard.InlineKeyboard) != 2 {
		t.Fatalf("expected recv row to be appended, got %#v", keyboard.InlineKeyboard)
	}
	if keyboard.InlineKeyboard[1][0].URL != "https://recv.test/app/console" {
		t.Fatalf("unexpected recv button URL: %q", keyboard.InlineKeyboard[1][0].URL)
	}

	payload := notificationPayload{
		PublicID: "INV123",
		InvoiceActions: []notificationAction{
			{Kind: "callback", Text: "Mark paid", Data: "invoice:paid:1"},
			{Kind: "url", Text: "Open", URL: "https://example.com/hook"},
		},
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("json.Marshal returned error: %v", err)
	}
	notificationKeyboard := worker.notificationKeyboard(raw)
	if len(notificationKeyboard.InlineKeyboard) < 3 {
		t.Fatalf("expected action rows and checkout row, got %#v", notificationKeyboard.InlineKeyboard)
	}

	c := copyFor("en")
	if got := worker.walletAddressPrompt(c, store.NetworkEVM); !strings.Contains(got, "EVM wallet") {
		t.Fatalf("unexpected EVM prompt: %q", got)
	}
	if got := worker.invoiceAmountPrompt(c, botInvoiceDraft{WalletLabel: "Main", Title: "Pro Plan"}); !strings.Contains(got, "step 2 of 3") {
		t.Fatalf("unexpected amount prompt: %q", got)
	}
	if got := worker.invoiceLifetimePrompt(c, botInvoiceDraft{WalletLabel: "Main", Title: "Pro Plan", Amount: "39"}); !strings.Contains(got, "39 USD") {
		t.Fatalf("unexpected lifetime prompt: %q", got)
	}

	session := worker.session(10)
	session.MenuMessageID = 55
	if worker.session(10).MenuMessageID != 55 {
		t.Fatal("expected session to be reused")
	}
	worker.resetSession(10)
	if worker.session(10).MenuMessageID != 0 {
		t.Fatal("expected session to be reset")
	}

	if got := worker.appURL("/checkout/INV123"); got != "https://recv.test/app/checkout/INV123" {
		t.Fatalf("unexpected app URL: %q", got)
	}
	if got := worker.siteURL("/ru/pricing"); got != "https://recv.test/ru/pricing" {
		t.Fatalf("unexpected site URL: %q", got)
	}
	if got := shortAddress("0x1111111111111111111111111111111111111111"); got != "0x1111...111111" {
		t.Fatalf("unexpected short address: %q", got)
	}
	if got := valueOrFallback("   ", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback, got %q", got)
	}
	if got := valueOrFallback(" value ", "fallback"); got != " value " {
		t.Fatalf("expected original non-empty value, got %q", got)
	}
	if got := workspaceHandle(store.Workspace{Username: "seller"}); got != "@seller" {
		t.Fatalf("unexpected workspace handle: %q", got)
	}
	if got := workspaceHandle(store.Workspace{}); got != "unlinked" {
		t.Fatalf("expected unlinked workspace handle, got %q", got)
	}
	if networks := payableNetworksForWallet(store.NetworkEVM); len(networks) != 4 {
		t.Fatalf("expected 4 payable networks for EVM wallet, got %#v", networks)
	}
	if networks := payableNetworksForWallet(store.NetworkSOLANA); len(networks) != 1 || networks[0] != store.NetworkSOLANA {
		t.Fatalf("expected 1 SOLANA payable network, got %#v", networks)
	}
	if networks := payableNetworksForWallet(store.NetworkTON); len(networks) != 2 || networks[0] != store.NetworkTON || networks[1] != store.NetworkTON_USDT {
		t.Fatalf("expected TON payable networks for GRAM and USDT, got %#v", networks)
	}
	if got := networkButtonLabel(store.NetworkBASE); got != "BASE / USDT" {
		t.Fatalf("unexpected network label: %q", got)
	}
	if got := worker.walletAddressPrompt(c, store.NetworkSOLANA); got == "" {
		t.Fatal("expected non-empty SOLANA wallet address prompt")
	}
	if got := worker.walletAddressPrompt(c, store.NetworkTRON); got == "" {
		t.Fatal("expected non-empty TRON wallet address prompt")
	}
}

func TestBotWorkerRenderLanguageUsesStableCallbacks(t *testing.T) {
	for _, tc := range []struct {
		name         string
		language     string
		wantSelected string
	}{
		{name: "english", language: "en", wantSelected: "lang:set:en"},
		{name: "russian", language: "ru", wantSelected: "lang:set:ru"},
		{name: "unknown defaults english", language: "de", wantSelected: "lang:set:en"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var markup tgInlineKeyboardMarkup
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if !strings.HasSuffix(r.URL.Path, "/sendMessage") {
					http.NotFound(w, r)
					return
				}
				var payload struct {
					ReplyMarkup tgInlineKeyboardMarkup `json:"reply_markup"`
				}
				if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
					t.Fatalf("decode telegram payload: %v", err)
				}
				markup = payload.ReplyMarkup
				_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":123}}`))
			}))
			defer server.Close()

			worker := &BotWorker{
				token:      "bot-token",
				httpClient: rewriteTelegramHTTPClient(t, server),
				sessions:   map[int64]*botSession{},
			}
			if err := worker.renderLanguage(context.Background(), store.Workspace{Language: tc.language}, 900, 0); err != nil {
				t.Fatalf("renderLanguage: %v", err)
			}
			if len(markup.InlineKeyboard) < 2 || len(markup.InlineKeyboard[0]) != 2 {
				t.Fatalf("expected language row and navigation row, got %#v", markup.InlineKeyboard)
			}

			callbacks := map[string]tgInlineKeyboardButton{}
			for _, row := range markup.InlineKeyboard {
				for _, button := range row {
					callbacks[button.CallbackData] = button
				}
			}
			for _, callback := range []string{"lang:set:en", "lang:set:ru", "nav:home"} {
				if _, ok := callbacks[callback]; !ok {
					t.Fatalf("expected callback %q in markup %#v", callback, markup.InlineKeyboard)
				}
			}
			if !strings.Contains(callbacks[tc.wantSelected].Text, "✓") {
				t.Fatalf("expected %s button to be selected, got %#v", tc.wantSelected, callbacks[tc.wantSelected])
			}
		})
	}
}

func TestBotWorkerTelegramAPIHelpers(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/getUpdates"):
			_, _ = w.Write([]byte(`{"ok":true,"result":[{"update_id":1}]}`))
		case strings.HasSuffix(r.URL.Path, "/sendMessage"):
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":77}}`))
		case strings.HasSuffix(r.URL.Path, "/editMessageText"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	worker := &BotWorker{
		token:      "bot-token",
		httpClient: rewriteTelegramHTTPClient(t, server),
		sessions:   map[int64]*botSession{},
	}

	updates, err := worker.getUpdates(context.Background())
	if err != nil {
		t.Fatalf("getUpdates returned error: %v", err)
	}
	if len(updates) != 1 || updates[0].UpdateID != 1 {
		t.Fatalf("unexpected updates: %#v", updates)
	}

	messageID, err := worker.sendMessage(context.Background(), 100, "hello", nil)
	if err != nil {
		t.Fatalf("sendMessage returned error: %v", err)
	}
	if messageID != 77 {
		t.Fatalf("expected message id 77, got %d", messageID)
	}

	if err := worker.editMessage(context.Background(), 100, 77, "updated", nil); err != nil {
		t.Fatalf("editMessage returned error: %v", err)
	}

	if err := worker.sendOrEdit(context.Background(), 100, 0, "menu", nil); err != nil {
		t.Fatalf("sendOrEdit returned error: %v", err)
	}
	if worker.session(100).MenuMessageID != 77 {
		t.Fatalf("expected menu message id 77, got %d", worker.session(100).MenuMessageID)
	}
}

func TestBotWorkerTelegramAPIErrorBranches(t *testing.T) {
	t.Run("getUpdates decode and api errors", func(t *testing.T) {
		for _, tc := range []struct {
			name string
			body string
		}{
			{name: "malformed json", body: `{bad`},
			{name: "api not ok", body: `{"ok":false,"description":"nope"}`},
		} {
			t.Run(tc.name, func(t *testing.T) {
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					_, _ = w.Write([]byte(tc.body))
				}))
				defer server.Close()
				worker := &BotWorker{token: "bot-token", httpClient: rewriteTelegramHTTPClient(t, server)}
				if _, err := worker.getUpdates(context.Background()); err == nil {
					t.Fatal("expected getUpdates error")
				}
			})
		}
	})

	t.Run("callTelegram errors and edge results", func(t *testing.T) {
		cases := []struct {
			name    string
			status  int
			body    string
			out     any
			wantErr bool
		}{
			{name: "http error", status: http.StatusBadGateway, body: `upstream down`, out: &tgMessage{}, wantErr: true},
			{name: "decode error", status: http.StatusOK, body: `{bad`, out: &tgMessage{}, wantErr: true},
			{name: "api not ok", status: http.StatusOK, body: `{"ok":false,"description":"denied"}`, out: &tgMessage{}, wantErr: true},
			{name: "bad result unmarshal", status: http.StatusOK, body: `{"ok":true,"result":{"message_id":"bad"}}`, out: &tgMessage{}, wantErr: true},
			{name: "nil out", status: http.StatusOK, body: `{"ok":true,"result":{"ignored":true}}`, out: nil, wantErr: false},
			{name: "true result", status: http.StatusOK, body: `{"ok":true,"result":true}`, out: &json.RawMessage{}, wantErr: false},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					w.WriteHeader(tc.status)
					_, _ = w.Write([]byte(tc.body))
				}))
				defer server.Close()
				worker := &BotWorker{token: "bot-token", httpClient: rewriteTelegramHTTPClient(t, server)}
				err := worker.callTelegram(context.Background(), "sendMessage", map[string]any{"chat_id": 1}, tc.out)
				if tc.wantErr && err == nil {
					t.Fatal("expected callTelegram error")
				}
				if !tc.wantErr && err != nil {
					t.Fatalf("unexpected callTelegram error: %v", err)
				}
			})
		}
	})

	t.Run("sendOrEdit falls back to send when edit fails", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			switch {
			case strings.HasSuffix(r.URL.Path, "/editMessageText"):
				w.WriteHeader(http.StatusBadRequest)
				_, _ = w.Write([]byte(`edit failed`))
			case strings.HasSuffix(r.URL.Path, "/sendMessage"):
				_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":99}}`))
			default:
				http.NotFound(w, r)
			}
		}))
		defer server.Close()
		worker := &BotWorker{token: "bot-token", httpClient: rewriteTelegramHTTPClient(t, server), sessions: map[int64]*botSession{}}
		if err := worker.sendOrEdit(context.Background(), 10, 5, "text", nil); err != nil {
			t.Fatalf("sendOrEdit: %v", err)
		}
		if worker.session(10).MenuMessageID != 99 {
			t.Fatalf("expected fallback send message id 99, got %d", worker.session(10).MenuMessageID)
		}
	})

	t.Run("editMessage ignores not modified", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`message is not modified`))
		}))
		defer server.Close()
		worker := &BotWorker{token: "bot-token", httpClient: rewriteTelegramHTTPClient(t, server)}
		if err := worker.editMessage(context.Background(), 1, 2, "same", nil); err != nil {
			t.Fatalf("expected not modified to be ignored, got %v", err)
		}
	})

	t.Run("appURL defaults localhost and prefixes app", func(t *testing.T) {
		worker := &BotWorker{}
		if got := worker.appURL(""); got != "http://localhost:3000" {
			t.Fatalf("unexpected default base URL: %q", got)
		}
		if got := worker.appURL("/checkout/ABC"); got != "http://localhost:3000/app/checkout/ABC" {
			t.Fatalf("unexpected default checkout URL: %q", got)
		}
	})
}

func TestBotWorkerCallbackFlowsWithStore(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 96001, "callbackuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if _, err := st.SetWorkspacePlan(ctx, workspace.ID, store.PlanCodeDeveloper, 30, nil); err != nil {
		t.Fatalf("SetWorkspacePlan: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	suffix := decimal.RequireFromString("0.222222")
	invoice, err := st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Callback Invoice",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10.222222"),
		MatchingSuffix:     &suffix,
		PublicID:           "CALLBACK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, "/editMessageText"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		case strings.HasSuffix(r.URL.Path, "/sendMessage"):
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":88}}`))
		case strings.HasSuffix(r.URL.Path, "/answerCallbackQuery"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	query := func(data string) *tgCallbackQuery {
		return &tgCallbackQuery{
			ID:   "callback-" + data,
			From: tgUser{ID: 96001, Username: "callbackuser"},
			Message: &tgMessage{
				MessageID: 55,
				Chat: struct {
					ID int64 `json:"id"`
				}{ID: 96001},
			},
			Data: data,
		}
	}

	for _, data := range []string{
		"screen:wallets",
		"screen:invoice",
		"screen:upgrade",
		"screen:plans",
		"wallet:set:EVM",
		"invoice:new:" + strconv.FormatInt(wallet.ID, 10),
		"invoice:network:" + strconv.FormatInt(wallet.ID, 10) + ":BASE",
		"invoice:keep_underpaid:" + strconv.FormatInt(invoice.ID, 10),
		"invoice:keep_review:" + strconv.FormatInt(invoice.ID, 10),
		"invoice:cancel",
		"nav:home",
		"unknown:action",
	} {
		if err := worker.handleCallback(ctx, query(data)); err != nil {
			t.Fatalf("handleCallback(%q): %v", data, err)
		}
	}

	if err := worker.handleCallback(ctx, query("invoice:mark_paid:"+strconv.FormatInt(invoice.ID, 10))); err != nil {
		t.Fatalf("handleCallback mark paid: %v", err)
	}
	if err := worker.handleCallback(ctx, query("wallet:disable:"+strconv.FormatInt(wallet.ID, 10))); err != nil {
		t.Fatalf("handleCallback wallet disable: %v", err)
	}
	if err := worker.handleCallback(ctx, query("invoice:new:not-a-number")); err == nil {
		t.Fatal("expected invalid invoice:new callback to return error")
	}
	if err := worker.handleCallback(ctx, query("invoice:network:bad")); err == nil {
		t.Fatal("expected invalid invoice:network callback to return error")
	}
	if err := worker.handleCallback(ctx, query("invoice:lifetime:not-a-number")); err == nil {
		t.Fatal("expected invalid invoice:lifetime callback to return error")
	}
}

func TestWebhookDeliveryHTTPContract(t *testing.T) {
	payload := []byte(`{"event":"invoice.paid","invoice":{"public_id":"INV123"}}`)
	received := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		received = true
		if r.Method != http.MethodPost {
			t.Fatalf("expected POST webhook delivery, got %s", r.Method)
		}
		if r.Header.Get("Content-Type") != "application/json" {
			t.Fatalf("unexpected content type: %q", r.Header.Get("Content-Type"))
		}
		if r.Header.Get("User-Agent") != "recv-webhooks/1.0" {
			t.Fatalf("unexpected user agent: %q", r.Header.Get("User-Agent"))
		}
		if r.Header.Get("X-recv-Event") != "invoice.paid" {
			t.Fatalf("unexpected event header: %q", r.Header.Get("X-recv-Event"))
		}
		timestamp := r.Header.Get("X-recv-Timestamp")
		if timestamp == "" {
			t.Fatal("expected timestamp header")
		}
		expectedSignature := expectedWebhookSignature("whsec_test", timestamp, payload)
		if r.Header.Get("X-recv-Signature") != expectedSignature {
			t.Fatalf("unexpected signature: %q", r.Header.Get("X-recv-Signature"))
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	worker := &BotWorker{httpClient: server.Client()}
	result := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_test", "invoice.paid", payload)
	if !received {
		t.Fatal("expected seller webhook endpoint to receive delivery")
	}
	if result.Status != "success" || result.StatusCode != http.StatusNoContent || result.Error != "" {
		t.Fatalf("expected successful webhook delivery, got %+v", result)
	}
}

func TestWebhookDeliveryFailureBoundaries(t *testing.T) {
	payload := []byte(`{"event":"invoice.paid"}`)

	t.Run("seller returns error status", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			http.Error(w, "temporarily unavailable", http.StatusServiceUnavailable)
		}))
		defer server.Close()

		worker := &BotWorker{httpClient: server.Client()}
		result := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_test", "invoice.paid", payload)
		if result.Status != "failure" || result.StatusCode != http.StatusServiceUnavailable {
			t.Fatalf("expected failure result for seller 503, got %+v", result)
		}
		if !strings.Contains(result.ResponseSnippet, "temporarily unavailable") {
			t.Fatalf("expected response snippet to preserve seller error, got %+v", result)
		}
	})

	t.Run("invalid target url", func(t *testing.T) {
		worker := &BotWorker{httpClient: &http.Client{Timeout: time.Second}}
		result := worker.sendWebhookDelivery(context.Background(), "://bad-url", "whsec_test", "invoice.paid", payload)
		if result.Status != "failure" || result.Error == "" {
			t.Fatalf("expected invalid URL to fail before delivery, got %+v", result)
		}
	})

	if err := errorFromString(" delivery failed "); err == nil || err.Error() != " delivery failed " {
		t.Fatalf("expected non-empty webhook error string to become error, got %v", err)
	}
	if err := errorFromString("   "); err != nil {
		t.Fatalf("expected blank webhook error string to be nil, got %v", err)
	}
}

func TestCallTelegramErrorPaths(t *testing.T) {
	t.Run("HTTP 400 response returns error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			http.Error(w, "bad request", http.StatusBadRequest)
		}))
		defer server.Close()

		worker := &BotWorker{
			token:      "test-token",
			httpClient: rewriteTelegramHTTPClient(t, server),
		}
		var out json.RawMessage
		err := worker.callTelegram(context.Background(), "sendMessage", map[string]any{"text": "test"}, &out)
		if err == nil || !strings.Contains(err.Error(), "failed") {
			t.Fatalf("expected HTTP error, got %v", err)
		}
	})

	t.Run("ok=false response returns error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte(`{"ok":false,"description":"Forbidden: bot was blocked by the user"}`))
		}))
		defer server.Close()

		worker := &BotWorker{
			token:      "test-token",
			httpClient: rewriteTelegramHTTPClient(t, server),
		}
		var out json.RawMessage
		err := worker.callTelegram(context.Background(), "sendMessage", map[string]any{"text": "test"}, &out)
		if err == nil || !strings.Contains(err.Error(), "blocked by the user") {
			t.Fatalf("expected ok=false error, got %v", err)
		}
	})

	t.Run("invalid JSON response returns decode error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte("not json"))
		}))
		defer server.Close()

		worker := &BotWorker{
			token:      "test-token",
			httpClient: rewriteTelegramHTTPClient(t, server),
		}
		var out json.RawMessage
		err := worker.callTelegram(context.Background(), "sendMessage", map[string]any{"text": "test"}, &out)
		if err == nil || !strings.Contains(err.Error(), "decode telegram") {
			t.Fatalf("expected decode error, got %v", err)
		}
	})
}

func TestEditMessageNotModifiedIsIgnored(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"ok":false,"description":"Bad Request: message is not modified: specified new message content and reply markup are exactly the same as a current content"}`))
	}))
	defer server.Close()

	worker := &BotWorker{
		token:      "test-token",
		httpClient: rewriteTelegramHTTPClient(t, server),
		sessions:   map[int64]*botSession{},
	}
	err := worker.editMessage(context.Background(), 100, 77, "same text", nil)
	if err != nil {
		t.Fatalf("expected 'not modified' error to be swallowed, got %v", err)
	}
}

func TestShortAddressWithShortInput(t *testing.T) {
	// Short address (≤14 chars) should be returned as-is
	if got := shortAddress("0x1234567890"); got != "0x1234567890" {
		t.Fatalf("expected short address unchanged, got %q", got)
	}
	// Exactly 14 chars
	if got := shortAddress("0x123456789012"); got != "0x123456789012" {
		t.Fatalf("expected 14-char address unchanged, got %q", got)
	}
}

func TestAppURLWithoutLeadingSlash(t *testing.T) {
	worker := &BotWorker{publicAppURL: "https://recv.test/app/"}
	// Path without leading slash should get one added
	if got := worker.appURL("checkout/INV123"); got != "https://recv.test/app/checkout/INV123" {
		t.Fatalf("unexpected app URL: %q", got)
	}
}

func TestGetUpdatesErrorPaths(t *testing.T) {
	t.Run("ok=false response returns error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if strings.HasSuffix(r.URL.Path, "/getUpdates") {
				_, _ = w.Write([]byte(`{"ok":false,"description":"Unauthorized"}`))
			}
		}))
		defer server.Close()

		worker := &BotWorker{
			token:      "invalid-token",
			httpClient: rewriteTelegramHTTPClient(t, server),
		}
		_, err := worker.getUpdates(context.Background())
		if err == nil || !strings.Contains(err.Error(), "Unauthorized") {
			t.Fatalf("expected Unauthorized error, got %v", err)
		}
	})

	t.Run("invalid JSON response returns decode error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte("not json"))
		}))
		defer server.Close()

		worker := &BotWorker{
			token:      "test-token",
			httpClient: rewriteTelegramHTTPClient(t, server),
		}
		_, err := worker.getUpdates(context.Background())
		if err == nil || !strings.Contains(err.Error(), "decode telegram") {
			t.Fatalf("expected decode error, got %v", err)
		}
	})
}

func TestFinishInvoiceWizardInvalidAmount(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":1}}`))
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	_, err := st.UpsertWorkspaceByTelegram(ctx, 90099, "finishinvuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	workspace, err := st.GetWorkspaceByUsername(ctx, "finishinvuser")
	if err != nil {
		t.Fatalf("GetWorkspaceByUsername: %v", err)
	}

	// Directly set an invalid amount in the session
	chatID := int64(90099)
	session := worker.session(chatID)
	session.DraftInvoice.Amount = "not-a-decimal"

	// finishInvoiceWizard should return an error for invalid amount
	err = worker.finishInvoiceWizard(ctx, workspace, chatID, 1, 30)
	if err == nil {
		t.Fatal("expected error for invalid draft amount")
	}
}

func TestHandleCallbackScreenUpgrade(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	user := tgUser{ID: 888, Username: "upgradeuser"}
	chatID := int64(888)
	messageID := int64(10)

	// First create a workspace via /start
	if err := worker.handleMessage(ctx, botMessage(messageID, chatID, user, "/start")); err != nil {
		t.Fatalf("/start returned error: %v", err)
	}

	// Test screen:upgrade callback
	if err := worker.handleCallback(ctx, botCallback("screen:upgrade", messageID, chatID, user)); err != nil {
		t.Fatalf("screen:upgrade callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("screen:plans", messageID, chatID, user)); err != nil {
		t.Fatalf("screen:plans callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("plan:select:developer", messageID, chatID, user)); err != nil {
		t.Fatalf("plan select callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("plan:network:developer:TON", messageID, chatID, user)); err != nil {
		t.Fatalf("developer checkout callback returned error: %v", err)
	}
	workspace, err := st.GetWorkspaceByTelegramID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetWorkspaceByTelegramID: %v", err)
	}
	invoices, total, err := st.ListInvoices(ctx, workspace.ID, store.ListInvoicesFilter{Limit: 10})
	if err != nil {
		t.Fatalf("ListInvoices: %v", err)
	}
	if total != 1 || len(invoices) != 1 {
		t.Fatalf("expected one developer subscription invoice, total=%d invoices=%+v", total, invoices)
	}
	if invoices[0].Kind != store.InvoiceKindSubscription || invoices[0].PlanCode != store.PlanCodeDeveloper {
		t.Fatalf("expected developer subscription invoice, got %+v", invoices[0])
	}
}

func TestHandleUpdateDispatchesMessageAndCallback(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, requests := newTestBotWorker(t, st)

	user := tgUser{ID: 900, Username: "dispatchuser"}
	chatID := int64(900)
	messageID := int64(1)

	// Arrange: an update carrying a Message
	updateWithMessage := tgUpdate{
		UpdateID: 1,
		Message:  botMessage(messageID, chatID, user, "/start"),
	}

	// Act
	if err := worker.handleUpdate(ctx, updateWithMessage); err != nil {
		t.Fatalf("handleUpdate with message returned error: %v", err)
	}

	// Assert: /start should send a greeting
	if len(requests.texts) == 0 {
		t.Fatal("expected handleUpdate to dispatch /start message and produce output")
	}

	// Arrange: an update carrying a CallbackQuery
	updateWithCallback := tgUpdate{
		UpdateID:      2,
		CallbackQuery: botCallback("unknown:callback", messageID, chatID, user),
	}

	// Act
	if err := worker.handleUpdate(ctx, updateWithCallback); err != nil {
		t.Fatalf("handleUpdate with callback returned error: %v", err)
	}

	// Arrange: an update with neither message nor callback (should be a no-op)
	emptyUpdate := tgUpdate{UpdateID: 3}
	if err := worker.handleUpdate(ctx, emptyUpdate); err != nil {
		t.Fatalf("handleUpdate with empty update returned error: %v", err)
	}
}

func TestFlushProcessesNotificationJob(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 77001, "notifyflushuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Insert a notification job directly into the outbox.
	payload := []byte(`{"public_id":"INV001","invoice_actions":[]}`)
	_, err = st.RawPool().Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload)
		VALUES ($1, $2, $3, $4)
	`, workspace.ID, int64(77001), "Payment received for INV001", payload)
	if err != nil {
		t.Fatalf("insert notification job: %v", err)
	}

	// Mock Telegram server to capture sendMessage calls.
	sent := false
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/sendMessage") {
			sent = true
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":200}}`))
		} else {
			http.NotFound(w, r)
		}
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	if err := worker.flush(ctx); err != nil {
		t.Fatalf("flush returned error: %v", err)
	}
	if !sent {
		t.Fatal("expected flush to send the notification via Telegram sendMessage")
	}
}

func TestFlushMarksNotificationFailedWhenTelegramRejectsMessage(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 77002, "failnotifyuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	payload := []byte(`{"public_id":"FAIL001","invoice_actions":[]}`)
	_, err = st.RawPool().Exec(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload)
		VALUES ($1, $2, $3, $4)
	`, workspace.ID, int64(77002), "Payment received for FAIL001", payload)
	if err != nil {
		t.Fatalf("insert notification job: %v", err)
	}

	// Telegram server returns an error status
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusForbidden)
		_, _ = w.Write([]byte(`{"ok":false,"description":"Forbidden: bot was blocked by the user"}`))
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	// flush should not return an error — it logs and continues when individual sends fail
	if err := worker.flush(ctx); err != nil {
		t.Fatalf("flush should not error on failed notification, got: %v", err)
	}
}

func TestFlushWithEmptyJobsIsNoOp(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	// Act: flush with no pending jobs or deliveries should complete without error
	if err := worker.flush(ctx); err != nil {
		t.Fatalf("flush with empty store returned error: %v", err)
	}
}

func TestRenderInvoiceWalletPickerWithWallet(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, requests := newTestBotWorker(t, st)

	user := tgUser{ID: 902, Username: "walletpickeruser"}
	chatID := int64(902)
	messageID := int64(5)

	// Bootstrap workspace by sending /start.
	if err := worker.handleMessage(ctx, botMessage(messageID, chatID, user, "/start")); err != nil {
		t.Fatalf("/start: %v", err)
	}
	workspace, err := st.GetWorkspaceByTelegramID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetWorkspaceByTelegramID: %v", err)
	}

	// Create a wallet so renderInvoiceWalletPicker shows the picker rows.
	_, err = st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x9999999999999999999999999999999999999999")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Trigger the wallet picker via /invoice command.
	if err := worker.handleMessage(ctx, botMessage(messageID+1, chatID, user, "/invoice")); err != nil {
		t.Fatalf("/invoice with wallet: %v", err)
	}

	// Also trigger via screen:invoice callback.
	if err := worker.handleCallback(ctx, botCallback("screen:invoice", messageID+2, chatID, user)); err != nil {
		t.Fatalf("screen:invoice callback with wallet: %v", err)
	}

	if !requests.sawText("New invoice") {
		t.Fatalf("expected wallet picker to display 'New invoice' text, got %#v", requests.texts)
	}
}

func TestBotWorkerConversationCreatesInvoiceAndKeepsBoundaries(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, requests := newTestBotWorker(t, st)

	user := tgUser{ID: 777, Username: "sellerbot"}
	chatID := int64(777)
	messageID := int64(10)

	if err := worker.handleMessage(ctx, botMessage(messageID, chatID, user, "/start")); err != nil {
		t.Fatalf("/start returned error: %v", err)
	}
	workspace, err := st.GetWorkspaceByTelegramID(ctx, user.ID)
	if err != nil {
		t.Fatalf("expected /start to create workspace: %v", err)
	}
	if workspace.Username != "sellerbot" {
		t.Fatalf("expected workspace username sellerbot, got %q", workspace.Username)
	}
	if err := worker.handleCallback(ctx, botCallback("screen:invoice", messageID, chatID, user)); err != nil {
		t.Fatalf("invoice screen without wallets returned error: %v", err)
	}
	if err := worker.handleMessage(ctx, botMessage(messageID+1, chatID, user, "/login")); err != nil {
		t.Fatalf("/login returned error: %v", err)
	}
	if err := worker.handleMessage(ctx, botMessage(messageID+2, chatID, user, "/unknown")); err != nil {
		t.Fatalf("unknown command should render help, got error: %v", err)
	}

	if err := worker.handleCallback(ctx, botCallback("wallet:set:EVM", messageID, chatID, user)); err != nil {
		t.Fatalf("wallet setup callback returned error: %v", err)
	}
	if worker.session(chatID).Flow != flowWalletAddress {
		t.Fatalf("expected wallet address flow, got %q", worker.session(chatID).Flow)
	}
	if err := worker.handleMessage(ctx, botMessage(messageID+1, chatID, user, "bad-wallet")); err != nil {
		t.Fatalf("invalid wallet input should render validation message, got error: %v", err)
	}
	if worker.session(chatID).Flow != flowWalletAddress {
		t.Fatalf("expected invalid wallet to keep wallet flow, got %q", worker.session(chatID).Flow)
	}

	if err := worker.handleMessage(ctx, botMessage(messageID+2, chatID, user, "0x3333333333333333333333333333333333333333")); err != nil {
		t.Fatalf("valid wallet input returned error: %v", err)
	}
	wallets, err := st.ListWallets(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("ListWallets returned error: %v", err)
	}
	if len(wallets) != 1 || wallets[0].Network != store.NetworkEVM {
		t.Fatalf("expected one EVM wallet, got %+v", wallets)
	}

	walletID := wallets[0].ID
	if err := worker.handleCallback(ctx, botCallback("invoice:new:"+strconv.FormatInt(walletID, 10), messageID, chatID, user)); err != nil {
		t.Fatalf("invoice wallet callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("invoice:network:"+strconv.FormatInt(walletID, 10)+":BASE", messageID, chatID, user)); err != nil {
		t.Fatalf("invoice network callback returned error: %v", err)
	}
	if worker.session(chatID).Flow != flowInvoiceTitle {
		t.Fatalf("expected invoice title flow, got %q", worker.session(chatID).Flow)
	}

	if err := worker.handleMessage(ctx, botMessage(messageID+3, chatID, user, "   ")); err != nil {
		t.Fatalf("blank invoice title should render validation message, got error: %v", err)
	}
	if worker.session(chatID).Flow != flowInvoiceTitle {
		t.Fatalf("expected blank title to keep title flow, got %q", worker.session(chatID).Flow)
	}
	if err := worker.handleMessage(ctx, botMessage(messageID+4, chatID, user, "Bot order")); err != nil {
		t.Fatalf("invoice title input returned error: %v", err)
	}
	if worker.session(chatID).Flow != flowInvoiceAmount {
		t.Fatalf("expected invoice amount flow, got %q", worker.session(chatID).Flow)
	}

	if err := worker.handleMessage(ctx, botMessage(messageID+5, chatID, user, "-1")); err != nil {
		t.Fatalf("negative invoice amount should render validation message, got error: %v", err)
	}
	if worker.session(chatID).Flow != flowInvoiceAmount {
		t.Fatalf("expected invalid amount to keep amount flow, got %q", worker.session(chatID).Flow)
	}
	if err := worker.handleMessage(ctx, botMessage(messageID+6, chatID, user, "12,50")); err != nil {
		t.Fatalf("invoice amount input returned error: %v", err)
	}
	if worker.session(chatID).Flow != flowIdle {
		t.Fatalf("expected amount step to move to idle lifetime choice, got %q", worker.session(chatID).Flow)
	}

	if err := worker.handleCallback(ctx, botCallback("invoice:lifetime:30", messageID, chatID, user)); err != nil {
		t.Fatalf("invoice lifetime callback returned error: %v", err)
	}
	invoices, total, err := st.ListInvoices(ctx, workspace.ID, store.ListInvoicesFilter{Limit: 10})
	if err != nil {
		t.Fatalf("ListInvoices returned error: %v", err)
	}
	if total != 1 || len(invoices) != 1 {
		t.Fatalf("expected one invoice from bot flow, total=%d invoices=%+v", total, invoices)
	}
	if invoices[0].Title != "Bot order" || invoices[0].PayableNetwork != store.NetworkBASE {
		t.Fatalf("unexpected invoice created by bot flow: %+v", invoices[0])
	}
	if worker.session(chatID).Flow != flowIdle || worker.session(chatID).DraftInvoice.Title != "" {
		t.Fatalf("expected invoice creation to reset session, got %+v", worker.session(chatID))
	}

	if !requests.sawText("A title can't be empty") || !requests.sawText("That's not a valid amount") || !requests.sawText("Invoice created successfully") || !requests.sawText("/checkout/"+invoices[0].PublicID) {
		t.Fatalf("expected validation and success messages to be sent, got %#v", requests.texts)
	}
	merchantInvoiceID := invoices[0].ID

	if err := worker.handleCallback(ctx, botCallback("invoice:keep_underpaid:"+strconv.FormatInt(merchantInvoiceID, 10), messageID, chatID, user)); err != nil {
		t.Fatalf("keep underpaid callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("invoice:keep_review:"+strconv.FormatInt(merchantInvoiceID, 10), messageID, chatID, user)); err != nil {
		t.Fatalf("keep review callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("invoice:mark_paid:"+strconv.FormatInt(merchantInvoiceID, 10), messageID, chatID, user)); err != nil {
		t.Fatalf("manual mark-paid callback returned error: %v", err)
	}
	paidInvoice, err := st.GetInvoiceByID(ctx, workspace.ID, merchantInvoiceID)
	if err != nil {
		t.Fatalf("GetInvoiceByID after mark paid returned error: %v", err)
	}
	if paidInvoice.Status != store.InvoiceStatusPaid {
		t.Fatalf("expected mark-paid callback to pay invoice, got %s", paidInvoice.Status)
	}
	if err := worker.handleCallback(ctx, botCallback("invoice:cancel", messageID, chatID, user)); err != nil {
		t.Fatalf("invoice cancel callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("unknown:action", messageID, chatID, user)); err != nil {
		t.Fatalf("unknown callback should only answer the callback, got error: %v", err)
	}

	if err := worker.handleMessage(ctx, botMessage(messageID+7, chatID, user, "/upgrade")); err != nil {
		t.Fatalf("/upgrade returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("upgrade:network:TON", messageID, chatID, user)); err != nil {
		t.Fatalf("upgrade checkout callback returned error: %v", err)
	}
	invoices, total, err = st.ListInvoices(ctx, workspace.ID, store.ListInvoicesFilter{Limit: 10})
	if err != nil {
		t.Fatalf("ListInvoices after upgrade returned error: %v", err)
	}
	if total != 2 || len(invoices) != 2 {
		t.Fatalf("expected merchant and subscription invoices after upgrade, total=%d invoices=%+v", total, invoices)
	}
	foundSubscription := false
	for _, invoice := range invoices {
		if invoice.Kind == store.InvoiceKindSubscription && invoice.PayableNetwork == store.NetworkTON {
			foundSubscription = true
		}
	}
	if !foundSubscription {
		t.Fatalf("expected TON subscription checkout from upgrade flow, got %+v", invoices)
	}
	if err := worker.handleCallback(ctx, botCallback("screen:wallets", messageID, chatID, user)); err != nil {
		t.Fatalf("wallets screen callback returned error: %v", err)
	}
	if err := worker.handleCallback(ctx, botCallback("wallet:disable:"+strconv.FormatInt(walletID, 10), messageID, chatID, user)); err != nil {
		t.Fatalf("wallet disable callback returned error: %v", err)
	}
	wallets, err = st.ListWallets(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("ListWallets after disable returned error: %v", err)
	}
	if len(wallets) != 0 {
		t.Fatalf("expected wallet disable callback to hide wallet, got %+v", wallets)
	}
}

func expectedWebhookSignature(secret string, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(payload)
	return "v1=" + hex.EncodeToString(mac.Sum(nil))
}

type telegramRequestLog struct {
	texts []string
}

func (l *telegramRequestLog) sawText(fragment string) bool {
	for _, text := range l.texts {
		if strings.Contains(text, fragment) {
			return true
		}
	}
	return false
}

func newTestBotWorker(t *testing.T, st *store.Store) (*BotWorker, *telegramRequestLog) {
	t.Helper()

	requests := &telegramRequestLog{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasSuffix(r.URL.Path, "/sendMessage") || strings.HasSuffix(r.URL.Path, "/editMessageText") {
			var body struct {
				Text string `json:"text"`
			}
			_ = json.NewDecoder(r.Body).Decode(&body)
			requests.texts = append(requests.texts, body.Text)
		}
		switch {
		case strings.HasSuffix(r.URL.Path, "/sendMessage"):
			_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":100}}`))
		case strings.HasSuffix(r.URL.Path, "/editMessageText"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		case strings.HasSuffix(r.URL.Path, "/answerCallbackQuery"):
			_, _ = w.Write([]byte(`{"ok":true,"result":true}`))
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(server.Close)

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)
	return worker, requests
}

func botMessage(messageID int64, chatID int64, user tgUser, text string) *tgMessage {
	message := &tgMessage{MessageID: messageID, Text: text, From: &user}
	message.Chat.ID = chatID
	return message
}

func botCallback(data string, messageID int64, chatID int64, user tgUser) *tgCallbackQuery {
	return &tgCallbackQuery{ID: "callback-" + data, Data: data, From: user, Message: botMessage(messageID, chatID, user, "")}
}

func newTelegramBotTestStore(t *testing.T, ctx context.Context) *store.Store {
	t.Helper()

	port := pickTelegramBotTestPort(t)
	baseDir := t.TempDir()
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("recv").
		Username("recv").
		Password("recv").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(filepath.Join(os.TempDir(), "recv-embedded-postgres-cache")).
		Locale("C").
		Encoding("UTF8").
		StartTimeout(45 * time.Second).
		StartParameters(map[string]string{
			"fsync":              "off",
			"synchronous_commit": "off",
			"full_page_writes":   "off",
		}).
		Logger(io.Discard)

	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		t.Fatalf("embedded postgres start failed: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Stop()
	})

	st, err := store.New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("store.New returned error: %v", err)
	}
	t.Cleanup(st.Close)
	if err := st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{
		"TON": "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
	}, false, "telegram-bot-test"); err != nil {
		t.Fatalf("seed billing wallets config: %v", err)
	}
	return st
}

func pickTelegramBotTestPort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()
	return uint32(listener.Addr().(*net.TCPAddr).Port)
}

// TestHandleCallbackInvalidIDPaths covers parse-error branches in handleCallback for
// callbacks that require an integer ID but receive a non-numeric suffix.
func TestHandleCallbackInvalidIDPaths(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	user := tgUser{ID: 90200, Username: "invalidcbuser"}
	chatID := int64(90200)
	msgID := int64(1)

	if err := worker.handleMessage(ctx, botMessage(msgID, chatID, user, "/start")); err != nil {
		t.Fatalf("/start: %v", err)
	}

	q := func(data string) *tgCallbackQuery {
		return botCallback(data, msgID, chatID, user)
	}

	invalidIDs := []string{
		"wallet:disable:not-a-number",
		"invoice:mark_paid:not-a-number",
		"invoice:keep_underpaid:not-a-number",
		"invoice:keep_review:not-a-number",
	}
	for _, data := range invalidIDs {
		err := worker.handleCallback(ctx, q(data))
		if err == nil {
			t.Fatalf("expected error for %q, got nil", data)
		}
	}
}

// TestHandleCallbackNilQuery covers the nil guard at the top of handleCallback.
func TestHandleCallbackNilQuery(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	if err := worker.handleCallback(ctx, nil); err != nil {
		t.Fatalf("expected nil return for nil query, got: %v", err)
	}

	nilMessageQuery := &tgCallbackQuery{
		ID:      "test",
		From:    tgUser{ID: 1},
		Message: nil,
	}
	if err := worker.handleCallback(ctx, nilMessageQuery); err != nil {
		t.Fatalf("expected nil return for nil Message, got: %v", err)
	}
}

// TestHandleMessageNilMessage covers the nil guard at the top of handleMessage.
func TestHandleMessageNilMessage(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	if err := worker.handleMessage(ctx, nil); err != nil {
		t.Fatalf("expected nil return for nil message, got: %v", err)
	}

	noFrom := &tgMessage{
		MessageID: 1,
		Chat: struct {
			ID int64 `json:"id"`
		}{ID: 1},
		From: nil,
	}
	if err := worker.handleMessage(ctx, noFrom); err != nil {
		t.Fatalf("expected nil return for nil From, got: %v", err)
	}
}

// TestFinishInvoiceWizardCreateInvoiceErrors covers error paths inside finishInvoiceWizard
// when CreateInvoice fails (trial limit and other errors).
func TestFinishInvoiceWizardCreateInvoiceErrors(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"ok":true,"result":{"message_id":1}}`))
	}))
	defer server.Close()

	worker := NewBotWorker(
		st,
		service.NewInvoiceService(st, "2.50"),
		"bot-token",
		"https://recv.test/app",
		slog.New(slog.NewTextHandler(io.Discard, nil)),
	)
	worker.httpClient = rewriteTelegramHTTPClient(t, server)

	t.Run("trial limit reached calls renderUpgrade", func(t *testing.T) {
		_, err := st.UpsertWorkspaceByTelegram(ctx, 90300, "triallimitbot")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		workspace, err := st.GetWorkspaceByTelegramID(ctx, 90300)
		if err != nil {
			t.Fatalf("GetWorkspaceByTelegramID: %v", err)
		}
		// Exhaust trial limit via SQL
		if _, err := st.RawPool().Exec(ctx,
			`UPDATE workspaces SET free_invoices_used = $1 WHERE id = $2`,
			service.TrialInvoiceLimit, workspace.ID); err != nil {
			t.Fatalf("exhaust trial limit: %v", err)
		}
		wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x9999999999999999999999999999999999999999")
		if err != nil {
			t.Fatalf("CreateWallet: %v", err)
		}

		chatID := int64(90300)
		session := worker.session(chatID)
		session.DraftInvoice = botInvoiceDraft{
			WalletID:       wallet.ID,
			WalletNetwork:  store.NetworkEVM,
			PayableNetwork: store.NetworkBASE,
			Title:          "Trial Invoice",
			Amount:         "5.00",
		}
		workspace.FreeInvoicesUsed = service.TrialInvoiceLimit

		// Should call renderUpgrade (not return error)
		err = worker.finishInvoiceWizard(ctx, workspace, chatID, 1, 30)
		if err != nil {
			t.Fatalf("expected trial limit to renderUpgrade, got: %v", err)
		}
	})

	t.Run("non-trial CreateInvoice error returns error", func(t *testing.T) {
		_, err := st.UpsertWorkspaceByTelegram(ctx, 90301, "invoiceerrbot")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		workspace, err := st.GetWorkspaceByTelegramID(ctx, 90301)
		if err != nil {
			t.Fatalf("GetWorkspaceByTelegramID: %v", err)
		}

		chatID := int64(90301)
		session := worker.session(chatID)
		session.DraftInvoice = botInvoiceDraft{
			WalletID:       999999,
			WalletNetwork:  store.NetworkEVM,
			PayableNetwork: store.NetworkBASE,
			Amount:         "5.00",
		}

		err = worker.finishInvoiceWizard(ctx, workspace, chatID, 1, 30)
		if err == nil {
			t.Fatal("expected error for non-existent wallet, got nil")
		}
	})
}

type telegramRewriteTransport struct {
	base   http.RoundTripper
	target *url.URL
}

func (t telegramRewriteTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = t.target.Scheme
	clone.URL.Host = t.target.Host
	clone.Host = t.target.Host
	return t.base.RoundTrip(clone)
}

func rewriteTelegramHTTPClient(t *testing.T, server *httptest.Server) *http.Client {
	t.Helper()

	target, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}
	return &http.Client{
		Timeout: 2 * time.Second,
		Transport: telegramRewriteTransport{
			base:   server.Client().Transport,
			target: target,
		},
	}
}

func TestBotWorkerStartParameters(t *testing.T) {
	ctx := context.Background()
	st := newTelegramBotTestStore(t, ctx)
	worker, _ := newTestBotWorker(t, st)

	t.Run("parseStartParam helper", func(t *testing.T) {
		utm, ref := parseStartParam("utm__tg_vcru__cpc__vcru__post-v1")
		if utm == nil || utm.Source != "tg_vcru" || utm.Medium != "cpc" || utm.Campaign != "vcru" || utm.Content != "post-v1" {
			t.Errorf("expected UTM params, got %+v", utm)
		}

		utm, ref = parseStartParam("utm__tg_vcru")
		if utm == nil || utm.Source != "tg_vcru" || utm.Medium != "" || utm.Campaign != "" {
			t.Errorf("expected source, got %+v", utm)
		}

		utm, ref = parseStartParam("ref__mycode")
		if utm != nil || ref != "mycode" {
			t.Errorf("expected referral code mycode, got utm=%+v, ref=%q", utm, ref)
		}

		utm, ref = parseStartParam("mycode")
		if utm != nil || ref != "mycode" {
			t.Errorf("expected referral code mycode, got utm=%+v, ref=%q", utm, ref)
		}
	})

	t.Run("handleMessage with UTM", func(t *testing.T) {
		user := tgUser{ID: 1001, Username: "utm_user"}
		msg := botMessage(100, 1001, user, "/start utm__tg_vcru__cpc__vcru")
		err := worker.handleMessage(ctx, msg)
		if err != nil {
			t.Fatalf("handleMessage error: %v", err)
		}

		// Retrieve workspace
		_, err = st.GetWorkspaceByTelegramID(ctx, 1001)
		if err != nil {
			t.Fatalf("failed to find workspace: %v", err)
		}

		// Check UTM report
		rep, err := st.GetUTMReport(ctx, time.Now().Add(-time.Hour), time.Now().Add(time.Hour))
		if err != nil {
			t.Fatalf("failed to get UTM report: %v", err)
		}

		found := false
		for _, r := range rep.Campaigns {
			if r.Source == "tg_vcru" && r.Campaign == "vcru" {
				found = true
				if r.Visits != 1 || r.Signups != 1 {
					t.Errorf("expected 1 visit and 1 signup, got %+v", r)
				}
			}
		}
		if !found {
			t.Errorf("expected campaign tg_vcru/vcru in report, got: %+v", rep.Campaigns)
		}
	})
}
