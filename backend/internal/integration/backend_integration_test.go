package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/gin-gonic/gin"

	"reqst/backend/internal/config"
	httpapi "reqst/backend/internal/http"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"
)

func TestBackendMainFlowsWithEmbeddedPostgres(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	env := newIntegrationEnv(t, ctx)
	client := env.server.Client()

	assertMigrationCount(t, ctx, env.store, 15)

	auth := loginSeller(t, client, env.server.URL, 10001, "alice")
	assertTelegramAuthCodeLifecycle(t, ctx, env.store, auth.Workspace.ID)

	createWallet(t, client, env.server.URL, auth.Token, "EVM", "0x1111111111111111111111111111111111111111")
	createWallet(t, client, env.server.URL, auth.Token, "TON", "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")

	wallets := listWallets(t, client, env.server.URL, auth.Token)
	if len(wallets.Items) != 2 {
		t.Fatalf("expected 2 wallets, got %d", len(wallets.Items))
	}

	baseInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "Base merchant", "15", "BASE")
	assertPublicInvoice(t, client, env.server.URL, baseInvoice.PublicID, baseInvoice.ID)

	cancelInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "Cancel me", "7", "BASE")
	cancelled := cancelSellerInvoice(t, client, env.server.URL, auth.Token, cancelInvoice.ID)
	if cancelled.Status != "expired" {
		t.Fatalf("expected canceled invoice to be expired, got %s", cancelled.Status)
	}

	manualInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "Manual paid", "9", "BASE")
	manuallyPaid := markSellerInvoicePaid(t, client, env.server.URL, auth.Token, manualInvoice.ID)
	if manuallyPaid.Status != "paid" {
		t.Fatalf("expected manual invoice to be paid, got %s", manuallyPaid.Status)
	}

	basePayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/base", observedTransferEvent{
		TxHash:             "tx-base-1",
		DestinationAddress: baseInvoice.DestinationAddress,
		Amount:             baseInvoice.PayableAmount,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         map[string]any{"source": "integration-base"},
	})
	if len(basePayment.Items) != 1 || basePayment.Items[0].Classification != "paid_exact" {
		t.Fatalf("expected base payment to be paid_exact, got %#v", basePayment.Items)
	}

	duplicatePayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/base", observedTransferEvent{
		TxHash:             "tx-base-1",
		DestinationAddress: baseInvoice.DestinationAddress,
		Amount:             baseInvoice.PayableAmount,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         map[string]any{"source": "integration-base-duplicate"},
	})
	if len(duplicatePayment.Items) != 1 || duplicatePayment.Items[0].Classification != "duplicate" {
		t.Fatalf("expected duplicate classification, got %#v", duplicatePayment.Items)
	}

	paidBaseInvoice := getSellerInvoice(t, client, env.server.URL, auth.Token, baseInvoice.ID)
	if paidBaseInvoice.Status != "paid" {
		t.Fatalf("expected base invoice to be paid, got %s", paidBaseInvoice.Status)
	}

	tonInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "TON merchant", "10", "TON")
	tonPayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/ton", observedTransferEvent{
		TxHash:             "tx-ton-1",
		DestinationAddress: tonInvoice.DestinationAddress,
		Amount:             tonInvoice.PayableAmount,
		PaymentComment:     tonInvoice.PaymentComment,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         map[string]any{"source": "integration-ton"},
	})
	if len(tonPayment.Items) != 1 || tonPayment.Items[0].Classification != "paid_exact" {
		t.Fatalf("expected TON payment to be paid_exact, got %#v", tonPayment.Items)
	}

	merchantList := listSellerInvoices(t, client, env.server.URL, auth.Token)
	if len(merchantList.Items) < 4 {
		t.Fatalf("expected at least 4 invoices, got %d", len(merchantList.Items))
	}

	devCheckout := createBillingCheckout(t, client, env.server.URL, auth.Token, "TRON", "developer")
	devPayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/tron", observedTransferEvent{
		TxHash:             "tx-subscription-1",
		DestinationAddress: devCheckout.DestinationAddress,
		Amount:             devCheckout.PayableAmount,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         map[string]any{"source": "integration-tron"},
	})
	if len(devPayment.Items) != 1 || devPayment.Items[0].Classification != "paid_exact" {
		t.Fatalf("expected developer checkout payment to be paid_exact, got %#v", devPayment.Items)
	}

	me := getMe(t, client, env.server.URL, auth.Token)
	if me.Plan.Code != "developer" || !me.Plan.HasAPI || !me.Plan.HasWebhooks {
		t.Fatalf("expected developer plan with api+webhooks, got %+v", me.Plan)
	}

	webhookReceiver := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}))
	defer webhookReceiver.Close()

	apiKeySecret := createAPIKey(t, client, env.server.URL, auth.Token)
	createWebhook(t, client, env.server.URL, auth.Token, webhookReceiver.URL)

	usage := getDeveloperUsage(t, client, env.server.URL, auth.Token)
	if usage.Usage.ActiveAPIKeys != 1 {
		t.Fatalf("expected 1 active api key, got %d", usage.Usage.ActiveAPIKeys)
	}
	if usage.Usage.WebhookEndpoints != 1 {
		t.Fatalf("expected 1 webhook endpoint, got %d", usage.Usage.WebhookEndpoints)
	}

	devInvoice := createDeveloperInvoice(t, client, env.server.URL, apiKeySecret, "SDK invoice", "20", "BASE")
	devInvoicePayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/base", observedTransferEvent{
		TxHash:             "tx-sdk-1",
		DestinationAddress: devInvoice.DestinationAddress,
		Amount:             devInvoice.PayableAmount,
		ObservedAt:         time.Now().UTC(),
		RawPayload:         map[string]any{"source": "integration-sdk"},
	})
	if len(devInvoicePayment.Items) != 1 || devInvoicePayment.Items[0].Classification != "paid_exact" {
		t.Fatalf("expected developer invoice payment to be paid_exact, got %#v", devInvoicePayment.Items)
	}

	requestCount, err := env.store.CountAPIRequestsSince(ctx, auth.Workspace.ID, nil, time.Now().UTC().Add(-1*time.Hour))
	if err != nil {
		t.Fatalf("CountAPIRequestsSince returned error: %v", err)
	}
	if requestCount < 1 {
		t.Fatalf("expected at least 1 recorded API request, got %d", requestCount)
	}

	assertNotificationOutbox(t, ctx, env.store)
	assertWebhookQueue(t, ctx, env.store, devInvoice.PublicID)

	secondAuth := loginSeller(t, client, env.server.URL, 10002, "bravo1")
	setSellerBlocked(t, client, env.server.URL, env.cfg.InternalToken, secondAuth.Workspace.ID, true)
	assertSellerMeStatus(t, client, env.server.URL, secondAuth.Token, http.StatusForbidden)
	setSellerBlocked(t, client, env.server.URL, env.cfg.InternalToken, secondAuth.Workspace.ID, false)
	assertSellerMeStatus(t, client, env.server.URL, secondAuth.Token, http.StatusOK)
	grantPro(t, client, env.server.URL, env.cfg.InternalToken, secondAuth.Workspace.ID, 14)
	secondMe := getMe(t, client, env.server.URL, secondAuth.Token)
	if secondMe.Plan.Code != "merchant" {
		t.Fatalf("expected second workspace Merchant plan after grant, got %+v", secondMe.Plan)
	}

	adminToken := adminLogin(t, client, env.server.URL)
	overview := getAdminOverview(t, client, env.server.URL, adminToken)
	if overview.Totals.InvoicesTotal < 6 {
		t.Fatalf("expected at least 6 invoices in admin overview, got %d", overview.Totals.InvoicesTotal)
	}
	if overview.Totals.PaidTotal < 5 {
		t.Fatalf("expected at least 5 paid invoices, got %d", overview.Totals.PaidTotal)
	}
	if overview.Totals.WorkspacesTotal != 2 {
		t.Fatalf("expected 2 workspaces, got %d", overview.Totals.WorkspacesTotal)
	}
	if overview.Totals.APIKeysActive != 1 {
		t.Fatalf("expected 1 active api key, got %d", overview.Totals.APIKeysActive)
	}
	if overview.Totals.WebhookEndpoints != 1 {
		t.Fatalf("expected 1 webhook endpoint, got %d", overview.Totals.WebhookEndpoints)
	}

	adminInvoices := getAdminInvoices(t, client, env.server.URL, adminToken)
	if adminInvoices.Total < 6 || len(adminInvoices.Items) == 0 {
		t.Fatalf("expected admin invoices page to contain data, got total=%d items=%d", adminInvoices.Total, len(adminInvoices.Items))
	}
}

