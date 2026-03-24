package http

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/metrics"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

type apiKeyContext struct {
	Key store.APIKeyRecord
}

var defaultAPIKeyScopes = []string{"invoices:read", "invoices:write"}

func (s *Server) apiKeyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractAPIKey(c)
		if token == "" {
			metrics.IncAuthAttempt("api_key", "failure", "missing")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing API key"})
			return
		}

		hash := hashSecret(token)
		record, err := s.store.GetAPIKeyByTokenHash(c.Request.Context(), hash)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid API key"})
			return
		}

		seller, err := s.store.GetSellerByID(c.Request.Context(), record.SellerID)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "seller_not_found")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "seller not found"})
			return
		}
		if seller.IsBlocked {
			metrics.IncAuthAttempt("api_key", "failure", "seller_blocked")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "seller account is blocked"})
			return
		}

		plan := seller.EffectivePlan(time.Now())
		if !plan.HasAPI {
			metrics.IncLimitDecision("api_access", "denied", "plan")
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "current plan does not include Reqst Dev or Reqst Enterprise API access"})
			return
		}

		minuteAgo := time.Now().UTC().Add(-1 * time.Minute)
		monthStart := monthWindowStart(time.Now().UTC())
		requestsThisMinute, err := s.store.CountAPIRequestsSince(c.Request.Context(), seller.ID, &record.ID, minuteAgo)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "count_minute_usage")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		requestsThisMonth, err := s.store.CountAPIRequestsSince(c.Request.Context(), seller.ID, nil, monthStart)
		if err != nil {
			metrics.IncAuthAttempt("api_key", "failure", "count_month_usage")
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.Header("X-RateLimit-Limit-Minute", strconv.Itoa(plan.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining-Minute", strconv.Itoa(max(0, plan.RequestsPerMinute-requestsThisMinute)))
		if plan.MonthlyRequestCap > 0 {
			c.Header("X-RateLimit-Limit-Month", strconv.Itoa(plan.MonthlyRequestCap))
			c.Header("X-RateLimit-Remaining-Month", strconv.Itoa(max(0, plan.MonthlyRequestCap-requestsThisMonth)))
		}

		if plan.RequestsPerMinute > 0 && requestsThisMinute >= plan.RequestsPerMinute {
			metrics.IncLimitDecision("api_rate_limit", "denied", "minute")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "minute rate limit exceeded"})
			return
		}
		if plan.MonthlyRequestCap > 0 && requestsThisMonth >= plan.MonthlyRequestCap {
			metrics.IncLimitDecision("api_quota", "denied", "month")
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"error": "monthly API quota exceeded"})
			return
		}

		c.Request = c.Request.WithContext(metrics.WithSource(c.Request.Context(), "developer_api"))
		metrics.IncAuthAttempt("api_key", "success", "authenticated")
		c.Set("seller_ctx", sellerContext{Seller: seller})
		c.Set("api_key_ctx", apiKeyContext{Key: record})
		c.Next()

		statusCode := c.Writer.Status()
		_ = s.store.TouchAPIKeyLastUsed(context.Background(), record.ID)
		_ = s.store.RecordAPIRequest(context.Background(), seller.ID, record.ID, c.Request.Method, c.FullPath(), statusCode)
	}
}

func (s *Server) handleDeveloperUsage(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	monthUsage, err := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, monthWindowStart(time.Now().UTC()))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	minuteUsage, err := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, time.Now().UTC().Add(-1*time.Minute))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	keyCount, err := s.store.CountActiveAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	webhooks, err := s.store.ListWebhookEndpoints(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plan": plan,
		"usage": gin.H{
			"monthly_requests":    monthUsage,
			"monthly_limit":       plan.MonthlyRequestCap,
			"requests_this_min":   minuteUsage,
			"minute_limit":        plan.RequestsPerMinute,
			"active_api_keys":     keyCount,
			"api_key_limit":       plan.APIKeyLimit,
			"webhook_endpoints":   len(webhooks),
			"webhook_retry_limit": plan.WebhookRetries,
		},
	})
}

