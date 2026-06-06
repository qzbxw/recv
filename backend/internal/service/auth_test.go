package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"recv/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
)

func TestAuthServiceIssueAndParseToken(t *testing.T) {
	telegramID := int64(42)
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)

	result, err := service.issueAuthResult(store.User{
		ID:         3,
		TelegramID: telegramID,
		Username:   "alice",
	}, store.Workspace{
		ID:              7,
		OwnerTelegramID: &telegramID,
		Username:        "alice",
	})
	if err != nil {
		t.Fatalf("issueAuthResult returned error: %v", err)
	}
	if result.Token == "" {
		t.Fatal("expected token to be issued")
	}

	claims, err := service.ParseToken(result.Token)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if claims.WorkspaceID != 7 {
		t.Fatalf("expected workspace id 7, got %d", claims.WorkspaceID)
	}
	if claims.TelegramID != telegramID {
		t.Fatalf("unexpected telegram id: %+v", claims.TelegramID)
	}
	if claims.Username != "alice" {
		t.Fatalf("expected username alice, got %q", claims.Username)
	}
}

func TestAuthServiceIssueAuthResultRejectsBlockedWorkspace(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)

	_, err := service.issueAuthResult(store.User{ID: 1, TelegramID: 42}, store.Workspace{ID: 1, IsBlocked: true})
	if err == nil || !strings.Contains(err.Error(), "blocked") {
		t.Fatalf("expected blocked workspace error, got %v", err)
	}
}

func TestAuthServiceParseTokenRejectsUnexpectedSigningMethod(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)

	token := jwt.NewWithClaims(jwt.SigningMethodHS512, Claims{
		WorkspaceID: 1,
		UserID:      1,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject: "1",
		},
	})
	signed, err := token.SignedString([]byte("jwt-secret"))
	if err != nil {
		t.Fatalf("SignedString returned error: %v", err)
	}

	_, err = service.ParseToken(signed)
	if err == nil || !strings.Contains(err.Error(), "unexpected signing method") {
		t.Fatalf("expected signing method error, got %v", err)
	}
}

func TestAuthServiceValidateInitDataAcceptsSignedPayload(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, 24*time.Hour)
	query := signedInitDataQueryString(t, "bot-token", url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		"user":      []string{`{"id":123,"username":"alice"}`},
	})

	id, username, err := service.validateInitData(query)
	if err != nil {
		t.Fatalf("validateInitData returned error: %v", err)
	}
	if id != 123 {
		t.Fatalf("expected telegram id 123, got %d", id)
	}
	if username != "alice" {
		t.Fatalf("expected username alice, got %q", username)
	}
}

func TestAuthServiceValidateWidgetDataRequiresBotToken(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "", false, time.Hour)

	_, _, err := service.validateWidgetData("id=1&username=alice&auth_date=1700000000&hash=x")
	if err == nil || !strings.Contains(err.Error(), "TELEGRAM_BOT_TOKEN") {
		t.Fatalf("expected missing bot token error, got %v", err)
	}
}

func TestAuthServiceValidateWidgetDataRejectsMissingAuthDate(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	query := signedWidgetDataQueryString(t, "bot-token", url.Values{
		"id":       []string{"1"},
		"username": []string{"alice"},
	})

	_, _, err := service.validateWidgetData(query)
	if err == nil || !strings.Contains(err.Error(), "auth_date is missing") {
		t.Fatalf("expected missing auth_date error, got %v", err)
	}
}

func TestAuthServiceValidateWidgetDataRejectsExpiredPayload(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	query := signedWidgetDataQueryString(t, "bot-token", url.Values{
		"id":        []string{"1"},
		"username":  []string{"alice"},
		"auth_date": []string{strconv.FormatInt(time.Now().Add(-2*time.Hour).Unix(), 10)},
	})

	_, _, err := service.validateWidgetData(query)
	if err == nil || !strings.Contains(err.Error(), "too old") {
		t.Fatalf("expected expired auth data error, got %v", err)
	}
}

func TestAuthServiceValidateWidgetDataAcceptsSignedPayload(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, 24*time.Hour)
	query := signedWidgetDataQueryString(t, "bot-token", url.Values{
		"id":        []string{"55"},
		"username":  []string{"alice"},
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
	})

	id, username, err := service.validateWidgetData(query)
	if err != nil {
		t.Fatalf("validateWidgetData returned error: %v", err)
	}
	if id != 55 {
		t.Fatalf("expected telegram id 55, got %d", id)
	}
	if username != "alice" {
		t.Fatalf("expected username alice, got %q", username)
	}
}

