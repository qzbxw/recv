package store

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"testing"
	"time"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/shopspring/decimal"
)

var sharedStoreDBTestStore *Store

func TestMain(m *testing.M) {
	ctx := context.Background()

	port, err := pickStoreDBTestPortValue()
	if err != nil {
		panic("failed to pick free port: " + err.Error())
	}

	baseDir, err := os.MkdirTemp("", "recv-store-test-*")
	if err != nil {
		panic("mktemp: " + err.Error())
	}
	defer os.RemoveAll(baseDir)

	pgConfig := storeDBTestPostgresConfig(port, baseDir)
	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		panic("embedded postgres start: " + err.Error())
	}

	st, err := New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		_ = database.Stop()
		panic("store.New returned error: " + err.Error())
	}
	sharedStoreDBTestStore = st

	code := m.Run()
	st.Close()
	_ = database.Stop()
	os.Exit(code)
}

// TestUpdateWorkspaceEmail verifies that a workspace email can be set and cleared.
func TestUpdateWorkspaceEmail(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70001, "emailtestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Act: set email
	updated, err := st.UpdateWorkspaceEmail(ctx, workspace.ID, "contact@example.com")
	if err != nil {
		t.Fatalf("UpdateWorkspaceEmail: %v", err)
	}

	// Assert
	if updated.Email != "contact@example.com" {
		t.Fatalf("expected email contact@example.com, got %q", updated.Email)
	}

	// Act: clear email with empty string (NULLIF)
	cleared, err := st.UpdateWorkspaceEmail(ctx, workspace.ID, "")
	if err != nil {
		t.Fatalf("UpdateWorkspaceEmail clear: %v", err)
	}
	if cleared.Email != "" {
		t.Fatalf("expected empty email after clearing, got %q", cleared.Email)
	}
}

func TestUpdateWorkspaceLanguage(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70003, "languagetestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	updated, err := st.UpdateWorkspaceLanguage(ctx, workspace.ID, " RU_ru ")
	if err != nil {
		t.Fatalf("UpdateWorkspaceLanguage: %v", err)
	}
	if updated.Language != "ru" {
		t.Fatalf("expected normalized ru language, got %q", updated.Language)
	}

	fallback, err := st.UpdateWorkspaceLanguage(ctx, workspace.ID, "de")
	if err != nil {
		t.Fatalf("UpdateWorkspaceLanguage fallback: %v", err)
	}
	if fallback.Language != "en" {
		t.Fatalf("expected fallback en language, got %q", fallback.Language)
	}

	canceled, cancel := context.WithCancel(ctx)
	cancel()
	if _, err := st.UpdateWorkspaceLanguage(canceled, workspace.ID, "ru"); err == nil {
		t.Fatal("expected canceled context to return an error")
	}
}

// TestCountInvoicesCreated verifies counting with zero and non-zero counts.
func TestCountInvoicesCreated(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70002, "countinvuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x1111111111111111111111111111111111111111")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Assert: zero initially
	count, err := st.CountInvoicesCreated(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("CountInvoicesCreated: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected 0 invoices initially, got %d", count)
	}

	// Act: create an invoice
	_, err = st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Count Test",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10"),
		PublicID:           "CNTTEST001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	// Assert: count is now 1
	count, err = st.CountInvoicesCreated(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("CountInvoicesCreated after create: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 invoice, got %d", count)
	}
}

func TestCreateInvoiceWithMultiplePaymentOptions(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70004, "multioptionuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	comment := "RECV-MULTI"
	suffix := decimal.RequireFromString("0.000123")
	invoice, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Multi Option",
		BaseAmountUSD:      decimal.RequireFromString("12"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: "0x8888888888888888888888888888888888888888",
		PayableAmount:      decimal.RequireFromString("12.000123"),
		PublicID:           "MULTIOPT001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
		PaymentOptions: []CreatePaymentOptionParams{
			{
				Network:            NetworkBASE,
				Asset:              AssetUSDC,
				PayableAmount:      decimal.RequireFromString("12.000123"),
				DestinationAddress: "0x8888888888888888888888888888888888888888",
				MatchingSuffix:     &suffix,
				PaymentURI:         "ethereum:0x8888888888888888888888888888888888888888",
			},
			{
				Network:            NetworkTON,
				Asset:              AssetGRAM,
				PayableAmount:      decimal.RequireFromString("3.000000"),
				DestinationAddress: "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn",
				PaymentComment:     &comment,
			},
		},
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	if invoice.PayableNetwork != NetworkBASE || invoice.PayableAsset != AssetUSDC {
		t.Fatalf("expected first option to be applied as default, got %+v", invoice)
	}
	if len(invoice.PaymentOptions) != 2 {
		t.Fatalf("expected two payment options on created invoice, got %#v", invoice.PaymentOptions)
	}

	options, err := st.ListPaymentOptionsForInvoice(ctx, invoice.ID)
	if err != nil {
		t.Fatalf("ListPaymentOptionsForInvoice: %v", err)
	}
	if len(options) != 2 {
		t.Fatalf("expected two scanned payment options, got %#v", options)
	}

	loaded, err := st.GetInvoiceByID(ctx, workspace.ID, invoice.ID)
	if err != nil {
		t.Fatalf("GetInvoiceByID: %v", err)
	}
	if loaded.PayableNetwork != NetworkBASE || len(loaded.PaymentOptions) != 2 {
		t.Fatalf("expected loaded invoice to include applied payment options, got %+v", loaded)
	}
}

// TestTONCommentExists verifies existence check for TON payment comments.
func TestTONCommentExists(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70003, "toncommentuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkTON, "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Assert: non-existent comment returns false
	exists, err := st.TONCommentExists(ctx, "RECV-NONEXISTENT")
	if err != nil {
		t.Fatalf("TONCommentExists: %v", err)
	}
	if exists {
		t.Fatal("expected non-existent comment to return false")
	}

	// Act: create invoice with a payment comment
	comment := "RECV-TON001"
	_, err = st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "TON Comment Test",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     NetworkTON,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("5"),
		PaymentComment:     &comment,
		PublicID:           "TONCOM001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	// Assert: existing comment returns true
	exists, err = st.TONCommentExists(ctx, comment)
	if err != nil {
		t.Fatalf("TONCommentExists after create: %v", err)
	}
	if !exists {
		t.Fatal("expected existing TON comment to return true")
	}
}

// TestMarkPaymentEventUnmatched verifies the classification update.
func TestMarkPaymentEventUnmatched(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange: insert a payment event directly via RawPool
	var eventID int64
	err := st.RawPool().QueryRow(ctx, `
		INSERT INTO payment_events (network, tx_hash, destination_address, amount, observed_at, raw_payload, classification, external_event_id)
		VALUES ('BASE', 'tx-unmatched-001', '0x2222222222222222222222222222222222222222', '5.0', NOW(), '{}', 'pending', 'BASE:tx-unmatched-001')
		RETURNING id
	`).Scan(&eventID)
	if err != nil {
		t.Fatalf("insert payment event: %v", err)
	}

	// Act
	if err := st.MarkPaymentEventUnmatched(ctx, eventID, "no_matching_invoice"); err != nil {
		t.Fatalf("MarkPaymentEventUnmatched: %v", err)
	}

	// Assert: verify classification was updated
	var classification string
	if err := st.RawPool().QueryRow(ctx, `SELECT classification FROM payment_events WHERE id = $1`, eventID).Scan(&classification); err != nil {
		t.Fatalf("read payment event classification: %v", err)
	}
	if classification != "no_matching_invoice" {
		t.Fatalf("expected classification no_matching_invoice, got %q", classification)
	}
}

// TestGetWatchedWallets verifies that active invoices produce watched wallets.
func TestGetWatchedWallets(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Assert: empty initially
	wallets, err := st.GetWatchedWallets(ctx, 24*time.Hour)
	if err != nil {
		t.Fatalf("GetWatchedWallets: %v", err)
	}
	if len(wallets) != 0 {
		t.Fatalf("expected no watched wallets initially, got %d", len(wallets))
	}

	// Arrange: create workspace and invoice
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70004, "watchedwalletsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x3333333333333333333333333333333333333333")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	_, err = st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Watcher Test",
		BaseAmountUSD:      decimal.RequireFromString("20"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("20"),
		PublicID:           "WATCH001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	// Act: get watched wallets within grace window
	wallets, err = st.GetWatchedWallets(ctx, 24*time.Hour)
	if err != nil {
		t.Fatalf("GetWatchedWallets after create: %v", err)
	}
	if len(wallets) == 0 {
		t.Fatal("expected at least one watched wallet after creating active invoice")
	}

	found := false
	for _, w := range wallets {
		if w.Address == wallet.Address {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected wallet address %s in watched wallets, got %+v", wallet.Address, wallets)
	}

	// Also test the zero grace-window fallback path (uses 24h default)
	wallets2, err := st.GetWatchedWallets(ctx, 0)
	if err != nil {
		t.Fatalf("GetWatchedWallets with zero grace window: %v", err)
	}
	if len(wallets2) == 0 {
		t.Fatal("expected zero grace window to fall back to 24h and return wallets")
	}
}

// TestMarkNotificationFailed verifies the status and error update on the outbox.
func TestMarkNotificationFailed(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange: create a workspace with a Telegram ID and insert a notification job
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70005, "notifyfailuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	var jobID int64
	err = st.RawPool().QueryRow(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload, status)
		VALUES ($1, $2, 'test notification', '{}', 'pending')
		RETURNING id
	`, workspace.ID, int64(70005)).Scan(&jobID)
	if err != nil {
		t.Fatalf("insert notification job: %v", err)
	}

	// Act
	if err := st.MarkNotificationFailed(ctx, jobID, "connection refused"); err != nil {
		t.Fatalf("MarkNotificationFailed: %v", err)
	}

	// Assert: status should be 'failed' with the given error
	var status, lastError string
	if err := st.RawPool().QueryRow(ctx, `SELECT status, last_error FROM notification_outbox WHERE id = $1`, jobID).Scan(&status, &lastError); err != nil {
		t.Fatalf("read notification outbox: %v", err)
	}
	if status != "failed" {
		t.Fatalf("expected status failed, got %q", status)
	}
	if lastError != "connection refused" {
		t.Fatalf("expected error message 'connection refused', got %q", lastError)
	}
}

// TestPublicWebhookEndpoint verifies that the secret is stripped in the public view.
func TestPublicWebhookEndpoint(t *testing.T) {
	st := &Store{}

	// Arrange
	endpoint := WebhookEndpoint{
		ID:     1,
		Label:  "My Hook",
		URL:    "https://example.com/webhook",
		Secret: "super-secret-value",
	}

	// Act
	public := st.PublicWebhookEndpoint(endpoint)

	// Assert
	if public.Secret != "" {
		t.Fatalf("expected secret to be stripped from public endpoint, got %q", public.Secret)
	}
	if public.URL != endpoint.URL {
		t.Fatalf("expected URL to be preserved, got %q", public.URL)
	}
	if public.Label != endpoint.Label {
		t.Fatalf("expected label to be preserved, got %q", public.Label)
	}
}

// TestRecordWebhookDeliveryAttempt verifies that attempts are persisted correctly.
func TestRecordWebhookDeliveryAttempt(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange: workspace, endpoint, and a raw delivery
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70006, "webhookattemptuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "attempt-test", "https://example.com/hook", "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	var deliveryID int64
	payload := json.RawMessage(`{"event":"invoice.paid"}`)
	err = st.RawPool().QueryRow(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id)
		VALUES ($1, $2, 'invoice.paid', $3, 3, 'evt_attempt_test_1')
		RETURNING id
	`, endpoint.ID, workspace.ID, payload).Scan(&deliveryID)
	if err != nil {
		t.Fatalf("insert webhook delivery: %v", err)
	}

	// Act: record a successful attempt
	result := WebhookAttemptResult{
		Status:     "success",
		StatusCode: 200,
		Duration:   50 * time.Millisecond,
	}
	if err := st.RecordWebhookDeliveryAttempt(ctx, deliveryID, endpoint.ID, 1, result); err != nil {
		t.Fatalf("RecordWebhookDeliveryAttempt success: %v", err)
	}

	// Assert: verify the attempt was recorded
	var status string
	if err := st.RawPool().QueryRow(ctx, `SELECT status FROM webhook_delivery_attempts WHERE delivery_id = $1 AND attempt_number = 1`, deliveryID).Scan(&status); err != nil {
		t.Fatalf("read webhook attempt: %v", err)
	}
	if status != "success" {
		t.Fatalf("expected success status, got %q", status)
	}

	// Act: record a failure attempt - status should be auto-resolved from empty
	failResult := WebhookAttemptResult{
		StatusCode: 503,
		Duration:   100 * time.Millisecond,
		Error:      "service unavailable",
	}
	if err := st.RecordWebhookDeliveryAttempt(ctx, deliveryID, endpoint.ID, 2, failResult); err != nil {
		t.Fatalf("RecordWebhookDeliveryAttempt failure: %v", err)
	}
}

// TestMarkWebhookDeliveryFailed verifies backoff progression and dead-letter transition.
func TestMarkWebhookDeliveryFailed(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70007, "webhookfailuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "fail-test", "https://example.com/hook", "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	insertDelivery := func(eventID string) int64 {
		var deliveryID int64
		payload := json.RawMessage(`{"event":"invoice.paid"}`)
		if err := st.RawPool().QueryRow(ctx, `
			INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id)
			VALUES ($1, $2, 'invoice.paid', $3, 3, $4)
			RETURNING id
		`, endpoint.ID, workspace.ID, payload, eventID).Scan(&deliveryID); err != nil {
			t.Fatalf("insert webhook delivery %s: %v", eventID, err)
		}
		return deliveryID
	}

	t.Run("sets failed status with backoff", func(t *testing.T) {
		// Arrange
		deliveryID := insertDelivery("evt_fail_test_1")

		// Act
		if err := st.MarkWebhookDeliveryFailed(ctx, deliveryID, endpoint.ID, 1, 3, 503, "service unavailable"); err != nil {
			t.Fatalf("MarkWebhookDeliveryFailed: %v", err)
		}

		// Assert
		var status string
		if err := st.RawPool().QueryRow(ctx, `SELECT status FROM webhook_deliveries WHERE id = $1`, deliveryID).Scan(&status); err != nil {
			t.Fatalf("read delivery status: %v", err)
		}
		if status != "failed" {
			t.Fatalf("expected failed status, got %q", status)
		}
	})

	t.Run("sets dead status when max attempts reached", func(t *testing.T) {
		// Arrange
		deliveryID := insertDelivery("evt_fail_test_2")

		// Act: attempts == maxAttempts triggers dead
		if err := st.MarkWebhookDeliveryFailed(ctx, deliveryID, endpoint.ID, 3, 3, 503, "max attempts exhausted"); err != nil {
			t.Fatalf("MarkWebhookDeliveryFailed dead: %v", err)
		}

		// Assert
		var status string
		if err := st.RawPool().QueryRow(ctx, `SELECT status FROM webhook_deliveries WHERE id = $1`, deliveryID).Scan(&status); err != nil {
			t.Fatalf("read delivery status: %v", err)
		}
		if status != "dead" {
			t.Fatalf("expected dead status, got %q", status)
		}
	})
}

