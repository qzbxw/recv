package metrics

import (
	"context"
	"log/slog"
	"os"
	"testing"
	"time"
)

func TestSourceContextHelpers(t *testing.T) {
	if got := SourceFromContext(nil); got != "unknown" {
		t.Fatalf("expected unknown source for nil context, got %q", got)
	}

	ctx := WithSource(context.Background(), " Seller_API ")
	if got := SourceFromContext(ctx); got != "seller_api" {
		t.Fatalf("expected normalized source seller_api, got %q", got)
	}
}

func TestNormalizeHelpers(t *testing.T) {
	if got := normalizeRoute(""); got != "unmatched" {
		t.Fatalf("expected unmatched route, got %q", got)
	}
	if got := normalizeRoute(" /healthz "); got != "/healthz" {
		t.Fatalf("expected /healthz, got %q", got)
	}
	if got := normalize(" Admin ", "unknown"); got != "admin" {
		t.Fatalf("expected admin, got %q", got)
	}
	if got := normalize("   ", "fallback"); got != "fallback" {
		t.Fatalf("expected fallback, got %q", got)
	}
}

func TestMetricEntryPointsDoNotPanic(t *testing.T) {
	Init("api", "test")
	if Handler() == nil {
		t.Fatal("expected metrics handler")
	}

	ObserveHTTPRequest("GET", "/healthz", 200, 15*time.Millisecond)
	IncAuthAttempt("telegram", "success", "authenticated")
	IncInvoiceOperation("create", "seller_api", "merchant", "ton", "trial", "success", "created")
	IncInvoiceTransition("watcher", "merchant", "awaiting_payment", "paid", "paid_exact")
	ObservePayment("watcher", "ton", "paid_exact", "paid", true, 1.5)
	IncLimitDecision("api_rate_limit", "denied", "minute")
	IncResourceOperation("wallet", "create", "success")
	IncAdminOperation("grant_pro", "success")
	IncDeliveryEvent("telegram", "send", "success")
	ObserveBatch("watcher_transfers", "watcher", 3)
	ObserveWatcherPoll("ton", "success", 10*time.Millisecond, 1)
	ObserveRPC("evm", "base", "eth_getLogs", "success", 8*time.Millisecond)
	ObserveUpstream("coingecko", "ton_rate", "success", 12*time.Millisecond)
}

func TestStartServerReturnsServer(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	server := StartServer(ctx, "127.0.0.1:0", slog.New(slog.NewTextHandler(os.Stdout, nil)))
	if server == nil {
		t.Fatal("expected metrics server instance")
	}
	cancel()
}
