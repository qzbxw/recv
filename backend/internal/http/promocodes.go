package http

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"recv/backend/internal/store"
)

func (s *Server) handleRedeemPromoCode(c *gin.Context) {
	wc := workspaceFromContext(c)
	if !s.requireWorkspaceManager(c, wc) {
		return
	}
	var body struct {
		Code string `json:"code"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	code := strings.TrimSpace(body.Code)
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "promo code is required"})
		return
	}

	updatedWs, err := s.store.RedeemPromoCode(c.Request.Context(), wc.Workspace.ID, code)
	if err != nil {
		if errors.Is(err, store.ErrPromoCodeNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "promo code not found"})
			return
		}
		if errors.Is(err, store.ErrPromoCodeExpired) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "promo code has expired"})
			return
		}
		if errors.Is(err, store.ErrPromoCodeMaxUsesLimit) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "promo code has reached its usage limit"})
			return
		}
		if errors.Is(err, store.ErrPromoCodeAlreadyUsed) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "promo code has already been redeemed by this workspace"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"workspace": updatedWs,
		"result":    "Promo code redeemed successfully.",
	})
}
