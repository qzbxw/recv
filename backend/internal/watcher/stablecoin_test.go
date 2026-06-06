package watcher

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/config"
	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

func TestStablecoinForNetwork(t *testing.T) {
	cases := map[store.Network]string{
		store.NetworkEVM:      "USDT",
		store.NetworkBASE:     "USDT",
		store.NetworkARBITRUM: "USDT",
		store.NetworkBSC:      "USDT",
		store.NetworkSOLANA:   "USDT",
	}
	for network, symbol := range cases {
		spec := stablecoinForNetwork(network)
		if spec.Symbol != symbol {
			t.Fatalf("network %s expected %s, got %s", network, symbol, spec.Symbol)
		}
	}

	// Default case: unknown network returns empty spec
	spec := stablecoinForNetwork(store.Network("DOGE"))
	if spec.Symbol != "" || spec.EVMContract != "" || spec.SolanaMint != "" {
		t.Fatalf("expected empty spec for unknown network, got %+v", spec)
	}
}

func TestStablecoinForOption(t *testing.T) {
	cases := []struct {
		network store.Network
		asset   store.PaymentAsset
		symbol  string
	}{
		{store.NetworkSOLANA, store.AssetUSDC, "USDC"},
		{store.NetworkBASE, store.AssetUSDC, "USDC"},
		{store.NetworkARBITRUM, store.AssetUSDT, "USDT"},
		{store.NetworkBSC, store.AssetUSDT, "USDT"},
	}
	for _, tc := range cases {
		if got := stablecoinForOption(tc.network, tc.asset); got.Symbol != tc.symbol {
			t.Fatalf("stablecoinForOption(%s,%s) symbol=%q; want %q", tc.network, tc.asset, got.Symbol, tc.symbol)
		}
	}
	if got := stablecoinForOption(store.NetworkTON, store.AssetTON); got.Symbol != "" {
		t.Fatalf("expected native TON to have no stablecoin spec, got %+v", got)
	}
}

func TestPollSolanaStablecoinNoMint(t *testing.T) {
	// Passing a network that has no SolanaMint should return an error immediately
	w := &Watcher{
		httpClient: &http.Client{Timeout: time.Second},
	}
	_, err := w.pollSolanaStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkBASE, // BASE has no SolanaMint
	})
	if err == nil || !strings.Contains(err.Error(), "solana stablecoin mint is not configured") {
		t.Fatalf("expected mint not configured error, got %v", err)
	}
}

func TestPollEVMStablecoinNoContract(t *testing.T) {
	// Passing a network that has no EVMContract should error
	w := &Watcher{
		cfg:        config.Config{SolanaRPCURL: "http://localhost"},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}
	_, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkSOLANA, // SOLANA has no EVMContract
	})
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestComputeSolanaBalanceDiffs(t *testing.T) {
	pre := []solanaTokenBalance{
		{AccountIndex: 1, Mint: "mint-a", Owner: "owner-1", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "5000000"}},
	}
	post := []solanaTokenBalance{
		{AccountIndex: 1, Mint: "mint-a", Owner: "owner-1", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "8000000"}},
		{AccountIndex: 2, Mint: "mint-a", Owner: "owner-2", UITokenAmount: struct {
			Amount string "json:\"amount\""
		}{Amount: "9999999"}},
	}
	diffs := computeSolanaBalanceDiffs("owner-1", "mint-a", pre, post)
	if len(diffs) != 1 {
		t.Fatalf("expected 1 diff, got %d", len(diffs))
	}
	if !diffs[1].Equal(decimal.RequireFromString("3")) {
		t.Fatalf("unexpected diff: %s", diffs[1])
	}
}

