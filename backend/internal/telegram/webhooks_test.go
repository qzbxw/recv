package telegram

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/store"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
)

func TestWebhookSignature(t *testing.T) {
	payload := []byte(`{"id":"evt_1"}`)
	got := webhookSignature(" secret ", "1700000000", payload)

	mac := hmac.New(sha256.New, []byte("secret"))
	_, _ = mac.Write([]byte("1700000000"))
	_, _ = mac.Write([]byte("."))
	_, _ = mac.Write(payload)
	want := "v1=" + hex.EncodeToString(mac.Sum(nil))

	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestSendWebhookDelivery(t *testing.T) {
	payload := []byte(`{"type":"invoice.paid"}`)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("unexpected method: %s", r.Method)
		}
		if r.Header.Get("X-Reqst-Event") != "invoice.paid" {
			t.Fatalf("unexpected event header: %q", r.Header.Get("X-Reqst-Event"))
		}
		if r.Header.Get("X-Reqst-Timestamp") == "" {
			t.Fatal("expected timestamp header")
		}
		if !strings.HasPrefix(r.Header.Get("X-Reqst-Signature"), "v1=") {
			t.Fatalf("unexpected signature header: %q", r.Header.Get("X-Reqst-Signature"))
		}
		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Fatalf("ReadAll returned error: %v", err)
		}
		if string(body) != string(payload) {
			t.Fatalf("unexpected request body: %s", string(body))
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer server.Close()

	worker := &BotWorker{
		httpClient: &http.Client{Timeout: 2 * time.Second},
	}

	result := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_123", "invoice.paid", payload)
	if result.Error != "" {
		t.Fatalf("sendWebhookDelivery returned error: %v", result.Error)
	}
	if result.StatusCode != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", result.StatusCode)
	}
}

func TestSendWebhookDeliveryReturnsHTTPFailureStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "boom", http.StatusBadGateway)
	}))
	defer server.Close()

	worker := &BotWorker{
		httpClient: &http.Client{Timeout: 2 * time.Second},
	}

	result := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_123", "invoice.failed", []byte(`{}`))
	if result.Error != "" {
		t.Fatalf("sendWebhookDelivery returned unexpected error: %v", result.Error)
	}
	if result.StatusCode != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", result.StatusCode)
	}
	if !strings.Contains(result.ResponseSnippet, "boom") {
		t.Fatalf("expected response snippet to contain boom, got %q", result.ResponseSnippet)
	}
}

func TestFlushWebhookDeliveriesEmptyIsNoOp(t *testing.T) {
	// Arrange: a store with no pending deliveries
	ctx := context.Background()
	st := newWebhookTestStore(t, ctx)
	worker := &BotWorker{
		store:      st,
		httpClient: &http.Client{Timeout: 2 * time.Second},
	}

	// Act & Assert: flush with nothing pending must not error
	if err := worker.flushWebhookDeliveries(ctx); err != nil {
		t.Fatalf("flushWebhookDeliveries with empty store returned error: %v", err)
	}
}

func TestFlushWebhookDeliveriesSuccessfulDelivery(t *testing.T) {
	ctx := context.Background()
	st := newWebhookTestStore(t, ctx)

	// Arrange: a workspace and webhook endpoint with a queued delivery.
	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 12345, "webhooktest")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	received := make(chan struct{}, 1)
	targetServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		received <- struct{}{}
		w.WriteHeader(http.StatusOK)
	}))
	defer targetServer.Close()

	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "test-endpoint", targetServer.URL, "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	// Insert a delivery directly via RawPool since the public API enqueues through payment flow.
	payload := []byte(`{"event":"invoice.paid"}`)
	_, err = st.RawPool().Exec(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, endpoint.ID, workspace.ID, "invoice.paid", payload, 3, "evt_test_flush_1")
	if err != nil {
		t.Fatalf("insert webhook delivery: %v", err)
	}

	worker := &BotWorker{
		store:      st,
		httpClient: targetServer.Client(),
	}

	// Act
	if err := worker.flushWebhookDeliveries(ctx); err != nil {
		t.Fatalf("flushWebhookDeliveries returned error: %v", err)
	}

	// Assert: the target server received the delivery
	select {
	case <-received:
	default:
		t.Fatal("expected webhook target server to receive delivery")
	}
}

