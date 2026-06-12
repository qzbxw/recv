package service

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"recv/backend/internal/metrics"
	"recv/backend/internal/store"

	"github.com/shopspring/decimal"
)

const (
	TrialInvoiceLimit = 15

	// rateCacheFreshFor is how long a fetched USD rate is served without
	// re-contacting the upstream price API.
	rateCacheFreshFor = 2 * time.Minute
	// rateCacheMaxStale bounds how old a cached rate may be when the
	// upstream price API is unavailable; past this, invoice creation fails
	// rather than pricing against a stale market.
	rateCacheMaxStale = 30 * time.Minute
)

type InvoiceService struct {
	store      *store.Store
	httpClient *http.Client
	tonRateEnv string
	rateMu     sync.Mutex
	rateCache  map[store.PaymentAsset]cachedRate
}

type cachedRate struct {
	value     decimal.Decimal
	fetchedAt time.Time
}

type CreateInvoiceInput struct {
	Title            string
	BaseAmountUSD    decimal.Decimal
	PayableNetwork   store.Network
	PayableAsset     store.PaymentAsset
	PaymentOptions   []PaymentOptionInput
	WalletID         int64
	ExpiresInMinutes int
	Mode             string
}

type PaymentOptionInput struct {
	Network store.Network
	Asset   store.PaymentAsset
}

func NewInvoiceService(st *store.Store, tonRateEnv string) *InvoiceService {
	return &InvoiceService{
		store: st,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
		tonRateEnv: tonRateEnv,
		rateCache:  map[store.PaymentAsset]cachedRate{},
	}
}

func (s *InvoiceService) CreateInvoice(ctx context.Context, workspace store.Workspace, input CreateInvoiceInput) (store.Invoice, error) {
	source := metrics.SourceFromContext(ctx)
	planCode := workspace.EffectivePlanCode(time.Now())
	network := input.PayableNetwork
	if network == "" {
		network = workspace.DefaultNetwork
	}

	if workspace.IsBlocked {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "workspace_blocked")
		return store.Invoice{}, errors.New("workspace is blocked")
	}
	if input.Title == "" {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "missing_title")
		return store.Invoice{}, errors.New("title is required")
	}
	if !input.BaseAmountUSD.IsPositive() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "invalid_amount")
		return store.Invoice{}, errors.New("base_amount_usd must be positive")
	}
	requests, err := s.normalizePaymentOptionInputs(workspace.DefaultNetwork, input.PayableNetwork, input.PayableAsset, input.PaymentOptions)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(network), string(planCode), "failure", "unsupported_payment_option")
		return store.Invoice{}, err
	}
	input.ExpiresInMinutes, err = normalizeTTL(input.ExpiresInMinutes, requests, 30)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(requests[0].Network), string(planCode), "failure", "invalid_ttl")
		return store.Invoice{}, err
	}

	if workspace.EffectivePlanCode(time.Now()) == store.PlanCodeTrial && workspace.FreeInvoicesUsed >= TrialInvoiceLimit {
		metrics.IncLimitDecision("trial_invoice_cap", "denied", "reached")
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(input.PayableNetwork), string(planCode), "failure", "trial_limit_reached")
		return store.Invoice{}, fmt.Errorf("trial limit reached: %d invoices. Unlock a paid recv plan to keep generating links.", TrialInvoiceLimit)
	}

	wallets := make(map[store.Network]store.Wallet)
	if input.WalletID > 0 && len(requests) == 1 {
		wallet, err := s.store.GetWalletByID(ctx, workspace.ID, input.WalletID)
		if err != nil {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(requests[0].Network), string(planCode), "failure", "wallet_lookup")
			return store.Invoice{}, fmt.Errorf("selected wallet %d: %w", input.WalletID, err)
		}
		if wallet.Network != requests[0].Network.WalletBucket() {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(requests[0].Network), string(planCode), "failure", "wallet_network_mismatch")
			return store.Invoice{}, fmt.Errorf("wallet %d does not support network %s", wallet.ID, requests[0].Network)
		}
		wallets[wallet.Network] = wallet
	} else {
		for _, request := range requests {
			bucket := request.Network.WalletBucket()
			if _, ok := wallets[bucket]; ok {
				continue
			}
			wallet, err := s.store.GetActiveWalletForNetwork(ctx, workspace.ID, bucket)
			if err != nil {
				metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(request.Network), string(planCode), "failure", "active_wallet_lookup")
				return store.Invoice{}, fmt.Errorf("active wallet for network %s: %w", request.Network, err)
			}
			wallets[bucket] = wallet
		}
	}

	mode := normalizedMode(input.Mode)
	invoice, err := s.createInvoiceFromOptions(ctx, store.CreateInvoiceParams{
		WorkspaceID:       workspace.ID,
		Kind:              store.InvoiceKindMerchant,
		SubscriptionDays:  0,
		PlanCode:          "",
		CountTowardsTrial: mode != "test",
		Title:             strings.TrimSpace(input.Title),
		BaseAmountUSD:     input.BaseAmountUSD.Round(6),
		Mode:              mode,
	}, requests, wallets, input.ExpiresInMinutes)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(requests[0].Network), string(planCode), "failure", "create_invoice")
		return store.Invoice{}, err
	}
	metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindMerchant), string(invoice.PayableNetwork), string(planCode), "success", "created")
	return invoice, nil
}

