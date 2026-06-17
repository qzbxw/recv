package watcher

import (
	"context"
	"encoding/json"
	"errors"
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

	"recv/backend/internal/config"
	"recv/backend/internal/service"
	"recv/backend/internal/store"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/shopspring/decimal"
)

func TestWatcherRunExitsOnContextCancel(t *testing.T) {
	// Arrange: use a real store so tick's DB calls have a valid connection.
	ctx, cancel := context.WithCancel(context.Background())
	st := newWatcherTestStore(t, context.Background())
	paymentSvc := service.NewPaymentService(st)

	w := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 5 * time.Millisecond,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    "https://toncenter.test",
		TronGridBaseURL:     "https://api.trongrid.io",
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	done := make(chan error, 1)
	go func() {
		done <- w.Run(ctx)
	}()

	// Cancel the context after a short pause to let the first tick run.
	time.Sleep(50 * time.Millisecond)
	cancel()

	select {
	case err := <-done:
		if err == nil || !errors.Is(err, context.Canceled) {
			t.Fatalf("expected context.Canceled from Run, got %v", err)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("Run did not exit within 5 seconds after context cancel")
	}
}

func TestWatcherNew(t *testing.T) {
	// Arrange
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	cfg := config.Config{
		WatcherPollInterval: 20 * time.Second,
		TonCenterBaseURL:    "https://toncenter.com/api/v2",
		TronGridBaseURL:     "https://api.trongrid.io",
	}
	logger := slog.New(slog.NewTextHandler(io.Discard, nil))

	// Act
	w := New(st, nil, cfg, logger)

	// Assert
	if w == nil {
		t.Fatal("expected New to return a non-nil watcher")
	}
}

func TestWatcherTickWithNoWallets(t *testing.T) {
	// Arrange: store with no active invoices means no watched wallets to poll
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)
	w := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 20 * time.Second,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    "https://toncenter.com/api/v2",
		TronGridBaseURL:     "https://api.trongrid.io",
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	// Act: tick should be a no-op when there are no wallets to watch
	if err := w.tick(ctx); err != nil {
		t.Fatalf("tick with no wallets returned error: %v", err)
	}
}

func TestWatcherTickWithActiveTONInvoice(t *testing.T) {
	// Arrange: set up a TON wallet with an active invoice so the watcher exercises pollTON
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)

	tonServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok":     true,
			"result": []any{},
		})
	}))
	defer tonServer.Close()

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 80001, "watchertickuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	comment := "RECV-TICK001"
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Tick Test",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("2.5"),
		PaymentComment:     &comment,
		PublicID:           "TICK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	watcher := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 20 * time.Second,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    tonServer.URL,
		TronGridBaseURL:     "https://api.trongrid.io",
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	// Act: tick should poll the TON wallet and return no transfers (empty result)
	if err := watcher.tick(ctx); err != nil {
		t.Fatalf("tick with active TON invoice returned error: %v", err)
	}
}

func TestWatcherTickWithActiveTRONInvoice(t *testing.T) {
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)

	tronServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{"data": []any{}})
	}))
	defer tronServer.Close()

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 80002, "tronwatcheruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTRON, "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE")
	if err != nil {
		t.Fatalf("CreateWallet TRON: %v", err)
	}
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "TRON Tick Test",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     store.NetworkTRON,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("5"),
		PublicID:           "TRONTICK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice TRON: %v", err)
	}

	watcher := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 20 * time.Second,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    "https://toncenter.test",
		TronGridBaseURL:     tronServer.URL,
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	if err := watcher.tick(ctx); err != nil {
		t.Fatalf("tick with TRON invoice returned error: %v", err)
	}
}

