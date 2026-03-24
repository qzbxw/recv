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
