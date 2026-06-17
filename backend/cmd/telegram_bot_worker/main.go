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
	"recv/backend/internal/telegram"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := runTelegramBotWorker(ctx, realBotWorkerDeps()); err != nil {
		log.Fatal(err)
	}
}

func realBotWorkerDeps() botWorkerDeps {
	return botWorkerDeps{
		loadConfig: config.Load,
		openStore:  store.New,
		startMetrics: func(ctx context.Context, addr string, logger *slog.Logger) {
			metrics.StartServer(ctx, addr, logger)
		},
		runWorker: func(worker *telegram.BotWorker, ctx context.Context) error {
			return worker.Run(ctx)
		},
	}
}

type botWorkerDeps struct {
	loadConfig   func() (config.Config, error)
	openStore    func(context.Context, string) (*store.Store, error)
	startMetrics func(context.Context, string, *slog.Logger)
	runWorker    func(*telegram.BotWorker, context.Context) error
}

func runTelegramBotWorker(ctx context.Context, deps botWorkerDeps) error {
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
	metrics.Init("bot", cfg.AppEnv)
	invoiceService := service.NewInvoiceService(st, cfg.GramUSDOverride)
	deps.startMetrics(ctx, ":"+cfg.MetricsPort, logger)
	worker := telegram.NewBotWorker(st, invoiceService, cfg.TelegramBotToken, cfg.PublicAppURL, logger)
	if err := deps.runWorker(worker, ctx); err != nil && !errors.Is(err, context.Canceled) {
		return err
	}
	return nil
}