func (s *InvoiceService) CreateSubscriptionInvoice(ctx context.Context, workspace store.Workspace, network store.Network) (store.Invoice, error) {
	return s.CreatePlanInvoice(ctx, workspace, store.PlanCodeMerchant, network)
}

func (s *InvoiceService) CreatePlanInvoice(ctx context.Context, workspace store.Workspace, planCode store.PlanCode, network store.Network) (store.Invoice, error) {
	return s.CreatePlanInvoiceWithPrice(ctx, workspace, planCode, network, nil)
}

func (s *InvoiceService) CreatePlanInvoiceWithPrice(ctx context.Context, workspace store.Workspace, planCode store.PlanCode, network store.Network, overridePriceUSD *decimal.Decimal) (store.Invoice, error) {
	return s.CreatePlanInvoiceWithPriceAndOptions(ctx, workspace, planCode, []PaymentOptionInput{{Network: network}}, overridePriceUSD)
}

func (s *InvoiceService) CreatePlanInvoiceWithPriceAndOptions(ctx context.Context, workspace store.Workspace, planCode store.PlanCode, requestedOptions []PaymentOptionInput, overridePriceUSD *decimal.Decimal) (store.Invoice, error) {
	source := metrics.SourceFromContext(ctx)
	planCode = store.NormalizePlanCode(string(planCode))
	network := store.Network("")
	if len(requestedOptions) > 0 {
		network = requestedOptions[0].Network
	}
	if workspace.IsBlocked {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(planCode), "failure", "workspace_blocked")
		return store.Invoice{}, errors.New("workspace is blocked")
	}
	plan := store.ResolvePlan(planCode)
	if plan.Code == store.PlanCodeTrial {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "trial_plan")
		return store.Invoice{}, errors.New("trial does not require billing")
	}
	requests, err := s.normalizePaymentOptionInputs(store.NetworkTRON, network, "", requestedOptions)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "unsupported_network")
		return store.Invoice{}, err
	}
	baseAmountUSD := plan.PriceUSD
	if overridePriceUSD != nil {
		baseAmountUSD = overridePriceUSD.Round(6)
	}
	if !baseAmountUSD.IsPositive() {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "invalid_price")
		return store.Invoice{}, errors.New("subscription price must be positive")
	}
	wallets := make(map[store.Network]store.Wallet)
	for _, request := range requests {
		bucket := request.Network.WalletBucket()
		if _, ok := wallets[bucket]; ok {
			continue
		}
		address, err := s.store.GetBillingWalletAddress(ctx, request.Network)
		if err != nil || strings.TrimSpace(address) == "" {
			metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(request.Network), string(plan.Code), "failure", "billing_wallet_missing")
			return store.Invoice{}, fmt.Errorf("billing wallet is not configured for network %s", request.Network)
		}
		wallets[bucket] = store.Wallet{Network: bucket, Address: address}
	}

	ttl, err := normalizeTTL(0, requests, 60)
	if err != nil {
		return store.Invoice{}, err
	}
	invoice, err := s.createInvoiceFromOptions(ctx, store.CreateInvoiceParams{
		WorkspaceID:       workspace.ID,
		Kind:              store.InvoiceKindSubscription,
		SubscriptionDays:  plan.BillingDays,
		PlanCode:          plan.Code,
		CountTowardsTrial: false,
		Title:             plan.CheckoutTitle,
		BaseAmountUSD:     baseAmountUSD,
		Mode:              "live",
	}, requests, wallets, ttl)
	if err != nil {
		metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(network), string(plan.Code), "failure", "create_invoice")
		return store.Invoice{}, err
	}
	metrics.IncInvoiceOperation("create", source, string(store.InvoiceKindSubscription), string(invoice.PayableNetwork), string(plan.Code), "success", "created")
	return invoice, nil
}