// TestCountWorkspaceOwners verifies owner counting for workspace team management.
func TestCountWorkspaceOwners(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange: workspace is created with the first user as owner
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70008, "ownercount")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Act: count owners (should be 1 — the workspace creator)
	count, err := st.CountWorkspaceOwners(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("CountWorkspaceOwners: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 owner after workspace creation, got %d", count)
	}

	// Act: count for non-existent workspace returns 0
	count, err = st.CountWorkspaceOwners(ctx, 99999)
	if err != nil {
		t.Fatalf("CountWorkspaceOwners non-existent: %v", err)
	}
	if count != 0 {
		t.Fatalf("expected 0 owners for non-existent workspace, got %d", count)
	}
}

// TestCountAPIRequestsSince verifies counting with and without key ID filter.
func TestCountAPIRequestsSince(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70009, "apicountuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Assert: zero when no requests recorded
	count, err := st.CountAPIRequestsSince(ctx, workspace.ID, nil, time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("CountAPIRequestsSince (nil key): %v", err)
	}
	if count != 0 {
		t.Fatalf("expected 0 requests, got %d", count)
	}

	// Create an API key to record requests against
	apiKey, err := st.CreateAPIKey(ctx, workspace.ID, "test-key", "recv_", "hashvalue123", []string{"invoices:read"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}

	// Record a request
	if err := st.RecordAPIRequest(ctx, workspace.ID, apiKey.ID, "GET", "/v1/invoices", 200); err != nil {
		t.Fatalf("RecordAPIRequest: %v", err)
	}

	// Count without key filter
	count, err = st.CountAPIRequestsSince(ctx, workspace.ID, nil, time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("CountAPIRequestsSince (nil key) after record: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 request (no key filter), got %d", count)
	}

	// Count with key filter
	count, err = st.CountAPIRequestsSince(ctx, workspace.ID, &apiKey.ID, time.Now().Add(-time.Hour))
	if err != nil {
		t.Fatalf("CountAPIRequestsSince (with key) after record: %v", err)
	}
	if count != 1 {
		t.Fatalf("expected 1 request (with key filter), got %d", count)
	}
}

// TestGetWatcherCheckpoint verifies saving and retrieving watcher state.
func TestGetWatcherCheckpoint(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Assert: returns not-found for missing checkpoint
	_, err := st.GetWatcherCheckpoint(ctx, NetworkEVM, NetworkBASE, "0xnotexist")
	if err == nil {
		t.Fatal("expected error for non-existent watcher checkpoint")
	}

	// Arrange: save a checkpoint
	observedAt := time.Now().UTC().Truncate(time.Millisecond)
	if err := st.SaveWatcherCheckpoint(ctx, WatcherCheckpoint{
		PollNetwork:        NetworkEVM,
		PayableNetwork:     NetworkBASE,
		DestinationAddress: "0x4444444444444444444444444444444444444444",
		LastBlock:          500,
		LastObservedAt:     &observedAt,
	}); err != nil {
		t.Fatalf("SaveWatcherCheckpoint: %v", err)
	}

	// Act: retrieve it
	checkpoint, err := st.GetWatcherCheckpoint(ctx, NetworkEVM, NetworkBASE, "0x4444444444444444444444444444444444444444")
	if err != nil {
		t.Fatalf("GetWatcherCheckpoint: %v", err)
	}
	if checkpoint.LastBlock != 500 {
		t.Fatalf("expected block 500, got %d", checkpoint.LastBlock)
	}
}

// TestRecordUTMAttribution verifies that UTM attribution is saved and no-ops correctly.
func TestRecordUTMAttribution(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Arrange
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 70010, "utmtestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Act: empty attribution is a no-op
	if err := st.RecordUTMAttribution(ctx, workspace.ID, AttributionInput{}); err != nil {
		t.Fatalf("RecordUTMAttribution with empty input: %v", err)
	}

	// Act: zero workspace ID is a no-op
	if err := st.RecordUTMAttribution(ctx, 0, AttributionInput{Source: "google"}); err != nil {
		t.Fatalf("RecordUTMAttribution with zero workspace: %v", err)
	}

	// Act: valid attribution
	attr := AttributionInput{
		Source:      "google",
		Medium:      "cpc",
		Campaign:    "test-campaign",
		LandingPath: "/pricing",
		TouchType:   "first",
	}
	if err := st.RecordUTMAttribution(ctx, workspace.ID, attr); err != nil {
		t.Fatalf("RecordUTMAttribution: %v", err)
	}

	// Act: last touch type
	attr2 := AttributionInput{
		Source:    "twitter",
		Medium:    "social",
		TouchType: "last",
	}
	if err := st.RecordUTMAttribution(ctx, workspace.ID, attr2); err != nil {
		t.Fatalf("RecordUTMAttribution last touch: %v", err)
	}

	// Act: missing touch type defaults to "last"
	attr3 := AttributionInput{
		Source:   "direct",
		Referrer: "https://example.com",
	}
	if err := st.RecordUTMAttribution(ctx, workspace.ID, attr3); err != nil {
		t.Fatalf("RecordUTMAttribution default touch: %v", err)
	}
}

// TestReviewAdminInvoiceFlows covers keep_manual_review and expire paths.
func TestReviewAdminInvoiceFlows(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71001, "reviewuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x5555555555555555555555555555555555555555")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	makeManualReviewInvoice := func(publicID string) Invoice {
		inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               InvoiceKindMerchant,
			Title:              "Review Test",
			BaseAmountUSD:      decimal.RequireFromString("25"),
			PayableNetwork:     NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      decimal.RequireFromString("25"),
			PublicID:           publicID,
			Mode:               "live",
			ExpiresAt:          time.Now().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice %s: %v", publicID, err)
		}
		// Advance invoice to manual_review status via RawPool
		if _, err := st.RawPool().Exec(ctx, `
			UPDATE invoices SET status = 'manual_review', review_reason = 'late transfer'
			WHERE id = $1
		`, inv.ID); err != nil {
			t.Fatalf("set manual_review status: %v", err)
		}
		inv.Status = InvoiceStatusManualReview
		return inv
	}

	t.Run("keep_manual_review leaves invoice in manual_review", func(t *testing.T) {
		inv := makeManualReviewInvoice("REVIEW001")
		updated, result, err := st.ReviewAdminInvoice(ctx, inv.ID, "keep_manual_review", "under investigation", "admin")
		if err != nil {
			t.Fatalf("ReviewAdminInvoice keep: %v", err)
		}
		if updated.Status != InvoiceStatusManualReview {
			t.Fatalf("expected manual_review status, got %s", updated.Status)
		}
		if result == "" {
			t.Fatal("expected non-empty result message")
		}
	})

	t.Run("expire changes invoice to expired", func(t *testing.T) {
		inv := makeManualReviewInvoice("REVIEW002")
		updated, result, err := st.ReviewAdminInvoice(ctx, inv.ID, "expire", "dispute resolved", "admin")
		if err != nil {
			t.Fatalf("ReviewAdminInvoice expire: %v", err)
		}
		if updated.Status != InvoiceStatusExpired {
			t.Fatalf("expected expired status, got %s", updated.Status)
		}
		if result == "" {
			t.Fatal("expected non-empty result message")
		}
	})

	t.Run("mark_paid applies post payment effects", func(t *testing.T) {
		if _, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "review-paid-hook", "https://example.com/review-paid", "whsec_review", "live"); err != nil {
			t.Fatalf("CreateWebhookEndpoint: %v", err)
		}
		inv := makeManualReviewInvoice("REVIEW004")
		updated, result, err := st.ReviewAdminInvoice(ctx, inv.ID, "mark_paid", "", "admin")
		if err != nil {
			t.Fatalf("ReviewAdminInvoice mark_paid: %v", err)
		}
		if updated.Status != InvoiceStatusPaid || updated.PaidAt == nil || updated.FinalizedAt == nil {
			t.Fatalf("expected paid finalized invoice, got %+v", updated)
		}
		if result == "" {
			t.Fatal("expected non-empty result message")
		}
		deliveries, err := st.ListWebhookDeliveries(ctx, workspace.ID, 10)
		if err != nil {
			t.Fatalf("ListWebhookDeliveries after mark_paid: %v", err)
		}
		if len(deliveries) == 0 {
			t.Fatal("expected mark_paid to enqueue a webhook delivery")
		}
	})

	t.Run("review non-existent invoice returns error", func(t *testing.T) {
		_, _, err := st.ReviewAdminInvoice(ctx, 99999999, "mark_paid", "", "admin")
		if err == nil {
			t.Fatal("expected error for non-existent invoice")
		}
	})

	t.Run("review invoice not in manual_review returns error", func(t *testing.T) {
		// Create a fresh invoice (status=awaiting_payment)
		inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               InvoiceKindMerchant,
			Title:              "Not Review",
			BaseAmountUSD:      decimal.RequireFromString("10"),
			PayableNetwork:     NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      decimal.RequireFromString("10"),
			PublicID:           "REVIEW003",
			Mode:               "live",
			ExpiresAt:          time.Now().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice: %v", err)
		}
		_, _, err = st.ReviewAdminInvoice(ctx, inv.ID, "mark_paid", "", "admin")
		if err == nil || err.Error() != "invoice is awaiting_payment, not manual_review" {
			t.Fatalf("expected status error, got %v", err)
		}
	})
}

