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
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if !allowed {
			_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, "admin_login_rate_limited", "admin", username, gin.H{"ip": c.ClientIP()})
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "admin login rate limit exceeded"})
			return
		}
	}

	token, err := s.adminService.Authenticate(username, body.Password)
	if err != nil {
		if s.store != nil {
			_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, "admin_login_failed", "admin", username, gin.H{"ip": c.ClientIP()})
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}
	if s.store != nil {
		_ = s.store.RecordAdminAuditEvent(c.Request.Context(), username, "admin_login", "admin", username, gin.H{"ip": c.ClientIP()})
	}

	c.Request = c.Request.WithContext(ctx)
	c.JSON(http.StatusOK, gin.H{"token": token, "username": username})
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

func (s *Server) handleAdminOverview(c *gin.Context) {
	overview, err := s.store.GetAdminOverview(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
			"sellers_total":           overview.Totals.SellersTotal,
			"active_subscribers":      overview.Totals.ActiveSubscribers,
			"blocked_sellers":         overview.Totals.BlockedSellers,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items":     adminInvoiceResponseItems(items.Items),
		"total":     items.Total,
		"page":      items.Page,
		"page_size": items.PageSize,
	})
}

func (s *Server) handleAdminCreateBillingCheckout(c *gin.Context) {
	sellerID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller id"})
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

	seller, err := s.store.GetSellerByID(c.Request.Context(), sellerID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
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
	invoice, err := s.invoiceService.CreatePlanInvoiceWithPrice(ctx, seller, planCode, network, overridePrice)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "create_billing_checkout", "seller", strconv.FormatInt(sellerID, 10), gin.H{"invoice_id": invoice.ID, "plan_code": planCode, "network": network})

	plan := store.ResolvePlan(planCode)
	priceLabel := plan.PriceUSDString
	if overridePrice != nil {
		priceLabel = overridePrice.StringFixed(2)
	}
	c.JSON(http.StatusCreated, gin.H{
		"seller": gin.H{
			"id":       seller.ID,
			"username": seller.Username,
			"email":    seller.Email,
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
			"seller_id":           item.SellerID,
			"seller_username":     item.SellerUsername,
			"seller_email":        item.SellerEmail,
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

func adminFromContext(c *gin.Context) adminContext {
	value, _ := c.Get("admin_ctx")
	return value.(adminContext)
}