func TestAuthServiceResolveTelegramIdentityAllowsInsecureDevFallback(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "", true, time.Hour)

	id, username, err := service.resolveTelegramIdentity(TelegramAuthInput{
		TelegramID: 99,
		Username:   " alice ",
	})
	if err != nil {
		t.Fatalf("resolveTelegramIdentity returned error: %v", err)
	}
	if id != 99 {
		t.Fatalf("expected telegram id 99, got %d", id)
	}
	if username != "alice" {
		t.Fatalf("expected username alice, got %q", username)
	}
}

func TestAuthServiceResolveTelegramIdentityPrefersSignedPayloads(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", true, 24*time.Hour)
	initData := signedInitDataQueryString(t, "bot-token", url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		"user":      []string{`{"id":123,"username":"inituser"}`},
	})
	id, username, err := service.resolveTelegramIdentity(TelegramAuthInput{
		InitData:   initData,
		TelegramID: 999,
		Username:   "fallback",
	})
	if err != nil {
		t.Fatalf("resolveTelegramIdentity init data: %v", err)
	}
	if id != 123 || username != "inituser" {
		t.Fatalf("expected init data identity, got id=%d username=%q", id, username)
	}

	widgetData := signedWidgetDataQueryString(t, "bot-token", url.Values{
		"id":        []string{"456"},
		"username":  []string{"widgetuser"},
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
	})
	id, username, err = service.resolveTelegramIdentity(TelegramAuthInput{WidgetData: widgetData})
	if err != nil {
		t.Fatalf("resolveTelegramIdentity widget data: %v", err)
	}
	if id != 456 || username != "widgetuser" {
		t.Fatalf("expected widget data identity, got id=%d username=%q", id, username)
	}
}

func TestTelegramExpectedHashIsDeterministic(t *testing.T) {
	first, err := telegramExpectedHash("bot-token", "auth_date=1700000000\nuser={}")
	if err != nil {
		t.Fatalf("telegramExpectedHash first: %v", err)
	}
	second, err := telegramExpectedHash("bot-token", "auth_date=1700000000\nuser={}")
	if err != nil {
		t.Fatalf("telegramExpectedHash second: %v", err)
	}
	if first == "" || first != second {
		t.Fatalf("expected deterministic non-empty hash, got %q and %q", first, second)
	}
}

func TestNormalizeTelegramUsername(t *testing.T) {
	username, err := normalizeTelegramUsername(" @Alice_Test ")
	if err != nil {
		t.Fatalf("normalizeTelegramUsername returned error: %v", err)
	}
	if username != "alice_test" {
		t.Fatalf("expected alice_test, got %q", username)
	}

	_, err = normalizeTelegramUsername("ab!")
	if err == nil {
		t.Fatal("expected invalid username error")
	}
}

func TestTelegramDataCheckStringSortsKeys(t *testing.T) {
	values := url.Values{
		"hash":      []string{"ignored"},
		"username":  []string{"alice"},
		"auth_date": []string{"1700000000"},
	}

	got := telegramDataCheckString(values)
	want := "auth_date=1700000000\nusername=alice"
	if got != want {
		t.Fatalf("expected %q, got %q", want, got)
	}
}

func TestRandomDigits(t *testing.T) {
	value, err := randomDigits(8)
	if err != nil {
		t.Fatalf("randomDigits returned error: %v", err)
	}
	if len(value) != 8 {
		t.Fatalf("expected 8 digits, got %d", len(value))
	}
	for _, char := range value {
		if char < '0' || char > '9' {
			t.Fatalf("expected only digits, got %q", value)
		}
	}

	_, err = randomDigits(0)
	if err == nil {
		t.Fatal("expected invalid length error")
	}
}

func TestHashTelegramCode(t *testing.T) {
	first := hashTelegramCode(1, "123456")
	second := hashTelegramCode(1, "123456")
	if first != second || first == "" {
		t.Fatalf("expected deterministic code hash, got %q and %q", first, second)
	}
}

func TestNewAuthServiceWithTTLUsesDefaults(t *testing.T) {
	svc := NewAuthServiceWithTTL(nil, "secret", "token", false, time.Hour, 0, 0)
	if svc.accessTTL != 15*time.Minute {
		t.Fatalf("expected default accessTTL 15m, got %v", svc.accessTTL)
	}
	if svc.refreshTTL != 30*24*time.Hour {
		t.Fatalf("expected default refreshTTL 30d, got %v", svc.refreshTTL)
	}
}

func TestRequestTelegramLoginCodeRequiresBotToken(t *testing.T) {
	svc := NewAuthService(nil, "secret", "", false, time.Hour)
	err := svc.RequestTelegramLoginCode(t.Context(), TelegramCodeRequestInput{Username: "someuser"})
	if err == nil || !strings.Contains(err.Error(), "TELEGRAM_BOT_TOKEN") {
		t.Fatalf("expected bot token error, got %v", err)
	}
}

func TestLogoutWithNilStoreReturnsError(t *testing.T) {
	svc := NewAuthService(nil, "secret", "token", false, time.Hour)
	err := svc.Logout(t.Context(), "any-token")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error for nil store logout, got %v", err)
	}
}