func normalizedMode(mode string) string {
	if strings.EqualFold(strings.TrimSpace(mode), "test") {
		return "test"
	}
	return "live"
}

func (s *InvoiceService) createInvoiceWithDestination(ctx context.Context, params store.CreateInvoiceParams, expiresInMinutes int) (store.Invoice, error) {
	request := PaymentOptionInput{Network: params.PayableNetwork, Asset: params.PayableAsset}
	if request.Asset == "" {
		request.Asset = store.DefaultAssetForNetwork(request.Network)
	}
	wallets := map[store.Network]store.Wallet{
		params.PayableNetwork.WalletBucket(): {
			Network: params.PayableNetwork.WalletBucket(),
			Address: params.DestinationAddress,
		},
	}
	return s.createInvoiceFromOptions(ctx, params, []PaymentOptionInput{request}, wallets, expiresInMinutes)
}

func (s *InvoiceService) createInvoiceFromOptions(ctx context.Context, params store.CreateInvoiceParams, requests []PaymentOptionInput, wallets map[store.Network]store.Wallet, expiresInMinutes int) (store.Invoice, error) {
	publicID, err := s.generateUniquePublicID(ctx)
	if err != nil {
		return store.Invoice{}, err
	}

	if expiresInMinutes <= 0 {
		expiresInMinutes = 30
	}
	options := make([]store.CreatePaymentOptionParams, 0, len(requests))
	for i, request := range requests {
		wallet := wallets[request.Network.WalletBucket()]
		if strings.TrimSpace(wallet.Address) == "" {
			return store.Invoice{}, fmt.Errorf("active wallet for network %s: %w", request.Network, store.ErrNotFound)
		}
		option, err := s.buildPaymentOption(ctx, publicID, params.BaseAmountUSD, request, strings.TrimSpace(wallet.Address), i == 0)
		if err != nil {
			return store.Invoice{}, err
		}
		options = append(options, option)
	}
	defaultOption := options[0]
	params.PublicID = publicID
	params.PayableAmount = defaultOption.PayableAmount
	params.PayableNetwork = defaultOption.Network
	params.PayableAsset = defaultOption.Asset
	params.DestinationAddress = defaultOption.DestinationAddress
	params.PaymentComment = defaultOption.PaymentComment
	params.MatchingSuffix = defaultOption.MatchingSuffix
	params.PaymentOptions = options
	params.ExpiresAt = time.Now().UTC().Add(time.Duration(expiresInMinutes) * time.Minute)
	if params.Kind == "" {
		params.Kind = store.InvoiceKindMerchant
	}
	return s.store.CreateInvoice(ctx, params)
}

func (s *InvoiceService) buildPaymentOption(ctx context.Context, publicID string, baseAmountUSD decimal.Decimal, request PaymentOptionInput, address string, isDefault bool) (store.CreatePaymentOptionParams, error) {
	var (
		payableAmount  decimal.Decimal
		paymentComment *string
		matchingSuffix *decimal.Decimal
		err            error
	)
	switch request.Asset {
	case store.AssetTON, store.AssetSOL, store.AssetBNB:
		payableAmount, err = s.calculateNativeAmount(ctx, request.Asset, baseAmountUSD)
		if err != nil {
			return store.CreatePaymentOptionParams{}, err
		}
		if request.Asset == store.AssetTON {
			comment := "RECV-" + publicID
			paymentComment = &comment
		}
	case store.AssetUSDT, store.AssetUSDC:
		suffix, err := s.generateUniqueSuffixForAsset(ctx, address, request.Network, request.Asset)
		if err != nil {
			return store.CreatePaymentOptionParams{}, err
		}
		payableAmount = baseAmountUSD.Add(suffix).Round(6)
		matchingSuffix = &suffix
	default:
		return store.CreatePaymentOptionParams{}, fmt.Errorf("unsupported asset %s", request.Asset)
	}
	return store.CreatePaymentOptionParams{
		Network:            request.Network,
		Asset:              request.Asset,
		PayableAmount:      payableAmount,
		DestinationAddress: address,
		PaymentComment:     paymentComment,
		MatchingSuffix:     matchingSuffix,
		IsDefault:          isDefault,
	}, nil
}