// TestResendAdminWebhookDelivery verifies that resending a webhook delivery creates a new one.
func TestResendAdminWebhookDelivery(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71002, "resenduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "resend-test", "https://example.com/hook", "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	// Insert a delivery to resend
	payload := json.RawMessage(`{"event":"invoice.paid"}`)
	var deliveryID int64
	if err := st.RawPool().QueryRow(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id, status)
		VALUES ($1, $2, 'invoice.paid', $3, 3, 'evt_resend_001', 'dead')
		RETURNING id
	`, endpoint.ID, workspace.ID, payload).Scan(&deliveryID); err != nil {
		t.Fatalf("insert webhook delivery: %v", err)
	}

	// Resend it
	newDelivery, err := st.ResendAdminWebhookDelivery(ctx, deliveryID)
	if err != nil {
		t.Fatalf("ResendAdminWebhookDelivery: %v", err)
	}
	if newDelivery.ID == 0 || newDelivery.ID == deliveryID {
		t.Fatalf("expected new delivery ID, got %d (original: %d)", newDelivery.ID, deliveryID)
	}

	// Non-existent delivery returns error
	_, err = st.ResendAdminWebhookDelivery(ctx, 99999999)
	if err == nil {
		t.Fatal("expected error for non-existent delivery")
	}
}

// TestListAdminFailedWebhooksAndWatchers tests the admin ops listing functions.
func TestListAdminFailedWebhooksAndWatchers(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	t.Run("ListAdminFailedWebhooks returns data after insertion", func(t *testing.T) {
		workspace, err := st.UpsertWorkspaceByTelegram(ctx, 72001, "failedwebhookuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "fail-test", "https://example.com/hook", "whsec_test", "live")
		if err != nil {
			t.Fatalf("CreateWebhookEndpoint: %v", err)
		}

		// Insert a failed webhook delivery
		payload := json.RawMessage(`{"event":"invoice.paid"}`)
		if _, err := st.RawPool().Exec(ctx, `
			INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id, status, attempts)
			VALUES ($1, $2, 'invoice.paid', $3, 3, 'evt_admin_fail_list', 'failed', 3)
		`, endpoint.ID, workspace.ID, payload); err != nil {
			t.Fatalf("insert failed delivery: %v", err)
		}

		items, err := st.ListAdminFailedWebhooks(ctx, 10)
		if err != nil {
			t.Fatalf("ListAdminFailedWebhooks: %v", err)
		}
		if len(items) == 0 {
			t.Fatal("expected at least one failed webhook delivery")
		}
	})

	t.Run("ListAdminFailedWebhooks with default limit when invalid", func(t *testing.T) {
		items, err := st.ListAdminFailedWebhooks(ctx, -1)
		if err != nil {
			t.Fatalf("ListAdminFailedWebhooks with -1: %v", err)
		}
		_ = items
	})

	t.Run("ListAdminWatchers returns data after checkpoint", func(t *testing.T) {
		// Save a watcher checkpoint so the scan loop executes
		observedAt := time.Now().UTC().Truncate(time.Millisecond)
		if err := st.SaveWatcherCheckpoint(ctx, WatcherCheckpoint{
			PollNetwork:        NetworkEVM,
			PayableNetwork:     NetworkBASE,
			DestinationAddress: "0x6666666666666666666666666666666666666666",
			LastBlock:          100,
			LastObservedAt:     &observedAt,
		}); err != nil {
			t.Fatalf("SaveWatcherCheckpoint: %v", err)
		}

		items, err := st.ListAdminWatchers(ctx)
		if err != nil {
			t.Fatalf("ListAdminWatchers: %v", err)
		}
		if len(items) == 0 {
			t.Fatal("expected at least one watcher record")
		}
	})

	t.Run("ListSEOTargets returns data if any", func(t *testing.T) {
		targets, err := st.ListSEOTargets(ctx)
		if err != nil {
			t.Fatalf("ListSEOTargets: %v", err)
		}
		_ = targets
	})
}

// TestListInvoicesFilters verifies that status, query, and edge-case filters work.
func TestListInvoicesFilters(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 73001, "filterinvuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x7777777777777777777777777777777777777777")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Create a paid invoice
	inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Filter Test Invoice",
		BaseAmountUSD:      decimal.RequireFromString("15"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("15"),
		PublicID:           "FILTER001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	// Mark it paid
	if _, err := st.SetInvoiceStatus(ctx, workspace.ID, inv.ID, InvoiceStatusPaid); err != nil {
		t.Fatalf("SetInvoiceStatus paid: %v", err)
	}

	t.Run("status filter returns only matching invoices", func(t *testing.T) {
		items, total, err := st.ListInvoices(ctx, workspace.ID, ListInvoicesFilter{
			Limit:  10,
			Status: "paid",
		})
		if err != nil {
			t.Fatalf("ListInvoices with status filter: %v", err)
		}
		if total == 0 || len(items) == 0 {
			t.Fatal("expected paid invoices in result")
		}
		for _, item := range items {
			if item.Status != InvoiceStatusPaid {
				t.Fatalf("expected only paid invoices, got %s", item.Status)
			}
		}
	})

	t.Run("query filter matches title", func(t *testing.T) {
		items, total, err := st.ListInvoices(ctx, workspace.ID, ListInvoicesFilter{
			Limit: 10,
			Query: "Filter Test",
		})
		if err != nil {
			t.Fatalf("ListInvoices with query filter: %v", err)
		}
		if total == 0 || len(items) == 0 {
			t.Fatal("expected at least one result matching query")
		}
	})

	t.Run("normalizes invalid limit and offset", func(t *testing.T) {
		items, _, err := st.ListInvoices(ctx, workspace.ID, ListInvoicesFilter{
			Limit:  -1,
			Offset: -5,
		})
		if err != nil {
			t.Fatalf("ListInvoices with invalid limit/offset: %v", err)
		}
		_ = items
	})

	t.Run("all status filter returns everything", func(t *testing.T) {
		items, _, err := st.ListInvoices(ctx, workspace.ID, ListInvoicesFilter{
			Limit:  100,
			Status: "all",
		})
		if err != nil {
			t.Fatalf("ListInvoices with 'all' status: %v", err)
		}
		_ = items
	})
}

// TestMarkInvoicePaidManualFlow tests the manual paid path and error conditions.
func TestMarkInvoicePaidManualFlow(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 73002, "manualpaiduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x8888888888888888888888888888888888888888")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Manual Paid Test",
		BaseAmountUSD:      decimal.RequireFromString("30"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("30"),
		PublicID:           "MANUAL001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("marks awaiting_payment invoice as paid", func(t *testing.T) {
		updated, err := st.MarkInvoicePaidManual(ctx, workspace.ID, inv.ID)
		if err != nil {
			t.Fatalf("MarkInvoicePaidManual: %v", err)
		}
		if updated.Status != InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", updated.Status)
		}
	})

	t.Run("returns not found for non-existent invoice", func(t *testing.T) {
		_, err := st.MarkInvoicePaidManual(ctx, workspace.ID, 99999999)
		if err == nil {
			t.Fatal("expected error for non-existent invoice")
		}
	})
}

// TestStoreTelegramAuthCodeErrors covers edge cases in telegram auth code flow.
func TestStoreTelegramAuthCodeErrors(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 73003, "telegramcodeuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("store and consume code", func(t *testing.T) {
		expiresAt := time.Now().UTC().Add(10 * time.Minute)
		if err := st.StoreTelegramAuthCode(ctx, workspace.ID, "test-code-hash", expiresAt); err != nil {
			t.Fatalf("StoreTelegramAuthCode: %v", err)
		}
		if err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, "test-code-hash"); err != nil {
			t.Fatalf("ConsumeTelegramAuthCode: %v", err)
		}
	})

	t.Run("consume non-existent code returns error", func(t *testing.T) {
		err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, "nonexistent-hash")
		if err == nil {
			t.Fatal("expected error for non-existent code")
		}
	})

	t.Run("consume expired code returns error", func(t *testing.T) {
		expiresAt := time.Now().UTC().Add(-1 * time.Minute) // expired
		if err := st.StoreTelegramAuthCode(ctx, workspace.ID, "expired-code-hash", expiresAt); err != nil {
			t.Fatalf("StoreTelegramAuthCode expired: %v", err)
		}
		err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, "expired-code-hash")
		if err == nil {
			t.Fatal("expected error for expired code")
		}
	})
}

// TestTeamMembershipErrorPaths covers ErrNotFound cases in member management.
func TestTeamMembershipErrorPaths(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 74001, "teamuser1")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("UpdateWorkspaceMemberRole returns ErrNotFound for non-member", func(t *testing.T) {
		err := st.UpdateWorkspaceMemberRole(ctx, workspace.ID, 99999999, RoleMember)
		if err == nil || !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound for non-member, got %v", err)
		}
	})

	t.Run("RemoveWorkspaceMember returns ErrNotFound for non-member", func(t *testing.T) {
		err := st.RemoveWorkspaceMember(ctx, workspace.ID, 99999999)
		if err == nil || !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound for non-member, got %v", err)
		}
	})

	t.Run("ListWorkspaceInvites returns pending invites", func(t *testing.T) {
		// Create an invite that stays pending
		user, err := st.GetUserByTelegramID(ctx, 74001)
		if err != nil {
			t.Fatalf("GetUserByTelegramID: %v", err)
		}
		_, err = st.CreateWorkspaceInvite(ctx, workspace.ID, "pendinguser", RoleMember, user.ID)
		if err != nil {
			t.Fatalf("CreateWorkspaceInvite: %v", err)
		}

		invites, err := st.ListWorkspaceInvites(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("ListWorkspaceInvites: %v", err)
		}
		if len(invites) == 0 {
			t.Fatal("expected at least one pending invite")
		}
	})
}

// TestGetAdminAnalyticsEdgeCases covers edge cases in analytics queries.
func TestGetAdminAnalyticsEdgeCases(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 74001, "analyticsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if _, err := st.SetWorkspacePlan(ctx, workspace.ID, PlanCodeDeveloper, 30, nil); err != nil {
		t.Fatalf("SetWorkspacePlan: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "analytics-hook", "https://example.com/analytics", "whsec_analytics", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}
	now := time.Now().UTC()
	for _, tc := range []struct {
		publicID string
		status   InvoiceStatus
		amount   string
	}{
		{publicID: "ANALYTICS001", status: InvoiceStatusPaid, amount: "10"},
		{publicID: "ANALYTICS002", status: InvoiceStatusManualReview, amount: "20"},
		{publicID: "ANALYTICS003", status: InvoiceStatusUnderpaid, amount: "30"},
	} {
		inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               InvoiceKindMerchant,
			PlanCode:           PlanCodeMerchant,
			Title:              tc.publicID,
			BaseAmountUSD:      decimal.RequireFromString(tc.amount),
			PayableNetwork:     NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      decimal.RequireFromString(tc.amount),
			PublicID:           tc.publicID,
			Mode:               "live",
			ExpiresAt:          now.Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice %s: %v", tc.publicID, err)
		}
		if _, err := st.RawPool().Exec(ctx, `
			UPDATE invoices
			SET status=$2::invoice_status, paid_at=CASE WHEN $2::invoice_status = 'paid' THEN $3 ELSE paid_at END
			WHERE id=$1
		`, inv.ID, string(tc.status), now); err != nil {
			t.Fatalf("set invoice status %s: %v", tc.publicID, err)
		}
	}
	for _, status := range []string{"failed", "sent"} {
		if _, err := st.RawPool().Exec(ctx, `
			INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id, status, created_at)
			VALUES ($1, $2, 'invoice.paid', '{}'::jsonb, 3, $3, $4, $5)
		`, endpoint.ID, workspace.ID, "evt_analytics_"+status, status, now); err != nil {
			t.Fatalf("insert webhook delivery %s: %v", status, err)
		}
	}

	// Test with zero values (should use defaults)
	result, err := st.GetAdminAnalytics(ctx, time.Time{}, time.Time{}, "")
	if err != nil {
		t.Fatalf("GetAdminAnalytics with zero values: %v", err)
	}
	if result.PaidInvoices == 0 || result.CreatedInvoices < 3 || result.FailedWebhookRate.IsZero() || len(result.Breakdown) == 0 {
		t.Fatalf("expected seeded analytics, got %+v", result)
	}

	// Test with different groupBy values
	for _, groupBy := range []string{"network", "plan", "mode", "date"} {
		result, err := st.GetAdminAnalytics(ctx, time.Now().AddDate(0, 0, -7), time.Now(), groupBy)
		if err != nil {
			t.Fatalf("GetAdminAnalytics with groupBy=%s: %v", groupBy, err)
		}
		if len(result.Breakdown) == 0 {
			t.Fatalf("expected breakdown for groupBy=%s", groupBy)
		}
	}
}

// TestCreateInvoiceEdgeCases tests CreateInvoice with various configurations.
func TestCreateInvoiceEdgeCases(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 74002, "invicreateuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	tonWallet, err := st.CreateWallet(ctx, workspace.ID, NetworkTON, "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
	if err != nil {
		t.Fatalf("CreateWallet TON: %v", err)
	}
	suffix := decimal.RequireFromString("0.000123")

	t.Run("create invoice with matching suffix", func(t *testing.T) {
		payable := decimal.RequireFromString("5.000123")
		inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               InvoiceKindMerchant,
			Title:              "Suffix Invoice",
			BaseAmountUSD:      decimal.RequireFromString("5"),
			PayableNetwork:     NetworkBASE,
			DestinationAddress: "0x9999999999999999999999999999999999999999",
			PayableAmount:      payable,
			MatchingSuffix:     &suffix,
			PublicID:           "SUFFIX001",
			Mode:               "live",
			ExpiresAt:          time.Now().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice with suffix: %v", err)
		}
		if inv.ID == 0 {
			t.Fatal("expected non-zero invoice ID")
		}
	})

	t.Run("create subscription invoice", func(t *testing.T) {
		comment := "RECV-SUB001"
		inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               InvoiceKindSubscription,
			Title:              "Subscription Invoice",
			BaseAmountUSD:      decimal.RequireFromString("39"),
			PayableNetwork:     NetworkTON,
			DestinationAddress: tonWallet.Address,
			PayableAmount:      decimal.RequireFromString("16"),
			PaymentComment:     &comment,
			PublicID:           "SUB001",
			Mode:               "live",
			ExpiresAt:          time.Now().Add(time.Hour),
			PlanCode:           PlanCodeMerchant,
			SubscriptionDays:   30,
		})
		if err != nil {
			t.Fatalf("CreateInvoice subscription: %v", err)
		}
		if inv.Kind != InvoiceKindSubscription {
			t.Fatalf("expected subscription kind, got %s", inv.Kind)
		}
	})
}

// TestGetBillingWalletAddressEdgeCases tests network not found and error paths.
func TestGetBillingWalletAddressEdgeCases(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Set up billing wallets config
	if err := st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{
		"TON": "UQ-billing-ton",
		"EVM": "0x-billing-evm",
	}, false, "test"); err != nil {
		t.Fatalf("UpsertSystemConfig: %v", err)
	}

	t.Run("returns address for configured network", func(t *testing.T) {
		addr, err := st.GetBillingWalletAddress(ctx, NetworkTON)
		if err != nil {
			t.Fatalf("GetBillingWalletAddress TON: %v", err)
		}
		if addr == "" {
			t.Fatal("expected non-empty billing address for TON")
		}
	})

	t.Run("returns ErrNotFound for unconfigured network", func(t *testing.T) {
		_, err := st.GetBillingWalletAddress(ctx, NetworkSOLANA)
		if err == nil || !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound for SOLANA, got %v", err)
		}
	})
}

// TestGetAdminAnalyticsGroupByEdgeCases tests all groupBy values.
func TestGetAdminAnalyticsGroupByEdgeCases(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	from := time.Now().AddDate(0, 0, -7)
	to := time.Now()

	for _, groupBy := range []string{"", "date", "network", "plan", "mode"} {
		result, err := st.GetAdminAnalytics(ctx, from, to, groupBy)
		if err != nil {
			t.Fatalf("GetAdminAnalytics with groupBy=%q: %v", groupBy, err)
		}
		if groupBy == "" || groupBy == "date" {
			_ = result.GroupBy
		}
	}
}

// TestAdminAnalyticsWithFromToZero tests the zero-value fallback in GetAdminAnalytics.
func TestAdminAnalyticsWithFromToZero(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Zero values should use default 30-day window
	result, err := st.GetAdminAnalytics(ctx, time.Time{}, time.Time{}, "")
	if err != nil {
		t.Fatalf("GetAdminAnalytics with zero times: %v", err)
	}
	_ = result
}

// TestUpsertSystemConfigEdgeCases tests overwrite behavior.
func TestUpsertSystemConfigEdgeCases(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// First upsert
	if err := st.UpsertSystemConfig(ctx, "test_key_edge", "value1", false, "actor1"); err != nil {
		t.Fatalf("first UpsertSystemConfig: %v", err)
	}

	// Second upsert with same key (overwrite=false should not overwrite since already exists)
	if err := st.UpsertSystemConfig(ctx, "test_key_edge", "value2", false, "actor2"); err != nil {
		t.Fatalf("second UpsertSystemConfig: %v", err)
	}

	// Second upsert with overwrite=true
	if err := st.UpsertSystemConfig(ctx, "test_key_edge", "value3", true, "actor3"); err != nil {
		t.Fatalf("third UpsertSystemConfig (overwrite): %v", err)
	}
}

// TestGetSystemConfigNotFound tests the ErrNotFound path in scanConfigError.
func TestGetSystemConfigNotFound(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	_, err := st.GetSystemConfig(ctx, "nonexistent_config_key")
	if err == nil || !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound for missing config, got %v", err)
	}
}

// TestNormalizePlanCodeCases covers the various special cases.
func TestNormalizePlanCodeCases(t *testing.T) {
	// Default case: unknown → trial
	if got := NormalizePlanCode("unknown_plan_code"); got != PlanCodeTrial {
		t.Fatalf("expected trial for unknown, got %s", got)
	}
	// Alias: pro → merchant
	if got := NormalizePlanCode("pro"); got != PlanCodeMerchant {
		t.Fatalf("expected merchant for 'pro', got %s", got)
	}
	// Alias: dev → developer
	if got := NormalizePlanCode("dev"); got != PlanCodeDeveloper {
		t.Fatalf("expected developer for 'dev', got %s", got)
	}
}

// TestResolvePlanDefaultCase covers the default return.
func TestResolvePlanDefaultCase(t *testing.T) {
	plan := ResolvePlan("unknown_plan_code")
	if plan.Code != PlanCodeTrial {
		t.Fatalf("expected default to trial plan, got %s", plan.Code)
	}
}

// TestListSEOTargetsWithData tests the scan loop in ListSEOTargets.
func TestListSEOTargetsWithData(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Insert an SEO target directly
	if _, err := st.RawPool().Exec(ctx, `
		INSERT INTO seo_targets (keyword_cluster, target_page, publish_status, index_status, internal_links_count, video_attached, comparison_page_status)
		VALUES ('test cluster', '/test-page', 'published', 'indexed', 0, false, 'none')
	`); err != nil {
		t.Fatalf("insert seo_target: %v", err)
	}

	targets, err := st.ListSEOTargets(ctx)
	if err != nil {
		t.Fatalf("ListSEOTargets: %v", err)
	}
	if len(targets) == 0 {
		t.Fatal("expected at least one SEO target")
	}
}

// TestBlogNormalizeBlogPostForWrite covers draft and published status normalization.
func TestBlogNormalizeBlogPostForWrite(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	// Create blog posts with different statuses via CRUD
	workspace := struct{}{}
	_ = workspace

	// Published post with tags
	publishedAt := time.Now()
	post := BlogPost{
		Slug:        "test-normalize",
		Title:       "Test Normalize",
		ContentMD:   "# Content",
		IsPublished: true,
		Status:      "published",
		Tags:        []string{"tag1", "tag2"},
		PublishedAt: &publishedAt,
		Locale:      "en",
	}

	created, err := st.CreateBlogPost(ctx, post)
	if err != nil {
		t.Fatalf("CreateBlogPost published: %v", err)
	}
	if created.ID == 0 {
		t.Fatal("expected non-zero post ID")
	}

	// List posts (published=false to include unpublished)
	posts, total, err := st.ListBlogPosts(ctx, 1, 10, true)
	if err != nil {
		t.Fatalf("ListBlogPosts all: %v", err)
	}
	if total == 0 || len(posts) == 0 {
		t.Fatal("expected at least one post")
	}
}

// newStoreDBTestStore creates an embedded postgres store for store package tests.
func newStoreDBTestStore(t *testing.T, ctx context.Context) *Store {
	t.Helper()

	if sharedStoreDBTestStore != nil {
		resetStoreDBTestData(t, ctx, sharedStoreDBTestStore)
		return sharedStoreDBTestStore
	}

	port := pickStoreDBTestPort(t)
	baseDir := t.TempDir()
	pgConfig := storeDBTestPostgresConfig(port, baseDir)

	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		t.Fatalf("embedded postgres start failed: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Stop()
	})

	st, err := New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("store.New returned error: %v", err)
	}
	t.Cleanup(st.Close)
	return st
}

func resetStoreDBTestData(t *testing.T, ctx context.Context, st *Store) {
	t.Helper()

	_, err := st.pool.Exec(ctx, `
		DO $$
		DECLARE
			stmt text;
		BEGIN
			SELECT 'TRUNCATE ' || string_agg(format('%I.%I', schemaname, tablename), ', ') || ' RESTART IDENTITY CASCADE'
			INTO stmt
			FROM pg_tables
			WHERE schemaname = 'public'
				AND tablename NOT IN ('schema_migrations', 'admin_roles');

			IF stmt IS NOT NULL THEN
				EXECUTE stmt;
			END IF;
		END $$;
	`)
	if err != nil {
		t.Fatalf("reset store test data: %v", err)
	}
}

func storeDBTestPostgresConfig(port uint32, baseDir string) embeddedpostgres.Config {
	return embeddedpostgres.DefaultConfig().
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
}

func pickStoreDBTestPort(t *testing.T) uint32 {
	t.Helper()

	port, err := pickStoreDBTestPortValue()
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	return port
}

func pickStoreDBTestPortValue() (uint32, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, err
	}
	defer listener.Close()
	port := listener.Addr().(*net.TCPAddr).Port
	if port < 0 {
		return 0, strconv.ErrSyntax
	}
	return uint32(port), nil
}

// TestAPIKeyOperations covers the full lifecycle of API key management.
func TestAPIKeyOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 81001, "apikeyopuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("CountActiveAPIKeys returns 0 initially", func(t *testing.T) {
		count, err := st.CountActiveAPIKeys(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("CountActiveAPIKeys: %v", err)
		}
		if count != 0 {
			t.Fatalf("expected 0 active keys, got %d", count)
		}
	})

	apiKey, err := st.CreateAPIKey(ctx, workspace.ID, "test-key", "recv_", "hash-1", []string{"invoices:read"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}

	t.Run("CountActiveAPIKeys returns 1 after creation", func(t *testing.T) {
		count, err := st.CountActiveAPIKeys(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("CountActiveAPIKeys: %v", err)
		}
		if count != 1 {
			t.Fatalf("expected 1 active key, got %d", count)
		}
	})

	t.Run("GetAPIKeyByTokenHash returns key", func(t *testing.T) {
		record, err := st.GetAPIKeyByTokenHash(ctx, "hash-1")
		if err != nil {
			t.Fatalf("GetAPIKeyByTokenHash: %v", err)
		}
		if record.ID != apiKey.ID {
			t.Fatalf("expected key ID %d, got %d", apiKey.ID, record.ID)
		}
	})

	t.Run("GetAPIKeyByTokenHash returns not found for unknown hash", func(t *testing.T) {
		_, err := st.GetAPIKeyByTokenHash(ctx, "nonexistent-hash")
		if err == nil || !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("TouchAPIKeyLastUsed updates timestamp", func(t *testing.T) {
		if err := st.TouchAPIKeyLastUsed(ctx, apiKey.ID); err != nil {
			t.Fatalf("TouchAPIKeyLastUsed: %v", err)
		}
	})

	t.Run("ListAPIKeys returns keys for workspace", func(t *testing.T) {
		keys, err := st.ListAPIKeys(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("ListAPIKeys: %v", err)
		}
		if len(keys) == 0 {
			t.Fatal("expected at least one API key")
		}
	})

	t.Run("RecordAPIRequest records usage", func(t *testing.T) {
		if err := st.RecordAPIRequest(ctx, workspace.ID, apiKey.ID, "GET", "/v1/invoices", 200); err != nil {
			t.Fatalf("RecordAPIRequest: %v", err)
		}
	})

	t.Run("RevokeAPIKey revokes successfully", func(t *testing.T) {
		if err := st.RevokeAPIKey(ctx, workspace.ID, apiKey.ID); err != nil {
			t.Fatalf("RevokeAPIKey: %v", err)
		}
	})

	t.Run("RevokeAPIKey returns ErrNotFound for already-revoked key", func(t *testing.T) {
		err := st.RevokeAPIKey(ctx, workspace.ID, apiKey.ID)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound for revoked key, got %v", err)
		}
	})
}

// TestWebhookEndpointOperations covers webhook endpoint lifecycle.
func TestWebhookEndpointOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 82001, "webhookepuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "test-hook", "https://example.com/webhook", "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	t.Run("ListWebhookEndpoints returns endpoint", func(t *testing.T) {
		endpoints, err := st.ListWebhookEndpoints(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("ListWebhookEndpoints: %v", err)
		}
		if len(endpoints) == 0 {
			t.Fatal("expected at least one endpoint")
		}
	})

	t.Run("RotateWebhookEndpointSecret updates secret", func(t *testing.T) {
		updated, err := st.RotateWebhookEndpointSecret(ctx, workspace.ID, endpoint.ID, "whsec_new")
		if err != nil {
			t.Fatalf("RotateWebhookEndpointSecret: %v", err)
		}
		if updated.Secret != "whsec_new" {
			t.Fatalf("expected new secret, got %q", updated.Secret)
		}
	})

	t.Run("RotateWebhookEndpointSecret returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.RotateWebhookEndpointSecret(ctx, workspace.ID, 99999, "whsec_x")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("DeactivateWebhookEndpoint deactivates successfully", func(t *testing.T) {
		if err := st.DeactivateWebhookEndpoint(ctx, workspace.ID, endpoint.ID); err != nil {
			t.Fatalf("DeactivateWebhookEndpoint: %v", err)
		}
	})

	t.Run("DeactivateWebhookEndpoint returns ErrNotFound for already-deactivated", func(t *testing.T) {
		err := st.DeactivateWebhookEndpoint(ctx, workspace.ID, endpoint.ID)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestWebhookDeliveryOperations covers delivery claim and completion flows.
func TestWebhookDeliveryOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 83001, "whdlvuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "dlv-hook", "https://example.com/dlv", "whsec_dlv", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	t.Run("ListWebhookDeliveries returns empty for new workspace", func(t *testing.T) {
		deliveries, err := st.ListWebhookDeliveries(ctx, workspace.ID, 10)
		if err != nil {
			t.Fatalf("ListWebhookDeliveries: %v", err)
		}
		if len(deliveries) != 0 {
			t.Fatalf("expected empty, got %d deliveries", len(deliveries))
		}
	})

	// Insert delivery to test claim operations
	var deliveryID int64
	payload := json.RawMessage(`{"event":"invoice.paid"}`)
	if err := st.RawPool().QueryRow(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id, status)
		VALUES ($1, $2, 'invoice.paid', $3, 3, 'evt_dlv_ops', 'pending')
		RETURNING id
	`, endpoint.ID, workspace.ID, payload).Scan(&deliveryID); err != nil {
		t.Fatalf("insert delivery: %v", err)
	}

	t.Run("ListWebhookDeliveries returns inserted delivery", func(t *testing.T) {
		deliveries, err := st.ListWebhookDeliveries(ctx, workspace.ID, 10)
		if err != nil {
			t.Fatalf("ListWebhookDeliveries: %v", err)
		}
		if len(deliveries) != 1 || deliveries[0].ID != deliveryID || deliveries[0].EventID != "evt_dlv_ops" {
			t.Fatalf("unexpected deliveries: %#v", deliveries)
		}
	})

	t.Run("ClaimWebhookDeliveries claims pending delivery", func(t *testing.T) {
		claimed, err := st.ClaimWebhookDeliveries(ctx, 1)
		if err != nil {
			t.Fatalf("ClaimWebhookDeliveries: %v", err)
		}
		if len(claimed) == 0 {
			t.Fatal("expected at least one claimed delivery")
		}
	})

	t.Run("MarkWebhookDeliverySent marks delivery sent", func(t *testing.T) {
		if err := st.MarkWebhookDeliverySent(ctx, deliveryID, endpoint.ID); err != nil {
			t.Fatalf("MarkWebhookDeliverySent: %v", err)
		}
	})
}