func TestFlushWebhookDeliveriesFailedDelivery(t *testing.T) {
	ctx := context.Background()
	st := newWebhookTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 54321, "failwebhooktest")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Target server returns 500
	failServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "internal error", http.StatusInternalServerError)
	}))
	defer failServer.Close()

	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "fail-endpoint", failServer.URL, "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	payload := []byte(`{"event":"invoice.paid"}`)
	_, err = st.RawPool().Exec(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, endpoint.ID, workspace.ID, "invoice.paid", payload, 3, "evt_fail_flush_1")
	if err != nil {
		t.Fatalf("insert webhook delivery: %v", err)
	}

	worker := &BotWorker{
		store:      st,
		httpClient: failServer.Client(),
	}

	// Act: flush should process the delivery and mark it failed
	if err := worker.flushWebhookDeliveries(ctx); err != nil {
		t.Fatalf("flushWebhookDeliveries returned error: %v", err)
	}

	// Assert: delivery should now be failed/dead
	var status string
	err = st.RawPool().QueryRow(ctx, `SELECT status FROM webhook_deliveries WHERE event_id = $1`, "evt_fail_flush_1").Scan(&status)
	if err != nil {
		t.Fatalf("read delivery status: %v", err)
	}
	if status != "failed" && status != "dead" {
		t.Fatalf("expected failed/dead status after HTTP 500, got %q", status)
	}
}

func TestFlushWebhookDeliveriesConnectionError(t *testing.T) {
	ctx := context.Background()
	st := newWebhookTestStore(t, ctx)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 54322, "connfailtest")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Target server that immediately closes (connection refused)
	closedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	closedServerURL := closedServer.URL
	closedServer.Close() // Close immediately so requests fail

	endpoint, err := st.CreateWebhookEndpoint(ctx, workspace.ID, "closed-endpoint", closedServerURL, "whsec_test", "live")
	if err != nil {
		t.Fatalf("CreateWebhookEndpoint: %v", err)
	}

	payload := []byte(`{"event":"invoice.paid"}`)
	_, err = st.RawPool().Exec(ctx, `
		INSERT INTO webhook_deliveries (endpoint_id, workspace_id, event_type, payload, max_attempts, event_id)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, endpoint.ID, workspace.ID, "invoice.paid", payload, 3, "evt_conn_fail_1")
	if err != nil {
		t.Fatalf("insert webhook delivery: %v", err)
	}

	worker := &BotWorker{
		store:      st,
		httpClient: &http.Client{Timeout: time.Second},
	}

	// Act: should handle connection error gracefully
	if err := worker.flushWebhookDeliveries(ctx); err != nil {
		t.Fatalf("flushWebhookDeliveries returned error on connection failure: %v", err)
	}

	// Assert: delivery is marked failed
	var status string
	err = st.RawPool().QueryRow(ctx, `SELECT status FROM webhook_deliveries WHERE event_id = $1`, "evt_conn_fail_1").Scan(&status)
	if err != nil {
		t.Fatalf("read delivery status: %v", err)
	}
	if status != "failed" && status != "dead" {
		t.Fatalf("expected failed/dead status after connection error, got %q", status)
	}
}

func newWebhookTestStore(t *testing.T, ctx context.Context) *store.Store {
	t.Helper()

	port := pickWebhookTestPort(t)
	baseDir := t.TempDir()
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("reqst").
		Username("reqst").
		Password("reqst").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(filepath.Join(os.TempDir(), "reqst-embedded-postgres-cache")).
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
	return st
}

func pickWebhookTestPort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()
	return uint32(listener.Addr().(*net.TCPAddr).Port)
}