func TestHexHelpers(t *testing.T) {
	if got := paddedEVMTopic("0x1234"); got != "0x0000000000000000000000001234" {
		t.Fatalf("unexpected padded topic: %s", got)
	}
	value, err := parseHexInt("0x10")
	if err != nil || value != 16 {
		t.Fatalf("unexpected parseHexInt result: %d %v", value, err)
	}
	amount, err := hexAmountToDecimal("0xf4240", 6)
	if err != nil {
		t.Fatalf("hexAmountToDecimal returned error: %v", err)
	}
	if !amount.Equal(decimal.RequireFromString("1")) {
		t.Fatalf("unexpected amount: %s", amount)
	}
	if _, err := parseHexInt("not-hex"); err == nil {
		t.Fatal("expected invalid hex integer to be rejected")
	}
	if _, err := hexAmountToDecimal("0xzz", 6); err == nil {
		t.Fatal("expected invalid hex amount to be rejected")
	}
	if amount, err := hexAmountToDecimal("", 6); err != nil || !amount.IsZero() {
		t.Fatalf("expected blank hex amount to be zero, got %s err=%v", amount, err)
	}
}

func TestNetworkFromRPCURLMapsConfiguredNetworks(t *testing.T) {
	cfg := config.Config{
		EthereumRPCURL: "https://eth.test",
		BaseRPCURL:     "https://base.test",
		ArbitrumRPCURL: "https://arb.test",
		BSCRPCURL:      "https://bsc.test",
	}
	tests := map[string]store.Network{
		"https://eth.test":     store.NetworkEVM,
		"https://base.test":    store.NetworkBASE,
		"https://arb.test":     store.NetworkARBITRUM,
		"https://bsc.test":     store.NetworkBSC,
		"https://unknown.test": store.NetworkEVM,
	}
	for rpcURL, expected := range tests {
		if got := networkFromRPCURL(rpcURL, cfg); got != expected {
			t.Fatalf("networkFromRPCURL(%q) = %s; want %s", rpcURL, got, expected)
		}
	}
}

func TestPollEVMStablecoin(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var payload struct {
			Method string `json:"method"`
		}
		_ = json.Unmarshal(body, &payload)

		switch payload.Method {
		case "eth_blockNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x64"})
		case "eth_getLogs":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": []map[string]any{
					{
						"address":         "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2",
						"topics":          []string{erc20TransferTopic},
						"data":            "0xf4240",
						"blockNumber":     "0x64",
						"transactionHash": "0xabc",
						"logIndex":        "0x1",
						"removed":         false,
					},
				},
			})
		case "eth_getBlockByNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result":  map[string]any{"timestamp": "0x65f4f100"},
			})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{BaseRPCURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkBASE,
		Address:        "0x1111111111111111111111111111111111111111",
	})
	if err != nil {
		t.Fatalf("pollEVMStablecoin returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if transfers[0].TxHash != "0xabc:0x1" {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("1.000000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestPollEVMStablecoinBoundaries(t *testing.T) {
	t.Run("missing rpc url", func(t *testing.T) {
		w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
		_, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBASE,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err == nil || !strings.Contains(err.Error(), "rpc url is not configured") {
			t.Fatalf("expected missing rpc url error, got %v", err)
		}
	})

	t.Run("invalid latest block", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "not-hex"})
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{BaseRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		_, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBASE,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err == nil || !strings.Contains(err.Error(), "parse latest evm block") {
			t.Fatalf("expected invalid latest block error, got %v", err)
		}
	})

	t.Run("confirmation depth keeps latest block unsafe", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x2"})
		}))
		defer server.Close()

		w := &Watcher{
			cfg: config.Config{
				BaseRPCURL:           server.URL,
				EVMConfirmationDepth: 5,
			},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		transfers, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBASE,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err != nil {
			t.Fatalf("expected unsafe block range to return nil without error, got %v", err)
		}
		if transfers != nil {
			t.Fatalf("expected nil transfers for unsafe block range, got %+v", transfers)
		}
	})

	t.Run("skips removed invalid zero and bad timestamp logs", func(t *testing.T) {
		calls := map[string]int{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var payload struct {
				Method string `json:"method"`
			}
			_ = json.NewDecoder(r.Body).Decode(&payload)
			calls[payload.Method]++
			switch payload.Method {
			case "eth_blockNumber":
				_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x64"})
			case "eth_getLogs":
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result": []map[string]any{
						{"data": "0xf4240", "blockNumber": "0x60", "transactionHash": "0xremoved", "logIndex": "0x1", "removed": true},
						{"data": "0x0", "blockNumber": "0x60", "transactionHash": "0xzero", "logIndex": "0x2"},
						{"data": "0xzz", "blockNumber": "0x60", "transactionHash": "0xbadamount", "logIndex": "0x3"},
						{"data": "0xf4240", "blockNumber": "0x60", "transactionHash": "0xbadts", "logIndex": "0x4"},
					},
				})
			case "eth_getBlockByNumber":
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result":  map[string]any{"timestamp": "0xzz"},
				})
			default:
				t.Fatalf("unexpected method %s", payload.Method)
			}
		}))
		defer server.Close()

		w := &Watcher{
			cfg: config.Config{
				BaseRPCURL:            server.URL,
				EVMConfirmationDepth:  1,
				WatcherBackfillBlocks: 4,
			},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		transfers, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBASE,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err != nil {
			t.Fatalf("pollEVMStablecoin returned error: %v", err)
		}
		if len(transfers) != 0 {
			t.Fatalf("expected all boundary logs to be skipped, got %+v", transfers)
		}
		if calls["eth_getBlockByNumber"] != 1 {
			t.Fatalf("expected only timestamp-worthy log to request block timestamp once, calls=%+v", calls)
		}
	})
}