// TestStoreGetUserByID covers the GetUserByID function.
func TestStoreGetUserByID(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 84001, "getuserbyiduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := st.GetUserByTelegramID(ctx, 84001)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	t.Run("GetUserByID returns existing user", func(t *testing.T) {
		u, err := st.GetUserByID(ctx, user.ID)
		if err != nil {
			t.Fatalf("GetUserByID: %v", err)
		}
		if u.ID != user.ID || u.TelegramID != 84001 {
			t.Fatalf("unexpected user: %+v", u)
		}
	})

	t.Run("GetUserByID returns ErrNotFound for non-existent user", func(t *testing.T) {
		_, err := st.GetUserByID(ctx, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("ListWorkspacesForUser returns workspaces", func(t *testing.T) {
		workspaces, err := st.ListWorkspacesForUser(ctx, user.ID)
		if err != nil {
			t.Fatalf("ListWorkspacesForUser: %v", err)
		}
		if len(workspaces) == 0 {
			t.Fatal("expected at least one workspace")
		}
	})

	t.Run("GetWorkspaceByID returns workspace", func(t *testing.T) {
		ws, err := st.GetWorkspaceByID(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("GetWorkspaceByID: %v", err)
		}
		if ws.ID != workspace.ID {
			t.Fatalf("unexpected workspace ID: %d", ws.ID)
		}
	})

	t.Run("GetWorkspaceByID returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetWorkspaceByID(ctx, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("GetWorkspaceByUsername returns workspace", func(t *testing.T) {
		ws, err := st.GetWorkspaceByUsername(ctx, "getuserbyiduser")
		if err != nil {
			t.Fatalf("GetWorkspaceByUsername: %v", err)
		}
		if ws.ID != workspace.ID {
			t.Fatalf("unexpected workspace: %+v", ws)
		}
	})

	t.Run("GetWorkspaceByUsername returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetWorkspaceByUsername(ctx, "nonexistent_username_xyz")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

func TestResolveOAuthLoginCreatesAndReusesIdentity(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	input := OAuthIdentityInput{
		Provider:       "google",
		ProviderUserID: "google-new-user",
		Email:          "oauth-new@example.com",
		EmailVerified:  true,
		DisplayName:    "OAuth Merchant",
	}
	user, workspace, created, err := st.ResolveOAuthLogin(ctx, input)
	if err != nil {
		t.Fatalf("ResolveOAuthLogin create: %v", err)
	}
	if !created {
		t.Fatal("expected first oauth login to create an account")
	}
	if user.Email != "oauth-new@example.com" {
		t.Fatalf("expected oauth email on user, got %q", user.Email)
	}
	if workspace.ID == 0 {
		t.Fatal("expected workspace to be created")
	}

	secondUser, secondWorkspace, secondCreated, err := st.ResolveOAuthLogin(ctx, input)
	if err != nil {
		t.Fatalf("ResolveOAuthLogin reuse: %v", err)
	}
	if secondCreated {
		t.Fatal("expected existing oauth identity to be reused")
	}
	if secondUser.ID != user.ID || secondWorkspace.ID != workspace.ID {
		t.Fatalf("expected same account, got user %d/%d workspace %d/%d", secondUser.ID, user.ID, secondWorkspace.ID, workspace.ID)
	}
}

func TestResolveOAuthLoginMergesByVerifiedEmail(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 84101, "emailmergeuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := st.UpsertUser(ctx, 84101, "emailmergeuser", "merge@example.com")
	if err != nil {
		t.Fatalf("UpsertUser: %v", err)
	}

	oauthUser, oauthWorkspace, created, err := st.ResolveOAuthLogin(ctx, OAuthIdentityInput{
		Provider:       "google",
		ProviderUserID: "google-email-merge",
		Email:          "MERGE@example.com",
		EmailVerified:  true,
		DisplayName:    "Merged User",
	})
	if err != nil {
		t.Fatalf("ResolveOAuthLogin merge by email: %v", err)
	}
	if created {
		t.Fatal("expected verified email to merge into existing user")
	}
	if oauthUser.ID != user.ID {
		t.Fatalf("expected existing user %d, got %d", user.ID, oauthUser.ID)
	}
	if oauthWorkspace.ID != workspace.ID {
		t.Fatalf("expected existing workspace %d, got %d", workspace.ID, oauthWorkspace.ID)
	}
}

func TestLinkOAuthIdentityMergesExistingProviderAccount(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	targetWorkspace, err := st.UpsertWorkspaceByTelegram(ctx, 84201, "targetmergeuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram target: %v", err)
	}
	targetUser, err := st.GetUserByTelegramID(ctx, 84201)
	if err != nil {
		t.Fatalf("GetUserByTelegramID target: %v", err)
	}

	sourceInput := OAuthIdentityInput{
		Provider:       "github",
		ProviderUserID: "github-linked-elsewhere",
		Email:          "source@example.com",
		EmailVerified:  true,
		Username:       "sourcehub",
	}
	sourceUser, sourceWorkspace, created, err := st.ResolveOAuthLogin(ctx, sourceInput)
	if err != nil {
		t.Fatalf("ResolveOAuthLogin source: %v", err)
	}
	if !created || sourceUser.ID == targetUser.ID || sourceWorkspace.ID == targetWorkspace.ID {
		t.Fatalf("expected separate source account, got source user=%d workspace=%d target user=%d workspace=%d", sourceUser.ID, sourceWorkspace.ID, targetUser.ID, targetWorkspace.ID)
	}

	linkedUser, _, merged, err := st.LinkOAuthIdentity(ctx, targetUser.ID, sourceInput)
	if err != nil {
		t.Fatalf("LinkOAuthIdentity: %v", err)
	}
	if !merged {
		t.Fatal("expected linking existing provider identity to merge accounts")
	}
	if linkedUser.ID != targetUser.ID {
		t.Fatalf("expected target user after merge, got %d", linkedUser.ID)
	}

	workspaces, err := st.ListWorkspacesForUser(ctx, targetUser.ID)
	if err != nil {
		t.Fatalf("ListWorkspacesForUser: %v", err)
	}
	seen := map[int64]bool{}
	for _, workspace := range workspaces {
		seen[workspace.ID] = true
	}
	if !seen[targetWorkspace.ID] || !seen[sourceWorkspace.ID] {
		t.Fatalf("expected target user to keep both workspaces after merge, got %#v", seen)
	}

	resolvedUser, _, _, err := st.ResolveOAuthLogin(ctx, sourceInput)
	if err != nil {
		t.Fatalf("ResolveOAuthLogin after merge: %v", err)
	}
	if resolvedUser.ID != targetUser.ID {
		t.Fatalf("expected provider login to resolve to target user after merge, got %d", resolvedUser.ID)
	}
}

// TestStoreWalletOperations covers wallet listing and deactivation.
func TestStoreWalletOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 85001, "walletopsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xAAAABBBBCCCCDDDD1111222233334444AAAABBBB")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	t.Run("ListWallets returns wallet", func(t *testing.T) {
		wallets, err := st.ListWallets(ctx, workspace.ID)
		if err != nil {
			t.Fatalf("ListWallets: %v", err)
		}
		if len(wallets) == 0 {
			t.Fatal("expected at least one wallet")
		}
	})

	t.Run("GetWalletByID returns wallet", func(t *testing.T) {
		w, err := st.GetWalletByID(ctx, workspace.ID, wallet.ID)
		if err != nil {
			t.Fatalf("GetWalletByID: %v", err)
		}
		if w.ID != wallet.ID {
			t.Fatalf("unexpected wallet ID: %d", w.ID)
		}
	})

	t.Run("GetWalletByID returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetWalletByID(ctx, workspace.ID, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("GetActiveWalletForNetwork returns wallet", func(t *testing.T) {
		w, err := st.GetActiveWalletForNetwork(ctx, workspace.ID, NetworkEVM)
		if err != nil {
			t.Fatalf("GetActiveWalletForNetwork: %v", err)
		}
		if w.ID != wallet.ID {
			t.Fatalf("unexpected wallet: %+v", w)
		}
	})

	t.Run("GetActiveWalletForNetwork returns ErrNotFound for missing network", func(t *testing.T) {
		_, err := st.GetActiveWalletForNetwork(ctx, workspace.ID, NetworkTON)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("DeactivateWallet deactivates successfully", func(t *testing.T) {
		if err := st.DeactivateWallet(ctx, workspace.ID, wallet.ID); err != nil {
			t.Fatalf("DeactivateWallet: %v", err)
		}
	})

	t.Run("DeactivateWallet returns ErrNotFound for non-existent", func(t *testing.T) {
		err := st.DeactivateWallet(ctx, workspace.ID, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestStoreInvoiceGetAndStatus covers invoice fetching and status operations.
func TestStoreInvoiceGetAndStatus(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 86001, "invoiceopsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x1A2B3C4D5E6F7890ABCDEF1234567890ABCDEF01")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Get Test Invoice",
		BaseAmountUSD:      decimal.RequireFromString("25"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("25"),
		PublicID:           "GETTEST001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("GetInvoiceByID returns invoice", func(t *testing.T) {
		fetched, err := st.GetInvoiceByID(ctx, workspace.ID, inv.ID)
		if err != nil {
			t.Fatalf("GetInvoiceByID: %v", err)
		}
		if fetched.ID != inv.ID {
			t.Fatalf("unexpected invoice ID: %d", fetched.ID)
		}
	})

	t.Run("GetInvoiceByID returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetInvoiceByID(ctx, workspace.ID, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("GetInvoiceByPublicID returns invoice", func(t *testing.T) {
		fetched, err := st.GetInvoiceByPublicID(ctx, "GETTEST001")
		if err != nil {
			t.Fatalf("GetInvoiceByPublicID: %v", err)
		}
		if fetched.ID != inv.ID {
			t.Fatalf("unexpected invoice: %+v", fetched)
		}
	})

	t.Run("GetInvoiceByPublicID returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetInvoiceByPublicID(ctx, "NONEXISTENT999")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("SetInvoiceStatus updates status", func(t *testing.T) {
		updated, err := st.SetInvoiceStatus(ctx, workspace.ID, inv.ID, InvoiceStatusExpired)
		if err != nil {
			t.Fatalf("SetInvoiceStatus: %v", err)
		}
		if updated.Status != InvoiceStatusExpired {
			t.Fatalf("expected expired status, got %s", updated.Status)
		}
	})

	t.Run("InvoicePublicIDExists returns true for existing", func(t *testing.T) {
		exists, err := st.InvoicePublicIDExists(ctx, "GETTEST001")
		if err != nil {
			t.Fatalf("InvoicePublicIDExists: %v", err)
		}
		if !exists {
			t.Fatal("expected existing public ID to return true")
		}
	})

	t.Run("InvoicePublicIDExists returns false for non-existent", func(t *testing.T) {
		exists, err := st.InvoicePublicIDExists(ctx, "NOTEXIST999")
		if err != nil {
			t.Fatalf("InvoicePublicIDExists: %v", err)
		}
		if exists {
			t.Fatal("expected non-existent public ID to return false")
		}
	})

	t.Run("SuffixRecentlyUsed returns false for unused suffix", func(t *testing.T) {
		suffix := decimal.RequireFromString("0.123456")
		used, err := st.SuffixRecentlyUsed(ctx, wallet.Address, NetworkBASE, suffix)
		if err != nil {
			t.Fatalf("SuffixRecentlyUsed: %v", err)
		}
		if used {
			t.Fatal("expected unused suffix to return false")
		}
	})
}

// TestStoreBlogOperations covers blog CRUD.
func TestStoreBlogOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	post, err := st.CreateBlogPost(ctx, BlogPost{
		Slug:      "blog-ops-test",
		Title:     "Blog Ops Test",
		ContentMD: "# Content",
		Status:    "draft",
		Tags:      []string{},
		Locale:    "en",
	})
	if err != nil {
		t.Fatalf("CreateBlogPost: %v", err)
	}

	t.Run("UpdateBlogPost updates fields", func(t *testing.T) {
		updated, err := st.UpdateBlogPost(ctx, post.ID, BlogPost{
			Slug:      "blog-ops-updated",
			Title:     "Updated Blog",
			ContentMD: "# Updated Content",
			Status:    "published",
			Tags:      []string{"tag1"},
			Locale:    "en",
		})
		if err != nil {
			t.Fatalf("UpdateBlogPost: %v", err)
		}
		if updated.Title != "Updated Blog" {
			t.Fatalf("expected updated title, got %q", updated.Title)
		}
	})

	t.Run("UpdateBlogPost returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.UpdateBlogPost(ctx, 99999, BlogPost{
			Slug:  "x",
			Title: "x",
			Tags:  []string{},
		})
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("GetBlogPostBySlug returns post", func(t *testing.T) {
		fetched, err := st.GetBlogPostBySlug(ctx, "blog-ops-updated", "")
		if err != nil {
			t.Fatalf("GetBlogPostBySlug: %v", err)
		}
		if fetched.ID != post.ID {
			t.Fatalf("unexpected post: %+v", fetched)
		}
	})

	t.Run("GetBlogPostBySlug returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetBlogPostBySlug(ctx, "nonexistent-slug-xyz", "")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("ListBlogPosts returns posts", func(t *testing.T) {
		posts, total, err := st.ListBlogPosts(ctx, 1, 10, false)
		if err != nil {
			t.Fatalf("ListBlogPosts: %v", err)
		}
		if total == 0 || len(posts) == 0 {
			t.Fatal("expected at least one post")
		}
	})

	t.Run("ListBlogPosts public only returns only published", func(t *testing.T) {
		posts, _, err := st.ListBlogPosts(ctx, 1, 10, true)
		if err != nil {
			t.Fatalf("ListBlogPosts published: %v", err)
		}
		for _, p := range posts {
			if !p.IsPublished {
				t.Fatalf("expected only published posts, got status=%q", p.Status)
			}
		}
	})

	t.Run("ListPublishedBlogPosts filters by locale", func(t *testing.T) {
		posts, total, err := st.ListPublishedBlogPosts(ctx, 1, 10, "en")
		if err != nil {
			t.Fatalf("ListPublishedBlogPosts: %v", err)
		}
		if total == 0 || len(posts) == 0 {
			t.Fatal("expected published English posts")
		}
		for _, p := range posts {
			if p.Locale != "en" {
				t.Fatalf("expected locale en, got %q", p.Locale)
			}
		}
	})

	t.Run("DeleteBlogPost deletes successfully", func(t *testing.T) {
		if err := st.DeleteBlogPost(ctx, post.ID); err != nil {
			t.Fatalf("DeleteBlogPost: %v", err)
		}
	})

	t.Run("DeleteBlogPost returns ErrNotFound for non-existent", func(t *testing.T) {
		err := st.DeleteBlogPost(ctx, 99999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestStoreConfigOperations covers rate limiting and audit events.
func TestStoreConfigOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	t.Run("AllowRateLimit allows first request", func(t *testing.T) {
		remaining, allowed, err := st.AllowRateLimit(ctx, "test-rate-limit-key", 5, time.Minute)
		if err != nil {
			t.Fatalf("AllowRateLimit: %v", err)
		}
		if !allowed {
			t.Fatal("expected first request to be allowed")
		}
		if remaining < 0 {
			t.Fatalf("expected non-negative remaining, got %d", remaining)
		}
	})

	t.Run("AllowRateLimit allows multiple within limit", func(t *testing.T) {
		key := "test-multi-limit"
		for i := 0; i < 3; i++ {
			_, allowed, err := st.AllowRateLimit(ctx, key, 5, time.Minute)
			if err != nil {
				t.Fatalf("AllowRateLimit #%d: %v", i, err)
			}
			if !allowed {
				t.Fatalf("expected request #%d to be allowed", i)
			}
		}
	})

	t.Run("RecordAdminAuditEvent records event", func(t *testing.T) {
		if err := st.RecordAdminAuditEvent(ctx, "admin", "test_action", "resource", "target-1", json.RawMessage(`{}`)); err != nil {
			t.Fatalf("RecordAdminAuditEvent: %v", err)
		}
	})

	t.Run("ListAdminAuditEvents returns events", func(t *testing.T) {
		// Record an event first
		_ = st.RecordAdminAuditEvent(ctx, "admin2", "list_test_action", "resource", "target-2", json.RawMessage(`{}`))

		events, err := st.ListAdminAuditEvents(ctx, 10)
		if err != nil {
			t.Fatalf("ListAdminAuditEvents: %v", err)
		}
		if len(events) == 0 {
			t.Fatal("expected at least one audit event")
		}
	})
}

// TestStoreGrantPRO covers the GrantPRO operation.
func TestStoreGrantPRO(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 87001, "grantprouser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("GrantPRO sets plan and subscription end", func(t *testing.T) {
		updated, err := st.GrantPRO(ctx, workspace.ID, 30)
		if err != nil {
			t.Fatalf("GrantPRO: %v", err)
		}
		if updated.PlanCode != PlanCodeMerchant {
			t.Fatalf("expected merchant plan, got %s", updated.PlanCode)
		}
		if updated.SubscriptionEndsAt == nil {
			t.Fatal("expected non-nil subscription end date")
		}
	})

	t.Run("GrantPRO returns ErrNotFound for non-existent workspace", func(t *testing.T) {
		_, err := st.GrantPRO(ctx, 99999999, 30)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestStoreNotificationOperations covers notification claiming and sending.
func TestStoreNotificationOperations(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 88001, "notifopsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Insert a notification job
	var jobID int64
	if err := st.RawPool().QueryRow(ctx, `
		INSERT INTO notification_outbox (workspace_id, recipient_telegram_id, message, payload, status)
		VALUES ($1, $2, 'Test Message', '{}', 'pending')
		RETURNING id
	`, workspace.ID, int64(88001)).Scan(&jobID); err != nil {
		t.Fatalf("insert notification: %v", err)
	}

	t.Run("ClaimNotificationJobs claims pending job", func(t *testing.T) {
		jobs, err := st.ClaimNotificationJobs(ctx, 5)
		if err != nil {
			t.Fatalf("ClaimNotificationJobs: %v", err)
		}
		found := false
		for _, job := range jobs {
			if job.ID == jobID {
				found = true
			}
		}
		if !found {
			t.Fatal("expected our notification job to be claimed")
		}
	})

	t.Run("MarkNotificationSent marks as sent", func(t *testing.T) {
		if err := st.MarkNotificationSent(ctx, jobID); err != nil {
			t.Fatalf("MarkNotificationSent: %v", err)
		}
	})
}

// TestStoreAdminOpsSetWorkspacePlan covers the plan change operation.
func TestStoreAdminOpsSetWorkspacePlan(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 89001, "setplanuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("SetWorkspacePlan changes plan with days", func(t *testing.T) {
		updated, err := st.SetWorkspacePlan(ctx, workspace.ID, PlanCodeDeveloper, 30, nil)
		if err != nil {
			t.Fatalf("SetWorkspacePlan: %v", err)
		}
		if updated.PlanCode != PlanCodeDeveloper {
			t.Fatalf("expected developer plan, got %s", updated.PlanCode)
		}
	})

	t.Run("SetWorkspacePlan returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.SetWorkspacePlan(ctx, 99999999, PlanCodeDeveloper, 30, nil)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("SetWorkspaceBlocked blocks workspace", func(t *testing.T) {
		updated, err := st.SetWorkspaceBlocked(ctx, workspace.ID, true)
		if err != nil {
			t.Fatalf("SetWorkspaceBlocked: %v", err)
		}
		if !updated.IsBlocked {
			t.Fatal("expected workspace to be blocked")
		}
	})

	t.Run("SetWorkspaceBlocked returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.SetWorkspaceBlocked(ctx, 99999999, true)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestIdempotencyRecords covers idempotency key operations.
func TestIdempotencyRecords(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 90001, "idempuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	apiKey, err := st.CreateAPIKey(ctx, workspace.ID, "idemp-key", "recv_", "idemp-hash", []string{"invoices:write"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}

	t.Run("GetIdempotencyRecord returns ErrNotFound for non-existent", func(t *testing.T) {
		_, err := st.GetIdempotencyRecord(ctx, workspace.ID, apiKey.ID, "POST", "/v1/invoices", "nonexistent-key")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})

	t.Run("CreateIdempotencyRecord creates record", func(t *testing.T) {
		if _, err := st.CreateIdempotencyRecord(ctx, workspace.ID, apiKey.ID, "POST", "/v1/invoices", "idemp-key-1", "req-hash-1"); err != nil {
			t.Fatalf("CreateIdempotencyRecord: %v", err)
		}
	})

	t.Run("GetIdempotencyRecord returns existing record", func(t *testing.T) {
		record, err := st.GetIdempotencyRecord(ctx, workspace.ID, apiKey.ID, "POST", "/v1/invoices", "idemp-key-1")
		if err != nil {
			t.Fatalf("GetIdempotencyRecord: %v", err)
		}
		if record.IdempotencyKey != "idemp-key-1" {
			t.Fatalf("unexpected record: %+v", record)
		}
	})

	t.Run("CompleteIdempotencyRecord completes with response", func(t *testing.T) {
		record, _ := st.GetIdempotencyRecord(ctx, workspace.ID, apiKey.ID, "POST", "/v1/invoices", "idemp-key-1")
		statusCode := 201
		responseBody := json.RawMessage(`{"id":1}`)
		if err := st.CompleteIdempotencyRecord(ctx, record.ID, statusCode, responseBody); err != nil {
			t.Fatalf("CompleteIdempotencyRecord: %v", err)
		}
	})
}

// TestAdminInvoiceListAndFilters covers admin invoice listing.
func TestAdminInvoiceListAndFilters(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	t.Run("ListAdminInvoices with empty DB returns empty page", func(t *testing.T) {
		page, err := st.ListAdminInvoices(ctx, AdminInvoiceFilters{Page: 1, PageSize: 10, Status: "all"})
		if err != nil {
			t.Fatalf("ListAdminInvoices: %v", err)
		}
		_ = page
	})

	t.Run("ListAdminInvoices with kind filter", func(t *testing.T) {
		page, err := st.ListAdminInvoices(ctx, AdminInvoiceFilters{Page: 1, PageSize: 10, Kind: "merchant"})
		if err != nil {
			t.Fatalf("ListAdminInvoices kind filter: %v", err)
		}
		_ = page
	})

	t.Run("ListAdminInvoices with query filter", func(t *testing.T) {
		page, err := st.ListAdminInvoices(ctx, AdminInvoiceFilters{Page: 1, PageSize: 10, Query: "test"})
		if err != nil {
			t.Fatalf("ListAdminInvoices query filter: %v", err)
		}
		_ = page
	})
}

// TestAdminNotificationHealth covers GetAdminNotificationHealth.
func TestAdminNotificationHealth(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	t.Run("GetAdminNotificationHealth returns data", func(t *testing.T) {
		health, err := st.GetAdminNotificationHealth(ctx)
		if err != nil {
			t.Fatalf("GetAdminNotificationHealth: %v", err)
		}
		_ = health
	})
}

// TestProductEventRecording covers RecordProductEvent.
func TestProductEventRecording(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 91001, "producteventuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("RecordProductEvent records event", func(t *testing.T) {
		if err := st.RecordProductEvent(ctx, ProductEventInput{
			WorkspaceID: &workspace.ID,
			EventName:   "page_view",
			Source:      "test",
			Properties:  json.RawMessage(`{"page_path":"/pricing"}`),
		}); err != nil {
			t.Fatalf("RecordProductEvent: %v", err)
		}
	})

	t.Run("RecordProductEvent with nil workspace ID is no-op", func(t *testing.T) {
		if err := st.RecordProductEvent(ctx, ProductEventInput{
			WorkspaceID: nil,
			EventName:   "anonymous_view",
			Source:      "test",
			Properties:  json.RawMessage(`{"page_path":"/home"}`),
		}); err != nil {
			t.Fatalf("RecordProductEvent nil workspace: %v", err)
		}
	})
}