type integrationEnv struct {
	cfg    config.Config
	store  *store.Store
	server *httptest.Server
}

func newIntegrationEnv(t *testing.T, ctx context.Context) integrationEnv {
	t.Helper()

	port := pickFreePort(t)
	baseDir := t.TempDir()
	cacheDir := filepath.Join(os.TempDir(), "reqst-embedded-postgres-cache")
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("reqst").
		Username("reqst").
		Password("reqst").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(cacheDir).
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

	databaseURL := pgConfig.GetConnectionURL() + "?sslmode=disable"
	st, err := store.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("store.New returned error: %v", err)
	}
	t.Cleanup(st.Close)
	if err := st.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{
		"TON":    "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"TRON":   "TIntegrationBillingWallet111111",
		"SOLANA": "11111111111111111111111111111111",
		"EVM":    "0x1111111111111111111111111111111111111111",
	}, false, "integration-test"); err != nil {
		t.Fatalf("seed billing wallets config: %v", err)
	}

	cfg := config.Config{
		AppEnv:               "test",
		DatabaseURL:          databaseURL,
		JWTSecret:            "jwt-secret",
		InternalToken:        "internal-secret",
		AllowInsecureDevAuth: true,
		TelegramInitMaxAge:   time.Hour,
		TonUSDOverride:       "2.5",
		AdminUsername:        "admin",
		AdminPassword:        "pass",
		AdminJWTSecret:       "admin-secret",
		AdminSessionTTL:      12 * time.Hour,
		PublicAppURL:         "https://reqst.test",
	}

	authService := service.NewAuthService(st, cfg.JWTSecret, "", cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge)
	adminService := service.NewAdminService(cfg.AdminUsername, cfg.AdminPassword, cfg.AdminJWTSecret, cfg.AdminSessionTTL)
	invoiceService := service.NewInvoiceService(st, cfg.TonUSDOverride)
	paymentService := service.NewPaymentService(st)

	router := httpapi.NewServer(cfg, st, authService, adminService, invoiceService, paymentService)
	server := httptest.NewServer(router)
	t.Cleanup(server.Close)

	return integrationEnv{
		cfg:    cfg,
		store:  st,
		server: server,
	}
}

