package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	AppEnv                 string
	AppRuntime             string
	HTTPPort               string
	MetricsPort            string
	DatabaseURL            string
	JWTSecret              string
	InternalToken          string
	TelegramBotToken       string
	TelegramInitMaxAge     time.Duration
	AllowInsecureDevAuth   bool
	AllowedOrigins         string
	PublicAppURL           string
	WatcherPollInterval    time.Duration
	WatcherGraceWindow     time.Duration
	WatcherBackfillBlocks  int64
	EVMConfirmationDepth   int64
	TronGridBaseURL        string
	TronGridAPIKey         string
	TonCenterBaseURL       string
	TonCenterAPIKey        string
	TonUSDTMasterAddress   string
	TonUSDOverride         string
	SolanaRPCURL           string
	EthereumRPCURL         string
	BaseRPCURL             string
	ArbitrumRPCURL         string
	BSCRPCURL              string
	AdminUsername          string
	AdminPassword          string
	AdminBootstrapEmail    string
	AdminBootstrapPassword string
	AdminJWTSecret         string
	AccessTokenTTL         time.Duration
	RefreshTokenTTL        time.Duration
	AdminAccessTokenTTL    time.Duration
	AdminRefreshTokenTTL   time.Duration
	PostHogKey             string
	PostHogHost            string
	SentryDSNBackend       string
}