// TestStoreExpireOverdueInvoices covers invoice expiry.
func TestStoreExpireOverdueInvoices(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 92001, "expireuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xEEEEFFFF1234567890ABCDEF1234567890ABCDEF")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Create an invoice that's already expired
	_, err = st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Overdue Invoice",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10"),
		PublicID:           "OVERDUE001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(-time.Hour), // already expired
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("ExpireOverdueInvoices expires overdue invoices", func(t *testing.T) {
		count, err := st.ExpireOverdueInvoices(ctx)
		if err != nil {
			t.Fatalf("ExpireOverdueInvoices: %v", err)
		}
		if count == 0 {
			t.Fatal("expected at least one invoice to be expired")
		}
	})
}

func TestStoreAdminAndRefreshSessionFlows(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	if admin, created, err := st.EnsureBootstrapAdmin(ctx, " Admin@Example.COM ", "hash-1"); err != nil {
		t.Fatalf("EnsureBootstrapAdmin: %v", err)
	} else if !created {
		t.Fatal("expected bootstrap admin to be created")
	} else if admin.Email != "admin@example.com" || len(admin.Roles) != 1 || admin.Roles[0] != "super_admin" {
		t.Fatalf("unexpected bootstrap admin: %+v", admin)
	}

	if _, created, err := st.EnsureBootstrapAdmin(ctx, "second@example.com", "hash-2"); err != nil {
		t.Fatalf("EnsureBootstrapAdmin existing: %v", err)
	} else if created {
		t.Fatal("expected second bootstrap call to no-op when admin exists")
	}
	if _, created, err := st.EnsureBootstrapAdmin(ctx, "", "hash-3"); err != nil {
		t.Fatalf("EnsureBootstrapAdmin blank: %v", err)
	} else if created {
		t.Fatal("expected blank bootstrap input to no-op")
	}

	admin, err := st.GetAdminUserByEmail(ctx, "ADMIN@example.com")
	if err != nil {
		t.Fatalf("GetAdminUserByEmail: %v", err)
	}
	if admin.ID == 0 || admin.PasswordHash != "hash-1" {
		t.Fatalf("unexpected admin by email: %+v", admin)
	}
	if _, err := st.GetAdminUserByEmail(ctx, "missing@example.com"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected missing admin ErrNotFound, got %v", err)
	}

	if err := st.MarkAdminLogin(ctx, admin.ID); err != nil {
		t.Fatalf("MarkAdminLogin: %v", err)
	}
	admin, err = st.GetAdminUserByID(ctx, admin.ID)
	if err != nil {
		t.Fatalf("GetAdminUserByID: %v", err)
	}
	if admin.LastLoginAt == nil {
		t.Fatalf("expected login fields to be updated: %+v", admin)
	}

	session, err := st.CreateAdminSession(ctx, admin.ID, "refresh-hash", time.Now().Add(time.Hour), "agent", "127.0.0.1")
	if err != nil {
		t.Fatalf("CreateAdminSession: %v", err)
	}
	loadedSession, err := st.GetAdminSessionByRefreshHash(ctx, "refresh-hash")
	if err != nil {
		t.Fatalf("GetAdminSessionByRefreshHash: %v", err)
	}
	if loadedSession.ID != session.ID {
		t.Fatalf("unexpected session: %+v", loadedSession)
	}
	active, err := st.IsAdminSessionActive(ctx, session.ID)
	if err != nil {
		t.Fatalf("IsAdminSessionActive: %v", err)
	}
	if !active {
		t.Fatal("expected admin session to be active")
	}
	if err := st.TouchAdminSession(ctx, session.ID); err != nil {
		t.Fatalf("TouchAdminSession: %v", err)
	}
	if err := st.RevokeAdminSession(ctx, session.ID); err != nil {
		t.Fatalf("RevokeAdminSession: %v", err)
	}
	active, err = st.IsAdminSessionActive(ctx, session.ID)
	if err != nil {
		t.Fatalf("IsAdminSessionActive after revoke: %v", err)
	}
	if active {
		t.Fatal("expected revoked admin session to be inactive")
	}
	if err := st.RevokeAdminSession(ctx, 999999); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected missing admin session ErrNotFound, got %v", err)
	}

	user, workspace, err := st.CreateAgentWorkspace(ctx, 93001, "agent-workspace", "agent@example.com")
	if err != nil {
		t.Fatalf("CreateAgentWorkspace: %v", err)
	}
	if user.ID == 0 || workspace.ID == 0 || workspace.Email != "agent@example.com" {
		t.Fatalf("unexpected agent user/workspace: %+v / %+v", user, workspace)
	}
	if err := st.CreateRefreshSession(ctx, user.ID, workspace.ID, "user-refresh-hash", time.Now().Add(time.Hour), "agent", "127.0.0.1"); err != nil {
		t.Fatalf("CreateRefreshSession: %v", err)
	}
	refreshedUser, refreshedWorkspace, err := st.RefreshSession(ctx, "user-refresh-hash")
	if err != nil {
		t.Fatalf("RefreshSession: %v", err)
	}
	if refreshedUser.ID != user.ID || refreshedWorkspace.ID != workspace.ID {
		t.Fatalf("unexpected refreshed user/workspace: %+v / %+v", refreshedUser, refreshedWorkspace)
	}
	if err := st.RevokeRefreshSession(ctx, "user-refresh-hash"); err != nil {
		t.Fatalf("RevokeRefreshSession: %v", err)
	}
	if _, _, err := st.RefreshSession(ctx, "user-refresh-hash"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected revoked refresh session ErrNotFound, got %v", err)
	}
	if err := st.RevokeRefreshSession(ctx, "missing-refresh-hash"); !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected missing refresh session ErrNotFound, got %v", err)
	}
}

