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
	t.Setenv("DATABASE_URL", "postgres://localhost/recv")
	t.Setenv("JWT_SECRET", "")

	_, err := Load()
	if err == nil || err.Error() != "JWT_SECRET is required" {
		t.Fatalf("expected missing jwt secret error, got %v", err)
	}
}

func TestLoadAppliesDefaultsAndParsesDurations(t *testing.T) {
	t.Setenv("APP_RUNTIME", "watcher")
	t.Setenv("DATABASE_URL", "postgres://localhost/recv")
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

func TestLoadRejectsUnsafeProductionAdminConfig(t *testing.T) {
	t.Run("dev admin credentials are production-only error", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("DATABASE_URL", "postgres://localhost/recv")
		t.Setenv("JWT_SECRET", "jwt-secret")
		t.Setenv("ADMIN_USERNAME", "admin")
		t.Setenv("ADMIN_PASSWORD", "pass")
		t.Setenv("ADMIN_JWT_SECRET", "admin-secret")

		_, err := Load()
		if err == nil || err.Error() != "ADMIN_USERNAME/ADMIN_PASSWORD are dev-only; use ADMIN_BOOTSTRAP_EMAIL/ADMIN_BOOTSTRAP_PASSWORD in production" {
			t.Fatalf("expected dev-only admin credential error, got %v", err)
		}
	})

	t.Run("admin jwt secret must be distinct in production", func(t *testing.T) {
		t.Setenv("APP_ENV", "production")
		t.Setenv("DATABASE_URL", "postgres://localhost/recv")
		t.Setenv("JWT_SECRET", "same-secret")
		t.Setenv("ADMIN_JWT_SECRET", "same-secret")

		_, err := Load()
		if err == nil || err.Error() != "strong ADMIN_JWT_SECRET distinct from JWT_SECRET is required in production" {
			t.Fatalf("expected strong admin secret error, got %v", err)
		}
	})

	t.Run("insecure dev auth is rejected outside development", func(t *testing.T) {
		t.Setenv("APP_ENV", "staging")
		t.Setenv("DATABASE_URL", "postgres://localhost/recv")
		t.Setenv("JWT_SECRET", "jwt-secret")
		t.Setenv("ALLOW_INSECURE_DEV_AUTH", "true")

		_, err := Load()
		if err == nil || err.Error() != "ALLOW_INSECURE_DEV_AUTH is only allowed when APP_ENV=development" {
			t.Fatalf("expected insecure auth environment error, got %v", err)
		}
	})
}

func TestLoadRejectsInvalidDurations(t *testing.T) {
	baseEnv := func(t *testing.T) {
		t.Helper()
		t.Setenv("DATABASE_URL", "postgres://localhost/recv")
		t.Setenv("JWT_SECRET", "jwt-secret")
	}

	cases := []struct {
		name string
		env  string
	}{
		{name: "watcher poll interval", env: "WATCHER_POLL_INTERVAL"},
		{name: "watcher grace window", env: "WATCHER_GRACE_WINDOW"},
		{name: "access token ttl", env: "ACCESS_TOKEN_TTL"},
		{name: "refresh token ttl", env: "REFRESH_TOKEN_TTL"},
		{name: "admin access token ttl", env: "ADMIN_ACCESS_TOKEN_TTL"},
		{name: "admin refresh token ttl", env: "ADMIN_REFRESH_TOKEN_TTL"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			baseEnv(t)
			t.Setenv(tc.env, "not-a-duration")
			_, err := Load()
			if err == nil {
				t.Fatalf("expected %s parse error", tc.env)
			}
		})
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
	t.Setenv("INT_VALID_VALUE", "27")

	if got := boolEnv("BOOL_VALUE", true); !got {
		t.Fatal("expected boolEnv to fall back to true")
	}
	if got := intEnv("INT_VALUE", 12); got != 12 {
		t.Fatalf("expected intEnv fallback 12, got %d", got)
	}
	if got := intEnv("INT_VALID_VALUE", 0); got != 27 {
		t.Fatalf("expected intEnv to parse 27, got %d", got)
	}
}

func TestInt64EnvFallbackAndParsing(t *testing.T) {
	t.Run("returns fallback when var is unset", func(t *testing.T) {
		t.Setenv("INT64_TEST_VAR", "")
		if got := int64Env("INT64_TEST_VAR", 9999); got != 9999 {
			t.Fatalf("expected fallback 9999, got %d", got)
		}
	})

	t.Run("parses valid int64 value", func(t *testing.T) {
		t.Setenv("INT64_TEST_VAR", "2500")
		if got := int64Env("INT64_TEST_VAR", 0); got != 2500 {
			t.Fatalf("expected 2500, got %d", got)
		}
	})

	t.Run("returns fallback when value is not a number", func(t *testing.T) {
		t.Setenv("INT64_TEST_VAR", "not-a-number")
		if got := int64Env("INT64_TEST_VAR", 42); got != 42 {
			t.Fatalf("expected fallback 42, got %d", got)
		}
	})

	t.Run("parses large int64 value", func(t *testing.T) {
		t.Setenv("INT64_TEST_VAR", "9223372036854775807")
		if got := int64Env("INT64_TEST_VAR", 0); got != 9223372036854775807 {
			t.Fatalf("expected max int64, got %d", got)
		}
	})
}