func (s *Server) handleListAPIKeys(c *gin.Context) {
	sc := sellerFromContext(c)
	items, err := s.store.ListAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleCreateAPIKey(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	if !plan.HasAPI {
		c.JSON(http.StatusForbidden, gin.H{"error": "current plan does not include API keys"})
		return
	}

	count, err := s.store.CountActiveAPIKeys(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if plan.APIKeyLimit > 0 && count >= plan.APIKeyLimit {
		c.JSON(http.StatusForbidden, gin.H{"error": fmt.Sprintf("current plan allows up to %d active API keys", plan.APIKeyLimit)})
		return
	}

	var body struct {
		Label  string   `json:"label"`
		Scopes []string `json:"scopes"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	label := strings.TrimSpace(body.Label)
	if label == "" {
		label = fmt.Sprintf("%s key", plan.Name)
	}
	scopes := normalizeScopes(body.Scopes)
	token, prefix, err := generateTokenWithPrefix("rk_live_", 24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	key, err := s.store.CreateAPIKey(c.Request.Context(), sc.Seller.ID, label, prefix, hashSecret(token), scopes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{
		"api_key": key,
		"secret":  token,
	})
}

func (s *Server) handleDeleteAPIKey(c *gin.Context) {
	sc := sellerFromContext(c)
	keyID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid API key id"})
		return
	}
	if err := s.store.RevokeAPIKey(c.Request.Context(), sc.Seller.ID, keyID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleListWebhookEndpoints(c *gin.Context) {
	sc := sellerFromContext(c)
	items, err := s.store.ListWebhookEndpoints(c.Request.Context(), sc.Seller.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleCreateWebhookEndpoint(c *gin.Context) {
	sc := sellerFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	if !plan.HasWebhooks {
		c.JSON(http.StatusForbidden, gin.H{"error": "current plan does not include webhooks"})
		return
	}

	var body struct {
		Label string `json:"label"`
		URL   string `json:"url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	endpointURL := strings.TrimSpace(body.URL)
	if err := validateWebhookURL(endpointURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	label := strings.TrimSpace(body.Label)
	if label == "" {
		label = "Primary endpoint"
	}
	secret, _, err := generateTokenWithPrefix("whsec_", 18)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	endpoint, err := s.store.CreateWebhookEndpoint(c.Request.Context(), sc.Seller.ID, label, endpointURL, secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"webhook": endpoint})
}

func (s *Server) handleDeleteWebhookEndpoint(c *gin.Context) {
	sc := sellerFromContext(c)
	endpointID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid webhook endpoint id"})
		return
	}
	if err := s.store.DeactivateWebhookEndpoint(c.Request.Context(), sc.Seller.ID, endpointID); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleAPIMe(c *gin.Context) {
	sc := sellerFromContext(c)
	keyCtx := apiKeyFromContext(c)
	plan := sc.Seller.EffectivePlan(time.Now())
	monthUsage, _ := s.store.CountAPIRequestsSince(c.Request.Context(), sc.Seller.ID, nil, monthWindowStart(time.Now().UTC()))
	c.JSON(http.StatusOK, gin.H{
		"seller": gin.H{
			"id":       sc.Seller.ID,
			"username": sc.Seller.Username,
			"email":    sc.Seller.Email,
		},
		"plan":  plan,
		"usage": gin.H{"monthly_requests": monthUsage, "monthly_limit": plan.MonthlyRequestCap},
		"key":   gin.H{"id": keyCtx.Key.ID, "label": keyCtx.Key.Label, "prefix": keyCtx.Key.Prefix, "scopes": keyCtx.Key.Scopes},
	})
}

func (s *Server) handleAPIListInvoices(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:read") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_read")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:read is required"})
		return
	}
	sc := sellerFromContext(c)
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	items, err := s.store.ListInvoices(c.Request.Context(), sc.Seller.ID, pageSize, (page-1)*pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items, "page": page, "page_size": pageSize})
}

