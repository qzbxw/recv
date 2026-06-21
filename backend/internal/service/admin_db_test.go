package service

import (
	"context"
	"io"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/store"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
)

func TestDBAdminServiceSessionBusinessFlow(t *testing.T) {
	ctx := context.Background()
	st := newAdminServiceTestStore(t, ctx)

	admin := NewDBAdminService(st, "", "", "admin-secret", time.Minute, time.Hour, "admin@example.test", "correct-password", "test")
	created, err := admin.Bootstrap(ctx)
	if err != nil {
		t.Fatalf("Bootstrap returned error: %v", err)
	}
	if !created {
		t.Fatal("expected first bootstrap to create admin user")
	}
	created, err = admin.Bootstrap(ctx)
	if err != nil {
		t.Fatalf("second Bootstrap returned error: %v", err)
	}
	if created {
		t.Fatal("expected second bootstrap to leave existing admin unchanged")
	}

	if _, err := admin.StartLogin(ctx, "admin@example.test", "wrong-password"); err == nil {
		t.Fatal("expected wrong admin password to be rejected")
	}

	login, err := admin.StartLogin(ctx, "admin@example.test", "correct-password")
	if err != nil {
		t.Fatalf("StartLogin returned error: %v", err)
	}
	if login.Token == "" || login.RefreshToken == "" {
		t.Fatalf("expected token and refresh token, got %+v", login)
	}
	claims, err := admin.ParseToken(login.Token)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if claims.Role != "super_admin" || claims.SessionID == 0 {
		t.Fatalf("expected super_admin session claims, got %+v", claims)
	}

	refreshed, err := admin.Refresh(ctx, login.RefreshToken)
	if err != nil {
		t.Fatalf("Refresh returned error: %v", err)
	}
	if refreshed.Token == "" {
		t.Fatal("expected admin refresh to issue a new access token")
	}

	nextLogin, err := admin.StartLogin(ctx, "admin@example.test", "correct-password")
	if err != nil {
		t.Fatalf("second StartLogin returned error: %v", err)
	}
	if nextLogin.Token == "" || nextLogin.RefreshToken == "" {
		t.Fatalf("expected repeat password login to issue a session, got %+v", nextLogin)
	}

	if err := admin.RevokeRefreshToken(ctx, nextLogin.RefreshToken); err != nil {
		t.Fatalf("RevokeRefreshToken returned error: %v", err)
	}
	if _, err := admin.Refresh(ctx, nextLogin.RefreshToken); err == nil {
		t.Fatal("expected revoked refresh token to be rejected")
	}
	if err := admin.RevokeSession(ctx, claims.SessionID); err != nil {
		t.Fatalf("RevokeSession returned error: %v", err)
	}
	if _, err := admin.ParseToken(login.Token); err == nil || !strings.Contains(err.Error(), "revoked") {
		t.Fatalf("expected revoked admin session token to be rejected, got %v", err)
	}
}

// TestDBAdminServiceNonExistentUser verifies error paths for non-existent admin users.
func TestDBAdminServiceNonExistentUser(t *testing.T) {
	ctx := context.Background()
	st := newAdminServiceTestStore(t, ctx)

	admin := NewDBAdminService(st, "", "", "admin-secret", time.Minute, time.Hour, "admin@example.test", "correct-password", "test")
	if _, err := admin.Bootstrap(ctx); err != nil {
		t.Fatalf("Bootstrap: %v", err)
	}

	t.Run("StartLogin with non-existent email returns error", func(t *testing.T) {
		_, err := admin.StartLogin(ctx, "notexist@example.test", "password")
		if err == nil {
			t.Fatal("expected error for non-existent admin user")
		}
	})

	t.Run("Refresh with non-existent refresh token returns error", func(t *testing.T) {
		_, err := admin.Refresh(ctx, "nonexistent-refresh-token")
		if err == nil {
			t.Fatal("expected error for non-existent refresh token")
		}
	})

	t.Run("RevokeRefreshToken with non-existent token is a no-op", func(t *testing.T) {
		err := admin.RevokeRefreshToken(ctx, "nonexistent-token")
		if err != nil {
			t.Fatalf("expected no error for non-existent refresh token revocation, got %v", err)
		}
	})
}

func newAdminServiceTestStore(t *testing.T, ctx context.Context) *store.Store {
	t.Helper()

	port := pickAdminServiceTestPort(t)
	baseDir := t.TempDir()
	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("recv").
		Username("recv").
		Password("recv").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(filepath.Join(os.TempDir(), "recv-embedded-postgres-cache")).
		Locale("C").
		Encoding("UTF8").
		StartTimeout(45 * time.Second).
		StartParameters(map[string]string{
			"fsync":              "off",
			"synchronous_commit": "off",
			"full_page_writes":   "off",
		}).
		Logger(io.Discard)

	database := embeddedpostgres.NewDatabase(pgConfig)
	if err := database.Start(); err != nil {
		t.Fatalf("embedded postgres start failed: %v", err)
	}
	t.Cleanup(func() {
		_ = database.Stop()
	})

	st, err := store.New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("store.New returned error: %v", err)
	}
	t.Cleanup(st.Close)
	return st
}

func pickAdminServiceTestPort(t *testing.T) uint32 {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("failed to pick free port: %v", err)
	}
	defer listener.Close()
	return uint32(listener.Addr().(*net.TCPAddr).Port)
}
