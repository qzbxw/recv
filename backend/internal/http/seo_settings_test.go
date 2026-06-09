package http

import "testing"

func TestValidateRobotsContent(t *testing.T) {
	if err := validateRobotsContent(defaultRobotsContent()); err != nil {
		t.Fatalf("default robots.txt rejected: %v", err)
	}

	invalid := []string{
		"User-agent: *\nDisallow: /\n" + canonicalSitemapDirective,
		"User-agent: *\nDisallow: /_next/\n" + canonicalSitemapDirective,
		"User-agent: *\nAllow: /\n",
	}
	for _, content := range invalid {
		if err := validateRobotsContent(content); err == nil {
			t.Fatalf("expected invalid robots.txt to be rejected: %q", content)
		}
	}
}
