package http

import (
	"strings"
	"testing"

	"recv/backend/internal/store"
)

func TestValidateRedirectGraph(t *testing.T) {
	redirects := []store.SEORedirect{
		{ID: 1, SourcePath: "/en/old", TargetURL: "/en/new", IsActive: true},
	}
	valid := store.SEORedirect{ID: 2, SourcePath: "/en/legacy", TargetURL: "/en/old", IsActive: true}
	if err := validateRedirectGraph(redirects, valid); err != nil {
		t.Fatalf("valid redirect chain rejected: %v", err)
	}

	cycle := store.SEORedirect{ID: 2, SourcePath: "/en/new", TargetURL: "/en/old", IsActive: true}
	if err := validateRedirectGraph(redirects, cycle); err == nil {
		t.Fatal("expected redirect cycle to be rejected")
	}
}

func TestRedirectInputValidation(t *testing.T) {
	if _, err := normalizeRedirectSource("/api/private"); err == nil {
		t.Fatal("expected private source path to be rejected")
	}
	if _, err := normalizeRedirectTarget("http://example.com"); err == nil {
		t.Fatal("expected insecure external target to be rejected")
	}
	_, err := redirectFromInput(seoRedirectInput{
		SourcePath: "/en/same",
		TargetURL:  "/en/same",
		StatusCode: 301,
	}, "admin")
	if err == nil || !strings.Contains(err.Error(), "identical") {
		t.Fatalf("expected identical redirect error, got %v", err)
	}
}