func (s *InvoiceService) generateUniquePublicID(ctx context.Context) (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	for range 20 {
		var b strings.Builder
		for i := 0; i < 16; i++ {
			n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
			if err != nil {
				return "", fmt.Errorf("random public id: %w", err)
			}
			b.WriteByte(alphabet[n.Int64()])
		}
		candidate := b.String()
		exists, err := s.store.InvoicePublicIDExists(ctx, candidate)
		if err != nil {
			return "", err
		}
		if !exists {
			return candidate, nil
		}
	}
	return "", errors.New("failed to generate unique public id")
}

func (s *InvoiceService) generateUniqueSuffix(ctx context.Context, address string, network store.Network) (decimal.Decimal, error) {
	return s.generateUniqueSuffixForAsset(ctx, address, network, store.DefaultAssetForNetwork(network))
}

func (s *InvoiceService) generateUniqueSuffixForAsset(ctx context.Context, address string, network store.Network, asset store.PaymentAsset) (decimal.Decimal, error) {
	for range 64 {
		n, err := rand.Int(rand.Reader, big.NewInt(9999))
		if err != nil {
			return decimal.Zero, fmt.Errorf("random suffix: %w", err)
		}

		// Keep the matching suffix tiny so the checkout amount stays visually close to the base price.
		suffix := decimal.NewFromInt(n.Int64() + 1).Div(decimal.NewFromInt(1_000_000)).Round(6)
		used, err := s.store.SuffixRecentlyUsedForAsset(ctx, address, network, asset, suffix)
		if err != nil {
			return decimal.Zero, err
		}
		if !used {
			return suffix, nil
		}
	}
	return decimal.Zero, errors.New("failed to generate unique matching suffix")
}

func (s *InvoiceService) calculateTONAmount(ctx context.Context, baseAmountUSD decimal.Decimal) (decimal.Decimal, error) {
	return s.calculateNativeAmount(ctx, store.AssetTON, baseAmountUSD)
}

func (s *InvoiceService) calculateNativeAmount(ctx context.Context, asset store.PaymentAsset, baseAmountUSD decimal.Decimal) (decimal.Decimal, error) {
	rate, err := s.nativeRateUSD(ctx, asset)
	if err != nil {
		return decimal.Zero, err
	}
	if !rate.IsPositive() {
		return decimal.Zero, fmt.Errorf("invalid %s/USD rate", asset)
	}
	return baseAmountUSD.Div(rate).Round(6), nil
}

func (s *InvoiceService) tonRateUSD(ctx context.Context) (decimal.Decimal, error) {
	return s.nativeRateUSD(ctx, store.AssetTON)
}

func (s *InvoiceService) nativeRateUSD(ctx context.Context, asset store.PaymentAsset) (decimal.Decimal, error) {
	envName, coinGeckoID, payloadKey, metricName, err := rateConfig(asset)
	if err != nil {
		return decimal.Zero, err
	}
	envValue := os.Getenv(envName)
	if asset == store.AssetTON {
		envValue = s.tonRateEnv
	}
	if strings.TrimSpace(envValue) != "" {
		value, err := decimal.NewFromString(strings.TrimSpace(envValue))
		if err != nil {
			metrics.ObserveUpstream(metricName+"_override", "parse", "failure", 0)
			return decimal.Zero, fmt.Errorf("%s: %w", envName, err)
		}
		metrics.ObserveUpstream(metricName+"_override", "parse", "success", 0)
		return value, nil
	}

	if value, ok := s.cachedRateWithin(asset, rateCacheFreshFor); ok {
		return value, nil
	}

	value, err := s.fetchUpstreamRateUSD(ctx, asset, coinGeckoID, payloadKey, metricName)
	if err != nil {
		// Serve a bounded-staleness cached rate so a transient upstream
		// outage or rate limit does not fail invoice creation outright.
		if stale, ok := s.cachedRateWithin(asset, rateCacheMaxStale); ok {
			metrics.ObserveUpstream(metricName+"_stale_cache", "fallback", "success", 0)
			return stale, nil
		}
		return decimal.Zero, err
	}
	s.storeCachedRate(asset, value)
	return value, nil
}

func (s *InvoiceService) cachedRateWithin(asset store.PaymentAsset, maxAge time.Duration) (decimal.Decimal, bool) {
	s.rateMu.Lock()
	defer s.rateMu.Unlock()
	entry, ok := s.rateCache[asset]
	if !ok || time.Since(entry.fetchedAt) > maxAge {
		return decimal.Zero, false
	}
	return entry.value, true
}

