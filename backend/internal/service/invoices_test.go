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

func TestInvoiceServiceGRAMRateUSDUsesOverride(t *testing.T) {
	service := NewInvoiceService(nil, "4.25")

	rate, err := service.gramRateUSD(context.Background())
	if err != nil {
		t.Fatalf("gramRateUSD returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("4.25")) {
		t.Fatalf("expected rate 4.25, got %s", rate)
	}
}

func TestInvoiceServiceGRAMRateUSDRejectsInvalidOverride(t *testing.T) {
	service := NewInvoiceService(nil, "abc")

	_, err := service.gramRateUSD(context.Background())
	if err == nil || !strings.Contains(err.Error(), "GRAM_USD_RATE") {
		t.Fatalf("expected invalid override error, got %v", err)
	}
}

func TestInvoiceServiceGRAMRateUSDFetchesFromUpstream(t *testing.T) {
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

	rate, err := service.gramRateUSD(context.Background())
	if err != nil {
		t.Fatalf("gramRateUSD returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("3.75")) {
		t.Fatalf("expected rate 3.75, got %s", rate)
	}
}

func TestInvoiceServiceNativeRateUSDUsesNonTONOverride(t *testing.T) {
	t.Setenv("SOL_USD_RATE", "123.45")
	service := NewInvoiceService(nil, "")

	rate, err := service.nativeRateUSD(context.Background(), store.AssetSOL)
	if err != nil {
		t.Fatalf("nativeRateUSD SOL returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("123.45")) {
		t.Fatalf("expected SOL rate 123.45, got %s", rate)
	}
}

func TestInvoiceServiceNativeRateUSDFetchesBNBFromUpstream(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("ids") != "binancecoin" {
			t.Fatalf("unexpected ids query: %s", r.URL.RawQuery)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"binancecoin":{"usd":612.34}}`))
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	rate, err := service.nativeRateUSD(context.Background(), store.AssetBNB)
	if err != nil {
		t.Fatalf("nativeRateUSD BNB returned error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("612.34")) {
		t.Fatalf("expected BNB rate 612.34, got %s", rate)
	}
}

func TestNormalizePaymentOptionInputsAllowsMoreThanTwoOptions(t *testing.T) {
	service := NewInvoiceService(nil, "")

	options, err := service.normalizePaymentOptionInputs(store.NetworkTON, "", "", []PaymentOptionInput{
		{Network: store.NetworkTON, Asset: store.AssetGRAM},
		{Network: store.NetworkTRON, Asset: store.AssetUSDT},
		{Network: store.NetworkBASE, Asset: store.AssetUSDC},
	})
	if err != nil {
		t.Fatalf("normalizePaymentOptionInputs returned error: %v", err)
	}
	if len(options) != 3 {
		t.Fatalf("expected three payment options, got %#v", options)
	}
}

func TestNormalizePaymentOptionInputsConvertsLegacyTONUSDT(t *testing.T) {
	service := NewInvoiceService(nil, "")

	options, err := service.normalizePaymentOptionInputs(store.NetworkTON, store.NetworkTON_USDT, "", nil)
	if err != nil {
		t.Fatalf("normalizePaymentOptionInputs returned error: %v", err)
	}
	if len(options) != 1 || options[0].Network != store.NetworkTON || options[0].Asset != store.AssetUSDT {
		t.Fatalf("expected legacy TON_USDT to normalize to TON/USDT, got %#v", options)
	}
}

func TestNormalizePaymentOptionInputsRejectsMoreThanSupportedOptions(t *testing.T) {
	service := NewInvoiceService(nil, "")
	requested := make([]PaymentOptionInput, maxSupportedPaymentOptions()+1)

	_, err := service.normalizePaymentOptionInputs(store.NetworkTON, "", "", requested)
	if err == nil || !strings.Contains(err.Error(), "payment_options must contain 1 to") {
		t.Fatalf("expected payment option count error, got %v", err)
	}
}

func TestInvoiceServiceNativeRateUSDUsesFreshCacheWithoutRefetch(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"the-open-network":{"usd":3.75}}`))
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	for i := 0; i < 3; i++ {
		rate, err := service.gramRateUSD(context.Background())
		if err != nil {
			t.Fatalf("gramRateUSD call %d returned error: %v", i, err)
		}
		if !rate.Equal(decimal.RequireFromString("3.75")) {
			t.Fatalf("expected rate 3.75 on call %d, got %s", i, rate)
		}
	}
	if calls != 1 {
		t.Fatalf("expected a single upstream fetch with a fresh cache, got %d", calls)
	}
}

func TestInvoiceServiceNativeRateUSDServesBoundedStaleCacheOnUpstreamFailure(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		if calls == 1 {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`{"the-open-network":{"usd":3.75}}`))
			return
		}
		http.Error(w, "rate limit", http.StatusTooManyRequests)
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	if _, err := service.gramRateUSD(context.Background()); err != nil {
		t.Fatalf("initial gramRateUSD returned error: %v", err)
	}

	// Age the cache past the fresh window but inside the stale bound.
	service.rateMu.Lock()
	entry := service.rateCache[store.AssetGRAM]
	entry.fetchedAt = time.Now().Add(-rateCacheFreshFor - time.Minute)
	service.rateCache[store.AssetGRAM] = entry
	service.rateMu.Unlock()

	rate, err := service.gramRateUSD(context.Background())
	if err != nil {
		t.Fatalf("expected stale-cache fallback, got error: %v", err)
	}
	if !rate.Equal(decimal.RequireFromString("3.75")) {
		t.Fatalf("expected stale cached rate 3.75, got %s", rate)
	}
	if calls != 2 {
		t.Fatalf("expected one refresh attempt before stale fallback, got %d calls", calls)
	}

	// Age the cache past the stale bound: the upstream failure must surface.
	service.rateMu.Lock()
	entry = service.rateCache[store.AssetGRAM]
	entry.fetchedAt = time.Now().Add(-rateCacheMaxStale - time.Minute)
	service.rateCache[store.AssetGRAM] = entry
	service.rateMu.Unlock()

	if _, err := service.gramRateUSD(context.Background()); err == nil || !strings.Contains(err.Error(), "rate limit") {
		t.Fatalf("expected upstream error past the stale bound, got %v", err)
	}
}