func assertMigrationCount(t *testing.T, ctx context.Context, st *store.Store, expected int) {
	t.Helper()

	var count int
	if err := st.RawPool().QueryRow(ctx, `SELECT COUNT(1) FROM schema_migrations`).Scan(&count); err != nil {
		t.Fatalf("failed to count migrations: %v", err)
	}
	if count != expected {
		t.Fatalf("expected %d migrations, got %d", expected, count)
	}
}

func assertTelegramAuthCodeLifecycle(t *testing.T, ctx context.Context, st *store.Store, sellerID int64) {
	t.Helper()

	if err := st.StoreTelegramAuthCode(ctx, sellerID, "code-hash", time.Now().UTC().Add(10*time.Minute)); err != nil {
		t.Fatalf("StoreTelegramAuthCode returned error: %v", err)
	}
	if err := st.ConsumeTelegramAuthCode(ctx, sellerID, "code-hash"); err != nil {
		t.Fatalf("ConsumeTelegramAuthCode returned error: %v", err)
	}
	if err := st.ConsumeTelegramAuthCode(ctx, sellerID, "code-hash"); err == nil {
		t.Fatal("expected consumed code to be unavailable on second consume")
	}
}

func assertPublicInvoice(t *testing.T, client *http.Client, baseURL string, publicID string, expectedID int64) {
	t.Helper()

	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/public/invoices/"+publicID, nil, nil)
	if status != http.StatusOK {
		t.Fatalf("expected public invoice 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	if invoice.ID != expectedID {
		t.Fatalf("expected public invoice id %d, got %d", expectedID, invoice.ID)
	}
}

func assertNotificationOutbox(t *testing.T, ctx context.Context, st *store.Store) {
	t.Helper()

	jobs, err := st.ClaimNotificationJobs(ctx, 20)
	if err != nil {
		t.Fatalf("ClaimNotificationJobs returned error: %v", err)
	}
	if len(jobs) < 4 {
		t.Fatalf("expected at least 4 notification jobs, got %d", len(jobs))
	}
	for _, job := range jobs {
		if !strings.Contains(strings.ToLower(job.Message), "invoice") && !strings.Contains(strings.ToLower(job.Message), "subscription") {
			t.Fatalf("unexpected notification message: %q", job.Message)
		}
		if err := st.MarkNotificationSent(ctx, job.ID); err != nil {
			t.Fatalf("MarkNotificationSent returned error: %v", err)
		}
	}
}

func assertWebhookQueue(t *testing.T, ctx context.Context, st *store.Store, expectedPublicID string) {
	t.Helper()

	deliveries, err := st.ClaimWebhookDeliveries(ctx, 20)
	if err != nil {
		t.Fatalf("ClaimWebhookDeliveries returned error: %v", err)
	}
	if len(deliveries) == 0 {
		t.Fatal("expected at least one webhook delivery")
	}

	foundInvoicePaid := false
	for _, delivery := range deliveries {
		if delivery.EventType == "invoice.paid" && bytes.Contains(delivery.Payload, []byte(expectedPublicID)) {
			foundInvoicePaid = true
		}
		if err := st.MarkWebhookDeliverySent(ctx, delivery.ID, delivery.EndpointID); err != nil {
			t.Fatalf("MarkWebhookDeliverySent returned error: %v", err)
		}
	}
	if !foundInvoicePaid {
		t.Fatalf("expected invoice.paid webhook for public id %s, got %#v", expectedPublicID, deliveries)
	}
}

func pickFreePort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()

	return uint32(listener.Addr().(*net.TCPAddr).Port)
}