func TestPollSolanaStablecoin(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		var payload struct {
			Method string `json:"method"`
		}
		_ = json.Unmarshal(body, &payload)

		switch payload.Method {
		case "getTokenAccountsByOwner":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": map[string]any{
					"value": []map[string]any{
						{"pubkey": "token-account-1"},
					},
				},
			})
		case "getSignaturesForAddress":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": []map[string]any{
					{"signature": "sig-1", "blockTime": 1710000000},
				},
			})
		case "getTransaction":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": map[string]any{
					"blockTime": 1710000000,
					"meta": map[string]any{
						"preTokenBalances": []map[string]any{
							{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "1000000",
								},
							},
						},
						"postTokenBalances": []map[string]any{
							{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "3500000",
								},
							},
						},
					},
				},
			})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{SolanaRPCURL: server.URL},
		httpClient: &http.Client{
			Timeout: 2 * time.Second,
		},
		logger: slog.New(slog.NewTextHandler(os.Stdout, nil)),
	}

	transfers, err := w.pollSolanaStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkSOLANA,
		Asset:          store.AssetUSDT,
		Address:        "owner-sol",
	})
	if err != nil {
		t.Fatalf("pollSolanaStablecoin returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 transfer, got %d", len(transfers))
	}
	if !strings.HasPrefix(transfers[0].TxHash, "sig-1:") {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("2.500000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestPollSolanaStablecoinBoundaries(t *testing.T) {
	t.Run("token accounts rpc error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"error":   map[string]any{"message": "owner lookup failed"},
			})
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{SolanaRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		_, err := w.pollSolanaStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkSOLANA,
			Asset:          store.AssetUSDT,
			Address:        "owner-sol",
		})
		if err == nil || !strings.Contains(err.Error(), "owner lookup failed") {
			t.Fatalf("expected token account rpc error, got %v", err)
		}
	})

	t.Run("signature and transaction failures are skipped", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var payload struct {
				Method string `json:"method"`
				Params []any  `json:"params"`
			}
			_ = json.NewDecoder(r.Body).Decode(&payload)
			switch payload.Method {
			case "getTokenAccountsByOwner":
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result":  map[string]any{"value": []map[string]any{{"pubkey": "bad-signatures"}, {"pubkey": "has-signatures"}}},
				})
			case "getSignaturesForAddress":
				if payload.Params[0] == "bad-signatures" {
					_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "error": map[string]any{"message": "signature lookup failed"}})
					return
				}
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result":  []map[string]any{{"signature": "bad-tx", "blockTime": 1710000001}, {"signature": "no-positive-diff", "blockTime": 1710000002}},
				})
			case "getTransaction":
				if payload.Params[0] == "bad-tx" {
					_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "error": map[string]any{"message": "tx fetch failed"}})
					return
				}
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result": map[string]any{
						"meta": map[string]any{
							"preTokenBalances": []map[string]any{{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "5000000",
								},
							}},
							"postTokenBalances": []map[string]any{{
								"accountIndex": 1,
								"mint":         stablecoinForNetwork(store.NetworkSOLANA).SolanaMint,
								"owner":        "owner-sol",
								"uiTokenAmount": map[string]any{
									"amount": "4000000",
								},
							}},
						},
					},
				})
			default:
				t.Fatalf("unexpected method %s", payload.Method)
			}
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{SolanaRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		transfers, err := w.pollSolanaStablecoin(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkSOLANA,
			Asset:          store.AssetUSDT,
			Address:        "owner-sol",
		})
		if err != nil {
			t.Fatalf("pollSolanaStablecoin returned error: %v", err)
		}
		if len(transfers) != 0 {
			t.Fatalf("expected failed/non-positive Solana candidates to be skipped, got %+v", transfers)
		}
	})
}

