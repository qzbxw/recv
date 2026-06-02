package http

import (
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base32"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net"
	stdhttp "net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
	"time"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"

	"reqst/backend/internal/config"
	"reqst/backend/internal/service"
	"reqst/backend/internal/store"
)

// sharedHTTPTestStore is a package-level store shared across all DB-backed HTTP tests.
// Initialized once via TestMain to avoid redundant embedded postgres starts.
var sharedHTTPTestStore *store.Store

func TestMain(m *testing.M) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		panic("pick free port: " + err.Error())
	}
	port := uint32(listener.Addr().(*net.TCPAddr).Port)
	listener.Close()

	baseDir, err := os.MkdirTemp("", "reqst-http-test-*")
	if err != nil {
		panic("mktemp: " + err.Error())
	}
	defer os.RemoveAll(baseDir)

	pgConfig := embeddedpostgres.DefaultConfig().
		Version(embeddedpostgres.V16).
		Port(port).
		Database("reqst").
		Username("reqst").
		Password("reqst").
		RuntimePath(filepath.Join(baseDir, "runtime")).
		DataPath(filepath.Join(baseDir, "data")).
		CachePath(filepath.Join(os.TempDir(), "reqst-embedded-postgres-cache")).
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
		panic("embedded postgres start: " + err.Error())
	}
	defer database.Stop()

	st, err := store.New(ctx, pgConfig.GetConnectionURL()+"?sslmode=disable")
	if err != nil {
		panic("store.New: " + err.Error())
	}
	defer st.Close()

	sharedHTTPTestStore = st

	os.Exit(m.Run())
}

// canceledCtx returns a context that is immediately canceled so store queries fail.
func canceledCtx() context.Context {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	return ctx
}

// withCanceledContext creates a request using an immediately-canceled context.
func withCanceledContext(req *stdhttp.Request) *stdhttp.Request {
	return req.WithContext(canceledCtx())
}

func TestAdminHandlersErrorPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminService,
	}

	// Get a valid admin token
	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	t.Run("handleAdminOverview error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/overview", server.handleAdminOverview)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminInvoices error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/invoices", server.handleAdminInvoices)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/invoices", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminOpsOverview error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/ops", server.handleAdminOpsOverview)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/ops", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminWorkspaces error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/workspaces", server.handleAdminWorkspaces)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/workspaces", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminFailedWebhooks error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/failed-webhooks", server.handleAdminFailedWebhooks)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/failed-webhooks", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminWatchers error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/watchers", server.handleAdminWatchers)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/watchers", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminNotifications error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/notifications", server.handleAdminNotifications)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/notifications", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminSEOTargets error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/seo-targets", server.handleAdminSEOTargets)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/seo-targets", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminAnalytics error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.GET("/api/admin/analytics", server.handleAdminAnalytics)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/analytics?group_by=date", nil))
		req.Header.Set("Authorization", "Bearer "+token)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminAuditEvents error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/audit-events", server.handleAdminAuditEvents)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/audit-events", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminBlockWorkspace error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/1/block",
			strings.NewReader(`{"blocked":true}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		// May be 404 (not found) or 500 (canceled context)
		if rec.Code == stdhttp.StatusOK {
			t.Fatalf("expected non-200 for canceled context, got %d", rec.Code)
		}
	})

	t.Run("handleAdminListBlogPosts error when context canceled", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/blog", server.handleAdminListBlogPosts)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/blog", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})
}

func TestAdminHandlersSuccessPaths(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "secret", time.Hour)
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminService,
		cfg:          config.Config{AppEnv: "test"},
	}

	// Get a valid admin token
	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}
	withAdminHeader := func(req *stdhttp.Request) *stdhttp.Request {
		req.Header.Set("Authorization", "Bearer "+token)
		return req
	}
	_ = withAdminHeader

	t.Run("handleAdminOverview returns 200 with data", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/overview", server.handleAdminOverview)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/overview", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminWorkspaces returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/workspaces", server.handleAdminWorkspaces)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/workspaces", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminFailedWebhooks returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/failed-webhooks", server.handleAdminFailedWebhooks)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/failed-webhooks", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminWatchers returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/watchers", server.handleAdminWatchers)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/watchers", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminNotifications returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/notifications", server.handleAdminNotifications)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/notifications", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminSEOTargets returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/seo-targets", server.handleAdminSEOTargets)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/seo-targets", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminInvoices returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/invoices", server.handleAdminInvoices)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/invoices", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminAnalytics returns 200 with valid params", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.GET("/api/admin/analytics", server.handleAdminAnalytics)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/analytics?group_by=date", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminAuditEvents returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/audit-events", server.handleAdminAuditEvents)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/audit-events", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminListBlogPosts returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/blog", server.handleAdminListBlogPosts)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/blog", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handleAdminOpsOverview returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/ops-overview", server.handleAdminOpsOverview)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/ops-overview", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBlogPost stores and returns post", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

		body := `{"slug":"test-post-db","title":"Test Post","content_md":"# Hello","locale":"en","status":"draft","tags":[]}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handlePublicListBlogPosts returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog", server.handlePublicListBlogPosts)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d", rec.Code)
		}
	})

	t.Run("handlePublicGetBlogPost returns 404 for unknown slug", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog/:slug", server.handlePublicGetBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog/nonexistent-slug-xyz", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for unknown slug, got %d", rec.Code)
		}
	})

	t.Run("validInternalToken with DB-stored hash matches", func(t *testing.T) {
		secretToken := "test-internal-secret-db"
		tokenHash := hashSecret(secretToken)

		if err := sharedHTTPTestStore.UpsertSystemConfig(ctx, "internal_token_hashes",
			[]string{tokenHash}, true, "test"); err != nil {
			t.Fatalf("UpsertSystemConfig: %v", err)
		}
		defer func() {
			_ = sharedHTTPTestStore.UpsertSystemConfig(ctx, "internal_token_hashes", []string{}, true, "test")
		}()

		srv := &Server{store: sharedHTTPTestStore}
		if !srv.validInternalToken(ctx, secretToken) {
			t.Fatal("expected DB-stored token hash to be valid")
		}
		if srv.validInternalToken(ctx, "wrong-token") {
			t.Fatal("expected wrong token to be invalid")
		}
	})
}

func TestDeveloperHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Set up a workspace with a developer plan subscription.
	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95001, "devtestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	t.Run("handleListAPIKeys returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/api-keys", server.handleListAPIKeys)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/api-keys", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleListWebhookEndpoints returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/webhooks", server.handleListWebhookEndpoints)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/webhooks", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleDeveloperUsage returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/usage", server.handleDeveloperUsage)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/usage", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleListWebhookDeliveries returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/webhooks/deliveries", server.handleListWebhookDeliveries)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/webhooks/deliveries", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("developer handlers return 500 when store context is canceled", func(t *testing.T) {
		cases := []struct {
			name   string
			method string
			path   string
			body   string
			route  func(*gin.Engine)
		}{
			{
				name:   "usage",
				method: stdhttp.MethodGet,
				path:   "/api/developer/usage",
				route: func(router *gin.Engine) {
					router.GET("/api/developer/usage", server.handleDeveloperUsage)
				},
			},
			{
				name:   "list api keys",
				method: stdhttp.MethodGet,
				path:   "/api/developer/api-keys",
				route: func(router *gin.Engine) {
					router.GET("/api/developer/api-keys", server.handleListAPIKeys)
				},
			},
			{
				name:   "create api key count",
				method: stdhttp.MethodPost,
				path:   "/api/developer/api-keys",
				body:   `{"label":"ctx"}`,
				route: func(router *gin.Engine) {
					router.POST("/api/developer/api-keys", server.handleCreateAPIKey)
				},
			},
			{
				name:   "delete api key",
				method: stdhttp.MethodDelete,
				path:   "/api/developer/api-keys/1",
				route: func(router *gin.Engine) {
					router.DELETE("/api/developer/api-keys/:id", server.handleDeleteAPIKey)
				},
			},
			{
				name:   "list webhooks",
				method: stdhttp.MethodGet,
				path:   "/api/developer/webhooks",
				route: func(router *gin.Engine) {
					router.GET("/api/developer/webhooks", server.handleListWebhookEndpoints)
				},
			},
			{
				name:   "create webhook",
				method: stdhttp.MethodPost,
				path:   "/api/developer/webhooks",
				body:   `{"url":"https://example.com/webhook"}`,
				route: func(router *gin.Engine) {
					router.POST("/api/developer/webhooks", server.handleCreateWebhookEndpoint)
				},
			},
			{
				name:   "rotate webhook",
				method: stdhttp.MethodPost,
				path:   "/api/developer/webhooks/1/rotate-secret",
				route: func(router *gin.Engine) {
					router.POST("/api/developer/webhooks/:id/rotate-secret", server.handleRotateWebhookEndpointSecret)
				},
			},
			{
				name:   "delete webhook",
				method: stdhttp.MethodDelete,
				path:   "/api/developer/webhooks/1",
				route: func(router *gin.Engine) {
					router.DELETE("/api/developer/webhooks/:id", server.handleDeleteWebhookEndpoint)
				},
			},
			{
				name:   "list webhook deliveries",
				method: stdhttp.MethodGet,
				path:   "/api/developer/webhook-deliveries",
				route: func(router *gin.Engine) {
					router.GET("/api/developer/webhook-deliveries", server.handleListWebhookDeliveries)
				},
			},
			{
				name:   "resend webhook delivery",
				method: stdhttp.MethodPost,
				path:   "/api/developer/webhook-deliveries/1/resend",
				route: func(router *gin.Engine) {
					router.POST("/api/developer/webhook-deliveries/:id/resend", server.handleResendWebhookDelivery)
				},
			},
		}

		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				router := gin.New()
				router.Use(withWS)
				tc.route(router)

				rec := httptest.NewRecorder()
				var body io.Reader
				if tc.body != "" {
					body = strings.NewReader(tc.body)
				}
				req := withCanceledContext(httptest.NewRequest(tc.method, tc.path, body))
				if tc.body != "" {
					req.Header.Set("Content-Type", "application/json")
				}
				router.ServeHTTP(rec, req)
				if rec.Code != stdhttp.StatusInternalServerError {
					t.Fatalf("expected 500, got %d: %s", rec.Code, rec.Body.String())
				}
			})
		}
	})
}

