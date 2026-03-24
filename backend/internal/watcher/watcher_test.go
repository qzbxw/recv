package watcher

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"reqst/backend/internal/config"
	"reqst/backend/internal/store"

	"github.com/shopspring/decimal"
)

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
						"message": "REQST-ABC123",
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
	if transfers[0].PaymentComment != "REQST-ABC123" {
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