func TestAuthServiceResolveTelegramIdentityRequiresData(t *testing.T) {
	svc := NewAuthService(nil, "secret", "token", false, time.Hour)
	_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 1, Username: "alice"})
	if err == nil || !strings.Contains(err.Error(), "required") {
		t.Fatalf("expected required auth data error, got %v", err)
	}
}

func TestAuthServiceValidateInitDataErrorBranches(t *testing.T) {
	t.Run("requires bot token", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		_, _, err := svc.validateInitData("auth_date=1700000000&hash=x")
		if err == nil || !strings.Contains(err.Error(), "TELEGRAM_BOT_TOKEN") {
			t.Fatalf("expected bot token error, got %v", err)
		}
	})

	t.Run("requires hash", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.validateInitData("auth_date=1700000000")
		if err == nil || !strings.Contains(err.Error(), "hash") {
			t.Fatalf("expected hash error, got %v", err)
		}
	})

	t.Run("requires auth date", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.validateInitData("hash=x")
		if err == nil || !strings.Contains(err.Error(), "auth_date") {
			t.Fatalf("expected auth_date error, got %v", err)
		}
	})

	t.Run("rejects invalid auth date", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.validateInitData("hash=x&auth_date=not-a-number")
		if err == nil || !strings.Contains(err.Error(), "invalid") {
			t.Fatalf("expected invalid auth_date error, got %v", err)
		}
	})

	t.Run("rejects expired init data", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		query := signedInitDataQueryString(t, "bot-token", url.Values{
			"auth_date": []string{strconv.FormatInt(time.Now().Add(-2*time.Hour).Unix(), 10)},
			"user":      []string{`{"id":123,"username":"alice"}`},
		})
		_, _, err := svc.validateInitData(query)
		if err == nil || !strings.Contains(err.Error(), "too old") {
			t.Fatalf("expected expired init data error, got %v", err)
		}
	})

	t.Run("rejects signature mismatch", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.validateInitData("hash=bad&auth_date=" + strconv.FormatInt(time.Now().Unix(), 10) + `&user={"id":123}`)
		if err == nil || !strings.Contains(err.Error(), "signature") {
			t.Fatalf("expected signature error, got %v", err)
		}
	})

	t.Run("requires user payload", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		query := signedInitDataQueryString(t, "bot-token", url.Values{
			"auth_date": []string{strconv.FormatInt(time.Now().Unix(), 10)},
		})
		_, _, err := svc.validateInitData(query)
		if err == nil || !strings.Contains(err.Error(), "user payload") {
			t.Fatalf("expected user payload error, got %v", err)
		}
	})

	t.Run("rejects malformed user payload", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		query := signedInitDataQueryString(t, "bot-token", url.Values{
			"auth_date": []string{strconv.FormatInt(time.Now().Unix(), 10)},
			"user":      []string{`{bad`},
		})
		_, _, err := svc.validateInitData(query)
		if err == nil || !strings.Contains(err.Error(), "decode") {
			t.Fatalf("expected decode error, got %v", err)
		}
	})

	t.Run("requires user id", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		query := signedInitDataQueryString(t, "bot-token", url.Values{
			"auth_date": []string{strconv.FormatInt(time.Now().Unix(), 10)},
			"user":      []string{`{"username":"alice"}`},
		})
		_, _, err := svc.validateInitData(query)
		if err == nil || !strings.Contains(err.Error(), "user id") {
			t.Fatalf("expected user id error, got %v", err)
		}
	})
}

func TestAuthServiceValidateWidgetDataErrorBranches(t *testing.T) {
	svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)

	if _, _, err := svc.validateWidgetData("auth_date=1700000000"); err == nil || !strings.Contains(err.Error(), "hash") {
		t.Fatalf("expected widget hash error, got %v", err)
	}
	if _, _, err := svc.validateWidgetData("hash=x&auth_date=not-a-number"); err == nil || !strings.Contains(err.Error(), "invalid") {
		t.Fatalf("expected invalid widget auth_date error, got %v", err)
	}
	if _, _, err := svc.validateWidgetData("hash=bad&auth_date=" + strconv.FormatInt(time.Now().Unix(), 10) + "&id=123"); err == nil || !strings.Contains(err.Error(), "signature") {
		t.Fatalf("expected widget signature error, got %v", err)
	}

	query := signedWidgetDataQueryString(t, "bot-token", url.Values{
		"id":        []string{"not-a-number"},
		"username":  []string{"alice"},
		"auth_date": []string{strconv.FormatInt(time.Now().Unix(), 10)},
	})
	if _, _, err := svc.validateWidgetData(query); err == nil || !strings.Contains(err.Error(), "invalid telegram id") {
		t.Fatalf("expected invalid telegram id error, got %v", err)
	}
}

