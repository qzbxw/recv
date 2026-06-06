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

	"recv/backend/internal/config"
	httpapi "recv/backend/internal/http"
	"recv/backend/internal/service"
	"recv/backend/internal/store"
)

func TestBackendMainFlowsWithEmbeddedPostgres(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	env := newIntegrationEnv(t, ctx)
	client := env.server.Client()

	assertMigrationCount(t, ctx, env.store, expectedMigrationCount(t))

	auth := loginSeller(t, client, env.server.URL, 10001, "alice")
	assertAuthSessionLifecycle(t, client, env.server.URL, auth.RefreshToken)
	assertTelegramAuthCodeLifecycle(t, ctx, env.store, auth.Workspace.ID)
	assertTeamInviteFlow(t, client, env.server.URL, auth)

	createWallet(t, client, env.server.URL, auth.Token, "EVM", "0x1111111111111111111111111111111111111111")
	createWallet(t, client, env.server.URL, auth.Token, "TON", "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
	tempWallet := createWallet(t, client, env.server.URL, auth.Token, "TRON", "TIntegrationTempWallet111111")

	wallets := listWallets(t, client, env.server.URL, auth.Token)
	if len(wallets.Items) != 3 {
		t.Fatalf("expected 3 wallets, got %d", len(wallets.Items))
	}
	deleteWallet(t, client, env.server.URL, auth.Token, tempWallet.ID)

	baseInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "Base merchant", "15", "BASE")
	assertPublicInvoice(t, client, env.server.URL, baseInvoice.PublicID, baseInvoice.ID)
	assertProductEventFlow(t, client, env.server.URL, auth.Token, baseInvoice.PublicID)

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
	// Test invoice list with filters and pagination normalization
	authHeaders := map[string]string{"Authorization": "Bearer " + auth.Token}
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/invoices?status=paid", authHeaders, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/invoices?query=merchant", authHeaders, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/invoices?page=0&page_size=0", authHeaders, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/invoices?page_size=200", authHeaders, nil, http.StatusOK)

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

	apiKey := createAPIKey(t, client, env.server.URL, auth.Token, createAPIKeyRequest{Label: "Integration key"})
	createWebhook(t, client, env.server.URL, auth.Token, webhookReceiver.URL)

	usage := getDeveloperUsage(t, client, env.server.URL, auth.Token)
	if usage.Usage.ActiveAPIKeys != 1 {
		t.Fatalf("expected 1 active api key, got %d", usage.Usage.ActiveAPIKeys)
	}
	if usage.Usage.WebhookEndpoints != 1 {
		t.Fatalf("expected 1 webhook endpoint, got %d", usage.Usage.WebhookEndpoints)
	}

	assertDeveloperAPILifecycle(t, client, env.server.URL, auth.Token, apiKey.Secret, webhookReceiver.URL)

	devInvoice := createDeveloperInvoice(t, client, env.server.URL, apiKey.Secret, "SDK invoice", "20", "BASE")
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
	resendableDeliveryID := assertDeveloperWebhookDeliveryFlow(t, client, env.server.URL, auth.Token)

	reviewInvoice := createSellerInvoice(t, client, env.server.URL, auth.Token, "Manual review", "11", "BASE")
	latePayment := postObservedTransfer(t, client, env.server.URL, env.cfg.InternalToken, "/internal/watchers/base", observedTransferEvent{
		TxHash:             "tx-review-1",
		DestinationAddress: reviewInvoice.DestinationAddress,
		Amount:             reviewInvoice.PayableAmount,
		ObservedAt:         time.Now().UTC().Add(31 * time.Minute),
		RawPayload:         map[string]any{"source": "integration-review"},
	})
	if len(latePayment.Items) != 1 || latePayment.Items[0].Classification != "late_payment" {
		t.Fatalf("expected late payment to require manual review, got %#v", latePayment.Items)
	}

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
	setAdminWorkspaceBlocked(t, client, env.server.URL, adminToken, secondAuth.Workspace.ID, true)
	setAdminWorkspaceBlocked(t, client, env.server.URL, adminToken, secondAuth.Workspace.ID, false)
	agent := bootstrapAgentWorkspace(t, client, env.server.URL)
	if agent.Token == "" || agent.Workspace.ID == 0 {
		t.Fatalf("expected agent bootstrap to create authenticated workspace, got %+v", agent)
	}
	assertBlogPublishingFlow(t, client, env.server.URL, adminToken)
	assertAdminOpsFlow(t, client, env.server.URL, adminToken, secondAuth.Workspace.ID, devInvoice.ID, resendableDeliveryID, reviewInvoice.ID)
	overview := getAdminOverview(t, client, env.server.URL, adminToken)
	if overview.Totals.InvoicesTotal < 7 {
		t.Fatalf("expected at least 6 invoices in admin overview, got %d", overview.Totals.InvoicesTotal)
	}
	if overview.Totals.PaidTotal < 6 {
		t.Fatalf("expected at least 5 paid invoices, got %d", overview.Totals.PaidTotal)
	}
	if overview.Totals.WorkspacesTotal != 5 {
		t.Fatalf("expected 5 workspaces, got %d", overview.Totals.WorkspacesTotal)
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

func TestBackendBoundaryFlowsWithEmbeddedPostgres(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	env := newIntegrationEnv(t, ctx)
	client := env.server.Client()

	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/me", nil, nil, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/admin/overview", nil, nil, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/admin/login", nil, map[string]any{"username": "admin", "password": "wrong"}, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/admin/login/verify-totp", nil, map[string]any{"challenge_token": "bad", "code": "000000"}, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/public/invoices/missing", nil, nil, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/internal/watchers/base", nil, map[string]any{"events": []any{}}, http.StatusForbidden)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/v1/me", map[string]string{"Authorization": "Bearer nope"}, nil, http.StatusUnauthorized)

	trial := loginSellerWithAttribution(t, client, env.server.URL, 11001, "edgecase", "google")
	trialHeaders := map[string]string{"Authorization": "Bearer " + trial.Token}

	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/auth/telegram/request-code", nil, map[string]any{"username": "edgecase"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/auth/telegram/login", nil, map[string]any{"username": "edgecase"}, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/developer/api-keys", trialHeaders, map[string]any{"label": "trial key"}, http.StatusForbidden)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/developer/webhooks", trialHeaders, map[string]any{"url": "https://example.test/webhook"}, http.StatusCreated)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/billing/checkout", trialHeaders, map[string]any{"plan_code": "trial", "payable_network": "TON"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/me/contact-email", trialHeaders, map[string]any{"email": "not-an-email"}, http.StatusBadRequest)
	// Successful email update and clear
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/me/contact-email", trialHeaders, map[string]any{"email": "contact@example.test"}, http.StatusOK)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/me/contact-email", trialHeaders, map[string]any{"email": ""}, http.StatusOK)

	createWallet(t, client, env.server.URL, trial.Token, "EVM", "0x2222222222222222222222222222222222222222")
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/wallets/%d", env.server.URL, int64(999999)), trialHeaders, nil, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/wallets", trialHeaders, map[string]any{"network": "BASE", "address": "0x1"}, http.StatusBadRequest)

	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/invoices", trialHeaders, map[string]any{"base_amount_usd": "1", "payable_network": "BASE"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/invoices", trialHeaders, map[string]any{"title": "Zero", "base_amount_usd": "0", "payable_network": "BASE"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/invoices", trialHeaders, map[string]any{"title": "Bad network", "base_amount_usd": "1", "payable_network": "DOGE"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/invoices", trialHeaders, map[string]any{"title": "No tron wallet", "base_amount_usd": "1", "payable_network": "TRON"}, http.StatusBadRequest)

	for i := 0; i < service.TrialInvoiceLimit; i++ {
		createSellerInvoice(t, client, env.server.URL, trial.Token, fmt.Sprintf("Trial invoice %02d", i+1), "1", "BASE")
	}
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/invoices", trialHeaders, map[string]any{"title": "Over trial cap", "base_amount_usd": "1", "payable_network": "BASE"}, http.StatusBadRequest)

	adminToken := adminLogin(t, client, env.server.URL)
	adminHeaders := map[string]string{"Authorization": "Bearer " + adminToken}
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/admin/refresh", nil, map[string]any{}, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/admin/logout", nil, map[string]any{}, http.StatusOK)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/admin/sessions/revoke", adminHeaders, map[string]any{"session_id": 0}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/admin/analytics?group_by=currency", adminHeaders, nil, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/plan", env.server.URL, trial.Workspace.ID), adminHeaders, map[string]any{"plan_code": "unknown"}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/block", env.server.URL, int64(999999)), adminHeaders, map[string]any{"blocked": true}, http.StatusNotFound)

	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/plan", env.server.URL, trial.Workspace.ID), adminHeaders, map[string]any{"plan_code": "developer", "days": 30}, http.StatusOK)
	readOnlyKey := createAPIKey(t, client, env.server.URL, trial.Token, createAPIKeyRequest{Label: "Read only", Scopes: []string{"invoices:read"}})
	writeOnlyKey := createAPIKey(t, client, env.server.URL, trial.Token, createAPIKeyRequest{Label: "Write only", Scopes: []string{"invoices:write"}})

	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/v1/invoices", map[string]string{"Authorization": "Bearer " + readOnlyKey.Secret}, map[string]any{"title": "Forbidden write", "base_amount_usd": "1", "payable_network": "BASE"}, http.StatusForbidden)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/v1/invoices", map[string]string{"Authorization": "Bearer " + writeOnlyKey.Secret}, nil, http.StatusForbidden)
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/api/developer/webhooks", trialHeaders, map[string]any{"label": "Bad URL", "url": "ftp://example.test/hook"}, http.StatusBadRequest)

	// Developer API: get/cancel non-existent invoice → 404
	assertJSONStatus(t, client, http.MethodGet, fmt.Sprintf("%s/v1/invoices/%d", env.server.URL, int64(999999)), map[string]string{"Authorization": "Bearer " + readOnlyKey.Secret}, nil, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/v1/invoices/%d/cancel", env.server.URL, int64(999999)), map[string]string{"Authorization": "Bearer " + writeOnlyKey.Secret}, map[string]any{}, http.StatusNotFound)
	// Developer API: create invoice with idempotency key AND invalid amount → covers recordIdempotentJSON with non-nil record
	assertJSONStatus(t, client, http.MethodPost, env.server.URL+"/v1/invoices",
		map[string]string{"Authorization": "Bearer " + writeOnlyKey.Secret, "Idempotency-Key": "error-idem-key-1"},
		map[string]any{"title": "Test", "base_amount_usd": "bad-amount", "payable_network": "BASE"},
		http.StatusBadRequest)
	// Developer API: webhook deliveries with invalid limit values (limit normalization)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/developer/webhook-deliveries?limit=0", trialHeaders, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/api/developer/webhook-deliveries?limit=200", trialHeaders, nil, http.StatusOK)
	// Developer API: invoice list with invalid page/page_size values
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/v1/invoices?page=0&page_size=0", map[string]string{"Authorization": "Bearer " + readOnlyKey.Secret}, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/v1/invoices?page_size=200", map[string]string{"Authorization": "Bearer " + readOnlyKey.Secret}, nil, http.StatusOK)
	// Rotate non-existent webhook endpoint → 404
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/developer/webhooks/%d/rotate-secret", env.server.URL, int64(999999)), trialHeaders, map[string]any{}, http.StatusNotFound)
	// Resend non-existent webhook delivery → 404
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/developer/webhook-deliveries/%d/resend", env.server.URL, int64(999999)), trialHeaders, map[string]any{}, http.StatusNotFound)

	deleteAPIKey(t, client, env.server.URL, trial.Token, readOnlyKey.APIKey.ID)
	assertJSONStatus(t, client, http.MethodGet, env.server.URL+"/v1/me", map[string]string{"Authorization": "Bearer " + readOnlyKey.Secret}, nil, http.StatusUnauthorized)
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/developer/api-keys/%d", env.server.URL, readOnlyKey.APIKey.ID), trialHeaders, nil, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/developer/webhooks/%d", env.server.URL, int64(999999)), trialHeaders, nil, http.StatusNotFound)

	// Test cancel/mark-paid on subscription invoice (should be rejected with 400 as non-workspace-managed)
	billingInvoice := createBillingCheckout(t, client, env.server.URL, trial.Token, "TRON", "merchant")
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/cancel", env.server.URL, billingInvoice.ID), trialHeaders, map[string]any{}, http.StatusBadRequest)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/mark-paid", env.server.URL, billingInvoice.ID), trialHeaders, map[string]any{}, http.StatusBadRequest)

	// Test get/cancel/mark-paid for non-existent invoice IDs → 404
	assertJSONStatus(t, client, http.MethodGet, fmt.Sprintf("%s/api/invoices/%d", env.server.URL, int64(999999)), trialHeaders, nil, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/cancel", env.server.URL, int64(999999)), trialHeaders, map[string]any{}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/invoices/%d/mark-paid", env.server.URL, int64(999999)), trialHeaders, map[string]any{}, http.StatusNotFound)
	// Switch to a workspace not a member of → 403
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/workspaces/%d/switch", env.server.URL, int64(999999)), trialHeaders, map[string]any{}, http.StatusForbidden)

	// Admin handler error paths: trigger not-found responses using non-existent IDs
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/webhook-deliveries/%d/resend", env.server.URL, int64(999999)), adminHeaders, map[string]any{}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/invoices/%d/review", env.server.URL, int64(999999)), adminHeaders, map[string]any{"result": "mark_paid", "comment": ""}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/invoices/%d/refresh-status", env.server.URL, int64(999999)), adminHeaders, map[string]any{}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/billing-checkout", env.server.URL, int64(999999)), adminHeaders, map[string]any{"plan_code": "developer", "payable_network": "TON"}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPut, fmt.Sprintf("%s/api/admin/blog/%d", env.server.URL, int64(999999)), adminHeaders, map[string]any{"slug": "x", "title": "x", "content_md": "x"}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/admin/blog/%d", env.server.URL, int64(999999)), adminHeaders, nil, http.StatusNotFound)

	// Internal endpoint error paths
	internalHeaders := map[string]string{"X-Internal-Token": env.cfg.InternalToken}
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/internal/admin/workspaces/%d/grant-pro", env.server.URL, int64(999999)), internalHeaders, map[string]any{"days": 7}, http.StatusNotFound)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/internal/admin/workspaces/%d/block", env.server.URL, int64(999999)), internalHeaders, map[string]any{"blocked": true}, http.StatusNotFound)
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
	cacheDir := filepath.Join(os.TempDir(), "recv-embedded-postgres-cache")
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("recv").
		Username("recv").
		Password("recv").
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
		"TON":  "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
		"TRON": "TIntegrationBillingWallet111111",
		"EVM":  "0x1111111111111111111111111111111111111111",
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
		AccessTokenTTL:       30 * 24 * time.Hour,
		RefreshTokenTTL:      30 * 24 * time.Hour,
		AdminAccessTokenTTL:  12 * time.Hour,
		AdminRefreshTokenTTL: 12 * time.Hour,
		PublicAppURL:         "https://recv.test",
	}

	authService := service.NewAuthService(st, cfg.JWTSecret, "", cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge)
	adminService := service.NewAdminService(cfg.AdminUsername, cfg.AdminPassword, cfg.AdminJWTSecret, cfg.AdminAccessTokenTTL)
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