func TestPollBSCNative(t *testing.T) {
	const walletAddress = "0x1111111111111111111111111111111111111111"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Method string `json:"method"`
			Params []any  `json:"params"`
		}
		_ = json.NewDecoder(r.Body).Decode(&payload)

		switch payload.Method {
		case "eth_blockNumber":
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x66"})
		case "eth_getBlockByNumber":
			blockNumber, _ := payload.Params[0].(string)
			result := map[string]any{
				"timestamp": "0x65f4f100",
				"transactions": []map[string]any{
					{"hash": blockNumber + "-match", "to": walletAddress, "value": "0xde0b6b3a7640000"},
					{"hash": blockNumber + "-other", "to": "0x2222222222222222222222222222222222222222", "value": "0xde0b6b3a7640000"},
					{"hash": blockNumber + "-zero", "to": walletAddress, "value": "0x0"},
					{"hash": blockNumber + "-bad", "to": walletAddress, "value": "0xzz"},
				},
			}
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": result})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg: config.Config{
			BSCRPCURL:             server.URL,
			EVMConfirmationDepth:  1,
			WatcherBackfillBlocks: 1,
		},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	transfers, err := w.pollBSCNative(context.Background(), store.WatchedWallet{
		PollNetwork:    store.NetworkBSC,
		PayableNetwork: store.NetworkBSC,
		Asset:          store.AssetBNB,
		Address:        walletAddress,
	})
	if err != nil {
		t.Fatalf("pollBSCNative returned error: %v", err)
	}
	if len(transfers) != 2 {
		t.Fatalf("expected 2 matching BNB transfers, got %d: %+v", len(transfers), transfers)
	}
	for _, transfer := range transfers {
		if transfer.Network != store.NetworkBSC || transfer.Asset != store.AssetBNB {
			t.Fatalf("unexpected network/asset: %+v", transfer)
		}
		if transfer.DestinationAddress != walletAddress {
			t.Fatalf("unexpected destination address: %s", transfer.DestinationAddress)
		}
		if !transfer.Amount.Equal(decimal.RequireFromString("1.000000")) {
			t.Fatalf("unexpected amount: %s", transfer.Amount)
		}
	}
}

