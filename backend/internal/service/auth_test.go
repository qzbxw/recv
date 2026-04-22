package service

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"

	"reqst/backend/internal/store"

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
