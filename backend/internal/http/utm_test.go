package http

import (
	"testing"
)

func TestNormalizeUTMVisit(t *testing.T) {
	visit, err := normalizeUTMVisit(utmVisitInput{
		AttributionID: " visitor-1 ",
		Source:        " tg_channel_durov ",
		Medium:        "cpc",
		Campaign:      "june-launch",
		LandingPath:   "/ru/pricing?utm_source=tg_channel_durov",
		Referrer:      "https://t.me/durov",
	})
	if err != nil {
		t.Fatalf("normalizeUTMVisit returned error: %v", err)
	}
	if visit.AttributionID != "visitor-1" || visit.Source != "tg_channel_durov" || visit.Campaign != "june-launch" {
		t.Fatalf("unexpected normalized visit: %+v", visit)
	}
	if visit.TouchType != "last" {
		t.Fatalf("expected touch_type last, got %q", visit.TouchType)
	}
}

func TestNormalizeUTMVisitRejectsInvalidPayloads(t *testing.T) {
	tests := []utmVisitInput{
		{Source: "   "},
		{Source: "tg", LandingPath: "https://evil.example/path"},
		{Source: "tg", LandingPath: "no-leading-slash"},
	}
	for _, input := range tests {
		if _, err := normalizeUTMVisit(input); err == nil {
			t.Fatalf("expected invalid payload to fail: %+v", input)
		}
	}
}