func TestNormalizeTelegramUsernameBoundaries(t *testing.T) {
	if _, err := normalizeTelegramUsername(""); err == nil || !strings.Contains(err.Error(), "required") {
		t.Fatalf("expected required username error, got %v", err)
	}
	if _, err := normalizeTelegramUsername("abcd"); err == nil || !strings.Contains(err.Error(), "between") {
		t.Fatalf("expected short username error, got %v", err)
	}
	if _, err := normalizeTelegramUsername(strings.Repeat("a", 33)); err == nil || !strings.Contains(err.Error(), "between") {
		t.Fatalf("expected long username error, got %v", err)
	}
}

func TestNormalizeAgentWorkspaceNameAdditionalBoundaries(t *testing.T) {
	cases := map[string]string{
		"":                                     "",
		"  My Workspace! 2026 ":                "my_workspace_2026",
		"---":                                  "",
		"abcdefghijklmnopqrstuvwxyz0123456789": "abcdefghijklmnopqrstuvwx",
	}
	for input, want := range cases {
		if got := normalizeAgentWorkspaceName(input); got != want {
			t.Fatalf("normalizeAgentWorkspaceName(%q) = %q; want %q", input, got, want)
		}
	}
}

func TestRefreshWithNilStoreReturnsError(t *testing.T) {
	svc := NewAuthService(nil, "secret", "token", false, time.Hour)
	_, err := svc.Refresh(t.Context(), "some-refresh-token")
	if err == nil || !strings.Contains(err.Error(), "not configured") {
		t.Fatalf("expected not configured error for nil store refresh, got %v", err)
	}
}

func TestAuthenticateTelegramCodeInvalidUsername(t *testing.T) {
	svc := NewAuthService(nil, "secret", "token", false, time.Hour)
	_, err := svc.AuthenticateTelegramCode(t.Context(), TelegramCodeLoginInput{Username: "!@#invalid"})
	if err == nil {
		t.Fatal("expected error for invalid telegram username")
	}
}

func TestResolveTelegramIdentityRequiresInputWhenSecure(t *testing.T) {
	svc := NewAuthService(nil, "secret", "", false, time.Hour)
	_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{})
	if err == nil {
		t.Fatal("expected error when no init_data, widget_data, or insecure dev credentials provided")
	}
}

func TestIssueAuthResultWithNilStoreSkipsRefreshToken(t *testing.T) {
	svc := NewAuthService(nil, "secret", "token", false, time.Hour)
	telegramID := int64(100)
	result, err := svc.issueAuthResult(store.User{ID: 1, TelegramID: telegramID}, store.Workspace{ID: 1, OwnerTelegramID: &telegramID})
	if err != nil {
		t.Fatalf("expected no error with nil store, got %v", err)
	}
	if result.Token == "" {
		t.Fatal("expected token to be issued")
	}
	if result.RefreshToken != "" {
		t.Fatal("expected no refresh token when store is nil")
	}
}

func signedInitDataQueryString(t *testing.T, botToken string, values url.Values) string {
	t.Helper()

	hash, err := telegramExpectedHash(botToken, telegramDataCheckString(values))
	if err != nil {
		t.Fatalf("telegramExpectedHash returned error: %v", err)
	}
	values.Set("hash", hash)
	return values.Encode()
}

func signedWidgetDataQueryString(t *testing.T, botToken string, values url.Values) string {
	t.Helper()

	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, key+"="+values.Get(key))
	}
	dataCheckString := strings.Join(parts, "\n")

	sum := sha256.Sum256([]byte(botToken))
	mac := hmac.New(sha256.New, sum[:])
	if _, err := mac.Write([]byte(dataCheckString)); err != nil {
		t.Fatalf("mac.Write returned error: %v", err)
	}
	values.Set("hash", hex.EncodeToString(mac.Sum(nil)))
	return values.Encode()
}

func TestAuthServiceValidateInitDataRejectsOldPayload(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	query := signedInitDataQueryString(t, "bot-token", url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().Add(-2*time.Hour).Unix(), 10)},
		"user":      []string{mustJSONString(t, map[string]any{"id": 123, "username": "alice"})},
	})

	_, _, err := service.validateInitData(query)
	if err == nil || !strings.Contains(err.Error(), "too old") {
		t.Fatalf("expected expired init_data error, got %v", err)
	}
}

func mustJSONString(t *testing.T, value any) string {
	t.Helper()

	raw, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("json.Marshal returned error: %v", err)
	}
	return string(raw)
}

func TestNormalizeAgentWorkspaceName(t *testing.T) {
	cases := []struct {
		input string
		want  string
	}{
		{"hello", "hello"},
		{"Hello World", "hello_world"},
		{"My-Agent", "my_agent"},
		{"  spaces  ", "spaces"},
		{"123abc", "123abc"},
		{"!!only_special!!", "only_special"},
		{"all!!!special", "allspecial"},
		{"", ""},
	}
	for _, tc := range cases {
		if got := normalizeAgentWorkspaceName(tc.input); got != tc.want {
			t.Errorf("normalizeAgentWorkspaceName(%q) = %q; want %q", tc.input, got, tc.want)
		}
	}
}