func expectedMigrationCount(t *testing.T) int {
	t.Helper()

	migrations, err := filepath.Glob("../db/migrations/*.sql")
	if err != nil {
		t.Fatalf("failed to list migrations: %v", err)
	}
	if len(migrations) == 0 {
		t.Fatal("expected at least one migration")
	}
	return len(migrations)
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
		if strings.TrimSpace(job.Message) == "" {
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

func assertAuthSessionLifecycle(t *testing.T, client *http.Client, baseURL string, refreshToken string) {
	t.Helper()

	refreshed := refreshAuthSession(t, client, baseURL, refreshToken)
	if refreshed.Token == "" || refreshed.RefreshToken == "" {
		t.Fatalf("expected refreshed auth tokens, got %+v", refreshed)
	}
	logoutAuthSession(t, client, baseURL, refreshed.RefreshToken)
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/refresh", nil, map[string]any{"refresh_token": refreshed.RefreshToken})
	if status != http.StatusUnauthorized {
		t.Fatalf("expected revoked refresh token to be rejected, got %d: %s", status, string(body))
	}
}

func assertTeamInviteFlow(t *testing.T, client *http.Client, baseURL string, owner authResponse) {
	t.Helper()

	invite := createTeamInvite(t, client, baseURL, owner.Token, "teammate", "admin")
	if invite.Role != "admin" || invite.Status != "pending" {
		t.Fatalf("expected pending admin invite, got %+v", invite)
	}

	teammate := loginSeller(t, client, baseURL, 10003, "teammate")
	switched := switchWorkspace(t, client, baseURL, teammate.Token, owner.Workspace.ID)
	team := getTeam(t, client, baseURL, switched.Token)
	if team.MyRole != "admin" {
		t.Fatalf("expected invited teammate to be admin after switching workspace, got %q", team.MyRole)
	}
	if !teamHasMember(team, "alice", "owner") || !teamHasMember(team, "teammate", "admin") {
		t.Fatalf("expected owner and accepted teammate in team list, got %+v", team.Members)
	}

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/team/invites", map[string]string{"Authorization": "Bearer " + switched.Token}, map[string]any{
		"username": "newowner",
		"role":     "owner",
	})
	if status != http.StatusForbidden {
		t.Fatalf("expected admin inviting owner to be forbidden, got %d: %s", status, string(body))
	}

	status, body = doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/team/members/%d", baseURL, owner.User.ID), map[string]string{"Authorization": "Bearer " + switched.Token}, nil)
	if status != http.StatusForbidden {
		t.Fatalf("expected admin removing owner to be forbidden, got %d: %s", status, string(body))
	}

	guestInvite := createTeamInvite(t, client, baseURL, owner.Token, "guestuser", "member")
	revokeTeamInvite(t, client, baseURL, owner.Token, guestInvite.ID)
	updateTeamMemberRole(t, client, baseURL, owner.Token, teammate.User.ID, "member")
	updatedTeam := getTeam(t, client, baseURL, owner.Token)
	if !teamHasMember(updatedTeam, "teammate", "member") {
		t.Fatalf("expected owner to demote teammate to member, got %+v", updatedTeam.Members)
	}
	removeTeamMember(t, client, baseURL, owner.Token, teammate.User.ID)
	afterRemoval := getTeam(t, client, baseURL, owner.Token)
	if teamHasMember(afterRemoval, "teammate", "member") || teamHasMember(afterRemoval, "teammate", "admin") {
		t.Fatalf("expected teammate to be removed from owner workspace, got %+v", afterRemoval.Members)
	}

	// Error boundary: revoke invite with non-numeric ID.
	ownerHeaders := map[string]string{"Authorization": "Bearer " + owner.Token}
	assertJSONStatus(t, client, http.MethodDelete, baseURL+"/api/team/invites/not-a-number", ownerHeaders, nil, http.StatusBadRequest)

	// Error boundary: revoke non-existent invite.
	assertJSONStatus(t, client, http.MethodDelete, baseURL+"/api/team/invites/99999", ownerHeaders, nil, http.StatusNotFound)

	// Error boundary: update member role with non-numeric user ID.
	assertJSONStatus(t, client, http.MethodPut, baseURL+"/api/team/members/not-a-number", ownerHeaders, map[string]any{"role": "member"}, http.StatusBadRequest)

	// Error boundary: update member role with invalid role string.
	assertJSONStatus(t, client, http.MethodPut, fmt.Sprintf("%s/api/team/members/%d", baseURL, owner.User.ID), ownerHeaders, map[string]any{"role": "superuser"}, http.StatusBadRequest)

	// Error boundary: remove member with non-numeric user ID.
	assertJSONStatus(t, client, http.MethodDelete, baseURL+"/api/team/members/not-a-number", ownerHeaders, nil, http.StatusBadRequest)

	// Error boundary: remove a member that doesn't exist.
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/team/members/%d", baseURL, int64(999999)), ownerHeaders, nil, http.StatusNotFound)

	// Error boundary: invite with empty username.
	assertJSONStatus(t, client, http.MethodPost, baseURL+"/api/team/invites", ownerHeaders, map[string]any{"username": "  ", "role": "member"}, http.StatusBadRequest)

	// Error boundary: update member role with member-level token (non-owner tries to change roles).
	createTeamInvite(t, client, baseURL, owner.Token, "memberonly", "member")
	memberUser := loginSeller(t, client, baseURL, 10004, "memberonly")
	memberSwitched := switchWorkspace(t, client, baseURL, memberUser.Token, owner.Workspace.ID)
	memberHeaders := map[string]string{"Authorization": "Bearer " + memberSwitched.Token}
	// Member (not admin or owner) cannot change roles.
	assertJSONStatus(t, client, http.MethodPut, fmt.Sprintf("%s/api/team/members/%d", baseURL, memberUser.User.ID), memberHeaders, map[string]any{"role": "member"}, http.StatusForbidden)
	// Member cannot revoke invites.
	freshInvite := createTeamInvite(t, client, baseURL, owner.Token, "freshguest", "member")
	assertJSONStatus(t, client, http.MethodDelete, fmt.Sprintf("%s/api/team/invites/%d", baseURL, freshInvite.ID), memberHeaders, nil, http.StatusForbidden)

	// Error boundary: cannot demote the last owner.
	assertJSONStatus(t, client, http.MethodPut, fmt.Sprintf("%s/api/team/members/%d", baseURL, owner.User.ID), ownerHeaders, map[string]any{"role": "admin"}, http.StatusConflict)

	// Error boundary: member cannot invite (not admin/owner)
	assertJSONStatus(t, client, http.MethodPost, baseURL+"/api/team/invites", memberHeaders, map[string]any{"username": "someranduser", "role": "member"}, http.StatusForbidden)

	// Error boundary: member cannot update roles (not admin/owner)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/team/members/%d/role", baseURL, memberUser.User.ID), memberHeaders, map[string]any{"role": "admin"}, http.StatusForbidden)

	// Switch to workspace not a member of
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/workspaces/%d/switch", baseURL, int64(999999)), memberHeaders, map[string]any{}, http.StatusForbidden)
}