func TestPollBSCNativeBoundaries(t *testing.T) {
	t.Run("missing rpc url", func(t *testing.T) {
		w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
		_, err := w.pollBSCNative(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBSC,
			Asset:          store.AssetBNB,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err == nil || !strings.Contains(err.Error(), "rpc url is not configured") {
			t.Fatalf("expected missing rpc url error, got %v", err)
		}
	})

	t.Run("invalid latest block", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "not-hex"})
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{BSCRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		_, err := w.pollBSCNative(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBSC,
			Asset:          store.AssetBNB,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err == nil || !strings.Contains(err.Error(), "parse latest bsc block") {
			t.Fatalf("expected invalid latest block error, got %v", err)
		}
	})

	t.Run("unsafe latest block returns no transfers", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{"jsonrpc": "2.0", "id": 1, "result": "0x1"})
		}))
		defer server.Close()

		w := &Watcher{
			cfg: config.Config{
				BSCRPCURL:            server.URL,
				EVMConfirmationDepth: 5,
			},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		transfers, err := w.pollBSCNative(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkBSC,
			Asset:          store.AssetBNB,
			Address:        "0x1111111111111111111111111111111111111111",
		})
		if err != nil {
			t.Fatalf("expected unsafe block range without error, got %v", err)
		}
		if transfers != nil {
			t.Fatalf("expected nil transfers, got %+v", transfers)
		}
	})
}

func TestPollSolanaNative(t *testing.T) {
	const walletAddress = "owner-sol"
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var payload struct {
			Method string `json:"method"`
			Params []any  `json:"params"`
		}
		_ = json.NewDecoder(r.Body).Decode(&payload)

		switch payload.Method {
		case "getSignaturesForAddress":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": []map[string]any{
					{"signature": "sig-sol-1", "blockTime": 1710000000},
				},
			})
		case "getTransaction":
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"result": map[string]any{
					"blockTime": 1710000001,
					"transaction": map[string]any{
						"message": map[string]any{
							"accountKeys": []map[string]any{
								{"pubkey": "payer"},
								{"pubkey": walletAddress},
								{"pubkey": walletAddress},
							},
						},
					},
					"meta": map[string]any{
						"preBalances":  []int64{9000000000, 1000000000, 5000000000},
						"postBalances": []int64{8000000000, 3500000000, 4000000000},
					},
				},
			})
		default:
			t.Fatalf("unexpected rpc method: %s", payload.Method)
		}
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{SolanaRPCURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	transfers, err := w.pollSolanaNative(context.Background(), store.WatchedWallet{
		PollNetwork:    store.NetworkSOLANA,
		PayableNetwork: store.NetworkSOLANA,
		Asset:          store.AssetSOL,
		Address:        walletAddress,
	})
	if err != nil {
		t.Fatalf("pollSolanaNative returned error: %v", err)
	}
	if len(transfers) != 1 {
		t.Fatalf("expected 1 matching SOL transfer, got %d: %+v", len(transfers), transfers)
	}
	if transfers[0].TxHash != "sig-sol-1" {
		t.Fatalf("unexpected tx hash: %s", transfers[0].TxHash)
	}
	if transfers[0].Network != store.NetworkSOLANA || transfers[0].Asset != store.AssetSOL {
		t.Fatalf("unexpected network/asset: %+v", transfers[0])
	}
	if !transfers[0].Amount.Equal(decimal.RequireFromString("2.500000")) {
		t.Fatalf("unexpected amount: %s", transfers[0].Amount)
	}
}

