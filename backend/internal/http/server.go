package http

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"recv/backend/internal/config"
	"recv/backend/internal/metrics"
	"recv/backend/internal/service"
	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

type Server struct {
	cfg            config.Config
	store          httpStore
	authService    *service.AuthService
	adminService   *service.AdminService
	invoiceService *service.InvoiceService
	paymentService *service.PaymentService
	apiLimiter     *memoryRateLimiter
}

type memoryRateLimiter struct {
	mu      sync.Mutex
	buckets map[string]rateBucket
}

type rateBucket struct {
	tokens    int
	resetAt   time.Time
	lastLimit int
}

type workspaceContext struct {
	Claims    service.Claims
	Workspace store.Workspace
}

const (
	authJSONBodyLimitBytes        = 64 << 10
	publicWriteJSONBodyLimitBytes = 64 << 10
)

// respondError writes a JSON error response. For 5xx statuses it logs the
// underlying error server-side and returns a generic message, so internal
// details (SQL, driver, schema) never reach clients. For 4xx it surfaces the
// error text, which is request-shaped (validation/auth/conflict) and safe.
func respondError(c *gin.Context, status int, err error) {
	if status >= http.StatusInternalServerError {
		log.Printf("http %s %s: %v", c.Request.Method, c.FullPath(), err)
		c.JSON(status, gin.H{"error": "internal server error"})
		return
	}
	c.JSON(status, gin.H{"error": err.Error()})
}

// abortError is respondError for middleware paths that must abort the chain.
func abortError(c *gin.Context, status int, err error) {
	if status >= http.StatusInternalServerError {
		log.Printf("http %s %s: %v", c.Request.Method, c.FullPath(), err)
		c.AbortWithStatusJSON(status, gin.H{"error": "internal server error"})
		return
	}
	c.AbortWithStatusJSON(status, gin.H{"error": err.Error()})
}

func limitJSONBody(c *gin.Context, maxBytes int64) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
}

func (s *Server) allowIPRate(c *gin.Context, scope string, limit int, window time.Duration) bool {
	if s.store == nil {
		return true
	}
	_, allowed, err := s.store.AllowRateLimit(c.Request.Context(), "ip:"+scope+":"+c.ClientIP(), limit, window)
	if err != nil {
		abortError(c, http.StatusInternalServerError, err)
		return false
	}
	if !allowed {
		c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
		return false
	}
	return true
}

