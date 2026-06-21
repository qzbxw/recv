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

func TestNormalizeUTMEvent(t *testing.T) {
	event, err := normalizeUTMEvent(utmEventInput{
		AttributionID: " visitor-1 ",
		EventName:     " docs_open ",
		Source:        " tg ",
		Path:          "/ru/docs/quickstart?utm_source=tg",
		Title:         " Quickstart ",
	})
	if err != nil {
		t.Fatalf("normalizeUTMEvent returned error: %v", err)
	}
	if event.AttributionID != "visitor-1" || event.EventName != "docs_open" || event.Path != "/ru/docs/quickstart?utm_source=tg" || event.Title != "Quickstart" {
		t.Fatalf("unexpected normalized event: %+v", event)
	}
}

func TestNormalizeUTMEventRejectsInvalidPayloads(t *testing.T) {
	tests := []utmEventInput{
		{EventName: " ", Path: "/ru"},
		{EventName: "page_view", Path: " "},
		{EventName: "page_view", Path: "https://evil.example/path"},
		{EventName: "page_view", Path: "no-leading-slash"},
	}
	for _, input := range tests {
		if _, err := normalizeUTMEvent(input); err == nil {
			t.Fatalf("expected invalid payload to fail: %+v", input)
		}
	}
}
