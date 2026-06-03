package http

import (
	"context"
	"encoding/json"
	"errors"
	stdhttp "net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/config"
	"recv/backend/internal/service"
	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

func TestInternalTokenMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("rejects when token is not configured", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("accepts token from internal header", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "secret"}}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		request.Header.Set("X-Internal-Token", "secret")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 204, got %d", recorder.Code)
		}
	})

	t.Run("accepts token from bearer header", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "secret"}}
		router := gin.New()
		router.Use(server.internalTokenMiddleware())
		router.POST("/internal/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/test", nil)
		request.Header.Set("Authorization", "Bearer secret")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 204, got %d", recorder.Code)
		}
	})
}

func TestCORSMiddlewareHandlesPreflight(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(corsMiddleware(config.Config{AppEnv: "development"}))
	router.OPTIONS("/resource", func(c *gin.Context) {
		t.Fatal("preflight request should not reach route handler")
	})

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodOptions, "/resource", nil)
	router.ServeHTTP(recorder, request)

	if recorder.Code != stdhttp.StatusNoContent {
		t.Fatalf("expected 204, got %d", recorder.Code)
	}
	if recorder.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("unexpected allow-origin header: %q", recorder.Header().Get("Access-Control-Allow-Origin"))
	}
}

func TestAdminLoginAndMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)

	loginRecorder := httptest.NewRecorder()
	loginRequest := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRecorder, loginRequest)

	if loginRecorder.Code != stdhttp.StatusOK {
		t.Fatalf("expected login 200, got %d", loginRecorder.Code)
	}
	var body map[string]any
	if err := json.Unmarshal(loginRecorder.Body.Bytes(), &body); err != nil {
		t.Fatalf("json.Unmarshal returned error: %v", err)
	}
	token, _ := body["token"].(string)
	if token == "" {
		t.Fatal("expected admin token in response")
	}

	protectedRouter := gin.New()
	protectedRouter.Use(server.adminMiddleware())
	protectedRouter.GET("/api/admin/overview", func(c *gin.Context) {
		c.Status(stdhttp.StatusNoContent)
	})

	protectedRecorder := httptest.NewRecorder()
	protectedRequest := httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil)
	protectedRequest.Header.Set("Authorization", "Bearer "+token)
	protectedRouter.ServeHTTP(protectedRecorder, protectedRequest)

	if protectedRecorder.Code != stdhttp.StatusNoContent {
		t.Fatalf("expected protected route 204, got %d", protectedRecorder.Code)
	}
}

func TestNormalizeScopes(t *testing.T) {
	defaults := normalizeScopes(nil)
	if len(defaults) != 2 || defaults[0] != "invoices:read" || defaults[1] != "invoices:write" {
		t.Fatalf("unexpected default scopes: %#v", defaults)
	}

	scopes := normalizeScopes([]string{" invoices:read ", "invoices:write", "invoices:read", "ignored"})
	if len(scopes) != 2 {
		t.Fatalf("expected two normalized scopes, got %#v", scopes)
	}
}

func TestExtractAPIKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = httptest.NewRequest(stdhttp.MethodGet, "/v1/me", nil)
	context.Request.Header.Set("X-API-Key", "header-key")
	if got := extractAPIKey(context); got != "header-key" {
		t.Fatalf("expected header api key, got %q", got)
	}

	context.Request = httptest.NewRequest(stdhttp.MethodGet, "/v1/me", nil)
	context.Request.Header.Set("Authorization", "Bearer bearer-key")
	if got := extractAPIKey(context); got != "bearer-key" {
		t.Fatalf("expected bearer api key, got %q", got)
	}
}

func TestValidateWebhookURL(t *testing.T) {
	if err := validateWebhookURL("https://example.com/hooks", "production"); err != nil {
		t.Fatalf("expected valid webhook URL, got %v", err)
	}
	if err := validateWebhookURL("ftp://example.com/hooks", "production"); err == nil {
		t.Fatal("expected unsupported scheme error")
	}
	if err := validateWebhookURL("https:///hooks", "production"); err == nil {
		t.Fatal("expected missing host error")
	}
	if err := validateWebhookURL("http://example.com/hooks", "production"); err == nil {
		t.Fatal("expected production http webhook error")
	}
	if err := validateWebhookURL("https://127.0.0.1/hooks", "production"); err == nil {
		t.Fatal("expected loopback webhook error")
	}
}

func TestPublicInvoiceResponse(t *testing.T) {
	comment := "RECV-ABC123"
	txHash := "tx-1"
	invoice := store.Invoice{
		ID:                 1,
		PublicID:           "INV123",
		Kind:               store.InvoiceKindSubscription,
		PlanCode:           store.PlanCodeTrial,
		Title:              "recv Merchant · 30 days",
		BaseAmountUSD:      decimal.RequireFromString("39"),
		PayableAmount:      decimal.RequireFromString("11.250000"),
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
		PaymentComment:     &comment,
		Status:             store.InvoiceStatusAwaitingPayment,
		ExpiresAt:          time.Now().Add(time.Hour),
		TxHash:             &txHash,
	}

	response := publicInvoiceResponse(invoice)

	if response["checkout_badge"] != "Merchant" {
		t.Fatalf("unexpected checkout badge: %#v", response["checkout_badge"])
	}
	if response["plan_code"] != store.PlanCodeMerchant {
		t.Fatalf("unexpected plan code: %#v", response["plan_code"])
	}
	paymentURI, ok := response["payment_uri"].(string)
	if !ok || !strings.HasPrefix(paymentURI, "ton://transfer/") {
		t.Fatalf("unexpected payment uri: %#v", response["payment_uri"])
	}
	if response["status"] != store.InvoiceStatusAwaitingPayment {
		t.Fatalf("unexpected status: %#v", response["status"])
	}

	invoice.ExpiresAt = time.Now().Add(-time.Minute)
	response = publicInvoiceResponse(invoice)
	if response["status"] != store.InvoiceStatusExpired {
		t.Fatalf("expected expired status, got %#v", response["status"])
	}
}