func Load() (Config, error) {
	cfg := Config{
		AppEnv:                 envOrDefault("APP_ENV", "development"),
		AppRuntime:             envOrDefault("APP_RUNTIME", "api"),
		HTTPPort:               envOrDefault("HTTP_PORT", "8080"),
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		JWTSecret:              os.Getenv("JWT_SECRET"),
		InternalToken:          os.Getenv("INTERNAL_TOKEN"),
		TelegramBotToken:       os.Getenv("TELEGRAM_BOT_TOKEN"),
		AllowInsecureDevAuth:   boolEnv("ALLOW_INSECURE_DEV_AUTH", false),
		AllowedOrigins:         os.Getenv("ALLOWED_ORIGINS"),
		PublicAppURL:           envOrDefault("PUBLIC_APP_URL", "http://localhost:3000"),
		TronGridBaseURL:        envOrDefault("TRONGRID_BASE_URL", "https://api.trongrid.io"),
		TronGridAPIKey:         os.Getenv("TRONGRID_API_KEY"),
		TonCenterBaseURL:       envOrDefault("TONCENTER_BASE_URL", "https://toncenter.com/api/v2"),
		TonCenterAPIKey:        os.Getenv("TONCENTER_API_KEY"),
		TonUSDTMasterAddress:   envOrDefault("TON_USDT_MASTER_ADDRESS", "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"),
		TonUSDOverride:         os.Getenv("TON_USD_RATE"),
		SolanaRPCURL:           envOrDefault("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"),
		EthereumRPCURL:         envOrDefault("ETHEREUM_RPC_URL", "https://eth.llamarpc.com"),
		BaseRPCURL:             envOrDefault("BASE_RPC_URL", "https://base.llamarpc.com"),
		ArbitrumRPCURL:         envOrDefault("ARBITRUM_RPC_URL", "https://arbitrum.llamarpc.com"),
		BSCRPCURL:              envOrDefault("BSC_RPC_URL", "https://bsc.llamarpc.com"),
		AdminUsername:          os.Getenv("ADMIN_USERNAME"),
		AdminPassword:          os.Getenv("ADMIN_PASSWORD"),
		AdminBootstrapEmail:    os.Getenv("ADMIN_BOOTSTRAP_EMAIL"),
		AdminBootstrapPassword: os.Getenv("ADMIN_BOOTSTRAP_PASSWORD"),
		AdminJWTSecret:         envOrDefault("ADMIN_JWT_SECRET", os.Getenv("JWT_SECRET")),
		PostHogKey:             os.Getenv("POSTHOG_KEY"),
		PostHogHost:            envOrDefault("POSTHOG_HOST", "https://app.posthog.com"),
		SentryDSNBackend:       os.Getenv("SENTRY_DSN_BACKEND"),
	}
	cfg.MetricsPort = envOrDefault("METRICS_PORT", defaultMetricsPort(cfg.AppRuntime))

	if cfg.DatabaseURL == "" {
		return Config{}, fmt.Errorf("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" {
		return Config{}, fmt.Errorf("JWT_SECRET is required")
	}
	if cfg.AllowInsecureDevAuth && cfg.AppEnv != "development" {
		return Config{}, fmt.Errorf("ALLOW_INSECURE_DEV_AUTH is only allowed when APP_ENV=development")
	}
	if cfg.AppEnv == "production" {
		if cfg.AdminUsername != "" || cfg.AdminPassword != "" {
			return Config{}, fmt.Errorf("ADMIN_USERNAME/ADMIN_PASSWORD are dev-only; use ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_PASSWORD in production")
		}
		if cfg.AdminJWTSecret == "" || cfg.AdminJWTSecret == "change-me-admin-too" || cfg.AdminJWTSecret == cfg.JWTSecret {
			return Config{}, fmt.Errorf("strong ADMIN_JWT_SECRET distinct from JWT_SECRET is required in production")
		}
	}

	initMaxAgeSeconds := intEnv("TELEGRAM_INIT_MAX_AGE_SECONDS", 86400)
	cfg.TelegramInitMaxAge = time.Duration(initMaxAgeSeconds) * time.Second

	pollInterval, err := time.ParseDuration(envOrDefault("WATCHER_POLL_INTERVAL", "20s"))
	if err != nil {
		return Config{}, fmt.Errorf("WATCHER_POLL_INTERVAL: %w", err)
	}
	cfg.WatcherPollInterval = pollInterval
	graceWindow, err := time.ParseDuration(envOrDefault("WATCHER_GRACE_WINDOW", "720h"))
	if err != nil {
		return Config{}, fmt.Errorf("WATCHER_GRACE_WINDOW: %w", err)
	}
	cfg.WatcherGraceWindow = graceWindow
	cfg.WatcherBackfillBlocks = int64Env("WATCHER_BACKFILL_BLOCKS", 2500)
	cfg.EVMConfirmationDepth = int64Env("EVM_CONFIRMATION_DEPTH", 12)

	accessTTL, err := time.ParseDuration(envOrDefault("ACCESS_TOKEN_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("ACCESS_TOKEN_TTL: %w", err)
	}
	cfg.AccessTokenTTL = accessTTL
	refreshTTL, err := time.ParseDuration(envOrDefault("REFRESH_TOKEN_TTL", "720h"))
	if err != nil {
		return Config{}, fmt.Errorf("REFRESH_TOKEN_TTL: %w", err)
	}
	cfg.RefreshTokenTTL = refreshTTL
	adminAccessTTL, err := time.ParseDuration(envOrDefault("ADMIN_ACCESS_TOKEN_TTL", "15m"))
	if err != nil {
		return Config{}, fmt.Errorf("ADMIN_ACCESS_TOKEN_TTL: %w", err)
	}
	cfg.AdminAccessTokenTTL = adminAccessTTL
	adminRefreshTTL, err := time.ParseDuration(envOrDefault("ADMIN_REFRESH_TOKEN_TTL", "12h"))
	if err != nil {
		return Config{}, fmt.Errorf("ADMIN_REFRESH_TOKEN_TTL: %w", err)
	}
	cfg.AdminRefreshTokenTTL = adminRefreshTTL

	return cfg, nil
}

func defaultMetricsPort(runtime string) string {
	switch runtime {
	case "watcher":
		return "9091"
	case "bot":
		return "9092"
	default:
		return "9090"
	}
}

func envOrDefault(name string, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}

func boolEnv(name string, fallback bool) bool {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func intEnv(name string, fallback int) int {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}

func int64Env(name string, fallback int64) int64 {
	value := os.Getenv(name)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		return fallback
	}
	return parsed
}