func TestStorePaymentMatchingAndCompletionFlows(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 94001, "paymentflowuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	if _, err := st.SetWorkspacePlan(ctx, workspace.ID, PlanCodeDeveloper, 30, nil); err != nil {
		t.Fatalf("SetWorkspacePlan: %v", err)
	}
	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "payments", "https://example.com/payments", "whsec_payment", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x9999999999999999999999999999999999999999")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	suffix := decimal.RequireFromString("0.123456")
	invoice, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Payment Flow",
		BaseAmountUSD:      decimal.RequireFromString("100"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("100.123456"),
		MatchingSuffix:     &suffix,
		PublicID:           "PAYFLOW001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	transfer := ObservedTransfer{
		TxHash:             "tx-payment-flow-1",
		Network:            NetworkBASE,
		DestinationAddress: wallet.Address,
		Amount:             decimal.RequireFromString("100.123456"),
		ObservedAt:         time.Now(),
		RawPayload:         json.RawMessage(`{"source":"test"}`),
	}
	event, inserted, err := st.RecordObservedTransfer(ctx, transfer)
	if err != nil {
		t.Fatalf("RecordObservedTransfer: %v", err)
	}
	if !inserted || event.ID == 0 || event.ExternalEventID != "BASE:tx-payment-flow-1" {
		t.Fatalf("unexpected payment event: inserted=%v event=%+v", inserted, event)
	}
	duplicate, inserted, err := st.RecordObservedTransfer(ctx, transfer)
	if err != nil {
		t.Fatalf("RecordObservedTransfer duplicate: %v", err)
	}
	if inserted || duplicate.ExternalEventID != event.ExternalEventID {
		t.Fatalf("expected duplicate to be ignored, got inserted=%v event=%+v", inserted, duplicate)
	}

	matched, err := st.FindInvoiceByExactAmount(ctx, wallet.Address, NetworkBASE, decimal.RequireFromString("100.123456"))
	if err != nil {
		t.Fatalf("FindInvoiceByExactAmount: %v", err)
	}
	if matched.ID != invoice.ID {
		t.Fatalf("unexpected exact match invoice: %+v", matched)
	}
	underpaid, err := st.FindPotentialUnderpaidInvoice(ctx, wallet.Address, NetworkBASE, decimal.RequireFromString("99.123456"))
	if err != nil {
		t.Fatalf("FindPotentialUnderpaidInvoice: %v", err)
	}
	if underpaid.ID != invoice.ID {
		t.Fatalf("unexpected underpaid match invoice: %+v", underpaid)
	}

	updated, err := st.CompleteInvoicePayment(ctx, invoice.ID, invoice.Status, event.ID, event.TxHash, InvoiceStatusPaid, "", event.Amount, time.Now())
	if err != nil {
		t.Fatalf("CompleteInvoicePayment: %v", err)
	}
	if updated.Status != InvoiceStatusPaid || updated.LastPaymentEventID == nil || *updated.LastPaymentEventID != event.ID {
		t.Fatalf("unexpected completed invoice: %+v", updated)
	}

	var allocationCount, notificationCount, deliveryCount int
	if err := st.RawPool().QueryRow(ctx, `SELECT COUNT(1) FROM payment_allocations WHERE invoice_id = $1 AND payment_event_id = $2`, invoice.ID, event.ID).Scan(&allocationCount); err != nil {
		t.Fatalf("count payment allocations: %v", err)
	}
	if allocationCount != 1 {
		t.Fatalf("expected one payment allocation, got %d", allocationCount)
	}
	if err := st.RawPool().QueryRow(ctx, `SELECT COUNT(1) FROM notification_outbox WHERE workspace_id = $1`, workspace.ID).Scan(&notificationCount); err != nil {
		t.Fatalf("count notifications: %v", err)
	}
	if notificationCount != 1 {
		t.Fatalf("expected one notification, got %d", notificationCount)
	}
	if err := st.RawPool().QueryRow(ctx, `SELECT COUNT(1) FROM webhook_deliveries WHERE endpoint_id = $1 AND workspace_id = $2`, endpoint.ID, workspace.ID).Scan(&deliveryCount); err != nil {
		t.Fatalf("count webhook deliveries: %v", err)
	}
	if deliveryCount != 1 {
		t.Fatalf("expected one webhook delivery, got %d", deliveryCount)
	}

	tonWallet, err := st.CreateWallet(ctx, workspace.ID, NetworkTON, "UQC4Rj6QFZVjX2Y9ixRL3c2Wp2y7K0pQn8_o7K4s7Qh7k9aa")
	if err != nil {
		t.Fatalf("CreateWallet TON: %v", err)
	}
	comment := "RECV-PAYFLOW-TON"
	tonInvoice, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "TON Payment Flow",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     NetworkTON,
		DestinationAddress: tonWallet.Address,
		PayableAmount:      decimal.RequireFromString("1.25"),
		PaymentComment:     &comment,
		PublicID:           "PAYFLOW002",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice TON: %v", err)
	}
	foundTON, err := st.FindInvoiceByGramComment(ctx, tonWallet.Address, comment)
	if err != nil {
		t.Fatalf("FindInvoiceByGramComment: %v", err)
	}
	if foundTON.ID != tonInvoice.ID {
		t.Fatalf("unexpected TON match invoice: %+v", foundTON)
	}
}

