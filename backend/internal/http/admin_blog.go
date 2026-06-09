package http

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type createBlogPostInput struct {
	Slug                  string          `json:"slug" binding:"required"`
	Title                 string          `json:"title" binding:"required"`
	H1                    *string         `json:"h1"`
	ContentMD             string          `json:"content_md"`
	ContentJSON           json.RawMessage `json:"content_json"`
	ContentVersion        int             `json:"content_version"`
	Excerpt               *string         `json:"excerpt"`
	CoverImageURL         *string         `json:"cover_image_url"`
	Author                *string         `json:"author"`
	IsPublished           bool            `json:"is_published"`
	Status                string          `json:"status"`
	MetaTitle             *string         `json:"meta_title"`
	MetaDescription       *string         `json:"meta_description"`
	CanonicalURL          *string         `json:"canonical_url"`
	OGTitle               *string         `json:"og_title"`
	OGDescription         *string         `json:"og_description"`
	OGImageURL            *string         `json:"og_image_url"`
	CoverImageAlt         *string         `json:"cover_image_alt"`
	RobotsIndex           *bool           `json:"robots_index"`
	RobotsFollow          *bool           `json:"robots_follow"`
	IncludeInSitemap      *bool           `json:"include_in_sitemap"`
	AuthorSlug            string          `json:"author_slug"`
	Tags                  []string        `json:"tags"`
	Locale                string          `json:"locale"`
	PreviewToken          *string         `json:"preview_token"`
	InternalLinksCount    int             `json:"internal_links_count"`
	InternalLinkingStatus string          `json:"internal_linking_status"`
}

func (s *Server) handleAdminCreateBlogPost(c *gin.Context) {
	var input createBlogPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := normalizeBlogStatus(input.Status, input.IsPublished)
	normalizeLegacyBlogInput(&input)
	if err := validateBlogPostInput(input, status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:                  input.Slug,
		Title:                 input.Title,
		H1:                    input.H1,
		ContentMD:             input.ContentMD,
		ContentJSON:           input.ContentJSON,
		ContentVersion:        input.ContentVersion,
		Excerpt:               input.Excerpt,
		CoverImageURL:         input.CoverImageURL,
		Author:                input.Author,
		IsPublished:           status == "published",
		Status:                status,
		MetaTitle:             input.MetaTitle,
		MetaDescription:       input.MetaDescription,
		CanonicalURL:          input.CanonicalURL,
		OGTitle:               input.OGTitle,
		OGDescription:         input.OGDescription,
		OGImageURL:            input.OGImageURL,
		CoverImageAlt:         input.CoverImageAlt,
		RobotsIndex:           boolDefault(input.RobotsIndex, true),
		RobotsFollow:          boolDefault(input.RobotsFollow, true),
		IncludeInSitemap:      boolDefault(input.IncludeInSitemap, true),
		AuthorSlug:            input.AuthorSlug,
		Tags:                  input.Tags,
		Locale:                input.Locale,
		PreviewToken:          input.PreviewToken,
		InternalLinksCount:    input.InternalLinksCount,
		InternalLinkingStatus: input.InternalLinkingStatus,
		PublishedAt:           publishedAt,
	}

	createdPost, err := s.store.CreateBlogPost(c.Request.Context(), post)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "create_blog_post", "blog_post", strconv.FormatInt(createdPost.ID, 10), gin.H{"slug": createdPost.Slug, "status": createdPost.Status})

	c.JSON(http.StatusCreated, createdPost)
}

func (s *Server) handleAdminUpdateBlogPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	var input createBlogPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := normalizeBlogStatus(input.Status, input.IsPublished)
	normalizeLegacyBlogInput(&input)
	if err := validateBlogPostInput(input, status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:                  input.Slug,
		Title:                 input.Title,
		H1:                    input.H1,
		ContentMD:             input.ContentMD,
		ContentJSON:           input.ContentJSON,
		ContentVersion:        input.ContentVersion,
		Excerpt:               input.Excerpt,
		CoverImageURL:         input.CoverImageURL,
		Author:                input.Author,
		IsPublished:           status == "published",
		Status:                status,
		MetaTitle:             input.MetaTitle,
		MetaDescription:       input.MetaDescription,
		CanonicalURL:          input.CanonicalURL,
		OGTitle:               input.OGTitle,
		OGDescription:         input.OGDescription,
		OGImageURL:            input.OGImageURL,
		CoverImageAlt:         input.CoverImageAlt,
		RobotsIndex:           boolDefault(input.RobotsIndex, true),
		RobotsFollow:          boolDefault(input.RobotsFollow, true),
		IncludeInSitemap:      boolDefault(input.IncludeInSitemap, true),
		AuthorSlug:            input.AuthorSlug,
		Tags:                  input.Tags,
		Locale:                input.Locale,
		PreviewToken:          input.PreviewToken,
		InternalLinksCount:    input.InternalLinksCount,
		InternalLinkingStatus: input.InternalLinkingStatus,
		PublishedAt:           publishedAt,
	}

	updatedPost, err := s.store.UpdateBlogPost(c.Request.Context(), id, post)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "update_blog_post", "blog_post", strconv.FormatInt(updatedPost.ID, 10), gin.H{"slug": updatedPost.Slug, "status": updatedPost.Status})

	c.JSON(http.StatusOK, updatedPost)
}

