package http

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// Whitelists for TipTap structured content (content_version 2). Anything
// outside these sets is rejected so the public renderer never sees node
// types it does not know how to handle safely.
var structuredNodeTypes = map[string]bool{
	"doc":            true,
	"paragraph":      true,
	"text":           true,
	"heading":        true,
	"bulletList":     true,
	"orderedList":    true,
	"listItem":       true,
	"blockquote":     true,
	"codeBlock":      true,
	"hardBreak":      true,
	"horizontalRule": true,
	"image":          true,
	"youtube":        true,
	"table":          true,
	"tableRow":       true,
	"tableCell":      true,
	"tableHeader":    true,
	"callout":        true,
	"faqList":        true,
	"faqItem":        true,
	"faqQuestion":    true,
	"faqAnswer":      true,
	"ctaBlock":       true,
}

var structuredMarkTypes = map[string]bool{
	"bold":      true,
	"italic":    true,
	"strike":    true,
	"underline": true,
	"code":      true,
	"link":      true,
}

var structuredCalloutVariants = map[string]bool{"info": true, "warning": true, "tip": true}

var structuredCtaServices = map[string]bool{"checkout": true, "api": true, "invoicing": true, "mcp": true}

var youtubeEmbedPattern = regexp.MustCompile(`^https://(www\.)?(youtube\.com|youtube-nocookie\.com)/embed/[A-Za-z0-9_-]+`)

type structuredNode struct {
	Type    string           `json:"type"`
	Attrs   map[string]any   `json:"attrs"`
	Content []structuredNode `json:"content"`
	Marks   []structuredMark `json:"marks"`
	Text    string           `json:"text"`
}

type structuredMark struct {
	Type  string         `json:"type"`
	Attrs map[string]any `json:"attrs"`
}

// validateStructuredContent sanitizes a structured document: node and mark
// whitelists, safe link protocols, image sources, and YouTube embeds.
// requireImageAlt is enforced at publish time only, so drafts can be saved
// while the alt text is still being written.
func validateStructuredContent(content json.RawMessage, requireImageAlt bool) error {
	var root structuredNode
	if err := json.Unmarshal(content, &root); err != nil {
		return fmt.Errorf("content_json must be a structured document object")
	}
	if root.Type != "doc" {
		return fmt.Errorf("content_json root node must be a doc")
	}

	var walk func(node structuredNode) error
	walk = func(node structuredNode) error {
		if !structuredNodeTypes[node.Type] {
			return fmt.Errorf("structured content contains unsupported node type %q", node.Type)
		}

		for _, mark := range node.Marks {
			if !structuredMarkTypes[mark.Type] {
				return fmt.Errorf("structured content contains unsupported mark type %q", mark.Type)
			}
			if mark.Type == "link" {
				href, _ := mark.Attrs["href"].(string)
				if err := validateStructuredLink(href); err != nil {
					return err
				}
			}
		}

		switch node.Type {
		case "image":
			src, _ := node.Attrs["src"].(string)
			if err := validateStructuredImageSrc(src); err != nil {
				return err
			}
			if requireImageAlt {
				alt, _ := node.Attrs["alt"].(string)
				if strings.TrimSpace(alt) == "" {
					return fmt.Errorf("every content image needs alt text before publishing")
				}
			}
		case "youtube":
			src, _ := node.Attrs["src"].(string)
			if !youtubeEmbedPattern.MatchString(src) {
				return fmt.Errorf("video embeds must use a YouTube embed URL")
			}
		case "callout":
			variant, _ := node.Attrs["variant"].(string)
			if variant != "" && !structuredCalloutVariants[variant] {
				return fmt.Errorf("unsupported callout variant %q", variant)
			}
		case "ctaBlock":
			service, _ := node.Attrs["service"].(string)
			if !structuredCtaServices[service] {
				return fmt.Errorf("unsupported CTA service %q", service)
			}
		}

		for _, child := range node.Content {
			if err := walk(child); err != nil {
				return err
			}
		}
		return nil
	}
	return walk(root)
}

func validateStructuredLink(href string) error {
	trimmed := strings.TrimSpace(href)
	if trimmed == "" {
		return fmt.Errorf("links must not be empty")
	}
	lower := strings.ToLower(trimmed)
	switch {
	case strings.HasPrefix(lower, "https://"),
		strings.HasPrefix(lower, "http://"),
		strings.HasPrefix(lower, "mailto:"):
		return nil
	case strings.HasPrefix(trimmed, "/") && !strings.HasPrefix(trimmed, "//"):
		return nil
	default:
		return fmt.Errorf("links must be internal paths, http(s) or mailto URLs")
	}
}

func validateStructuredImageSrc(src string) error {
	trimmed := strings.TrimSpace(src)
	if trimmed == "" {
		return fmt.Errorf("content images must have a src")
	}
	lower := strings.ToLower(trimmed)
	switch {
	case strings.HasPrefix(trimmed, "/media/"):
		return nil
	case strings.HasPrefix(lower, "https://"):
		return nil
	default:
		return fmt.Errorf("content images must come from the media library (/media/…) or an https URL")
	}
}