func TestNormalizeAgentWorkspaceNameTruncatesAt24(t *testing.T) {
	long := strings.Repeat("a", 30)
	got := normalizeAgentWorkspaceName(long)
	if len(got) > 24 {
		t.Fatalf("expected max 24 chars, got %d", len(got))
	}
}

func TestAuthServiceValidateInitDataRejectsMissingHash(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	query := url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		"user":      []string{`{"id":1,"username":"alice"}`},
	}.Encode()

	_, _, err := service.validateInitData(query)
	if err == nil || !strings.Contains(err.Error(), "hash is missing") {
		t.Fatalf("expected missing hash error, got %v", err)
	}
}

func TestAuthServiceValidateInitDataRejectsBadSignature(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, 24*time.Hour)
	query := url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		"user":      []string{`{"id":1,"username":"alice"}`},
		"hash":      []string{"badhash"},
	}.Encode()

	_, _, err := service.validateInitData(query)
	if err == nil || !strings.Contains(err.Error(), "signature mismatch") {
		t.Fatalf("expected signature mismatch error, got %v", err)
	}
}

func TestAuthServiceValidateInitDataRejectsMissingUserPayload(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, 24*time.Hour)
	query := signedInitDataQueryString(t, "bot-token", url.Values{
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
	})

	_, _, err := service.validateInitData(query)
	if err == nil || !strings.Contains(err.Error(), "user payload is missing") {
		t.Fatalf("expected missing user payload error, got %v", err)
	}
}

func TestAuthServiceValidateInitDataRejectsMissingAuthDate(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, time.Hour)
	query := url.Values{
		"user": []string{`{"id":1,"username":"alice"}`},
		"hash": []string{"anything"},
	}.Encode()

	_, _, err := service.validateInitData(query)
	if err == nil || !strings.Contains(err.Error(), "auth_date is missing") {
		t.Fatalf("expected missing auth_date error, got %v", err)
	}
}

func TestAuthServiceValidateWidgetDataRejectsSignatureMismatch(t *testing.T) {
	service := NewAuthService(nil, "jwt-secret", "bot-token", false, 24*time.Hour)
	query := url.Values{
		"id":        []string{"1"},
		"username":  []string{"alice"},
		"auth_date": []string{strconv.FormatInt(time.Now().UTC().Unix(), 10)},
		"hash":      []string{"badhash"},
	}.Encode()

	_, _, err := service.validateWidgetData(query)
	if err == nil || !strings.Contains(err.Error(), "signature mismatch") {
		t.Fatalf("expected signature mismatch error, got %v", err)
	}
}

func TestAuthServiceParseTokenRejectsWrongSecret(t *testing.T) {
	issuer := NewAuthService(nil, "correct-secret", "bot-token", false, time.Hour)
	parser := NewAuthService(nil, "wrong-secret", "bot-token", false, time.Hour)

	telegramID := int64(1)
	result, err := issuer.issueAuthResult(store.User{ID: 1, TelegramID: telegramID}, store.Workspace{ID: 1, OwnerTelegramID: &telegramID})
	if err != nil {
		t.Fatalf("issueAuthResult returned error: %v", err)
	}

	_, err = parser.ParseToken(result.Token)
	if err == nil {
		t.Fatal("expected wrong secret to reject token")
	}
}

func TestResolveTelegramIdentity(t *testing.T) {
	t.Run("returns error when no auth data is provided", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{})
		if err == nil || !strings.Contains(err.Error(), "required") {
			t.Fatalf("expected auth data required error, got %v", err)
		}
	})

	t.Run("allows insecure dev auth with telegram_id", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", true, time.Hour)
		id, username, err := svc.resolveTelegramIdentity(TelegramAuthInput{
			TelegramID: 12345,
			Username:   " devuser ",
		})
		if err != nil {
			t.Fatalf("expected insecure dev auth to succeed, got %v", err)
		}
		if id != 12345 {
			t.Fatalf("expected telegram id 12345, got %d", id)
		}
		if username != "devuser" {
			t.Fatalf("expected trimmed username devuser, got %q", username)
		}
	})

	t.Run("rejects insecure dev auth with zero telegram_id", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", true, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 0})
		if err == nil {
			t.Fatal("expected zero telegram id to fail even with insecure dev auth")
		}
	})
}

