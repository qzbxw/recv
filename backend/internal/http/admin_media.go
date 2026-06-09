package http

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
	"golang.org/x/image/draw"
	"golang.org/x/image/webp"
)

const (
	// maxMediaUploadBytes caps the multipart body; large originals are
	// rejected before any decoding happens.
	maxMediaUploadBytes = 10 << 20 // 10 MiB
	// maxMediaPixels guards against decompression bombs: dimensions are
	// checked from the header before the full bitmap is decoded.
	maxMediaPixels = 40_000_000 // ~40 MP
	maxMediaSide   = 12_000
	// maxStoredSide is the longest side kept on disk; larger JPEG/PNG
	// uploads are downscaled, formats we cannot re-encode are rejected.
	maxStoredSide = 2400
)

var mediaFileNamePattern = regexp.MustCompile(`^[a-f0-9]{16}\.(jpg|png|webp|gif)$`)

var mediaExtensionByMime = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
	"image/webp": "webp",
	"image/gif":  "gif",
}

var mediaMimeByExtension = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
	".gif":  "image/gif",
}

type mediaResponse struct {
	store.Media
	URL string `json:"url"`
}

func mediaToResponse(m store.Media) mediaResponse {
	return mediaResponse{Media: m, URL: "/media/" + m.FileName}
}

func (s *Server) handleAdminUploadMedia(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxMediaUploadBytes+4096)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		status := http.StatusBadRequest
		var maxErr *http.MaxBytesError
		if errors.As(err, &maxErr) {
			status = http.StatusRequestEntityTooLarge
		}
		c.JSON(status, gin.H{"error": "file field is required and must not exceed 10 MiB"})
		return
	}
	if fileHeader.Size > maxMediaUploadBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file exceeds the 10 MiB upload limit"})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read uploaded file"})
		return
	}
	defer src.Close()

	raw, err := io.ReadAll(io.LimitReader(src, maxMediaUploadBytes+1))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read uploaded file"})
		return
	}
	if len(raw) > maxMediaUploadBytes {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "file exceeds the 10 MiB upload limit"})
		return
	}

	processed, err := processMediaUpload(raw, fileHeader.Filename)
	if err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"error": err.Error()})
		return
	}

	if err := os.MkdirAll(s.cfg.MediaDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "media storage is unavailable"})
		return
	}
	path := filepath.Join(s.cfg.MediaDir, processed.fileName)
	if err := os.WriteFile(path, processed.data, 0o644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to persist media file"})
		return
	}

	media, err := s.store.CreateMedia(c.Request.Context(), store.Media{
		FileName:     processed.fileName,
		OriginalName: filepath.Base(fileHeader.Filename),
		MimeType:     processed.mimeType,
		ByteSize:     int64(len(processed.data)),
		Width:        processed.width,
		Height:       processed.height,
		AltText:      strings.TrimSpace(c.PostForm("alt_text")),
		CreatedBy:    adminFromContext(c).Claims.Username,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to store media record"})
		return
	}

	c.JSON(http.StatusCreated, mediaToResponse(media))
}

func (s *Server) handleAdminListMedia(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "50"))

	items, total, err := s.store.ListMedia(c.Request.Context(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to list media"})
		return
	}

	responses := make([]mediaResponse, 0, len(items))
	for _, m := range items {
		responses = append(responses, mediaToResponse(m))
	}
	c.JSON(http.StatusOK, gin.H{"items": responses, "total": total, "page": page, "page_size": pageSize})
}

