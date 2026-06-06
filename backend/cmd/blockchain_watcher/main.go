package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"recv/backend/internal/config"
	"recv/backend/internal/metrics"
	"recv/backend/internal/service"
	"recv/backend/internal/store"
	"recv/backend/internal/watcher"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := runBlockchainWatcher(ctx, realWatcherDeps()); err != nil {
		log.Fatal(err)
	}
}

func realWatcherDeps() watcherDeps {
	return watcherDeps{
		loadConfig: config.Load,
		openStore:  store.New,
		startMetrics: func(ctx context.Context, addr string, logger *slog.Logger) {
			metrics.StartServer(ctx, addr, logger)
		},
		runWatcher: func(w *watcher.Watcher, ctx context.Context) error {
			return w.Run(ctx)
		},
	}
}

type watcherDeps struct {
	loadConfig   func() (config.Config, error)
	openStore    func(context.Context, string) (*store.Store, error)
	startMetrics func(context.Context, string, *slog.Logger)
	runWatcher   func(*watcher.Watcher, context.Context) error
}

func runBlockchainWatcher(ctx context.Context, deps watcherDeps) error {
	cfg, err := deps.loadConfig()
	if err != nil {
		return err
	}

	st, err := deps.openStore(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	if st != nil {
		defer st.Close()
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	metrics.Init("watcher", cfg.AppEnv)
	paymentService := service.NewPaymentService(st)
	deps.startMetrics(ctx, ":"+cfg.MetricsPort, logger)
	w := watcher.New(st, paymentService, cfg, logger)
	if err := deps.runWatcher(w, ctx); err != nil && !errors.Is(err, context.Canceled) {
		return err
	}
	return nil
}
