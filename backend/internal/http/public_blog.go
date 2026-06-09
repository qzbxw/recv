package http

import (
	"encoding/json"
	"errors"
	"net/http"
	"regexp"
	"strings"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

// publicBlogPost augments a post with intrinsic cover dimensions when the
// cover is served from the media library, letting the frontend render
// fixed-aspect images without layout shift.
type publicBlogPost struct {
	store.BlogPost
	CoverImageWidth  int `json:"cover_image_width,omitempty"`
	CoverImageHeight int `json:"cover_image_height,omitempty"`
}

var publicMediaURLPattern = regexp.MustCompile(`^/media/([a-f0-9]{16}\.(?:jpg|png|webp|gif))$`)

func mediaFileNameFromURL(url *string) string {
	if url == nil {
		return ""
	}
	match := publicMediaURLPattern.FindStringSubmatch(*url)
	if match == nil {
		return ""
	}
	return match[1]
}

func (s *Server) enrichPostsWithCoverDimensions(c *gin.Context, posts []store.BlogPost) []publicBlogPost {
	fileNames := make([]string, 0, len(posts))
	for _, post := range posts {
		if name := mediaFileNameFromURL(post.CoverImageURL); name != "" {
			fileNames = append(fileNames, name)
		}
		fileNames = append(fileNames, structuredMediaFileNames(post.ContentJSON)...)
	}

	var mediaByName map[string]store.Media
	if len(fileNames) > 0 {
		if found, err := s.store.GetMediaByFileNames(c.Request.Context(), fileNames); err == nil {
			mediaByName = found
		}
	}

	enriched := make([]publicBlogPost, 0, len(posts))
	for _, post := range posts {
		item := publicBlogPost{BlogPost: post}
		if media, ok := mediaByName[mediaFileNameFromURL(post.CoverImageURL)]; ok {
			item.CoverImageWidth = media.Width
			item.CoverImageHeight = media.Height
		}
		item.ContentJSON = injectStructuredImageDimensions(post.ContentJSON, mediaByName)
		enriched = append(enriched, item)
	}
	return enriched
}

// structuredMediaFileNames collects media-library file names referenced by
// image nodes inside a structured document.
func structuredMediaFileNames(content json.RawMessage) []string {
	if len(content) == 0 {
		return nil
	}
	var root any
	if err := json.Unmarshal(content, &root); err != nil {
		return nil
	}
	var names []string
	var walk func(any)
	walk = func(value any) {
		switch node := value.(type) {
		case []any:
			for _, child := range node {
				walk(child)
			}
		case map[string]any:
			if nodeType, _ := node["type"].(string); nodeType == "image" {
				if attrs, ok := node["attrs"].(map[string]any); ok {
					if src, _ := attrs["src"].(string); src != "" {
						if name := mediaFileNameFromURL(&src); name != "" {
							names = append(names, name)
						}
					}
				}
			}
			walk(node["content"])
		}
	}
	walk(root)
	return names
}

// injectStructuredImageDimensions adds width/height attrs to media-library
// image nodes so the public renderer can reserve space and avoid layout
// shift. Content without media images is returned unchanged.
func injectStructuredImageDimensions(content json.RawMessage, mediaByName map[string]store.Media) json.RawMessage {
	if len(content) == 0 || len(mediaByName) == 0 {
		return content
	}
	var root any
	if err := json.Unmarshal(content, &root); err != nil {
		return content
	}
	changed := false
	var walk func(any)
	walk = func(value any) {
		switch node := value.(type) {
		case []any:
			for _, child := range node {
				walk(child)
			}
		case map[string]any:
			if nodeType, _ := node["type"].(string); nodeType == "image" {
				if attrs, ok := node["attrs"].(map[string]any); ok {
					if src, _ := attrs["src"].(string); src != "" {
						if media, found := mediaByName[mediaFileNameFromURL(&src)]; found {
							attrs["width"] = media.Width
							attrs["height"] = media.Height
							changed = true
						}
					}
				}
			}
			walk(node["content"])
		}
	}
	walk(root)
	if !changed {
		return content
	}
	encoded, err := json.Marshal(root)
	if err != nil {
		return content
	}
	return encoded
}

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
		"items": s.enrichPostsWithCoverDimensions(c, posts),
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

	post, err := s.store.GetBlogPostBySlug(c.Request.Context(), slug, locale)
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

	if locales, lerr := s.store.ListPublishedBlogLocalesBySlug(c.Request.Context(), slug); lerr == nil {
		post.AvailableLocales = locales
	}

	c.JSON(http.StatusOK, s.enrichPostsWithCoverDimensions(c, []store.BlogPost{post})[0])
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
	locale := normalizePublicBlogLocale(c.Query("locale"))
	if c.Query("locale") != "" && locale == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "locale must be en or ru"})
		return
	}

	posts, total, err := s.store.ListPublishedBlogSitemapPosts(c.Request.Context(), page, pageSize, locale)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	type sitemapItem struct {
		Slug             string   `json:"slug"`
		Locale           string   `json:"locale"`
		CanonicalURL     *string  `json:"canonical_url,omitempty"`
		UpdatedAt        string   `json:"updated_at"`
		AvailableLocales []string `json:"available_locales,omitempty"`
	}

	slugs := make([]string, 0, len(posts))
	for _, post := range posts {
		slugs = append(slugs, post.Slug)
	}
	availableLocales, err := s.store.ListPublishedBlogLocalesBySlugs(c.Request.Context(), slugs)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	items := make([]sitemapItem, 0, len(posts))
	var latest string
	for _, post := range posts {
		updatedAt := post.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z")
		if latest == "" || updatedAt > latest {
			latest = updatedAt
		}
		items = append(items, sitemapItem{
			Slug:             post.Slug,
			Locale:           post.Locale,
			CanonicalURL:     normalizedCanonicalURL(post.CanonicalURL),
			UpdatedAt:        updatedAt,
			AvailableLocales: availableLocales[post.Slug],
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
