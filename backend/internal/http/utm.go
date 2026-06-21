package http

import (
	"encoding/json"
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

type utmEventInput struct {
	AttributionID string          `json:"attribution_id"`
	EventName     string          `json:"event_name" binding:"required"`
	Source        string          `json:"source"`
	Medium        string          `json:"medium"`
	Campaign      string          `json:"campaign"`
	Term          string          `json:"term"`
	Content       string          `json:"content"`
	Path          string          `json:"path" binding:"required"`
	Title         string          `json:"title"`
	Referrer      string          `json:"referrer"`
	Properties    json.RawMessage `json:"properties"`
}

func normalizeUTMVisit(input utmVisitInput) (store.AttributionInput, error) {
	source := strings.TrimSpace(input.Source)
	if source == "" {
		return store.AttributionInput{}, fmt.Errorf("source is required")
	}

	landingPath, err := normalizeLocalPath(input.LandingPath, "landing_path")
	if err != nil {
		return store.AttributionInput{}, err
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

func normalizeUTMEvent(input utmEventInput) (store.UTMEventInput, error) {
	eventName := strings.TrimSpace(input.EventName)
	if eventName == "" {
		return store.UTMEventInput{}, fmt.Errorf("event_name is required")
	}
	path, err := normalizeLocalPath(input.Path, "path")
	if err != nil {
		return store.UTMEventInput{}, err
	}
	if path == "" {
		return store.UTMEventInput{}, fmt.Errorf("path is required")
	}
	return store.UTMEventInput{
		AttributionID: strings.TrimSpace(input.AttributionID),
		EventName:     eventName,
		Source:        strings.TrimSpace(input.Source),
		Medium:        strings.TrimSpace(input.Medium),
		Campaign:      strings.TrimSpace(input.Campaign),
		Term:          strings.TrimSpace(input.Term),
		Content:       strings.TrimSpace(input.Content),
		Path:          path,
		Title:         strings.TrimSpace(input.Title),
		Referrer:      strings.TrimSpace(input.Referrer),
		Properties:    input.Properties,
	}, nil
}

func normalizeLocalPath(value string, field string) (string, error) {
	path := strings.TrimSpace(value)
	if path == "" {
		return "", nil
	}
	parsed, err := url.Parse(path)
	if err != nil || parsed.IsAbs() || !strings.HasPrefix(parsed.Path, "/") {
		return "", fmt.Errorf("%s must be a local path", field)
	}
	return path, nil
}

func (s *Server) handlePublicUTMVisit(c *gin.Context) {
	if !s.allowIPRate(c, "public_utm_visit", 60, time.Minute) {
		return
	}
	limitJSONBody(c, publicWriteJSONBodyLimitBytes)
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

func (s *Server) handlePublicUTMEvent(c *gin.Context) {
	if !s.allowIPRate(c, "public_utm_event", 120, time.Minute) {
		return
	}
	limitJSONBody(c, publicWriteJSONBodyLimitBytes)
	var input utmEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid utm event payload"})
		return
	}
	event, err := normalizeUTMEvent(input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := s.store.RecordUTMEvent(c.Request.Context(), event); err != nil {
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
