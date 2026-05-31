package config

import (
	"testing"
	"time"
)

func TestLoadRequiresDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("JWT_SECRET", "secret")

	_, err := Load()
	if err == nil || err.Error() != "DATABASE_URL is required" {
		t.Fatalf("expected missing database url error, got %v", err)
	}
}

func TestLoadRequiresJWTSecret(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://localhost/reqst")
	t.Setenv("JWT_SECRET", "")

	_, err := Load()
	if err == nil || err.Error() != "JWT_SECRET is required" {
		t.Fatalf("expected missing jwt secret error, got %v", err)
	}
}

func TestLoadAppliesDefaultsAndParsesDurations(t *testing.T) {
	t.Setenv("APP_RUNTIME", "watcher")
	t.Setenv("DATABASE_URL", "postgres://localhost/reqst")
	t.Setenv("JWT_SECRET", "secret")
	t.Setenv("ALLOW_INSECURE_DEV_AUTH", "true")
	t.Setenv("TELEGRAM_INIT_MAX_AGE_SECONDS", "120")
	t.Setenv("WATCHER_POLL_INTERVAL", "45s")
	t.Setenv("ACCESS_TOKEN_TTL", "10m")
	t.Setenv("REFRESH_TOKEN_TTL", "720h")
	t.Setenv("ADMIN_ACCESS_TOKEN_TTL", "2h")
	t.Setenv("ADMIN_REFRESH_TOKEN_TTL", "12h")
	t.Setenv("ADMIN_JWT_SECRET", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load returned error: %v", err)
	}
	if cfg.MetricsPort != "9091" {
		t.Fatalf("expected watcher metrics port 9091, got %s", cfg.MetricsPort)
	}
	if !cfg.AllowInsecureDevAuth {
		t.Fatal("expected insecure dev auth to be enabled")
	}
	if cfg.TelegramInitMaxAge != 120*time.Second {
		t.Fatalf("unexpected telegram max age: %s", cfg.TelegramInitMaxAge)
	}
	if cfg.WatcherPollInterval != 45*time.Second {
		t.Fatalf("unexpected watcher poll interval: %s", cfg.WatcherPollInterval)
	}
	if cfg.AccessTokenTTL != 10*time.Minute {
		t.Fatalf("unexpected access token ttl: %s", cfg.AccessTokenTTL)
	}
	if cfg.AdminAccessTokenTTL != 2*time.Hour {
		t.Fatalf("unexpected admin access ttl: %s", cfg.AdminAccessTokenTTL)
	}
	if cfg.AdminJWTSecret != "secret" {
		t.Fatalf("expected admin secret to fall back to JWT secret, got %q", cfg.AdminJWTSecret)
	}
}

func TestDefaultMetricsPort(t *testing.T) {
	if got := defaultMetricsPort("watcher"); got != "9091" {
		t.Fatalf("expected watcher port 9091, got %s", got)
	}
	if got := defaultMetricsPort("bot"); got != "9092" {
		t.Fatalf("expected bot port 9092, got %s", got)
	}
	if got := defaultMetricsPort("api"); got != "9090" {
		t.Fatalf("expected api port 9090, got %s", got)
	}
}

func TestEnvHelpersFallbackOnInvalidInput(t *testing.T) {
	t.Setenv("BOOL_VALUE", "not-bool")
	t.Setenv("INT_VALUE", "not-int")

	if got := boolEnv("BOOL_VALUE", true); !got {
		t.Fatal("expected boolEnv to fall back to true")
	}
	if got := intEnv("INT_VALUE", 12); got != 12 {
		t.Fatalf("expected intEnv fallback 12, got %d", got)
	}
}
