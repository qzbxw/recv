package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"testing"

	"recv/backend/internal/config"
	"recv/backend/internal/store"
)

func TestRunAPISuccessAndServerClosed(t *testing.T) {
	startedMetrics := false
	listened := false
	err := runAPI(context.Background(), apiDeps{
		loadConfig: func() (config.Config, error) {
			return config.Config{HTTPPort: "18080", MetricsPort: "19090", AdminJWTSecret: "admin-secret", JWTSecret: "jwt-secret"}, nil
		},
		openStore: func(context.Context, string) (*store.Store, error) {
			return nil, nil
		},
		startMetrics: func(context.Context, string, *slog.Logger) {
			startedMetrics = true
		},
		listenAndServe: func(server *http.Server) error {
			listened = true
			if server.Addr != ":18080" || server.Handler == nil {
				t.Fatalf("unexpected server: addr=%q handler=%v", server.Addr, server.Handler)
			}
			return http.ErrServerClosed
		},
		shutdown: func(*http.Server, context.Context) error {
			return nil
		},
	})
	if err != nil {
		t.Fatalf("runAPI returned error: %v", err)
	}
	if !startedMetrics || !listened {
		t.Fatalf("expected metrics and listener to start, metrics=%v listened=%v", startedMetrics, listened)
	}
}

func TestRealAPIDepsAreConfigured(t *testing.T) {
	deps := realAPIDeps()
	if deps.loadConfig == nil || deps.openStore == nil || deps.startMetrics == nil || deps.listenAndServe == nil || deps.shutdown == nil {
		t.Fatalf("expected all real API deps to be configured: %+v", deps)
	}
}

func TestRunAPIReturnsDependencyErrors(t *testing.T) {
	loadErr := errors.New("load failed")
	if err := runAPI(context.Background(), apiDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, loadErr },
	}); !errors.Is(err, loadErr) {
		t.Fatalf("expected load error, got %v", err)
	}

	storeErr := errors.New("store failed")
	if err := runAPI(context.Background(), apiDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, nil },
		openStore:  func(context.Context, string) (*store.Store, error) { return nil, storeErr },
	}); !errors.Is(err, storeErr) {
		t.Fatalf("expected store error, got %v", err)
	}

	listenErr := errors.New("listen failed")
	if err := runAPI(context.Background(), apiDeps{
		loadConfig: func() (config.Config, error) { return config.Config{HTTPPort: "18080", MetricsPort: "19090"}, nil },
		openStore:  func(context.Context, string) (*store.Store, error) { return nil, nil },
		startMetrics: func(context.Context, string, *slog.Logger) {
		},
		listenAndServe: func(*http.Server) error { return listenErr },
		shutdown:       func(*http.Server, context.Context) error { return nil },
	}); !errors.Is(err, listenErr) {
		t.Fatalf("expected listen error, got %v", err)
	}
}