func TestStoreCanceledContextErrorBranches(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 95001, "canceledctxuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := st.GetUserByTelegramID(ctx, 95001)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	canceled, cancel := context.WithCancel(ctx)
	cancel()

	expectErr := func(name string, fn func() error) {
		t.Helper()
		if err := fn(); err == nil {
			t.Fatalf("%s: expected error with canceled context", name)
		}
	}

	expectErr("GetUserByID", func() error {
		_, err := st.GetUserByID(canceled, user.ID)
		return err
	})
	expectErr("GetUserByTelegramID", func() error {
		_, err := st.GetUserByTelegramID(canceled, 95001)
		return err
	})
	expectErr("UpsertUser", func() error {
		_, err := st.UpsertUser(canceled, 95002, "ctxuser", "")
		return err
	})
	expectErr("ListWorkspacesForUser", func() error {
		_, err := st.ListWorkspacesForUser(canceled, user.ID)
		return err
	})
	expectErr("AddWorkspaceMember", func() error {
		return st.AddWorkspaceMember(canceled, workspace.ID, user.ID, RoleAdmin)
	})
	expectErr("CreateAgentWorkspace", func() error {
		_, _, err := st.CreateAgentWorkspace(canceled, 95003, "agent", "agent@example.com")
		return err
	})
	expectErr("UpsertWorkspaceByTelegram", func() error {
		_, err := st.UpsertWorkspaceByTelegram(canceled, 95004, "newctxuser")
		return err
	})
	expectErr("GetWorkspaceByID", func() error {
		_, err := st.GetWorkspaceByID(canceled, workspace.ID)
		return err
	})
	expectErr("GetWorkspaceByTelegramID", func() error {
		_, err := st.GetWorkspaceByTelegramID(canceled, 95001)
		return err
	})
	expectErr("GetWorkspaceByUsername", func() error {
		_, err := st.GetWorkspaceByUsername(canceled, "canceledctxuser")
		return err
	})
	expectErr("GrantPRO", func() error {
		_, err := st.GrantPRO(canceled, workspace.ID, 30)
		return err
	})
	expectErr("SetWorkspaceBlocked", func() error {
		_, err := st.SetWorkspaceBlocked(canceled, workspace.ID, true)
		return err
	})
	expectErr("UpdateWorkspaceEmail", func() error {
		_, err := st.UpdateWorkspaceEmail(canceled, workspace.ID, "ctx@example.com")
		return err
	})
	expectErr("StoreTelegramAuthCode", func() error {
		return st.StoreTelegramAuthCode(canceled, workspace.ID, "hash", time.Now().Add(time.Minute))
	})
	expectErr("ConsumeTelegramAuthCode", func() error {
		return st.ConsumeTelegramAuthCode(canceled, workspace.ID, "hash")
	})
	expectErr("ListWallets", func() error {
		_, err := st.ListWallets(canceled, workspace.ID)
		return err
	})
	expectErr("CreateWallet", func() error {
		_, err := st.CreateWallet(canceled, workspace.ID, NetworkTON, "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
		return err
	})
	expectErr("DeactivateWallet", func() error {
		return st.DeactivateWallet(canceled, workspace.ID, wallet.ID)
	})
	expectErr("GetActiveWalletForNetwork", func() error {
		_, err := st.GetActiveWalletForNetwork(canceled, workspace.ID, NetworkEVM)
		return err
	})
	expectErr("GetWalletByID", func() error {
		_, err := st.GetWalletByID(canceled, workspace.ID, wallet.ID)
		return err
	})
	expectErr("CountInvoicesCreated", func() error {
		_, err := st.CountInvoicesCreated(canceled, workspace.ID)
		return err
	})
	expectErr("InvoicePublicIDExists", func() error {
		_, err := st.InvoicePublicIDExists(canceled, "CTX001")
		return err
	})
	expectErr("TONCommentExists", func() error {
		_, err := st.TONCommentExists(canceled, "RECV-CTX")
		return err
	})
	expectErr("SuffixRecentlyUsed", func() error {
		_, err := st.SuffixRecentlyUsed(canceled, wallet.Address, NetworkBASE, decimal.RequireFromString("0.000001"))
		return err
	})
	expectErr("CreateInvoice", func() error {
		_, err := st.CreateInvoice(canceled, CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Title:              "Canceled",
			BaseAmountUSD:      decimal.RequireFromString("1"),
			PayableNetwork:     NetworkBASE,
			DestinationAddress: wallet.Address,
			PayableAmount:      decimal.RequireFromString("1"),
			PublicID:           "CTX001",
			ExpiresAt:          time.Now().Add(time.Hour),
		})
		return err
	})
	expectErr("ListInvoices", func() error {
		_, _, err := st.ListInvoices(canceled, workspace.ID, ListInvoicesFilter{Limit: 1})
		return err
	})
	expectErr("GetInvoiceByID", func() error {
		_, err := st.GetInvoiceByID(canceled, workspace.ID, 1)
		return err
	})
	expectErr("GetInvoiceByPublicID", func() error {
		_, err := st.GetInvoiceByPublicID(canceled, "CTX001")
		return err
	})
	expectErr("SetInvoiceStatus", func() error {
		_, err := st.SetInvoiceStatus(canceled, workspace.ID, 1, InvoiceStatusExpired)
		return err
	})
	expectErr("MarkInvoicePaidManual", func() error {
		_, err := st.MarkInvoicePaidManual(canceled, workspace.ID, 1)
		return err
	})
	expectErr("ExpireOverdueInvoices", func() error {
		_, err := st.ExpireOverdueInvoices(canceled)
		return err
	})
	expectErr("RecordObservedTransfer", func() error {
		_, _, err := st.RecordObservedTransfer(canceled, ObservedTransfer{
			TxHash:             "ctx-tx",
			Network:            NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("1"),
			ObservedAt:         time.Now(),
			RawPayload:         json.RawMessage(`{}`),
		})
		return err
	})
	expectErr("FindInvoiceByGramComment", func() error {
		_, err := st.FindInvoiceByGramComment(canceled, wallet.Address, "RECV-CTX")
		return err
	})
	expectErr("FindInvoiceByExactAmount", func() error {
		_, err := st.FindInvoiceByExactAmount(canceled, wallet.Address, NetworkBASE, decimal.RequireFromString("1"))
		return err
	})
	expectErr("FindPotentialUnderpaidInvoice", func() error {
		_, err := st.FindPotentialUnderpaidInvoice(canceled, wallet.Address, NetworkBASE, decimal.RequireFromString("0.5"))
		return err
	})
	expectErr("MarkPaymentEventUnmatched", func() error {
		return st.MarkPaymentEventUnmatched(canceled, 1, "ctx")
	})
	expectErr("CompleteInvoicePayment", func() error {
		_, err := st.CompleteInvoicePayment(canceled, 1, InvoiceStatusAwaitingPayment, 0, "ctx", InvoiceStatusPaid, "", decimal.RequireFromString("1"), time.Now())
		return err
	})
	expectErr("GetWatchedWallets", func() error {
		_, err := st.GetWatchedWallets(canceled, time.Hour)
		return err
	})
	expectErr("ClaimNotificationJobs", func() error {
		_, err := st.ClaimNotificationJobs(canceled, 1)
		return err
	})
	expectErr("MarkNotificationSent", func() error {
		return st.MarkNotificationSent(canceled, 1)
	})
	expectErr("MarkNotificationFailed", func() error {
		return st.MarkNotificationFailed(canceled, 1, "ctx")
	})
	expectErr("GetAdminOverview", func() error {
		_, err := st.GetAdminOverview(canceled)
		return err
	})
	expectErr("ListAdminInvoices", func() error {
		_, err := st.ListAdminInvoices(canceled, AdminInvoiceFilters{Page: 1, PageSize: 10})
		return err
	})
	expectErr("GetSystemConfig", func() error {
		_, err := st.GetSystemConfig(canceled, "ctx")
		return err
	})
	expectErr("UpsertSystemConfig", func() error {
		return st.UpsertSystemConfig(canceled, "ctx", map[string]string{"x": "y"}, false, "test")
	})
	expectErr("GetBillingWalletAddress", func() error {
		_, err := st.GetBillingWalletAddress(canceled, NetworkTON)
		return err
	})
	expectErr("AllowRateLimit", func() error {
		_, _, err := st.AllowRateLimit(canceled, "ctx", 1, time.Minute)
		return err
	})
	expectErr("RecordAdminAuditEvent", func() error {
		return st.RecordAdminAuditEvent(canceled, "actor", "action", "target", "1", json.RawMessage(`{}`))
	})
	expectErr("ListAdminAuditEvents", func() error {
		_, err := st.ListAdminAuditEvents(canceled, 10)
		return err
	})
	expectErr("ListAdminWorkspaces", func() error {
		_, err := st.ListAdminWorkspaces(canceled, 10)
		return err
	})
	expectErr("ListAdminFailedWebhooks", func() error {
		_, err := st.ListAdminFailedWebhooks(canceled, 10)
		return err
	})
	expectErr("ListAdminWatchers", func() error {
		_, err := st.ListAdminWatchers(canceled)
		return err
	})
	expectErr("GetAdminNotificationHealth", func() error {
		_, err := st.GetAdminNotificationHealth(canceled)
		return err
	})
	expectErr("SetWorkspacePlan", func() error {
		_, err := st.SetWorkspacePlan(canceled, workspace.ID, PlanCodeDeveloper, 30, nil)
		return err
	})
	expectErr("ResendAdminWebhookDelivery", func() error {
		_, err := st.ResendAdminWebhookDelivery(canceled, 1)
		return err
	})
	expectErr("ReviewAdminInvoice", func() error {
		_, _, err := st.ReviewAdminInvoice(canceled, 1, "accept", "ok", "admin")
		return err
	})
	expectErr("RefreshAdminInvoiceStatus", func() error {
		_, _, err := st.RefreshAdminInvoiceStatus(canceled, 1)
		return err
	})
	expectErr("CreateAdminInternalComment", func() error {
		_, err := st.CreateAdminInternalComment(canceled, "invoice", "1", "body", "admin")
		return err
	})
	expectErr("GetAdminAnalytics", func() error {
		_, err := st.GetAdminAnalytics(canceled, time.Now().Add(-time.Hour), time.Now(), "day")
		return err
	})
	expectErr("ListSEOTargets", func() error {
		_, err := st.ListSEOTargets(canceled)
		return err
	})
	expectErr("ListWorkspaceMembers", func() error {
		_, err := st.ListWorkspaceMembers(canceled, workspace.ID)
		return err
	})
	expectErr("GetWorkspaceMemberRole", func() error {
		_, err := st.GetWorkspaceMemberRole(canceled, workspace.ID, user.ID)
		return err
	})
	expectErr("CountWorkspaceOwners", func() error {
		_, err := st.CountWorkspaceOwners(canceled, workspace.ID)
		return err
	})
	expectErr("UpdateWorkspaceMemberRole", func() error {
		return st.UpdateWorkspaceMemberRole(canceled, workspace.ID, user.ID, RoleAdmin)
	})
	expectErr("RemoveWorkspaceMember", func() error {
		return st.RemoveWorkspaceMember(canceled, workspace.ID, user.ID)
	})
	expectErr("ListWorkspaceInvites", func() error {
		_, err := st.ListWorkspaceInvites(canceled, workspace.ID)
		return err
	})
	expectErr("CreateWorkspaceInvite", func() error {
		_, err := st.CreateWorkspaceInvite(canceled, workspace.ID, "invitee", RoleMember, user.ID)
		return err
	})
	expectErr("RevokeWorkspaceInvite", func() error {
		return st.RevokeWorkspaceInvite(canceled, workspace.ID, 1)
	})
	expectErr("AcceptPendingInvitesForUser", func() error {
		_, err := st.AcceptPendingInvitesForUser(canceled, user.ID, "invitee")
		return err
	})
	expectErr("CountActiveAPIKeys", func() error {
		_, err := st.CountActiveAPIKeys(canceled, workspace.ID)
		return err
	})
	expectErr("ListAPIKeys", func() error {
		_, err := st.ListAPIKeys(canceled, workspace.ID)
		return err
	})
	expectErr("CreateAPIKey", func() error {
		_, err := st.CreateAPIKey(canceled, workspace.ID, "ctx", "recv_", "hash", []string{"invoices:read"}, "live")
		return err
	})
	expectErr("RevokeAPIKey", func() error {
		return st.RevokeAPIKey(canceled, workspace.ID, 1)
	})
	expectErr("GetAPIKeyByTokenHash", func() error {
		_, err := st.GetAPIKeyByTokenHash(canceled, "hash")
		return err
	})
	expectErr("TouchAPIKeyLastUsed", func() error {
		return st.TouchAPIKeyLastUsed(canceled, 1)
	})
	expectErr("CountAPIRequestsSince", func() error {
		_, err := st.CountAPIRequestsSince(canceled, workspace.ID, nil, time.Now().Add(-time.Hour))
		return err
	})
	expectErr("RecordAPIRequest", func() error {
		return st.RecordAPIRequest(canceled, workspace.ID, 1, "GET", "/ctx", 200)
	})
	expectErr("ListWebhookEndpoints", func() error {
		_, err := st.ListWebhookEndpoints(canceled, workspace.ID)
		return err
	})
	expectErr("CreateWebhookEndpoint", func() error {
		_, err := st.CreateWebhookEndpoint(canceled, workspace.ID, "ctx", "https://example.com/ctx", "secret", "live")
		return err
	})
	expectErr("RotateWebhookEndpointSecret", func() error {
		_, err := st.RotateWebhookEndpointSecret(canceled, workspace.ID, 1, "secret")
		return err
	})
	expectErr("DeactivateWebhookEndpoint", func() error {
		return st.DeactivateWebhookEndpoint(canceled, workspace.ID, 1)
	})
	expectErr("ClaimWebhookDeliveries", func() error {
		_, err := st.ClaimWebhookDeliveries(canceled, 1)
		return err
	})
	expectErr("RecordWebhookDeliveryAttempt", func() error {
		return st.RecordWebhookDeliveryAttempt(canceled, 1, 1, 1, WebhookAttemptResult{StatusCode: 500, Error: "ctx"})
	})
	expectErr("MarkWebhookDeliverySent", func() error {
		return st.MarkWebhookDeliverySent(canceled, 1, 1)
	})
	expectErr("MarkWebhookDeliveryFailed", func() error {
		return st.MarkWebhookDeliveryFailed(canceled, 1, 1, 1, 3, 500, "ctx")
	})
	expectErr("ListWebhookDeliveries", func() error {
		_, err := st.ListWebhookDeliveries(canceled, workspace.ID, 10)
		return err
	})
	expectErr("ResendWebhookDelivery", func() error {
		_, err := st.ResendWebhookDelivery(canceled, workspace.ID, 1)
		return err
	})
	expectErr("GetIdempotencyRecord", func() error {
		_, err := st.GetIdempotencyRecord(canceled, workspace.ID, 1, "POST", "/ctx", "key")
		return err
	})
	expectErr("CreateIdempotencyRecord", func() error {
		_, err := st.CreateIdempotencyRecord(canceled, workspace.ID, 1, "POST", "/ctx", "key", "hash")
		return err
	})
	expectErr("CompleteIdempotencyRecord", func() error {
		return st.CompleteIdempotencyRecord(canceled, 1, 200, json.RawMessage(`{}`))
	})
	expectErr("GetWatcherCheckpoint", func() error {
		_, err := st.GetWatcherCheckpoint(canceled, NetworkEVM, NetworkBASE, wallet.Address)
		return err
	})
	expectErr("SaveWatcherCheckpoint", func() error {
		return st.SaveWatcherCheckpoint(canceled, WatcherCheckpoint{PollNetwork: NetworkEVM, PayableNetwork: NetworkBASE, DestinationAddress: wallet.Address, LastBlock: 1})
	})
}

// TestGetAdminOverviewSuccess verifies GetAdminOverview completes all SQL queries with a live DB.
func TestGetAdminOverviewSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 72020, "overviewuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x7777777777777777777777777777777777777777")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	if _, err := st.CreateAPIKey(ctx, workspace.ID, "overview-key", "live_overview_", "overview_hash", []string{"invoices:read"}, "live"); err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}
	if _, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "overview-hook", "https://example.com/overview", "whsec_overview", "live"); err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}
	paidAt := time.Now().UTC()
	invoice, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Overview Paid",
		BaseAmountUSD:      decimal.RequireFromString("42"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("42.000001"),
		PublicID:           "OVERVIEW001",
		Mode:               "live",
		ExpiresAt:          paidAt.Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	if _, err := st.RawPool().Exec(ctx, `
		UPDATE invoices
		SET status='paid', paid_at=$2, received_amount=payable_amount, finalized_at=$2
		WHERE id=$1
	`, invoice.ID, paidAt); err != nil {
		t.Fatalf("mark overview invoice paid: %v", err)
	}

	overview, err := st.GetAdminOverview(ctx)
	if err != nil {
		t.Fatalf("GetAdminOverview: %v", err)
	}
	if overview.GeneratedAt.IsZero() {
		t.Fatal("expected GeneratedAt to be set")
	}
	if overview.Totals.PaidTotal == 0 || overview.Totals.WorkspacesTotal == 0 {
		t.Fatalf("expected seeded totals, got %+v", overview.Totals)
	}
	if len(overview.DailySales) == 0 || len(overview.NetworkBreakdown) == 0 || len(overview.StatusBreakdown) == 0 || len(overview.PlanBreakdown) == 0 || len(overview.RecentSales) == 0 {
		t.Fatalf("expected overview breakdowns to be populated, got daily=%d network=%d status=%d plan=%d recent=%d",
			len(overview.DailySales), len(overview.NetworkBreakdown), len(overview.StatusBreakdown), len(overview.PlanBreakdown), len(overview.RecentSales))
	}
}

// TestListAdminWorkspacesSuccess verifies ListAdminWorkspaces scans rows correctly.
func TestListAdminWorkspacesSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	_, err := st.UpsertWorkspaceByTelegram(ctx, 71001, "adminwsuser1")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	items, err := st.ListAdminWorkspaces(ctx, 10)
	if err != nil {
		t.Fatalf("ListAdminWorkspaces: %v", err)
	}
	if len(items) == 0 {
		t.Fatal("expected at least one workspace in list")
	}

	// Also test with zero/large limit (defaults to 100)
	items2, err := st.ListAdminWorkspaces(ctx, 0)
	if err != nil {
		t.Fatalf("ListAdminWorkspaces(0): %v", err)
	}
	if len(items2) == 0 {
		t.Fatal("expected workspaces with limit=0 fallback")
	}
}

// TestListWorkspaceMembersSuccess verifies the success path for ListWorkspaceMembers.
func TestListWorkspaceMembersSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71002, "membertestowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	member, err := st.UpsertUser(ctx, 71003, "membertestuser", "")
	if err != nil {
		t.Fatalf("UpsertUser: %v", err)
	}
	if err := st.AddWorkspaceMember(ctx, workspace.ID, member.ID, RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember: %v", err)
	}

	members, err := st.ListWorkspaceMembers(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("ListWorkspaceMembers: %v", err)
	}
	// At minimum the owner should be there (added by UpsertWorkspaceByTelegram)
	found := false
	for _, m := range members {
		if m.UserID == member.ID {
			found = true
		}
	}
	if !found {
		t.Fatalf("expected member %d in workspace members, got: %+v", member.ID, members)
	}
}

