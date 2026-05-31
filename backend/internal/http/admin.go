package http

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type adminContext struct {
	Claims service.AdminClaims
}

func (s *Server) handleAdminLogin(c *gin.Context) {
	ctx := metrics.WithSource(c.Request.Context(), "admin_login")
	if s.adminService == nil || !s.adminService.Enabled() {
		metrics.IncAuthAttempt("admin_login", "failure", "disabled")
		c.JSON(http.StatusForbidden, gin.H{"error": "admin access is not configured"})
		return
	}

	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		metrics.IncAuthAttempt("admin_login", "failure", "invalid_payload")
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	username := strings.TrimSpace(body.Username)
	if s.store != nil {
		_, allowed, err := s.store.AllowRateLimit(c.Request.Context(), "admin_login:"+c.ClientIP()+":"+strings.ToLower(username), 5, time.Minute)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		if !allowed {
			_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, "admin_login_rate_limited", "admin", username, gin.H{"ip": c.ClientIP()})
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "admin login rate limit exceeded"})
			return
		}
	}

	result, err := s.adminService.StartLogin(c.Request.Context(), username, body.Password)
	if err != nil {
		if s.store != nil {
			_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, "admin_login_failed", "admin", username, gin.H{"ip": c.ClientIP()})
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if s.store != nil {
		action := "admin_login_password_verified"
		if !result.MFARequired {
			action = "admin_login"
		}
		_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, action, "admin", username, gin.H{"ip": c.ClientIP(), "mfa_required": result.MFARequired})
	}

	c.Request = c.Request.WithContext(ctx)
	if result.RefreshToken != "" {
		setRefreshCookie(c, "reqst_admin_refresh", result.RefreshToken, s.cfg.AppEnv)
	}
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleAdminVerifyTOTP(c *gin.Context) {
	var body struct {
		ChallengeToken string `json:"challenge_token"`
		Code           string `json:"code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	result, err := s.adminService.VerifyTOTP(c.Request.Context(), body.ChallengeToken, body.Code, service.AdminSessionInput{UserAgent: c.Request.UserAgent(), IPAddress: c.ClientIP()})
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if s.store != nil {
		_ = s.store.RecordAdminAuditEvent(c.Request.Context(), result.Email, "admin_mfa_verified", "admin", result.Email, gin.H{"ip": c.ClientIP(), "recovery_codes_issued": len(result.RecoveryCodes)})
	}
	setRefreshCookie(c, "reqst_admin_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleAdminRefresh(c *gin.Context) {
	refreshToken := refreshTokenFromRequest(c, "reqst_admin_refresh")
	if refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing admin refresh token"})
		return
	}
	result, err := s.adminService.Refresh(c.Request.Context(), refreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (s *Server) handleAdminLogout(c *gin.Context) {
	refreshToken := refreshTokenFromRequest(c, "reqst_admin_refresh")
	if refreshToken != "" {
		_ = s.adminService.RevokeRefreshToken(c.Request.Context(), refreshToken)
	}
	clearRefreshCookie(c, "reqst_admin_refresh", s.cfg.AppEnv)
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if s.adminService == nil || !s.adminService.Enabled() {
			metrics.IncAuthAttempt("admin_token", "failure", "disabled")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access is not configured"})
			return
		}

		header := strings.TrimSpace(c.GetHeader("Authorization"))
		if !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			metrics.IncAuthAttempt("admin_token", "failure", "missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing admin bearer token"})
			return
		}

		token := strings.TrimSpace(header[len("Bearer "):])
		claims, err := s.adminService.ParseToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "admin_api"))
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}
}

func (s *Server) handleAdminRevokeSession(c *gin.Context) {
	adminCtx := adminFromContext(c)
	if !adminHasRole(adminCtx.Claims, "super_admin") {
		c.JSON(http.StatusForbidden, gin.H{"error": "super_admin role required"})
		return
	}
	var body struct {
		SessionID int64 `json:"session_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.SessionID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "session_id is required"})
		return
	}
	if err := s.adminService.RevokeSession(c.Request.Context(), body.SessionID); err != nil {
		writeAdminStoreError(c, err, "admin session not found")
		return
	}
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "admin_session_revoke", "admin_session", strconv.FormatInt(body.SessionID, 10), gin.H{})
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (s *Server) handleAdminOverview(c *gin.Context) {
	overview, err := s.store.GetAdminOverview(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"generated_at": overview.GeneratedAt,
		"totals": gin.H{
			"invoices_total":          overview.Totals.InvoicesTotal,
			"paid_total":              overview.Totals.PaidTotal,
			"awaiting_total":          overview.Totals.AwaitingTotal,
			"underpaid_total":         overview.Totals.UnderpaidTotal,
			"manual_review_total":     overview.Totals.ManualReviewTotal,
			"expired_total":           overview.Totals.ExpiredTotal,
			"merchant_paid_total":     overview.Totals.MerchantPaidTotal,
			"subscription_paid_total": overview.Totals.SubscriptionPaidTotal,
			"gross_paid_usd":          overview.Totals.GrossPaidUSD.StringFixed(2),
			"merchant_paid_usd":       overview.Totals.MerchantPaidUSD.StringFixed(2),
			"subscription_paid_usd":   overview.Totals.SubscriptionPaidUSD.StringFixed(2),
			"open_invoice_usd":        overview.Totals.OpenInvoiceUSD.StringFixed(2),
			"workspaces_total":        overview.Totals.WorkspacesTotal,
			"active_subscribers":      overview.Totals.ActiveSubscribers,
			"blocked_workspaces":      overview.Totals.BlockedWorkspaces,
			"wallets_total":           overview.Totals.WalletsTotal,
			"api_keys_active":         overview.Totals.APIKeysActive,
			"webhook_endpoints":       overview.Totals.WebhookEndpoints,
		},
		"daily_sales":       adminDailySalesResponse(overview.DailySales),
		"network_breakdown": adminNetworkBreakdownResponse(overview.NetworkBreakdown),
		"status_breakdown":  adminStatusBreakdownResponse(overview.StatusBreakdown),
		"plan_breakdown":    adminPlanBreakdownResponse(overview.PlanBreakdown),
		"recent_sales":      adminInvoiceResponseItems(overview.RecentSales),
	})
}