type authResponse struct {
	Token  string `json:"token"`
	Workspace struct {
		ID int64 `json:"id"`
	} `json:"workspace"`
}

type walletResponse struct {
	ID      int64  `json:"id"`
	Network string `json:"network"`
	Address string `json:"address"`
}

type listWalletsResponse struct {
	Items []walletResponse `json:"items"`
}

type invoiceResponse struct {
	ID                 int64   `json:"id"`
	PublicID           string  `json:"public_id"`
	Kind               string  `json:"kind"`
	PlanCode           string  `json:"plan_code"`
	PayableAmount      string  `json:"payable_amount"`
	PayableNetwork     string  `json:"payable_network"`
	DestinationAddress string  `json:"destination_address"`
	PaymentComment     string  `json:"payment_comment"`
	Status             string  `json:"status"`
	TxHash             *string `json:"tx_hash"`
}

type listInvoicesResponse struct {
	Items []invoiceResponse `json:"items"`
}

type observedTransferEvent struct {
	TxHash             string    `json:"tx_hash"`
	Network            string    `json:"network,omitempty"`
	DestinationAddress string    `json:"destination_address"`
	Amount             string    `json:"amount"`
	PaymentComment     string    `json:"payment_comment,omitempty"`
	ObservedAt         time.Time `json:"observed_at"`
	RawPayload         any       `json:"raw_payload"`
}

type observedTransfersResponse struct {
	Items []struct {
		Classification string           `json:"classification"`
		Invoice        *invoiceResponse `json:"invoice,omitempty"`
	} `json:"items"`
}

type meResponse struct {
	Workspace struct {
		ID int64 `json:"id"`
	} `json:"workspace"`
	Plan struct {
		Code        string `json:"code"`
		HasAPI      bool   `json:"has_api"`
		HasWebhooks bool   `json:"has_webhooks"`
	} `json:"plan"`
}

type createAPIKeyResponse struct {
	Secret string `json:"secret"`
}

type developerUsageResponse struct {
	Usage struct {
		ActiveAPIKeys    int `json:"active_api_keys"`
		WebhookEndpoints int `json:"webhook_endpoints"`
	} `json:"usage"`
}

