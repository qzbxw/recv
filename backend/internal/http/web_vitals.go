package http

import (
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strings"
	"time"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type webVitalInput struct {
	Name           string  `json:"name" binding:"required"`
	Value          float64 `json:"value"`
	Path           string  `json:"path" binding:"required"`
	Locale         string  `json:"locale" binding:"required"`
	NavigationType string  `json:"navigation_type"`
}

func normalizeWebVital(input webVitalInput) (store.WebVital, error) {
	name := strings.ToUpper(strings.TrimSpace(input.Name))
	if name != "LCP" && name != "INP" && name != "CLS" {
		return store.WebVital{}, fmt.Errorf("name must be LCP, INP, or CLS")
	}
	if math.IsNaN(input.Value) || math.IsInf(input.Value, 0) || input.Value < 0 {
		return store.WebVital{}, fmt.Errorf("value must be a finite non-negative number")
	}
	if (name == "LCP" || name == "INP") && input.Value > 120000 {
		return store.WebVital{}, fmt.Errorf("timing value is outside the accepted range")
	}
	if name == "CLS" && input.Value > 10 {
		return store.WebVital{}, fmt.Errorf("CLS value is outside the accepted range")
	}

	parsed, err := url.Parse(strings.TrimSpace(input.Path))
	if err != nil || parsed.IsAbs() || parsed.RawQuery != "" || parsed.Fragment != "" || !strings.HasPrefix(parsed.Path, "/") {
		return store.WebVital{}, fmt.Errorf("path must be a local path without query or fragment")
	}
	if len(parsed.Path) > 500 {
		return store.WebVital{}, fmt.Errorf("path is too long")
	}

	locale := strings.ToLower(strings.TrimSpace(input.Locale))
	if locale != "en" && locale != "ru" {
		return store.WebVital{}, fmt.Errorf("locale must be en or ru")
	}
	navigationType := strings.ToLower(strings.TrimSpace(input.NavigationType))
	switch navigationType {
	case "", "navigate", "reload", "back_forward", "prerender":
		if navigationType == "" {
			navigationType = "navigate"
		}
	default:
		navigationType = "navigate"
	}

	return store.WebVital{
		MetricName:     name,
		MetricValue:    input.Value,
		Path:           parsed.Path,
		Locale:         locale,
		NavigationType: navigationType,
	}, nil
}

func (s *Server) handlePublicWebVital(c *gin.Context) {
	if !s.allowIPRate(c, "public_web_vitals", 60, time.Minute) {
		return
	}
	limitJSONBody(c, publicWriteJSONBodyLimitBytes)
	var input webVitalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid web vital payload"})
		return
	}
	vital, err := normalizeWebVital(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := s.store.RecordWebVital(c.Request.Context(), vital); err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handleAdminWebVitals(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid web vitals date range"})
		return
	}

	report, err := s.store.GetWebVitalsReport(c.Request.Context(), from, to)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, report)
}