func (s *Server) handleAdminInvoices(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 50)
	if pageSize < 1 || pageSize > 200 {
		pageSize = 50
	}

	items, err := s.store.ListAdminInvoices(c.Request.Context(), store.AdminInvoiceFilters{
		Page:     page,
		PageSize: pageSize,
		Status:   c.Query("status"),
		Kind:     c.Query("kind"),
		Query:    c.Query("query"),
	})
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":     adminInvoiceResponseItems(items.Items),
		"total":     items.Total,
		"page":      items.Page,
		"page_size": items.PageSize,
	})
}

func (s *Server) handleAdminOpsOverview(c *gin.Context) {
	overview, err := s.store.GetAdminOverview(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	manualReview, err := s.store.ListAdminInvoices(c.Request.Context(), store.AdminInvoiceFilters{Page: 1, PageSize: 12, Status: string(store.InvoiceStatusManualReview)})
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	failedWebhooks, err := s.store.ListAdminFailedWebhooks(c.Request.Context(), 12)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	watchers, err := s.store.ListAdminWatchers(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	notifications, err := s.store.GetAdminNotificationHealth(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"generated_at":         overview.GeneratedAt,
		"revenue":              gin.H{"gross_paid_usd": overview.Totals.GrossPaidUSD.StringFixed(2), "open_invoice_usd": overview.Totals.OpenInvoiceUSD.StringFixed(2), "subscription_paid_usd": overview.Totals.SubscriptionPaidUSD.StringFixed(2)},
		"workspaces":           gin.H{"total": overview.Totals.WorkspacesTotal, "active_subscribers": overview.Totals.ActiveSubscribers, "blocked": overview.Totals.BlockedWorkspaces},
		"invoices":             gin.H{"total": overview.Totals.InvoicesTotal, "paid": overview.Totals.PaidTotal, "manual_review": overview.Totals.ManualReviewTotal, "underpaid": overview.Totals.UnderpaidTotal},
		"subscriptions":        gin.H{"active": overview.Totals.ActiveSubscribers, "paid_invoices": overview.Totals.SubscriptionPaidTotal},
		"manual_review_queue":  adminInvoiceResponseItems(manualReview.Items),
		"failed_webhook_queue": failedWebhooks,
		"watcher_health":       watchers,
		"notification_health":  notifications,
		"daily_sales":          adminDailySalesResponse(overview.DailySales),
		"network_breakdown":    adminNetworkBreakdownResponse(overview.NetworkBreakdown),
		"status_breakdown":     adminStatusBreakdownResponse(overview.StatusBreakdown),
		"plan_breakdown":       adminPlanBreakdownResponse(overview.PlanBreakdown),
	})
}

func (s *Server) handleAdminWorkspaces(c *gin.Context) {
	items, err := s.store.ListAdminWorkspaces(c.Request.Context(), parseIntDefault(c.Query("limit"), 100))
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminFailedWebhooks(c *gin.Context) {
	items, err := s.store.ListAdminFailedWebhooks(c.Request.Context(), parseIntDefault(c.Query("limit"), 50))
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminWatchers(c *gin.Context) {
	items, err := s.store.ListAdminWatchers(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminNotifications(c *gin.Context) {
	item, err := s.store.GetAdminNotificationHealth(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, item)
}

func (s *Server) handleAdminBlockWorkspace(c *gin.Context) {
	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var body struct {
		Blocked bool   `json:"blocked"`
		Reason  string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	workspace, err := s.store.SetWorkspaceBlocked(c.Request.Context(), workspaceID, body.Blocked)
	if err != nil {
		writeAdminStoreError(c, err, "workspace not found")
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "set_workspace_blocked", "workspace", strconv.FormatInt(workspaceID, 10), gin.H{"blocked": body.Blocked, "reason": strings.TrimSpace(body.Reason)})
	result := "Workspace unblocked."
	if body.Blocked {
		result = "Workspace blocked."
	}
	c.JSON(http.StatusOK, gin.H{"workspace": workspace, "result": result})
}

func (s *Server) handleAdminSetWorkspacePlan(c *gin.Context) {
	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}
	var body struct {
		PlanCode           string     `json:"plan_code"`
		Days               int        `json:"days"`
		SubscriptionEndsAt *time.Time `json:"subscription_ends_at"`
		Reason             string     `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	planCode, ok := validAdminPlanCode(body.PlanCode)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plan_code"})
		return
	}
	workspace, err := s.store.SetWorkspacePlan(c.Request.Context(), workspaceID, planCode, body.Days, body.SubscriptionEndsAt)
	if err != nil {
		writeAdminStoreError(c, err, "workspace not found")
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "set_workspace_plan", "workspace", strconv.FormatInt(workspaceID, 10), gin.H{"plan_code": planCode, "days": body.Days, "subscription_ends_at": body.SubscriptionEndsAt, "reason": strings.TrimSpace(body.Reason)})
	c.JSON(http.StatusOK, gin.H{"workspace": workspace, "result": "Workspace plan updated."})
}

func (s *Server) handleAdminCreateBillingCheckout(c *gin.Context) {
	workspaceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}

	var body struct {
		PlanCode       string `json:"plan_code"`
		PayableNetwork string `json:"payable_network"`
		BaseAmountUSD  string `json:"base_amount_usd"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workspace, err := s.store.GetWorkspaceByID(c.Request.Context(), workspaceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		respondError(c, status, err)
		return
	}

	planCode := store.NormalizePlanCode(body.PlanCode)
	if planCode == store.PlanCodeTrial {
		c.JSON(http.StatusBadRequest, gin.H{"error": "trial does not require billing"})
		return
	}

	network := store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork)))
	if !network.IsSupportedPayableNetwork() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported network"})
		return
	}

	var overridePrice *decimal.Decimal
	if planCode == store.PlanCodeEnterprise {
		trimmedAmount := strings.TrimSpace(body.BaseAmountUSD)
		if trimmedAmount == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "base_amount_usd is required for enterprise"})
			return
		}
		parsedAmount, err := decimal.NewFromString(trimmedAmount)
		if err != nil || !parsedAmount.IsPositive() {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid base_amount_usd"})
			return
		}
		overridePrice = &parsedAmount
	}

	ctx := metrics.WithSource(c.Request.Context(), "admin_api")
	invoice, err := s.invoiceService.CreatePlanInvoiceWithPrice(ctx, workspace, planCode, network, overridePrice)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "create_billing_checkout", "workspace", strconv.FormatInt(workspaceID, 10), gin.H{"invoice_id": invoice.ID, "plan_code": planCode, "network": network})

	plan := store.ResolvePlan(planCode)
	priceLabel := plan.PriceUSDString
	if overridePrice != nil {
		priceLabel = overridePrice.StringFixed(2)
	}
	c.JSON(http.StatusCreated, gin.H{
		"workspace": gin.H{
			"id":       workspace.ID,
			"username": workspace.Username,
			"email":    workspace.Email,
		},
		"plan": gin.H{
			"code":         plan.Code,
			"name":         plan.Name,
			"price_usd":    priceLabel,
			"billing_days": plan.BillingDays,
			"generated_at": time.Now().UTC(),
		},
		"invoice": publicInvoiceResponse(invoice),
	})
}