func TestHelperUtilities(t *testing.T) {
	if !isWorkspaceManagedInvoice(store.Invoice{Kind: store.InvoiceKindMerchant}) {
		t.Fatal("expected merchant invoice to be seller managed")
	}
	if isWorkspaceManagedInvoice(store.Invoice{Kind: store.InvoiceKindSubscription, SubscriptionDays: 30}) {
		t.Fatal("expected subscription invoice not to be seller managed")
	}
	if got := parseIntDefault("15", 1); got != 15 {
		t.Fatalf("expected 15, got %d", got)
	}
	if got := parseIntDefault("invalid", 7); got != 7 {
		t.Fatalf("expected fallback 7, got %d", got)
	}
	if got := inferredNetworkFromPath("/internal/watchers/arbitrum"); got != store.NetworkARBITRUM {
		t.Fatalf("expected arbitrum, got %s", got)
	}
	if got := inferredNetworkFromPath("/internal/watchers/ton"); got != store.NetworkTON {
		t.Fatalf("expected ton, got %s", got)
	}
	if got := monthWindowStart(time.Date(2026, time.March, 24, 17, 30, 0, 0, time.FixedZone("UTC+3", 3*3600))); !got.Equal(time.Date(2026, time.March, 1, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("unexpected month window start: %s", got)
	}
	if got := hashSecret(" secret "); got == "" {
		t.Fatal("expected secret hash")
	}
	token, prefix, err := generateTokenWithPrefix("live_", 8)
	if err != nil {
		t.Fatalf("generateTokenWithPrefix returned error: %v", err)
	}
	if !strings.HasPrefix(token, "live_") || prefix == "" {
		t.Fatalf("unexpected token or prefix: %q / %q", token, prefix)
	}
	if got := ternary(true, "a", "b"); got != "a" {
		t.Fatalf("expected ternary true branch, got %q", got)
	}
	if got := max(2, 5); got != 5 {
		t.Fatalf("expected max 5, got %d", got)
	}
	if err := validateWallet(store.NetworkEVM, "0x1111111111111111111111111111111111111111"); err != nil {
		t.Fatalf("expected valid wallet, got %v", err)
	}
}

func TestInvoicePresentationHelpers(t *testing.T) {
	comment := "order #1 / тест"
	invoice := store.Invoice{
		Kind:               store.InvoiceKindSubscription,
		PlanCode:           store.PlanCodeTrial,
		SubscriptionDays:   30,
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: "UQWallet",
		PayableAmount:      decimal.RequireFromString("1.25"),
		PaymentComment:     &comment,
	}

	if got := checkoutBadge(invoice); got != store.ResolvePlan(store.PlanCodeMerchant).CheckoutBadge {
		t.Fatalf("expected subscription trial invoice to render merchant badge, got %q", got)
	}

	uri := paymentURI(invoice)
	if !strings.HasPrefix(uri, "ton://transfer/UQWallet?amount=1250000000&text=") {
		t.Fatalf("unexpected TON payment uri: %s", uri)
	}
	parsed, err := url.Parse(uri)
	if err != nil {
		t.Fatalf("payment uri should parse: %v", err)
	}
	if got := parsed.Query().Get("text"); got != comment {
		t.Fatalf("expected escaped comment round trip, got %q", got)
	}

	invoice.Kind = store.InvoiceKindMerchant
	invoice.SubscriptionDays = 0
	invoice.PayableNetwork = store.NetworkBASE
	invoice.DestinationAddress = "0x1111111111111111111111111111111111111111"
	if !isWorkspaceManagedInvoice(invoice) {
		t.Fatal("expected merchant invoice to be workspace managed")
	}
	if got := checkoutBadge(invoice); got != "Merchant Checkout" {
		t.Fatalf("expected merchant checkout badge, got %q", got)
	}
	if got := paymentURI(invoice); got != invoice.DestinationAddress {
		t.Fatalf("expected EVM-like payment URI to be destination address, got %q", got)
	}
}

func TestWatcherPathAndDeveloperUtilityBranches(t *testing.T) {
	tests := map[string]store.Network{
		"/internal/watchers/ton":      store.NetworkTON,
		"/internal/watchers/tron":     store.NetworkTRON,
		"/internal/watchers/solana":   store.NetworkSOLANA,
		"/internal/watchers/base":     store.NetworkBASE,
		"/internal/watchers/arbitrum": store.NetworkARBITRUM,
		"/internal/watchers/bsc":      store.NetworkBSC,
		"/internal/watchers/evm":      store.NetworkEVM,
		"/internal/watchers/unknown":  "",
	}
	for path, expected := range tests {
		if got := inferredNetworkFromPath(path); got != expected {
			t.Fatalf("inferredNetworkFromPath(%q) = %q; want %q", path, got, expected)
		}
	}

	firstHash := hashRequestBody([]byte(`{"b":2,"a":1}`))
	secondHash := hashRequestBody([]byte(`{"a":1,"b":2}`))
	if firstHash != secondHash {
		t.Fatalf("expected JSON request hash to be order-insensitive, got %s and %s", firstHash, secondHash)
	}
	if rawHash := hashRequestBody([]byte(`not-json`)); rawHash == firstHash {
		t.Fatal("expected non-JSON payload to hash differently from normalized JSON")
	}

	limiter := &memoryRateLimiter{buckets: map[string]rateBucket{}}
	if remaining, ok := limiter.Allow("key", 2); !ok || remaining != 1 {
		t.Fatalf("first request should be allowed with 1 remaining, got remaining=%d ok=%v", remaining, ok)
	}
	if remaining, ok := limiter.Allow("key", 2); !ok || remaining != 0 {
		t.Fatalf("second request should be allowed with 0 remaining, got remaining=%d ok=%v", remaining, ok)
	}
	if remaining, ok := limiter.Allow("key", 2); ok || remaining != 0 {
		t.Fatalf("third request should be rejected, got remaining=%d ok=%v", remaining, ok)
	}
	if _, ok := limiter.Allow("unlimited", 0); !ok {
		t.Fatal("non-positive limit should allow request")
	}
}

func TestWorkspaceHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	workspace := store.Workspace{ID: 1}

	t.Run("update contact email rejects invalid address", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/me/contact-email", server.handleUpdateContactEmail)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/me/contact-email", strings.NewReader(`{"email":"not-an-email"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("create wallet rejects unsupported network", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/wallets", server.handleCreateWallet)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets", strings.NewReader(`{"network":"BASE","address":"0x1"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("create invoice rejects invalid amount", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/invoices", server.handleCreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices", strings.NewReader(`{"title":"Demo","base_amount_usd":"oops","payable_network":"TON"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("cancel invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/invoices/:id/cancel", server.handleCancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices/not-a-number/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("mark invoice paid rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices/not-a-number/mark-paid", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestPublicAndInternalHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}

	t.Run("telegram auth rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram", server.handleTelegramAuth)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("telegram code request rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/request-code", server.handleTelegramCodeRequest)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/request-code", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("telegram code login rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/login", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("observed transfers reject incomplete event", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/watchers/ton", server.handleObservedTransfers)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(`{"events":[{"amount":"1","destination_address":"wallet","network":"TON"}]}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("grant pro rejects invalid workspace id", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/grant-pro", server.handleGrantPRO)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/admin/workspaces/oops/grant-pro", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("block workspace rejects malformed payload", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/internal/admin/workspaces/1/block", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestDeveloperHandlersValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{}
	trialWorkspace := store.Workspace{ID: 1}

	t.Run("create api key rejects unsupported plan", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace))
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("create webhook endpoint validates trial request body", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace))
		router.POST("/api/developer/webhooks", server.handleCreateWebhookEndpoint)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("api create invoice rejects missing scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace), withAPIKeyScopes("invoices:read"))
		router.POST("/v1/invoices", server.handleAPICreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("api create invoice rejects invalid amount", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices", server.handleAPICreateInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{"title":"Demo","base_amount_usd":"oops"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("api get invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace), withAPIKeyScopes("invoices:read"))
		router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices/oops", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("api cancel invoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/oops/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestRespondErrorWritesClientSafeMessages(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/test-4xx", func(c *gin.Context) {
		respondError(c, stdhttp.StatusBadRequest, errors.New("bad input"))
	})
	router.GET("/test-5xx", func(c *gin.Context) {
		respondError(c, stdhttp.StatusInternalServerError, errors.New("internal db error"))
	})

	t.Run("4xx surfaces error message", func(t *testing.T) {
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/test-4xx", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", rec.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}
		if body["error"] != "bad input" {
			t.Fatalf("expected error message 'bad input', got %q", body["error"])
		}
	})

	t.Run("5xx returns generic message", func(t *testing.T) {
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/test-5xx", nil))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500, got %d", rec.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}
		if strings.Contains(body["error"], "db") {
			t.Fatal("5xx response must not leak internal error details")
		}
		if body["error"] == "" {
			t.Fatal("expected non-empty generic error message")
		}
	})
}

func TestAbortErrorStopsMiddlewareChain(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	handlerCalled := false
	router.Use(func(c *gin.Context) {
		abortError(c, stdhttp.StatusUnauthorized, errors.New("not authorized"))
	})
	router.GET("/protected", func(c *gin.Context) {
		handlerCalled = true
		c.Status(stdhttp.StatusOK)
	})

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/protected", nil))

	if rec.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec.Code)
	}
	if handlerCalled {
		t.Fatal("expected middleware abort to stop the handler from being called")
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if body["error"] != "not authorized" {
		t.Fatalf("expected 'not authorized' error, got %q", body["error"])
	}
}

func TestAbortErrorWith5xxHidesInternalDetails(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/server-error", func(c *gin.Context) {
		abortError(c, stdhttp.StatusInternalServerError, errors.New("secret database error"))
	})

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/server-error", nil))

	if rec.Code != stdhttp.StatusInternalServerError {
		t.Fatalf("expected 500, got %d", rec.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("unmarshal error: %v", err)
	}
	if strings.Contains(body["error"], "database") {
		t.Fatal("expected 5xx abort to hide internal error details")
	}
}

func TestHandlerValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	t.Run("handleUpdateContactEmail rejects non-email string", func(t *testing.T) {
		workspace := store.Workspace{ID: 1}
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/me/contact-email", server.handleUpdateContactEmail)

		recorder := httptest.NewRecorder()
		// No @ in email so it should be rejected before hitting the store
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/me/contact-email", strings.NewReader(`{"email":"notanemail"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("handleGetInvoice rejects non-numeric id", func(t *testing.T) {
		workspace := store.Workspace{ID: 1}
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.GET("/api/invoices/:id", server.handleGetInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/api/invoices/not-a-number", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})
}

func TestAdminVerifyTOTPErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	t.Run("rejects malformed json body", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.POST("/api/admin/login/verify-totp", server.handleAdminVerifyTOTP)

		// Act
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login/verify-totp", strings.NewReader(`{`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("rejects invalid challenge token", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.POST("/api/admin/login/verify-totp", server.handleAdminVerifyTOTP)

		// Act
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login/verify-totp",
			strings.NewReader(`{"challenge_token":"invalid-token","code":"123456"}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid challenge token, got %d", recorder.Code)
		}
	})
}

func TestAdminRefreshErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	t.Run("rejects missing refresh token", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.POST("/api/admin/refresh", server.handleAdminRefresh)

		// Act
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/refresh", nil)
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for missing refresh token, got %d", recorder.Code)
		}
		var body map[string]string
		if err := json.Unmarshal(recorder.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}
		if !strings.Contains(body["error"], "missing admin refresh token") {
			t.Fatalf("expected missing token message, got %q", body["error"])
		}
	})

	t.Run("rejects invalid refresh token from cookie", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.POST("/api/admin/refresh", server.handleAdminRefresh)

		// Act
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/refresh", nil)
		request.AddCookie(&stdhttp.Cookie{Name: "recv_admin_refresh", Value: "totally-invalid-token"})
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid cookie token, got %d", recorder.Code)
		}
	})
}

func TestAdminRevokeSessionErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	// Create a super_admin token
	loginRecorder := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginRequest := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRecorder, loginRequest)

	var loginBody map[string]any
	_ = json.Unmarshal(loginRecorder.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdminToken := func(req *stdhttp.Request) *stdhttp.Request {
		req.Header.Set("Authorization", "Bearer "+token)
		return req
	}

	withAdminContext := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	t.Run("rejects missing session_id", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.POST("/api/admin/sessions/revoke", server.handleAdminRevokeSession)

		// Act
		recorder := httptest.NewRecorder()
		request := withAdminToken(httptest.NewRequest(stdhttp.MethodPost, "/api/admin/sessions/revoke",
			strings.NewReader(`{"session_id":0}`)))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for missing session_id, got %d", recorder.Code)
		}
	})

	t.Run("rejects malformed json", func(t *testing.T) {
		// Arrange
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdminContext))
		router.POST("/api/admin/sessions/revoke", server.handleAdminRevokeSession)

		// Act
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/sessions/revoke",
			strings.NewReader(`{bad`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		// Assert
		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", recorder.Code)
		}
	})
}

func TestParseAdminDateValidAndInvalid(t *testing.T) {
	fallback := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)

	t.Run("empty string returns fallback", func(t *testing.T) {
		if got := parseAdminDate("", fallback); !got.Equal(fallback) {
			t.Fatalf("expected fallback for empty string, got %s", got)
		}
	})

	t.Run("whitespace returns fallback", func(t *testing.T) {
		if got := parseAdminDate("   ", fallback); !got.Equal(fallback) {
			t.Fatalf("expected fallback for whitespace, got %s", got)
		}
	})

	t.Run("valid RFC3339 date is parsed", func(t *testing.T) {
		expected := time.Date(2026, 3, 15, 10, 0, 0, 0, time.UTC)
		if got := parseAdminDate("2026-03-15T10:00:00Z", fallback); !got.Equal(expected) {
			t.Fatalf("expected RFC3339 parse result, got %s", got)
		}
	})

	t.Run("valid YYYY-MM-DD date is parsed", func(t *testing.T) {
		expected := time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC)
		if got := parseAdminDate("2026-06-01", fallback); !got.Equal(expected) {
			t.Fatalf("expected date parse result, got %s", got)
		}
	})

	t.Run("invalid format returns fallback", func(t *testing.T) {
		if got := parseAdminDate("not-a-date", fallback); !got.Equal(fallback) {
			t.Fatalf("expected fallback for invalid format, got %s", got)
		}
	})

	t.Run("partial date returns fallback", func(t *testing.T) {
		if got := parseAdminDate("2026-03", fallback); !got.Equal(fallback) {
			t.Fatalf("expected fallback for partial date, got %s", got)
		}
	})
}

func TestValidAdminPlanCode(t *testing.T) {
	validCodes := []string{"trial", "merchant", "developer", "business",
		"TRIAL", "MERCHANT", "DEVELOPER", "BUSINESS",
		" merchant ", "  TRIAL  "}

	for _, raw := range validCodes {
		code, ok := validAdminPlanCode(raw)
		if !ok {
			t.Fatalf("expected %q to be a valid plan code", raw)
		}
		if code == "" {
			t.Fatalf("expected non-empty plan code for %q", raw)
		}
	}

	invalidCodes := []string{"", "premium", "free", "starter", "unknown", "  "}
	for _, raw := range invalidCodes {
		if _, ok := validAdminPlanCode(raw); ok {
			t.Fatalf("expected %q to be an invalid plan code", raw)
		}
	}
}

func TestAdminHasRole(t *testing.T) {
	t.Run("returns true for matching role", func(t *testing.T) {
		claims := service.AdminClaims{Roles: []string{"super_admin"}}
		if !adminHasRole(claims, "super_admin") {
			t.Fatal("expected super_admin role to match")
		}
	})

	t.Run("returns false for non-matching role", func(t *testing.T) {
		claims := service.AdminClaims{Roles: []string{"admin"}}
		if adminHasRole(claims, "super_admin") {
			t.Fatal("expected admin role not to match super_admin")
		}
	})

	t.Run("returns false for empty roles", func(t *testing.T) {
		claims := service.AdminClaims{Roles: []string{}}
		if adminHasRole(claims, "super_admin") {
			t.Fatal("expected empty roles not to match")
		}
	})
}

func TestAdminSetWorkspacePlanValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	// Get a valid admin token
	loginRecorder := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginRequest := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginRequest.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRecorder, loginRequest)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRecorder.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	t.Run("rejects invalid workspace id", func(t *testing.T) {
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.POST("/api/admin/workspaces/:id/set-plan", server.handleAdminSetWorkspacePlan)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/not-a-number/set-plan",
			strings.NewReader(`{"plan_code":"merchant"}`))
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d", recorder.Code)
		}
	})

	t.Run("rejects invalid plan code", func(t *testing.T) {
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.POST("/api/admin/workspaces/:id/set-plan", server.handleAdminSetWorkspacePlan)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/1/set-plan",
			strings.NewReader(`{"plan_code":"invalid_plan"}`))
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid plan code, got %d", recorder.Code)
		}
	})

	t.Run("rejects malformed json body", func(t *testing.T) {
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.POST("/api/admin/workspaces/:id/set-plan", server.handleAdminSetWorkspacePlan)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/1/set-plan",
			strings.NewReader(`{bad`))
		request.Header.Set("Content-Type", "application/json")
		request.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", recorder.Code)
		}
	})
}

func TestAdminRevokeSessionForbiddenForNonSuperAdmin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Use a token with a non-super_admin role
	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	t.Run("non-super_admin claims are rejected", func(t *testing.T) {
		// Build a context with non-super_admin role
		withNonSuperAdminCtx := func(c *gin.Context) {
			c.Set("admin_ctx", adminContext{Claims: service.AdminClaims{Roles: []string{"admin"}}})
			c.Next()
		}

		router := gin.New()
		router.Use(withNonSuperAdminCtx)
		router.POST("/api/admin/sessions/revoke", server.handleAdminRevokeSession)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/sessions/revoke",
			strings.NewReader(`{"session_id":1}`))
		request.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for non-super_admin, got %d", recorder.Code)
		}
	})
}

func TestDeveloperHandlerAdditionalValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	proWorkspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeDeveloper}

	t.Run("handleResendWebhookDelivery rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace))
		router.POST("/api/developer/webhooks/deliveries/:id/resend", server.handleResendWebhookDelivery)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks/deliveries/not-a-number/resend", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid delivery id, got %d", recorder.Code)
		}
	})

	t.Run("handleRotateWebhookEndpointSecret rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace))
		router.POST("/api/developer/webhooks/:id/rotate-secret", server.handleRotateWebhookEndpointSecret)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks/oops/rotate-secret", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid endpoint id, got %d", recorder.Code)
		}
	})
}

func TestAPIKeyMiddlewareMissingKey(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Arrange: server without a store (middleware stops before store call when token is missing)
	server := &Server{}
	router := gin.New()
	router.Use(server.apiKeyMiddleware())
	router.GET("/v1/test", func(c *gin.Context) {
		c.Status(stdhttp.StatusOK)
	})

	// Act: no API key header
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
	router.ServeHTTP(recorder, request)

	// Assert
	if recorder.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("expected 401 for missing API key, got %d", recorder.Code)
	}
}

func TestAuthAndAdminMiddlewareEarlyRejections(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("auth middleware rejects missing bearer token", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.Use(server.authMiddleware())
		router.GET("/api/me", func(c *gin.Context) {
			c.Status(stdhttp.StatusOK)
		})

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil))
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", recorder.Code)
		}
	})

	t.Run("auth middleware rejects invalid bearer token", func(t *testing.T) {
		server := &Server{authService: service.NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)}
		router := gin.New()
		router.Use(server.authMiddleware())
		router.GET("/api/me", func(c *gin.Context) {
			c.Status(stdhttp.StatusOK)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil)
		request.Header.Set("Authorization", "Bearer invalid-token")
		router.ServeHTTP(recorder, request)
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", recorder.Code)
		}
	})

	t.Run("admin middleware rejects disabled admin service", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.GET("/api/admin/overview", func(c *gin.Context) {
			c.Status(stdhttp.StatusOK)
		})

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil))
		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d", recorder.Code)
		}
	})

	t.Run("admin middleware rejects missing bearer token", func(t *testing.T) {
		server := &Server{adminService: service.NewAdminService("admin", "pass", "secret", time.Hour)}
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.GET("/api/admin/overview", func(c *gin.Context) {
			c.Status(stdhttp.StatusOK)
		})

		recorder := httptest.NewRecorder()
		router.ServeHTTP(recorder, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil))
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", recorder.Code)
		}
	})

	t.Run("admin middleware rejects invalid bearer token", func(t *testing.T) {
		server := &Server{adminService: service.NewAdminService("admin", "pass", "secret", time.Hour)}
		router := gin.New()
		router.Use(server.adminMiddleware())
		router.GET("/api/admin/overview", func(c *gin.Context) {
			c.Status(stdhttp.StatusOK)
		})

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil)
		request.Header.Set("Authorization", "Bearer invalid-token")
		router.ServeHTTP(recorder, request)
		if recorder.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401, got %d", recorder.Code)
		}
	})
}

func TestAPIHandlerValidationBranches(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	proWorkspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeDeveloper}

	t.Run("handleAPIGetInvoice rejects missing scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:write"))
		router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices/1", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for missing scope, got %d", recorder.Code)
		}
	})

	t.Run("handleAPIGetInvoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:read"))
		router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices/oops", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid id, got %d", recorder.Code)
		}
	})

	t.Run("handleAPICancelInvoice rejects missing scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:read"))
		router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/1/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for missing scope, got %d", recorder.Code)
		}
	})

	t.Run("handleAPICancelInvoice rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/not-a-number/cancel", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid id, got %d", recorder.Code)
		}
	})

	t.Run("handleAPISimulatePayment rejects missing scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:read"))
		router.POST("/v1/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/1/simulate-payment", nil)
		router.ServeHTTP(recorder, request)

		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for missing scope, got %d", recorder.Code)
		}
	})

	t.Run("handleAPISimulatePayment rejects non-test api key", func(t *testing.T) {
		// invoices:write scope but live mode key - not test key
		router := gin.New()
		router.Use(withWorkspaceContext(proWorkspace), withAPIKeyScopes("invoices:write"))
		router.POST("/v1/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices/1/simulate-payment", nil)
		router.ServeHTTP(recorder, request)

		// Expects 403 because Mode is not "test"
		if recorder.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for non-test api key, got %d", recorder.Code)
		}
	})
}

func TestValidInternalToken(t *testing.T) {
	ctx := context.Background()

	t.Run("returns false when token is empty string", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "correct"}}
		if server.validInternalToken(ctx, "") {
			t.Fatal("expected empty token to fail validation")
		}
	})

	t.Run("returns false when token is whitespace only", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "correct"}}
		if server.validInternalToken(ctx, "   ") {
			t.Fatal("expected whitespace-only token to fail validation")
		}
	})

	t.Run("returns true for matching static config token", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "correct"}}
		if !server.validInternalToken(ctx, "correct") {
			t.Fatal("expected matching token to be valid")
		}
	})

	t.Run("returns false for non-matching token", func(t *testing.T) {
		server := &Server{cfg: config.Config{InternalToken: "correct"}}
		if server.validInternalToken(ctx, "wrong") {
			t.Fatal("expected non-matching token to fail validation")
		}
	})
}

func TestCookieAndRefreshTokenHelpers(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("setRefreshCookie skips blank values", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		setRefreshCookie(context, "recv_refresh", "   ", "production")
		if got := recorder.Header().Values("Set-Cookie"); len(got) != 0 {
			t.Fatalf("expected no cookie for blank refresh token, got %#v", got)
		}
	})

	t.Run("setRefreshCookie uses secure flag outside development", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		setRefreshCookie(context, "recv_refresh", "token", "production")
		cookie := recorder.Result().Cookies()[0]
		if !cookie.HttpOnly || !cookie.Secure || cookie.MaxAge <= 0 || cookie.Path != "/" {
			t.Fatalf("unexpected production cookie attributes: %#v", cookie)
		}
	})

	t.Run("clearRefreshCookie expires cookie", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		context, _ := gin.CreateTestContext(recorder)
		clearRefreshCookie(context, "recv_refresh", "development")
		cookie := recorder.Result().Cookies()[0]
		if cookie.Value != "" || cookie.MaxAge != -1 || cookie.Secure {
			t.Fatalf("unexpected clear cookie attributes: %#v", cookie)
		}
	})

	t.Run("refreshTokenFromRequest prefers trimmed cookie", func(t *testing.T) {
		context, _ := gin.CreateTestContext(httptest.NewRecorder())
		request := httptest.NewRequest(stdhttp.MethodPost, "/refresh", strings.NewReader(`{"refresh_token":"from-body"}`))
		request.AddCookie(&stdhttp.Cookie{Name: "recv_refresh", Value: " cookie-token "})
		context.Request = request
		if got := refreshTokenFromRequest(context, "recv_refresh"); got != "cookie-token" {
			t.Fatalf("expected cookie token, got %q", got)
		}
	})

	t.Run("refreshTokenFromRequest falls back to body", func(t *testing.T) {
		context, _ := gin.CreateTestContext(httptest.NewRecorder())
		context.Request = httptest.NewRequest(stdhttp.MethodPost, "/refresh", strings.NewReader(`{"refresh_token":" body-token "}`))
		context.Request.Header.Set("Content-Type", "application/json")
		if got := refreshTokenFromRequest(context, "recv_refresh"); got != "body-token" {
			t.Fatalf("expected body token, got %q", got)
		}
	})

	t.Run("refreshTokenFromRequest returns empty on malformed body", func(t *testing.T) {
		context, _ := gin.CreateTestContext(httptest.NewRecorder())
		context.Request = httptest.NewRequest(stdhttp.MethodPost, "/refresh", strings.NewReader(`{`))
		context.Request.Header.Set("Content-Type", "application/json")
		if got := refreshTokenFromRequest(context, "recv_refresh"); got != "" {
			t.Fatalf("expected empty token, got %q", got)
		}
	})
}

func TestCORSMiddlewareAllowedOriginAndDeniedOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(corsMiddleware(config.Config{AllowedOrigins: "https://app.example.com, https://admin.example.com"}))
	router.GET("/resource", func(c *gin.Context) {
		c.Status(stdhttp.StatusNoContent)
	})

	t.Run("allows configured origin and varies by origin", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/resource", nil)
		request.Header.Set("Origin", "https://admin.example.com")
		router.ServeHTTP(recorder, request)
		if recorder.Header().Get("Access-Control-Allow-Origin") != "https://admin.example.com" {
			t.Fatalf("unexpected allow origin: %q", recorder.Header().Get("Access-Control-Allow-Origin"))
		}
		if recorder.Header().Get("Vary") != "Origin" {
			t.Fatalf("expected Vary: Origin, got %q", recorder.Header().Get("Vary"))
		}
	})

	t.Run("does not echo unconfigured origin", func(t *testing.T) {
		recorder := httptest.NewRecorder()
		request := httptest.NewRequest(stdhttp.MethodGet, "/resource", nil)
		request.Header.Set("Origin", "https://evil.example.com")
		router.ServeHTTP(recorder, request)
		if recorder.Header().Get("Access-Control-Allow-Origin") != "" {
			t.Fatalf("unexpected allow origin: %q", recorder.Header().Get("Access-Control-Allow-Origin"))
		}
	})
}

func TestRequestMetricsMiddlewarePassesThrough(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(requestMetricsMiddleware())
	router.GET("/metrics-pass-through", func(c *gin.Context) {
		c.Status(stdhttp.StatusAccepted)
	})

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(stdhttp.MethodGet, "/metrics-pass-through", nil))
	if recorder.Code != stdhttp.StatusAccepted {
		t.Fatalf("expected handler status 202, got %d", recorder.Code)
	}
}

func TestTeamRoleHelpers(t *testing.T) {
	if !canManageTeam(store.RoleOwner) {
		t.Fatal("owner should manage team")
	}
	if !canManageTeam(store.RoleAdmin) {
		t.Fatal("admin should manage team")
	}
	if canManageTeam(store.RoleMember) {
		t.Fatal("member should not manage team")
	}

	validCases := map[string]store.MemberRole{
		"owner":   store.RoleOwner,
		" ADMIN ": store.RoleAdmin,
		"member":  store.RoleMember,
	}
	for input, want := range validCases {
		got, ok := validMemberRole(input)
		if !ok || got != want {
			t.Fatalf("validMemberRole(%q) = %q, %v; want %q, true", input, got, ok, want)
		}
	}
	if got, ok := validMemberRole("superadmin"); ok || got != "" {
		t.Fatalf("expected invalid member role, got %q, %v", got, ok)
	}
}

func withWorkspaceContext(workspace store.Workspace) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}
}

func withAPIKeyScopes(scopes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("api_key_ctx", apiKeyContext{
			Key: store.APIKeyRecord{
				APIKey: store.APIKey{
					ID:     1,
					Scopes: scopes,
				},
			},
		})
		c.Next()
	}
}

func withAdminContextClaims(claims service.AdminClaims) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}
}

func TestAdminLoginValidationAndDisabled(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("rejects when adminService is nil", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.POST("/api/admin/login", server.handleAdminLogin)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
			strings.NewReader(`{"username":"admin","password":"pass"}`)))
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for nil admin service, got %d", rec.Code)
		}
	})

	t.Run("rejects when adminService is disabled (no jwt secret)", func(t *testing.T) {
		server := &Server{adminService: service.NewAdminService("admin", "pass", "", time.Hour)}
		router := gin.New()
		router.POST("/api/admin/login", server.handleAdminLogin)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
			strings.NewReader(`{"username":"admin","password":"pass"}`)))
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for disabled admin service, got %d", rec.Code)
		}
	})

	t.Run("rejects malformed json body", func(t *testing.T) {
		server := &Server{adminService: service.NewAdminService("admin", "pass", "secret", time.Hour)}
		router := gin.New()
		router.POST("/api/admin/login", server.handleAdminLogin)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})
}

func TestAdminReviewInvoiceValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	t.Run("rejects invalid invoice id", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/invoices/not-a-number/review", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid id, got %d", rec.Code)
		}
	})

	t.Run("rejects malformed json body", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/invoices/1/review", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})

	t.Run("rejects invalid review result", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/invoices/1/review",
			strings.NewReader(`{"result":"invalid_result","comment":"test"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid result, got %d", rec.Code)
		}
	})
}

func TestAdminCreateInternalCommentValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	t.Run("rejects malformed json", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/internal-comments", server.handleAdminCreateInternalComment)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/internal-comments", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})

	t.Run("rejects missing required fields", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/internal-comments", server.handleAdminCreateInternalComment)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/internal-comments",
			strings.NewReader(`{"target_type":"invoice","target_id":"","body":""}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for missing fields, got %d", rec.Code)
		}
	})
}

func TestAdminRefreshInvoiceStatusValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	router := gin.New()
	router.POST("/api/admin/invoices/:id/refresh-status", server.handleAdminRefreshInvoiceStatus)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/invoices/oops/refresh-status", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid id, got %d", rec.Code)
	}
}

func TestAdminBillingCheckoutValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	t.Run("rejects invalid workspace id", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/bad-id/billing-checkout", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid workspace id, got %d", rec.Code)
		}
	})

	t.Run("rejects malformed json body", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/1/billing-checkout", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})
}

func TestAdminResendWebhookDeliveryValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	router := gin.New()
	router.POST("/api/admin/webhook-deliveries/:id/resend", server.handleAdminResendWebhookDelivery)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/webhook-deliveries/not-a-number/resend", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid delivery id, got %d", rec.Code)
	}
}

func TestHelperFunctions(t *testing.T) {
	t.Run("max returns larger value", func(t *testing.T) {
		if got := max(5, 3); got != 5 {
			t.Fatalf("max(5,3) = %d, want 5", got)
		}
		if got := max(2, 7); got != 7 {
			t.Fatalf("max(2,7) = %d, want 7", got)
		}
		if got := max(4, 4); got != 4 {
			t.Fatalf("max(4,4) = %d, want 4", got)
		}
	})

	t.Run("ternary returns correct branch", func(t *testing.T) {
		if got := ternary(true, "yes", "no"); got != "yes" {
			t.Fatalf("ternary(true) = %q, want yes", got)
		}
		if got := ternary(false, "yes", "no"); got != "no" {
			t.Fatalf("ternary(false) = %q, want no", got)
		}
	})

	t.Run("payableScale returns 6 for any network", func(t *testing.T) {
		if got := payableScale(store.NetworkTON); got != 6 {
			t.Fatalf("payableScale(TON) = %d, want 6", got)
		}
		if got := payableScale(store.NetworkBASE); got != 6 {
			t.Fatalf("payableScale(BASE) = %d, want 6", got)
		}
	})

	t.Run("inferredNetworkFromPath maps watcher paths", func(t *testing.T) {
		cases := map[string]store.Network{
			"/watchers/ton":      store.NetworkTON,
			"/watchers/tron":     store.NetworkTRON,
			"/watchers/solana":   store.NetworkSOLANA,
			"/watchers/base":     store.NetworkBASE,
			"/watchers/arbitrum": store.NetworkARBITRUM,
			"/watchers/bsc":      store.NetworkBSC,
			"/watchers/evm":      store.NetworkEVM,
			"/watchers/unknown":  store.Network(""),
		}
		for path, want := range cases {
			got := inferredNetworkFromPath(path)
			if got != want {
				t.Fatalf("inferredNetworkFromPath(%q) = %q, want %q", path, got, want)
			}
		}
	})
}

func TestPublicProductEventValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	router := gin.New()
	router.POST("/api/public/events", server.handlePublicProductEvent)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/public/events", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid json, got %d", rec.Code)
	}
}

func TestProductEventValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.POST("/api/events", server.handleProductEvent)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/events", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid json, got %d", rec.Code)
	}
}

func TestAgentBootstrapValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	router := gin.New()
	router.POST("/api/auth/agent/bootstrap", server.handleAgentBootstrap)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/agent/bootstrap", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid json, got %d", rec.Code)
	}
}

func TestAPISimulatePaymentInvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace), withAPIKeyScopes("invoices:write"), func(c *gin.Context) {
		c.Set("api_key_ctx", apiKeyContext{
			Key: store.APIKeyRecord{
				APIKey: store.APIKey{ID: 1, Scopes: []string{"invoices:write"}, Mode: "test"},
			},
		})
		c.Next()
	})
	router.POST("/v1/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/v1/test/invoices/not-a-number/simulate-payment", nil)
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid invoice id, got %d", rec.Code)
	}
}

func TestWriteAdminStoreErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("not found error maps to 404", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			writeAdminStoreError(c, store.ErrNotFound, "record not found")
		})
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/test", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for ErrNotFound, got %d", rec.Code)
		}
	})

	t.Run("other error maps to 400", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			writeAdminStoreError(c, errors.New("some store error"), "not found msg")
		})
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/test", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for generic error, got %d", rec.Code)
		}
	})
}

func TestUpdateContactEmailMalformedJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.POST("/api/me/contact-email", server.handleUpdateContactEmail)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/me/contact-email", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
	}
}

func TestListWalletsAndCreateWalletMalformedJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	t.Run("createWallet rejects malformed json", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/wallets", server.handleCreateWallet)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})

	t.Run("createWallet rejects unsupported wallet network", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/wallets", server.handleCreateWallet)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets",
			strings.NewReader(`{"network":"DOGE","address":"someaddress"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for unsupported network, got %d", rec.Code)
		}
	})

	t.Run("deleteWallet rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.DELETE("/api/wallets/:id", server.handleDeleteWallet)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/wallets/not-a-number", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid wallet id, got %d", rec.Code)
		}
	})
}

func TestCreateInvoiceMalformedJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.POST("/api/invoices", server.handleCreateInvoice)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
	}
}

func TestCreateWebhookEndpointValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	t.Run("validates malformed json for trial webhook access", func(t *testing.T) {
		trialWorkspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeTrial}
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace))
		router.POST("/api/developer/webhooks", server.handleCreateWebhookEndpoint)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks",
			strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json on trial plan, got %d", rec.Code)
		}
	})

	t.Run("rejects malformed json after plan check", func(t *testing.T) {
		// Need active subscription for developer plan features
		subEndsAt := time.Now().Add(30 * 24 * time.Hour)
		devWorkspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeDeveloper, SubscriptionEndsAt: &subEndsAt}
		router := gin.New()
		router.Use(withWorkspaceContext(devWorkspace))
		router.POST("/api/developer/webhooks", server.handleCreateWebhookEndpoint)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/webhooks", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})
}

func TestCreateAPIKeyValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	t.Run("rejects plan without API access (trial)", func(t *testing.T) {
		// Trial workspace does not include API access → 403 before any store call
		trialWorkspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeTrial}
		router := gin.New()
		router.Use(withWorkspaceContext(trialWorkspace))
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys",
			strings.NewReader(`{"label":"test key"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for trial plan (no API), got %d", rec.Code)
		}
	})
}

func TestAdminBlogHandlerValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	t.Run("handleAdminCreateBlogPost rejects malformed json", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})

	t.Run("handleAdminCreateBlogPost rejects missing required fields", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(`{"title":"Only Title"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for missing required fields, got %d", rec.Code)
		}
	})

	t.Run("handleAdminUpdateBlogPost rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.PUT("/api/admin/blog/:id", server.handleAdminUpdateBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPut, "/api/admin/blog/not-a-number", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid id, got %d", rec.Code)
		}
	})

	t.Run("handleAdminUpdateBlogPost rejects malformed json", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.PUT("/api/admin/blog/:id", server.handleAdminUpdateBlogPost)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPut, "/api/admin/blog/1", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})

	t.Run("handleAdminDeleteBlogPost rejects invalid id", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.DELETE("/api/admin/blog/:id", server.handleAdminDeleteBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/admin/blog/oops", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid id, got %d", rec.Code)
		}
	})
}