func NewServer(cfg config.Config, st *store.Store, authService *service.AuthService, adminService *service.AdminService, invoiceService *service.InvoiceService, paymentService *service.PaymentService) *gin.Engine {
	server := &Server{
		cfg:            cfg,
		store:          st,
		authService:    authService,
		adminService:   adminService,
		invoiceService: invoiceService,
		paymentService: paymentService,
		apiLimiter:     &memoryRateLimiter{buckets: map[string]rateBucket{}},
	}

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), corsMiddleware(cfg), requestMetricsMiddleware())

	router.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true, "service": "recv-api"})
	})

	router.POST("/api/auth/telegram", server.handleTelegramAuth)
	router.POST("/api/auth/agent/bootstrap", server.handleAgentBootstrap)
	router.POST("/api/auth/telegram/request-code", server.handleTelegramCodeRequest)
	router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)
	router.GET("/api/auth/oauth/:provider/start", server.handleOAuthStart)
	router.GET("/api/auth/oauth/:provider/callback", server.handleOAuthCallback)
	router.POST("/api/auth/refresh", server.handleAuthRefresh)
	router.POST("/api/auth/logout", server.handleAuthLogout)
	router.POST("/api/admin/login", server.handleAdminLogin)
	router.POST("/api/admin/refresh", server.handleAdminRefresh)
	router.POST("/api/admin/logout", server.handleAdminLogout)
	router.GET("/api/public/invoices/:public_id", server.handlePublicInvoice)
	router.GET("/api/public/payment-options", server.handlePublicPaymentOptions)
	router.POST("/api/public/events", server.handlePublicProductEvent)
	router.POST("/api/public/web-vitals", server.handlePublicWebVital)
	router.POST("/api/public/utm-visit", server.handlePublicUTMVisit)
	router.POST("/api/public/utm-event", server.handlePublicUTMEvent)
	router.GET("/api/public/referral-codes/:code", server.handlePublicReferralCode)
	router.GET("/api/public/seo/redirect", server.handlePublicResolveSEORedirect)

	internal := router.Group("/internal")
	internal.Use(server.internalTokenMiddleware())
	internal.POST("/watchers/tron", server.handleObservedTransfers)
	internal.POST("/watchers/ton", server.handleObservedTransfers)
	internal.POST("/watchers/solana", server.handleObservedTransfers)
	internal.POST("/watchers/evm", server.handleObservedTransfers)
	internal.POST("/watchers/base", server.handleObservedTransfers)
	internal.POST("/watchers/arbitrum", server.handleObservedTransfers)
	internal.POST("/watchers/bsc", server.handleObservedTransfers)
	internal.POST("/admin/workspaces/:id/grant-pro", server.handleGrantPRO)
	internal.POST("/admin/workspaces/:id/block", server.handleBlockWorkspace)

	api := router.Group("/api")
	api.Use(server.authMiddleware())
	api.GET("/me", server.handleMe)
	api.POST("/me/contact-email", server.handleUpdateContactEmail)
	api.POST("/me/language", server.handleUpdateLanguage)
	api.GET("/account/identities", server.handleListAuthIdentities)
	api.POST("/account/identities/:provider/link", server.handleOAuthLinkStart)
	api.POST("/events", server.handleProductEvent)
	api.GET("/developer/usage", server.handleDeveloperUsage)
	api.GET("/developer/api-keys", server.handleListAPIKeys)
	api.POST("/developer/api-keys", server.handleCreateAPIKey)
	api.DELETE("/developer/api-keys/:id", server.handleDeleteAPIKey)
	api.GET("/developer/webhooks", server.handleListWebhookEndpoints)
	api.POST("/developer/webhooks", server.handleCreateWebhookEndpoint)
	api.POST("/developer/webhooks/:id/rotate-secret", server.handleRotateWebhookEndpointSecret)
	api.DELETE("/developer/webhooks/:id", server.handleDeleteWebhookEndpoint)
	api.GET("/developer/webhook-deliveries", server.handleListWebhookDeliveries)
	api.POST("/developer/webhook-deliveries/:id/resend", server.handleResendWebhookDelivery)
	api.GET("/wallets", server.handleListWallets)
	api.POST("/wallets", server.handleCreateWallet)
	api.DELETE("/wallets/:id", server.handleDeleteWallet)
	api.POST("/billing/checkout", server.handleCreateBillingCheckout)
	api.POST("/billing/promo-code/redeem", server.handleRedeemPromoCode)
	api.GET("/invoices", server.handleListInvoices)
	api.POST("/invoices", server.handleCreateInvoice)
	api.GET("/invoices/:id", server.handleGetInvoice)
	api.POST("/invoices/:id/cancel", server.handleCancelInvoice)
	api.POST("/invoices/:id/mark-paid", server.handleMarkInvoicePaid)
	api.GET("/team", server.handleListTeam)
	api.POST("/team/invites", server.handleInviteMember)
	api.DELETE("/team/invites/:id", server.handleRevokeInvite)
	api.POST("/team/members/:userId/role", server.handleUpdateMemberRole)
	api.PUT("/team/members/:userId", server.handleUpdateMemberRole)
	api.DELETE("/team/members/:userId", server.handleRemoveMember)
	api.POST("/workspaces/:id/switch", server.handleSwitchWorkspace)

	devAPI := router.Group("/v1")
	devAPI.Use(server.apiKeyMiddleware())
	devAPI.GET("/me", server.handleAPIMe)
	devAPI.GET("/invoices", server.handleAPIListInvoices)
	devAPI.POST("/invoices", server.handleAPICreateInvoice)
	devAPI.GET("/invoices/:id", server.handleAPIGetInvoice)
	devAPI.POST("/invoices/:id/cancel", server.handleAPICancelInvoice)
	devAPI.POST("/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

	adminAPI := router.Group("/api/admin")
	adminAPI.Use(server.adminMiddleware())
	adminAPI.GET("/overview", server.handleAdminOverview)
	adminAPI.GET("/ops/overview", server.handleAdminOpsOverview)
	adminAPI.GET("/invoices", server.handleAdminInvoices)
	adminAPI.GET("/workspaces", server.handleAdminWorkspaces)
	adminAPI.GET("/wallets", server.handleAdminWallets)
	adminAPI.GET("/webhooks/failed", server.handleAdminFailedWebhooks)
	adminAPI.GET("/watchers", server.handleAdminWatchers)
	adminAPI.GET("/notifications", server.handleAdminNotifications)
	adminAPI.GET("/analytics", server.handleAdminAnalytics)
	adminAPI.GET("/analytics/web-vitals", server.handleAdminWebVitals)
	adminAPI.GET("/analytics/utm", server.handleAdminUTMReport)
	adminAPI.GET("/referrals/partners", server.handleAdminListReferralPartners)
	adminAPI.POST("/referrals/partners", server.handleAdminCreateReferralPartner)
	adminAPI.PUT("/referrals/partners/:id", server.handleAdminUpdateReferralPartner)
	adminAPI.GET("/referrals/partners/:id/report", server.handleAdminReferralPartnerReport)
	adminAPI.POST("/referrals/partners/:id/payouts", server.handleAdminCreateReferralPayout)
	adminAPI.GET("/audit-events", server.handleAdminAuditEvents)
	adminAPI.GET("/seo-targets", server.handleAdminSEOTargets)
	adminAPI.POST("/sessions/revoke", server.handleAdminRevokeSession)
	adminAPI.POST("/workspaces/:id/block", server.handleAdminBlockWorkspace)
	adminAPI.POST("/workspaces/:id/plan", server.handleAdminSetWorkspacePlan)
	adminAPI.POST("/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)
	adminAPI.POST("/webhook-deliveries/:id/resend", server.handleAdminResendWebhookDelivery)
	adminAPI.POST("/invoices/:id/review", server.handleAdminReviewInvoice)
	adminAPI.POST("/invoices/:id/refresh-status", server.handleAdminRefreshInvoiceStatus)
	adminAPI.POST("/internal-comments", server.handleAdminCreateInternalComment)
	adminAPI.GET("/config/billing-wallets", server.handleAdminGetBillingWallets)
	adminAPI.POST("/config/billing-wallets", server.handleAdminUpdateBillingWallets)
	adminAPI.GET("/promocodes", server.handleAdminListPromoCodes)
	adminAPI.POST("/promocodes", server.handleAdminCreatePromoCode)
	adminAPI.DELETE("/promocodes/:id", server.handleAdminDeletePromoCode)
	adminAPI.GET("/seo/robots", server.handleAdminGetRobotsConfig)
	adminAPI.PUT("/seo/robots", server.handleAdminUpdateRobotsConfig)
	adminAPI.GET("/seo/redirects", server.handleAdminListSEORedirects)
	adminAPI.POST("/seo/redirects", server.handleAdminCreateSEORedirect)
	adminAPI.PUT("/seo/redirects/:id", server.handleAdminUpdateSEORedirect)
	adminAPI.DELETE("/seo/redirects/:id", server.handleAdminDeleteSEORedirect)

	adminAPI.GET("/media", server.handleAdminListMedia)
	adminAPI.POST("/media", server.handleAdminUploadMedia)
	adminAPI.PATCH("/media/:id", server.handleAdminUpdateMediaAlt)
	adminAPI.DELETE("/media/:id", server.handleAdminDeleteMedia)

	adminAPI.GET("/blog", server.handleAdminListBlogPosts)
	adminAPI.POST("/blog", server.handleAdminCreateBlogPost)
	adminAPI.PUT("/blog/:id", server.handleAdminUpdateBlogPost)
	adminAPI.DELETE("/blog/:id", server.handleAdminDeleteBlogPost)

	publicBlog := router.Group("/api/public/blog")
	publicBlog.GET("", server.handlePublicListBlogPosts)
	publicBlog.GET("/sitemap", server.handlePublicBlogSitemap)
	publicBlog.GET("/:slug", server.handlePublicGetBlogPost)
	router.GET("/api/public/seo/robots", server.handlePublicRobotsConfig)
	router.GET("/media/:file", server.handlePublicMedia)
	router.HEAD("/media/:file", server.handlePublicMedia)

	router.GET("/docs/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return router
}

func (s *Server) handleTelegramAuth(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	if !s.allowIPRate(c, "auth_telegram", 10, time.Minute) {
		return
	}
	limitJSONBody(c, authJSONBodyLimitBytes)
	var body service.TelegramAuthInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.authService.AuthenticateTelegram(ctx, body)
	if err != nil {
		metrics.IncAuthAttempt("telegram", "failure", "authenticate")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram", "success", "authenticated")
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleTelegramCodeRequest(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	if !s.allowIPRate(c, "auth_telegram_code_request", 10, time.Minute) {
		return
	}
	limitJSONBody(c, authJSONBodyLimitBytes)
	var body service.TelegramCodeRequestInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := s.authService.RequestTelegramLoginCode(ctx, body); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "request_code")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram_code_request", "success", "sent")
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) handleTelegramCodeLogin(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	if !s.allowIPRate(c, "auth_telegram_code_login", 10, time.Minute) {
		return
	}
	limitJSONBody(c, authJSONBodyLimitBytes)
	var body service.TelegramCodeLoginInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.authService.AuthenticateTelegramCode(ctx, body)
	if err != nil {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "authenticate")
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	metrics.IncAuthAttempt("telegram_code_login", "success", "authenticated")
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleOAuthStart(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	redirectPath := sanitizeOAuthHTTPRedirect(c.Query("next"))
	refCode := strings.TrimSpace(c.Query("ref_code"))
	result, err := s.authService.StartOAuth(ctx, service.OAuthStartInput{
		Provider:     c.Param("provider"),
		Mode:         "login",
		RedirectPath: redirectPath,
		RefCode:      refCode,
	})
	if err != nil {
		respondError(c, http.StatusBadRequest, err)
		return
	}
	c.Redirect(http.StatusFound, result.URL)
}

func (s *Server) handleOAuthCallback(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_auth")
	if errText := strings.TrimSpace(c.Query("error")); errText != "" {
		c.Redirect(http.StatusFound, s.oauthFailureRedirect(errText))
		return
	}
	result, err := s.authService.CompleteOAuth(ctx, service.OAuthCallbackInput{
		Provider: c.Param("provider"),
		Code:     c.Query("code"),
		State:    c.Query("state"),
	})
	if err != nil {
		c.Redirect(http.StatusFound, s.oauthFailureRedirect(err.Error()))
		return
	}
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.Redirect(http.StatusFound, s.oauthSuccessRedirect(result))
}

func (s *Server) handleListAuthIdentities(c *gin.Context) {
	wc := workspaceFromContext(c)
	identities, err := s.store.ListAuthIdentities(c.Request.Context(), wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"identities": identities})
}

func (s *Server) handleOAuthLinkStart(c *gin.Context) {
	wc := workspaceFromContext(c)
	var body struct {
		RedirectPath string `json:"redirect_path"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		respondError(c, http.StatusBadRequest, err)
		return
	}
	userID := wc.Claims.UserID
	result, err := s.authService.StartOAuth(c.Request.Context(), service.OAuthStartInput{
		Provider:     c.Param("provider"),
		Mode:         "link",
		RedirectPath: sanitizeOAuthHTTPRedirect(body.RedirectPath),
		UserID:       &userID,
	})
	if err != nil {
		respondError(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleAgentBootstrap(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "agent_bootstrap")
	if !s.allowIPRate(c, "auth_agent_bootstrap", 10, time.Minute) {
		return
	}
	limitJSONBody(c, authJSONBodyLimitBytes)
	var body service.AgentBootstrapInput
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("agent_bootstrap", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := s.authService.BootstrapAgentWorkspace(ctx, body)
	if err != nil {
		metrics.IncAuthAttempt("agent_bootstrap", "failure", "bootstrap")
		if err.Error() == "terms of service must be accepted (terms_accepted: true)" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	metrics.IncAuthAttempt("agent_bootstrap", "success", "created")
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusCreated, result)
}

func (s *Server) handleAuthRefresh(c *gin.Context) {
	refreshToken := refreshTokenFromRequest(c, "recv_refresh")
	if refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}
	result, err := s.authService.Refresh(c.Request.Context(), refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleAuthLogout(c *gin.Context) {
	refreshToken := refreshTokenFromRequest(c, "recv_refresh")
	if refreshToken != "" {
		_ = s.authService.Logout(c.Request.Context(), refreshToken)
	}
	clearRefreshCookie(c, "recv_refresh", s.cfg.AppEnv)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) handleProductEvent(c *gin.Context) {
	wc := workspaceFromContext(c)
	var body store.ProductEventInput
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event payload"})
		return
	}
	body.WorkspaceID = &wc.Workspace.ID
	if err := s.store.RecordProductEvent(c.Request.Context(), body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record event"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handlePublicProductEvent(c *gin.Context) {
	if !s.allowIPRate(c, "public_events", 60, time.Minute) {
		return
	}
	limitJSONBody(c, publicWriteJSONBodyLimitBytes)
	var body store.ProductEventInput
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid event payload"})
		return
	}
	if err := s.store.RecordProductEvent(c.Request.Context(), body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to record event"})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleMe(c *gin.Context) {
	wc := workspaceFromContext(c)
	now := time.Now()
	plan := wc.Workspace.EffectivePlan(now)

	workspaces, err := s.store.ListWorkspacesForUser(c.Request.Context(), wc.Claims.UserID)
	if err != nil {
		workspaces = []store.Workspace{wc.Workspace}
	}

	c.JSON(http.StatusOK, gin.H{
		"workspace":  wc.Workspace,
		"workspaces": workspaces,
		"user":       wc.Claims, // claims has user_id now
		"plan": map[string]any{
			"code":            plan.Code,
			"name":            plan.Name,
			"is_pro":          plan.Code != store.PlanCodeTrial,
			"has_api":         plan.HasAPI,
			"has_webhooks":    plan.HasWebhooks,
			"trial_limit":     service.TrialInvoiceLimit,
			"trial_remaining": max(0, service.TrialInvoiceLimit-wc.Workspace.FreeInvoicesUsed),
			"price_usd":       plan.PriceUSDString,
			"billing_days":    plan.BillingDays,
			"api_key_limit":   plan.APIKeyLimit,
			"monthly_cap":     plan.MonthlyRequestCap,
			"rpm_limit":       plan.RequestsPerMinute,
			"webhook_retries": plan.WebhookRetries,
		},
		"plans": store.ListPaidPlans(),
	})
}

func (s *Server) handleUpdateContactEmail(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		Email string `json:"email"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	email := strings.TrimSpace(strings.ToLower(body.Email))
	if email != "" && !strings.Contains(email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
		return
	}

	workspace, err := s.store.UpdateWorkspaceEmail(c.Request.Context(), wc.Workspace.ID, email)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "email already in use"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"workspace": workspace})
}

func (s *Server) handleUpdateLanguage(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		Language string `json:"language"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid language payload"})
		return
	}

	language := store.NormalizeLanguage(body.Language)
	workspace, err := s.store.UpdateWorkspaceLanguage(c.Request.Context(), wc.Workspace.ID, language)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"workspace": workspace, "language": workspace.Language})
}

func (s *Server) handleListWallets(c *gin.Context) {
	wc := workspaceFromContext(c)
	wallets, err := s.store.ListWallets(c.Request.Context(), wc.Workspace.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": wallets})
}

func (s *Server) handleCreateWallet(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		Network     string            `json:"network"`
		Address     string            `json:"address"`
		Environment store.Environment `json:"environment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	network := store.Network(strings.ToUpper(strings.TrimSpace(body.Network)))
	address := strings.TrimSpace(body.Address)
	env := body.Environment
	if env == "" {
		env = store.EnvironmentLive
	}
	if !network.IsSupportedWalletNetwork() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported wallet network"})
		return
	}
	if err := validateWallet(network, address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	wallet, err := s.store.CreateWallet(c.Request.Context(), wc.Workspace.ID, network, address, env)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, wallet)
}

func (s *Server) handleDeleteWallet(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	walletID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid wallet id"})
		return
	}
	if err := s.store.DeactivateWallet(c.Request.Context(), wc.Workspace.ID, walletID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleListInvoices(c *gin.Context) {
	wc := workspaceFromContext(c)
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)
	status := strings.TrimSpace(c.Query("status"))
	query := strings.TrimSpace(c.Query("query"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	items, total, err := s.store.ListInvoices(c.Request.Context(), wc.Workspace.ID, store.ListInvoicesFilter{
		Limit:  pageSize,
		Offset: (page - 1) * pageSize,
		Status: status,
		Query:  query,
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":     items,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func (s *Server) handleCreateInvoice(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		Title          string `json:"title"`
		BaseAmountUSD  string `json:"base_amount_usd"`
		PayableNetwork string `json:"payable_network"`
		PayableAsset   string `json:"payable_asset"`
		PaymentOptions []struct {
			Network string `json:"network"`
			Asset   string `json:"asset"`
		} `json:"payment_options"`
		ExpiresInMinutes int `json:"expires_in_minutes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	baseAmount, err := decimal.NewFromString(strings.TrimSpace(body.BaseAmountUSD))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base_amount_usd"})
		return
	}

	invoice, err := s.invoiceService.CreateInvoice(c.Request.Context(), wc.Workspace, service.CreateInvoiceInput{
		Title:            strings.TrimSpace(body.Title),
		BaseAmountUSD:    baseAmount,
		PayableNetwork:   store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork))),
		PayableAsset:     store.NormalizePaymentAsset(body.PayableAsset),
		PaymentOptions:   parsePaymentOptionInputs(body.PaymentOptions),
		ExpiresInMinutes: body.ExpiresInMinutes,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, publicInvoiceResponse(invoice))
}

func (s *Server) handleGetInvoice(c *gin.Context) {
	wc := workspaceFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}

	invoice, err := s.store.GetInvoiceByID(c.Request.Context(), wc.Workspace.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func (s *Server) handleCancelInvoice(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	currentInvoice, err := s.store.GetInvoiceByID(c.Request.Context(), wc.Workspace.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	if !isWorkspaceManagedInvoice(currentInvoice) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only workspace-created invoices can be canceled"})
		return
	}
	invoice, err := s.store.SetInvoiceStatus(c.Request.Context(), wc.Workspace.ID, invoiceID, store.InvoiceStatusExpired)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func (s *Server) handleMarkInvoicePaid(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	currentInvoice, err := s.store.GetInvoiceByID(c.Request.Context(), wc.Workspace.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	if !isWorkspaceManagedInvoice(currentInvoice) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only workspace-created invoices can be marked paid"})
		return
	}

	invoice, err := s.store.MarkInvoicePaidManual(c.Request.Context(), wc.Workspace.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func (s *Server) handlePublicInvoice(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "public_checkout")
	invoice, err := s.store.GetInvoiceByPublicID(ctx, c.Param("public_id"))
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

// handlePublicPaymentOptions exposes the supported network/asset matrix so
// external consumers (MCP server, integrations) stay in sync with the
// backend's actual support checks.
func (s *Server) handlePublicPaymentOptions(c *gin.Context) {
	c.Header("Cache-Control", "public, max-age=300")
	c.JSON(http.StatusOK, gin.H{"options": store.SupportedPaymentOptions()})
}

func (s *Server) handleObservedTransfers(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "watcher_ingest")
	var body struct {
		Events []struct {
			TxHash             string             `json:"tx_hash"`
			Network            store.Network      `json:"network"`
			Asset              store.PaymentAsset `json:"asset"`
			DestinationAddress string             `json:"destination_address"`
			Amount             decimal.Decimal    `json:"amount"`
			PaymentComment     string             `json:"payment_comment"`
			ObservedAt         time.Time          `json:"observed_at"`
			RawPayload         any                `json:"raw_payload"`
		} `json:"events"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	metrics.ObserveBatch("observed_transfers", "watcher_ingest", len(body.Events))

	results := make([]service.PaymentResult, 0, len(body.Events))
	for _, event := range body.Events {
		raw := store.MustJSON(event.RawPayload)
		transfer := store.ObservedTransfer{
			TxHash:             event.TxHash,
			Network:            event.Network,
			Asset:              event.Asset,
			DestinationAddress: event.DestinationAddress,
			Amount:             event.Amount,
			PaymentComment:     strings.TrimSpace(event.PaymentComment),
			ObservedAt:         event.ObservedAt,
			RawPayload:         raw,
		}
		if transfer.Network == "" {
			transfer.Network = inferredNetworkFromPath(c.FullPath())
		}
		if err := service.NormalizeObservedTransfer(&transfer); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		result, err := s.paymentService.ProcessObservedTransfer(ctx, transfer)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		results = append(results, result)
	}

	c.JSON(http.StatusOK, gin.H{"items": results})
}

func (s *Server) handleGrantPRO(c *gin.Context) {
	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}

	var body struct {
		Days int `json:"days"`
	}
	_ = c.ShouldBindJSON(&body)

	workspace, err := s.store.GrantPRO(c.Request.Context(), workspaceID, body.Days)
	if err != nil {
		metrics.IncAdminOperation("grant_pro", "failure")
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	metrics.IncAdminOperation("grant_pro", "success")
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), "internal", "grant_pro", "workspace", strconv.FormatInt(workspaceID, 10), gin.H{"days": body.Days})
	c.JSON(http.StatusOK, gin.H{"workspace": workspace})
}

func (s *Server) handleBlockWorkspace(c *gin.Context) {
	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}

	var body struct {
		Blocked bool `json:"blocked"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workspace, err := s.store.SetWorkspaceBlocked(c.Request.Context(), workspaceID, body.Blocked)
	if err != nil {
		metrics.IncAdminOperation("set_blocked", "failure")
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}
	metrics.IncAdminOperation("set_blocked", "success")
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), "internal", "set_blocked", "workspace", strconv.FormatInt(workspaceID, 10), gin.H{"blocked": body.Blocked})
	c.JSON(http.StatusOK, gin.H{"workspace": workspace})
}

func (s *Server) authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			metrics.IncAuthAttempt("bearer_token", "failure", "missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		token := strings.TrimSpace(header[len("Bearer "):])
		claims, err := s.authService.ParseToken(token)
		if err != nil {
			metrics.IncAuthAttempt("bearer_token", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		workspace, err := s.store.GetWorkspaceByID(c.Request.Context(), claims.WorkspaceID)
		if err != nil {
			metrics.IncAuthAttempt("bearer_token", "failure", "workspace_not_found")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "workspace not found"})
			return
		}
		if workspace.IsBlocked {
			metrics.IncAuthAttempt("bearer_token", "failure", "workspace_blocked")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "workspace account is blocked"})
			return
		}

		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "workspace_api"))
		metrics.IncAuthAttempt("bearer_token", "success", "authenticated")
		c.Set("workspace_ctx", workspaceContext{Claims: claims, Workspace: workspace})
		c.Next()
	}
}

func (s *Server) internalTokenMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := strings.TrimSpace(c.GetHeader("X-Internal-Token"))
		if token == "" {
			auth := strings.TrimSpace(c.GetHeader("Authorization"))
			if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
				token = strings.TrimSpace(auth[len("Bearer "):])
			}
		}
		if !s.validInternalToken(c.Request.Context(), token) {
			metrics.IncAuthAttempt("internal_token", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid internal token"})
			return
		}
		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "internal_api"))
		metrics.IncAuthAttempt("internal_token", "success", "authenticated")
		c.Next()
	}
}

func (s *Server) validInternalToken(ctx context.Context, token string) bool {
	token = strings.TrimSpace(token)
	if token == "" {
		return false
	}
	if s.store != nil {
		if cfg, err := s.store.GetSystemConfig(ctx, "internal_token_hashes"); err == nil {
			var hashes []string
			if json.Unmarshal(cfg.Value, &hashes) == nil {
				tokenHash := hashSecret(token)
				for _, candidate := range hashes {
					if strings.TrimSpace(candidate) == tokenHash {
						return true
					}
				}
				return false
			}
		}
	}
	return token == s.cfg.InternalToken
}

func requestMetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startedAt := time.Now()
		c.Next()
		metrics.ObserveHTTPRequest(c.Request.Method, c.FullPath(), c.Writer.Status(), time.Since(startedAt))
	}
}

func workspaceFromContext(c *gin.Context) workspaceContext {
	value, _ := c.Get("workspace_ctx")
	return value.(workspaceContext)
}

func (s *Server) oauthSuccessRedirect(result service.OAuthCallbackResult) string {
	target := strings.TrimRight(s.cfg.PublicAppURL, "/") + sanitizeOAuthHTTPRedirect(result.RedirectPath)
	parsed, err := url.Parse(target)
	if err != nil {
		return strings.TrimRight(s.cfg.PublicAppURL, "/") + "/console?oauth=success"
	}
	values := parsed.Query()
	values.Set("oauth", "success")
	values.Set("oauth_mode", result.Mode)
	if result.Created {
		values.Set("oauth_created", "1")
	}
	if result.Merged {
		values.Set("oauth_merged", "1")
	}
	parsed.RawQuery = values.Encode()
	return parsed.String()
}

func (s *Server) oauthFailureRedirect(message string) string {
	values := url.Values{}
	values.Set("oauth_error", message)
	return strings.TrimRight(s.cfg.PublicAppURL, "/") + "/auth?" + values.Encode()
}

func sanitizeOAuthHTTPRedirect(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "/console"
	}
	if !strings.HasPrefix(value, "/") || strings.HasPrefix(value, "//") {
		return "/console"
	}
	if strings.Contains(value, "\n") || strings.Contains(value, "\r") {
		return "/console"
	}
	return value
}

func publicInvoiceResponse(invoice store.Invoice) gin.H {
	status := invoice.Status
	if invoice.IsExpired(time.Now()) {
		status = store.InvoiceStatusExpired
	}
	comment := ""
	if invoice.PaymentComment != nil {
		comment = *invoice.PaymentComment
	}

	return gin.H{
		"id":                  invoice.ID,
		"public_id":           invoice.PublicID,
		"title":               invoice.Title,
		"kind":                invoice.Kind,
		"subscription_days":   invoice.SubscriptionDays,
		"plan_code":           normalizedInvoicePlanCode(invoice),
		"checkout_badge":      checkoutBadge(invoice),
		"base_amount_usd":     invoice.BaseAmountUSD.StringFixed(2),
		"payable_amount":      invoice.PayableAmount.StringFixed(payableScale(invoice.PayableNetwork)),
		"payable_network":     invoice.PayableNetwork,
		"payable_asset":       invoice.PayableAsset,
		"payment_options":     paymentOptionResponses(invoice),
		"destination_address": invoice.DestinationAddress,
		"payment_comment":     comment,
		"status":              status,
		"environment":         invoice.Mode,
		"mode":                invoice.Mode,
		"expires_at":          invoice.ExpiresAt,
		"created_at":          invoice.CreatedAt,
		"tx_hash":             invoice.TxHash,
		"received_amount":     invoice.ReceivedAmount.StringFixed(payableScale(invoice.PayableNetwork)),
		"review_reason":       invoice.ReviewReason,
		"finalized_at":        invoice.FinalizedAt,
		"checkout_url":        "/app/checkout/" + invoice.PublicID,
		"payment_uri":         paymentURI(invoice),
	}
}

func isWorkspaceManagedInvoice(invoice store.Invoice) bool {
	return invoice.Kind == store.InvoiceKindMerchant && invoice.SubscriptionDays <= 0
}

func (s *Server) handleCreateBillingCheckout(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		PayableNetwork string `json:"payable_network"`
		PayableAsset   string `json:"payable_asset"`
		PaymentOptions []struct {
			Network string `json:"network"`
			Asset   string `json:"asset"`
		} `json:"payment_options"`
		PlanCode         string `json:"plan_code"`
		SubscriptionDays int    `json:"subscription_days"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if body.SubscriptionDays > 0 && body.SubscriptionDays < 14 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "subscription duration must be at least 14 days"})
		return
	}

	network := store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork)))
	planCode := store.NormalizePlanCode(body.PlanCode)
	if strings.TrimSpace(body.PlanCode) == "" {
		planCode = store.PlanCodeMerchant
	}
	options := parsePaymentOptionInputs(body.PaymentOptions)
	if len(options) == 0 {
		options = []service.PaymentOptionInput{{Network: network, Asset: store.NormalizePaymentAsset(body.PayableAsset)}}
	}
	invoice, err := s.invoiceService.CreatePlanInvoiceWithPriceAndOptions(c.Request.Context(), wc.Workspace, planCode, options, nil, body.SubscriptionDays)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, publicInvoiceResponse(invoice))
}

