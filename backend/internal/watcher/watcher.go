package watcher

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/config"
	"recv/backend/internal/metrics"
	"recv/backend/internal/service"
	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

type Watcher struct {
	store          *store.Store
	paymentService *service.PaymentService
	cfg            config.Config
	httpClient     *http.Client
	logger         *slog.Logger
}

func New(st *store.Store, paymentService *service.PaymentService, cfg config.Config, logger *slog.Logger) *Watcher {
	return &Watcher{
		store:          st,
		paymentService: paymentService,
		cfg:            cfg,
		logger:         logger,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (w *Watcher) Run(ctx context.Context) error {
	ticker := time.NewTicker(w.cfg.WatcherPollInterval)
	defer ticker.Stop()

	for {
		if err := w.tick(ctx); err != nil {
			w.logger.Error("watcher tick failed", "error", err)
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (w *Watcher) tick(ctx context.Context) error {
	ctx = metrics.WithSource(ctx, "watcher")
	expired, err := w.store.ExpireOverdueInvoices(ctx)
	if err != nil {
		return err
	}
	if expired > 0 {
		w.logger.Info("expired invoices", "count", expired)
	}

	wallets, err := w.store.GetWatchedWallets(ctx, w.cfg.WatcherGraceWindow)
	if err != nil {
		return err
	}

	for _, wallet := range wallets {
		var transfers []store.ObservedTransfer
		startedAt := time.Now()
		result := "success"
		switch wallet.PollNetwork {
		case store.NetworkTRON:
			transfers, err = w.pollTRC20(ctx, wallet)
		case store.NetworkTON:
			transfers, err = w.pollTON(ctx, wallet)
		case store.NetworkTON_USDT:
			transfers, err = w.pollTON_USDT(ctx, wallet)
		case store.NetworkSOLANA:
			if wallet.Asset == store.AssetSOL {
				transfers, err = w.pollSolanaNative(ctx, wallet)
			} else {
				transfers, err = w.pollSolanaStablecoin(ctx, wallet)
			}
		case store.NetworkBSC:
			transfers, err = w.pollBSCNative(ctx, wallet)
		case store.NetworkEVM:
			transfers, err = w.pollEVMStablecoin(ctx, wallet)
		default:
			continue
		}
		if err != nil {
			result = "failure"
			metrics.ObserveWatcherPoll(string(wallet.PayableNetwork), result, time.Since(startedAt), 0)
			w.logger.Warn("wallet poll failed", "network", wallet.PayableNetwork, "address", wallet.Address, "error", err)
			continue
		}
		metrics.ObserveWatcherPoll(string(wallet.PayableNetwork), result, time.Since(startedAt), len(transfers))
		metrics.ObserveBatch("watcher_transfers", string(wallet.PayableNetwork), len(transfers))

		for _, transfer := range transfers {
			result, err := w.paymentService.ProcessObservedTransfer(ctx, transfer)
			if err != nil {
				w.logger.Warn("process observed transfer failed", "tx_hash", transfer.TxHash, "error", err)
				continue
			}
			if result.Classification != "duplicate" && result.Classification != "unmatched" {
				w.logger.Info("classified transfer", "tx_hash", transfer.TxHash, "classification", result.Classification)
			}
		}
	}
	return nil
}

func (w *Watcher) pollTRC20(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	base := strings.TrimRight(w.cfg.TronGridBaseURL, "/")
	query := url.Values{}
	query.Set("only_to", "true")
	query.Set("only_confirmed", "true")
	query.Set("limit", "50")

	endpoint := fmt.Sprintf("%s/v1/accounts/%s/transactions/trc20?%s", base, wallet.Address, query.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if w.cfg.TronGridAPIKey != "" {
		req.Header.Set("TRON-PRO-API-KEY", w.cfg.TronGridAPIKey)
	}

	startedAt := time.Now()
	resp, err := w.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("trongrid", "poll_trc20", "failure", time.Since(startedAt))
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		metrics.ObserveUpstream("trongrid", "poll_trc20", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("trongrid error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		Data []struct {
			TransactionID string `json:"transaction_id"`
			To            string `json:"to"`
			Value         string `json:"value"`
			BlockTime     int64  `json:"block_timestamp"`
			TokenInfo     struct {
				Symbol   string `json:"symbol"`
				Decimals int32  `json:"decimals"`
			} `json:"token_info"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		metrics.ObserveUpstream("trongrid", "poll_trc20", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("decode trongrid: %w", err)
	}

	var transfers []store.ObservedTransfer
	for _, item := range payload.Data {
		if !strings.EqualFold(item.TokenInfo.Symbol, "USDT") {
			continue
		}

		rawAmount, err := decimal.NewFromString(item.Value)
		if err != nil {
			continue
		}
		scale := decimal.NewFromInt(10).Pow(decimal.NewFromInt32(item.TokenInfo.Decimals))
		amount := rawAmount.Div(scale).Round(6)

		raw, _ := json.Marshal(item)
		transfer := store.ObservedTransfer{
			TxHash:             item.TransactionID,
			Network:            wallet.PayableNetwork,
			Asset:              store.AssetUSDT,
			DestinationAddress: item.To,
			Amount:             amount,
			ObservedAt:         time.UnixMilli(item.BlockTime).UTC(),
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	transfers = w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, 0)
	metrics.ObserveUpstream("trongrid", "poll_trc20", "success", time.Since(startedAt))
	return transfers, nil
}

func (w *Watcher) pollTON(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	base := strings.TrimRight(w.cfg.TonCenterBaseURL, "/")
	endpoint := fmt.Sprintf("%s/getTransactions?address=%s&limit=30&archival=true", base, url.QueryEscape(wallet.Address))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if w.cfg.TonCenterAPIKey != "" {
		req.Header.Set("X-API-Key", w.cfg.TonCenterAPIKey)
	}

	startedAt := time.Now()
	resp, err := w.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("toncenter", "poll_ton", "failure", time.Since(startedAt))
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		metrics.ObserveUpstream("toncenter", "poll_ton", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("toncenter error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		OK     bool `json:"ok"`
		Result []struct {
			UTime int64 `json:"utime"`
			TxID  struct {
				Hash string `json:"hash"`
			} `json:"transaction_id"`
			InMsg struct {
				Value   string `json:"value"`
				Message string `json:"message"`
			} `json:"in_msg"`
		} `json:"result"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		metrics.ObserveUpstream("toncenter", "poll_ton", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("decode toncenter: %w", err)
	}

	var transfers []store.ObservedTransfer
	for _, item := range payload.Result {
		nanoTons, err := decimal.NewFromString(item.InMsg.Value)
		if err != nil {
			continue
		}
		amount := nanoTons.Div(decimal.NewFromInt(1_000_000_000)).Round(6)
		raw, _ := json.Marshal(item)

		transfer := store.ObservedTransfer{
			TxHash:             item.TxID.Hash,
			Network:            wallet.PayableNetwork,
			Asset:              store.AssetGRAM,
			DestinationAddress: wallet.Address,
			Amount:             amount,
			PaymentComment:     strings.TrimSpace(item.InMsg.Message),
			ObservedAt:         time.Unix(item.UTime, 0).UTC(),
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	transfers = w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, 0)
	metrics.ObserveUpstream("toncenter", "poll_ton", "success", time.Since(startedAt))
	return transfers, nil
}

func (w *Watcher) pollTON_USDT(ctx context.Context, wallet store.WatchedWallet) ([]store.ObservedTransfer, error) {
	usdtMaster := strings.TrimSpace(w.cfg.TonUSDTMasterAddress)
	if usdtMaster == "" {
		return nil, errors.New("TON_USDT_MASTER_ADDRESS is required")
	}
	base := tonCenterV3BaseURL(w.cfg.TonCenterBaseURL)
	values := url.Values{}
	values.Set("owner_address", wallet.Address)
	values.Set("jetton_master", usdtMaster)
	values.Set("direction", "in")
	values.Set("limit", "30")
	endpoint := fmt.Sprintf("%s/jetton/transfers?%s", base, values.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	if w.cfg.TonCenterAPIKey != "" {
		req.Header.Set("X-API-Key", w.cfg.TonCenterAPIKey)
	}

	startedAt := time.Now()
	resp, err := w.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("toncenter", "poll_ton_usdt", "failure", time.Since(startedAt))
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		metrics.ObserveUpstream("toncenter", "poll_ton_usdt", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("toncenter error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		OK              bool                      `json:"ok"`
		Result          []tonCenterJettonTransfer `json:"result"`
		JettonTransfers []tonCenterJettonTransfer `json:"jetton_transfers"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		metrics.ObserveUpstream("toncenter", "poll_ton_usdt", "failure", time.Since(startedAt))
		return nil, fmt.Errorf("decode toncenter jetton: %w", err)
	}

	items := payload.JettonTransfers
	if len(items) == 0 && len(payload.Result) > 0 {
		items = payload.Result
	}

	var transfers []store.ObservedTransfer
	for _, item := range items {
		// Filter by USDT master and destination address
		if !strings.EqualFold(item.JettonMaster, usdtMaster) || !strings.EqualFold(item.Destination, wallet.Address) {
			continue
		}

		rawAmount, err := decimal.NewFromString(item.Amount)
		if err != nil {
			continue
		}
		// USDT TON has 6 decimals
		amount := rawAmount.Div(decimal.NewFromInt(1_000_000)).Round(6)
		raw, _ := json.Marshal(item)

		transfer := store.ObservedTransfer{
			TxHash:             item.TransactionHash,
			Network:            wallet.PayableNetwork,
			Asset:              store.AssetUSDT,
			DestinationAddress: wallet.Address,
			Amount:             amount,
			PaymentComment:     strings.TrimSpace(item.Comment),
			ObservedAt:         time.Unix(item.UTime, 0).UTC(),
			RawPayload:         raw,
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			continue
		}
		transfers = append(transfers, transfer)
	}
	transfers = w.filterTransfersAfterCheckpoint(ctx, wallet, transfers, 0)
	metrics.ObserveUpstream("toncenter", "poll_ton_usdt", "success", time.Since(startedAt))
	return transfers, nil
}

type tonCenterJettonTransfer struct {
	UTime           int64  `json:"utime"`
	TransactionHash string `json:"transaction_hash"`
	Source          string `json:"source"`
	Destination     string `json:"destination"`
	Amount          string `json:"amount"`
	JettonMaster    string `json:"jetton_master"`
	QueryID         any    `json:"query_id"`
	Comment         string `json:"comment"`
}

func tonCenterV3BaseURL(baseURL string) string {
	base := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if base == "" {
		base = "https://toncenter.com/api/v2"
	}
	if strings.HasSuffix(base, "/api/v2") {
		return strings.TrimSuffix(base, "/api/v2") + "/api/v3"
	}
	if strings.HasSuffix(base, "/api/v3") {
		return base
	}
	return base + "/api/v3"
}

// checkpointOverlapWindow is re-scanned behind the checkpoint each poll.
// Upstream indexers (TonCenter, TronGrid) can surface a transaction whose
// block timestamp is older than transactions already seen; a strict cutoff
// would drop such a payment forever. Re-processing inside the window is safe
// because RecordObservedTransfer dedupes by external event id.
const checkpointOverlapWindow = 15 * time.Minute

func (w *Watcher) filterTransfersAfterCheckpoint(ctx context.Context, wallet store.WatchedWallet, transfers []store.ObservedTransfer, lastBlock int64) []store.ObservedTransfer {
	if w.store == nil {
		return transfers
	}
	checkpoint, err := w.store.GetWatcherCheckpointForAsset(ctx, wallet.PollNetwork, wallet.PayableNetwork, wallet.Asset, wallet.Address)
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		w.logger.Warn("load watcher checkpoint failed", "network", wallet.PayableNetwork, "address", wallet.Address, "error", err)
		return transfers
	}

	filtered := transfers
	var maxObserved *time.Time
	if checkpoint.LastObservedAt != nil {
		cutoff := checkpoint.LastObservedAt.Add(-checkpointOverlapWindow)
		filtered = make([]store.ObservedTransfer, 0, len(transfers))
		for _, transfer := range transfers {
			if transfer.ObservedAt.After(cutoff) {
				filtered = append(filtered, transfer)
			}
		}
	}
	for _, transfer := range transfers {
		observed := transfer.ObservedAt
		if maxObserved == nil || observed.After(*maxObserved) {
			maxObserved = &observed
		}
	}
	if maxObserved != nil || lastBlock > 0 {
		if err := w.store.SaveWatcherCheckpoint(ctx, store.WatcherCheckpoint{
			PollNetwork:        wallet.PollNetwork,
			PayableNetwork:     wallet.PayableNetwork,
			Asset:              wallet.Asset,
			DestinationAddress: wallet.Address,
			LastBlock:          lastBlock,
			LastObservedAt:     maxObserved,
		}); err != nil {
			w.logger.Warn("save watcher checkpoint failed", "network", wallet.PayableNetwork, "address", wallet.Address, "error", err)
		}
	}
	return filtered
}

func parseTronTimestamp(value any) time.Time {
	switch v := value.(type) {
	case int64:
		return time.UnixMilli(v).UTC()
	case float64:
		return time.UnixMilli(int64(v)).UTC()
	case string:
		parsed, _ := strconv.ParseInt(v, 10, 64)
		return time.UnixMilli(parsed).UTC()
	default:
		return time.Time{}
	}
}