type adminLoginResponse struct {
	Token string `json:"token"`
}

type adminOverviewResponse struct {
	Totals struct {
		InvoicesTotal    int `json:"invoices_total"`
		PaidTotal        int `json:"paid_total"`
		WorkspacesTotal  int `json:"workspaces_total"`
		APIKeysActive    int `json:"api_keys_active"`
		WebhookEndpoints int `json:"webhook_endpoints"`
	} `json:"totals"`
}

type adminInvoicesResponse struct {
	Items []map[string]any `json:"items"`
	Total int              `json:"total"`
}

func loginSeller(t *testing.T, client *http.Client, baseURL string, telegramID int64, username string) authResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/telegram", nil, map[string]any{
		"telegram_id": telegramID,
		"username":    username,
	})
	if status != http.StatusOK {
		t.Fatalf("expected auth 200, got %d: %s", status, string(body))
	}
	var response authResponse
	decodeJSON(t, body, &response)
	if response.Token == "" || response.Workspace.ID == 0 {
		t.Fatalf("unexpected auth response: %+v", response)
	}
	return response
}

func createWallet(t *testing.T, client *http.Client, baseURL string, token string, network string, address string) walletResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/wallets", headers, map[string]any{
		"network": network,
		"address": address,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create wallet 201, got %d: %s", status, string(body))
	}
	var wallet walletResponse
	decodeJSON(t, body, &wallet)
	return wallet
}

func listWallets(t *testing.T, client *http.Client, baseURL string, token string) listWalletsResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/wallets", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected list wallets 200, got %d: %s", status, string(body))
	}
	var response listWalletsResponse
	decodeJSON(t, body, &response)
	return response
}

func createSellerInvoice(t *testing.T, client *http.Client, baseURL string, token string, title string, amount string, network string) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/invoices", headers, map[string]any{
		"title":           title,
		"base_amount_usd": amount,
		"payable_network": network,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create invoice 201, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func listSellerInvoices(t *testing.T, client *http.Client, baseURL string, token string) listInvoicesResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/invoices", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected list invoices 200, got %d: %s", status, string(body))
	}
	var response listInvoicesResponse
	decodeJSON(t, body, &response)
	return response
}

func getSellerInvoice(t *testing.T, client *http.Client, baseURL string, token string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, fmt.Sprintf("%s/api/invoices/%d", baseURL, invoiceID), headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected get invoice 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func cancelSellerInvoice(t *testing.T, client *http.Client, baseURL string, token string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/cancel", baseURL, invoiceID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected cancel invoice 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func markSellerInvoicePaid(t *testing.T, client *http.Client, baseURL string, token string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/mark-paid", baseURL, invoiceID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected mark invoice paid 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func postObservedTransfer(t *testing.T, client *http.Client, baseURL string, internalToken string, path string, event observedTransferEvent) observedTransfersResponse {
	t.Helper()

	headers := map[string]string{"X-Internal-Token": internalToken}
	status, body := doJSON(t, client, http.MethodPost, baseURL+path, headers, map[string]any{
		"events": []observedTransferEvent{event},
	})
	if status != http.StatusOK {
		t.Fatalf("expected observed transfer 200, got %d: %s", status, string(body))
	}
	var response observedTransfersResponse
	decodeJSON(t, body, &response)
	return response
}

func createBillingCheckout(t *testing.T, client *http.Client, baseURL string, token string, network string, planCode string) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/billing/checkout", headers, map[string]any{
		"payable_network": network,
		"plan_code":       planCode,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected billing checkout 201, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func getMe(t *testing.T, client *http.Client, baseURL string, token string) meResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/me", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected me 200, got %d: %s", status, string(body))
	}
	var response meResponse
	decodeJSON(t, body, &response)
	return response
}

func assertSellerMeStatus(t *testing.T, client *http.Client, baseURL string, token string, expectedStatus int) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/me", headers, nil)
	if status != expectedStatus {
		t.Fatalf("expected /api/me status %d, got %d: %s", expectedStatus, status, string(body))
	}
}