func TestRequestTelegramLoginCodeInvalidUsername(t *testing.T) {
	svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)

	t.Run("too short username returns error", func(t *testing.T) {
		err := svc.RequestTelegramLoginCode(t.Context(), TelegramCodeRequestInput{Username: "ab"})
		if err == nil || !strings.Contains(err.Error(), "between 5 and 32") {
			t.Fatalf("expected length error, got %v", err)
		}
	})

	t.Run("username with special chars returns error", func(t *testing.T) {
		err := svc.RequestTelegramLoginCode(t.Context(), TelegramCodeRequestInput{Username: "bad!user"})
		if err == nil {
			t.Fatal("expected error for username with special chars")
		}
	})

	t.Run("empty username returns error", func(t *testing.T) {
		err := svc.RequestTelegramLoginCode(t.Context(), TelegramCodeRequestInput{Username: ""})
		if err == nil || !strings.Contains(err.Error(), "required") {
			t.Fatalf("expected required error, got %v", err)
		}
	})
}

func TestAuthenticateTelegramWithNoValidInput(t *testing.T) {
	svc := NewAuthService(nil, "secret", "", false, time.Hour)
	_, err := svc.AuthenticateTelegram(t.Context(), TelegramAuthInput{})
	if err == nil {
		t.Fatal("expected error when no valid auth data is provided in secure mode")
	}
}

func TestAuthenticateTelegramCodeWithEmptyCode(t *testing.T) {
	// Empty code should return "verification code is required"
	// before hitting the store (even with nil store)
	svc := NewAuthService(nil, "secret", "", false, time.Hour)
	_, err := svc.AuthenticateTelegramCode(t.Context(), TelegramCodeLoginInput{
		Username: "validuser",
		Code:     "",
	})
	if err == nil || !strings.Contains(err.Error(), "required") {
		t.Fatalf("expected code required error, got %v", err)
	}
}

func TestAuthServiceTokenClaimsRoundTrip(t *testing.T) {
	telegramID := int64(777)
	svc := NewAuthService(nil, "secret", "bot-token", false, 15*time.Minute)
	result, err := svc.issueAuthResult(store.User{
		ID:         5,
		TelegramID: telegramID,
		Username:   "bob",
	}, store.Workspace{
		ID:              9,
		OwnerTelegramID: &telegramID,
		Username:        "bob",
	})
	if err != nil {
		t.Fatalf("issueAuthResult returned error: %v", err)
	}

	claims, err := svc.ParseToken(result.AccessToken)
	if err != nil {
		t.Fatalf("ParseToken returned error: %v", err)
	}
	if claims.UserID != 5 || claims.WorkspaceID != 9 || claims.Username != "bob" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
}

func TestRandomHelpers(t *testing.T) {
	t.Run("randomDigits returns correct length", func(t *testing.T) {
		digits, err := randomDigits(6)
		if err != nil {
			t.Fatalf("randomDigits: %v", err)
		}
		if len(digits) != 6 {
			t.Fatalf("expected 6 digits, got %d: %q", len(digits), digits)
		}
		for _, ch := range digits {
			if ch < '0' || ch > '9' {
				t.Fatalf("expected digit character, got %q", ch)
			}
		}
	})

	t.Run("randomDigits returns error for non-positive length", func(t *testing.T) {
		_, err := randomDigits(0)
		if err == nil {
			t.Fatal("expected error for zero length")
		}
		_, err = randomDigits(-1)
		if err == nil {
			t.Fatal("expected error for negative length")
		}
	})

	t.Run("randomSyntheticTelegramID returns negative id", func(t *testing.T) {
		id, err := randomSyntheticTelegramID()
		if err != nil {
			t.Fatalf("randomSyntheticTelegramID: %v", err)
		}
		if id >= 0 {
			t.Fatalf("expected negative synthetic telegram ID, got %d", id)
		}
	})

	t.Run("randomID returns non-empty hex string", func(t *testing.T) {
		id := randomID()
		if len(id) == 0 {
			t.Fatal("expected non-empty random ID")
		}
	})
}

func TestResolveTelegramIdentityBranches(t *testing.T) {
	t.Run("dev mode with telegram id bypasses validation", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", true, time.Hour)
		id, username, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 12345, Username: "devuser"})
		if err != nil {
			t.Fatalf("expected no error in dev mode, got %v", err)
		}
		if id != 12345 || username != "devuser" {
			t.Fatalf("unexpected identity: id=%d username=%q", id, username)
		}
	})

	t.Run("dev mode ignores zero telegram id", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", true, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 0})
		if err == nil {
			t.Fatal("expected error for zero telegram id even in dev mode")
		}
	})

	t.Run("no data provided returns error", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{})
		if err == nil {
			t.Fatal("expected error when no auth data provided")
		}
	})

	t.Run("validateInitData requires bot token", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		_, _, err := svc.validateInitData("query_id=AAA&user=BBB&hash=CCC")
		if err == nil || !strings.Contains(err.Error(), "TELEGRAM_BOT_TOKEN") {
			t.Fatalf("expected bot token error, got %v", err)
		}
	})

	t.Run("validateInitData with bot token validates hash", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "real-bot-token", false, time.Hour)
		_, _, err := svc.validateInitData("query_id=AAA&user=BBB&hash=badhash")
		if err == nil {
			t.Fatal("expected hash validation error for bad hash")
		}
	})

	t.Run("validateWidgetData requires bot token", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		_, _, err := svc.validateWidgetData("id=12345&hash=CCC")
		if err == nil || !strings.Contains(err.Error(), "TELEGRAM_BOT_TOKEN") {
			t.Fatalf("expected bot token error, got %v", err)
		}
	})

	t.Run("validateWidgetData with bot token validates hash", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "real-bot-token", false, time.Hour)
		_, _, err := svc.validateWidgetData("id=12345&first_name=Test&hash=badhash")
		if err == nil {
			t.Fatal("expected hash validation error for bad hash")
		}
	})
}

