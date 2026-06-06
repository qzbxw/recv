package main

import (
	"context"
	"errors"
	"log/slog"
	"testing"

	"recv/backend/internal/config"
	"recv/backend/internal/store"
	"recv/backend/internal/watcher"
)

func TestRunBlockchainWatcherSuccessAndCanceled(t *testing.T) {
	startedMetrics := false
	ran := false
	err := runBlockchainWatcher(context.Background(), watcherDeps{
		loadConfig: func() (config.Config, error) {
			return config.Config{MetricsPort: "19091"}, nil
		},
		openStore: func(context.Context, string) (*store.Store, error) {
			return nil, nil
		},
		startMetrics: func(context.Context, string, *slog.Logger) {
			startedMetrics = true
		},
		runWatcher: func(w *watcher.Watcher, ctx context.Context) error {
			ran = w != nil && ctx != nil
			return context.Canceled
		},
	})
	if err != nil {
		t.Fatalf("runBlockchainWatcher returned error: %v", err)
	}
	if !startedMetrics || !ran {
		t.Fatalf("expected metrics and watcher run, metrics=%v ran=%v", startedMetrics, ran)
	}
}

func TestRealWatcherDepsAreConfigured(t *testing.T) {
	deps := realWatcherDeps()
	if deps.loadConfig == nil || deps.openStore == nil || deps.startMetrics == nil || deps.runWatcher == nil {
		t.Fatalf("expected all real watcher deps to be configured: %+v", deps)
	}
}

func TestRunBlockchainWatcherReturnsDependencyErrors(t *testing.T) {
	loadErr := errors.New("load failed")
	if err := runBlockchainWatcher(context.Background(), watcherDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, loadErr },
	}); !errors.Is(err, loadErr) {
		t.Fatalf("expected load error, got %v", err)
	}

	storeErr := errors.New("store failed")
	if err := runBlockchainWatcher(context.Background(), watcherDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, nil },
		openStore:  func(context.Context, string) (*store.Store, error) { return nil, storeErr },
	}); !errors.Is(err, storeErr) {
		t.Fatalf("expected store error, got %v", err)
	}

	runErr := errors.New("watcher failed")
	if err := runBlockchainWatcher(context.Background(), watcherDeps{
		loadConfig:   func() (config.Config, error) { return config.Config{}, nil },
		openStore:    func(context.Context, string) (*store.Store, error) { return nil, nil },
		startMetrics: func(context.Context, string, *slog.Logger) {},
		runWatcher:   func(*watcher.Watcher, context.Context) error { return runErr },
	}); !errors.Is(err, runErr) {
		t.Fatalf("expected watcher error, got %v", err)
	}
}
