package http

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"recv/backend/internal/service"
	"recv/backend/internal/store"
)

func TestPromoCodeAPI(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Initialize server with shared test store
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: service.NewAdminService("admin", "pass", "secret", time.Hour),
		authService:  service.NewAuthService(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour),
	}

	// Create workspace for test
	ws, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 81001, "http_promo_user")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	// Helper to make request
	router := gin.New()
	router.POST("/api/admin/promocodes", func(c *gin.Context) {
		c.Set("admin_ctx", adminContext{
			Claims: service.AdminClaims{Username: "test-admin", Roles: []string{"super_admin"}},
		})
		server.handleAdminCreatePromoCode(c)
	})
	router.GET("/api/admin/promocodes", server.handleAdminListPromoCodes)
	router.DELETE("/api/admin/promocodes/:id", func(c *gin.Context) {
		c.Set("admin_ctx", adminContext{
			Claims: service.AdminClaims{Username: "test-admin"},
		})
		server.handleAdminDeletePromoCode(c)
	})
	router.POST("/api/billing/promo-code/redeem", func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Workspace: ws,
		})
		server.handleRedeemPromoCode(c)
	})

	t.Run("Create Promo Code API", func(t *testing.T) {
		expires := time.Now().Add(time.Hour)
		maxUses := 10
		payload := map[string]interface{}{
			"code":          "WINTER50",
			"duration_days": 30,
			"plan_code":     "developer",
			"expires_at":    expires,
			"max_uses":      maxUses,
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/admin/promocodes", bytes.NewReader(body))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusCreated {
			t.Errorf("Expected status 201, got %d, body: %s", w.Code, w.Body.String())
		}

		var created store.PromoCode
		if err := json.Unmarshal(w.Body.Bytes(), &created); err != nil {
			t.Fatalf("Unmarshal response: %v", err)
		}
		if created.Code != "WINTER50" || created.DurationDays != 30 || created.PlanCode != "developer" {
			t.Errorf("Unexpected created promo: %+v", created)
		}
	})

	t.Run("List Promo Codes API", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/admin/promocodes", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d", w.Code)
		}

		var response struct {
			Items []store.PromoCode `json:"items"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
			t.Fatalf("Unmarshal response: %v", err)
		}

		found := false
		for _, promo := range response.Items {
			if promo.Code == "WINTER50" {
				found = true
				break
			}
		}
		if !found {
			t.Error("Expected WINTER50 in list of promo codes")
		}
	})

	t.Run("Redeem Promo Code API", func(t *testing.T) {
		payload := map[string]interface{}{
			"code": "WINTER50",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/billing/promo-code/redeem", bytes.NewReader(body))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected status 200, got %d, body: %s", w.Code, w.Body.String())
		}

		var res struct {
			Result    string          `json:"result"`
			Workspace store.Workspace `json:"workspace"`
		}
		if err := json.Unmarshal(w.Body.Bytes(), &res); err != nil {
			t.Fatalf("Unmarshal response: %v", err)
		}
		if res.Workspace.PlanCode != "developer" {
			t.Errorf("Expected workspace plan developer, got %s", res.Workspace.PlanCode)
		}
	})

	t.Run("Redeem Invalid/Used Promo Code API", func(t *testing.T) {
		payload := map[string]interface{}{
			"code": "WINTER50",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/billing/promo-code/redeem", bytes.NewReader(body))
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusBadRequest {
			t.Errorf("Expected status 400, got %d, body: %s", w.Code, w.Body.String())
		}
	})
}
