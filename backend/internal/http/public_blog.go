package http

import (
	"errors"
	"net/http"
	"strings"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

func (s *Server) handlePublicListBlogPosts(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	locale := normalizePublicBlogLocale(c.Query("locale"))
	if c.Query("locale") != "" && locale == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "locale must be en or ru"})
		return
	}

	posts, total, err := s.store.ListPublishedBlogPosts(c.Request.Context(), page, pageSize, locale)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": posts,
		"total": total,
		"page":  page,
		"size":  pageSize,
	})
}

func (s *Server) handlePublicGetBlogPost(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
		return
	}
	locale := normalizePublicBlogLocale(c.Query("locale"))
	if c.Query("locale") != "" && locale == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "locale must be en or ru"})
		return
	}

	post, err := s.store.GetBlogPostBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	if post.Status != "published" && !post.IsPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
		return
	}
	if locale != "" && post.Locale != locale {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
		return
	}

	c.JSON(http.StatusOK, post)
}

func (s *Server) handlePublicBlogSitemap(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 50000)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50000 {
		pageSize = 50000
	}

	posts, total, err := s.store.ListPublishedBlogPosts(c.Request.Context(), page, pageSize, "")
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	type sitemapItem struct {
		Slug         string  `json:"slug"`
		Locale       string  `json:"locale"`
		CanonicalURL *string `json:"canonical_url,omitempty"`
		UpdatedAt    string  `json:"updated_at"`
	}

	items := make([]sitemapItem, 0, len(posts))
	var latest string
	for _, post := range posts {
		updatedAt := post.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z")
		if latest == "" || updatedAt > latest {
			latest = updatedAt
		}
		items = append(items, sitemapItem{
			Slug:         post.Slug,
			Locale:       post.Locale,
			CanonicalURL: normalizedCanonicalURL(post.CanonicalURL),
			UpdatedAt:    updatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"items":      items,
		"total":      total,
		"page":       page,
		"size":       pageSize,
		"updated_at": latest,
	})
}

func normalizePublicBlogLocale(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "":
		return ""
	case "en":
		return "en"
	case "ru":
		return "ru"
	default:
		return ""
	}
}

func normalizedCanonicalURL(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}