func TestPollSolanaNativeBoundaries(t *testing.T) {
	t.Run("signature rpc error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_ = json.NewEncoder(w).Encode(map[string]any{
				"jsonrpc": "2.0",
				"id":      1,
				"error":   map[string]any{"message": "signature lookup failed"},
			})
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{SolanaRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		_, err := w.pollSolanaNative(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkSOLANA,
			Asset:          store.AssetSOL,
			Address:        "owner-sol",
		})
		if err == nil || !strings.Contains(err.Error(), "signature lookup failed") {
			t.Fatalf("expected signature rpc error, got %v", err)
		}
	})

	t.Run("transaction failures and non-positive diffs are skipped", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var payload struct {
				Method string `json:"method"`
				Params []any  `json:"params"`
			}
			_ = json.NewDecoder(r.Body).Decode(&payload)

			switch payload.Method {
			case "getSignaturesForAddress":
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result":  []map[string]any{{"signature": "bad-tx"}, {"signature": "no-gain", "blockTime": 1710000000}},
				})
			case "getTransaction":
				if payload.Params[0] == "bad-tx" {
					_ = json.NewEncoder(w).Encode(map[string]any{
						"jsonrpc": "2.0",
						"id":      1,
						"error":   map[string]any{"message": "tx fetch failed"},
					})
					return
				}
				_ = json.NewEncoder(w).Encode(map[string]any{
					"jsonrpc": "2.0",
					"id":      1,
					"result": map[string]any{
						"transaction": map[string]any{
							"message": map[string]any{
								"accountKeys": []map[string]any{
									{"pubkey": "owner-sol"},
									{"pubkey": "owner-sol"},
								},
							},
						},
						"meta": map[string]any{
							"preBalances":  []int64{5000000000},
							"postBalances": []int64{4000000000},
						},
					},
				})
			default:
				t.Fatalf("unexpected method %s", payload.Method)
			}
		}))
		defer server.Close()

		w := &Watcher{
			cfg:        config.Config{SolanaRPCURL: server.URL},
			httpClient: &http.Client{Timeout: time.Second},
			logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
		}
		transfers, err := w.pollSolanaNative(context.Background(), store.WatchedWallet{
			PayableNetwork: store.NetworkSOLANA,
			Asset:          store.AssetSOL,
			Address:        "owner-sol",
		})
		if err != nil {
			t.Fatalf("pollSolanaNative returned error: %v", err)
		}
		if len(transfers) != 0 {
			t.Fatalf("expected failed/non-positive Solana candidates to be skipped, got %+v", transfers)
		}
	})
}

func TestEVMRPCURL(t *testing.T) {
	w := &Watcher{
		cfg: config.Config{
			EthereumRPCURL: "eth",
			BaseRPCURL:     "base",
			ArbitrumRPCURL: "arb",
			BSCRPCURL:      "bsc",
		},
	}
	if got := w.evmRPCURL(store.NetworkEVM); got != "eth" {
		t.Fatalf("unexpected ethereum rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkBASE); got != "base" {
		t.Fatalf("unexpected base rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkARBITRUM); got != "arb" {
		t.Fatalf("unexpected arbitrum rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkBSC); got != "bsc" {
		t.Fatalf("unexpected bsc rpc url: %s", got)
	}
	if got := w.evmRPCURL(store.NetworkTON); got != "" {
		t.Fatalf("unexpected rpc url for ton: %s", got)
	}
}

func TestTernaryWatcherResult(t *testing.T) {
	if got := ternaryWatcherResult(nil); got != "success" {
		t.Fatalf("expected success for nil error, got %q", got)
	}
	if got := ternaryWatcherResult(errors.New("some error")); got != "failure" {
		t.Fatalf("expected failure for non-nil error, got %q", got)
	}
}

func TestNetworkFromRPCURL(t *testing.T) {
	cfg := config.Config{
		EthereumRPCURL: "https://eth.rpc",
		BaseRPCURL:     "https://base.rpc",
		ArbitrumRPCURL: "https://arb.rpc",
		BSCRPCURL:      "https://bsc.rpc",
	}
	if got := networkFromRPCURL("https://eth.rpc", cfg); got != store.NetworkEVM {
		t.Fatalf("expected EVM for ethereum rpc, got %s", got)
	}
	if got := networkFromRPCURL("https://base.rpc", cfg); got != store.NetworkBASE {
		t.Fatalf("expected BASE for base rpc, got %s", got)
	}
	if got := networkFromRPCURL("https://arb.rpc", cfg); got != store.NetworkARBITRUM {
		t.Fatalf("expected ARBITRUM for arb rpc, got %s", got)
	}
	if got := networkFromRPCURL("https://bsc.rpc", cfg); got != store.NetworkBSC {
		t.Fatalf("expected BSC for bsc rpc, got %s", got)
	}
	if got := networkFromRPCURL("https://unknown.rpc", cfg); got != store.NetworkEVM {
		t.Fatalf("expected default EVM for unknown rpc, got %s", got)
	}
}

func TestCallJSONRPCReportsError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"error": map[string]any{
				"message": "upstream failed",
			},
		})
	}))
	defer server.Close()

	w := &Watcher{
		httpClient: &http.Client{Timeout: time.Second},
	}
	var result any
	err := w.callJSONRPC(context.Background(), server.URL, "test_method", nil, &result)
	if err == nil || !strings.Contains(err.Error(), "upstream failed") {
		t.Fatalf("expected upstream error, got %v", err)
	}
}

func TestCallJSONRPCHTTPErrorStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}))
	defer server.Close()

	w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
	err := w.callJSONRPC(context.Background(), server.URL, "test_method", nil, nil)
	if err == nil || !strings.Contains(err.Error(), "json rpc error") {
		t.Fatalf("expected json rpc error from HTTP 500, got %v", err)
	}
}

func TestCallJSONRPCNilTarget(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":"somevalue"}`))
	}))
	defer server.Close()

	w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
	// nil target: should decode but not unmarshal → no error
	err := w.callJSONRPC(context.Background(), server.URL, "test_method", nil, nil)
	if err != nil {
		t.Fatalf("expected nil error for nil target, got %v", err)
	}
}

func TestCallJSONRPCDecodeFails(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("not-json"))
	}))
	defer server.Close()

	w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
	var result any
	err := w.callJSONRPC(context.Background(), server.URL, "test_method", nil, &result)
	if err == nil || !strings.Contains(err.Error(), "decode json rpc response") {
		t.Fatalf("expected decode error, got %v", err)
	}
}

func TestPollEVMStablecoinRPCErrors(t *testing.T) {
	// Test: eth_blockNumber call fails (connection error)
	closedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	closedURL := closedServer.URL
	closedServer.Close()

	w := &Watcher{
		cfg:        config.Config{BaseRPCURL: closedURL},
		httpClient: &http.Client{Timeout: 500 * time.Millisecond},
		logger:     slog.New(slog.NewTextHandler(io.Discard, nil)),
	}

	_, err := w.pollEVMStablecoin(context.Background(), store.WatchedWallet{
		PayableNetwork: store.NetworkBASE,
		Address:        "0x1111111111111111111111111111111111111111",
	})
	if err == nil {
		t.Fatal("expected error when RPC server is unavailable")
	}
}

func TestEVMBlockTimestampBadTimestamp(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		// Return invalid hex timestamp
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"result": map[string]any{"timestamp": "not-hex"},
		})
	}))
	defer server.Close()

	w := &Watcher{
		cfg:        config.Config{BaseRPCURL: server.URL},
		httpClient: &http.Client{Timeout: time.Second},
	}
	_, err := w.evmBlockTimestamp(context.Background(), server.URL, "0x64")
	if err == nil {
		t.Fatal("expected error for invalid hex timestamp")
	}
}

func TestCallEVMRPCStringError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]any{
			"jsonrpc": "2.0", "id": 1,
			"error": map[string]any{"message": "method not found"},
		})
	}))
	defer server.Close()

	w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
	_, err := w.callEVMRPCString(context.Background(), server.URL, store.NetworkBASE, "eth_unknown", nil)
	if err == nil || !strings.Contains(err.Error(), "method not found") {
		t.Fatalf("expected RPC error, got %v", err)
	}
}

func TestCallJSONRPCConnectionError(t *testing.T) {
	// Use a closed server to trigger connection error
	closedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {}))
	closedURL := closedServer.URL
	closedServer.Close()

	w := &Watcher{httpClient: &http.Client{Timeout: time.Second}}
	err := w.callJSONRPC(context.Background(), closedURL, "test_method", nil, nil)
	if err == nil {
		t.Fatal("expected connection error for closed server")
	}
}
