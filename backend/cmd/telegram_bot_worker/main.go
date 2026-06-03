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
	"recv/backend/internal/telegram"
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
	metrics.Init("bot", cfg.AppEnv)
	invoiceService := service.NewInvoiceService(st, cfg.TonUSDOverride)
	metrics.StartServer(ctx, ":"+cfg.MetricsPort, logger)
	worker := telegram.NewBotWorker(st, invoiceService, cfg.TelegramBotToken, cfg.PublicAppURL, logger)
	if err := worker.Run(ctx); err != nil && err != context.Canceled {
		log.Fatal(err)
	}
}