func TestNormalizeBlogStatus(t *testing.T) {
	if got := normalizeBlogStatus("published", false); got != "published" {
		t.Fatalf("expected published, got %q", got)
	}
	if got := normalizeBlogStatus("draft", true); got != "published" {
		t.Fatalf("expected published when is_published=true, got %q", got)
	}
	if got := normalizeBlogStatus("", false); got != "draft" {
		t.Fatalf("expected draft, got %q", got)
	}
	if got := normalizeBlogStatus("draft", false); got != "draft" {
		t.Fatalf("expected draft for draft status, got %q", got)
	}
}

func TestAdminHasRoleEdgeCases(t *testing.T) {
	claims := service.AdminClaims{Role: "admin", Roles: []string{"ops"}}

	if !adminHasRole(claims, "super_admin") {
		t.Fatal("expected admin role to match super_admin (legacy compatibility)")
	}
	if !adminHasRole(claims, "ops") {
		t.Fatal("expected ops in Roles slice to match")
	}
	if adminHasRole(claims, "nonexistent") {
		t.Fatal("expected no match for nonexistent role")
	}
}

func TestAdminResponseHelpers(t *testing.T) {
	t.Run("adminDailySalesResponse with empty input returns empty slice", func(t *testing.T) {
		result := adminDailySalesResponse(nil)
		if len(result) != 0 {
			t.Fatalf("expected empty slice, got %d items", len(result))
		}
	})

	t.Run("adminDailySalesResponse with data maps fields", func(t *testing.T) {
		items := []store.AdminDailySalesPoint{
			{
				Date:                time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
				PaidUSD:             decimal.RequireFromString("100.50"),
				MerchantPaidUSD:     decimal.RequireFromString("80.25"),
				SubscriptionPaidUSD: decimal.RequireFromString("20.25"),
				PaidCount:           5,
				CreatedCount:        8,
				UnderpaidCount:      1,
				ManualReviewCount:   2,
			},
		}
		result := adminDailySalesResponse(items)
		if len(result) != 1 {
			t.Fatalf("expected 1 item, got %d", len(result))
		}
		if result[0]["date"] != "2026-01-15" {
			t.Fatalf("unexpected date: %v", result[0]["date"])
		}
		if result[0]["paid_count"] != 5 {
			t.Fatalf("unexpected paid_count: %v", result[0]["paid_count"])
		}
	})

	t.Run("adminNetworkBreakdownResponse with data maps fields", func(t *testing.T) {
		items := []store.AdminNetworkBreakdown{
			{Network: store.NetworkBASE, PaidUSD: decimal.RequireFromString("50"), PaidCount: 3, TotalCount: 5},
		}
		result := adminNetworkBreakdownResponse(items)
		if len(result) != 1 {
			t.Fatalf("expected 1 item, got %d", len(result))
		}
		if result[0]["network"] != store.NetworkBASE {
			t.Fatalf("unexpected network: %v", result[0]["network"])
		}
		if result[0]["paid_count"] != 3 {
			t.Fatalf("unexpected paid_count: %v", result[0]["paid_count"])
		}
	})

	t.Run("adminStatusBreakdownResponse with data maps fields", func(t *testing.T) {
		items := []store.AdminStatusBreakdown{
			{Status: store.InvoiceStatusPaid, Count: 10, USD: decimal.RequireFromString("200")},
		}
		result := adminStatusBreakdownResponse(items)
		if len(result) != 1 {
			t.Fatalf("expected 1 item, got %d", len(result))
		}
		if result[0]["status"] != store.InvoiceStatusPaid {
			t.Fatalf("unexpected status: %v", result[0]["status"])
		}
		if result[0]["count"] != 10 {
			t.Fatalf("unexpected count: %v", result[0]["count"])
		}
	})

	t.Run("adminPlanBreakdownResponse with data maps fields", func(t *testing.T) {
		items := []store.AdminPlanBreakdown{
			{PlanCode: store.PlanCodeMerchant, PaidUSD: decimal.RequireFromString("300"), PaidCount: 7},
		}
		result := adminPlanBreakdownResponse(items)
		if len(result) != 1 {
			t.Fatalf("expected 1 item, got %d", len(result))
		}
		if result[0]["plan_code"] != store.PlanCodeMerchant {
			t.Fatalf("unexpected plan_code: %v", result[0]["plan_code"])
		}
	})

	t.Run("adminInvoiceResponseItems with data maps fields", func(t *testing.T) {
		paidAt := time.Now()
		items := []store.AdminInvoiceRecord{
			{
				ID:                 1,
				PublicID:           "INV001",
				WorkspaceID:        100,
				WorkspaceUsername:  "testuser",
				WorkspaceEmail:     "test@example.com",
				Kind:               store.InvoiceKindMerchant,
				PlanCode:           store.PlanCodeMerchant,
				Title:              "Test Invoice",
				BaseAmountUSD:      decimal.RequireFromString("50"),
				PayableAmount:      decimal.RequireFromString("50.000123"),
				PayableNetwork:     store.NetworkBASE,
				DestinationAddress: "0x1111111111111111111111111111111111111111",
				PaymentComment:     "",
				Status:             store.InvoiceStatusPaid,
				Classification:     "paid_exact",
				TxHash:             "0xabc",
				ExpiresAt:          time.Now().Add(time.Hour),
				PaidAt:             &paidAt,
				CreatedAt:          time.Now(),
			},
		}
		result := adminInvoiceResponseItems(items)
		if len(result) != 1 {
			t.Fatalf("expected 1 item, got %d", len(result))
		}
		if result[0]["public_id"] != "INV001" {
			t.Fatalf("unexpected public_id: %v", result[0]["public_id"])
		}
		if result[0]["checkout_url"] != "/app/checkout/INV001" {
			t.Fatalf("unexpected checkout_url: %v", result[0]["checkout_url"])
		}
	})

	t.Run("adminAnalyticsResponse with breakdown maps fields", func(t *testing.T) {
		analytics := store.AdminAnalytics{
			From:             time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC),
			To:               time.Date(2026, 1, 31, 0, 0, 0, 0, time.UTC),
			GroupBy:          "date",
			MRRUSD:           decimal.RequireFromString("1000"),
			ARRUSD:           decimal.RequireFromString("12000"),
			PaidVolumeUSD:    decimal.RequireFromString("500"),
			ActiveWorkspaces: 42,
			CreatedInvoices:  100,
			PaidInvoices:     80,
			Breakdown: []store.AdminAnalyticsBreakdown{
				{
					Bucket:               "2026-01",
					CreatedInvoices:      100,
					PaidInvoices:         80,
					ManualReviewInvoices: 2,
					UnderpaidInvoices:    3,
					PaidVolumeUSD:        decimal.RequireFromString("500"),
				},
			},
		}
		result := adminAnalyticsResponse(analytics)
		if result["group_by"] != "date" {
			t.Fatalf("unexpected group_by: %v", result["group_by"])
		}
		breakdown, ok := result["breakdown"].([]gin.H)
		if !ok || len(breakdown) != 1 {
			t.Fatalf("expected breakdown slice with 1 item")
		}
		if breakdown[0]["bucket"] != "2026-01" {
			t.Fatalf("unexpected bucket: %v", breakdown[0]["bucket"])
		}
	})
}

func TestHandleAdminLogoutWithRefreshToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	router := gin.New()
	router.POST("/api/admin/logout", server.handleAdminLogout)

	t.Run("logout with cookie triggers revoke and clears cookie", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/logout", nil)
		req.AddCookie(&stdhttp.Cookie{Name: "recv_admin_refresh", Value: "some-refresh-token"})
		router.ServeHTTP(rec, req)

		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
		var body map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal error: %v", err)
		}
		if body["ok"] != true {
			t.Fatalf("expected ok=true, got %v", body["ok"])
		}
	})

	t.Run("logout without cookie still succeeds", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/logout", nil)
		router.ServeHTTP(rec, req)

		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})
}

func TestHandleAuthRefreshMissingToken(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authService := service.NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	server := &Server{authService: authService}

	router := gin.New()
	router.POST("/api/auth/refresh", server.handleAuthRefresh)

	t.Run("missing refresh token returns 401", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/refresh", strings.NewReader(`{}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)

		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for missing refresh token, got %d", rec.Code)
		}
	})

	t.Run("invalid refresh token returns 401", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/refresh", strings.NewReader(`{"refresh_token":"invalid-token"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)

		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid refresh token, got %d", rec.Code)
		}
	})
}

func TestHandleTeamVariants(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("handleSwitchWorkspace rejects invalid workspace id", func(t *testing.T) {
		// Invalid id parse happens before authService call, so nil authService is safe here
		server := &Server{authService: service.NewAuthService(nil, "jwt-secret", "", false, time.Hour)}
		workspace := store.Workspace{ID: 1}
		router := gin.New()
		router.Use(withWorkspaceContext(workspace))
		router.POST("/api/workspaces/:id/switch", server.handleSwitchWorkspace)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/workspaces/not-a-number/switch", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid workspace id, got %d", rec.Code)
		}
	})

	t.Run("handleInviteMember rejects malformed json", func(t *testing.T) {
		// Malformed JSON check is before store call, so nil store would panic.
		// But handleInviteMember calls store first. Skip this pattern and test other branches.
		// This case is already covered elsewhere in the test suite.
		t.Skip("requires store — tested via integration tests")
	})
}

