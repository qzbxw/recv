package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const robotsConfigKey = "seo_robots_txt"
const canonicalSitemapDirective = "Sitemap: https://recv.money/sitemap.xml"

type robotsConfig struct {
	Content string `json:"content"`
}

func defaultRobotsContent() string {
	return `User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /v1/
Disallow: /internal/

` + canonicalSitemapDirective + "\n"
}

func validateRobotsContent(content string) error {
	normalized := strings.ReplaceAll(content, "\r\n", "\n")
	if !strings.Contains(normalized, canonicalSitemapDirective) {
		return fmt.Errorf("robots.txt must contain %q", canonicalSitemapDirective)
	}

	blockedResources := []string{"/_next", "/*.css", "/*.js", "/*.png", "/*.jpg", "/*.webp", "/*.avif"}
	for _, rawLine := range strings.Split(normalized, "\n") {
		line := strings.TrimSpace(strings.SplitN(rawLine, "#", 2)[0])
		lower := strings.ToLower(line)
		if lower == "disallow: /" {
			return fmt.Errorf("global Disallow: / is not allowed")
		}
		for _, resource := range blockedResources {
			if strings.EqualFold(line, "Disallow: "+resource) || strings.EqualFold(line, "Disallow: "+resource+"/") {
				return fmt.Errorf("blocking public resource path %s is not allowed", resource)
			}
		}
	}
	return nil
}

func (s *Server) loadRobotsContent(c *gin.Context) string {
	item, err := s.store.GetSystemConfig(c.Request.Context(), robotsConfigKey)
	if err != nil {
		return defaultRobotsContent()
	}
	var config robotsConfig
	if json.Unmarshal(item.Value, &config) != nil || validateRobotsContent(config.Content) != nil {
		return defaultRobotsContent()
	}
	return config.Content
}

func (s *Server) handlePublicRobotsConfig(c *gin.Context) {
	c.JSON(http.StatusOK, robotsConfig{Content: s.loadRobotsContent(c)})
}

func (s *Server) handleAdminGetRobotsConfig(c *gin.Context) {
	c.JSON(http.StatusOK, robotsConfig{Content: s.loadRobotsContent(c)})
}

func (s *Server) handleAdminUpdateRobotsConfig(c *gin.Context) {
	var input robotsConfig
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	input.Content = strings.TrimSpace(input.Content) + "\n"
	if err := validateRobotsContent(input.Content); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	adminCtx := adminFromContext(c)
	if err := s.store.UpsertSystemConfig(c.Request.Context(), robotsConfigKey, input, false, adminCtx.Claims.Username); err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, input)
}
