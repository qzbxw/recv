package http

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Server) handleAdminListPromoCodes(c *gin.Context) {
	items, err := s.store.ListPromoCodes(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (s *Server) handleAdminCreatePromoCode(c *gin.Context) {
	var body struct {
		Code         string     `json:"code"`
		DurationDays int        `json:"duration_days"`
		PlanCode     string     `json:"plan_code"`
		ExpiresAt    *time.Time `json:"expires_at"`
		MaxUses      *int       `json:"max_uses"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(body.Code))
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "code is required"})
		return
	}

	if body.DurationDays <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "duration_days must be greater than zero"})
		return
	}

	planCode, ok := validAdminPlanCode(body.PlanCode)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid plan_code"})
		return
	}

	adminCtx := adminFromContext(c)
	promo, err := s.store.CreatePromoCode(c.Request.Context(), code, body.DurationDays, planCode, body.ExpiresAt, body.MaxUses, adminCtx.Claims.Username)
	if err != nil {
		respondError(c, http.StatusBadRequest, err)
		return
	}

	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "create_promo_code", "promo_code", promo.Code, gin.H{
		"id":            promo.ID,
		"duration_days": promo.DurationDays,
		"plan_code":     promo.PlanCode,
		"expires_at":    promo.ExpiresAt,
		"max_uses":      promo.MaxUses,
	})

	c.JSON(http.StatusCreated, promo)
}

func (s *Server) handleAdminDeletePromoCode(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid promo code id"})
		return
	}

	ctx := c.Request.Context()
	// To log which code is deleted in audit logs, we can search for it first or log by id
	// Since we delete by ID, let's look it up or just delete and log the ID
	// Let's look up to get code string for nicer audit log
	var codeStr string = strconv.FormatInt(id, 10)
	promos, err := s.store.ListPromoCodes(ctx)
	if err == nil {
		for _, p := range promos {
			if p.ID == id {
				codeStr = p.Code
				break
			}
		}
	}

	err = s.store.DeletePromoCode(ctx, id)
	if err != nil {
		writeAdminStoreError(c, err, "promo code not found")
		return
	}

	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(ctx, adminCtx.Claims.Username, "delete_promo_code", "promo_code", codeStr, gin.H{"id": id})

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