func (s *Server) handleAdminResendWebhookDelivery(c *gin.Context) {
	deliveryID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook delivery id"})
		return
	}
	item, err := s.store.ResendAdminWebhookDelivery(c.Request.Context(), deliveryID)
	if err != nil {
		writeAdminStoreError(c, err, "webhook delivery not found")
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "resend_webhook_delivery", "webhook_delivery", strconv.FormatInt(deliveryID, 10), gin.H{"new_delivery_id": item.ID})
	c.JSON(http.StatusCreated, gin.H{"delivery": item, "result": "Webhook resend queued."})
}

func (s *Server) handleAdminReviewInvoice(c *gin.Context) {
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	var body struct {
		Result  string `json:"result"`
		Comment string `json:"comment"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if body.Result != "mark_paid" && body.Result != "keep_manual_review" && body.Result != "expire" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review result"})
		return
	}
	adminCtx := adminFromContext(c)
	invoice, result, err := s.store.ReviewAdminInvoice(c.Request.Context(), invoiceID, body.Result, body.Comment, adminCtx.Claims.Username)
	if err != nil {
		writeAdminStoreError(c, err, "invoice not found")
		return
	}
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "review_invoice", "invoice", strconv.FormatInt(invoiceID, 10), gin.H{"result": body.Result, "comment": strings.TrimSpace(body.Comment)})
	c.JSON(http.StatusOK, gin.H{"invoice": publicInvoiceResponse(invoice), "result": result})
}

func (s *Server) handleAdminCreateInternalComment(c *gin.Context) {
	var body struct {
		TargetType string `json:"target_type"`
		TargetID   string `json:"target_id"`
		Body       string `json:"body"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if strings.TrimSpace(body.TargetType) == "" || strings.TrimSpace(body.TargetID) == "" || strings.TrimSpace(body.Body) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "target_type, target_id and body are required"})
		return
	}
	adminCtx := adminFromContext(c)
	comment, err := s.store.CreateAdminInternalComment(c.Request.Context(), body.TargetType, body.TargetID, body.Body, adminCtx.Claims.Username)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "create_internal_comment", body.TargetType, body.TargetID, gin.H{"comment_id": comment.ID})
	c.JSON(http.StatusCreated, gin.H{"comment": comment, "result": "Internal comment added."})
}

