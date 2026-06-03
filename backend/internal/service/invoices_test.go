package service

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

func TestInvoiceServiceTONRateUSDUsesOverride(t *testing.T) {
	service := NewInvoiceService(nil, "4.25")

	rate, err := service.tonRateUSD(context.Background())
	if err != nil {
		t.Fatalf("tonRateUSD returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("4.25")) {
		t.Fatalf("expected rate 4.25, got %s", rate)
	}
}

func TestInvoiceServiceTONRateUSDRejectsInvalidOverride(t *testing.T) {
	service := NewInvoiceService(nil, "abc")

	_, err := service.tonRateUSD(context.Background())
	if err == nil || !strings.Contains(err.Error(), "TON_USD_RATE") {
		t.Fatalf("expected invalid override error, got %v", err)
	}
}

func TestInvoiceServiceTONRateUSDFetchesFromUpstream(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v3/simple/price" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"the-open-network":{"usd":3.75}}`))
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	rate, err := service.tonRateUSD(context.Background())
	if err != nil {
		t.Fatalf("tonRateUSD returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("3.75")) {
		t.Fatalf("expected rate 3.75, got %s", rate)
	}
}

func TestInvoiceServiceTONRateUSDHandlesUpstreamError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "rate limit", http.StatusTooManyRequests)
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	_, err := service.tonRateUSD(context.Background())
	if err == nil || !strings.Contains(err.Error(), "rate limit") {
		t.Fatalf("expected upstream error, got %v", err)
	}
}

func TestInvoiceServiceCalculateTONAmountRejectsNonPositiveRate(t *testing.T) {
	service := NewInvoiceService(nil, "0")

	_, err := service.calculateTONAmount(context.Background(), decimal.RequireFromString("10"))
	if err == nil || !strings.Contains(err.Error(), "invalid TON/USD rate") {
		t.Fatalf("expected invalid rate error, got %v", err)
	}
}

type rewriteTransport struct {
	base   http.RoundTripper
	target *url.URL
}

func (t rewriteTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	clone := req.Clone(req.Context())
	clone.URL.Scheme = t.target.Scheme
	clone.URL.Host = t.target.Host
	clone.Host = t.target.Host
	return t.base.RoundTrip(clone)
}

func rewriteHTTPClient(t *testing.T, server *httptest.Server) *http.Client {
	t.Helper()

	target, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}
	return &http.Client{
		Timeout: 2 * time.Second,
		Transport: rewriteTransport{
			base:   server.Client().Transport,
			target: target,
		},
	}
}

func TestNormalizedMode(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"test", "test"},
		{"TEST", "test"},
		{" Test ", "test"},
		{"live", "live"},
		{"", "live"},
		{"other", "live"},
		{"production", "live"},
	}
	for _, tc := range cases {
		if got := normalizedMode(tc.input); got != tc.want {
			t.Errorf("normalizedMode(%q) = %q; want %q", tc.input, got, tc.want)
		}
	}
}

func TestCreateInvoiceRejectsBlockedWorkspace(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1, IsBlocked: true}
	input := CreateInvoiceInput{
		Title:          "Order",
		BaseAmountUSD:  decimal.RequireFromString("10"),
		PayableNetwork: store.NetworkTRON,
	}
	_, err := svc.CreateInvoice(context.Background(), workspace, input)
	if err == nil || !strings.Contains(err.Error(), "blocked") {
		t.Fatalf("expected blocked workspace error, got %v", err)
	}
}

func TestCreateInvoiceRequiresTitle(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1}
	input := CreateInvoiceInput{
		BaseAmountUSD:  decimal.RequireFromString("10"),
		PayableNetwork: store.NetworkTRON,
	}
	_, err := svc.CreateInvoice(context.Background(), workspace, input)
	if err == nil || !strings.Contains(err.Error(), "title is required") {
		t.Fatalf("expected title required error, got %v", err)
	}
}

func TestCreateInvoiceRequiresPositiveAmount(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1}
	input := CreateInvoiceInput{
		Title:          "Order",
		BaseAmountUSD:  decimal.Zero,
		PayableNetwork: store.NetworkTRON,
	}
	_, err := svc.CreateInvoice(context.Background(), workspace, input)
	if err == nil || !strings.Contains(err.Error(), "must be positive") {
		t.Fatalf("expected positive amount error, got %v", err)
	}
}

func TestCreateInvoiceRejectsUnsupportedNetwork(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1}
	input := CreateInvoiceInput{
		Title:          "Order",
		BaseAmountUSD:  decimal.RequireFromString("10"),
		PayableNetwork: store.Network("DOGE"),
	}
	_, err := svc.CreateInvoice(context.Background(), workspace, input)
	if err == nil || !strings.Contains(err.Error(), "unsupported network") {
		t.Fatalf("expected unsupported network error, got %v", err)
	}
}

func TestCreateInvoiceEnforcesTrialLimit(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{
		ID:               1,
		FreeInvoicesUsed: TrialInvoiceLimit,
	}
	input := CreateInvoiceInput{
		Title:          "Order",
		BaseAmountUSD:  decimal.RequireFromString("10"),
		PayableNetwork: store.NetworkTRON,
	}
	_, err := svc.CreateInvoice(context.Background(), workspace, input)
	if err == nil || !strings.Contains(err.Error(), "trial limit reached") {
		t.Fatalf("expected trial limit error, got %v", err)
	}
}

func TestCreatePlanInvoiceRejectsBlockedWorkspace(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1, IsBlocked: true}
	_, err := svc.CreatePlanInvoice(context.Background(), workspace, store.PlanCodeMerchant, store.NetworkTRON)
	if err == nil || !strings.Contains(err.Error(), "blocked") {
		t.Fatalf("expected blocked workspace error, got %v", err)
	}
}

func TestCreatePlanInvoiceRejectsTrialPlan(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1}
	_, err := svc.CreatePlanInvoice(context.Background(), workspace, store.PlanCodeTrial, store.NetworkTRON)
	if err == nil || !strings.Contains(err.Error(), "trial") {
		t.Fatalf("expected trial plan rejected, got %v", err)
	}
}

func TestCreatePlanInvoiceRejectsUnsupportedNetwork(t *testing.T) {
	svc := NewInvoiceService(nil, "4.00")
	workspace := store.Workspace{ID: 1}
	_, err := svc.CreatePlanInvoice(context.Background(), workspace, store.PlanCodeMerchant, store.Network("DOGE"))
	if err == nil || !strings.Contains(err.Error(), "unsupported network") {
		t.Fatalf("expected unsupported network error, got %v", err)
	}
}