func (s *Server) handleAdminDeleteBlogPost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	err = s.store.DeleteBlogPost(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "blog post not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	adminCtx := adminFromContext(c)
	_ = s.store.RecordAdminAuditEvent(c.Request.Context(), adminCtx.Claims.Username, "delete_blog_post", "blog_post", strconv.FormatInt(id, 10), gin.H{})

	c.Status(http.StatusNoContent)
}

func (s *Server) handleAdminListBlogPosts(c *gin.Context) {
	page := parseIntDefault(c.Query("page"), 1)
	pageSize := parseIntDefault(c.Query("page_size"), 20)

	posts, total, err := s.store.ListBlogPosts(c.Request.Context(), page, pageSize, false)
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

func normalizeBlogStatus(status string, isPublished bool) string {
	if status == "published" || isPublished {
		return "published"
	}
	return "draft"
}

func boolDefault(value *bool, fallback bool) bool {
	if value == nil {
		return fallback
	}
	return *value
}

func normalizeLegacyBlogInput(input *createBlogPostInput) {
	content := strings.TrimLeft(input.ContentMD, "\r\n\t ")
	if strings.HasPrefix(content, "# ") {
		lines := strings.SplitN(content, "\n", 2)
		legacyH1 := strings.TrimSpace(strings.TrimPrefix(lines[0], "# "))
		if legacyH1 != "" && (input.H1 == nil || strings.TrimSpace(*input.H1) == "") {
			input.H1 = stringPointerValue(legacyH1)
		}
		if len(lines) == 2 {
			input.ContentMD = strings.TrimLeft(lines[1], "\r\n")
		} else {
			input.ContentMD = ""
		}
	}
	if input.H1 == nil || strings.TrimSpace(*input.H1) == "" {
		input.H1 = stringPointerValue(input.Title)
	}
	if input.AuthorSlug == "" {
		input.AuthorSlug = "recv-core"
	}
	if input.ContentVersion < 1 {
		input.ContentVersion = 1
	}
	if input.MetaDescription == nil || strings.TrimSpace(*input.MetaDescription) == "" {
		if input.Excerpt != nil && strings.TrimSpace(*input.Excerpt) != "" {
			input.MetaDescription = stringPointerValue(strings.TrimSpace(*input.Excerpt))
		} else {
			input.MetaDescription = stringPointerValue(strings.TrimSpace(input.Title))
		}
	}
}

func stringPointerValue(value string) *string {
	return &value
}

var markdownHeadingPattern = regexp.MustCompile(`(?m)^\s{0,3}(#{1,6})\s+`)

func validateBlogPostInput(input createBlogPostInput, status string) error {
	if len(input.ContentJSON) > 0 {
		if !json.Valid(input.ContentJSON) {
			return fmt.Errorf("content_json must be valid JSON")
		}
		// Sanitization applies to drafts too: unsafe links or unknown node
		// types should never reach the database.
		if err := validateStructuredContent(input.ContentJSON, status == "published"); err != nil {
			return err
		}
	}
	if status != "published" {
		return nil
	}
	if input.H1 == nil || strings.TrimSpace(*input.H1) == "" {
		return fmt.Errorf("h1 is required before publishing")
	}
	if input.MetaDescription == nil || strings.TrimSpace(*input.MetaDescription) == "" {
		return fmt.Errorf("meta_description is required before publishing")
	}
	if input.CoverImageURL != nil && strings.TrimSpace(*input.CoverImageURL) != "" &&
		(input.CoverImageAlt == nil || strings.TrimSpace(*input.CoverImageAlt) == "") {
		return fmt.Errorf("cover_image_alt is required when a cover image is set")
	}
	if err := validateMarkdownHeadings(input.ContentMD); err != nil {
		return err
	}
	if len(input.ContentJSON) > 0 {
		if err := validateStructuredHeadings(input.ContentJSON); err != nil {
			return err
		}
	}
	return nil
}

func validateMarkdownHeadings(content string) error {
	lastLevel := 1
	for _, match := range markdownHeadingPattern.FindAllStringSubmatch(content, -1) {
		level := len(match[1])
		if level == 1 {
			return fmt.Errorf("content must not contain an H1")
		}
		if level > 3 {
			return fmt.Errorf("content headings are limited to H2 and H3")
		}
		if level > lastLevel+1 {
			return fmt.Errorf("content heading hierarchy skips a level")
		}
		lastLevel = level
	}
	return nil
}

func validateStructuredHeadings(content json.RawMessage) error {
	var root any
	if err := json.Unmarshal(content, &root); err != nil {
		return fmt.Errorf("content_json must be valid JSON")
	}
	lastLevel := 1
	var walk func(any) error
	walk = func(value any) error {
		switch node := value.(type) {
		case []any:
			for _, child := range node {
				if err := walk(child); err != nil {
					return err
				}
			}
		case map[string]any:
			if nodeType, _ := node["type"].(string); nodeType == "heading" {
				attrs, _ := node["attrs"].(map[string]any)
				levelValue, _ := attrs["level"].(float64)
				level := int(levelValue)
				if level < 2 || level > 3 {
					return fmt.Errorf("structured content headings are limited to H2 and H3")
				}
				if level > lastLevel+1 {
					return fmt.Errorf("structured content heading hierarchy skips a level")
				}
				lastLevel = level
			}
			if children, ok := node["content"]; ok {
				return walk(children)
			}
		}
		return nil
	}
	return walk(root)
}