func TestInvoiceServiceGRAMRateUSDHandlesUpstreamError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "rate limit", http.StatusTooManyRequests)
	}))
	defer server.Close()

	service := NewInvoiceService(nil, "")
	service.httpClient = rewriteHTTPClient(t, server)

	_, err := service.gramRateUSD(context.Background())
	if err == nil || !strings.Contains(err.Error(), "rate limit") {
		t.Fatalf("expected upstream error, got %v", err)
	}
}

func TestInvoiceServiceCalculateGRAMAmountRejectsNonPositiveRate(t *testing.T) {
	service := NewInvoiceService(nil, "0")

	_, err := service.calculateGRAMAmount(context.Background(), decimal.RequireFromString("10"))
	if err == nil || !strings.Contains(err.Error(), "invalid GRAM/USD rate") {
		t.Fatalf("expected invalid rate error, got %v", err)
	}
}

func TestRateConfig(t *testing.T) {
	cases := []struct {
		asset       store.PaymentAsset
		envName     string
		coinGeckoID string
		payloadKey  string
		metricName  string
	}{
		{store.AssetGRAM, "GRAM_USD_RATE", "the-open-network", "the-open-network", "ton_rate"},
		{store.AssetSOL, "SOL_USD_RATE", "solana", "solana", "sol_rate"},
		{store.AssetBNB, "BNB_USD_RATE", "binancecoin", "binancecoin", "bnb_rate"},
	}
	for _, tc := range cases {
		envName, coinGeckoID, payloadKey, metricName, err := rateConfig(tc.asset)
		if err != nil {
			t.Fatalf("rateConfig(%s): %v", tc.asset, err)
		}
		if envName != tc.envName || coinGeckoID != tc.coinGeckoID || payloadKey != tc.payloadKey || metricName != tc.metricName {
			t.Fatalf("rateConfig(%s) = (%q,%q,%q,%q); want (%q,%q,%q,%q)",
				tc.asset, envName, coinGeckoID, payloadKey, metricName, tc.envName, tc.coinGeckoID, tc.payloadKey, tc.metricName)
		}
	}

	if _, _, _, _, err := rateConfig(store.AssetUSDT); err == nil {
		t.Fatal("expected stablecoin asset to reject native rate config")
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