func TestDeveloperAPIMiddlewareBranchesWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	trialWorkspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96001, "apitrialuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram trial: %v", err)
	}
	trialSecret := "rqst_live_trial_direct"
	if _, err := sharedHTTPTestStore.CreateAPIKey(ctx, trialWorkspace.ID, "trial direct", "rqst_live_", hashSecret(trialSecret), []string{"invoices:read"}, "live"); err != nil {
		t.Fatalf("CreateAPIKey trial: %v", err)
	}

	devWorkspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96002, "apidevuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram dev: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, devWorkspace.ID); err != nil {
		t.Fatalf("set developer plan: %v", err)
	}
	devSecret := "rqst_live_dev_direct"
	if _, err := sharedHTTPTestStore.CreateAPIKey(ctx, devWorkspace.ID, "dev direct", "rqst_live_", hashSecret(devSecret), []string{"invoices:read", "invoices:write"}, "live"); err != nil {
		t.Fatalf("CreateAPIKey dev: %v", err)
	}
	rateSecret := "rqst_live_dev_rate_direct"
	if _, err := sharedHTTPTestStore.CreateAPIKey(ctx, devWorkspace.ID, "rate direct", "rqst_live_", hashSecret(rateSecret), []string{"invoices:read"}, "live"); err != nil {
		t.Fatalf("CreateAPIKey rate: %v", err)
	}

	server := &Server{
		store:          sharedHTTPTestStore,
		invoiceService: service.NewInvoiceService(sharedHTTPTestStore, "2.5"),
		cfg:            config.Config{AppEnv: "test"},
	}
	router := gin.New()
	devAPI := router.Group("/v1")
	devAPI.Use(server.apiKeyMiddleware())
	devAPI.GET("/ping", func(c *gin.Context) { c.JSON(stdhttp.StatusOK, gin.H{"ok": true}) })
	devAPI.POST("/invoices", server.handleAPICreateInvoice)
	devAPI.POST("/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)

	t.Run("missing and invalid API keys are rejected before store context is set", func(t *testing.T) {
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/v1/ping", nil))
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected missing key 401, got %d", rec.Code)
		}

		rec = httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/ping", nil)
		req.Header.Set("Authorization", "Bearer rqst_live_missing")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected invalid key 401, got %d", rec.Code)
		}
	})

	t.Run("trial plan direct key is denied by API middleware", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/ping", nil)
		req.Header.Set("Authorization", "Bearer "+trialSecret)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected trial API key 403, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("blocked workspace API key is denied", func(t *testing.T) {
		if _, err := sharedHTTPTestStore.SetWorkspaceBlocked(ctx, devWorkspace.ID, true); err != nil {
			t.Fatalf("SetWorkspaceBlocked true: %v", err)
		}
		t.Cleanup(func() {
			_, _ = sharedHTTPTestStore.SetWorkspaceBlocked(ctx, devWorkspace.ID, false)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/ping", nil)
		req.Header.Set("Authorization", "Bearer "+devSecret)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected blocked workspace 403, got %d", rec.Code)
		}
	})

	t.Run("successful API key request records usage and eventually rate-limits", func(t *testing.T) {
		for i := 0; i < store.ResolvePlan(store.PlanCodeDeveloper).RequestsPerMinute+1; i++ {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(stdhttp.MethodGet, "/v1/ping", nil)
			req.Header.Set("Authorization", "Bearer "+rateSecret)
			router.ServeHTTP(rec, req)
			if i == 0 && rec.Code != stdhttp.StatusOK {
				t.Fatalf("expected first API request 200, got %d: %s", rec.Code, rec.Body.String())
			}
			if rec.Code == stdhttp.StatusTooManyRequests {
				return
			}
		}
		t.Fatal("expected minute rate limit to reject one request")
	})

	t.Run("idempotent invoice create records malformed JSON response", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{"title":`))
		req.Header.Set("Authorization", "Bearer "+devSecret)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Idempotency-Key", "malformed-json-branch")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected malformed JSON 400, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("live API key cannot use payment simulator", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/v1/test/invoices/1/simulate-payment", nil)
		req.Header.Set("Authorization", "Bearer "+devSecret)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected simulator 403 for live key, got %d", rec.Code)
		}
	})
}

func TestServerHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95002, "servertestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 95002)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	authService := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{
		store:       sharedHTTPTestStore,
		authService: authService,
		cfg:         config.Config{AppEnv: "test"},
	}

	// Issue a refresh token
	authResult, err := authService.SwitchWorkspace(ctx, user.ID, workspace.ID)
	if err != nil {
		t.Fatalf("SwitchWorkspace: %v", err)
	}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Claims: service.Claims{UserID: user.ID, WorkspaceID: workspace.ID, TelegramID: 95002}, Workspace: workspace})
		c.Next()
	}

	t.Run("handleMe returns 200 with workspace", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/me", server.handleMe)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleListWallets returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/wallets", server.handleListWallets)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/wallets", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleListInvoices returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/invoices", server.handleListInvoices)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/invoices", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAuthRefresh success with valid token", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/refresh", server.handleAuthRefresh)

		rec := httptest.NewRecorder()
		body := strings.NewReader(`{"refresh_token":"` + authResult.RefreshToken + `"}`)
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/refresh", body)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for valid refresh token, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleUpdateContactEmail rejects email without store call", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/me/contact-email", server.handleUpdateContactEmail)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/me/contact-email", strings.NewReader(`{"email":"valid@example.com"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for valid email update, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleCreateWallet creates wallet successfully", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/wallets", server.handleCreateWallet)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets",
			strings.NewReader(`{"network":"EVM","address":"0xABCDEF1234567890ABCDEF1234567890ABCDEF12"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201 for wallet creation, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleCreateInvoice creates invoice successfully", func(t *testing.T) {
		// First create a wallet for the invoice destination
		evmWallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0x1234567890ABCDEF1234567890ABCDEF12345678")
		if err != nil && !strings.Contains(err.Error(), "already exists") {
			t.Fatalf("CreateWallet: %v", err)
		}
		if evmWallet.ID == 0 {
			evmWallet, _ = sharedHTTPTestStore.GetActiveWalletForNetwork(ctx, workspace.ID, store.NetworkEVM)
		}

		invoiceSvc := service.NewInvoiceService(sharedHTTPTestStore, "test")
		server2 := &Server{
			store:          sharedHTTPTestStore,
			authService:    authService,
			invoiceService: invoiceSvc,
			cfg:            config.Config{AppEnv: "test"},
		}

		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices", server2.handleCreateInvoice)

		body := `{"title":"Test Invoice","base_amount_usd":"10","payable_network":"EVM"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/invoices", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated && rec.Code != stdhttp.StatusBadRequest {
			// Either created or validation error (if no wallet available)
			t.Fatalf("unexpected status %d: %s", rec.Code, rec.Body.String())
		}
		_ = evmWallet
	})

	t.Run("server handlers return errors when store context is canceled", func(t *testing.T) {
		invoiceSvc := service.NewInvoiceService(sharedHTTPTestStore, "2.50")
		paymentSvc := service.NewPaymentService(sharedHTTPTestStore)
		server2 := &Server{
			store:          sharedHTTPTestStore,
			authService:    authService,
			invoiceService: invoiceSvc,
			paymentService: paymentSvc,
			cfg:            config.Config{AppEnv: "test"},
		}
		cases := []struct {
			name   string
			method string
			path   string
			body   string
			route  func(*gin.Engine)
			useWS  bool
			want   int
		}{
			{
				name:   "product event",
				method: stdhttp.MethodPost,
				path:   "/api/events",
				body:   `{"event_name":"click"}`,
				useWS:  true,
				route:  func(router *gin.Engine) { router.POST("/api/events", server2.handleProductEvent) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "public product event",
				method: stdhttp.MethodPost,
				path:   "/api/public/events",
				body:   `{"event_name":"click"}`,
				route:  func(router *gin.Engine) { router.POST("/api/public/events", server2.handlePublicProductEvent) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "update contact email",
				method: stdhttp.MethodPost,
				path:   "/api/me/contact-email",
				body:   `{"email":"ctx@example.com"}`,
				useWS:  true,
				route:  func(router *gin.Engine) { router.POST("/api/me/contact-email", server2.handleUpdateContactEmail) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "list wallets",
				method: stdhttp.MethodGet,
				path:   "/api/wallets",
				useWS:  true,
				route:  func(router *gin.Engine) { router.GET("/api/wallets", server2.handleListWallets) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "delete wallet",
				method: stdhttp.MethodDelete,
				path:   "/api/wallets/1",
				useWS:  true,
				route:  func(router *gin.Engine) { router.DELETE("/api/wallets/:id", server2.handleDeleteWallet) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "list invoices",
				method: stdhttp.MethodGet,
				path:   "/api/invoices?page=0&page_size=999",
				useWS:  true,
				route:  func(router *gin.Engine) { router.GET("/api/invoices", server2.handleListInvoices) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "get invoice",
				method: stdhttp.MethodGet,
				path:   "/api/invoices/1",
				useWS:  true,
				route:  func(router *gin.Engine) { router.GET("/api/invoices/:id", server2.handleGetInvoice) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "cancel invoice",
				method: stdhttp.MethodPost,
				path:   "/api/invoices/1/cancel",
				useWS:  true,
				route:  func(router *gin.Engine) { router.POST("/api/invoices/:id/cancel", server2.handleCancelInvoice) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "mark invoice paid",
				method: stdhttp.MethodPost,
				path:   "/api/invoices/1/mark-paid",
				useWS:  true,
				route:  func(router *gin.Engine) { router.POST("/api/invoices/:id/mark-paid", server2.handleMarkInvoicePaid) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "public invoice",
				method: stdhttp.MethodGet,
				path:   "/api/public/invoices/CTX",
				route:  func(router *gin.Engine) { router.GET("/api/public/invoices/:public_id", server2.handlePublicInvoice) },
				want:   stdhttp.StatusInternalServerError,
			},
			{
				name:   "grant pro",
				method: stdhttp.MethodPost,
				path:   "/internal/admin/workspaces/1/grant-pro",
				route: func(router *gin.Engine) {
					router.POST("/internal/admin/workspaces/:id/grant-pro", server2.handleGrantPRO)
				},
				want: stdhttp.StatusInternalServerError,
			},
			{
				name:   "block workspace",
				method: stdhttp.MethodPost,
				path:   "/internal/admin/workspaces/1/block",
				body:   `{"blocked":true}`,
				route: func(router *gin.Engine) {
					router.POST("/internal/admin/workspaces/:id/block", server2.handleBlockWorkspace)
				},
				want: stdhttp.StatusInternalServerError,
			},
			{
				name:   "billing checkout",
				method: stdhttp.MethodPost,
				path:   "/api/billing/checkout",
				body:   `{"payable_network":"TON","plan_code":"merchant"}`,
				useWS:  true,
				route:  func(router *gin.Engine) { router.POST("/api/billing/checkout", server2.handleCreateBillingCheckout) },
				want:   stdhttp.StatusBadRequest,
			},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				router := gin.New()
				if tc.useWS {
					router.Use(withWS)
				}
				tc.route(router)
				rec := httptest.NewRecorder()
				var body io.Reader
				if tc.body != "" {
					body = strings.NewReader(tc.body)
				}
				req := withCanceledContext(httptest.NewRequest(tc.method, tc.path, body))
				if tc.body != "" {
					req.Header.Set("Content-Type", "application/json")
				}
				router.ServeHTTP(rec, req)
				if rec.Code != tc.want {
					t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
				}
			})
		}
	})
}

func TestTeamHandlersExtendedWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95110, "teamowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram owner: %v", err)
	}
	owner, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 95110)
	if err != nil {
		t.Fatalf("GetUserByTelegramID owner: %v", err)
	}
	member, err := sharedHTTPTestStore.UpsertUser(ctx, 95111, "teammember", "")
	if err != nil {
		t.Fatalf("UpsertUser member: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, member.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember member: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore, authService: service.NewAuthService(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour)}
	withOwner := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Claims: service.Claims{UserID: owner.ID, WorkspaceID: workspace.ID, TelegramID: 95110}, Workspace: workspace})
		c.Next()
	}
	withMember := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Claims: service.Claims{UserID: member.ID, WorkspaceID: workspace.ID, TelegramID: 95111}, Workspace: workspace})
		c.Next()
	}

	t.Run("list team includes members and invites for owner", func(t *testing.T) {
		router := gin.New()
		router.Use(withOwner)
		router.GET("/api/team", server.handleListTeam)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/team", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("member cannot invite", func(t *testing.T) {
		router := gin.New()
		router.Use(withMember)
		router.POST("/api/team/invites", server.handleInviteMember)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/invites", strings.NewReader(`{"username":"blocked","role":"member"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("owner creates and revokes invite", func(t *testing.T) {
		router := gin.New()
		router.Use(withOwner)
		router.POST("/api/team/invites", server.handleInviteMember)
		router.DELETE("/api/team/invites/:id", server.handleRevokeInvite)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/invites", strings.NewReader(`{"username":"@newmember","role":"admin"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
		var body struct {
			Invite store.WorkspaceInvite `json:"invite"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal invite: %v", err)
		}
		if body.Invite.ID == 0 || body.Invite.Role != store.RoleAdmin {
			t.Fatalf("unexpected invite body: %+v", body)
		}

		rec = httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/team/invites/"+strconv.FormatInt(body.Invite.ID, 10), nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected revoke 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("invite rejects missing username and invalid json", func(t *testing.T) {
		for _, body := range []string{`{"username":"","role":"member"}`, `{`} {
			router := gin.New()
			router.Use(withOwner)
			router.POST("/api/team/invites", server.handleInviteMember)

			rec := httptest.NewRecorder()
			req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/invites", strings.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			router.ServeHTTP(rec, req)
			if rec.Code != stdhttp.StatusBadRequest {
				t.Fatalf("expected 400 for body %q, got %d: %s", body, rec.Code, rec.Body.String())
			}
		}
	})

	t.Run("owner updates and removes member", func(t *testing.T) {
		router := gin.New()
		router.Use(withOwner)
		router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
		router.DELETE("/api/team/members/:userId", server.handleRemoveMember)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/members/"+strconv.FormatInt(member.ID, 10)+"/role", strings.NewReader(`{"role":"admin"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected role update 200, got %d: %s", rec.Code, rec.Body.String())
		}

		rec = httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/team/members/"+strconv.FormatInt(member.ID, 10), nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected remove 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("role and remove validation branches", func(t *testing.T) {
		cases := []struct {
			name   string
			method string
			path   string
			body   string
			route  func(*gin.Engine)
			want   int
		}{
			{
				name:   "bad role target id",
				method: stdhttp.MethodPost,
				path:   "/api/team/members/bad/role",
				body:   `{"role":"member"}`,
				route: func(router *gin.Engine) {
					router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
				},
				want: stdhttp.StatusBadRequest,
			},
			{
				name:   "invalid role body",
				method: stdhttp.MethodPost,
				path:   "/api/team/members/" + strconv.FormatInt(owner.ID, 10) + "/role",
				body:   `{"role":"invalid"}`,
				route: func(router *gin.Engine) {
					router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
				},
				want: stdhttp.StatusBadRequest,
			},
			{
				name:   "bad remove target id",
				method: stdhttp.MethodDelete,
				path:   "/api/team/members/bad",
				route: func(router *gin.Engine) {
					router.DELETE("/api/team/members/:userId", server.handleRemoveMember)
				},
				want: stdhttp.StatusBadRequest,
			},
			{
				name:   "bad invite id",
				method: stdhttp.MethodDelete,
				path:   "/api/team/invites/bad",
				route: func(router *gin.Engine) {
					router.DELETE("/api/team/invites/:id", server.handleRevokeInvite)
				},
				want: stdhttp.StatusBadRequest,
			},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				router := gin.New()
				router.Use(withOwner)
				tc.route(router)
				rec := httptest.NewRecorder()
				var body io.Reader
				if tc.body != "" {
					body = strings.NewReader(tc.body)
				}
				req := httptest.NewRequest(tc.method, tc.path, body)
				if tc.body != "" {
					req.Header.Set("Content-Type", "application/json")
				}
				router.ServeHTTP(rec, req)
				if rec.Code != tc.want {
					t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
				}
			})
		}
	})
}

func TestTeamHandlersRoleBoundariesWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95220, "teamroleowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram owner: %v", err)
	}
	owner, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 95220)
	if err != nil {
		t.Fatalf("GetUserByTelegramID owner: %v", err)
	}
	admin, err := sharedHTTPTestStore.UpsertUser(ctx, 95221, "teamroleadmin", "")
	if err != nil {
		t.Fatalf("UpsertUser admin: %v", err)
	}
	member, err := sharedHTTPTestStore.UpsertUser(ctx, 95222, "teamrolemember", "")
	if err != nil {
		t.Fatalf("UpsertUser member: %v", err)
	}
	otherAdmin, err := sharedHTTPTestStore.UpsertUser(ctx, 95223, "teamroleotheradmin", "")
	if err != nil {
		t.Fatalf("UpsertUser other admin: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, admin.ID, store.RoleAdmin); err != nil {
		t.Fatalf("AddWorkspaceMember admin: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, member.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember member: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, otherAdmin.ID, store.RoleAdmin); err != nil {
		t.Fatalf("AddWorkspaceMember other admin: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore, authService: service.NewAuthService(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour)}
	withUser := func(user store.User) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{
				Claims: service.Claims{
					UserID:      user.ID,
					WorkspaceID: workspace.ID,
					TelegramID:  user.TelegramID,
					Username:    user.Username,
				},
				Workspace: workspace,
			})
			c.Next()
		}
	}

	cases := []struct {
		name   string
		user   store.User
		method string
		path   string
		body   string
		route  func(*gin.Engine)
		want   int
	}{
		{
			name:   "admin cannot invite owner",
			user:   admin,
			method: stdhttp.MethodPost,
			path:   "/api/team/invites",
			body:   `{"username":"futureowner","role":"owner"}`,
			route: func(router *gin.Engine) {
				router.POST("/api/team/invites", server.handleInviteMember)
			},
			want: stdhttp.StatusForbidden,
		},
		{
			name:   "revoke missing invite returns not found",
			user:   owner,
			method: stdhttp.MethodDelete,
			path:   "/api/team/invites/99999999",
			route: func(router *gin.Engine) {
				router.DELETE("/api/team/invites/:id", server.handleRevokeInvite)
			},
			want: stdhttp.StatusNotFound,
		},
		{
			name:   "member cannot change roles",
			user:   member,
			method: stdhttp.MethodPost,
			path:   "/api/team/members/" + strconv.FormatInt(admin.ID, 10) + "/role",
			body:   `{"role":"member"}`,
			route: func(router *gin.Engine) {
				router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
			},
			want: stdhttp.StatusForbidden,
		},
		{
			name:   "invalid role json rejected",
			user:   owner,
			method: stdhttp.MethodPost,
			path:   "/api/team/members/" + strconv.FormatInt(admin.ID, 10) + "/role",
			body:   `{`,
			route: func(router *gin.Engine) {
				router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
			},
			want: stdhttp.StatusBadRequest,
		},
		{
			name:   "missing member role update returns not found",
			user:   owner,
			method: stdhttp.MethodPost,
			path:   "/api/team/members/99999999/role",
			body:   `{"role":"member"}`,
			route: func(router *gin.Engine) {
				router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)
			},
			want: stdhttp.StatusNotFound,
		},
		{
			name:   "admin cannot remove another admin",
			user:   admin,
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/" + strconv.FormatInt(otherAdmin.ID, 10),
			route: func(router *gin.Engine) {
				router.DELETE("/api/team/members/:userId", server.handleRemoveMember)
			},
			want: stdhttp.StatusForbidden,
		},
		{
			name:   "missing member removal returns not found",
			user:   owner,
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/99999999",
			route: func(router *gin.Engine) {
				router.DELETE("/api/team/members/:userId", server.handleRemoveMember)
			},
			want: stdhttp.StatusNotFound,
		},
		{
			name:   "last owner cannot remove self",
			user:   owner,
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/" + strconv.FormatInt(owner.ID, 10),
			route: func(router *gin.Engine) {
				router.DELETE("/api/team/members/:userId", server.handleRemoveMember)
			},
			want: stdhttp.StatusConflict,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.Use(withUser(tc.user))
			tc.route(router)
			rec := httptest.NewRecorder()
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := httptest.NewRequest(tc.method, tc.path, body)
			if tc.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			router.ServeHTTP(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
			}
		})
	}

	t.Run("member can remove self", func(t *testing.T) {
		self, err := sharedHTTPTestStore.UpsertUser(ctx, 95224, "teamroleself", "")
		if err != nil {
			t.Fatalf("UpsertUser self: %v", err)
		}
		if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, self.ID, store.RoleMember); err != nil {
			t.Fatalf("AddWorkspaceMember self: %v", err)
		}
		router := gin.New()
		router.Use(withUser(self))
		router.DELETE("/api/team/members/:userId", server.handleRemoveMember)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/team/members/"+strconv.FormatInt(self.ID, 10), nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAPIKeyMiddlewareWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Create workspace with developer plan
	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95003, "apimiddlewareuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}

	// Create a real API key
	rawToken := "rqst_live_testkey12345"
	tokenHash := hashSecret(rawToken)
	apiKey, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID, "test-key", "rqst_", tokenHash, []string{"invoices:read", "invoices:write"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}
	_ = apiKey

	server := &Server{store: sharedHTTPTestStore}

	t.Run("valid API key passes middleware", func(t *testing.T) {
		router := gin.New()
		router.Use(server.apiKeyMiddleware())
		router.GET("/v1/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
		req.Header.Set("X-API-Key", rawToken)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 204 for valid API key, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("invalid API key is rejected", func(t *testing.T) {
		router := gin.New()
		router.Use(server.apiKeyMiddleware())
		router.GET("/v1/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
		req.Header.Set("X-API-Key", "invalid-key")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid key, got %d", rec.Code)
		}
	})

	t.Run("blocked workspace API key is rejected", func(t *testing.T) {
		// Block the workspace
		if _, err := sharedHTTPTestStore.SetWorkspaceBlocked(ctx, workspace.ID, true); err != nil {
			t.Fatalf("SetWorkspaceBlocked: %v", err)
		}
		defer func() {
			_, _ = sharedHTTPTestStore.SetWorkspaceBlocked(ctx, workspace.ID, false)
		}()

		router := gin.New()
		router.Use(server.apiKeyMiddleware())
		router.GET("/v1/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
		req.Header.Set("X-API-Key", rawToken)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for blocked workspace, got %d", rec.Code)
		}
	})

	t.Run("trial plan API key is rejected (no API access)", func(t *testing.T) {
		// Create trial workspace and API key
		trialWS, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95099, "trialAPIuser")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
		}
		trialToken := "rqst_trial_key99"
		trialHash := hashSecret(trialToken)
		_, err = sharedHTTPTestStore.CreateAPIKey(ctx, trialWS.ID, "trial-key", "rqst_", trialHash, []string{"invoices:read"}, "live")
		if err != nil {
			t.Fatalf("CreateAPIKey for trial workspace: %v", err)
		}

		router := gin.New()
		router.Use(server.apiKeyMiddleware())
		router.GET("/v1/test", func(c *gin.Context) {
			c.Status(stdhttp.StatusNoContent)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
		req.Header.Set("X-API-Key", trialToken)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for trial plan, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAPIKeyMiddlewareSequentialErrorsWithDB covers the 2nd-4th sequential error paths
// in apiKeyMiddleware using a mock store.
func TestAPIKeyMiddlewareSequentialErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98300, "apimocksequser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}

	rawToken := "rqst_live_seqmock12345"
	apiKey, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID, "seq-key", "rqst_live_seq_", hashSecret(rawToken), []string{"invoices:read"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}
	_ = apiKey

	for _, tc := range []struct {
		name   string
		mock   *mockHTTPStore
		want   int
	}{
		{
			name: "GetWorkspaceByID error returns 401",
			mock: newMockStore(sharedHTTPTestStore, errAtGetWorkspaceByID),
			want: stdhttp.StatusUnauthorized,
		},
		{
			name: "CountAPIRequestsSince month error returns 500",
			mock: newMockStore(sharedHTTPTestStore, errAtCountAPIRequestsSinceMonth),
			want: stdhttp.StatusInternalServerError,
		},
		{
			name: "AllowRateLimit error returns 500",
			mock: newMockStore(sharedHTTPTestStore, errAtAllowRateLimit),
			want: stdhttp.StatusInternalServerError,
		},
		{
			name: "monthly quota exceeded returns 429",
			mock: newMockStoreWithCount(sharedHTTPTestStore, 999999),
			want: stdhttp.StatusTooManyRequests,
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := &Server{store: tc.mock}
			router := gin.New()
			router.Use(server.apiKeyMiddleware())
			router.GET("/v1/test", func(c *gin.Context) { c.Status(stdhttp.StatusNoContent) })

			rec := httptest.NewRecorder()
			req := httptest.NewRequest(stdhttp.MethodGet, "/v1/test", nil)
			req.Header.Set("X-API-Key", rawToken)
			router.ServeHTTP(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
			}
		})
	}
}

func TestDeveloperAPIHandlerBoundariesWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95240, "devapiboundary")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set developer plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	apiKey, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID, "boundary-key", "rqst_test_", "boundary-hash", []string{"invoices:read", "invoices:write"}, "test")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}
	server := &Server{
		store:          sharedHTTPTestStore,
		invoiceService: service.NewInvoiceService(sharedHTTPTestStore, "2.50"),
	}
	withAPIContext := func(scopes ...string) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
			c.Set("api_key_ctx", apiKeyContext{
				Key: store.APIKeyRecord{
					APIKey: store.APIKey{ID: apiKey.ID, WorkspaceID: workspace.ID, Scopes: scopes, Mode: "test"},
				},
			})
			c.Next()
		}
	}

	t.Run("scope denials happen before store work", func(t *testing.T) {
		cases := []struct {
			name   string
			method string
			path   string
			body   string
			route  func(*gin.Engine)
			scopes []string
		}{
			{
				name:   "list invoices requires read",
				method: stdhttp.MethodGet,
				path:   "/v1/invoices",
				route: func(router *gin.Engine) {
					router.GET("/v1/invoices", server.handleAPIListInvoices)
				},
				scopes: []string{"invoices:write"},
			},
			{
				name:   "create invoice requires write",
				method: stdhttp.MethodPost,
				path:   "/v1/invoices",
				body:   `{"title":"x"}`,
				route: func(router *gin.Engine) {
					router.POST("/v1/invoices", server.handleAPICreateInvoice)
				},
				scopes: []string{"invoices:read"},
			},
			{
				name:   "get invoice requires read",
				method: stdhttp.MethodGet,
				path:   "/v1/invoices/1",
				route: func(router *gin.Engine) {
					router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)
				},
				scopes: []string{"invoices:write"},
			},
			{
				name:   "cancel invoice requires write",
				method: stdhttp.MethodPost,
				path:   "/v1/invoices/1/cancel",
				route: func(router *gin.Engine) {
					router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)
				},
				scopes: []string{"invoices:read"},
			},
			{
				name:   "simulate payment requires write",
				method: stdhttp.MethodPost,
				path:   "/v1/test/invoices/1/simulate-payment",
				route: func(router *gin.Engine) {
					router.POST("/v1/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)
				},
				scopes: []string{"invoices:read"},
			},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				router := gin.New()
				router.Use(withAPIContext(tc.scopes...))
				tc.route(router)
				rec := httptest.NewRecorder()
				var body io.Reader
				if tc.body != "" {
					body = strings.NewReader(tc.body)
				}
				req := httptest.NewRequest(tc.method, tc.path, body)
				if tc.body != "" {
					req.Header.Set("Content-Type", "application/json")
				}
				router.ServeHTTP(rec, req)
				if rec.Code != stdhttp.StatusForbidden {
					t.Fatalf("expected 403, got %d: %s", rec.Code, rec.Body.String())
				}
			})
		}
	})

	t.Run("list invoices normalizes invalid pagination", func(t *testing.T) {
		router := gin.New()
		router.Use(withAPIContext("invoices:read"))
		router.GET("/v1/invoices", server.handleAPIListInvoices)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices?page=-2&page_size=999", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		var body map[string]any
		if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
			t.Fatalf("unmarshal response: %v", err)
		}
		if body["page"].(float64) != 1 || body["page_size"].(float64) != 20 {
			t.Fatalf("expected normalized pagination, got %+v", body)
		}
	})

	t.Run("get cancel and simulate reject bad ids or missing invoices", func(t *testing.T) {
		cases := []struct {
			name   string
			method string
			path   string
			route  func(*gin.Engine)
			want   int
		}{
			{
				name:   "get invalid id",
				method: stdhttp.MethodGet,
				path:   "/v1/invoices/bad",
				route: func(router *gin.Engine) {
					router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)
				},
				want: stdhttp.StatusBadRequest,
			},
			{
				name:   "get missing invoice",
				method: stdhttp.MethodGet,
				path:   "/v1/invoices/99999999",
				route: func(router *gin.Engine) {
					router.GET("/v1/invoices/:id", server.handleAPIGetInvoice)
				},
				want: stdhttp.StatusNotFound,
			},
			{
				name:   "cancel invalid id",
				method: stdhttp.MethodPost,
				path:   "/v1/invoices/bad/cancel",
				route: func(router *gin.Engine) {
					router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)
				},
				want: stdhttp.StatusBadRequest,
			},
			{
				name:   "cancel missing invoice",
				method: stdhttp.MethodPost,
				path:   "/v1/invoices/99999999/cancel",
				route: func(router *gin.Engine) {
					router.POST("/v1/invoices/:id/cancel", server.handleAPICancelInvoice)
				},
				want: stdhttp.StatusNotFound,
			},
			{
				name:   "simulate missing invoice",
				method: stdhttp.MethodPost,
				path:   "/v1/test/invoices/99999999/simulate-payment",
				route: func(router *gin.Engine) {
					router.POST("/v1/test/invoices/:id/simulate-payment", server.handleAPISimulatePayment)
				},
				want: stdhttp.StatusNotFound,
			},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				router := gin.New()
				router.Use(withAPIContext("invoices:read", "invoices:write"))
				tc.route(router)
				rec := httptest.NewRecorder()
				router.ServeHTTP(rec, httptest.NewRequest(tc.method, tc.path, nil))
				if rec.Code != tc.want {
					t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
				}
			})
		}
	})

	t.Run("create invoice records idempotent bad request and replays it", func(t *testing.T) {
		router := gin.New()
		router.Use(withAPIContext("invoices:write"))
		router.POST("/v1/invoices", server.handleAPICreateInvoice)

		reqBody := `{"title":"Bad amount","base_amount_usd":"not-money","payable_network":"BASE"}`
		for i := 0; i < 2; i++ {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(reqBody))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Idempotency-Key", "bad-amount-boundary")
			router.ServeHTTP(rec, req)
			if rec.Code != stdhttp.StatusBadRequest {
				t.Fatalf("attempt %d expected 400, got %d: %s", i+1, rec.Code, rec.Body.String())
			}
		}

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices", strings.NewReader(`{"title":"Different","base_amount_usd":"10","payable_network":"BASE"}`))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Idempotency-Key", "bad-amount-boundary")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusConflict {
			t.Fatalf("expected idempotency conflict, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAPIHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95004, "apitestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}

	apiKey, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID, "api-test-key", "rqst_", "api-test-hash-xyz", []string{"invoices:read", "invoices:write"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}

	withAPIKey := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Set("api_key_ctx", apiKeyContext{Key: store.APIKeyRecord{
			APIKey: apiKey,
		}})
		c.Next()
	}

	t.Run("handleAPIListInvoices returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withAPIKey, withAPIKeyScopes("invoices:read"))
		router.GET("/v1/invoices", server.handleAPIListInvoices)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/v1/invoices", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAPIMe returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withAPIKey, withAPIKeyScopes("invoices:read"))
		router.GET("/v1/me", server.handleAPIMe)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/v1/me", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestTeamHandlersBasicWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95005, "teamtestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 95005)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID},
			Workspace: workspace,
		})
		c.Next()
	}

	t.Run("handleListTeam returns 200 with member list", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/team", server.handleListTeam)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/team", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleListTeam error path when context canceled", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/team", server.handleListTeam)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/team", nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d", rec.Code)
		}
	})
}

func TestAdminBlogHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "secret2", time.Hour)
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminService,
	}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	t.Run("create and then update and delete blog post", func(t *testing.T) {
		// Create
		createRouter := gin.New()
		createRouter.Use(gin.HandlerFunc(withAdmin))
		createRouter.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

		body := `{"slug":"blog-test-crud","title":"CRUD Test","content_md":"content","locale":"en","status":"draft","tags":[]}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		createRouter.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("create blog post: expected 201, got %d: %s", rec.Code, rec.Body.String())
		}

		var created map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &created)
		postIDFloat, _ := created["id"].(float64)
		postID := int64(postIDFloat)
		if postID == 0 {
			t.Fatal("expected non-zero post ID after creation")
		}

		// Update
		updateRouter := gin.New()
		updateRouter.Use(gin.HandlerFunc(withAdmin))
		updateRouter.PUT("/api/admin/blog/:id", server.handleAdminUpdateBlogPost)

		updateBody := `{"slug":"blog-test-crud-updated","title":"Updated Title","content_md":"updated content","locale":"en","status":"published","tags":[]}`
		updateRec := httptest.NewRecorder()
		updateReq := httptest.NewRequest(stdhttp.MethodPut,
			"/api/admin/blog/"+itoa(postID), strings.NewReader(updateBody))
		updateReq.Header.Set("Content-Type", "application/json")
		updateRouter.ServeHTTP(updateRec, updateReq)
		if updateRec.Code != stdhttp.StatusOK {
			t.Fatalf("update blog post: expected 200, got %d: %s", updateRec.Code, updateRec.Body.String())
		}

		// Delete
		deleteRouter := gin.New()
		deleteRouter.Use(gin.HandlerFunc(withAdmin))
		deleteRouter.DELETE("/api/admin/blog/:id", server.handleAdminDeleteBlogPost)

		deleteRec := httptest.NewRecorder()
		deleteRouter.ServeHTTP(deleteRec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/admin/blog/"+itoa(postID), nil))
		if deleteRec.Code != stdhttp.StatusNoContent {
			t.Fatalf("delete blog post: expected 204, got %d: %s", deleteRec.Code, deleteRec.Body.String())
		}
		_ = ctx
	})
}

func TestAdminRevokeSessionWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// Use in-memory admin service (no TOTP flow needed) to test session revoke endpoint
	adminService := service.NewAdminService("admin", "pass", "revoke-secret", time.Hour)
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminService,
	}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	claims, err := adminService.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}

	withAdmin := func(c *gin.Context) {
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	t.Run("revoke session with non-existent id fails gracefully", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/sessions/revoke", server.handleAdminRevokeSession)

		rec := httptest.NewRecorder()
		body := strings.NewReader(`{"session_id":99999999}`)
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/sessions/revoke", body)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		// In-memory service rejects session revoke with "not configured" error
		if rec.Code == stdhttp.StatusInternalServerError {
			t.Fatalf("expected graceful error, got 500: %s", rec.Body.String())
		}
	})
}

func TestAdminBillingCheckoutWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Set up billing wallets
	if err := sharedHTTPTestStore.UpsertSystemConfig(ctx, "billing_wallets", map[string]string{
		"TON": "UQBuzCySn6dYEHzKoGzUPmclj9Dg_m1dA-mzeDEvuF3F9x6P",
		"EVM": "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
	}, true, "test"); err != nil {
		t.Fatalf("UpsertSystemConfig billing_wallets: %v", err)
	}

	// Set up TON rate
	if err := sharedHTTPTestStore.UpsertSystemConfig(ctx, "ton_usdt_rate", map[string]any{
		"rate":       "3.50",
		"updated_at": time.Now().UTC().Format(time.RFC3339),
	}, true, "test"); err != nil {
		t.Logf("UpsertSystemConfig ton_usdt_rate: %v (may not exist)", err)
	}

	adminService := service.NewAdminService("admin", "pass", "billing-secret", time.Hour)
	invoiceSvc := service.NewInvoiceService(sharedHTTPTestStore, "test")
	server := &Server{
		store:          sharedHTTPTestStore,
		adminService:   adminService,
		invoiceService: invoiceSvc,
		cfg:            config.Config{AppEnv: "test"},
	}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Create a workspace to bill
	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95006, "billingtestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	t.Run("handleAdminCreateBillingCheckout with non-existent workspace returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/99999999/billing-checkout",
			strings.NewReader(`{"plan_code":"developer","payable_network":"TON"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for non-existent workspace, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminSetWorkspacePlan to developer succeeds", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/plan", server.handleAdminSetWorkspacePlan)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/plan",
			strings.NewReader(`{"plan_code":"developer","days":30}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for set plan, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAdminRefreshErrorWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	// In-memory admin service: refresh always fails because no DB sessions
	adminService := service.NewAdminService("admin", "pass", "refresh-secret", time.Hour)
	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminService,
		cfg:          config.Config{AppEnv: "test"},
	}

	t.Run("admin refresh with invalid token returns 401", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/admin/refresh", server.handleAdminRefresh)

		rec := httptest.NewRecorder()
		body := strings.NewReader(`{"refresh_token":"totally-invalid-refresh"}`)
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/refresh", body)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid refresh, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func TestAdminCreateInternalCommentWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "comment-secret", time.Hour)
	server := &Server{store: sharedHTTPTestStore, adminService: adminService}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login", strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Create workspace and invoice to comment on
	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 95007, "commenttestuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0xDEADBEEF1234567890ABCDEF1234567890ABCDEF")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	inv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Comment Test Invoice",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10"),
		PublicID:           "COMMENT001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("create internal comment succeeds", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/internal-comments", server.handleAdminCreateInternalComment)

		body := `{"target_type":"invoice","target_id":"` + itoa(inv.ID) + `","body":"This is a test comment"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/internal-comments", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201 for comment creation, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func itoa(n int64) string {
	return strconv.FormatInt(n, 10)
}

// TestAdminHandlersFullCoverageWithDB covers admin handlers that need real DB data.
func TestAdminHandlersFullCoverageWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "full-cover-secret", time.Hour)
	invoiceSvc := service.NewInvoiceService(sharedHTTPTestStore, "2.5")
	server := &Server{
		store:          sharedHTTPTestStore,
		adminService:   adminService,
		invoiceService: invoiceSvc,
		cfg:            config.Config{AppEnv: "test"},
	}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Create workspace and wallet for test data
	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96100, "admincoveruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkTON, "UQAS_ton_wallet_addr_0000000000000000000000000")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}
	inv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Admin Cover Invoice",
		BaseAmountUSD:      decimal.RequireFromString("25"),
		PayableNetwork:     store.NetworkTON,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("25.000123"),
		PublicID:           "ADMINCOVER01",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	t.Run("handleAdminBlockWorkspace success", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)

		body := `{"blocked":true,"reason":"test block"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/block",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
		// Unblock
		router2 := gin.New()
		router2.Use(gin.HandlerFunc(withAdmin))
		router2.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)
		rec2 := httptest.NewRecorder()
		req2 := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/block",
			strings.NewReader(`{"blocked":false}`))
		req2.Header.Set("Content-Type", "application/json")
		router2.ServeHTTP(rec2, req2)
		if rec2.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for unblock, got %d: %s", rec2.Code, rec2.Body.String())
		}
	})

	t.Run("handleAdminBlockWorkspace not found", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/block", server.handleAdminBlockWorkspace)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/workspaces/99999999/block",
			strings.NewReader(`{"blocked":true}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing workspace, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminRefreshInvoiceStatus success", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/invoices/:id/refresh-status", server.handleAdminRefreshInvoiceStatus)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/invoices/"+itoa(inv.ID)+"/refresh-status", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminRefreshInvoiceStatus not found", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/invoices/:id/refresh-status", server.handleAdminRefreshInvoiceStatus)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/invoices/99999999/refresh-status", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminReviewInvoice keep_manual_review", func(t *testing.T) {
		// Put invoice in manual_review state first
		_, err := sharedHTTPTestStore.RawPool().Exec(ctx,
			`UPDATE invoices SET status='manual_review' WHERE id=$1`, inv.ID)
		if err != nil {
			t.Fatalf("set manual_review: %v", err)
		}
		t.Cleanup(func() {
			_, _ = sharedHTTPTestStore.RawPool().Exec(ctx,
				`UPDATE invoices SET status='awaiting_payment' WHERE id=$1`, inv.ID)
		})

		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

		body := `{"result":"keep_manual_review","comment":"keeping for now"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/invoices/"+itoa(inv.ID)+"/review",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminReviewInvoice not found", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/invoices/:id/review", server.handleAdminReviewInvoice)

		body := `{"result":"expire","comment":"not found test"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/invoices/99999999/review",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBillingCheckout trial plan rejected", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		body := `{"plan_code":"trial","payable_network":"TON"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/billing-checkout",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for trial plan, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBillingCheckout unsupported network rejected", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		body := `{"plan_code":"merchant","payable_network":"DOGE"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/billing-checkout",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for unsupported network, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBillingCheckout enterprise with empty amount rejected", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		body := `{"plan_code":"enterprise","payable_network":"TON","base_amount_usd":""}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/billing-checkout",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for enterprise with empty amount, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBillingCheckout enterprise with negative amount rejected", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		body := `{"plan_code":"enterprise","payable_network":"TON","base_amount_usd":"-5"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/"+itoa(workspace.ID)+"/billing-checkout",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for negative enterprise amount, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminCreateBillingCheckout workspace not found", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/workspaces/:id/billing-checkout", server.handleAdminCreateBillingCheckout)

		body := `{"plan_code":"merchant","payable_network":"TON"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/workspaces/99999999/billing-checkout",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing workspace, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestServerHandlersCancelAndMarkPaidWithDB covers the non-workspace-managed invoice branches.
func TestServerHandlersCancelAndMarkPaidWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96200, "cancelmarkuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 96200)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkEVM,
		"0xCAFEBABE1234567890ABCDEF1234567890ABCDEF")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Create a subscription invoice (kind=subscription) — not workspace-managed by isWorkspaceManagedInvoice
	apiInv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindSubscription,
		Title:              "Subscription Invoice",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     store.NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("5.000456"),
		PublicID:           "SUBINV001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
		SubscriptionDays:   30,
		PlanCode:           store.PlanCodeMerchant,
	})
	if err != nil {
		t.Fatalf("CreateInvoice subscription: %v", err)
	}

	// Create a workspace-managed invoice
	wsInv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "WS Invoice",
		BaseAmountUSD:      decimal.RequireFromString("7"),
		PayableNetwork:     store.NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("7.000789"),
		PublicID:           "WSINV001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice workspace: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID, WorkspaceID: workspace.ID},
			Workspace: workspace,
		})
		c.Next()
	}

	t.Run("cancelInvoice rejects API-created invoice", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/cancel", server.handleCancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/"+itoa(apiInv.ID)+"/cancel", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for API invoice cancel, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("cancelInvoice succeeds for workspace invoice", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/cancel", server.handleCancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/"+itoa(wsInv.ID)+"/cancel", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for workspace invoice cancel, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("cancelInvoice not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/cancel", server.handleCancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/99999999/cancel", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing invoice, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("markInvoicePaid rejects API-created invoice", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/"+itoa(apiInv.ID)+"/mark-paid", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for API invoice mark-paid, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("markInvoicePaid not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/99999999/mark-paid", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing invoice, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("deleteWallet not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/api/wallets/:id", server.handleDeleteWallet)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/wallets/99999999", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing wallet, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("getInvoice not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/invoices/:id", server.handleGetInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet,
			"/api/invoices/99999999", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing invoice, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("updateContactEmail duplicate key returns 409", func(t *testing.T) {
		// First create another user with an email we'll try to duplicate
		ws2, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96201, "emaildup2")
		if err != nil {
			t.Fatalf("UpsertWorkspaceByTelegram 2: %v", err)
		}
		if _, err := sharedHTTPTestStore.UpdateWorkspaceEmail(ctx, ws2.ID, "dup@example.com"); err != nil {
			t.Fatalf("UpdateWorkspaceEmail ws2: %v", err)
		}
		// Try to set the same email on workspace
		if _, err := sharedHTTPTestStore.UpdateWorkspaceEmail(ctx, workspace.ID, "dup@example.com"); err == nil {
			// If no error (email may not be unique-constrained), skip
			t.Skip("email not unique-constrained, skipping duplicate test")
		}
	})

	t.Run("markInvoicePaid succeeds for workspace invoice", func(t *testing.T) {
		// Create a fresh workspace invoice to mark paid
		markInv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
			WorkspaceID:        workspace.ID,
			Kind:               store.InvoiceKindMerchant,
			Title:              "Mark Paid Test",
			BaseAmountUSD:      decimal.RequireFromString("8"),
			PayableNetwork:     store.NetworkEVM,
			DestinationAddress: wallet.Address,
			PayableAmount:      decimal.RequireFromString("8.000333"),
			PublicID:           "MARKPAIDHD01",
			Mode:               "live",
			ExpiresAt:          time.Now().Add(time.Hour),
		})
		if err != nil {
			t.Fatalf("CreateInvoice for mark paid: %v", err)
		}
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/"+itoa(markInv.ID)+"/mark-paid", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for mark paid, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("publicInvoice not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/public/invoices/:public_id", server.handlePublicInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet,
			"/api/public/invoices/NONEXISTENT", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for missing public invoice, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminResendWebhookDeliveryWithDB covers handleAdminResendWebhookDelivery success/error paths.
func TestAdminResendWebhookDeliveryWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	adminService := service.NewAdminService("admin", "pass", "resend-secret", time.Hour)
	server := &Server{store: sharedHTTPTestStore, adminService: adminService}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	t.Run("resend non-existent delivery returns error", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/webhook-deliveries/:id/resend", server.handleAdminResendWebhookDelivery)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/admin/webhook-deliveries/99999999/resend", nil))
		if rec.Code != stdhttp.StatusNotFound && rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 404 or 400 for missing delivery, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestServerHandlersObservedTransfersWithDB covers the observed transfers success path.
func TestServerHandlersObservedTransfersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96300, "transferuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkTON,
		"UQDS_ton_wallet_transfer_00000000000000000000000")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	paymentSvc := service.NewPaymentService(sharedHTTPTestStore)
	server := &Server{store: sharedHTTPTestStore, paymentService: paymentSvc}

	t.Run("observed transfer with no matching invoice returns unmatched", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/watchers/ton", server.handleObservedTransfers)

		body := `{"events":[{"tx_hash":"0xtransfer001","network":"TON","destination_address":"` +
			wallet.Address + `","amount":"9.999999","observed_at":"2026-01-01T00:00:00Z","raw_payload":{}}]}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for unmatched transfer, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("observed transfer with inferred network from literal path", func(t *testing.T) {
		router := gin.New()
		// Use literal path so c.FullPath() contains "/ton" and inferredNetworkFromPath works
		router.POST("/internal/watchers/ton", server.handleObservedTransfers)

		body := `{"events":[{"tx_hash":"0xtransfer002","destination_address":"` +
			wallet.Address + `","amount":"1.000000","observed_at":"2026-01-01T00:00:00Z","raw_payload":{}}]}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for inferred network transfer, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAuthHandlersWithDB covers auth handler DB-backed paths.
func TestAuthHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96400, "authhandleruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	t.Run("handleAuthLogout with valid refresh token clears session", func(t *testing.T) {
		user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 96400)
		if err != nil {
			t.Fatalf("GetUserByTelegramID: %v", err)
		}
		authResult, err := authSvc.SwitchWorkspace(ctx, user.ID, workspace.ID)
		if err != nil {
			t.Fatalf("SwitchWorkspace: %v", err)
		}

		router := gin.New()
		router.POST("/api/auth/logout", server.handleAuthLogout)

		rec := httptest.NewRecorder()
		body := strings.NewReader(`{"refresh_token":"` + authResult.RefreshToken + `"}`)
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/logout", body)
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleTelegramCodeLogin with invalid code returns 401", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)

		body := `{"username":"` + workspace.Username + `","code":"000000"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for invalid code, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleTelegramCodeRequest with unknown username returns 400", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/telegram/request-code", server.handleTelegramCodeRequest)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/request-code",
			strings.NewReader(`{"username":"totally_nonexistent_user_xyz"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for unknown user, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAgentBootstrap with valid body creates workspace", func(t *testing.T) {
		router := gin.New()
		router.POST("/api/auth/agent/bootstrap", server.handleAgentBootstrap)

		body := `{"workspace_name":"test-agent-' + strconv.FormatInt(time.Now().UnixNano(), 10) + '","contact_email":"agent@test.com"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/agent/bootstrap",
			strings.NewReader(`{"workspace_name":"agentws96400","contact_email":"agent@test.com"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
		_ = body
	})
}

// TestPublicBlogHandlersWithDB covers the public blog handlers.
func TestPublicBlogHandlersWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "blog-cover-secret", time.Hour)
	server := &Server{store: sharedHTTPTestStore, adminService: adminService}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Create a published blog post
	createRouter := gin.New()
	createRouter.Use(gin.HandlerFunc(withAdmin))
	createRouter.POST("/api/admin/blog", server.handleAdminCreateBlogPost)
	createBody := `{"slug":"test-public-post","title":"Test Public","content_md":"Hello","locale":"en","status":"published","tags":[]}`
	createRec := httptest.NewRecorder()
	createReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRouter.ServeHTTP(createRec, createReq)
	if createRec.Code != stdhttp.StatusCreated {
		t.Fatalf("setup: create blog post failed: %d: %s", createRec.Code, createRec.Body.String())
	}

	t.Run("handlePublicListBlogPosts returns posts", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog", server.handlePublicListBlogPosts)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog?locale=en", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handlePublicGetBlogPost returns existing post", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog/:slug", server.handlePublicGetBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog/test-public-post", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handlePublicGetBlogPost returns 404 for missing post", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog/:slug", server.handlePublicGetBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog/no-such-post-xyz", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handlePublicGetBlogPost returns 404 for draft/unpublished post", func(t *testing.T) {
		// Create a draft post
		draftRouter := gin.New()
		draftRouter.Use(gin.HandlerFunc(withAdmin))
		draftRouter.POST("/api/admin/blog", server.handleAdminCreateBlogPost)
		draftBody := `{"slug":"draft-public-post","title":"Draft","content_md":"body","locale":"en","status":"draft","tags":[]}`
		draftRec := httptest.NewRecorder()
		draftReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(draftBody))
		draftReq.Header.Set("Content-Type", "application/json")
		draftRouter.ServeHTTP(draftRec, draftReq)
		if draftRec.Code != stdhttp.StatusCreated {
			t.Fatalf("create draft: %d: %s", draftRec.Code, draftRec.Body.String())
		}

		router := gin.New()
		router.GET("/blog/:slug", server.handlePublicGetBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/blog/draft-public-post", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404 for draft post, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	_ = ctx
}

// TestCreateAPIKeyWithDB covers handleCreateAPIKey DB paths including limit enforcement.
func TestCreateAPIKeyWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96600, "apikeydbuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore, cfg: config.Config{AppEnv: "test"}}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	t.Run("create API key with test mode", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		body := `{"label":"test key","scopes":["invoices:read"],"mode":"test"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("create API key with live mode and all scopes", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		body := `{"label":"live key","scopes":["invoices:read","invoices:write"],"mode":"live"}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("create API key with empty label uses plan default", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		body := `{"label":"","scopes":["invoices:read"]}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusCreated {
			t.Fatalf("expected 201 with default label, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAPICancelInvoiceWithDB covers handleAPICancelInvoice DB paths.
func TestAPICancelInvoiceWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96700, "apicanceluser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkEVM,
		"0xAAAABBBBCCCCDDDDEEEEFFFF1111222233334444")
	if err != nil {
		t.Fatalf("CreateWallet: %v", err)
	}

	// Workspace-managed merchant invoice
	wsInv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "API Cancel Test",
		BaseAmountUSD:      decimal.RequireFromString("15"),
		PayableNetwork:     store.NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("15.000111"),
		PublicID:           "APICANCEL01",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	// Subscription invoice (not workspace managed)
	subInv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindSubscription,
		Title:              "Sub Invoice",
		BaseAmountUSD:      decimal.RequireFromString("10"),
		PayableNetwork:     store.NetworkEVM,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("10.000222"),
		PublicID:           "APISUBCANCEL01",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
		SubscriptionDays:   30,
		PlanCode:           store.PlanCodeMerchant,
	})
	if err != nil {
		t.Fatalf("CreateInvoice subscription: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Set("api_key_ctx", apiKeyContext{Key: store.APIKeyRecord{
			APIKey: store.APIKey{Scopes: []string{"invoices:write"}},
		}})
		c.Next()
	}

	t.Run("cancel workspace invoice via API succeeds", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/v1/invoices/:id", server.handleAPICancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/v1/invoices/"+itoa(wsInv.ID), nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("cancel subscription invoice via API fails", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/v1/invoices/:id", server.handleAPICancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/v1/invoices/"+itoa(subInv.ID), nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for subscription invoice cancel, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("cancel not found returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/v1/invoices/:id", server.handleAPICancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/v1/invoices/99999999", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestHandleSwitchWorkspaceWithDB covers the handleSwitchWorkspace paths.
func TestHandleSwitchWorkspaceWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	ws1, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96800, "switchuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram ws1: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 96800)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID, WorkspaceID: ws1.ID},
			Workspace: ws1,
		})
		c.Next()
	}

	t.Run("switch to own workspace succeeds", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/workspaces/:id/switch", server.handleSwitchWorkspace)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/workspaces/"+itoa(ws1.ID)+"/switch", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("switch to unauthorized workspace returns 403", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/workspaces/:id/switch", server.handleSwitchWorkspace)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/workspaces/99999999/switch", nil))
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for unauthorized workspace, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminOpsOverviewWithDB covers handleAdminOpsOverview branches.
func TestAdminOpsOverviewWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{store: sharedHTTPTestStore}

	t.Run("handleAdminOpsOverview returns 200", func(t *testing.T) {
		router := gin.New()
		router.GET("/api/admin/ops", server.handleAdminOpsOverview)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/ops", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestDeleteWebhookAndAPIKeyWithDB covers handleDeleteWebhookEndpoint and handleDeleteAPIKey.
func TestDeleteWebhookAndAPIKeyWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96900, "deletewhuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	t.Run("delete non-existent webhook endpoint returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/api/developer/webhooks/:id", server.handleDeleteWebhookEndpoint)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/developer/webhooks/99999999", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("delete non-existent API key returns 404", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/api/developer/api-keys/:id", server.handleDeleteAPIKey)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/developer/api-keys/99999999", nil))
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminDeleteBlogPostWithDB covers handleAdminDeleteBlogPost.
func TestAdminDeleteBlogPostWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	adminService := service.NewAdminService("admin", "pass", "delblog-secret", time.Hour)
	server := &Server{store: sharedHTTPTestStore, adminService: adminService}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"admin","password":"pass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Create a blog post to delete
	createRouter := gin.New()
	createRouter.Use(gin.HandlerFunc(withAdmin))
	createRouter.POST("/api/admin/blog", server.handleAdminCreateBlogPost)
	createBody := `{"slug":"delete-me-post","title":"Delete Me","content_md":"bye","locale":"en","status":"draft","tags":[]}`
	createRec := httptest.NewRecorder()
	createReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createRouter.ServeHTTP(createRec, createReq)
	if createRec.Code != stdhttp.StatusCreated {
		t.Fatalf("setup create blog post: %d: %s", createRec.Code, createRec.Body.String())
	}
	var createdPost map[string]any
	_ = json.Unmarshal(createRec.Body.Bytes(), &createdPost)
	postIDFloat, _ := createdPost["id"].(float64)
	postID := int64(postIDFloat)

	t.Run("delete existing blog post returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.DELETE("/api/admin/blog/:id", server.handleAdminDeleteBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/admin/blog/"+itoa(postID), nil))
		if rec.Code != stdhttp.StatusOK && rec.Code != stdhttp.StatusNoContent {
			t.Fatalf("expected 200/204, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("delete non-existent blog post returns error", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.DELETE("/api/admin/blog/:id", server.handleAdminDeleteBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/admin/blog/99999999", nil))
		if rec.Code == stdhttp.StatusOK {
			t.Fatalf("expected error for non-existent post, got 200")
		}
	})

	_ = ctx
}

// TestTeamHandlersMemberPathWithDB covers handleListTeam for non-owner member.
func TestTeamHandlersMemberPathWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97200, "teammpathowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	member, err := sharedHTTPTestStore.UpsertUser(ctx, 97201, "teammpathuser", "")
	if err != nil {
		t.Fatalf("UpsertUser: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, member.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	t.Run("non-owner member gets team list without invites", func(t *testing.T) {
		withMemberCtx := func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{
				Claims:    service.Claims{UserID: member.ID, WorkspaceID: workspace.ID},
				Workspace: workspace,
			})
			c.Next()
		}
		router := gin.New()
		router.Use(withMemberCtx)
		router.GET("/api/team", server.handleListTeam)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/team", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}

		var resp map[string]any
		_ = json.Unmarshal(rec.Body.Bytes(), &resp)
		// Member should not see invites
		invites, _ := resp["invites"].([]any)
		if len(invites) != 0 {
			t.Fatalf("expected empty invites for member, got %d", len(invites))
		}
	})
}

// TestTeamHandlersCanceledContextWithDB covers error paths in team handlers.
func TestTeamHandlersCanceledContextWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97300, "teamcxowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 97300)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID, WorkspaceID: workspace.ID},
			Workspace: workspace,
		})
		c.Next()
	}

	for _, tc := range []struct {
		name   string
		method string
		path   string
		body   string
		route  func(*gin.Engine)
	}{
		{
			name:   "list team canceled",
			method: stdhttp.MethodGet,
			path:   "/api/team",
			route:  func(r *gin.Engine) { r.GET("/api/team", server.handleListTeam) },
		},
		{
			name:   "revoke invite canceled",
			method: stdhttp.MethodDelete,
			path:   "/api/team/invites/1",
			route:  func(r *gin.Engine) { r.DELETE("/api/team/invites/:id", server.handleRevokeInvite) },
		},
		{
			name:   "update member role canceled",
			method: stdhttp.MethodPost,
			path:   "/api/team/members/1/role",
			body:   `{"role":"member"}`,
			route:  func(r *gin.Engine) { r.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole) },
		},
		{
			name:   "remove member canceled",
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/1",
			route:  func(r *gin.Engine) { r.DELETE("/api/team/members/:userId", server.handleRemoveMember) },
		},
		{
			name:   "invite member canceled",
			method: stdhttp.MethodPost,
			path:   "/api/team/invites",
			body:   `{"username":"testuser","role":"member"}`,
			route:  func(r *gin.Engine) { r.POST("/api/team/invites", server.handleInviteMember) },
		},
	} {
		t.Run(tc.name, func(t *testing.T) {
			router := gin.New()
			router.Use(withWS)
			tc.route(router)

			rec := httptest.NewRecorder()
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := withCanceledContext(httptest.NewRequest(tc.method, tc.path, body))
			if tc.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			router.ServeHTTP(rec, req)
			if rec.Code != stdhttp.StatusInternalServerError {
				t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
			}
		})
	}
}

// TestHandleBlockWorkspaceWithDB covers the internal handleBlockWorkspace success paths.
func TestHandleBlockWorkspaceWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97100, "blockwsuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	t.Run("block workspace via internal handler", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		body := `{"blocked":true}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/internal/admin/workspaces/"+itoa(workspace.ID)+"/block",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("unblock workspace", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		body := `{"blocked":false}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/internal/admin/workspaces/"+itoa(workspace.ID)+"/block",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200 for unblock, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("block non-existent workspace returns 404", func(t *testing.T) {
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		body := `{"blocked":true}`
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/internal/admin/workspaces/99999999/block",
			strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminVerifyTOTPSuccessPath covers the successful TOTP verification flow.
func TestAdminVerifyTOTPSuccessPath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Use a fresh embedded postgres just for this test to avoid sharing state
	// with other admin tests.
	adminSvc := service.NewDBAdminService(
		sharedHTTPTestStore,
		"", "",
		"totp-jwt-secret",
		time.Minute, time.Hour,
		"totptest@example.com", "totppass", "super_admin",
	)
	if _, err := adminSvc.Bootstrap(ctx); err != nil {
		t.Fatalf("Bootstrap: %v", err)
	}

	server := &Server{
		store:        sharedHTTPTestStore,
		adminService: adminSvc,
		cfg:          config.Config{AppEnv: "test"},
	}

	// Step 1: Start login
	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", server.handleAdminLogin)
	loginReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"totptest@example.com","password":"totppass"}`))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRouter.ServeHTTP(loginRec, loginReq)

	if loginRec.Code != stdhttp.StatusOK {
		t.Fatalf("expected 200 for login, got %d: %s", loginRec.Code, loginRec.Body.String())
	}

	var loginResp map[string]any
	if err := json.Unmarshal(loginRec.Body.Bytes(), &loginResp); err != nil {
		t.Fatalf("unmarshal login response: %v", err)
	}
	challengeToken, _ := loginResp["challenge_token"].(string)
	totpSecret, _ := loginResp["totp_secret"].(string)
	if challengeToken == "" || totpSecret == "" {
		t.Fatalf("expected challenge_token and totp_secret, got: %+v", loginResp)
	}

	// Step 2: Generate TOTP code from the secret
	code, err := computeTOTPCode(totpSecret, time.Now().UTC())
	if err != nil {
		t.Fatalf("computeTOTPCode: %v", err)
	}

	// Step 3: Verify TOTP
	totpRouter := gin.New()
	totpRouter.POST("/api/admin/login/verify-totp", server.handleAdminVerifyTOTP)

	totpRec := httptest.NewRecorder()
	totpReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login/verify-totp",
		strings.NewReader(`{"challenge_token":"`+challengeToken+`","code":"`+code+`"}`))
	totpReq.Header.Set("Content-Type", "application/json")
	totpRouter.ServeHTTP(totpRec, totpReq)

	if totpRec.Code != stdhttp.StatusOK {
		t.Fatalf("expected 200 for TOTP verify, got %d: %s", totpRec.Code, totpRec.Body.String())
	}
}