func checkoutBadge(invoice store.Invoice) string {
	if invoice.Kind == store.InvoiceKindSubscription {
		return store.ResolvePlan(normalizedInvoicePlanCode(invoice)).CheckoutBadge
	}
	return "Merchant Checkout"
}

func normalizedInvoicePlanCode(invoice store.Invoice) store.PlanCode {
	code := store.NormalizePlanCode(string(invoice.PlanCode))
	if invoice.Kind == store.InvoiceKindSubscription && code == store.PlanCodeTrial {
		return store.PlanCodeMerchant
	}
	return code
}

func paymentURI(invoice store.Invoice) string {
	return walletDeepLink(invoice.PayableNetwork, invoice.PayableAsset, invoice.DestinationAddress, invoice.PayableAmount, invoice.PaymentComment)
}

func paymentOptionURI(option store.PaymentOption) string {
	if option.PaymentURI != "" {
		return option.PaymentURI
	}
	return walletDeepLink(option.Network, option.Asset, option.DestinationAddress, option.PayableAmount, option.PaymentComment)
}

type walletTokenSpec struct {
	chainID  string
	contract string
	decimals int32
}

func walletDeepLink(network store.Network, asset store.PaymentAsset, destination string, amount decimal.Decimal, comment *string) string {
	destination = strings.TrimSpace(destination)
	if destination == "" {
		return ""
	}
	if asset == "" {
		asset = store.DefaultAssetForNetwork(network)
	}

	switch network {
	case store.NetworkTON:
		if asset != store.AssetGRAM {
			return destination
		}
		return tonTransferURI(destination, amount, 9, "", comment)
	case store.NetworkTON_USDT:
		if asset != store.AssetUSDT {
			return destination
		}
		return tonTransferURI(destination, amount, 6, "EQCxE6mC__G6cD7YIAkb4leT8akRi8nM60Nw2VY0lNAM9qfe", comment)
	case store.NetworkSOLANA:
		return solanaPayURI(destination, amount, asset)
	case store.NetworkBASE, store.NetworkARBITRUM, store.NetworkBSC:
		return evmPaymentURI(network, asset, destination, amount)
	case store.NetworkTRON:
		return tronPaymentURI(asset, destination, amount)
	default:
		return destination
	}
}