func assertProductEventFlow(t *testing.T, client *http.Client, baseURL string, token string, invoicePublicID string) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	assertJSONStatus(t, client, http.MethodPost, baseURL+"/api/events", headers, map[string]any{
		"event_name":        "checkout_viewed",
		"source":            "seller_console",
		"invoice_public_id": invoicePublicID,
		"properties":        map[string]any{"surface": "integration"},
	}, http.StatusNoContent)
	assertJSONStatus(t, client, http.MethodPost, baseURL+"/api/public/events", nil, map[string]any{
		"event_name":        "checkout_opened",
		"source":            "public_checkout",
		"invoice_public_id": invoicePublicID,
		"properties":        map[string]any{"locale": "en"},
	}, http.StatusNoContent)
}

func assertBlogPublishingFlow(t *testing.T, client *http.Client, baseURL string, adminToken string) {
	t.Helper()

	draft := createBlogPost(t, client, baseURL, adminToken, map[string]any{
		"slug":       "draft-post",
		"title":      "Draft post",
		"content_md": "# Draft",
		"status":     "draft",
		"tags":       []string{"ops"},
		"locale":     "en",
	})
	if draft.IsPublished || draft.Status != "draft" {
		t.Fatalf("expected draft blog post, got %+v", draft)
	}
	assertPublicBlogStatus(t, client, baseURL, "draft-post", http.StatusNotFound)

	published := createBlogPost(t, client, baseURL, adminToken, map[string]any{
		"slug":         "published-post",
		"title":        "Published post",
		"content_md":   "# Published",
		"is_published": true,
		"tags":         []string{"release", "ops"},
		"locale":       "en",
	})
	if !published.IsPublished || published.Status != "published" || published.PublishedAt == nil {
		t.Fatalf("expected published blog post with published_at, got %+v", published)
	}

	list := listPublicBlogPosts(t, client, baseURL)
	if list.Total != 1 || len(list.Items) != 1 || list.Items[0].Slug != "published-post" {
		t.Fatalf("expected only published post in public list, got %+v", list)
	}

	publicPost := getPublicBlogPost(t, client, baseURL, "published-post")
	if publicPost.ID != published.ID || publicPost.Title != "Published post" {
		t.Fatalf("unexpected public blog post: %+v", publicPost)
	}

	updated := updateBlogPost(t, client, baseURL, adminToken, draft.ID, map[string]any{
		"slug":       "draft-post",
		"title":      "Draft post published",
		"content_md": "# Draft",
		"status":     "published",
		"tags":       []string{},
		"locale":     "en",
	})
	if !updated.IsPublished || updated.Status != "published" {
		t.Fatalf("expected updated draft to be published, got %+v", updated)
	}

	deleteBlogPost(t, client, baseURL, adminToken, updated.ID)
	assertPublicBlogStatus(t, client, baseURL, "draft-post", http.StatusNotFound)
}

