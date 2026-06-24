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

	_ "recv/backend/docs"
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
		// Automatically seed billing wallets in development or test environment to simplify local testing
		if cfg.AppEnv == "development" || cfg.AppEnv == "dev" || cfg.AppEnv == "test" {
			log.Printf("Development/test environment detected. Seeding default billing wallets...")
			wallets := map[string]string{
				"TON":    "EQD4P3aV1QQplUsw2zPst-j9Yd_0-N_2-N_2-N_2-N_2-N_2",
				"TRON":   "TYDtwHZzpP2fC5L9wX6wYcQ4eU9D1D1D1D",
				"SOLANA": "Solana11111111111111111111111111111111111111",
				"EVM":    "0x0000000000000000000000000000000000000000",
			}
			if err := st.UpsertSystemConfig(ctx, "billing_wallets", wallets, false, "bootstrap-dev"); err != nil {
				log.Printf("Warning: Failed to seed billing wallets: %v", err)
			} else {
				log.Printf("Successfully seeded default billing wallets for TON, TRON, Solana, and EVM.")
			}
		}
	}

	authService := service.NewAuthServiceWithTTL(st, cfg.JWTSecret, cfg.TelegramBotToken, cfg.AllowInsecureDevAuth, cfg.TelegramInitMaxAge, cfg.AccessTokenTTL, cfg.RefreshTokenTTL)
	authService.SetOAuthOptions(service.OAuthOptions{
		RedirectBaseURL: cfg.OAuthRedirectBaseURL,
		FrontendBaseURL: cfg.PublicAppURL,
		Google: service.OAuthProviderConfig{
			ClientID:     cfg.GoogleOAuthClientID,
			ClientSecret: cfg.GoogleOAuthSecret,
		},
		GitHub: service.OAuthProviderConfig{
			ClientID:     cfg.GitHubOAuthClientID,
			ClientSecret: cfg.GitHubOAuthSecret,
		},
	})
	adminService := service.NewDBAdminService(st, cfg.AdminUsername, cfg.AdminPassword, cfg.AdminJWTSecret, cfg.AdminAccessTokenTTL, cfg.AdminRefreshTokenTTL, cfg.AdminBootstrapEmail, cfg.AdminBootstrapPassword, cfg.AppEnv)
	if created, err := adminService.Bootstrap(ctx); err != nil {
		return err
	} else if created {
		log.Printf("bootstrapped initial super_admin from ADMIN_BOOTSTRAP_EMAIL")
	}
	invoiceService := service.NewInvoiceService(st, cfg.GramUSDOverride)
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
		shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
		defer cancel()
		_ = deps.shutdown(server, shutdownCtx)
	}()

	log.Printf("recv api listening on :%s", cfg.HTTPPort)
	if err := deps.listenAndServe(server); err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