func (s *InvoiceService) storeCachedRate(asset store.PaymentAsset, value decimal.Decimal) {
	s.rateMu.Lock()
	defer s.rateMu.Unlock()
	if s.rateCache == nil {
		s.rateCache = map[store.PaymentAsset]cachedRate{}
	}
	s.rateCache[asset] = cachedRate{value: value, fetchedAt: time.Now()}
}

func (s *InvoiceService) fetchUpstreamRateUSD(ctx context.Context, asset store.PaymentAsset, coinGeckoID string, payloadKey string, metricName string) (decimal.Decimal, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.coingecko.com/api/v3/simple/price?ids="+coinGeckoID+"&vs_currencies=usd", nil)
	if err != nil {
		return decimal.Zero, fmt.Errorf("build %s rate request: %w", asset, err)
	}
	startedAt := time.Now()
	resp, err := s.httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("coingecko", metricName, "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("fetch %s rate: %w", asset, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		metrics.ObserveUpstream("coingecko", metricName, "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("fetch ton rate failed: %s", strings.TrimSpace(string(body)))
	}

	var payload map[string]struct {
		USD json.Number `json:"usd"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		metrics.ObserveUpstream("coingecko", metricName, "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("decode %s rate: %w", asset, err)
	}
	value, err := decimal.NewFromString(payload[payloadKey].USD.String())
	if err != nil {
		metrics.ObserveUpstream("coingecko", metricName, "failure", time.Since(startedAt))
		return decimal.Zero, fmt.Errorf("parse %s rate: %w", asset, err)
	}
	metrics.ObserveUpstream("coingecko", metricName, "success", time.Since(startedAt))
	return value, nil
}

func (s *InvoiceService) normalizePaymentOptionInputs(defaultNetwork store.Network, legacyNetwork store.Network, legacyAsset store.PaymentAsset, requested []PaymentOptionInput) ([]PaymentOptionInput, error) {
	if len(requested) == 0 {
		if legacyNetwork == "" {
			legacyNetwork = defaultNetwork
		}
		if legacyAsset == "" {
			legacyAsset = store.DefaultAssetForNetwork(legacyNetwork)
		}
		requested = []PaymentOptionInput{{Network: legacyNetwork, Asset: legacyAsset}}
	}
	if len(requested) == 0 || len(requested) > 2 {
		return nil, errors.New("payment_options must contain 1 or 2 options")
	}
	seen := map[string]struct{}{}
	normalized := make([]PaymentOptionInput, 0, len(requested))
	for _, option := range requested {
		option.Network = store.Network(strings.ToUpper(strings.TrimSpace(string(option.Network))))
		if option.Network == "" {
			option.Network = defaultNetwork
		}
		if option.Asset == "" {
			option.Asset = store.DefaultAssetForNetwork(option.Network)
		}
		option.Asset = store.NormalizePaymentAsset(string(option.Asset))
		if !option.Network.IsSupportedPayableNetwork() {
			return nil, fmt.Errorf("unsupported network %s", option.Network)
		}
		if !store.IsSupportedPaymentOption(option.Network, option.Asset) {
			return nil, fmt.Errorf("unsupported payment option %s/%s", option.Network, option.Asset)
		}
		key := string(option.Network) + ":" + string(option.Asset)
		if _, ok := seen[key]; ok {
			return nil, fmt.Errorf("duplicate payment option %s/%s", option.Network, option.Asset)
		}
		seen[key] = struct{}{}
		normalized = append(normalized, option)
	}
	return normalized, nil
}

func normalizeTTL(value int, options []PaymentOptionInput, stableDefault int) (int, error) {
	hasNative := false
	for _, option := range options {
		if store.IsNativeAsset(option.Asset) {
			hasNative = true
			break
		}
	}
	if value <= 0 {
		if hasNative {
			return 10, nil
		}
		return stableDefault, nil
	}
	if hasNative && value > 15 {
		return 0, errors.New("expires_in_minutes cannot exceed 15 for native volatile assets")
	}
	return value, nil
}

func rateConfig(asset store.PaymentAsset) (envName string, coinGeckoID string, payloadKey string, metricName string, err error) {
	switch asset {
	case store.AssetTON:
		return "TON_USD_RATE", "the-open-network", "the-open-network", "ton_rate", nil
	case store.AssetSOL:
		return "SOL_USD_RATE", "solana", "solana", "sol_rate", nil
	case store.AssetBNB:
		return "BNB_USD_RATE", "binancecoin", "binancecoin", "bnb_rate", nil
	default:
		return "", "", "", "", fmt.Errorf("asset %s does not need a native USD rate", asset)
	}
}