func (s *Server) handleAdminRefreshInvoiceStatus(c *gin.Context) {
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	invoice, result, err := s.store.RefreshAdminInvoiceStatus(c.Request.Context(), invoiceID)
	if err != nil {
		writeAdminStoreError(c, err, "invoice not found")
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "refresh_invoice_status", "invoice", strconv.FormatInt(invoiceID, 10), gin.H{})
	c.JSON(http.StatusOK, gin.H{"invoice": publicInvoiceResponse(invoice), "result": result})
}

func (s *Server) handleAdminAnalytics(c *gin.Context) {
	from := parseAdminDate(c.Query("from"), time.Now().UTC().AddDate(0, 0, -30))
	to := parseAdminDate(c.Query("to"), time.Now().UTC())
	groupBy := c.DefaultQuery("group_by", "date")
	if groupBy != "date" && groupBy != "network" && groupBy != "plan" && groupBy != "mode" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "group_by must be date, network, plan or mode"})
		return
	}
	item, err := s.store.GetAdminAnalytics(c.Request.Context(), from, to, groupBy)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, adminAnalyticsResponse(item))
}

func (s *Server) handleAdminAuditEvents(c *gin.Context) {
	limit := parseIntDefault(c.Query("limit"), 100)
	items, err := s.store.ListAdminAuditEvents(c.Request.Context(), limit)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminSEOTargets(c *gin.Context) {
	items, err := s.store.ListSEOTargets(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func adminDailySalesResponse(items []store.AdminDailySalesPoint) []gin.H {
	out := make([]gin.H, 0, len(items))
	for _, item := range items {
		out = append(out, gin.H{
			"date":                  item.Date.Format("2006-01-02"),
			"paid_usd":              item.PaidUSD.StringFixed(2),
			"merchant_paid_usd":     item.MerchantPaidUSD.StringFixed(2),
			"subscription_paid_usd": item.SubscriptionPaidUSD.StringFixed(2),
			"paid_count":            item.PaidCount,
			"created_count":         item.CreatedCount,
			"underpaid_count":       item.UnderpaidCount,
			"manual_review_count":   item.ManualReviewCount,
		})
	}
	return out
}

func adminNetworkBreakdownResponse(items []store.AdminNetworkBreakdown) []gin.H {
	out := make([]gin.H, 0, len(items))
	for _, item := range items {
		out = append(out, gin.H{
			"network":     item.Network,
			"paid_usd":    item.PaidUSD.StringFixed(2),
			"paid_count":  item.PaidCount,
			"total_count": item.TotalCount,
		})
	}
	return out
}

func adminStatusBreakdownResponse(items []store.AdminStatusBreakdown) []gin.H {
	out := make([]gin.H, 0, len(items))
	for _, item := range items {
		out = append(out, gin.H{
			"status": item.Status,
			"count":  item.Count,
			"usd":    item.USD.StringFixed(2),
		})
	}
	return out
}

func adminPlanBreakdownResponse(items []store.AdminPlanBreakdown) []gin.H {
	out := make([]gin.H, 0, len(items))
	for _, item := range items {
		out = append(out, gin.H{
			"plan_code":  item.PlanCode,
			"paid_usd":   item.PaidUSD.StringFixed(2),
			"paid_count": item.PaidCount,
		})
	}
	return out
}

func adminInvoiceResponseItems(items []store.AdminInvoiceRecord) []gin.H {
	out := make([]gin.H, 0, len(items))
	for _, item := range items {
		out = append(out, gin.H{
			"id":                  item.ID,
			"public_id":           item.PublicID,
			"workspace_id":        item.WorkspaceID,
			"workspace_username":  item.WorkspaceUsername,
			"workspace_email":     item.WorkspaceEmail,
			"kind":                item.Kind,
			"plan_code":           item.PlanCode,
			"title":               item.Title,
			"base_amount_usd":     item.BaseAmountUSD.StringFixed(2),
			"payable_amount":      item.PayableAmount.StringFixed(payableScale(item.PayableNetwork)),
			"payable_network":     item.PayableNetwork,
			"destination_address": item.DestinationAddress,
			"payment_comment":     item.PaymentComment,
			"status":              item.Status,
			"classification":      item.Classification,
			"tx_hash":             item.TxHash,
			"expires_at":          item.ExpiresAt,
			"paid_at":             item.PaidAt,
			"created_at":          item.CreatedAt,
			"checkout_url":        "/app/checkout/" + item.PublicID,
		})
	}
	return out
}

func adminAnalyticsResponse(item store.AdminAnalytics) gin.H {
	breakdown := make([]gin.H, 0, len(item.Breakdown))
	for _, point := range item.Breakdown {
		breakdown = append(breakdown, gin.H{
			"bucket":                 point.Bucket,
			"created_invoices":       point.CreatedInvoices,
			"paid_invoices":          point.PaidInvoices,
			"manual_review_invoices": point.ManualReviewInvoices,
			"underpaid_invoices":     point.UnderpaidInvoices,
			"paid_volume_usd":        point.PaidVolumeUSD.StringFixed(2),
		})
	}
	return gin.H{
		"from":                item.From,
		"to":                  item.To,
		"group_by":            item.GroupBy,
		"mrr_usd":             item.MRRUSD.StringFixed(2),
		"arr_usd":             item.ARRUSD.StringFixed(2),
		"paid_volume_usd":     item.PaidVolumeUSD.StringFixed(2),
		"active_workspaces":   item.ActiveWorkspaces,
		"created_invoices":    item.CreatedInvoices,
		"paid_invoices":       item.PaidInvoices,
		"failed_webhook_rate": item.FailedWebhookRate.StringFixed(4),
		"manual_review_rate":  item.ManualReviewRate.StringFixed(4),
		"underpaid_share":     item.UnderpaidShare.StringFixed(4),
		"breakdown":           breakdown,
	}
}

func validAdminPlanCode(raw string) (store.PlanCode, bool) {
	switch store.PlanCode(strings.ToLower(strings.TrimSpace(raw))) {
	case store.PlanCodeTrial:
		return store.PlanCodeTrial, true
	case store.PlanCodeMerchant:
		return store.PlanCodeMerchant, true
	case store.PlanCodeDeveloper:
		return store.PlanCodeDeveloper, true
	case store.PlanCodeBusiness:
		return store.PlanCodeBusiness, true
	case store.PlanCodeEnterprise:
		return store.PlanCodeEnterprise, true
	default:
		return "", false
	}
}

func parseAdminDate(raw string, fallback time.Time) time.Time {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return fallback
	}
	if value, err := time.Parse(time.RFC3339, raw); err == nil {
		return value
	}
	if value, err := time.Parse("2006-01-02", raw); err == nil {
		return value
	}
	return fallback
}

func writeAdminStoreError(c *gin.Context, err error, notFoundMessage string) {
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": notFoundMessage})
		return
	}
	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
}

func adminFromContext(c *gin.Context) adminContext {
	value, _ := c.Get("admin_ctx")
	return value.(adminContext)
}

func adminHasRole(claims service.AdminClaims, allowed ...string) bool {
	for _, role := range claims.Roles {
		for _, want := range allowed {
			if role == want {
				return true
			}
		}
	}
	for _, want := range allowed {
		if claims.Role == want || (claims.Role == "admin" && want == "super_admin") {
			return true
		}
	}
	return false
}