func TestTelegramExpectedHash(t *testing.T) {
	t.Run("returns valid hash for non-empty bot token", func(t *testing.T) {
		hash, err := telegramExpectedHash("bot-token", "data_check_string")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(hash) == 0 {
			t.Fatal("expected non-empty hash")
		}
	})

	t.Run("returns deterministic hash for same inputs", func(t *testing.T) {
		hash1, _ := telegramExpectedHash("token", "check")
		hash2, _ := telegramExpectedHash("token", "check")
		if hash1 != hash2 {
			t.Fatal("expected deterministic hash")
		}
	})

	t.Run("empty bot token produces a hash without error", func(t *testing.T) {
		hash, err := telegramExpectedHash("", "data_check_string")
		if err != nil {
			t.Fatalf("unexpected error for empty bot token: %v", err)
		}
		if len(hash) == 0 {
			t.Fatal("expected non-empty hash even with empty bot token")
		}
	})
}

func TestIssueAuthResultBranches(t *testing.T) {
	t.Run("blocked workspace returns error", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		telegramID := int64(999)
		_, err := svc.issueAuthResult(
			store.User{ID: 1, TelegramID: telegramID},
			store.Workspace{ID: 1, IsBlocked: true, OwnerTelegramID: &telegramID},
		)
		if err == nil || !strings.Contains(err.Error(), "blocked") {
			t.Fatalf("expected blocked error, got %v", err)
		}
	})

	t.Run("nil store skips refresh session creation", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", false, time.Hour)
		telegramID := int64(888)
		result, err := svc.issueAuthResult(
			store.User{ID: 1, TelegramID: telegramID, Username: "user"},
			store.Workspace{ID: 1, Username: "user", OwnerTelegramID: &telegramID},
		)
		if err != nil {
			t.Fatalf("expected no error with nil store, got %v", err)
		}
		if result.Token == "" {
			t.Fatal("expected access token")
		}
		if result.RefreshToken != "" {
			t.Fatal("expected no refresh token when store is nil")
		}
	})
}

func TestSendTelegramLoginCodeHTTPBoundaries(t *testing.T) {
	for _, tc := range []struct {
		name string
		code int
		body string
		want string
	}{
		{name: "http error", code: http.StatusForbidden, body: "blocked", want: "telegram sendMessage failed"},
		{name: "decode error", code: http.StatusOK, body: "not-json", want: "decode telegram sendMessage"},
		{name: "api not ok", code: http.StatusOK, body: `{"ok":false,"description":"chat not found"}`, want: "chat not found"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.Method != http.MethodPost {
					t.Fatalf("expected POST, got %s", r.Method)
				}
				if r.Header.Get("Content-Type") != "application/json" {
					t.Fatalf("unexpected content type: %s", r.Header.Get("Content-Type"))
				}
				body, _ := io.ReadAll(r.Body)
				if !strings.Contains(string(body), "123456") || !strings.Contains(string(body), "alice") {
					t.Fatalf("expected request payload to include username and code, got %s", string(body))
				}
				w.WriteHeader(tc.code)
				_, _ = w.Write([]byte(tc.body))
			}))
			defer server.Close()

			svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
			svc.httpClient = rewriteServiceTelegramClient(t, server)
			err := svc.sendTelegramLoginCode(t.Context(), 100, "alice", "123456", time.Now().Add(time.Minute))
			if err == nil || !strings.Contains(err.Error(), tc.want) {
				t.Fatalf("expected %q error, got %v", tc.want, err)
			}
		})
	}

	t.Run("success", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			_, _ = w.Write([]byte(`{"ok":true}`))
		}))
		defer server.Close()

		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		svc.httpClient = rewriteServiceTelegramClient(t, server)
		if err := svc.sendTelegramLoginCode(t.Context(), 100, "alice", "123456", time.Now().Add(time.Minute)); err != nil {
			t.Fatalf("sendTelegramLoginCode returned error: %v", err)
		}
	})
}