func assertAdminOpsFlow(t *testing.T, client *http.Client, baseURL string, adminToken string, workspaceID int64, invoiceID int64, deliveryID int64, reviewInvoiceID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + adminToken}
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/ops/overview", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/workspaces?limit=10", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/webhooks/failed?limit=10", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/watchers", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/notifications", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/analytics?group_by=network", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/seo-targets", headers, nil, http.StatusOK)
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/blog?page=1&page_size=10", headers, nil, http.StatusOK)

	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/plan", baseURL, workspaceID), headers, map[string]any{
		"plan_code": "business",
		"days":      30,
		"reason":    "integration coverage",
	}, http.StatusOK)

	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/billing-checkout", baseURL, workspaceID), headers, map[string]any{
		"plan_code":       "business",
		"payable_network": "TON",
	}, http.StatusCreated)

	assertJSONStatus(t, client, http.MethodPost, baseURL+"/api/admin/internal-comments", headers, map[string]any{
		"target_type": "invoice",
		"target_id":   fmt.Sprint(invoiceID),
		"body":        "reviewed in integration test",
	}, http.StatusCreated)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/invoices/%d/refresh-status", baseURL, invoiceID), headers, map[string]any{}, http.StatusOK)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/webhook-deliveries/%d/resend", baseURL, deliveryID), headers, map[string]any{}, http.StatusCreated)
	reviewBody := assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/invoices/%d/review", baseURL, reviewInvoiceID), headers, map[string]any{
		"result":  "mark_paid",
		"comment": "late transfer accepted",
	}, http.StatusOK)
	var reviewResponse struct {
		Invoice invoiceResponse `json:"invoice"`
	}
	decodeJSON(t, reviewBody, &reviewResponse)
	if reviewResponse.Invoice.Status != "paid" {
		t.Fatalf("expected admin review to mark invoice paid, got %+v", reviewResponse.Invoice)
	}
	assertJSONStatus(t, client, http.MethodGet, baseURL+"/api/admin/audit-events?limit=20", headers, nil, http.StatusOK)
}