func createAPIKey(t *testing.T, client *http.Client, baseURL string, token string) string {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/developer/api-keys", headers, map[string]any{
		"label": "Integration key",
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create api key 201, got %d: %s", status, string(body))
	}
	var response createAPIKeyResponse
	decodeJSON(t, body, &response)
	if response.Secret == "" {
		t.Fatal("expected api key secret")
	}
	return response.Secret
}

func createWebhook(t *testing.T, client *http.Client, baseURL string, token string, endpointURL string) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/developer/webhooks", headers, map[string]any{
		"label": "Integration webhook",
		"url":   endpointURL,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create webhook 201, got %d: %s", status, string(body))
	}
}

func getDeveloperUsage(t *testing.T, client *http.Client, baseURL string, token string) developerUsageResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/developer/usage", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected developer usage 200, got %d: %s", status, string(body))
	}
	var response developerUsageResponse
	decodeJSON(t, body, &response)
	return response
}

func createDeveloperInvoice(t *testing.T, client *http.Client, baseURL string, apiKey string, title string, amount string, network string) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + apiKey}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/v1/invoices", headers, map[string]any{
		"title":           title,
		"base_amount_usd": amount,
		"payable_network": network,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected developer create invoice 201, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func adminLogin(t *testing.T, client *http.Client, baseURL string) string {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/admin/login", nil, map[string]any{
		"username": "admin",
		"password": "pass",
	})
	if status != http.StatusOK {
		t.Fatalf("expected admin login 200, got %d: %s", status, string(body))
	}
	var response adminLoginResponse
	decodeJSON(t, body, &response)
	if response.Token == "" {
		t.Fatal("expected admin token")
	}
	return response.Token
}

func setSellerBlocked(t *testing.T, client *http.Client, baseURL string, internalToken string, workspaceID int64, blocked bool) {
	t.Helper()

	headers := map[string]string{"X-Internal-Token": internalToken}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/internal/admin/workspaces/%d/block", baseURL, workspaceID), headers, map[string]any{
		"blocked": blocked,
	})
	if status != http.StatusOK {
		t.Fatalf("expected block workspace 200, got %d: %s", status, string(body))
	}
}

func grantPro(t *testing.T, client *http.Client, baseURL string, internalToken string, workspaceID int64, days int) {
	t.Helper()

	headers := map[string]string{"X-Internal-Token": internalToken}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/internal/admin/workspaces/%d/grant-pro", baseURL, workspaceID), headers, map[string]any{
		"days": days,
	})
	if status != http.StatusOK {
		t.Fatalf("expected grant-pro 200, got %d: %s", status, string(body))
	}
}

func getAdminOverview(t *testing.T, client *http.Client, baseURL string, token string) adminOverviewResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/admin/overview", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected admin overview 200, got %d: %s", status, string(body))
	}
	var response adminOverviewResponse
	decodeJSON(t, body, &response)
	return response
}

func getAdminInvoices(t *testing.T, client *http.Client, baseURL string, token string) adminInvoicesResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/admin/invoices?page=1&page_size=20", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected admin invoices 200, got %d: %s", status, string(body))
	}
	var response adminInvoicesResponse
	decodeJSON(t, body, &response)
	return response
}

func doJSON(t *testing.T, client *http.Client, method string, url string, headers map[string]string, body any) (int, []byte) {
	t.Helper()

	var requestBody io.Reader
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("json.Marshal returned error: %v", err)
		}
		requestBody = bytes.NewReader(raw)
	}

	request, err := http.NewRequest(method, url, requestBody)
	if err != nil {
		t.Fatalf("http.NewRequest returned error: %v", err)
	}
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}

	response, err := client.Do(request)
	if err != nil {
		t.Fatalf("client.Do returned error: %v", err)
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		t.Fatalf("io.ReadAll returned error: %v", err)
	}
	return response.StatusCode, responseBody
}

func decodeJSON(t *testing.T, body []byte, out any) {
	t.Helper()

	if err := json.Unmarshal(body, out); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v; body=%s", err, string(body))
	}
}

func init() {
	slog.SetDefault(slog.New(slog.NewTextHandler(io.Discard, nil)))
}
