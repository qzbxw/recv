package db

import (
	"context"
	"io"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestRunMigrations(t *testing.T) {
	ctx := context.Background()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("pick free port: %v", err)
	}
	port := uint32(listener.Addr().(*net.TCPAddr).Port)
	listener.Close()

	baseDir, err := os.MkdirTemp("", "recv-db-test-*")
	if err != nil {
		t.Fatalf("mktemp: %v", err)
	}
	defer os.RemoveAll(baseDir)

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
		t.Fatalf("embedded postgres start: %v", err)
	}
	defer database.Stop()

	pool, err := pgxpool.New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		t.Fatalf("pgxpool.New: %v", err)
	}
	defer pool.Close()

	t.Run("first run applies all migrations", func(t *testing.T) {
		if err := RunMigrations(ctx, pool); err != nil {
			t.Fatalf("RunMigrations: %v", err)
		}
		// Verify schema_migrations table exists and has entries
		var count int
		if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM schema_migrations`).Scan(&count); err != nil {
			t.Fatalf("count schema_migrations: %v", err)
		}
		if count == 0 {
			t.Fatal("expected at least one migration to be applied")
		}

		var seededArticles int
		if err := pool.QueryRow(ctx, `
			SELECT COUNT(*)
			FROM blog_posts
			WHERE author_slug = 'recv-core'
			  AND status = 'published'
		`).Scan(&seededArticles); err != nil {
			t.Fatalf("count seeded bilingual articles: %v", err)
		}
		if seededArticles != 0 {
			t.Fatalf("expected 0 seeded bilingual articles, got %d", seededArticles)
		}
	})

	t.Run("second run is idempotent", func(t *testing.T) {
		var countBefore int
		if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM schema_migrations`).Scan(&countBefore); err != nil {
			t.Fatalf("count before: %v", err)
		}

		if err := RunMigrations(ctx, pool); err != nil {
			t.Fatalf("second RunMigrations: %v", err)
		}

		var countAfter int
		if err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM schema_migrations`).Scan(&countAfter); err != nil {
			t.Fatalf("count after: %v", err)
		}
		if countAfter != countBefore {
			t.Fatalf("expected idempotent run, got %d → %d migrations", countBefore, countAfter)
		}
	})
}