func assertDeveloperAPILifecycle(t *testing.T, client *http.Client, baseURL string, sellerToken string, liveAPIKey string, webhookURL string) {
	t.Helper()

	liveHeaders := map[string]string{"Authorization": "Bearer " + liveAPIKey}
	meBody := assertJSONStatus(t, client, http.MethodGet, baseURL+"/v1/me", liveHeaders, nil, http.StatusOK)
	var apiMe developerMeResponse
	decodeJSON(t, meBody, &apiMe)
	if apiMe.Key.Environment != "live" || apiMe.Key.ID == 0 {
		t.Fatalf("unexpected developer me response: %+v", apiMe)
	}

	idempotencyHeaders := map[string]string{
		"Authorization":    "Bearer " + liveAPIKey,
		"Idempotency-Key":  "invoice-create-1",
		"X-Integration-ID": "developer-lifecycle",
	}
	first := createDeveloperInvoiceWithHeaders(t, client, baseURL, idempotencyHeaders, "Idempotent invoice", "21", "BASE")
	second := createDeveloperInvoiceWithHeaders(t, client, baseURL, idempotencyHeaders, "Idempotent invoice", "21", "BASE")
	if first.ID != second.ID || first.PublicID != second.PublicID {
		t.Fatalf("expected idempotent replay to return same invoice, got %+v and %+v", first, second)
	}
	conflictStatus, conflictBody := doJSON(t, client, http.MethodPost, baseURL+"/v1/invoices", idempotencyHeaders, map[string]any{
		"title":           "Different invoice",
		"base_amount_usd": "22",
		"payable_network": "BASE",
	})
	if conflictStatus != http.StatusConflict {
		t.Fatalf("expected idempotency conflict, got %d: %s", conflictStatus, string(conflictBody))
	}

	list := listDeveloperInvoices(t, client, baseURL, liveAPIKey)
	if list.Total == 0 || len(list.Items) == 0 {
		t.Fatalf("expected developer invoice list to include data, got %+v", list)
	}
	fetched := getDeveloperInvoice(t, client, baseURL, liveAPIKey, first.ID)
	if fetched.ID != first.ID {
		t.Fatalf("expected fetched developer invoice %d, got %+v", first.ID, fetched)
	}
	cancelled := cancelDeveloperInvoice(t, client, baseURL, liveAPIKey, first.ID)
	if cancelled.Status != "expired" {
		t.Fatalf("expected developer invoice cancellation to expire invoice, got %+v", cancelled)
	}

	testKey := createAPIKey(t, client, baseURL, sellerToken, createAPIKeyRequest{Label: "Simulator key", Mode: "test"})
	testInvoice := createDeveloperInvoice(t, client, baseURL, testKey.Secret, "Simulated invoice", "5", "BASE")
	simulated := simulateDeveloperPayment(t, client, baseURL, testKey.Secret, testInvoice.ID)
	if simulated.Status != "paid" {
		t.Fatalf("expected simulated test payment to mark invoice paid, got %+v", simulated)
	}
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/v1/test/invoices/%d/simulate-payment", baseURL, first.ID), liveHeaders, map[string]any{}, http.StatusForbidden)
	// Test-mode key simulating a live invoice → 400 (invoice is not test mode)
	assertJSONStatus(t, client, http.MethodPost, fmt.Sprintf("%s/v1/test/invoices/%d/simulate-payment", baseURL, first.ID), map[string]string{"Authorization": "Bearer " + testKey.Secret}, map[string]any{}, http.StatusBadRequest)

	apiKeys := listAPIKeys(t, client, baseURL, sellerToken)
	if !apiKeysContain(apiKeys, testKey.APIKey.ID) {
		t.Fatalf("expected listed api keys to include test key %d, got %+v", testKey.APIKey.ID, apiKeys)
	}
	deleteAPIKey(t, client, baseURL, sellerToken, testKey.APIKey.ID)

	transientWebhook := createWebhook(t, client, baseURL, sellerToken, webhookURL)
	webhooks := listWebhooks(t, client, baseURL, sellerToken)
	if !webhooksContain(webhooks, transientWebhook.ID) {
		t.Fatalf("expected listed webhooks to include endpoint %d, got %+v", transientWebhook.ID, webhooks)
	}
	rotated := rotateWebhook(t, client, baseURL, sellerToken, transientWebhook.ID)
	if rotated.Secret == "" || rotated.Secret == transientWebhook.Secret {
		t.Fatalf("expected webhook secret rotation to return a new secret, got old=%q new=%q", transientWebhook.Secret, rotated.Secret)
	}
	deleteWebhook(t, client, baseURL, sellerToken, transientWebhook.ID)
}