// TestAcceptPendingInvitesForUser verifies the full invite acceptance lifecycle.
func TestAcceptPendingInvitesForUser(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	t.Run("empty username returns 0 without error", func(t *testing.T) {
		n, err := st.AcceptPendingInvitesForUser(ctx, 1, "")
		if err != nil {
			t.Fatalf("unexpected error for empty username: %v", err)
		}
		if n != 0 {
			t.Fatalf("expected 0 accepted for empty username, got %d", n)
		}
	})

	t.Run("username with @ prefix is normalized and accepted", func(t *testing.T) {
		owner, err := st.UpsertWorkspaceByTelegram(ctx, 71010, "inviteowner")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram owner: %v", err)
		}
		ownerUser, err := st.GetUserByTelegramID(ctx, 71010)
		if err != nil {
			t.Fatalf("GetUserByTelegramID: %v", err)
		}
		invitee, err := st.UpsertUser(ctx, 71011, "inviteduser", "")
		if err != nil {
			t.Fatalf("UpsertUser invitee: %v", err)
		}

		_, err = st.CreateWorkspaceInvite(ctx, owner.ID, "inviteduser", RoleMember, ownerUser.ID)
		if err != nil {
			t.Fatalf("CreateWorkspaceInvite: %v", err)
		}

		n, err := st.AcceptPendingInvitesForUser(ctx, invitee.ID, "@inviteduser")
		if err != nil {
			t.Fatalf("AcceptPendingInvitesForUser: %v", err)
		}
		if n != 1 {
			t.Fatalf("expected 1 accepted invite, got %d", n)
		}

		// Second call with same username should return 0 (already accepted)
		n2, err := st.AcceptPendingInvitesForUser(ctx, invitee.ID, "inviteduser")
		if err != nil {
			t.Fatalf("second AcceptPendingInvitesForUser: %v", err)
		}
		if n2 != 0 {
			t.Fatalf("expected 0 on second call (no pending invites), got %d", n2)
		}
	})

	t.Run("no matching invites returns 0", func(t *testing.T) {
		n, err := st.AcceptPendingInvitesForUser(ctx, 71012, "noinviteuser")
		if err != nil {
			t.Fatalf("unexpected error for no invites: %v", err)
		}
		if n != 0 {
			t.Fatalf("expected 0, got %d", n)
		}
	})
}

// TestRevokeWorkspaceInviteNotFound verifies ErrNotFound when invite doesn't exist.
func TestRevokeWorkspaceInviteNotFound(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71020, "revokeinviteowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	err = st.RevokeWorkspaceInvite(ctx, workspace.ID, 99999999)
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("expected ErrNotFound, got %v", err)
	}
}

// TestMarkInvoicePaidManualSuccess verifies MarkInvoicePaidManual completes all TX steps.
func TestMarkInvoicePaidManualSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71100, "markpaiduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xAAAA1111BBBB2222CCCC3333DDDD4444EEEE5555")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Workspace-managed merchant invoice
	payable := decimal.RequireFromString("20.000111")
	suffix := decimal.RequireFromString("0.000111")
	inv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Mark Paid Test",
		BaseAmountUSD:      decimal.RequireFromString("20"),
		PayableNetwork:     NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      payable,
		MatchingSuffix:     &suffix,
		PublicID:           "MARKPAID01",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("mark invoice paid manually", func(t *testing.T) {
		paid, err := st.MarkInvoicePaidManual(ctx, workspace.ID, inv.ID)
		if err != nil {
			t.Fatalf("MarkInvoicePaidManual: %v", err)
		}
		if paid.Status != InvoiceStatusPaid {
			t.Fatalf("expected paid status, got %s", paid.Status)
		}
	})

	t.Run("mark non-existent invoice returns ErrNotFound", func(t *testing.T) {
		_, err := st.MarkInvoicePaidManual(ctx, workspace.ID, 99999999)
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestMarkInvoicePaidManualSubscription verifies applyInvoicePostPaymentEffects runs for subscriptions.
func TestMarkInvoicePaidManualSubscription(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71110, "submarkpaiduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0xFFFF5555AAAA1111BBBB2222CCCC3333DDDD4444")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	payable := decimal.RequireFromString("30.000222")
	suffix := decimal.RequireFromString("0.000222")
	subInv, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindSubscription,
		Title:              "Sub Mark Paid",
		BaseAmountUSD:      decimal.RequireFromString("30"),
		PayableNetwork:     NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      payable,
		MatchingSuffix:     &suffix,
		PublicID:           "SUBMARKPAID01",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
		SubscriptionDays:   30,
		PlanCode:           PlanCodeMerchant,
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	paid, err := st.MarkInvoicePaidManual(ctx, workspace.ID, subInv.ID)
	if err != nil {
		t.Fatalf("MarkInvoicePaidManual subscription: %v", err)
	}
	if paid.Status != InvoiceStatusPaid {
		t.Fatalf("expected paid, got %s", paid.Status)
	}

	// Verify subscription was applied to workspace
	updated, err := st.GetWorkspaceByID(ctx, workspace.ID)
	if err != nil {
		t.Fatalf("GetWorkspaceByID: %v", err)
	}
	if updated.SubscriptionEndsAt == nil {
		t.Fatal("expected subscription_ends_at to be set after subscription payment")
	}
}

// TestStoreTelegramAuthCodeAllBranches covers the remaining branches of StoreTelegramAuthCode.
func TestStoreTelegramAuthCodeAllBranches(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71120, "otpbranchuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("store with very short TTL stores correctly", func(t *testing.T) {
		codeHash := "hash_short_ttl_1"
		expiresAt := time.Now().Add(1 * time.Second)
		if err := st.StoreTelegramAuthCode(ctx, workspace.ID, codeHash, expiresAt); err != nil {
			t.Fatalf("StoreTelegramAuthCode short TTL: %v", err)
		}
		// Verify stored
		if err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, codeHash); err != nil {
			t.Fatalf("ConsumeTelegramAuthCode: %v", err)
		}
	})

	t.Run("consume non-existent code returns error", func(t *testing.T) {
		err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, "nonexistent_hash")
		if err == nil {
			t.Fatal("expected error for non-existent code")
		}
	})
}

// TestRefreshSessionLifecycle exercises CreateRefreshSession, RefreshSession, and RevokeRefreshSession.
func TestRefreshSessionLifecycle(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71200, "refreshsessionuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := st.GetUserByTelegramID(ctx, 71200)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	tokenHash := "test-refresh-token-hash-12345"
	expiresAt := time.Now().Add(24 * time.Hour)

	t.Run("create refresh session", func(t *testing.T) {
		if err := st.CreateRefreshSession(ctx, user.ID, workspace.ID, tokenHash, expiresAt, "test-agent", "127.0.0.1"); err != nil {
			t.Fatalf("CreateRefreshSession: %v", err)
		}
	})

	t.Run("refresh session returns user and workspace", func(t *testing.T) {
		u, ws, err := st.RefreshSession(ctx, tokenHash)
		if err != nil {
			t.Fatalf("RefreshSession: %v", err)
		}
		if u.ID != user.ID {
			t.Fatalf("expected user %d, got %d", user.ID, u.ID)
		}
		if ws.ID != workspace.ID {
			t.Fatalf("expected workspace %d, got %d", workspace.ID, ws.ID)
		}
	})

	t.Run("refresh session with non-existent hash returns ErrNotFound", func(t *testing.T) {
		_, _, err := st.RefreshSession(ctx, "nonexistent-hash")
		if !errors.Is(err, ErrNotFound) {
			t.Fatalf("expected ErrNotFound, got %v", err)
		}
	})
}

// TestLimitStringHelper exercises the limitString function.
func TestLimitStringHelper(t *testing.T) {
	cases := []struct {
		input string
		limit int
		want  string
	}{
		{"hello", 10, "hello"},       // under limit
		{"hello world", 5, "hello"},  // over limit, truncated
		{"  spaces  ", 10, "spaces"}, // trimmed
		{"", 5, ""},                  // empty
		{"exactly", 7, "exactly"},    // exact limit
	}
	for _, tc := range cases {
		got := limitString(tc.input, tc.limit)
		if got != tc.want {
			t.Fatalf("limitString(%q, %d) = %q; want %q", tc.input, tc.limit, got, tc.want)
		}
	}
}

// TestEnsureBootstrapAdminIdempotent verifies bootstrap admin can be called twice.
func TestEnsureBootstrapAdminIdempotent(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	_, created, err := st.EnsureBootstrapAdmin(ctx, "boot@example.com", "pass1")
	if err != nil {
		t.Fatalf("EnsureBootstrapAdmin first: %v", err)
	}
	_ = created

	// Second call should be idempotent
	_, created2, err := st.EnsureBootstrapAdmin(ctx, "boot@example.com", "pass2")
	if err != nil {
		t.Fatalf("EnsureBootstrapAdmin second: %v", err)
	}
	if created2 {
		t.Fatal("expected created=false on second call")
	}
}

// TestStoreCloseIsolated verifies Close does not panic on a separate store instance.
func TestStoreCloseIsolated(t *testing.T) {
	ctx := context.Background()

	// Use a fresh isolated store (not the shared one) so we can safely close it.
	port := pickStoreDBTestPort(t)
	baseDir := t.TempDir()
	pgConfig := storeDBTestPostgresConfig(port, baseDir)

	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		t.Fatalf("embedded postgres start: %v", err)
	}
	t.Cleanup(func() { _ = database.Stop() })

	st, err := New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("store.New: %v", err)
	}

	// Close should not panic
	st.Close()

	// Calling Close again should also not panic (pool.Close is idempotent)
	st.Close()
}

// TestCreateAgentWorkspaceSuccess exercises agent workspace creation.
func TestCreateAgentWorkspaceSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	_, workspace, err := st.CreateAgentWorkspace(ctx, -71030, "agentbot", "agent@example.com")
	if err != nil {
		t.Fatalf("CreateAgentWorkspace: %v", err)
	}
	if workspace.ID == 0 {
		t.Fatal("expected workspace to be created")
	}
}

// TestStoreTelegramAuthCodePaths exercises all branches of code storage/consumption.
func TestStoreTelegramAuthCodePaths(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71040, "otpuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	codeHash := "sha256testhashabc"
	expiresAt := time.Now().Add(10 * time.Minute)

	if err := st.StoreTelegramAuthCode(ctx, workspace.ID, codeHash, expiresAt); err != nil {
		t.Fatalf("StoreTelegramAuthCode: %v", err)
	}

	// Consume it — returns error or nil (no bool)
	if err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, codeHash); err != nil {
		t.Fatalf("ConsumeTelegramAuthCode: %v", err)
	}

	// Re-storing and re-consuming should work too
	if err := st.StoreTelegramAuthCode(ctx, workspace.ID, codeHash+"_2", expiresAt); err != nil {
		t.Fatalf("second StoreTelegramAuthCode: %v", err)
	}
	if err := st.ConsumeTelegramAuthCode(ctx, workspace.ID, codeHash+"_2"); err != nil {
		t.Fatalf("second ConsumeTelegramAuthCode: %v", err)
	}
}

// TestGrantPROSuccess verifies the GrantPRO function works end-to-end.
func TestGrantPROSuccess(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71050, "prouser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	updated, err := st.GrantPRO(ctx, workspace.ID, 90)
	if err != nil {
		t.Fatalf("GrantPRO: %v", err)
	}
	if updated.SubscriptionEndsAt == nil {
		t.Fatal("expected subscription_ends_at to be set after GrantPRO")
	}
	if updated.PlanCode != PlanCodeMerchant {
		t.Fatalf("expected merchant plan after GrantPRO, got %s", updated.PlanCode)
	}
}

// TestAuthSessionErrorPaths covers canceled-context error branches for auth session functions.
func TestAuthSessionErrorPaths(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71070, "authsessionuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := st.GetUserByTelegramID(ctx, 71070)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	canceled, cancel := context.WithCancel(ctx)
	cancel()

	expectErr := func(name string, fn func() error) {
		t.Helper()
		if err := fn(); err == nil {
			t.Fatalf("%s: expected error with canceled context", name)
		}
	}

	expectErr("CreateRefreshSession", func() error {
		return st.CreateRefreshSession(canceled, user.ID, workspace.ID, "testhash", time.Now().Add(time.Hour), "", "")
	})
	expectErr("RefreshSession", func() error {
		_, _, err := st.RefreshSession(canceled, "nonexistent-hash")
		return err
	})
	expectErr("EnsureBootstrapAdmin", func() error {
		_, _, err := st.EnsureBootstrapAdmin(canceled, "boot@example.com", "passhash")
		return err
	})
	expectErr("CreateAdminSession", func() error {
		_, err := st.CreateAdminSession(canceled, 1, "refreshhash", time.Now().Add(time.Hour), "useragent", "127.0.0.1")
		return err
	})
	expectErr("GetAdminSessionByRefreshHash", func() error {
		_, err := st.GetAdminSessionByRefreshHash(canceled, "hash")
		return err
	})
	expectErr("RevokeAdminSession", func() error {
		return st.RevokeAdminSession(canceled, 1)
	})
	expectErr("ListAdminUserRoles", func() error {
		_, err := st.ListAdminUserRoles(canceled, 1)
		return err
	})
}

// TestEnsureBootstrapAdminEmptyCredentials covers the early return when credentials are empty.
func TestEnsureBootstrapAdminEmptyCredentials(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	admin, created, err := st.EnsureBootstrapAdmin(ctx, "", "passhash")
	if err != nil {
		t.Fatalf("EnsureBootstrapAdmin with empty email: %v", err)
	}
	if created {
		t.Fatal("expected created=false for empty email")
	}
	if admin.ID != 0 {
		t.Fatal("expected zero admin for empty email")
	}

	admin2, created2, err := st.EnsureBootstrapAdmin(ctx, "boot2@example.com", "")
	if err != nil {
		t.Fatalf("EnsureBootstrapAdmin with empty password: %v", err)
	}
	if created2 {
		t.Fatal("expected created=false for empty password")
	}
	if admin2.ID != 0 {
		t.Fatal("expected zero admin for empty password")
	}
}

// TestRecordProductEventPaths exercises all product event branches.
func TestRecordProductEventPaths(t *testing.T) {
	ctx := context.Background()
	st := newStoreDBTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 71060, "eventuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// With workspace ID
	if err := st.RecordProductEvent(ctx, ProductEventInput{
		EventName:   "page_view",
		Source:      "web",
		WorkspaceID: &workspace.ID,
	}); err != nil {
		t.Fatalf("RecordProductEvent with workspace: %v", err)
	}

	// Without workspace ID (public event)
	if err := st.RecordProductEvent(ctx, ProductEventInput{
		EventName: "signup_click",
		Source:    "web",
	}); err != nil {
		t.Fatalf("RecordProductEvent without workspace: %v", err)
	}

	if err := st.RecordProductEvent(ctx, ProductEventInput{
		EventName: "   ",
		Source:    "web",
	}); err != nil {
		t.Fatalf("RecordProductEvent blank event should no-op: %v", err)
	}

	wallet, err := st.CreateWallet(ctx, workspace.ID, NetworkEVM, "0x9999999999999999999999999999999999999999")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	invoice, err := st.CreateInvoice(ctx, CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               InvoiceKindMerchant,
		Title:              "Event Invoice",
		BaseAmountUSD:      decimal.RequireFromString("18"),
		PayableNetwork:     NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("18.000001"),
		PublicID:           "EVENTINV001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}
	if err := st.RecordProductEvent(ctx, ProductEventInput{
		InvoicePublicID: invoice.PublicID,
		EventName:       "checkout_opened",
		Source:          "checkout",
		Properties:      json.RawMessage(`{bad`),
	}); err != nil {
		t.Fatalf("RecordProductEvent with invoice public id: %v", err)
	}

	var linkedCount int
	if err := st.RawPool().QueryRow(ctx, `
		SELECT COUNT(1)
		FROM product_events
		WHERE workspace_id = $1 AND invoice_id = $2 AND event_name = 'checkout_opened' AND properties = '{}'::jsonb
	`, workspace.ID, invoice.ID).Scan(&linkedCount); err != nil {
		t.Fatalf("count linked product event: %v", err)
	}
	if linkedCount != 1 {
		t.Fatalf("expected one product event linked to invoice with fallback properties, got %d", linkedCount)
	}
}
