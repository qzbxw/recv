package http

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"mime/multipart"
	stdhttp "net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"recv/backend/internal/config"
	"recv/backend/internal/service"
	"recv/backend/internal/store"
)

func newMediaTestServer(t *testing.T) (*Server, *gin.Engine) {
	t.Helper()
	gin.SetMode(gin.TestMode)

	server := &Server{
		cfg:          config.Config{MediaDir: t.TempDir()},
		store:        sharedHTTPTestStore,
		adminService: service.NewAdminService("admin", "pass", "secret", time.Hour),
	}

	router := gin.New()
	withAdmin := func(c *gin.Context) {
		c.Set("admin_ctx", adminContext{Claims: service.AdminClaims{Username: "admin"}})
		c.Next()
	}
	admin := router.Group("/api/admin", withAdmin)
	admin.GET("/media", server.handleAdminListMedia)
	admin.POST("/media", server.handleAdminUploadMedia)
	admin.PATCH("/media/:id", server.handleAdminUpdateMediaAlt)
	admin.DELETE("/media/:id", server.handleAdminDeleteMedia)
	router.GET("/media/:file", server.handlePublicMedia)
	return server, router
}

func multipartUpload(t *testing.T, fieldFileName string, content []byte) (*bytes.Buffer, string) {
	t.Helper()
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", fieldFileName)
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	if _, err := part.Write(content); err != nil {
		t.Fatalf("write form file: %v", err)
	}
	if err := writer.Close(); err != nil {
		t.Fatalf("close multipart writer: %v", err)
	}
	return body, writer.FormDataContentType()
}

func encodeTestJPEG(t *testing.T, width, height int) []byte {
	t.Helper()
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for x := 0; x < width; x++ {
		img.Set(x, 0, color.RGBA{R: 200, A: 255})
	}
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 90}); err != nil {
		t.Fatalf("encode jpeg: %v", err)
	}
	return buf.Bytes()
}

// withEXIFOrientation injects an APP1 EXIF segment carrying the given
// orientation right after the JPEG SOI marker.
func withEXIFOrientation(t *testing.T, jpegData []byte, orientation uint16) []byte {
	t.Helper()
	if len(jpegData) < 2 || jpegData[0] != 0xFF || jpegData[1] != 0xD8 {
		t.Fatal("not a jpeg")
	}

	tiff := &bytes.Buffer{}
	tiff.WriteString("II")                                    // little endian
	binary.Write(tiff, binary.LittleEndian, uint16(42))       // TIFF magic
	binary.Write(tiff, binary.LittleEndian, uint32(8))        // IFD0 offset
	binary.Write(tiff, binary.LittleEndian, uint16(1))        // entry count
	binary.Write(tiff, binary.LittleEndian, uint16(0x0112))   // orientation tag
	binary.Write(tiff, binary.LittleEndian, uint16(3))        // SHORT
	binary.Write(tiff, binary.LittleEndian, uint32(1))        // count
	binary.Write(tiff, binary.LittleEndian, orientation)      // value
	binary.Write(tiff, binary.LittleEndian, uint16(0))        // value padding
	binary.Write(tiff, binary.LittleEndian, uint32(0))        // next IFD

	payload := append([]byte("Exif\x00\x00"), tiff.Bytes()...)
	segment := &bytes.Buffer{}
	segment.Write([]byte{0xFF, 0xE1})
	binary.Write(segment, binary.BigEndian, uint16(len(payload)+2))
	segment.Write(payload)

	out := append([]byte{0xFF, 0xD8}, segment.Bytes()...)
	return append(out, jpegData[2:]...)
}

func postMedia(t *testing.T, router *gin.Engine, filename string, content []byte) *httptest.ResponseRecorder {
	t.Helper()
	body, contentType := multipartUpload(t, filename, content)
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/media", body)
	req.Header.Set("Content-Type", contentType)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	return rec
}