func assertDeveloperWebhookDeliveryFlow(t *testing.T, client *http.Client, baseURL string, sellerToken string) int64 {
	t.Helper()

	deliveries := listWebhookDeliveries(t, client, baseURL, sellerToken)
	if len(deliveries.Items) == 0 {
		t.Fatal("expected webhook deliveries to be visible in developer console")
	}
	resend := resendWebhookDelivery(t, client, baseURL, sellerToken, deliveries.Items[0].ID)
	if resend.ID == 0 || resend.ID == deliveries.Items[0].ID {
		t.Fatalf("expected webhook resend to create a new delivery, got old=%d new=%d", deliveries.Items[0].ID, resend.ID)
	}
	return deliveries.Items[0].ID
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
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         struct {
		ID       int64  `json:"id"`
		Username string `json:"username"`
	} `json:"user"`
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
	Total int               `json:"total"`
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
	APIKey apiKeyResponse `json:"api_key"`
	Secret string         `json:"secret"`
}

type createAPIKeyRequest struct {
	Label  string   `json:"label"`
	Scopes []string `json:"scopes,omitempty"`
	Mode   string   `json:"mode,omitempty"`
}

type apiKeyResponse struct {
	ID          int64    `json:"id"`
	Label       string   `json:"label"`
	Prefix      string   `json:"prefix"`
	Mode        string   `json:"mode"`
	Environment string   `json:"environment"`
	Scopes      []string `json:"scopes"`
}

type listAPIKeysResponse struct {
	Items []apiKeyResponse `json:"items"`
}

type webhookResponse struct {
	ID     int64  `json:"id"`
	Label  string `json:"label"`
	URL    string `json:"url"`
	Secret string `json:"secret"`
}

type createWebhookResponse struct {
	Webhook webhookResponse `json:"webhook"`
}

type listWebhooksResponse struct {
	Items []webhookResponse `json:"items"`
}

type developerMeResponse struct {
	Key struct {
		ID          int64  `json:"id"`
		Environment string `json:"environment"`
	} `json:"key"`
}

type webhookDeliveryResponse struct {
	ID        int64  `json:"id"`
	EventType string `json:"event_type"`
	Status    string `json:"status"`
}

type listWebhookDeliveriesResponse struct {
	Items []webhookDeliveryResponse `json:"items"`
}

