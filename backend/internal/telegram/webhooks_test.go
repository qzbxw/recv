package telegram

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
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

	statusCode, err := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_123", "invoice.paid", payload)
	if err != nil {
		t.Fatalf("sendWebhookDelivery returned error: %v", err)
	}
	if statusCode != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", statusCode)
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

	statusCode, err := worker.sendWebhookDelivery(context.Background(), server.URL, "whsec_123", "invoice.failed", []byte(`{}`))
	if err != nil {
		t.Fatalf("sendWebhookDelivery returned unexpected error: %v", err)
	}
	if statusCode != http.StatusBadGateway {
		t.Fatalf("expected 502, got %d", statusCode)
	}
}