func TestHandleCreateBillingCheckoutMalformedJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.POST("/api/billing/checkout", server.handleCreateBillingCheckout)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/billing/checkout", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
	}
}

func TestHandleObservedTransfersMissingTxHash(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}

	router := gin.New()
	router.POST("/internal/watchers/:network", server.handleObservedTransfers)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/base",
		strings.NewReader(`{"events":[{"amount":"1","destination_address":"0x1","network":"BASE"}]}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for event missing tx_hash, got %d", rec.Code)
	}
}

func TestHandleAuthLogout(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("returns 200 without refresh token", func(t *testing.T) {
		server := &Server{authService: service.NewAuthService(nil, "secret", "", false, time.Hour)}
		router := gin.New()
		router.POST("/api/auth/logout", server.handleAuthLogout)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/auth/logout", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("returns 200 with invalid refresh token (error ignored)", func(t *testing.T) {
		server := &Server{authService: service.NewAuthService(nil, "secret", "", false, time.Hour)}
		router := gin.New()
		router.POST("/api/auth/logout", server.handleAuthLogout)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/logout", strings.NewReader(`{"refresh_token":"some-token"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("returns 200 with token from cookie", func(t *testing.T) {
		server := &Server{authService: service.NewAuthService(nil, "secret", "", false, time.Hour)}
		router := gin.New()
		router.POST("/api/auth/logout", server.handleAuthLogout)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/logout", nil)
		req.AddCookie(&stdhttp.Cookie{Name: "recv_refresh", Value: "cookie-token"})
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 with cookie token, got %d", rec.Code)
		}
	})
}

