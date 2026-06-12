package http

import (
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type utmVisitInput struct {
	AttributionID string `json:"attribution_id"`
	Source        string `json:"source" binding:"required"`
	Medium        string `json:"medium"`
	Campaign      string `json:"campaign"`
	Term          string `json:"term"`
	Content       string `json:"content"`
	LandingPath   string `json:"landing_path"`
	Referrer      string `json:"referrer"`
}

func normalizeUTMVisit(input utmVisitInput) (store.AttributionInput, error) {
	source := strings.TrimSpace(input.Source)
	if source == "" {
		return store.AttributionInput{}, fmt.Errorf("source is required")
	}

	landingPath := strings.TrimSpace(input.LandingPath)
	if landingPath != "" {
		parsed, err := url.Parse(landingPath)
		if err != nil || parsed.IsAbs() || !strings.HasPrefix(parsed.Path, "/") {
			return store.AttributionInput{}, fmt.Errorf("landing_path must be a local path")
		}
	}

	return store.AttributionInput{
		AttributionID: strings.TrimSpace(input.AttributionID),
		TouchType:     "last",
		Source:        source,
		Medium:        strings.TrimSpace(input.Medium),
		Campaign:      strings.TrimSpace(input.Campaign),
		Term:          strings.TrimSpace(input.Term),
		Content:       strings.TrimSpace(input.Content),
		LandingPath:   landingPath,
		Referrer:      strings.TrimSpace(input.Referrer),
	}, nil
}

func (s *Server) handlePublicUTMVisit(c *gin.Context) {
	var input utmVisitInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid utm visit payload"})
		return
	}
	visit, err := normalizeUTMVisit(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := s.store.RecordUTMVisit(c.Request.Context(), visit); err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleAdminUTMReport(c *gin.Context) {
	to := time.Now().UTC()
	from := to.AddDate(0, 0, -28)
	if value := c.Query("from"); value != "" {
		parsed, err := time.Parse(time.RFC3339, value)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "from must be RFC3339"})
			return
		}
		from = parsed
	}
	if value := c.Query("to"); value != "" {
		parsed, err := time.Parse(time.RFC3339, value)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "to must be RFC3339"})
			return
		}
		to = parsed
	}
	if !from.Before(to) || to.Sub(from) > 366*24*time.Hour {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid utm report date range"})
		return
	}

	report, err := s.store.GetUTMReport(c.Request.Context(), from, to)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, report)
}