func TestWatcherTickWithActiveEVMInvoice(t *testing.T) {
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)

	evmServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// EVM stablecoin poller expects an Etherscan-style token transfer response
		_ = json.NewEncoder(w).Encode(map[string]any{
			"status":  "1",
			"message": "OK",
			"result":  []any{},
		})
	}))
	defer evmServer.Close()

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 80003, "evmwatcheruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x4444444444444444444444444444444444444444")
	if err != nil {
		t.Fatalf("CreateWallet EVM: %v", err)
	}
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "EVM Tick Test",
		BaseAmountUSD:      decimal.RequireFromString("15"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("15"),
		PublicID:           "EVMTICK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice EVM: %v", err)
	}

	// Mock a minimal JSON-RPC server for eth_blockNumber and eth_getLogs.
	evmServer.Close()
	rpcServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Method string `json:"method"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		switch req.Method {
		case "eth_blockNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": 1, "jsonrpc": "2.0", "result": "0x100"})
		case "eth_getLogs":
			_ = json.NewEncoder(w).Encode(map[string]any{"id": 1, "jsonrpc": "2.0", "result": []any{}})
		default:
			_ = json.NewEncoder(w).Encode(map[string]any{"id": 1, "jsonrpc": "2.0", "result": nil})
		}
	}))
	defer rpcServer.Close()

	watcher := New(st, paymentSvc, config.Config{
		WatcherPollInterval:   20 * time.Second,
		WatcherGraceWindow:    24 * time.Hour,
		TonCenterBaseURL:      "https://toncenter.test",
		TronGridBaseURL:       "https://api.trongrid.io",
		BaseRPCURL:            rpcServer.URL,
		EVMConfirmationDepth:  1,
		WatcherBackfillBlocks: 10,
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	if err := watcher.tick(ctx); err != nil {
		t.Fatalf("tick with EVM invoice returned error: %v", err)
	}
}

func TestWatcherTickExpiredInvoicesLogged(t *testing.T) {
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 80004, "expirytestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x5555555555555555555555555555555555555555")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	// Create an invoice that's already expired
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Expired Invoice",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10"),
		PublicID:           "EXPIRED001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(-time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	var logOutput strings.Builder
	watcher := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 20 * time.Second,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    "https://toncenter.test",
		TronGridBaseURL:     "https://api.trongrid.io",
	}, slog.New(slog.NewTextHandler(&logOutput, nil)))

	// tick should expire the invoice and log "expired invoices"
	if err := watcher.tick(ctx); err != nil {
		t.Fatalf("tick returned error: %v", err)
	}
	if !strings.Contains(logOutput.String(), "expired") {
		t.Fatalf("expected log to contain 'expired', got %q", logOutput.String())
	}
}

func TestPollTON(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/getTransactions" {
			t.Fatalf("unexpected path: %s", r.URL.Path)
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"ok": true,
			"result": []map[string]any{
				{
					"utime": 1710000000,
					"transaction_id": map[string]any{
						"hash": "tx-ton-1",
					},
					"in_msg": map[string]any{
						"value":   "2500000000",
						"message": "RECV-ABC123",
					},
				},
			},
		})
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{TonCenterBaseURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollTON(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTON,
		Address:        "ton-wallet",
	})
	if err != nil {
		t.Fatalf("pollTON returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if transfers[0].TxHash != "tx-ton-1" {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("2.500000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
	if transfers[0].PaymentComment != "RECV-ABC123" {
		t.Fatalf("unexpected payment comment: %s", transfers[0].PaymentComment)
	}
}

func TestPollTRC20FiltersUSDT(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"data": []map[string]any{
				{
					"transaction_id":  "tx-tron-1",
					"to":              "tron-destination",
					"value":           "12345678",
					"block_timestamp": int64(1710000000123),
					"token_info": map[string]any{
						"symbol":   "USDT",
						"decimals": 6,
					},
				},
				{
					"transaction_id":  "tx-tron-2",
					"to":              "tron-destination",
					"value":           "999",
					"block_timestamp": int64(1710000000456),
					"token_info": map[string]any{
						"symbol":   "USDC",
						"decimals": 6,
					},
				},
			},
		})
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{TronGridBaseURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollTRC20(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTRON,
		Address:        "tron-wallet",
	})
	if err != nil {
		t.Fatalf("pollTRC20 returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if transfers[0].TxHash != "tx-tron-1" {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("12.345678")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestPollTONUSDTFiltersJettonMasterAndDestination(t *testing.T) {
	requestedPath := ""
	transport := roundTripFunc(func(r *http.Request) (*http.Response, error) {
		requestedPath = r.URL.Path
		if r.Header.Get("X-API-Key") != "ton-api-key" {
			t.Fatalf("expected TonCenter API key header, got %q", r.Header.Get("X-API-Key"))
		}
		if r.URL.Query().Get("owner_address") != "ton-destination" || r.URL.Query().Get("jetton_master") != "usdtmaster" || r.URL.Query().Get("direction") != "in" {
			t.Fatalf("unexpected TonCenter query: %s", r.URL.RawQuery)
		}
		body, err := json.Marshal(map[string]any{
			"ok": true,
			"result": []map[string]any{
				{
					"utime":            1710000100,
					"transaction_hash": "tx-ton-usdt-1",
					"source":           "sender",
					"destination":      "ton-destination",
					"amount":           "12345678",
					"jetton_master":    "USDTMASTER",
					"query_id":         101,
					"comment":          "invoice-101",
				},
				{
					"utime":            1710000101,
					"transaction_hash": "tx-wrong-master",
					"source":           "sender",
					"destination":      "ton-destination",
					"amount":           "999999",
					"jetton_master":    "OTHER",
					"query_id":         102,
				},
				{
					"utime":            1710000102,
					"transaction_hash": "tx-wrong-destination",
					"source":           "sender",
					"destination":      "someone-else",
					"amount":           "999999",
					"jetton_master":    "USDTMASTER",
					"query_id":         103,
				},
			},
		})
		if err != nil {
			t.Fatalf("json.Marshal returned error: %v", err)
		}
		return &http.Response{
			StatusCode: http.StatusOK,
			Body:       io.NopCloser(strings.NewReader(string(body))),
			Header:     make(http.Header),
		}, nil
	})

	w := &Watcher{
		cfg: config.Config{
			TonCenterBaseURL:     "https://toncenter.test",
			TonCenterAPIKey:      "ton-api-key",
			TonUSDTMasterAddress: "usdtmaster",
		},
		httpClient: &http.Client{Transport: transport},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	transfers, err := w.pollTON_USDT(context.Background(), store.WatchedWallet{
		PollNetwork:    store.NetworkTON_USDT,
		PayableNetwork: store.NetworkTON_USDT,
		Address:        "ton-destination",
	})
	if err != nil {
		t.Fatalf("pollTON_USDT returned error: %v", err)
	}
	if requestedPath != "/api/v3/jetton/transfers" {
		t.Fatalf("unexpected TonCenter path: %s", requestedPath)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected one matching USDT on TON transfer, got %+v", transfers)
	}
	if transfers[0].TxHash != "tx-ton-usdt-1" || transfers[0].DestinationAddress != "ton-destination" {
		t.Fatalf("unexpected transfer identity: %+v", transfers[0])
	}
	if transfers[0].PaymentComment != "invoice-101" {
		t.Fatalf("unexpected USDT on TON comment: %q", transfers[0].PaymentComment)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("12.345678")) {
		t.Fatalf("unexpected USDT on TON amount: %s", transfers[0].Amount)
	}
}

func TestPollTONUSDTBoundaries(t *testing.T) {
	w := &Watcher{
		cfg:    config.Config{TonCenterBaseURL: "https://toncenter.test"},
		logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	if _, err := w.pollTON_USDT(context.Background(), store.WatchedWallet{Address: "wallet"}); err == nil {
		t.Fatal("expected missing USDT on TON master address to fail")
	}

	w = &Watcher{
		cfg: config.Config{
			TonCenterBaseURL:     "https://toncenter.test",
			TonUSDTMasterAddress: "USDTMASTER",
		},
		httpClient: &http.Client{Transport: roundTripFunc(func(_ *http.Request) (*http.Response, error) {
			return &http.Response{
				StatusCode: http.StatusTooManyRequests,
				Body:       io.NopCloser(strings.NewReader("rate limited")),
				Header:     make(http.Header),
			}, nil
		})},
		logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	if _, err := w.pollTON_USDT(context.Background(), store.WatchedWallet{Address: "wallet"}); err == nil || !strings.Contains(err.Error(), "rate limited") {
		t.Fatalf("expected TonCenter error body, got %v", err)
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) {
	return f(r)
}

func TestParseTronTimestamp(t *testing.T) {
	expected := time.UnixMilli(1710000000123).UTC()
	if got := parseTronTimestamp(int64(1710000000123)); !got.Equal(expected) {
		t.Fatalf("unexpected timestamp from int64: %s", got)
	}
	if got := parseTronTimestamp(float64(1710000000123)); !got.Equal(expected) {
		t.Fatalf("unexpected timestamp from float64: %s", got)
	}
	if got := parseTronTimestamp("1710000000123"); !got.Equal(expected) {
		t.Fatalf("unexpected timestamp from string: %s", got)
	}
	if got := parseTronTimestamp(struct{}{}); !got.IsZero() {
		t.Fatalf("expected zero timestamp for unsupported type, got %s", got)
	}
}

func TestFilterTransfersAfterCheckpointSkipsAlreadyObservedTransfers(t *testing.T) {
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	w := &Watcher{
		store:  st,
		logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	wallet := store.WatchedWallet{
		PollNetwork:    store.NetworkEVM,
		PayableNetwork: store.NetworkBASE,
		Address:        "0x2222222222222222222222222222222222222222",
	}
	checkpointAt := time.Date(2026, 1, 10, 12, 0, 0, 0, time.UTC)
	if err := st.SaveWatcherCheckpoint(ctx, store.WatcherCheckpoint{
		PollNetwork:        wallet.PollNetwork,
		PayableNetwork:     wallet.PayableNetwork,
		DestinationAddress: wallet.Address,
		LastBlock:          100,
		LastObservedAt:     &checkpointAt,
	}); err != nil {
		t.Fatalf("SaveWatcherCheckpoint returned error: %v", err)
	}

	transfers := []store.ObservedTransfer{
		{
			TxHash:             "old-transfer",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("1"),
			ObservedAt:         checkpointAt.Add(-checkpointOverlapWindow - time.Second),
		},
		{
			// Indexed late: timestamp is behind the checkpoint but inside
			// the overlap window, so it must be re-emitted (dedup catches
			// genuine repeats downstream).
			TxHash:             "late-indexed-transfer",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("3"),
			ObservedAt:         checkpointAt.Add(-time.Second),
		},
		{
			TxHash:             "fresh-transfer",
			Network:            store.NetworkBASE,
			DestinationAddress: wallet.Address,
			Amount:             decimal.RequireFromString("2"),
			ObservedAt:         checkpointAt.Add(time.Second),
		},
	}

	filtered := w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, 125)
	if len(filtered) != 2 || filtered[0].TxHash != "late-indexed-transfer" || filtered[1].TxHash != "fresh-transfer" {
		t.Fatalf("expected late-indexed and fresh transfers after checkpoint overlap, got %+v", filtered)
	}
	updated, err := st.GetWatcherCheckpoint(ctx, wallet.PollNetwork, wallet.PayableNetwork, wallet.Address)
	if err != nil {
		t.Fatalf("GetWatcherCheckpoint returned error: %v", err)
	}
	if updated.LastBlock != 125 {
		t.Fatalf("expected checkpoint block 125, got %d", updated.LastBlock)
	}
	if updated.LastObservedAt == nil || !updated.LastObservedAt.Equal(transfers[2].ObservedAt) {
		t.Fatalf("expected checkpoint to advance to newest observed transfer, got %+v", updated.LastObservedAt)
	}
}

func TestWatcherTickWalletPollError(t *testing.T) {
	// When a wallet poll fails, tick should log the error and continue (not return error)
	ctx := context.Background()
	st := newWatcherTestStore(t, ctx)
	paymentSvc := service.NewPaymentService(st)

	// Set up a closed server to trigger poll error
	closedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	closedURL := closedServer.URL
	closedServer.Close()

	workspace, err := st.UpsertWorkspaceByTelegram(ctx, 80099, "tickerroruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := st.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	comment := "RECV-TICK099"
	_, err = st.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Tick Error Test",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("2"),
		PaymentComment:     &comment,
		PublicID:           "TICKERR001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	// Use the closed server URL - poll will fail
	watcher := New(st, paymentSvc, config.Config{
		WatcherPollInterval: 20 * time.Second,
		WatcherGraceWindow:  24 * time.Hour,
		TonCenterBaseURL:    closedURL, // will fail to connect
		TronGridBaseURL:     "https://api.trongrid.io",
	}, slog.New(slog.NewTextHandler(io.Discard, nil)))

	// tick should NOT return an error even when poll fails
	watcher.httpClient = &http.Client{Timeout: 500 * time.Millisecond}
	if err := watcher.tick(ctx); err != nil {
		t.Fatalf("tick should swallow wallet poll errors, got: %v", err)
	}
}

func TestPollTONWithAPIKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("X-API-Key") == "" {
			t.Error("expected X-API-Key header")
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"ok": true, "result": []any{}})
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{
			TonCenterBaseURL: server.URL,
			TonCenterAPIKey:  "test-api-key",
		},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTON(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTON,
		Address:        "ton-wallet",
	})
	if err != nil {
		t.Fatalf("pollTON with API key returned error: %v", err)
	}
}

func TestPollTONHTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "too many requests", http.StatusTooManyRequests)
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{TonCenterBaseURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTON(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTON,
		Address:        "ton-wallet",
	})
	if err == nil || !strings.Contains(err.Error(), "toncenter error") {
		t.Fatalf("expected toncenter error, got %v", err)
	}
}

func TestPollTONDecodeError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("not json"))
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{TonCenterBaseURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTON(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTON,
		Address:        "ton-wallet",
	})
	if err == nil || !strings.Contains(err.Error(), "decode toncenter") {
		t.Fatalf("expected decode error, got %v", err)
	}
}

func TestPollTRC20HTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "bad gateway", http.StatusBadGateway)
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{TronGridBaseURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTRC20(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTRON,
		Address:        "tron-wallet",
	})
	if err == nil || !strings.Contains(err.Error(), "trongrid error") {
		t.Fatalf("expected trongrid error, got %v", err)
	}
}

func TestPollTRC20WithAPIKey(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("TRON-PRO-API-KEY") != "test-key" {
			t.Errorf("expected TRON-PRO-API-KEY header, got %q", r.Header.Get("TRON-PRO-API-KEY"))
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"data": []any{}})
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{TronGridBaseURL: server.URL, TronGridAPIKey: "test-key"},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTRC20(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTRON,
		Address:        "tron-wallet",
	})
	if err != nil {
		t.Fatalf("pollTRC20 with API key returned error: %v", err)
	}
}

func TestPollTRC20DecodeError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("not json"))
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{TronGridBaseURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollTRC20(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkTRON,
		Address:        "tron-wallet",
	})
	if err == nil || !strings.Contains(err.Error(), "decode trongrid") {
		t.Fatalf("expected decode error, got %v", err)
	}
}

func newWatcherTestStore(t *testing.T, ctx context.Context) *store.Store {
	t.Helper()

	port := pickWatcherTestPort(t)
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
	return st
}

func pickWatcherTestPort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()
	return uint32(listener.Addr().(*net.TCPAddr).Port)
}