func (s *Server) handleAdminUpdateMediaAlt(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	var input struct {
		AltText string `json:"alt_text"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	media, err := s.store.UpdateMediaAlt(c.Request.Context(), id, strings.TrimSpace(input.AltText))
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update media"})
		return
	}
	c.JSON(http.StatusOK, mediaToResponse(media))
}

func (s *Server) handleAdminDeleteMedia(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid media id"})
		return
	}

	media, err := s.store.GetMediaByID(c.Request.Context(), id)
	if errors.Is(err, store.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "media not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load media"})
		return
	}

	references, err := s.store.CountMediaReferences(c.Request.Context(), "/media/"+media.FileName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check media usage"})
		return
	}
	if references > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("media is referenced by %d blog post(s)", references)})
		return
	}

	if err := s.store.DeleteMedia(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete media"})
		return
	}
	// Remove the file after the record so a failed DB delete never orphans
	// the row; a leftover file for a deleted row is harmless.
	_ = os.Remove(filepath.Join(s.cfg.MediaDir, media.FileName))
	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (s *Server) handlePublicMedia(c *gin.Context) {
	name := c.Param("file")
	if !mediaFileNamePattern.MatchString(name) {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	path := filepath.Join(s.cfg.MediaDir, name)
	info, err := os.Stat(path)
	if err != nil || info.IsDir() {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// File names are content hashes, so the body for a name can never change.
	c.Header("Cache-Control", "public, max-age=31536000, immutable")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Content-Type", mediaMimeByExtension[filepath.Ext(name)])
	c.File(path)
}

type processedMedia struct {
	data     []byte
	fileName string
	mimeType string
	width    int
	height   int
}

// processMediaUpload validates and normalizes an uploaded image: the MIME
// type is sniffed from content (never trusted from the request), the
// extension must agree with it, dimension limits are enforced before full
// decode, JPEG EXIF orientation is applied, and oversized JPEG/PNG bitmaps
// are downscaled. The stored name is derived from the final content hash.
func processMediaUpload(raw []byte, originalName string) (processedMedia, error) {
	sniffed := http.DetectContentType(raw)
	ext := strings.ToLower(filepath.Ext(originalName))
	expectedMime, knownExt := mediaMimeByExtension[ext]
	if !knownExt {
		return processedMedia{}, fmt.Errorf("unsupported file extension %q; allowed: jpg, jpeg, png, webp, gif", ext)
	}
	if sniffed != expectedMime {
		return processedMedia{}, fmt.Errorf("file content (%s) does not match its extension %q", sniffed, ext)
	}

	config, err := decodeMediaConfig(sniffed, raw)
	if err != nil {
		return processedMedia{}, fmt.Errorf("unable to read image dimensions: the file appears corrupt")
	}
	if config.Width <= 0 || config.Height <= 0 {
		return processedMedia{}, fmt.Errorf("image has invalid dimensions")
	}
	if config.Width > maxMediaSide || config.Height > maxMediaSide || config.Width*config.Height > maxMediaPixels {
		return processedMedia{}, fmt.Errorf("image dimensions %dx%d exceed the %d px / %d MP limit", config.Width, config.Height, maxMediaSide, maxMediaPixels/1_000_000)
	}

	data := raw
	width, height := config.Width, config.Height

	switch sniffed {
	case "image/jpeg", "image/png":
		img, _, err := image.Decode(bytes.NewReader(raw))
		if err != nil {
			return processedMedia{}, fmt.Errorf("unable to decode image: the file appears corrupt")
		}
		if sniffed == "image/jpeg" {
			img = applyEXIFOrientation(img, jpegOrientation(raw))
		}
		img = downscaleImage(img, maxStoredSide)

		var buf bytes.Buffer
		if sniffed == "image/jpeg" {
			err = jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85})
		} else {
			encoder := png.Encoder{CompressionLevel: png.BestCompression}
			err = encoder.Encode(&buf, img)
		}
		if err != nil {
			return processedMedia{}, fmt.Errorf("failed to encode optimized image")
		}
		data = buf.Bytes()
		bounds := img.Bounds()
		width, height = bounds.Dx(), bounds.Dy()
	default:
		// WebP and GIF (animations) cannot be re-encoded without extra
		// dependencies, so oversized files are rejected instead of resized.
		if config.Width > maxStoredSide || config.Height > maxStoredSide {
			return processedMedia{}, fmt.Errorf("%s images must not exceed %d px on the longest side", sniffed, maxStoredSide)
		}
	}

	hash := sha256.Sum256(data)
	return processedMedia{
		data:     data,
		fileName: hex.EncodeToString(hash[:8]) + "." + mediaExtensionByMime[sniffed],
		mimeType: sniffed,
		width:    width,
		height:   height,
	}, nil
}

func decodeMediaConfig(mime string, raw []byte) (image.Config, error) {
	switch mime {
	case "image/jpeg":
		return jpeg.DecodeConfig(bytes.NewReader(raw))
	case "image/png":
		return png.DecodeConfig(bytes.NewReader(raw))
	case "image/gif":
		return gif.DecodeConfig(bytes.NewReader(raw))
	case "image/webp":
		return webp.DecodeConfig(bytes.NewReader(raw))
	default:
		return image.Config{}, fmt.Errorf("unsupported mime type %q", mime)
	}
}

func downscaleImage(img image.Image, maxSide int) image.Image {
	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()
	if w <= maxSide && h <= maxSide {
		return img
	}

	scale := float64(maxSide) / float64(w)
	if h > w {
		scale = float64(maxSide) / float64(h)
	}
	dst := image.NewRGBA(image.Rect(0, 0, int(float64(w)*scale+0.5), int(float64(h)*scale+0.5)))
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)
	return dst
}

// jpegOrientation extracts the EXIF orientation tag (1-8) from a JPEG byte
// stream, returning 1 (upright) when absent or unparsable.
func jpegOrientation(data []byte) int {
	if len(data) < 4 || data[0] != 0xFF || data[1] != 0xD8 {
		return 1
	}
	offset := 2
	for offset+4 <= len(data) {
		if data[offset] != 0xFF {
			return 1
		}
		marker := data[offset+1]
		if marker == 0xD8 || (marker >= 0xD0 && marker <= 0xD7) {
			offset += 2
			continue
		}
		if marker == 0xDA { // start of scan: no EXIF past this point
			return 1
		}
		segmentLength := int(binary.BigEndian.Uint16(data[offset+2 : offset+4]))
		if segmentLength < 2 || offset+2+segmentLength > len(data) {
			return 1
		}
		if marker == 0xE1 {
			return exifOrientation(data[offset+4 : offset+2+segmentLength])
		}
		offset += 2 + segmentLength
	}
	return 1
}

func exifOrientation(segment []byte) int {
	if len(segment) < 14 || !bytes.HasPrefix(segment, []byte("Exif\x00\x00")) {
		return 1
	}
	tiff := segment[6:]

	var order binary.ByteOrder
	switch {
	case bytes.HasPrefix(tiff, []byte("II")):
		order = binary.LittleEndian
	case bytes.HasPrefix(tiff, []byte("MM")):
		order = binary.BigEndian
	default:
		return 1
	}

	if len(tiff) < 8 {
		return 1
	}
	ifdOffset := int(order.Uint32(tiff[4:8]))
	if ifdOffset < 0 || ifdOffset+2 > len(tiff) {
		return 1
	}
	entryCount := int(order.Uint16(tiff[ifdOffset : ifdOffset+2]))
	for i := 0; i < entryCount; i++ {
		entry := ifdOffset + 2 + i*12
		if entry+12 > len(tiff) {
			return 1
		}
		tag := order.Uint16(tiff[entry : entry+2])
		if tag != 0x0112 {
			continue
		}
		value := int(order.Uint16(tiff[entry+8 : entry+10]))
		if value >= 1 && value <= 8 {
			return value
		}
		return 1
	}
	return 1
}

func applyEXIFOrientation(img image.Image, orientation int) image.Image {
	if orientation <= 1 || orientation > 8 {
		return img
	}

	bounds := img.Bounds()
	w, h := bounds.Dx(), bounds.Dy()

	swapped := orientation >= 5 // 90/270-degree rotations swap dimensions
	dstW, dstH := w, h
	if swapped {
		dstW, dstH = h, w
	}

	dst := image.NewRGBA(image.Rect(0, 0, dstW, dstH))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			var dx, dy int
			switch orientation {
			case 2: // mirror horizontal
				dx, dy = w-1-x, y
			case 3: // rotate 180
				dx, dy = w-1-x, h-1-y
			case 4: // mirror vertical
				dx, dy = x, h-1-y
			case 5: // mirror horizontal + rotate 270 CW
				dx, dy = y, x
			case 6: // rotate 90 CW
				dx, dy = h-1-y, x
			case 7: // mirror horizontal + rotate 90 CW
				dx, dy = h-1-y, w-1-x
			case 8: // rotate 270 CW
				dx, dy = y, w-1-x
			}
			dst.Set(dx, dy, img.At(bounds.Min.X+x, bounds.Min.Y+y))
		}
	}
	return dst
}