func (s *Server) handleAPICreateInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:write") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_write")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:write is required"})
		return
	}
	sc := sellerFromContext(c)
	var body struct {
		Title            string `json:"title"`
		BaseAmountUSD    string `json:"base_amount_usd"`
		PayableNetwork   string `json:"payable_network"`
		ExpiresInMinutes int    `json:"expires_in_minutes"`
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
	invoice, err := s.invoiceService.CreateInvoice(c.Request.Context(), sc.Seller, service.CreateInvoiceInput{
		Title:            strings.TrimSpace(body.Title),
		BaseAmountUSD:    baseAmount,
		PayableNetwork:   store.Network(strings.ToUpper(strings.TrimSpace(body.PayableNetwork))),
		ExpiresInMinutes: body.ExpiresInMinutes,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, publicInvoiceResponse(invoice))
}

func (s *Server) handleAPIGetInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:read") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_read")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:read is required"})
		return
	}
	sc := sellerFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	invoice, err := s.store.GetInvoiceByID(c.Request.Context(), sc.Seller.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func (s *Server) handleAPICancelInvoice(c *gin.Context) {
	if !apiKeyHasScope(c, "invoices:write") {
		metrics.IncLimitDecision("api_scope", "denied", "invoices_write")
		c.JSON(http.StatusForbidden, gin.H{"error": "API key scope invoices:write is required"})
		return
	}
	sc := sellerFromContext(c)
	invoiceID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invoice id"})
		return
	}
	currentInvoice, err := s.store.GetInvoiceByID(c.Request.Context(), sc.Seller.ID, invoiceID)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	if !isSellerManagedInvoice(currentInvoice) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only seller-created invoices can be canceled"})
		return
	}
	invoice, err := s.store.SetInvoiceStatus(c.Request.Context(), sc.Seller.ID, invoiceID, store.InvoiceStatusExpired)
	if err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, store.ErrNotFound) {
			status = http.StatusNotFound
		}
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, publicInvoiceResponse(invoice))
}

func apiKeyFromContext(c *gin.Context) apiKeyContext {
	value, _ := c.Get("api_key_ctx")
	return value.(apiKeyContext)
}

func apiKeyHasScope(c *gin.Context, scope string) bool {
	key := apiKeyFromContext(c).Key
	for _, candidate := range key.Scopes {
		if candidate == scope {
			return true
		}
	}
	return false
}

func extractAPIKey(c *gin.Context) string {
	if value := strings.TrimSpace(c.GetHeader("X-API-Key")); value != "" {
		return value
	}
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[len("Bearer "):])
	}
	return ""
}

func normalizeScopes(scopes []string) []string {
	if len(scopes) == 0 {
		return append([]string(nil), defaultAPIKeyScopes...)
	}
	items := make([]string, 0, len(scopes))
	seen := map[string]struct{}{}
	for _, scope := range scopes {
		scope = strings.TrimSpace(scope)
		switch scope {
		case "invoices:read", "invoices:write":
			if _, ok := seen[scope]; !ok {
				items = append(items, scope)
				seen[scope] = struct{}{}
			}
		}
	}
	if len(items) == 0 {
		return append([]string(nil), defaultAPIKeyScopes...)
	}
	return items
}

func hashSecret(value string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(value)))
	return hex.EncodeToString(sum[:])
}

func generateTokenWithPrefix(prefix string, randomBytes int) (string, string, error) {
	buffer := make([]byte, randomBytes)
	if _, err := rand.Read(buffer); err != nil {
		return "", "", fmt.Errorf("read random bytes: %w", err)
	}
	secret := prefix + hex.EncodeToString(buffer)
	prefixValue := secret
	if len(prefixValue) > 14 {
		prefixValue = prefixValue[:14]
	}
	return secret, prefixValue, nil
}

func validateWebhookURL(raw string) error {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil {
		return fmt.Errorf("invalid webhook url: %w", err)
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		return errors.New("webhook url must start with http:// or https://")
	}
	if parsed.Host == "" {
		return errors.New("webhook url host is required")
	}
	return nil
}

func monthWindowStart(now time.Time) time.Time {
	return time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
}