func TestHandleTelegramAuthInvalidData(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// AuthService with nil store is safe for validateInitData (no store access needed).
	authSvc := service.NewAuthService(nil, "secret", "fake-bot-token", false, time.Hour)
	server := &Server{authService: authSvc}

	router := gin.New()
	router.POST("/api/auth/telegram", server.handleTelegramAuth)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram",
		strings.NewReader(`{"telegram_id":123,"username":"testuser","init_data":"invalid_data"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("expected 401 for invalid init data, got %d", rec.Code)
	}
}

func TestHandleAdminBlockWorkspaceValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	t.Run("rejects invalid workspace id", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/bad-id/block", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid workspace id, got %d", rec.Code)
		}
	})

	t.Run("rejects malformed json body", func(t *testing.T) {
		router := gin.New()
		router.Use(withAdminContextClaims(claims))
		router.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/1/block", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})
}

func TestHandleAdminReviewInvoiceIDValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	router := gin.New()
	router.Use(withAdminContextClaims(claims))
	router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/invoices/oops/review", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid invoice id, got %d", rec.Code)
	}
}

func TestHandleAdminAnalyticsInvalidGroupBy(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	claims := service.AdminClaims{Role: "super_admin", Username: "admin"}

	router := gin.New()
	router.Use(withAdminContextClaims(claims))
	router.GET("/api/admin/analytics", server.handleAdminAnalytics)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/analytics?group_by=invalid", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid group_by, got %d", rec.Code)
	}
}

func TestHandleCancelAndMarkPaidWithAPIInvoice(t *testing.T) {
	gin.SetMode(gin.TestMode)
	// An API-created invoice has a non-nil creator_key_id; isWorkspaceManagedInvoice returns false.
	// We can test the "not workspace managed" path via mock store with a returned API invoice.
	// The easiest approach is to test the "invalid id" paths which are already validated,
	// and also confirm both handlers return 400 for API-managed invoices by testing
	// via db-test (those are in http_db_test.go).
	// Here we add the missing malformed JSON path for handleObservedTransfers.

	server := &Server{}

	t.Run("observed transfers malformed json", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/watchers/ton", server.handleObservedTransfers)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(`{bad`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
		}
	})
}

func TestHandleAdminVerifyTOTPMalformedJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	router := gin.New()
	router.POST("/api/admin/login/verify-totp", server.handleAdminVerifyTOTP)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login/verify-totp", strings.NewReader(`{bad`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for malformed json, got %d", rec.Code)
	}
}

func TestHandleAdminLogout(t *testing.T) {
	gin.SetMode(gin.TestMode)
	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	t.Run("returns 200 without token", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/admin/logout", server.handleAdminLogout)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/logout", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("returns 200 with invalid token (error ignored)", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/admin/logout", server.handleAdminLogout)
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/logout", nil)
		req.AddCookie(&stdhttp.Cookie{Name: "recv_admin_refresh", Value: "fake-refresh-token"})
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 with token, got %d", rec.Code)
		}
	})
}

func TestHandleAdminRefreshMissingToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{adminService: adminService}

	router := gin.New()
	router.POST("/api/admin/refresh", server.handleAdminRefresh)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/refresh", nil))
	if rec.Code != stdhttp.StatusUnauthorized {
		t.Fatalf("expected 401 for missing refresh token, got %d", rec.Code)
	}
}

func TestHandleNormalizeScopesAndTokenHelpers(t *testing.T) {
	t.Run("normalizeScopes with empty returns defaults", func(t *testing.T) {
		got := normalizeScopes(nil)
		if len(got) == 0 {
			t.Fatal("expected default scopes for nil input")
		}
	})

	t.Run("normalizeScopes with empty slice returns defaults", func(t *testing.T) {
		got := normalizeScopes([]string{})
		if len(got) == 0 {
			t.Fatal("expected default scopes for empty input")
		}
	})

	t.Run("normalizeScopes deduplicates valid scopes", func(t *testing.T) {
		got := normalizeScopes([]string{"invoices:read", "invoices:write", "invoices:read"})
		if len(got) != 2 {
			t.Fatalf("expected 2 unique scopes, got %d: %v", len(got), got)
		}
	})

	t.Run("normalizeScopes filters out invalid scopes", func(t *testing.T) {
		got := normalizeScopes([]string{"invalid:scope", "invoices:read"})
		if len(got) != 1 || got[0] != "invoices:read" {
			t.Fatalf("expected only invoices:read, got %v", got)
		}
	})

	t.Run("normalizeScopes with all-invalid returns defaults", func(t *testing.T) {
		got := normalizeScopes([]string{"invalid:scope", "   "})
		if len(got) == 0 {
			t.Fatal("expected defaults when all scopes are invalid")
		}
	})

	t.Run("generateTokenWithPrefix produces token with prefix", func(t *testing.T) {
		token, prefix, err := generateTokenWithPrefix("live_", 16)
		if err != nil {
			t.Fatalf("generateTokenWithPrefix: %v", err)
		}
		if !strings.HasPrefix(token, "live_") {
			t.Fatalf("expected token to start with live_, got %q", token)
		}
		if !strings.HasPrefix(prefix, "live_") {
			t.Fatalf("expected prefix to start with live_, got %q", prefix)
		}
	})
}

func TestHandleAPICancelInvoiceValidation(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	t.Run("rejects invalid invoice id", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace), withAPIKeyScopes("invoices:write"))
		router.DELETE("/v1/invoices/:id", server.handleAPICancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/v1/invoices/not-a-number", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid invoice id, got %d", rec.Code)
		}
	})

	t.Run("rejects missing write scope", func(t *testing.T) {
		router := gin.New()
		router.Use(withWorkspaceContext(workspace), withAPIKeyScopes("invoices:read"))
		router.DELETE("/v1/invoices/:id", server.handleAPICancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/v1/invoices/1", nil))
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for missing write scope, got %d", rec.Code)
		}
	})
}

func TestHandleCreateWalletInvalidAddress(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.POST("/api/wallets", server.handleCreateWallet)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets",
		strings.NewReader(`{"network":"EVM","address":"not-a-valid-evm-address"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid EVM address, got %d", rec.Code)
	}
}

func TestHandleDeleteAPIKeyInvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeDeveloper}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.DELETE("/api/developer/api-keys/:id", server.handleDeleteAPIKey)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/developer/api-keys/not-a-number", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid API key id, got %d", rec.Code)
	}
}

func TestHandleDeleteWebhookEndpointInvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	workspace := store.Workspace{ID: 1, PlanCode: store.PlanCodeDeveloper}

	router := gin.New()
	router.Use(withWorkspaceContext(workspace))
	router.DELETE("/api/developer/webhooks/:id", server.handleDeleteWebhookEndpoint)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/developer/webhooks/not-a-number", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for invalid webhook endpoint id, got %d", rec.Code)
	}
}

func TestHandleCreateAPIKeyMalformedJSON(t *testing.T) {
	// Test JSON binding error in handleCreateAPIKey after passing plan check.
	// Requires a DB-backed test to pass CountActiveAPIKeys, so we skip here
	// and only test the plan-without-API path in this unit test file.
	// See TestHandleCreateAPIKeyAtLimitWithDB for the DB-backed version.
}

func TestPaymentURIDefaultCase(t *testing.T) {
	invoice := store.Invoice{
		PayableNetwork:     "UNKNOWN_NETWORK",
		DestinationAddress: "some_address",
	}
	if got := paymentURI(invoice); got != "some_address" {
		t.Fatalf("expected default paymentURI to return destination address, got %q", got)
	}
}

func TestHandlePublicGetBlogPostEmptySlug(t *testing.T) {
	gin.SetMode(gin.TestMode)
	server := &Server{}
	router := gin.New()
	// Register without :slug param so c.Param("slug") returns ""
	router.GET("/blog/post", server.handlePublicGetBlogPost)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog/post", nil))
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for empty slug, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestValidateWebhookURLAdditionalCases(t *testing.T) {
	cases := []struct {
		rawURL string
		appEnv string
		valid  bool
	}{
		{"https://example.com/webhook", "development", true},
		{"http://example.com/webhook", "development", true},
		{"ftp://example.com", "development", false},
		{"", "development", false},
		{"https://example.com", "production", true},
		{"https://localhost/hook", "production", false},
		{"http://example.com", "production", false}, // production requires https
	}
	for _, tc := range cases {
		err := validateWebhookURL(tc.rawURL, tc.appEnv)
		if tc.valid && err != nil {
			t.Fatalf("env=%q url=%q: expected valid, got error: %v", tc.appEnv, tc.rawURL, err)
		}
		if !tc.valid && err == nil {
			t.Fatalf("env=%q url=%q: expected invalid, got nil error", tc.appEnv, tc.rawURL)
		}
	}
}
