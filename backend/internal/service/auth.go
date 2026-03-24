package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
)

const telegramLoginCodeTTL = 10 * time.Minute

type AuthService struct {
	store              *store.Store
	jwtSecret          []byte
	telegramBotToken   string
	allowInsecureDev   bool
	telegramInitMaxAge time.Duration
}

type TelegramAuthInput struct {
	InitData   string `json:"init_data"`
	WidgetData string `json:"widget_data"`
	TelegramID int64  `json:"telegram_id"`
	Username   string `json:"username"`
}

type TelegramCodeRequestInput struct {
	Username string `json:"username"`
}

type TelegramCodeLoginInput struct {
	Username string `json:"username"`
	Code     string `json:"code"`
}

type AuthResult struct {
	Token  string       `json:"token"`
	Seller store.Seller `json:"seller"`
}

type Claims struct {
	SellerID   int64  `json:"seller_id"`
	TelegramID *int64 `json:"telegram_id,omitempty"`
	Username   string `json:"username"`
	jwt.RegisteredClaims
}

func NewAuthService(st *store.Store, jwtSecret string, telegramBotToken string, allowInsecureDev bool, telegramInitMaxAge time.Duration) *AuthService {
	return &AuthService{
		store:              st,
		jwtSecret:          []byte(jwtSecret),
		telegramBotToken:   telegramBotToken,
		allowInsecureDev:   allowInsecureDev,
		telegramInitMaxAge: telegramInitMaxAge,
	}
}

func (s *AuthService) AuthenticateTelegram(ctx context.Context, input TelegramAuthInput) (AuthResult, error) {
	telegramID, username, err := s.resolveTelegramIdentity(input)
	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.UpsertSellerByTelegram(ctx, telegramID, username)
	if err != nil {
		return AuthResult{}, fmt.Errorf("upsert seller: %w", err)
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) RequestTelegramLoginCode(ctx context.Context, input TelegramCodeRequestInput) error {
	username, err := normalizeTelegramUsername(input.Username)
	if err != nil {
		return err
	}
	if strings.TrimSpace(s.telegramBotToken) == "" {
		return errors.New("TELEGRAM_BOT_TOKEN is required for Telegram auth")
	}

	seller, err := s.store.GetSellerByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return errors.New("Telegram username not found. Open @reqstxyz_bot, press Start, then request the code again")
		}
		return fmt.Errorf("load seller by username: %w", err)
	}
	if seller.TelegramID == nil {
		return errors.New("Telegram account is not linked yet. Open @reqstxyz_bot and press Start first")
	}

	code, err := randomDigits(6)
	if err != nil {
		return fmt.Errorf("generate auth code: %w", err)
	}

	expiresAt := time.Now().Add(telegramLoginCodeTTL)
	if err := s.store.StoreTelegramAuthCode(ctx, seller.ID, hashTelegramCode(seller.ID, code), expiresAt); err != nil {
		return fmt.Errorf("store telegram auth code: %w", err)
	}

	if err := s.sendTelegramLoginCode(ctx, *seller.TelegramID, username, code, expiresAt); err != nil {
		return fmt.Errorf("send telegram auth code: %w", err)
	}
	return nil
}

func (s *AuthService) AuthenticateTelegramCode(ctx context.Context, input TelegramCodeLoginInput) (AuthResult, error) {
	username, err := normalizeTelegramUsername(input.Username)
	if err != nil {
		return AuthResult{}, err
	}
	code := strings.TrimSpace(input.Code)
	if code == "" {
		return AuthResult{}, errors.New("verification code is required")
	}

	seller, err := s.store.GetSellerByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return AuthResult{}, errors.New("Telegram username not found. Open @reqstxyz_bot, press Start, then request the code again")
		}
		return AuthResult{}, fmt.Errorf("load seller by username: %w", err)
	}

	if err := s.store.ConsumeTelegramAuthCode(ctx, seller.ID, hashTelegramCode(seller.ID, code)); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return AuthResult{}, errors.New("verification code is invalid or expired")
		}
		return AuthResult{}, fmt.Errorf("consume telegram auth code: %w", err)
	}
	return s.issueAuthResult(seller)
}

