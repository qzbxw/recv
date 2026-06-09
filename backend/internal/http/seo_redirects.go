package http

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strconv"
	"strings"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type seoRedirectInput struct {
	SourcePath string `json:"source_path" binding:"required"`
	TargetURL  string `json:"target_url" binding:"required"`
	StatusCode int    `json:"status_code"`
	IsActive   *bool  `json:"is_active"`
}

func normalizeRedirectSource(value string) (string, error) {
	parsed, err := url.Parse(strings.TrimSpace(value))
	if err != nil || parsed.IsAbs() || parsed.RawQuery != "" || parsed.Fragment != "" {
		return "", fmt.Errorf("source_path must be a local path without query or fragment")
	}
	if !strings.HasPrefix(parsed.Path, "/") {
		return "", fmt.Errorf("source_path must start with /")
	}
	normalized := path.Clean(parsed.Path)
	if normalized == "." {
		normalized = "/"
	}
	privatePrefixes := []string{"/api", "/v1", "/app", "/_next", "/internal", "/sitemaps"}
	for _, prefix := range privatePrefixes {
		if normalized == prefix || strings.HasPrefix(normalized, prefix+"/") {
			return "", fmt.Errorf("source_path cannot target a private or infrastructure route")
		}
	}
	return normalized, nil
}

func normalizeRedirectTarget(value string) (string, error) {
	target := strings.TrimSpace(value)
	parsed, err := url.Parse(target)
	if err != nil {
		return "", fmt.Errorf("invalid target_url")
	}
	if parsed.IsAbs() {
		if parsed.Scheme != "https" || parsed.Host == "" {
			return "", fmt.Errorf("external target_url must use https")
		}
		return parsed.String(), nil
	}
	if !strings.HasPrefix(parsed.Path, "/") {
		return "", fmt.Errorf("target_url must be an absolute https URL or local path")
	}
	parsed.Path = path.Clean(parsed.Path)
	return parsed.String(), nil
}

func validateRedirectGraph(redirects []store.SEORedirect, candidate store.SEORedirect) error {
	graph := make(map[string]string, len(redirects)+1)
	for _, redirect := range redirects {
		if redirect.ID == candidate.ID || !redirect.IsActive {
			continue
		}
		graph[redirect.SourcePath] = redirect.TargetURL
	}
	if candidate.IsActive {
		graph[candidate.SourcePath] = candidate.TargetURL
	}

	for source := range graph {
		seen := map[string]bool{}
		current := source
		for {
			if seen[current] {
				return fmt.Errorf("redirect cycle detected at %s", current)
			}
			seen[current] = true
			target, ok := graph[current]
			if !ok {
				break
			}
			parsed, err := url.Parse(target)
			if err != nil || parsed.IsAbs() {
				break
			}
			current = parsed.Path
		}
	}
	return nil
}

func redirectFromInput(input seoRedirectInput, actor string) (store.SEORedirect, error) {
	source, err := normalizeRedirectSource(input.SourcePath)
	if err != nil {
		return store.SEORedirect{}, err
	}
	target, err := normalizeRedirectTarget(input.TargetURL)
	if err != nil {
		return store.SEORedirect{}, err
	}
	status := input.StatusCode
	if status == 0 {
		status = http.StatusMovedPermanently
	}
	if status != http.StatusMovedPermanently && status != http.StatusFound && status != http.StatusPermanentRedirect {
		return store.SEORedirect{}, fmt.Errorf("status_code must be 301, 302, or 308")
	}
	active := true
	if input.IsActive != nil {
		active = *input.IsActive
	}
	if source == target {
		return store.SEORedirect{}, fmt.Errorf("source_path and target_url cannot be identical")
	}
	return store.SEORedirect{
		SourcePath: source,
		TargetURL:  target,
		StatusCode: status,
		IsActive:   active,
		CreatedBy:  actor,
	}, nil
}

func (s *Server) handleAdminListSEORedirects(c *gin.Context) {
	redirects, err := s.store.ListSEORedirects(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": redirects})
}

func (s *Server) handleAdminCreateSEORedirect(c *gin.Context) {
	var input seoRedirectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	redirect, err := redirectFromInput(input, adminFromContext(c).Claims.Username)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	existing, err := s.store.ListSEORedirects(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	if err := validateRedirectGraph(existing, redirect); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	created, err := s.store.CreateSEORedirect(c.Request.Context(), redirect)
	if err != nil {
		respondError(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (s *Server) handleAdminUpdateSEORedirect(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid redirect id"})
		return
	}
	var input seoRedirectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	redirect, err := redirectFromInput(input, adminFromContext(c).Claims.Username)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	redirect.ID = id
	existing, err := s.store.ListSEORedirects(c.Request.Context())
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	if err := validateRedirectGraph(existing, redirect); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	updated, err := s.store.UpdateSEORedirect(c.Request.Context(), id, redirect)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "redirect not found"})
			return
		}
		respondError(c, http.StatusBadRequest, err)
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (s *Server) handleAdminDeleteSEORedirect(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid redirect id"})
		return
	}
	if err := s.store.DeleteSEORedirect(c.Request.Context(), id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "redirect not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func (s *Server) handlePublicResolveSEORedirect(c *gin.Context) {
	source, err := normalizeRedirectSource(c.Query("path"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	redirect, err := s.store.ResolveSEORedirect(c.Request.Context(), source)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.Header("Cache-Control", "public, max-age=30, s-maxage=60")
			c.Status(http.StatusNotFound)
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.Header("Cache-Control", "public, max-age=30, s-maxage=60")
	c.JSON(http.StatusOK, gin.H{
		"target_url":  redirect.TargetURL,
		"status_code": redirect.StatusCode,
	})
}
