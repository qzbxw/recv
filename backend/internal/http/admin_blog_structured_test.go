package http

import (
	"encoding/json"
	"strings"
	"testing"
)

func doc(nodes ...string) json.RawMessage {
	return json.RawMessage(`{"type":"doc","content":[` + strings.Join(nodes, ",") + `]}`)
}

func TestValidateStructuredContentSanitization(t *testing.T) {
	cases := []struct {
		name            string
		content         json.RawMessage
		requireImageAlt bool
		wantErr         string
	}{
		{
			name:    "accepts a typical article",
			content: doc(`{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Setup"}]}`, `{"type":"paragraph","content":[{"type":"text","text":"Body","marks":[{"type":"bold"}]}]}`),
		},
		{
			name:    "rejects unknown node types",
			content: doc(`{"type":"iframe","attrs":{"src":"https://evil.example"}}`),
			wantErr: "unsupported node type",
		},
		{
			name:    "rejects unknown marks",
			content: doc(`{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"fontColor"}]}]}`),
			wantErr: "unsupported mark type",
		},
		{
			name:    "rejects javascript links",
			content: doc(`{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}`),
			wantErr: "links must be internal paths",
		},
		{
			name:    "rejects data: links",
			content: doc(`{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"data:text/html;base64,xx"}}]}]}`),
			wantErr: "links must be internal paths",
		},
		{
			name:    "rejects protocol-relative links",
			content: doc(`{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"//evil.example/x"}}]}]}`),
			wantErr: "links must be internal paths",
		},
		{
			name:    "accepts internal and https links",
			content: doc(`{"type":"paragraph","content":[{"type":"text","text":"a","marks":[{"type":"link","attrs":{"href":"/en/docs/webhooks"}}]},{"type":"text","text":"b","marks":[{"type":"link","attrs":{"href":"https://example.com"}}]}]}`),
		},
		{
			name:    "rejects images outside media library or https",
			content: doc(`{"type":"image","attrs":{"src":"data:image/svg+xml;base64,xx","alt":"x"}}`),
			wantErr: "media library",
		},
		{
			name:            "requires image alt at publish time",
			content:         doc(`{"type":"image","attrs":{"src":"/media/0011223344556677.jpg","alt":"  "}}`),
			requireImageAlt: true,
			wantErr:         "alt text before publishing",
		},
		{
			name:    "allows missing image alt in drafts",
			content: doc(`{"type":"image","attrs":{"src":"/media/0011223344556677.jpg"}}`),
		},
		{
			name:    "rejects non-embed video URLs",
			content: doc(`{"type":"youtube","attrs":{"src":"https://evil.example/embed/xss"}}`),
			wantErr: "YouTube embed URL",
		},
		{
			name:    "accepts nocookie embeds",
			content: doc(`{"type":"youtube","attrs":{"src":"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"}}`),
		},
		{
			name:    "rejects unknown callout variants",
			content: doc(`{"type":"callout","attrs":{"variant":"danger"},"content":[{"type":"paragraph"}]}`),
			wantErr: "callout variant",
		},
		{
			name:    "rejects unknown CTA services",
			content: doc(`{"type":"ctaBlock","attrs":{"service":"casino"}}`),
			wantErr: "CTA service",
		},
		{
			name:    "accepts FAQ blocks",
			content: doc(`{"type":"faqList","content":[{"type":"faqItem","content":[{"type":"faqQuestion","content":[{"type":"text","text":"Q"}]},{"type":"faqAnswer","content":[{"type":"paragraph","content":[{"type":"text","text":"A"}]}]}]}]}`),
		},
		{
			name:    "rejects non-doc root",
			content: json.RawMessage(`{"type":"paragraph"}`),
			wantErr: "root node must be a doc",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := validateStructuredContent(tc.content, tc.requireImageAlt)
			if tc.wantErr == "" {
				if err != nil {
					t.Fatalf("expected valid, got: %v", err)
				}
				return
			}
			if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
				t.Fatalf("expected error containing %q, got: %v", tc.wantErr, err)
			}
		})
	}
}

func TestValidateBlogPostInputStructuredIntegration(t *testing.T) {
	base := createBlogPostInput{
		Slug:            "structured",
		Title:           "Structured",
		H1:              stringPointer("Structured heading"),
		MetaDescription: stringPointer(strings.Repeat("a", 130)),
	}

	t.Run("draft with unsafe link is rejected", func(t *testing.T) {
		input := base
		input.ContentJSON = doc(`{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"link","attrs":{"href":"javascript:alert(1)"}}]}]}`)
		if err := validateBlogPostInput(input, "draft"); err == nil {
			t.Fatal("expected draft sanitization error")
		}
	})

	t.Run("publish enforces heading hierarchy in structured content", func(t *testing.T) {
		input := base
		input.ContentJSON = doc(`{"type":"heading","attrs":{"level":3},"content":[{"type":"text","text":"Skipped"}]}`)
		if err := validateBlogPostInput(input, "published"); err == nil || !strings.Contains(err.Error(), "skips a level") {
			t.Fatalf("expected heading hierarchy error, got: %v", err)
		}
	})

	t.Run("publish accepts clean structured content", func(t *testing.T) {
		input := base
		input.ContentJSON = doc(`{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Section"}]}`, `{"type":"paragraph","content":[{"type":"text","text":"Body"}]}`)
		if err := validateBlogPostInput(input, "published"); err != nil {
			t.Fatalf("expected valid, got: %v", err)
		}
	})
}