func (s *AuthService) ParseToken(tokenString string) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		return s.jwtSecret, nil
	})
	if err != nil {
		return Claims{}, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return Claims{}, errors.New("invalid token")
	}
	return *claims, nil
}

func (s *AuthService) issueAuthResult(seller store.Seller) (AuthResult, error) {
	if seller.IsBlocked {
		return AuthResult{}, errors.New("seller account is blocked")
	}

	token, err := s.issueToken(seller)
	if err != nil {
		return AuthResult{}, err
	}

	return AuthResult{
		Token:  token,
		Seller: seller,
	}, nil
}

func (s *AuthService) issueToken(seller store.Seller) (string, error) {
	now := time.Now()
	claims := Claims{
		SellerID:   seller.ID,
		TelegramID: seller.TelegramID,
		Username:   seller.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(72 * time.Hour)),
			Subject:   strconv.FormatInt(seller.ID, 10),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}

func (s *AuthService) resolveTelegramIdentity(input TelegramAuthInput) (int64, string, error) {
	if strings.TrimSpace(input.InitData) != "" {
		return s.validateInitData(input.InitData)
	}
	if strings.TrimSpace(input.WidgetData) != "" {
		return s.validateWidgetData(input.WidgetData)
	}
	if s.allowInsecureDev && input.TelegramID > 0 {
		return input.TelegramID, strings.TrimSpace(input.Username), nil
	}
	return 0, "", errors.New("telegram authentication data is required")
}

func (s *AuthService) validateInitData(initData string) (int64, string, error) {
	if s.telegramBotToken == "" {
		return 0, "", errors.New("TELEGRAM_BOT_TOKEN is required for Telegram auth")
	}

	values, err := url.ParseQuery(initData)
	if err != nil {
		return 0, "", fmt.Errorf("parse init_data: %w", err)
	}

	hash := values.Get("hash")
	if hash == "" {
		return 0, "", errors.New("telegram hash is missing")
	}

	authDateValue := values.Get("auth_date")
	if authDateValue == "" {
		return 0, "", errors.New("telegram auth_date is missing")
	}
	authUnix, err := strconv.ParseInt(authDateValue, 10, 64)
	if err != nil {
		return 0, "", errors.New("telegram auth_date is invalid")
	}
	if time.Since(time.Unix(authUnix, 0)) > s.telegramInitMaxAge {
		return 0, "", errors.New("telegram init_data is too old")
	}

	dataCheckString := telegramDataCheckString(values)
	expectedHash, err := telegramExpectedHash(s.telegramBotToken, dataCheckString)
	if err != nil {
		return 0, "", err
	}
	if !hmac.Equal([]byte(hash), []byte(expectedHash)) {
		return 0, "", errors.New("telegram signature mismatch")
	}

	userJSON := values.Get("user")
	if userJSON == "" {
		return 0, "", errors.New("telegram user payload is missing")
	}

	var user struct {
		ID       int64  `json:"id"`
		Username string `json:"username"`
	}
	if err := json.Unmarshal([]byte(userJSON), &user); err != nil {
		return 0, "", fmt.Errorf("decode telegram user: %w", err)
	}
	if user.ID == 0 {
		return 0, "", errors.New("telegram user id is missing")
	}

	return user.ID, strings.TrimSpace(user.Username), nil
}

