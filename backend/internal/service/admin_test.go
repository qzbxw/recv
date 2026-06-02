package service

import (
	"encoding/base32"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/store"

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

func TestGenerateTOTPSecret(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret returned error: %v", err)
	}
	if len(secret) == 0 {
		t.Fatal("expected non-empty TOTP secret")
	}
	_, err = base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(secret))
	if err != nil {
		t.Fatalf("TOTP secret is not valid base32: %v", err)
	}
}

func TestValidateTOTPRejectsInvalidFormat(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret error: %v", err)
	}
	now := time.Now().UTC()

	if validateTOTP(secret, "12345", now) {
		t.Fatal("expected 5-digit code to be rejected")
	}
	if validateTOTP(secret, "1234567", now) {
		t.Fatal("expected 7-digit code to be rejected")
	}
	if validateTOTP(secret, "abcdef", now) {
		t.Fatal("expected non-numeric code to be rejected")
	}
	if validateTOTP(secret, "", now) {
		t.Fatal("expected empty code to be rejected")
	}
}

func TestValidateTOTPAcceptsCurrentCode(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret error: %v", err)
	}
	now := time.Now().UTC()
	code, err := totpCode(secret, now)
	if err != nil {
		t.Fatalf("totpCode error: %v", err)
	}
	if !validateTOTP(secret, code, now) {
		t.Fatal("expected current TOTP code to be accepted")
	}
}

func TestValidateTOTPAcceptsAdjacentWindows(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret error: %v", err)
	}
	now := time.Now().UTC()

	prevCode, err := totpCode(secret, now.Add(-30*time.Second))
	if err != nil {
		t.Fatalf("totpCode for prev window error: %v", err)
	}
	if !validateTOTP(secret, prevCode, now) {
		t.Fatal("expected previous TOTP window to be accepted")
	}

	nextCode, err := totpCode(secret, now.Add(30*time.Second))
	if err != nil {
		t.Fatalf("totpCode for next window error: %v", err)
	}
	if !validateTOTP(secret, nextCode, now) {
		t.Fatal("expected next TOTP window to be accepted")
	}
}

func TestTOTPCodeIsDeterministic(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret error: %v", err)
	}
	now := time.Now().UTC()
	code1, err := totpCode(secret, now)
	if err != nil {
		t.Fatalf("first totpCode error: %v", err)
	}
	code2, err := totpCode(secret, now)
	if err != nil {
		t.Fatalf("second totpCode error: %v", err)
	}
	if code1 != code2 {
		t.Fatal("expected totpCode to be deterministic for the same time")
	}
	if len(code1) != 6 {
		t.Fatalf("expected 6-digit code, got %q", code1)
	}
	for _, ch := range code1 {
		if ch < '0' || ch > '9' {
			t.Fatalf("expected only digits in TOTP code, got %q", code1)
		}
	}
}

func TestGenerateRecoveryCodes(t *testing.T) {
	codes, err := generateRecoveryCodes(10)
	if err != nil {
		t.Fatalf("generateRecoveryCodes error: %v", err)
	}
	if len(codes) != 10 {
		t.Fatalf("expected 10 recovery codes, got %d", len(codes))
	}
	seen := make(map[string]bool)
	for _, code := range codes {
		if len(code) != 14 {
			t.Fatalf("expected code length 14 (XXXX-XXXX-XXXX), got %d for %q", len(code), code)
		}
		if code[4] != '-' || code[9] != '-' {
			t.Fatalf("expected dashes at positions 4 and 9, got %q", code)
		}
		if seen[code] {
			t.Fatalf("duplicate recovery code: %q", code)
		}
		seen[code] = true
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

func TestAdminServiceParseChallengeTokenRoundTrip(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	admin := store.AdminUser{ID: 1, Email: "admin@test.com"}
	challengeToken, err := svc.issueChallengeToken(admin, false)
	if err != nil {
		t.Fatalf("issueChallengeToken: %v", err)
	}
	claims, err := svc.parseChallengeToken(challengeToken)
	if err != nil {
		t.Fatalf("parseChallengeToken: %v", err)
	}
	if claims.Email != "admin@test.com" {
		t.Fatalf("expected email admin@test.com, got %q", claims.Email)
	}
	if claims.TOTPSetup {
		t.Fatal("expected TOTPSetup to be false")
	}
}

func TestAdminServiceParseChallengeTokenRejectsInvalid(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)
	_, err := svc.parseChallengeToken("not.a.valid.jwt")
	if err == nil {
		t.Fatal("expected error for invalid challenge token")
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
	// Legacy service does not require TOTP
	if result.MFARequired {
		t.Fatal("expected no MFA required for legacy admin")
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

func TestAdminServiceGenerateTOTPSecretPath(t *testing.T) {
	secret, err := generateTOTPSecret()
	if err != nil {
		t.Fatalf("generateTOTPSecret: %v", err)
	}
	if secret == "" {
		t.Fatal("expected TOTP secret")
	}
}

func TestAdminServiceVerifyTOTPNilStore(t *testing.T) {
	svc := NewAdminService("admin", "pass", "secret", time.Hour)

	// Without a challenge token (no store), VerifyTOTP should fail
	_, err := svc.VerifyTOTP(t.Context(), "invalid-challenge-token", "123456", AdminSessionInput{})
	if err == nil {
		t.Fatal("expected error for invalid challenge token")
	}
}
