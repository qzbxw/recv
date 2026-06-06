package main

import (
	"context"
	"errors"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"recv/backend/internal/config"
	httpapi "recv/backend/internal/http"
	"recv/backend/internal/metrics"
	"recv/backend/internal/service"
	"recv/backend/internal/store"
)

// @title           recv API
// @version         1.0
// @description     recv Payment API
// @host            localhost:8080
// @BasePath        /v1

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	if err := runAPI(ctx, realAPIDeps()); err != nil {
		log.Fatal(err)
	}
}

func realAPIDeps() apiDeps {
	return apiDeps{
		loadConfig: config.Load,
		openStore:  store.New,
		startMetrics: func(ctx context.Context, addr string, logger *slog.Logger) {
			metrics.StartServer(ctx, addr, logger)
		},
		listenAndServe: func(server *http.Server) error {
			return server.ListenAndServe()
		},
		shutdown: func(server *http.Server, ctx context.Context) error {
			return server.Shutdown(ctx)
		},
	}
}

type apiDeps struct {
	loadConfig     func() (config.Config, error)
	openStore      func(context.Context, string) (*store.Store, error)
	startMetrics   func(context.Context, string, *slog.Logger)
	listenAndServe func(*http.Server) error
	shutdown       func(*http.Server, context.Context) error
}

func runAPI(ctx context.Context, deps apiDeps) error {
	cfg, err := deps.loadConfig()
	if err != nil {
		return err
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	metrics.Init("api", cfg.AppEnv)
	st, err := deps.openStore(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	if st != nil {
		defer st.Close()
	}

	authService := service.NewAuthServiceWithTTL(st, cfg.JWTSecret, cfg.TelegramBotToken, cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	adminService := service.NewDBAdminService(st, cfg.AdminUsername, cfg.AdminPassword, cfg.AdminJWTSecret, cfg.AdminAccessTokenTTL, cfg.AdminRefreshTokenTTL, cfg.AdminBootstrapEmail, cfg.AdminBootstrapPassword, cfg.AppEnv)
	if created, err := adminService.Bootstrap(ctx); err != nil {
		return err
	} else if created {
		log.Printf("bootstrapped initial super_admin from ADMIN_BOOTSTRAP_EMAIL")
	}
	invoiceService := service.NewInvoiceService(st, cfg.TonUSDOverride)
	paymentService := service.NewPaymentService(st)

	engine := httpapi.NewServer(cfg, st, authService, adminService, invoiceService, paymentService)
	deps.startMetrics(ctx, ":"+cfg.MetricsPort, logger)
	server := &http.Server{
		Addr:              ":" + cfg.HTTPPort,
		Handler:           engine,
		ReadHeaderTimeout: 10 * time.Second,
	}

	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = deps.shutdown(server, shutdownCtx)
	}()

	log.Printf("recv api listening on :%s", cfg.HTTPPort)
	if err := deps.listenAndServe(server); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
