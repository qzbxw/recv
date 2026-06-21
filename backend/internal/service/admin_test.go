package service

import (
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestAdminServiceEnabled(t *testing.T) {
	if NewAdminService("", "pass", "secret", time.Hour).Enabled() {
		t.Fatal("expected service without username to be disabled")
	}
	if !NewAdminService("admin", "pass", "secret", time.Hour).Enabled() {
		t.Fatal("expected configured service to be enabled")
	}
}

func TestAdminServiceAuthenticateAndParseToken(t *testing.T) {
	service := NewAdminService("admin", "pass", "secret", time.Hour)

	token, err := service.Authenticate("admin", "pass")
	if err != nil {
		t.Fatalf("Authenticate returned error: %v", err)
	}
	if token == "" {
		t.Fatal("expected token to be issued")
	}

	claims, err := service.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if claims.Username != "admin" {
		t.Fatalf("expected username admin, got %q", claims.Username)
	}
	if claims.Role != "admin" {
		t.Fatalf("expected role admin, got %q", claims.Role)
	}
}

func TestAdminServiceAuthenticateRejectsInvalidCredentials(t *testing.T) {
	service := NewAdminService("admin", "pass", "secret", time.Hour)

	_, err := service.Authenticate("admin", "wrong")
	if err == nil || !strings.Contains(err.Error(), "invalid admin credentials") {
		t.Fatalf("expected invalid credentials error, got %v", err)
	}
}

func TestAdminServiceParseTokenRejectsUnexpectedSigningMethod(t *testing.T) {
	service := NewAdminService("admin", "pass", "secret", time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS384, AdminClaims{
		Username: "admin",
		Role:     "admin",
	})
	signed, err := token.SignedString([]byte("secret"))
	if err != nil {
		t.Fatalf("SignedString returned error: %v", err)
	}

	_, err = service.ParseToken(signed)
	if err == nil || !strings.Contains(err.Error(), "unexpected signing method") {
		t.Fatalf("expected signing method error, got %v", err)
	}
}

func TestAdminServiceEnabledRequiresJWTSecret(t *testing.T) {
	if NewAdminService("admin", "pass", "", time.Hour).Enabled() {
		t.Fatal("expected service without jwt secret to be disabled")
	}
}

func TestAdminServiceAuthenticateRejectsDisabledService(t *testing.T) {
	service := NewAdminService("", "", "", time.Hour)
	_, err := service.Authenticate("admin", "pass")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestAdminServiceRevokeRefreshTokenNilStore(t *testing.T) {
	// RevokeRefreshToken with nil store should return "not configured" error
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	ctx := t.Context()
	err := svc.RevokeRefreshToken(ctx, "any-token")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestAdminServiceRevokeSessionNilStore(t *testing.T) {
	// RevokeSession with nil store should return "not configured" error
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	ctx := t.Context()
	err := svc.RevokeSession(ctx, 1)
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestTokenHash(t *testing.T) {
	hash1 := tokenHash("my-token")
	hash2 := tokenHash("my-token")
	if hash1 != hash2 {
		t.Fatal("expected tokenHash to be deterministic")
	}
	if tokenHash("token-a") == tokenHash("token-b") {
		t.Fatal("expected different tokens to produce different hashes")
	}
	if tokenHash("  spaced  ") != tokenHash("spaced") {
		t.Fatal("expected tokenHash to trim spaces")
	}
}

func TestNewAdminServiceZeroSessionTTLUsesDefault(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", 0)
	if svc.accessTTL != 12*time.Hour {
		t.Fatalf("expected default accessTTL 12h, got %v", svc.accessTTL)
	}
}

func TestNewDBAdminServiceZeroTTLsUseDefaults(t *testing.T) {
	svc := NewDBAdminService(nil, "admin", "pass", "secret", 0, 0, "", "", "production")
	if svc.accessTTL != 15*time.Minute {
		t.Fatalf("expected default accessTTL 15m, got %v", svc.accessTTL)
	}
	if svc.refreshTTL != 12*time.Hour {
		t.Fatalf("expected default refreshTTL 12h, got %v", svc.refreshTTL)
	}
}

func TestAdminServiceEnabledWithStore(t *testing.T) {
	// store is non-nil so Enabled() should return true regardless of username/password
	svc := NewDBAdminService(nil, "", "", "secret", time.Hour, time.Hour, "", "", "")
	// store is nil here so it's the in-memory path
	if svc.Enabled() {
		t.Fatal("expected disabled service with empty username and nil store")
	}
}

func TestAdminServiceAuthenticateLegacyRejectsWrongUsername(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	_, err := svc.authenticateLegacy("wronguser", "pass")
	if err == nil || !strings.Contains(err.Error(), "invalid admin credentials") {
		t.Fatalf("expected invalid credentials error, got %v", err)
	}
}

func TestAdminServiceAuthenticateLegacyRejectsWrongPassword(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	_, err := svc.authenticateLegacy("admin", "wrongpassword")
	if err == nil || !strings.Contains(err.Error(), "invalid admin credentials") {
		t.Fatalf("expected invalid credentials error, got %v", err)
	}
}

func TestAdminServiceBootstrapWithNilStore(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	created, err := svc.Bootstrap(t.Context())
	if err != nil {
		t.Fatalf("expected no error from Bootstrap with nil store, got %v", err)
	}
	if created {
		t.Fatal("expected created=false for nil store Bootstrap")
	}
}

func TestAdminServiceBootstrapWithMissingCredentials(t *testing.T) {
	// NewDBAdminService with empty bootstrapEmail should also return false
	svc := NewDBAdminService(nil, "", "", "secret", time.Hour, time.Hour, "", "", "test")
	created, err := svc.Bootstrap(t.Context())
	if err != nil {
		t.Fatalf("expected no error from Bootstrap with empty credentials, got %v", err)
	}
	if created {
		t.Fatal("expected created=false for empty bootstrap credentials")
	}
}

func TestAdminServiceStartLoginWithLegacyService(t *testing.T) {
	// No store, legacy-only admin service should work without DB.
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	result, err := svc.StartLogin(t.Context(), "admin", "pass")
	if err != nil {
		t.Fatalf("StartLogin should succeed for legacy admin, got %v", err)
	}
	if result.Token == "" {
		t.Fatal("expected token for legacy admin")
	}
}

func TestAdminServiceRefreshNilStore(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	_, err := svc.Refresh(t.Context(), "some-refresh-token")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestAdminServiceParseTokenRejectsDisabledService(t *testing.T) {
	// No admin service configured
	svc := &AdminService{}
	_, err := svc.ParseToken("some.token.value")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error, got %v", err)
	}
}

func TestAdminServiceRandomHelpers(t *testing.T) {
	t.Run("randomAdminID produces non-empty string", func(t *testing.T) {
		id := randomAdminID()
		if id == "" {
			t.Fatal("expected non-empty admin id")
		}
	})

	t.Run("randomToken produces sufficiently long string", func(t *testing.T) {
		token, err := randomToken(32)
		if err != nil {
			t.Fatalf("randomToken: %v", err)
		}
		if len(token) < 16 {
			t.Fatalf("expected long token, got %q", token)
		}
	})
}