type resendWebhookDeliveryResponse struct {
	Delivery webhookDeliveryResponse `json:"delivery"`
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

type teamInviteResponse struct {
	ID              int64  `json:"id"`
	InvitedUsername string `json:"invited_username"`
	Role            string `json:"role"`
	Status          string `json:"status"`
}

type teamResponse struct {
	Members []struct {
		UserID   int64  `json:"user_id"`
		Username string `json:"username"`
		Role     string `json:"role"`
	} `json:"members"`
	Invites []teamInviteResponse `json:"invites"`
	MyRole  string               `json:"my_role"`
}

type createTeamInviteResponse struct {
	Invite teamInviteResponse `json:"invite"`
}

type blogPostResponse struct {
	ID          int64      `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	ContentMD   string     `json:"content_md"`
	IsPublished bool       `json:"is_published"`
	Status      string     `json:"status"`
	Tags        []string   `json:"tags"`
	Locale      string     `json:"locale"`
	PublishedAt *time.Time `json:"published_at"`
}

type blogListResponse struct {
	Items []blogPostResponse `json:"items"`
	Total int                `json:"total"`
}

func loginSellerWithAttribution(t *testing.T, client *http.Client, baseURL string, telegramID int64, username string, utmSource string) authResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/telegram", nil, map[string]any{
		"telegram_id": telegramID,
		"username":    username,
		"attribution": map[string]any{"utm_source": utmSource},
	})
	if status != http.StatusOK {
		t.Fatalf("expected auth 200, got %d: %s", status, string(body))
	}
	var response authResponse
	decodeJSON(t, body, &response)
	return response
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

func refreshAuthSession(t *testing.T, client *http.Client, baseURL string, refreshToken string) authResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/refresh", nil, map[string]any{
		"refresh_token": refreshToken,
	})
	if status != http.StatusOK {
		t.Fatalf("expected auth refresh 200, got %d: %s", status, string(body))
	}
	var response authResponse
	decodeJSON(t, body, &response)
	return response
}

func logoutAuthSession(t *testing.T, client *http.Client, baseURL string, refreshToken string) {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/logout", nil, map[string]any{
		"refresh_token": refreshToken,
	})
	if status != http.StatusOK {
		t.Fatalf("expected auth logout 200, got %d: %s", status, string(body))
	}
}

func bootstrapAgentWorkspace(t *testing.T, client *http.Client, baseURL string) authResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/auth/agent/bootstrap", nil, map[string]any{
		"workspace_name": "Agent Workspace",
		"contact_email":  "agent@example.test",
		"attribution": map[string]any{
			"utm_source": "integration",
		},
	})
	if status != http.StatusCreated {
		t.Fatalf("expected agent bootstrap 201, got %d: %s", status, string(body))
	}
	var response authResponse
	decodeJSON(t, body, &response)
	return response
}

func createTeamInvite(t *testing.T, client *http.Client, baseURL string, token string, username string, role string) teamInviteResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/team/invites", headers, map[string]any{
		"username": username,
		"role":     role,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create team invite 201, got %d: %s", status, string(body))
	}
	var response createTeamInviteResponse
	decodeJSON(t, body, &response)
	return response.Invite
}

func revokeTeamInvite(t *testing.T, client *http.Client, baseURL string, token string, inviteID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/team/invites/%d", baseURL, inviteID), headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected revoke team invite 200, got %d: %s", status, string(body))
	}
}

func updateTeamMemberRole(t *testing.T, client *http.Client, baseURL string, token string, userID int64, role string) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/team/members/%d/role", baseURL, userID), headers, map[string]any{"role": role})
	if status != http.StatusOK {
		t.Fatalf("expected update team member role 200, got %d: %s", status, string(body))
	}
}

func removeTeamMember(t *testing.T, client *http.Client, baseURL string, token string, userID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/team/members/%d", baseURL, userID), headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected remove team member 200, got %d: %s", status, string(body))
	}
}

func switchWorkspace(t *testing.T, client *http.Client, baseURL string, token string, workspaceID int64) authResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/workspaces/%d/switch", baseURL, workspaceID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected switch workspace 200, got %d: %s", status, string(body))
	}
	var response authResponse
	decodeJSON(t, body, &response)
	if response.Token == "" || response.Workspace.ID != workspaceID {
		t.Fatalf("unexpected switch workspace response: %+v", response)
	}
	return response
}

func getTeam(t *testing.T, client *http.Client, baseURL string, token string) teamResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/team", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected team list 200, got %d: %s", status, string(body))
	}
	var response teamResponse
	decodeJSON(t, body, &response)
	return response
}

func teamHasMember(team teamResponse, username string, role string) bool {
	for _, member := range team.Members {
		if member.Username == username && member.Role == role {
			return true
		}
	}
	return false
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

func deleteWallet(t *testing.T, client *http.Client, baseURL string, token string, walletID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/wallets/%d", baseURL, walletID), headers, nil)
	if status != http.StatusNoContent {
		t.Fatalf("expected delete wallet 204, got %d: %s", status, string(body))
	}
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

func createAPIKey(t *testing.T, client *http.Client, baseURL string, token string, input createAPIKeyRequest) createAPIKeyResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/developer/api-keys", headers, input)
	if status != http.StatusCreated {
		t.Fatalf("expected create api key 201, got %d: %s", status, string(body))
	}
	var response createAPIKeyResponse
	decodeJSON(t, body, &response)
	if response.Secret == "" || response.APIKey.ID == 0 {
		t.Fatalf("expected api key secret and id, got %+v", response)
	}
	return response
}

func listAPIKeys(t *testing.T, client *http.Client, baseURL string, token string) listAPIKeysResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/developer/api-keys", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected list api keys 200, got %d: %s", status, string(body))
	}
	var response listAPIKeysResponse
	decodeJSON(t, body, &response)
	return response
}

func apiKeysContain(response listAPIKeysResponse, id int64) bool {
	for _, item := range response.Items {
		if item.ID == id {
			return true
		}
	}
	return false
}

func deleteAPIKey(t *testing.T, client *http.Client, baseURL string, token string, keyID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/developer/api-keys/%d", baseURL, keyID), headers, nil)
	if status != http.StatusNoContent {
		t.Fatalf("expected delete api key 204, got %d: %s", status, string(body))
	}
}

func createWebhook(t *testing.T, client *http.Client, baseURL string, token string, endpointURL string) webhookResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/developer/webhooks", headers, map[string]any{
		"label": "Integration webhook",
		"url":   endpointURL,
	})
	if status != http.StatusCreated {
		t.Fatalf("expected create webhook 201, got %d: %s", status, string(body))
	}
	var response createWebhookResponse
	decodeJSON(t, body, &response)
	if response.Webhook.ID == 0 || response.Webhook.Secret == "" {
		t.Fatalf("expected webhook id and secret, got %+v", response)
	}
	return response.Webhook
}

func listWebhooks(t *testing.T, client *http.Client, baseURL string, token string) listWebhooksResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/developer/webhooks", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected list webhooks 200, got %d: %s", status, string(body))
	}
	var response listWebhooksResponse
	decodeJSON(t, body, &response)
	return response
}

func webhooksContain(response listWebhooksResponse, id int64) bool {
	for _, item := range response.Items {
		if item.ID == id {
			return true
		}
	}
	return false
}

func rotateWebhook(t *testing.T, client *http.Client, baseURL string, token string, endpointID int64) webhookResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/developer/webhooks/%d/rotate-secret", baseURL, endpointID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected rotate webhook 200, got %d: %s", status, string(body))
	}
	var response createWebhookResponse
	decodeJSON(t, body, &response)
	return response.Webhook
}

func deleteWebhook(t *testing.T, client *http.Client, baseURL string, token string, endpointID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/developer/webhooks/%d", baseURL, endpointID), headers, nil)
	if status != http.StatusNoContent {
		t.Fatalf("expected delete webhook 204, got %d: %s", status, string(body))
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

	return createDeveloperInvoiceWithHeaders(t, client, baseURL, map[string]string{"Authorization": "Bearer " + apiKey}, title, amount, network)
}

func createDeveloperInvoiceWithHeaders(t *testing.T, client *http.Client, baseURL string, headers map[string]string, title string, amount string, network string) invoiceResponse {
	t.Helper()

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

func listDeveloperInvoices(t *testing.T, client *http.Client, baseURL string, apiKey string) listInvoicesResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + apiKey}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/v1/invoices?page=1&page_size=10", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected developer list invoices 200, got %d: %s", status, string(body))
	}
	var response listInvoicesResponse
	decodeJSON(t, body, &response)
	return response
}

func getDeveloperInvoice(t *testing.T, client *http.Client, baseURL string, apiKey string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + apiKey}
	status, body := doJSON(t, client, http.MethodGet, fmt.Sprintf("%s/v1/invoices/%d", baseURL, invoiceID), headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected developer get invoice 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func cancelDeveloperInvoice(t *testing.T, client *http.Client, baseURL string, apiKey string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + apiKey}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/v1/invoices/%d/cancel", baseURL, invoiceID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected developer cancel invoice 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func simulateDeveloperPayment(t *testing.T, client *http.Client, baseURL string, apiKey string, invoiceID int64) invoiceResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + apiKey}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/v1/test/invoices/%d/simulate-payment", baseURL, invoiceID), headers, map[string]any{})
	if status != http.StatusOK {
		t.Fatalf("expected developer simulate payment 200, got %d: %s", status, string(body))
	}
	var invoice invoiceResponse
	decodeJSON(t, body, &invoice)
	return invoice
}

func listWebhookDeliveries(t *testing.T, client *http.Client, baseURL string, token string) listWebhookDeliveriesResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/developer/webhook-deliveries?limit=20", headers, nil)
	if status != http.StatusOK {
		t.Fatalf("expected list webhook deliveries 200, got %d: %s", status, string(body))
	}
	var response listWebhookDeliveriesResponse
	decodeJSON(t, body, &response)
	return response
}

func resendWebhookDelivery(t *testing.T, client *http.Client, baseURL string, token string, deliveryID int64) webhookDeliveryResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/developer/webhook-deliveries/%d/resend", baseURL, deliveryID), headers, map[string]any{})
	if status != http.StatusCreated {
		t.Fatalf("expected resend webhook delivery 201, got %d: %s", status, string(body))
	}
	var response resendWebhookDeliveryResponse
	decodeJSON(t, body, &response)
	return response.Delivery
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

func setAdminWorkspaceBlocked(t *testing.T, client *http.Client, baseURL string, adminToken string, workspaceID int64, blocked bool) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + adminToken}
	status, body := doJSON(t, client, http.MethodPost, fmt.Sprintf("%s/api/admin/workspaces/%d/block", baseURL, workspaceID), headers, map[string]any{
		"blocked": blocked,
		"reason":  "integration coverage",
	})
	if status != http.StatusOK {
		t.Fatalf("expected admin block workspace 200, got %d: %s", status, string(body))
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

func createBlogPost(t *testing.T, client *http.Client, baseURL string, token string, payload map[string]any) blogPostResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPost, baseURL+"/api/admin/blog", headers, payload)
	if status != http.StatusCreated {
		t.Fatalf("expected create blog post 201, got %d: %s", status, string(body))
	}
	var response blogPostResponse
	decodeJSON(t, body, &response)
	return response
}

func updateBlogPost(t *testing.T, client *http.Client, baseURL string, token string, postID int64, payload map[string]any) blogPostResponse {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodPut, fmt.Sprintf("%s/api/admin/blog/%d", baseURL, postID), headers, payload)
	if status != http.StatusOK {
		t.Fatalf("expected update blog post 200, got %d: %s", status, string(body))
	}
	var response blogPostResponse
	decodeJSON(t, body, &response)
	return response
}

func deleteBlogPost(t *testing.T, client *http.Client, baseURL string, token string, postID int64) {
	t.Helper()

	headers := map[string]string{"Authorization": "Bearer " + token}
	status, body := doJSON(t, client, http.MethodDelete, fmt.Sprintf("%s/api/admin/blog/%d", baseURL, postID), headers, nil)
	if status != http.StatusNoContent {
		t.Fatalf("expected delete blog post 204, got %d: %s", status, string(body))
	}
}

func listPublicBlogPosts(t *testing.T, client *http.Client, baseURL string) blogListResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/public/blog", nil, nil)
	if status != http.StatusOK {
		t.Fatalf("expected public blog list 200, got %d: %s", status, string(body))
	}
	var response blogListResponse
	decodeJSON(t, body, &response)
	return response
}

func getPublicBlogPost(t *testing.T, client *http.Client, baseURL string, slug string) blogPostResponse {
	t.Helper()

	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/public/blog/"+slug, nil, nil)
	if status != http.StatusOK {
		t.Fatalf("expected public blog post 200, got %d: %s", status, string(body))
	}
	var response blogPostResponse
	decodeJSON(t, body, &response)
	return response
}

func assertPublicBlogStatus(t *testing.T, client *http.Client, baseURL string, slug string, expectedStatus int) {
	t.Helper()

	status, body := doJSON(t, client, http.MethodGet, baseURL+"/api/public/blog/"+slug, nil, nil)
	if status != expectedStatus {
		t.Fatalf("expected public blog status %d, got %d: %s", expectedStatus, status, string(body))
	}
}

func assertJSONStatus(t *testing.T, client *http.Client, method string, url string, headers map[string]string, payload any, expectedStatus int) []byte {
	t.Helper()

	status, body := doJSON(t, client, method, url, headers, payload)
	if status != expectedStatus {
		t.Fatalf("expected %s %s status %d, got %d: %s", method, url, expectedStatus, status, string(body))
	}
	return body
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
