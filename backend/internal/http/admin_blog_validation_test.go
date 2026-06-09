package http

import (
	"encoding/json"
	"strings"
	"testing"
)

func stringPointer(value string) *string {
	return &value
}

func TestValidateBlogPostInputForPublish(t *testing.T) {
	valid := createBlogPostInput{
		Slug:            "webhook-verification",
		Title:           "Webhook verification",
		H1:              stringPointer("How to verify payment webhooks"),
		ContentMD:       "## Verification\n\nValidate the signature.\n\n### Replay protection\n\nStore event IDs.",
		MetaDescription: stringPointer(strings.Repeat("a", 130)),
	}

	if err := validateBlogPostInput(valid, "published"); err != nil {
		t.Fatalf("valid published post rejected: %v", err)
	}

	tests := []struct {
		name  string
		input createBlogPostInput
		want  string
	}{
		{
			name: "missing h1",
			input: func() createBlogPostInput {
				value := valid
				value.H1 = nil
				return value
			}(),
			want: "h1 is required",
		},
		{
			name: "markdown h1",
			input: func() createBlogPostInput {
				value := valid
				value.ContentMD = "# Duplicate H1"
				return value
			}(),
			want: "must not contain an H1",
		},
		{
			name: "heading skip",
			input: func() createBlogPostInput {
				value := valid
				value.ContentMD = "### Starts too deep"
				return value
			}(),
			want: "skips a level",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateBlogPostInput(test.input, "published")
			if err == nil || !strings.Contains(err.Error(), test.want) {
				t.Fatalf("expected %q error, got %v", test.want, err)
			}
		})
	}
}

func TestValidateStructuredHeadings(t *testing.T) {
	valid := json.RawMessage(`{"type":"doc","content":[{"type":"heading","attrs":{"level":2}},{"type":"heading","attrs":{"level":3}}]}`)
	if err := validateStructuredHeadings(valid); err != nil {
		t.Fatalf("valid structured headings rejected: %v", err)
	}

	invalid := json.RawMessage(`{"type":"doc","content":[{"type":"heading","attrs":{"level":1}}]}`)
	if err := validateStructuredHeadings(invalid); err == nil {
		t.Fatal("expected H1 in structured content to be rejected")
	}
}
