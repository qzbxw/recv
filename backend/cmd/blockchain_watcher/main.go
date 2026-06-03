package main

import (
	"context"
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

	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	st, err := store.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer st.Close()

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	metrics.Init("watcher", cfg.AppEnv)
	paymentService := service.NewPaymentService(st)
	metrics.StartServer(ctx, ":"+cfg.MetricsPort, logger)
	w := watcher.New(st, paymentService, cfg, logger)
	if err := w.Run(ctx); err != nil && err != context.Canceled {
		log.Fatal(err)
	}
}
