package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"reqst/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
)

type AuthService struct {
	store              *store.Store
	jwtSecret          []byte
	telegramBotToken   string
	allowInsecureDev   bool
	telegramInitMaxAge time.Duration
}

type TelegramAuthInput struct {
	InitData   string `json:"init_data"`
	WidgetData string `json:"widget_data"` // From Telegram Login Widget
	TelegramID int64  `json:"telegram_id"`
	Username   string `json:"username"`
}

type AuthResult struct {
	Token  string       `json:"token"`
	Seller store.Seller `json:"seller"`
}

type Claims struct {
	SellerID   int64  `json:"seller_id"`
	TelegramID int64  `json:"telegram_id"`
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

func (s *AuthService) Authenticate(ctx context.Context, input TelegramAuthInput) (AuthResult, error) {
	var telegramID int64
	var username string
	var err error

	if strings.TrimSpace(input.InitData) != "" {
		telegramID, username, err = s.validateInitData(input.InitData)
	} else if strings.TrimSpace(input.WidgetData) != "" {
		telegramID, username, err = s.validateWidgetData(input.WidgetData)
	} else if s.allowInsecureDev && input.TelegramID > 0 {
		telegramID, username = input.TelegramID, strings.TrimSpace(input.Username)
	} else {
		return AuthResult{}, errors.New("telegram authentication data is required")
	}

	if err != nil {
		return AuthResult{}, err
	}

	seller, err := s.store.UpsertSellerByTelegram(ctx, telegramID, username)
	if err != nil {
		return AuthResult{}, fmt.Errorf("upsert seller: %w", err)
	}

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

	return id, values.Get("username"), nil
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

func randomID() string {
	var buf [16]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return strconv.FormatInt(time.Now().UnixNano(), 10)
	}
	return hex.EncodeToString(buf[:])
}