func TestAdminMediaUploadValidation(t *testing.T) {
	_, router := newMediaTestServer(t)

	t.Run("rejects MIME-spoofed executable named as jpg", func(t *testing.T) {
		payload := append([]byte("MZ\x90\x00\x03"), bytes.Repeat([]byte{0x90}, 256)...)
		rec := postMedia(t, router, "totally-a-photo.jpg", payload)
		if rec.Code != stdhttp.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for spoofed content, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("rejects png content with jpg extension", func(t *testing.T) {
		var buf bytes.Buffer
		if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, 4, 4))); err != nil {
			t.Fatalf("encode png: %v", err)
		}
		rec := postMedia(t, router, "photo.jpg", buf.Bytes())
		if rec.Code != stdhttp.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for extension mismatch, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("rejects unsupported extension", func(t *testing.T) {
		rec := postMedia(t, router, "image.svg", []byte(`<svg xmlns="http://www.w3.org/2000/svg"></svg>`))
		if rec.Code != stdhttp.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for svg, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("rejects oversized upload", func(t *testing.T) {
		oversized := bytes.Repeat([]byte{0xFF}, maxMediaUploadBytes+1)
		copy(oversized, []byte{0xFF, 0xD8, 0xFF, 0xE0})
		rec := postMedia(t, router, "big.jpg", oversized)
		if rec.Code != stdhttp.StatusRequestEntityTooLarge {
			t.Fatalf("expected 413 for oversized upload, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("rejects decompression bomb dimensions from header", func(t *testing.T) {
		// Minimal PNG: signature + IHDR declaring 50000x50000.
		bomb := &bytes.Buffer{}
		bomb.Write([]byte{0x89, 'P', 'N', 'G', '\r', '\n', 0x1A, '\n'})
		ihdr := &bytes.Buffer{}
		binary.Write(ihdr, binary.BigEndian, uint32(50000))
		binary.Write(ihdr, binary.BigEndian, uint32(50000))
		ihdr.Write([]byte{8, 2, 0, 0, 0}) // bit depth, color type, etc.
		binary.Write(bomb, binary.BigEndian, uint32(13))
		bomb.WriteString("IHDR")
		bomb.Write(ihdr.Bytes())
		binary.Write(bomb, binary.BigEndian, uint32(0)) // bogus CRC; DecodeConfig does not verify
		rec := postMedia(t, router, "bomb.png", bomb.Bytes())
		if rec.Code != stdhttp.StatusUnprocessableEntity {
			t.Fatalf("expected 422 for dimension bomb, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAdminMediaUploadAndServe(t *testing.T) {
	server, router := newMediaTestServer(t)

	rec := postMedia(t, router, "photo.jpg", encodeTestJPEG(t, 120, 80))
	if rec.Code != stdhttp.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}

	var uploaded mediaResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &uploaded); err != nil {
		t.Fatalf("unmarshal response: %v", err)
	}
	if uploaded.Width != 120 || uploaded.Height != 80 {
		t.Fatalf("expected 120x80, got %dx%d", uploaded.Width, uploaded.Height)
	}
	if uploaded.MimeType != "image/jpeg" {
		t.Fatalf("expected image/jpeg, got %s", uploaded.MimeType)
	}
	if uploaded.URL != "/media/"+uploaded.FileName {
		t.Fatalf("unexpected url %s", uploaded.URL)
	}
	if _, err := os.Stat(filepath.Join(server.cfg.MediaDir, uploaded.FileName)); err != nil {
		t.Fatalf("stored file missing: %v", err)
	}

	t.Run("serves stored media with immutable cache", func(t *testing.T) {
		req := httptest.NewRequest(stdhttp.MethodGet, uploaded.URL, nil)
		serveRec := httptest.NewRecorder()
		router.ServeHTTP(serveRec, req)
		if serveRec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", serveRec.Code)
		}
		if cc := serveRec.Header().Get("Cache-Control"); cc != "public, max-age=31536000, immutable" {
			t.Fatalf("unexpected cache-control %q", cc)
		}
		if ct := serveRec.Header().Get("Content-Type"); ct != "image/jpeg" {
			t.Fatalf("unexpected content-type %q", ct)
		}
	})

	t.Run("rejects path traversal names", func(t *testing.T) {
		for _, path := range []string{"/media/..%2F..%2Fetc%2Fpasswd", "/media/secret.txt", "/media/abc.jpg"} {
			req := httptest.NewRequest(stdhttp.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, req)
			if rec.Code != stdhttp.StatusNotFound {
				t.Fatalf("expected 404 for %s, got %d", path, rec.Code)
			}
		}
	})

	t.Run("duplicate upload returns the same content-addressed record", func(t *testing.T) {
		again := postMedia(t, router, "photo-copy.jpg", encodeTestJPEG(t, 120, 80))
		if again.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d", again.Code)
		}
		var duplicate mediaResponse
		if err := json.Unmarshal(again.Body.Bytes(), &duplicate); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if duplicate.FileName != uploaded.FileName || duplicate.ID != uploaded.ID {
			t.Fatalf("expected duplicate to reuse record %d/%s, got %d/%s", uploaded.ID, uploaded.FileName, duplicate.ID, duplicate.FileName)
		}
	})
}

func TestAdminMediaEXIFOrientationAndResize(t *testing.T) {
	_, router := newMediaTestServer(t)

	t.Run("applies orientation 6 by swapping dimensions", func(t *testing.T) {
		rotated := withEXIFOrientation(t, encodeTestJPEG(t, 100, 40), 6)
		rec := postMedia(t, router, "rotated.jpg", rotated)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
		var media mediaResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &media); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if media.Width != 40 || media.Height != 100 {
			t.Fatalf("expected 40x100 after rotation, got %dx%d", media.Width, media.Height)
		}
	})

	t.Run("downscales jpeg above the stored size cap", func(t *testing.T) {
		rec := postMedia(t, router, "wide.jpg", encodeTestJPEG(t, 3000, 1500))
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
		var media mediaResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &media); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if media.Width != maxStoredSide || media.Height != maxStoredSide/2 {
			t.Fatalf("expected %dx%d, got %dx%d", maxStoredSide, maxStoredSide/2, media.Width, media.Height)
		}
	})
}

func TestAdminMediaDeleteGuardsUsage(t *testing.T) {
	server, router := newMediaTestServer(t)
	ctx := t.Context()

	rec := postMedia(t, router, "cover.jpg", encodeTestJPEG(t, 64, 64))
	if rec.Code != stdhttp.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var media mediaResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &media); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}

	cover := media.URL
	post, err := sharedHTTPTestStore.CreateBlogPost(ctx, store.BlogPost{
		Slug:          fmt.Sprintf("media-usage-%d", time.Now().UnixNano()),
		Title:         "Media usage",
		ContentMD:     "# Body",
		CoverImageURL: &cover,
		Status:        "draft",
		Tags:          []string{},
		Locale:        "en",
	})
	if err != nil {
		t.Fatalf("create blog post: %v", err)
	}

	deletePath := fmt.Sprintf("/api/admin/media/%d", media.ID)

	t.Run("refuses deletion while referenced", func(t *testing.T) {
		req := httptest.NewRequest(stdhttp.MethodDelete, deletePath, nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusConflict {
			t.Fatalf("expected 409 while referenced, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("deletes after the reference is removed", func(t *testing.T) {
		if err := sharedHTTPTestStore.DeleteBlogPost(ctx, post.ID); err != nil {
			t.Fatalf("delete blog post: %v", err)
		}
		req := httptest.NewRequest(stdhttp.MethodDelete, deletePath, nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		if _, err := os.Stat(filepath.Join(server.cfg.MediaDir, media.FileName)); !os.IsNotExist(err) {
			t.Fatalf("expected file removed, stat err=%v", err)
		}
	})

	t.Run("public blog payload carries cover dimensions for media covers", func(t *testing.T) {
		uploadRec := postMedia(t, router, "dimensions.jpg", encodeTestJPEG(t, 96, 48))
		var cover mediaResponse
		if err := json.Unmarshal(uploadRec.Body.Bytes(), &cover); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}

		now := time.Now()
		coverURL := cover.URL
		slug := fmt.Sprintf("media-dimensions-%d", now.UnixNano())
		if _, err := sharedHTTPTestStore.CreateBlogPost(ctx, store.BlogPost{
			Slug:          slug,
			Title:         "Cover dimensions",
			ContentMD:     "# Body",
			CoverImageURL: &coverURL,
			IsPublished:   true,
			Status:        "published",
			PublishedAt:   &now,
			Tags:          []string{},
			Locale:        "en",
		}); err != nil {
			t.Fatalf("create blog post: %v", err)
		}

		publicRouter := gin.New()
		publicRouter.GET("/api/public/blog/:slug", server.handlePublicGetBlogPost)
		req := httptest.NewRequest(stdhttp.MethodGet, "/api/public/blog/"+slug+"?locale=en", nil)
		rec := httptest.NewRecorder()
		publicRouter.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var payload struct {
			CoverImageWidth  int `json:"cover_image_width"`
			CoverImageHeight int `json:"cover_image_height"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &payload); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if payload.CoverImageWidth != 96 || payload.CoverImageHeight != 48 {
			t.Fatalf("expected 96x48 cover dimensions, got %dx%d", payload.CoverImageWidth, payload.CoverImageHeight)
		}
	})

	t.Run("updates alt text", func(t *testing.T) {
		rec := postMedia(t, router, "alt.jpg", encodeTestJPEG(t, 32, 32))
		var m mediaResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &m); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		req := httptest.NewRequest(stdhttp.MethodPatch, fmt.Sprintf("/api/admin/media/%d", m.ID), bytes.NewBufferString(`{"alt_text":"recv dashboard screenshot"}`))
		req.Header.Set("Content-Type", "application/json")
		patchRec := httptest.NewRecorder()
		router.ServeHTTP(patchRec, req)
		if patchRec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", patchRec.Code, patchRec.Body.String())
		}
		var updated mediaResponse
		if err := json.Unmarshal(patchRec.Body.Bytes(), &updated); err != nil {
			t.Fatalf("unmarshal: %v", err)
		}
		if updated.AltText != "recv dashboard screenshot" {
			t.Fatalf("alt text not updated: %q", updated.AltText)
		}
	})
}
