package http

import (
	"math"
	"testing"
)

func TestNormalizeWebVital(t *testing.T) {
	vital, err := normalizeWebVital(webVitalInput{
		Name:           "lcp",
		Value:          2499.5,
		Path:           "/en/products/checkout",
		Locale:         "en",
		NavigationType: "reload",
	})
	if err != nil {
		t.Fatalf("normalizeWebVital returned error: %v", err)
	}
	if vital.MetricName != "LCP" || vital.Path != "/en/products/checkout" || vital.NavigationType != "reload" {
		t.Fatalf("unexpected normalized vital: %+v", vital)
	}
}

func TestNormalizeWebVitalRejectsInvalidPayloads(t *testing.T) {
	tests := []webVitalInput{
		{Name: "FID", Value: 10, Path: "/en", Locale: "en"},
		{Name: "LCP", Value: -1, Path: "/en", Locale: "en"},
		{Name: "CLS", Value: math.NaN(), Path: "/en", Locale: "en"},
		{Name: "CLS", Value: 0.1, Path: "https://recv.money/en", Locale: "en"},
		{Name: "INP", Value: 150, Path: "/en?utm_source=test", Locale: "en"},
		{Name: "INP", Value: 150, Path: "/en", Locale: "de"},
	}
	for _, input := range tests {
		if _, err := normalizeWebVital(input); err == nil {
			t.Fatalf("expected invalid payload to fail: %+v", input)
		}
	}
}