func TestResolveTelegramIdentityAllBranches(t *testing.T) {
	t.Run("returns error when all fields empty", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{})
		if err == nil || !strings.Contains(err.Error(), "required") {
			t.Fatalf("expected required error, got %v", err)
		}
	})

	t.Run("uses insecure dev path when allowInsecureDev=true", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", true, time.Hour)
		id, username, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 42, Username: "devuser"})
		if err != nil {
			t.Fatalf("expected no error in dev mode, got %v", err)
		}
		if id != 42 || username != "devuser" {
			t.Fatalf("unexpected id/username: %d %q", id, username)
		}
	})

	t.Run("insecure dev path requires positive telegram id", func(t *testing.T) {
		svc := NewAuthService(nil, "secret", "", true, time.Hour)
		_, _, err := svc.resolveTelegramIdentity(TelegramAuthInput{TelegramID: 0})
		if err == nil {
			t.Fatal("expected error for zero telegram id in dev mode")
		}
	})
}

func TestTelegramExpectedHashDeterministic(t *testing.T) {
	h1, err := telegramExpectedHash("bot-token", "key=value\nother=thing")
	if err != nil {
		t.Fatalf("telegramExpectedHash: %v", err)
	}
	h2, err := telegramExpectedHash("bot-token", "key=value\nother=thing")
	if err != nil {
		t.Fatalf("telegramExpectedHash second: %v", err)
	}
	if h1 != h2 {
		t.Fatalf("expected deterministic hash, got %q vs %q", h1, h2)
	}
	// Different token → different hash
	h3, err := telegramExpectedHash("other-token", "key=value\nother=thing")
	if err != nil {
		t.Fatalf("telegramExpectedHash third: %v", err)
	}
	if h1 == h3 {
		t.Fatal("expected different hash for different token")
	}
}

func TestRandomAuthHelpers(t *testing.T) {
	t.Run("randomID produces non-empty string", func(t *testing.T) {
		id := randomID()
		if len(id) == 0 {
			t.Fatal("expected non-empty random id")
		}
	})

	t.Run("randomDigits produces digits-only string of correct length", func(t *testing.T) {
		digits, err := randomDigits(6)
		if err != nil {
			t.Fatalf("randomDigits: %v", err)
		}
		if len(digits) != 6 {
			t.Fatalf("expected 6 digits, got %d", len(digits))
		}
		for _, c := range digits {
			if c < '0' || c > '9' {
				t.Fatalf("expected digit, got %c", c)
			}
		}
	})

	t.Run("randomSyntheticTelegramID produces negative id", func(t *testing.T) {
		id, err := randomSyntheticTelegramID()
		if err != nil {
			t.Fatalf("randomSyntheticTelegramID: %v", err)
		}
		if id >= 0 {
			t.Fatalf("expected negative synthetic telegram id, got %d", id)
		}
	})
}

func TestValidateInitDataMissingFields(t *testing.T) {
	svc := NewAuthService(nil, "secret", "bot-token", false, time.Hour)

	t.Run("missing hash returns error", func(t *testing.T) {
		_, _, err := svc.validateInitData("auth_date=1700000000")
		if err == nil || !strings.Contains(err.Error(), "hash") {
			t.Fatalf("expected hash error, got %v", err)
		}
	})

	t.Run("missing auth_date returns error", func(t *testing.T) {
		_, _, err := svc.validateInitData("hash=abc123")
		if err == nil || !strings.Contains(err.Error(), "auth_date") {
			t.Fatalf("expected auth_date error, got %v", err)
		}
	})

	t.Run("invalid auth_date returns error", func(t *testing.T) {
		_, _, err := svc.validateInitData("hash=abc&auth_date=notanumber")
		if err == nil || !strings.Contains(err.Error(), "invalid") {
			t.Fatalf("expected invalid date error, got %v", err)
		}
	})
}

func TestAuthServiceParseTokenEdgeCases(t *testing.T) {
	svc := NewAuthService(nil, "secret", "", false, time.Hour)

	t.Run("empty token returns error", func(t *testing.T) {
		_, err := svc.ParseToken("")
		if err == nil {
			t.Fatal("expected error for empty token")
		}
	})

	t.Run("malformed token returns error", func(t *testing.T) {
		_, err := svc.ParseToken("not.a.jwt.token.here")
		if err == nil {
			t.Fatal("expected error for malformed token")
		}
	})
}

func rewriteServiceTelegramClient(t *testing.T, server *httptest.Server) *http.Client {
	t.Helper()

	baseURL, err := url.Parse(server.URL)
	if err != nil {
		t.Fatalf("url.Parse returned error: %v", err)
	}
	return &http.Client{
		Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
			req.URL.Scheme = baseURL.Scheme
			req.URL.Host = baseURL.Host
			return http.DefaultTransport.RoundTrip(req)
		}),
	}
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	return f(req)
}