func tonTransferURI(destination string, amount decimal.Decimal, decimals int32, jetton string, comment *string) string {
	values := url.Values{}
	values.Set("amount", decimalUnits(amount, decimals))
	if jetton != "" {
		values.Set("jetton", jetton)
	}
	if comment != nil && strings.TrimSpace(*comment) != "" {
		values.Set("text", strings.TrimSpace(*comment))
	}
	return "ton://transfer/" + destination + "?" + values.Encode()
}

func solanaPayURI(destination string, amount decimal.Decimal, asset store.PaymentAsset) string {
	values := url.Values{}
	values.Set("amount", amount.StringFixed(6))
	values.Set("label", "recv")
	switch asset {
	case store.AssetUSDT:
		values.Set("spl-token", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB")
	case store.AssetUSDC:
		values.Set("spl-token", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
	case store.AssetSOL:
	default:
		return destination
	}
	return "solana:" + destination + "?" + values.Encode()
}

func evmPaymentURI(network store.Network, asset store.PaymentAsset, destination string, amount decimal.Decimal) string {
	spec, ok := evmWalletTokenSpec(network, asset)
	if !ok {
		return destination
	}
	if spec.contract == "" {
		values := url.Values{}
		values.Set("value", decimalUnits(amount, spec.decimals))
		return "ethereum:" + destination + "@" + spec.chainID + "?" + values.Encode()
	}
	values := url.Values{}
	values.Set("address", destination)
	values.Set("uint256", decimalUnits(amount, spec.decimals))
	return "ethereum:" + spec.contract + "@" + spec.chainID + "/transfer?" + values.Encode()
}

func evmWalletTokenSpec(network store.Network, asset store.PaymentAsset) (walletTokenSpec, bool) {
	switch network {
	case store.NetworkBASE:
		if asset == store.AssetUSDC {
			return walletTokenSpec{chainID: "8453", contract: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6}, true
		}
		if asset == store.AssetUSDT {
			return walletTokenSpec{chainID: "8453", contract: "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2", decimals: 6}, true
		}
	case store.NetworkARBITRUM:
		if asset == store.AssetUSDC {
			return walletTokenSpec{chainID: "42161", contract: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6}, true
		}
		if asset == store.AssetUSDT {
			return walletTokenSpec{chainID: "42161", contract: "0xFd086bC7CD5C481DCC9C85ebe478A1C0b69FCbb9", decimals: 6}, true
		}
	case store.NetworkBSC:
		if asset == store.AssetBNB {
			return walletTokenSpec{chainID: "56", decimals: 18}, true
		}
		if asset == store.AssetUSDT {
			return walletTokenSpec{chainID: "56", contract: "0x55d398326f99059fF775485246999027B3197955", decimals: 18}, true
		}
	}
	return walletTokenSpec{}, false
}

func tronPaymentURI(asset store.PaymentAsset, destination string, amount decimal.Decimal) string {
	if asset != store.AssetUSDT {
		return destination
	}
	values := url.Values{}
	values.Set("amount", amount.StringFixed(6))
	values.Set("token", "USDT")
	values.Set("contract", "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj")
	return "tron:" + destination + "?" + values.Encode()
}

func decimalUnits(amount decimal.Decimal, decimals int32) string {
	return amount.Mul(decimal.New(1, decimals)).Truncate(0).StringFixed(0)
}

func paymentOptionResponses(invoice store.Invoice) []gin.H {
	options := invoice.PaymentOptions
	if len(options) == 0 {
		options = []store.PaymentOption{{
			InvoiceID:          invoice.ID,
			Network:            invoice.PayableNetwork,
			Asset:              invoice.PayableAsset,
			PayableAmount:      invoice.PayableAmount,
			DestinationAddress: invoice.DestinationAddress,
			PaymentComment:     invoice.PaymentComment,
			MatchingSuffix:     invoice.MatchingSuffix,
			IsDefault:          true,
		}}
	}
	items := make([]gin.H, 0, len(options))
	for _, option := range options {
		comment := ""
		if option.PaymentComment != nil {
			comment = *option.PaymentComment
		}
		items = append(items, gin.H{
			"network":             option.Network,
			"asset":               option.Asset,
			"payable_amount":      option.PayableAmount.StringFixed(payableScale(option.Network)),
			"destination_address": option.DestinationAddress,
			"payment_comment":     comment,
			"payment_uri":         paymentOptionURI(option),
			"is_default":          option.IsDefault,
		})
	}
	return items
}

func parsePaymentOptionInputs(body []struct {
	Network string `json:"network"`
	Asset   string `json:"asset"`
}) []service.PaymentOptionInput {
	if len(body) == 0 {
		return nil
	}
	options := make([]service.PaymentOptionInput, 0, len(body))
	for _, item := range body {
		options = append(options, service.PaymentOptionInput{
			Network: store.Network(strings.ToUpper(strings.TrimSpace(item.Network))),
			Asset:   store.NormalizePaymentAsset(item.Asset),
		})
	}
	return options
}

func validateWallet(network store.Network, address string) error {
	return store.ValidateWalletAddress(network, address)
}

func corsMiddleware(cfg config.Config) gin.HandlerFunc {
	allowedOrigins := map[string]struct{}{}
	for _, origin := range strings.Split(cfg.AllowedOrigins, ",") {
		origin = strings.TrimSpace(origin)
		if origin != "" {
			allowedOrigins[origin] = struct{}{}
		}
	}
	return func(c *gin.Context) {
		origin := strings.TrimSpace(c.GetHeader("Origin"))
		if len(allowedOrigins) == 0 && cfg.AppEnv == "development" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		} else if _, ok := allowedOrigins[origin]; ok {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
		}
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Internal-Token, X-API-Key, Idempotency-Key")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func setRefreshCookie(c *gin.Context, name string, value string, appEnv string) {
	if strings.TrimSpace(value) == "" {
		return
	}
	secure := appEnv != "development"
	http.SetCookie(c.Writer, &http.Cookie{ // #nosec G124 -- development uses local HTTP; production keeps Secure enabled.
		Name:     name,
		Value:    value,
		Path:     "/",
		MaxAge:   30 * 24 * 60 * 60,
		HttpOnly: true,
		Secure:   secure,
		SameSite: refreshCookieSameSite(appEnv),
	})
}

func clearRefreshCookie(c *gin.Context, name string, appEnv string) {
	secure := appEnv != "development"
	http.SetCookie(c.Writer, &http.Cookie{ // #nosec G124 -- development uses local HTTP; production keeps Secure enabled.
		Name:     name,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: refreshCookieSameSite(appEnv),
	})
}

func refreshCookieSameSite(appEnv string) http.SameSite {
	if appEnv == "development" {
		return http.SameSiteLaxMode
	}
	return http.SameSiteNoneMode
}

func refreshTokenFromRequest(c *gin.Context, cookieName string) string {
	if cookie, err := c.Cookie(cookieName); err == nil && strings.TrimSpace(cookie) != "" {
		return strings.TrimSpace(cookie)
	}
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.ShouldBindJSON(&body); err == nil {
		return strings.TrimSpace(body.RefreshToken)
	}
	return ""
}

func parseIntDefault(value string, fallback int) int {
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func ternary[T any](condition bool, whenTrue T, whenFalse T) T {
	if condition {
		return whenTrue
	}
	return whenFalse
}

func max(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func payableScale(network store.Network) int32 {
	if network == store.NetworkTON {
		return 6
	}
	return 6
}

func inferredNetworkFromPath(path string) store.Network {
	switch {
	case strings.Contains(path, "/watchers/ton"):
		return store.NetworkTON
	case strings.Contains(path, "/watchers/tron"):
		return store.NetworkTRON
	case strings.Contains(path, "/watchers/solana"):
		return store.NetworkSOLANA
	case strings.Contains(path, "/watchers/base"):
		return store.NetworkBASE
	case strings.Contains(path, "/watchers/arbitrum"):
		return store.NetworkARBITRUM
	case strings.Contains(path, "/watchers/bsc"):
		return store.NetworkBSC
	case strings.Contains(path, "/watchers/evm"):
		return store.NetworkEVM
	default:
		return ""
	}
}