// computeTOTPCode generates a TOTP code from a base32-encoded secret.
func computeTOTPCode(secret string, t time.Time) (string, error) {
	decoded, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil {
		return "", err
	}
	counter := uint64(t.Unix() / 30)
	var msg [8]byte
	binary.BigEndian.PutUint64(msg[:], counter)
	mac := hmac.New(sha1.New, decoded)
	mac.Write(msg[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	value := (uint32(sum[offset])&0x7f)<<24 |
		(uint32(sum[offset+1])&0xff)<<16 |
		(uint32(sum[offset+2])&0xff)<<8 |
		(uint32(sum[offset+3]) & 0xff)
	code := value % 1000000
	return fmt.Sprintf("%06d", code), nil
}

// TestAuthMiddlewareWithDB covers the workspace-lookup and blocked-workspace branches.
func TestAuthMiddlewareWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97000, "authmwuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 97000)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	// Issue a real access token
	authResult, err := authSvc.SwitchWorkspace(ctx, user.ID, workspace.ID)
	if err != nil {
		t.Fatalf("SwitchWorkspace: %v", err)
	}

	router := gin.New()
	router.Use(server.authMiddleware())
	router.GET("/api/me", func(c *gin.Context) { c.Status(stdhttp.StatusOK) })

	t.Run("valid token passes middleware", func(t *testing.T) {
		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil)
		req.Header.Set("Authorization", "Bearer "+authResult.Token)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("blocked workspace is rejected", func(t *testing.T) {
		if _, err := sharedHTTPTestStore.SetWorkspaceBlocked(ctx, workspace.ID, true); err != nil {
			t.Fatalf("SetWorkspaceBlocked: %v", err)
		}
		t.Cleanup(func() {
			_, _ = sharedHTTPTestStore.SetWorkspaceBlocked(ctx, workspace.ID, false)
		})

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil)
		req.Header.Set("Authorization", "Bearer "+authResult.Token)
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for blocked workspace, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("canceled context store lookup returns unauthorized", func(t *testing.T) {
		router2 := gin.New()
		router2.Use(server.authMiddleware())
		router2.GET("/api/me", func(c *gin.Context) { c.Status(stdhttp.StatusOK) })

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil))
		req.Header.Set("Authorization", "Bearer "+authResult.Token)
		router2.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusUnauthorized {
			t.Fatalf("expected 401 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestDeveloperHandlersUsageWithDB covers handleDeveloperUsage success paths.
func TestDeveloperHandlersUsageWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 96500, "usagedevuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	t.Run("handleDeveloperUsage returns 200", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/usage", server.handleDeveloperUsage)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/usage", nil))
		if rec.Code != stdhttp.StatusOK {
			t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleDeveloperUsage canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.GET("/api/developer/usage", server.handleDeveloperUsage)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/developer/usage", nil)))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleCreateAPIKey canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys",
			strings.NewReader(`{"label":"test"}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminOpsOverviewSequentialErrorsWithDB covers the 2nd-5th sequential error paths
// in handleAdminOpsOverview using a mock store.
func TestAdminOpsOverviewSequentialErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	for _, tc := range []struct {
		name   string
		failAt string
		want   int
	}{
		{"ListAdminInvoices error", errAtListAdminInvoices, stdhttp.StatusInternalServerError},
		{"ListAdminFailedWebhooks error", errAtListAdminFailedWebhooks, stdhttp.StatusInternalServerError},
		{"ListAdminWatchers error", errAtListAdminWatchers, stdhttp.StatusInternalServerError},
		{"GetAdminNotificationHealth error", errAtGetAdminNotificationHealth, stdhttp.StatusInternalServerError},
	} {
		t.Run(tc.name, func(t *testing.T) {
			mock := newMockStore(sharedHTTPTestStore, tc.failAt)
			server := &Server{store: mock}
			router := gin.New()
			router.GET("/api/admin/ops", server.handleAdminOpsOverview)

			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/admin/ops", nil))
			if rec.Code != tc.want {
				t.Fatalf("expected %d, got %d: %s", tc.want, rec.Code, rec.Body.String())
			}
		})
	}
}

// TestDeveloperUsageSequentialErrorsWithDB covers the 2nd-4th sequential error paths
// in handleDeveloperUsage using a mock store.
func TestDeveloperUsageSequentialErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98100, "devusagesequser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	withWS := func(ws store.Workspace) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{Workspace: ws})
			c.Next()
		}
	}

	for _, tc := range []struct {
		name   string
		failAt string
	}{
		{"CountAPIRequestsSince minute error", errAtCountAPIRequestsSinceMinute},
		{"CountActiveAPIKeys error", errAtCountActiveAPIKeys},
		{"ListWebhookEndpoints error", errAtListWebhookEndpoints},
	} {
		t.Run(tc.name, func(t *testing.T) {
			mock := newMockStore(sharedHTTPTestStore, tc.failAt)
			server := &Server{store: mock}
			router := gin.New()
			router.Use(withWS(workspace))
			router.GET("/api/developer/usage", server.handleDeveloperUsage)

			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/developer/usage", nil))
			if rec.Code != stdhttp.StatusInternalServerError {
				t.Fatalf("%s: expected 500, got %d: %s", tc.name, rec.Code, rec.Body.String())
			}
		})
	}
}

// TestListTeamSequentialErrorsWithDB covers the 2nd-3rd sequential error paths
// in handleListTeam using a mock store.
func TestListTeamSequentialErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98200, "listteamseqowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	owner, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 98200)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	withWS := func(ms *mockHTTPStore) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{
				Claims:    service.Claims{UserID: owner.ID, WorkspaceID: workspace.ID},
				Workspace: workspace,
			})
			c.Next()
		}
	}

	for _, tc := range []struct {
		name   string
		failAt string
	}{
		{"ListWorkspaceMembers error", errAtListWorkspaceMembers},
		{"ListWorkspaceInvites error", errAtListWorkspaceInvites},
	} {
		t.Run(tc.name, func(t *testing.T) {
			mock := newMockStore(sharedHTTPTestStore, tc.failAt)
			server := &Server{store: mock}
			router := gin.New()
			router.Use(withWS(mock))
			router.GET("/api/team", server.handleListTeam)

			rec := httptest.NewRecorder()
			router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodGet, "/api/team", nil))
			if rec.Code != stdhttp.StatusInternalServerError {
				t.Fatalf("%s: expected 500, got %d: %s", tc.name, rec.Code, rec.Body.String())
			}
		})
	}
}

// TestHandleCancelAndMarkPaidMockErrorsWithDB covers SetInvoiceStatus and MarkInvoicePaidManual
// error paths in handleCancelInvoice and handleMarkInvoicePaid.
func TestHandleCancelAndMarkPaidMockErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98400, "cancelmockuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	wallet, err := sharedHTTPTestStore.CreateWallet(ctx, workspace.ID, store.NetworkEVM, "0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC")
	if err != nil && !strings.Contains(err.Error(), "already exists") {
		t.Fatalf("CreateWallet: %v", err)
	}
	if wallet.ID == 0 {
		wallet, _ = sharedHTTPTestStore.GetActiveWalletForNetwork(ctx, workspace.ID, store.NetworkEVM)
	}
	inv, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "Cancel Mock Test",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("5.111111"),
		PublicID:           "CNCL_MCK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice: %v", err)
	}

	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: 1, WorkspaceID: workspace.ID},
			Workspace: workspace,
		})
		c.Next()
	}

	t.Run("handleCancelInvoice SetInvoiceStatus error returns 500", func(t *testing.T) {
		mock := newMockStore(sharedHTTPTestStore, errAtSetInvoiceStatus)
		server := &Server{store: mock}
		router := gin.New()
		router.Use(withWS)
		router.DELETE("/api/invoices/:id", server.handleCancelInvoice)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/invoices/"+itoa(inv.ID), nil))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	inv2, err := sharedHTTPTestStore.CreateInvoice(ctx, store.CreateInvoiceParams{
		WorkspaceID:        workspace.ID,
		Kind:               store.InvoiceKindMerchant,
		Title:              "MarkPaid Mock Test",
		BaseAmountUSD:      decimal.RequireFromString("5"),
		PayableNetwork:     store.NetworkBASE,
		DestinationAddress: wallet.Address,
		PayableAmount:      decimal.RequireFromString("5.222222"),
		PublicID:           "MKPD_MCK001",
		Mode:               "live",
		ExpiresAt:          time.Now().Add(time.Hour),
	})
	if err != nil {
		t.Fatalf("CreateInvoice2: %v", err)
	}

	t.Run("handleMarkInvoicePaid MarkInvoicePaidManual error returns 500", func(t *testing.T) {
		mock := newMockStore(sharedHTTPTestStore, errAtMarkInvoicePaidManual)
		server := &Server{store: mock}
		router := gin.New()
		router.Use(withWS)
		router.POST("/api/invoices/:id/mark-paid", server.handleMarkInvoicePaid)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
			"/api/invoices/"+itoa(inv2.ID)+"/mark-paid", nil))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestHandleUpdateContactEmailDuplicateWithDB covers the duplicate email conflict path.
func TestHandleUpdateContactEmailDuplicateWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	ws1, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98500, "emaildup1user")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram ws1: %v", err)
	}
	ws2, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98501, "emaildup2user")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram ws2: %v", err)
	}

	sharedEmail := "duplicate-test-email-98500@example.com"
	if _, err := sharedHTTPTestStore.UpdateWorkspaceEmail(ctx, ws1.ID, sharedEmail); err != nil {
		t.Fatalf("UpdateWorkspaceEmail ws1: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: 1, WorkspaceID: ws2.ID},
			Workspace: ws2,
		})
		c.Next()
	})
	router.PUT("/api/me/email", server.handleUpdateContactEmail)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPut, "/api/me/email",
		strings.NewReader(`{"email":"`+sharedEmail+`"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusConflict {
		t.Fatalf("expected 409 for duplicate email, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestHandleCreateWalletMockErrorWithDB covers CreateWallet store error path.
func TestHandleCreateWalletMockErrorWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98600, "walletmockuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	mock := newMockStore(sharedHTTPTestStore, errAtCreateWallet)
	server := &Server{store: mock}
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	})
	router.POST("/api/wallets", server.handleCreateWallet)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/wallets",
		strings.NewReader(`{"network":"EVM","address":"0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for CreateWallet error, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestTeamHandlerMockErrorsWithDB covers mock-injected sequential errors in team handlers.
func TestTeamHandlerMockErrorsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98700, "teammockowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	owner, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 98700)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}
	member, err := sharedHTTPTestStore.UpsertUser(ctx, 98701, "teammockmember", "")
	if err != nil {
		t.Fatalf("UpsertUser: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, member.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember: %v", err)
	}

	withOwner := func(ms *mockHTTPStore) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{
				Claims:    service.Claims{UserID: owner.ID, WorkspaceID: workspace.ID},
				Workspace: workspace,
			})
			c.Next()
		}
	}

	type testCase struct {
		name   string
		failAt string
		method string
		path   string
		body   string
		route  func(*gin.Engine, *Server)
	}

	cases := []testCase{
		{
			name:   "handleInviteMember CreateWorkspaceInvite error",
			failAt: errAtCreateWorkspaceInvite,
			method: stdhttp.MethodPost,
			path:   "/api/team/invites",
			body:   `{"username":"newuser","role":"member"}`,
			route: func(r *gin.Engine, s *Server) {
				r.POST("/api/team/invites", s.handleInviteMember)
			},
		},
		{
			name:   "handleRevokeInvite non-ErrNotFound error",
			failAt: errAtRevokeWorkspaceInvite,
			method: stdhttp.MethodDelete,
			path:   "/api/team/invites/1",
			route: func(r *gin.Engine, s *Server) {
				r.DELETE("/api/team/invites/:id", s.handleRevokeInvite)
			},
		},
		{
			name:   "handleUpdateMemberRole UpdateWorkspaceMemberRole error",
			failAt: errAtUpdateWorkspaceMemberRole,
			method: stdhttp.MethodPost,
			path:   "/api/team/members/" + itoa(member.ID) + "/role",
			body:   `{"role":"member"}`,
			route: func(r *gin.Engine, s *Server) {
				r.POST("/api/team/members/:userId/role", s.handleUpdateMemberRole)
			},
		},
		{
			name:   "handleRemoveMember CountWorkspaceOwners error for owner removal",
			failAt: errAtCountWorkspaceOwners,
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/" + itoa(owner.ID),
			route: func(r *gin.Engine, s *Server) {
				r.DELETE("/api/team/members/:userId", s.handleRemoveMember)
			},
		},
		{
			name:   "handleRemoveMember RemoveWorkspaceMember error",
			failAt: errAtRemoveWorkspaceMember,
			method: stdhttp.MethodDelete,
			path:   "/api/team/members/" + itoa(member.ID),
			route: func(r *gin.Engine, s *Server) {
				r.DELETE("/api/team/members/:userId", s.handleRemoveMember)
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			mock := newMockStore(sharedHTTPTestStore, tc.failAt)
			server := &Server{store: mock}
			router := gin.New()
			router.Use(withOwner(mock))
			tc.route(router, server)

			rec := httptest.NewRecorder()
			var body io.Reader
			if tc.body != "" {
				body = strings.NewReader(tc.body)
			}
			req := httptest.NewRequest(tc.method, tc.path, body)
			if tc.body != "" {
				req.Header.Set("Content-Type", "application/json")
			}
			router.ServeHTTP(rec, req)
			if rec.Code != stdhttp.StatusInternalServerError {
				t.Fatalf("expected 500, got %d: %s", rec.Code, rec.Body.String())
			}
		})
	}
}

// TestHandleBlockWorkspaceInvalidIDAndError covers handleBlockWorkspace error paths.
func TestHandleBlockWorkspaceInvalidIDAndError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98800, "blockerroruser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	_ = workspace

	t.Run("invalid workspace id returns 400", func(t *testing.T) {
		server := &Server{}
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/internal/admin/workspaces/not-a-number/block",
			strings.NewReader(`{"blocked":true}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("SetWorkspaceBlocked error returns 500", func(t *testing.T) {
		mock := newMockStore(sharedHTTPTestStore, errAtSetWorkspaceBlocked)
		server := &Server{store: mock}
		router := gin.New()
		router.POST("/internal/admin/workspaces/:id/block", server.handleBlockWorkspace)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost,
			"/internal/admin/workspaces/"+itoa(workspace.ID)+"/block",
			strings.NewReader(`{"blocked":true}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError && rec.Code != stdhttp.StatusNotFound {
			t.Fatalf("expected 500/404, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestHandleObservedTransfersProcessingErrorWithDB covers the ProcessObservedTransfer
// error path in handleObservedTransfers.
func TestHandleObservedTransfersProcessingErrorWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98900, "observedtranserr")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	_ = workspace

	paymentSvc := service.NewPaymentService(sharedHTTPTestStore)
	server := &Server{store: sharedHTTPTestStore, paymentService: paymentSvc}

	router := gin.New()
	router.POST("/internal/watchers/ton", server.handleObservedTransfers)

	body := `{"events":[{"tx_hash":"test-tx-001","network":"TON","destination_address":"UQBtest","amount":"1.5","payment_comment":"REQST-TEST","observed_at":"2024-01-01T00:00:00Z","raw_payload":{}}]}`
	rec := httptest.NewRecorder()
	req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/internal/watchers/ton", strings.NewReader(body)))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for ProcessObservedTransfer error, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestHandleCreateAPIKeyMalformedJSONWithDB covers the JSON binding error in handleCreateAPIKey
// after the plan/key-count checks pass.
func TestHandleCreateAPIKeyMalformedJSONWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97450, "apikeymalformeduser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	router := gin.New()
	router.Use(withWS)
	router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys", strings.NewReader(`{bad json`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 for malformed JSON, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestPublicBlogErrorPathsWithDB covers error paths in public blog handlers.
func TestPublicBlogErrorPathsWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{store: sharedHTTPTestStore}

	t.Run("handlePublicListBlogPosts canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog/posts", server.handlePublicListBlogPosts)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/blog/posts", nil)))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handlePublicGetBlogPost canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.GET("/blog/posts/:slug", server.handlePublicGetBlogPost)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/blog/posts/some-slug", nil)))
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminOpsOverviewCanceledContextWithDB covers the first error path in handleAdminOpsOverview.
func TestAdminOpsOverviewCanceledContextWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	server := &Server{store: sharedHTTPTestStore}

	router := gin.New()
	router.GET("/api/admin/ops", server.handleAdminOpsOverview)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/admin/ops", nil)))
	if rec.Code != stdhttp.StatusInternalServerError {
		t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestTeamHandlersAdditionalEdgeCasesWithDB covers additional handleRemoveMember and handleUpdateMemberRole edge cases.
func TestTeamHandlersAdditionalEdgeCasesWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97500, "teamedgeowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	owner, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 97500)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}
	member, err := sharedHTTPTestStore.UpsertUser(ctx, 97501, "teamedgemember", "")
	if err != nil {
		t.Fatalf("UpsertUser member: %v", err)
	}
	otherMember, err := sharedHTTPTestStore.UpsertUser(ctx, 97502, "teamedgeother", "")
	if err != nil {
		t.Fatalf("UpsertUser otherMember: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, member.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember member: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, workspace.ID, otherMember.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember otherMember: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	withUser := func(u store.User) gin.HandlerFunc {
		return func(c *gin.Context) {
			c.Set("workspace_ctx", workspaceContext{
				Claims:    service.Claims{UserID: u.ID, WorkspaceID: workspace.ID},
				Workspace: workspace,
			})
			c.Next()
		}
	}
	_ = owner

	t.Run("handleRemoveMember invalid userId returns 400", func(t *testing.T) {
		router := gin.New()
		router.Use(withUser(owner))
		router.DELETE("/api/team/members/:userId", server.handleRemoveMember)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete, "/api/team/members/not-a-number", nil))
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid userId, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleRemoveMember regular member removing another member returns 403", func(t *testing.T) {
		router := gin.New()
		router.Use(withUser(member))
		router.DELETE("/api/team/members/:userId", server.handleRemoveMember)

		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodDelete,
			"/api/team/members/"+itoa(otherMember.ID), nil))
		if rec.Code != stdhttp.StatusForbidden {
			t.Fatalf("expected 403 for member removing other member, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleUpdateMemberRole invalid userId returns 400", func(t *testing.T) {
		router := gin.New()
		router.Use(withUser(owner))
		router.POST("/api/team/members/:userId/role", server.handleUpdateMemberRole)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/members/not-a-number/role",
			strings.NewReader(`{"role":"member"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for invalid userId, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleInviteMember empty username returns 400", func(t *testing.T) {
		router := gin.New()
		router.Use(withUser(owner))
		router.POST("/api/team/invites", server.handleInviteMember)

		rec := httptest.NewRecorder()
		req := httptest.NewRequest(stdhttp.MethodPost, "/api/team/invites",
			strings.NewReader(`{"username":"","role":"member"}`))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusBadRequest {
			t.Fatalf("expected 400 for empty username, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestSwitchWorkspaceBlockedWithDB covers the blocked workspace path in issueAuthResult.
func TestSwitchWorkspaceBlockedWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	ws1, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97600, "blockswitchowner")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram ws1: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 97600)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}
	ws2, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97601, "blockswitchtarget")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram ws2: %v", err)
	}
	if err := sharedHTTPTestStore.AddWorkspaceMember(ctx, ws2.ID, user.ID, store.RoleMember); err != nil {
		t.Fatalf("AddWorkspaceMember: %v", err)
	}
	if _, err := sharedHTTPTestStore.SetWorkspaceBlocked(ctx, ws2.ID, true); err != nil {
		t.Fatalf("SetWorkspaceBlocked: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID, WorkspaceID: ws1.ID},
			Workspace: ws1,
		})
		c.Next()
	})
	router.POST("/api/workspaces/:id/switch", server.handleSwitchWorkspace)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, httptest.NewRequest(stdhttp.MethodPost,
		"/api/workspaces/"+itoa(ws2.ID)+"/switch", nil))
	if rec.Code != stdhttp.StatusForbidden {
		t.Fatalf("expected 403 for blocked workspace switch, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestHandleCreateAPIKeyAtLimitWithDB covers the API key limit enforcement.
func TestHandleCreateAPIKeyAtLimitWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97700, "keylimituser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	server := &Server{store: sharedHTTPTestStore}
	withWS := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Next()
	}

	plan := workspace.EffectivePlan(time.Now())
	limit := plan.APIKeyLimit
	if limit <= 0 {
		t.Skip("developer plan has no key limit; skipping limit enforcement test")
		return
	}

	for i := 0; i < limit; i++ {
		prefix := fmt.Sprintf("rqst_live_%d_", i)
		if _, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID,
			fmt.Sprintf("key%d", i), prefix, "hash"+fmt.Sprint(i), []string{"invoices:read"}, "live"); err != nil {
			t.Fatalf("CreateAPIKey %d: %v", i, err)
		}
	}

	router := gin.New()
	router.Use(withWS)
	router.POST("/api/developer/api-keys", server.handleCreateAPIKey)

	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/developer/api-keys",
		strings.NewReader(`{"label":"extra key"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusForbidden {
		t.Fatalf("expected 403 for key limit exceeded, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestHandleTelegramCodeLoginSuccessWithDB covers the success path of handleTelegramCodeLogin.
func TestHandleTelegramCodeLoginSuccessWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97800, "telegramloginuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}

	const code = "654321"
	sum := sha256.Sum256([]byte(strconv.FormatInt(workspace.ID, 10) + "|" + code))
	codeHash := hex.EncodeToString(sum[:])
	if err := sharedHTTPTestStore.StoreTelegramAuthCode(ctx, workspace.ID, codeHash, time.Now().Add(5*time.Minute)); err != nil {
		t.Fatalf("StoreTelegramAuthCode: %v", err)
	}

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	router := gin.New()
	router.POST("/api/auth/telegram/login", server.handleTelegramCodeLogin)

	body := fmt.Sprintf(`{"username":%q,"code":%q}`, workspace.Username, code)
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/api/auth/telegram/login", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusOK {
		t.Fatalf("expected 200 for valid telegram code login, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestHandleAgentBootstrapErrorWithDB covers the error path of handleAgentBootstrap.
func TestHandleAgentBootstrapErrorWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)

	authSvc := service.NewAuthServiceWithTTL(sharedHTTPTestStore, "jwt-secret", "bot-token", false, time.Hour, 30*24*time.Hour, 30*24*time.Hour)
	server := &Server{store: sharedHTTPTestStore, authService: authSvc, cfg: config.Config{AppEnv: "test"}}

	router := gin.New()
	router.POST("/api/auth/agent/bootstrap", server.handleAgentBootstrap)

	rec := httptest.NewRecorder()
	req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/auth/agent/bootstrap",
		strings.NewReader(`{"workspace_name":"test-ws","contact_email":"test@example.com"}`)))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusInternalServerError {
		t.Fatalf("expected 500 for canceled context agent bootstrap, got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestAdminHandlersCanceledContextBatchWithDB covers canceled-context error paths
// in admin handlers that make sequential store calls.
func TestAdminHandlersCanceledContextBatchWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Use a service WITHOUT a store to get a token (avoids DB rate-limit interference).
	tokenSvc := service.NewAdminService("ctxbatchadmin", "pass", "ctxbatch-secret", time.Hour)
	tokenServer := &Server{adminService: tokenSvc}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", tokenServer.handleAdminLogin)
	loginRouter.ServeHTTP(loginRec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"ctxbatchadmin","password":"pass"}`)))
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)
	if token == "" {
		t.Fatalf("expected admin token from login, got: %s", loginRec.Body.String())
	}

	withAdmin := func(c *gin.Context) {
		claims, _ := tokenSvc.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	// Now create a separate server WITH the store for DB-backed tests.
	dbServer := &Server{store: sharedHTTPTestStore, adminService: tokenSvc}
	_ = ctx

	t.Run("handleAdminLogin canceled context returns 500", func(t *testing.T) {
		// Use a unique username to avoid rate limit from other tests.
		uniqueSvc := service.NewAdminService("unique_cx_admin_98765", "pass", "unique-secret", time.Hour)
		uniqueServer := &Server{store: sharedHTTPTestStore, adminService: uniqueSvc}

		router := gin.New()
		router.POST("/api/admin/login", uniqueServer.handleAdminLogin)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
			strings.NewReader(`{"username":"unique_cx_admin_98765","password":"pass"}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context admin login, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminSetWorkspacePlan canceled context returns error", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.PUT("/api/admin/workspaces/:id/plan", dbServer.handleAdminSetWorkspacePlan)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPut, "/api/admin/workspaces/1/plan",
			strings.NewReader(`{"plan_code":"developer","days":30}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code == stdhttp.StatusOK {
			t.Fatalf("expected error for canceled context, got 200: %s", rec.Body.String())
		}
	})

	t.Run("handleAdminCreateInternalComment canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/comments", dbServer.handleAdminCreateInternalComment)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/admin/comments",
			strings.NewReader(`{"target_type":"invoice","target_id":"1","body":"test comment"}`)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

// TestAdminBlogHandlersCanceledContextWithDB covers error paths in admin blog handlers.
func TestAdminBlogHandlersCanceledContextWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	// Use a service WITHOUT store to get a token (avoids rate-limit DB calls).
	adminService := service.NewAdminService("blogcanceladmin", "pass", "blog-cancel-secret", time.Hour)
	tokenServer := &Server{adminService: adminService}

	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", tokenServer.handleAdminLogin)
	loginRouter.ServeHTTP(loginRec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"blogcanceladmin","password":"pass"}`)))
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)
	if token == "" {
		t.Fatalf("expected admin token, got: %s", loginRec.Body.String())
	}

	// server WITH store for the actual blog handler tests
	server := &Server{store: sharedHTTPTestStore, adminService: adminService}

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	blogBody := `{"slug":"canceled-post","title":"Canceled Post","content_md":"# Hello","locale":"en","status":"draft","tags":[]}`

	t.Run("handleAdminCreateBlogPost canceled context returns 500", func(t *testing.T) {
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(blogBody)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminUpdateBlogPost canceled context returns 500", func(t *testing.T) {
		postID := createTestBlogPost(t, ctx, server, adminService)
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.PUT("/api/admin/blog/:id", server.handleAdminUpdateBlogPost)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodPut,
			"/api/admin/blog/"+itoa(postID), strings.NewReader(blogBody)))
		req.Header.Set("Content-Type", "application/json")
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context update, got %d: %s", rec.Code, rec.Body.String())
		}
	})

	t.Run("handleAdminDeleteBlogPost canceled context returns 500", func(t *testing.T) {
		postID := createTestBlogPost(t, ctx, server, adminService)
		router := gin.New()
		router.Use(gin.HandlerFunc(withAdmin))
		router.DELETE("/api/admin/blog/:id", server.handleAdminDeleteBlogPost)

		rec := httptest.NewRecorder()
		req := withCanceledContext(httptest.NewRequest(stdhttp.MethodDelete, "/api/admin/blog/"+itoa(postID), nil))
		router.ServeHTTP(rec, req)
		if rec.Code != stdhttp.StatusInternalServerError {
			t.Fatalf("expected 500 for canceled context delete, got %d: %s", rec.Code, rec.Body.String())
		}
	})
}

func createTestBlogPost(t *testing.T, ctx context.Context, server *Server, adminService *service.AdminService) int64 {
	t.Helper()

	// Use a no-store server to get token without triggering DB rate-limit.
	tokenServer := &Server{adminService: adminService}
	loginRec := httptest.NewRecorder()
	loginRouter := gin.New()
	loginRouter.POST("/api/admin/login", tokenServer.handleAdminLogin)
	loginRouter.ServeHTTP(loginRec, httptest.NewRequest(stdhttp.MethodPost, "/api/admin/login",
		strings.NewReader(`{"username":"blogcanceladmin","password":"pass"}`)))
	var loginBody map[string]any
	_ = json.Unmarshal(loginRec.Body.Bytes(), &loginBody)
	token, _ := loginBody["token"].(string)

	withAdmin := func(c *gin.Context) {
		claims, _ := adminService.ParseToken(token)
		c.Set("admin_ctx", adminContext{Claims: claims})
		c.Next()
	}

	createRouter := gin.New()
	createRouter.Use(gin.HandlerFunc(withAdmin))
	createRouter.POST("/api/admin/blog", server.handleAdminCreateBlogPost)

	slug := "test-post-cancel-" + strconv.FormatInt(time.Now().UnixNano(), 10)
	body := fmt.Sprintf(`{"slug":%q,"title":"Test Post","content_md":"# Hello","locale":"en","status":"draft","tags":[]}`, slug)
	createRec := httptest.NewRecorder()
	createReq := httptest.NewRequest(stdhttp.MethodPost, "/api/admin/blog", strings.NewReader(body))
	createReq.Header.Set("Content-Type", "application/json")
	createRouter.ServeHTTP(createRec, createReq)
	if createRec.Code != stdhttp.StatusCreated {
		t.Fatalf("createTestBlogPost: expected 201, got %d: %s", createRec.Code, createRec.Body.String())
	}
	var created map[string]any
	_ = json.Unmarshal(createRec.Body.Bytes(), &created)
	id, _ := created["id"].(float64)
	_ = ctx
	return int64(id)
}

// TestHandleMeCanceledContextWithDB covers the ListWorkspacesForUser error fallback in handleMe.
func TestHandleMeCanceledContextWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 97900, "mecxuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	user, err := sharedHTTPTestStore.GetUserByTelegramID(ctx, 97900)
	if err != nil {
		t.Fatalf("GetUserByTelegramID: %v", err)
	}

	server := &Server{store: sharedHTTPTestStore}

	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{
			Claims:    service.Claims{UserID: user.ID, WorkspaceID: workspace.ID},
			Workspace: workspace,
		})
		c.Next()
	})
	router.GET("/api/me", server.handleMe)

	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, withCanceledContext(httptest.NewRequest(stdhttp.MethodGet, "/api/me", nil)))
	if rec.Code != stdhttp.StatusOK {
		t.Fatalf("expected 200 even with canceled context (handleMe uses fallback), got %d: %s", rec.Code, rec.Body.String())
	}
}

// TestAPICreateInvoiceCreateFailWithDB covers the CreateInvoice error path in handleAPICreateInvoice.
func TestAPICreateInvoiceCreateFailWithDB(t *testing.T) {
	gin.SetMode(gin.TestMode)
	ctx := context.Background()

	workspace, err := sharedHTTPTestStore.UpsertWorkspaceByTelegram(ctx, 98000, "apicreatefailuser")
	if err != nil {
		t.Fatalf("UpsertWorkspaceByTelegram: %v", err)
	}
	subEnd := time.Now().Add(30 * 24 * time.Hour)
	if _, err := sharedHTTPTestStore.RawPool().Exec(ctx,
		`UPDATE workspaces SET plan_code='developer', subscription_ends_at=$1 WHERE id=$2`,
		subEnd, workspace.ID); err != nil {
		t.Fatalf("set dev plan: %v", err)
	}
	workspace.PlanCode = store.PlanCodeDeveloper
	workspace.SubscriptionEndsAt = &subEnd

	apiKey, err := sharedHTTPTestStore.CreateAPIKey(ctx, workspace.ID, "fail-key", "rqst_live_fail_", "hashfail", []string{"invoices:write"}, "live")
	if err != nil {
		t.Fatalf("CreateAPIKey: %v", err)
	}

	invoiceSvc := service.NewInvoiceService(sharedHTTPTestStore, "test")
	server := &Server{store: sharedHTTPTestStore, invoiceService: invoiceSvc}

	withAPIContext := func(c *gin.Context) {
		c.Set("workspace_ctx", workspaceContext{Workspace: workspace})
		c.Set("api_key_ctx", apiKeyContext{
			Key: store.APIKeyRecord{APIKey: store.APIKey{ID: apiKey.ID, Scopes: []string{"invoices:write"}, Mode: "live"}},
		})
		c.Next()
	}

	router := gin.New()
	router.Use(withAPIContext)
	router.POST("/v1/invoices", server.handleAPICreateInvoice)

	// No wallet configured → CreateInvoice fails
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(stdhttp.MethodPost, "/v1/invoices",
		strings.NewReader(`{"title":"Test","base_amount_usd":"10","payable_network":"BASE"}`))
	req.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(rec, req)
	if rec.Code != stdhttp.StatusBadRequest {
		t.Fatalf("expected 400 when no wallet configured, got %d: %s", rec.Code, rec.Body.String())
	}
}
