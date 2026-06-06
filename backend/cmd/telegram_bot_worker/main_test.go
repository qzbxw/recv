package main

import (
	"context"
	"errors"
	"log/slog"
	"testing"

	"recv/backend/internal/config"
	"recv/backend/internal/store"
	"recv/backend/internal/telegram"
)

func TestRunTelegramBotWorkerSuccessAndCanceled(t *testing.T) {
	startedMetrics := false
	ran := false
	err := runTelegramBotWorker(context.Background(), botWorkerDeps{
		loadConfig: func() (config.Config, error) {
			return config.Config{MetricsPort: "19092", PublicAppURL: "https://recv.test/app"}, nil
		},
		openStore: func(context.Context, string) (*store.Store, error) {
			return nil, nil
		},
		startMetrics: func(context.Context, string, *slog.Logger) {
			startedMetrics = true
		},
		runWorker: func(worker *telegram.BotWorker, ctx context.Context) error {
			ran = worker != nil && ctx != nil
			return context.Canceled
		},
	})
	if err != nil {
		t.Fatalf("runTelegramBotWorker returned error: %v", err)
	}
	if !startedMetrics || !ran {
		t.Fatalf("expected metrics and worker run, metrics=%v ran=%v", startedMetrics, ran)
	}
}

func TestRealBotWorkerDepsAreConfigured(t *testing.T) {
	deps := realBotWorkerDeps()
	if deps.loadConfig == nil || deps.openStore == nil || deps.startMetrics == nil || deps.runWorker == nil {
		t.Fatalf("expected all real bot worker deps to be configured: %+v", deps)
	}
}

func TestRunTelegramBotWorkerReturnsDependencyErrors(t *testing.T) {
	loadErr := errors.New("load failed")
	if err := runTelegramBotWorker(context.Background(), botWorkerDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, loadErr },
	}); !errors.Is(err, loadErr) {
		t.Fatalf("expected load error, got %v", err)
	}

	storeErr := errors.New("store failed")
	if err := runTelegramBotWorker(context.Background(), botWorkerDeps{
		loadConfig: func() (config.Config, error) { return config.Config{}, nil },
		openStore:  func(context.Context, string) (*store.Store, error) { return nil, storeErr },
	}); !errors.Is(err, storeErr) {
		t.Fatalf("expected store error, got %v", err)
	}

	runErr := errors.New("worker failed")
	if err := runTelegramBotWorker(context.Background(), botWorkerDeps{
		loadConfig:   func() (config.Config, error) { return config.Config{}, nil },
		openStore:    func(context.Context, string) (*store.Store, error) { return nil, nil },
		startMetrics: func(context.Context, string, *slog.Logger) {},
		runWorker:    func(*telegram.BotWorker, context.Context) error { return runErr },
	}); !errors.Is(err, runErr) {
		t.Fatalf("expected worker error, got %v", err)
	}
}