func (s *AuthService) validateWidgetData(queryString string) (int64, string, error) {
	values, err := url.ParseQuery(queryString)
	if err != nil {
		return 0, "", fmt.Errorf("parse widget_data: %w", err)
	}

	hash := values.Get("hash")
	if hash == "" {
		return 0, "", errors.New("widget hash is missing")
	}

	keys := make([]string, 0, len(values))
	for k := range values {
		if k != "hash" {
			keys = append(keys, k)
		}
	}
	sort.Strings(keys)

	var dataParts []string
	for _, k := range keys {
		dataParts = append(dataParts, fmt.Sprintf("%s=%s", k, values.Get(k)))
	}
	dataCheckString := strings.Join(dataParts, "\n")

	sha := sha256.New()
	sha.Write([]byte(s.telegramBotToken))
	secretKey := sha.Sum(nil)

	mac := hmac.New(sha256.New, secretKey)
	mac.Write([]byte(dataCheckString))
	expectedHash := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(hash), []byte(expectedHash)) {
		return 0, "", errors.New("widget signature mismatch")
	}

	idStr := values.Get("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, "", fmt.Errorf("invalid telegram id in widget: %w", err)
	}

	return id, strings.TrimSpace(values.Get("username")), nil
}

func normalizeTelegramUsername(value string) (string, error) {
	username := strings.TrimSpace(strings.TrimPrefix(strings.TrimSpace(value), "@"))
	if username == "" {
		return "", errors.New("telegram username is required")
	}
	if len(username) < 5 || len(username) > 32 {
		return "", errors.New("telegram username must be between 5 and 32 characters")
	}
	for _, char := range username {
		if (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9') || char == '_' {
			continue
		}
		return "", errors.New("telegram username may contain only letters, numbers, and underscores")
	}
	return strings.ToLower(username), nil
}

func telegramDataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for key := range values {
		if key == "hash" {
			continue
		}
		keys = append(keys, key)
	}
	sort.Strings(keys)

	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, fmt.Sprintf("%s=%s", key, values.Get(key)))
	}
	return strings.Join(parts, "\n")
}

func telegramExpectedHash(botToken string, dataCheckString string) (string, error) {
	secret := hmac.New(sha256.New, []byte("WebAppData"))
	if _, err := secret.Write([]byte(botToken)); err != nil {
		return "", fmt.Errorf("derive telegram secret: %w", err)
	}

	mac := hmac.New(sha256.New, secret.Sum(nil))
	if _, err := mac.Write([]byte(dataCheckString)); err != nil {
		return "", fmt.Errorf("hash telegram data: %w", err)
	}
	return hex.EncodeToString(mac.Sum(nil)), nil
}

func hashTelegramCode(sellerID int64, code string) string {
	sum := sha256.Sum256([]byte(strconv.FormatInt(sellerID, 10) + "|" + strings.TrimSpace(code)))
	return hex.EncodeToString(sum[:])
}

func randomDigits(length int) (string, error) {
	if length <= 0 {
		return "", errors.New("invalid random length")
	}

	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}

	var builder strings.Builder
	builder.Grow(length)
	for _, part := range buf {
		builder.WriteByte('0' + (part % 10))
	}
	return builder.String(), nil
}

func randomID() string {
	var buf [16]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	return hex.EncodeToString(buf[:])
}

func (s *AuthService) sendTelegramLoginCode(ctx context.Context, chatID int64, username string, code string, expiresAt time.Time) error {
	payload := map[string]any{
		"chat_id": chatID,
		"text": fmt.Sprintf(
			"Reqst login code for @%s\n\n%s\n\nExpires at %s UTC. If this wasn't you, ignore this message.",
			username,
			code,
			expiresAt.UTC().Format("15:04"),
		),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal telegram payload: %w", err)
	}

	endpoint := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", s.telegramBotToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("build telegram request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		return fmt.Errorf("telegram sendMessage: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("telegram sendMessage failed: %s", strings.TrimSpace(string(respBody)))
	}

	var result struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("decode telegram sendMessage: %w", err)
	}
	if !result.OK {
		return fmt.Errorf("telegram sendMessage failed: %s", result.Description)
	}
	return nil
}
