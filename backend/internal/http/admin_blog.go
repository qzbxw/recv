package http

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"reqst/backend/internal/store"

	"github.com/gin-gonic/gin"
)

type createBlogPostInput struct {
	Slug                  string   `json:"slug" binding:"required"`
	Title                 string   `json:"title" binding:"required"`
	ContentMD             string   `json:"content_md" binding:"required"`
	Excerpt               *string  `json:"excerpt"`
	CoverImageURL         *string  `json:"cover_image_url"`
	Author                *string  `json:"author"`
	IsPublished           bool     `json:"is_published"`
	Status                string   `json:"status"`
	MetaTitle             *string  `json:"meta_title"`
	MetaDescription       *string  `json:"meta_description"`
	CanonicalURL          *string  `json:"canonical_url"`
	Tags                  []string `json:"tags"`
	Locale                string   `json:"locale"`
	PreviewToken          *string  `json:"preview_token"`
	InternalLinksCount    int      `json:"internal_links_count"`
	InternalLinkingStatus string   `json:"internal_linking_status"`
}

func (s *Server) handleAdminCreateBlogPost(c *gin.Context) {
	var input createBlogPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := normalizeBlogStatus(input.Status, input.IsPublished)
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:                  input.Slug,
		Title:                 input.Title,
		ContentMD:             input.ContentMD,
		Excerpt:               input.Excerpt,
		CoverImageURL:         input.CoverImageURL,
		Author:                input.Author,
		IsPublished:           status == "published",
		Status:                status,
		MetaTitle:             input.MetaTitle,
		MetaDescription:       input.MetaDescription,
		CanonicalURL:          input.CanonicalURL,
		Tags:                  input.Tags,
		Locale:                input.Locale,
		PreviewToken:          input.PreviewToken,
		InternalLinksCount:    input.InternalLinksCount,
		InternalLinkingStatus: input.InternalLinkingStatus,
		PublishedAt:           publishedAt,
	}

	createdPost, err := s.store.CreateBlogPost(c.Request.Context(), post)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	post := store.BlogPost{
		Slug:                  input.Slug,
		Title:                 input.Title,
		ContentMD:             input.ContentMD,
		Excerpt:               input.Excerpt,
		CoverImageURL:         input.CoverImageURL,
		Author:                input.Author,
		IsPublished:           status == "published",
		Status:                status,
		MetaTitle:             input.MetaTitle,
		MetaDescription:       input.MetaDescription,
		CanonicalURL:          input.CanonicalURL,
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
