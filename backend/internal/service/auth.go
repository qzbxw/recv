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

	"recv/backend/internal/metrics"
	"recv/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
)

const telegramLoginCodeTTL = 10 * time.Minute

type AuthService struct {
	store              *store.Store
	jwtSecret          []byte
	telegramBotToken   string
	allowInsecureDev   bool
	telegramInitMaxAge time.Duration
	accessTTL          time.Duration
	refreshTTL         time.Duration
	httpClient         *http.Client
}

type TelegramAuthInput struct {
	InitData    string                  `json:"init_data"`
	WidgetData  string                  `json:"widget_data"`
	TelegramID  int64                   `json:"telegram_id"`
	Username    string                  `json:"username"`
	Attribution *store.AttributionInput `json:"attribution,omitempty"`
	RefCode     string                  `json:"ref_code,omitempty"`
}

type TelegramCodeRequestInput struct {
	Username string `json:"username"`
}

type TelegramCodeLoginInput struct {
	Username    string                  `json:"username"`
	Code        string                  `json:"code"`
	Attribution *store.AttributionInput `json:"attribution,omitempty"`
	RefCode     string                  `json:"ref_code,omitempty"`
}

type AgentBootstrapInput struct {
	WorkspaceName string                  `json:"workspace_name"`
	ContactEmail  string                  `json:"contact_email"`
	Attribution   *store.AttributionInput `json:"attribution,omitempty"`
	RefCode       string                  `json:"ref_code,omitempty"`
}

type AuthResult struct {
	Token        string          `json:"token"`
	AccessToken  string          `json:"access_token,omitempty"`
	RefreshToken string          `json:"refresh_token,omitempty"`
	User         store.User      `json:"user"`
	Workspace    store.Workspace `json:"workspace"`
}

type Claims struct {
	UserID      int64  `json:"user_id"`
	WorkspaceID int64  `json:"workspace_id"`
	TelegramID  int64  `json:"telegram_id"`
	Username    string `json:"username"`
	jwt.RegisteredClaims
}

func NewAuthService(st *store.Store, jwtSecret string, telegramBotToken string, allowInsecureDev bool, telegramInitMaxAge time.Duration) *AuthService {
	return NewAuthServiceWithTTL(st, jwtSecret, telegramBotToken, allowInsecureDev, telegramInitMaxAge, 30*24*time.Hour, 30*24*time.Hour)
}

func NewAuthServiceWithTTL(st *store.Store, jwtSecret string, telegramBotToken string, allowInsecureDev bool, telegramInitMaxAge time.Duration, accessTTL time.Duration, refreshTTL time.Duration) *AuthService {
	if accessTTL <= 0 {
		accessTTL = 15 * time.Minute
	}
	if refreshTTL <= 0 {
		refreshTTL = 30 * 24 * time.Hour
	}
	return &AuthService{
		store:              st,
		jwtSecret:          []byte(jwtSecret),
		telegramBotToken:   telegramBotToken,
		allowInsecureDev:   allowInsecureDev,
		telegramInitMaxAge: telegramInitMaxAge,
		accessTTL:          accessTTL,
		refreshTTL:         refreshTTL,
	}
}

func (s *AuthService) AuthenticateTelegram(ctx context.Context, input TelegramAuthInput) (AuthResult, error) {
	telegramID, username, err := s.resolveTelegramIdentity(input)
	if err != nil {
		metrics.IncAuthAttempt("telegram_identity", "failure", "resolve_identity")
		return AuthResult{}, err
	}

	workspace, err := s.store.UpsertWorkspaceByTelegram(ctx, telegramID, username)
	if err != nil {
		metrics.IncAuthAttempt("telegram_identity", "failure", "upsert_workspace")
		return AuthResult{}, fmt.Errorf("upsert workspace: %w", err)
	}

	user, err := s.store.GetUserByTelegramID(ctx, telegramID)
	if err != nil {
		return AuthResult{}, fmt.Errorf("load user: %w", err)
	}

	// Convert any pending team invitations addressed to this username into memberships.
	_, _ = s.store.AcceptPendingInvitesForUser(ctx, user.ID, user.Username)

	metrics.IncAuthAttempt("telegram_identity", "success", "resolved")
	if input.Attribution != nil {
		_ = s.store.RecordUTMAttribution(ctx, workspace.ID, *input.Attribution)
	}
	_ = s.store.AttachReferralSignup(ctx, workspace.ID, input.RefCode)
	return s.issueAuthResult(user, workspace)
}

func (s *AuthService) RequestTelegramLoginCode(ctx context.Context, input TelegramCodeRequestInput) error {
	username, err := normalizeTelegramUsername(input.Username)
	if err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "normalize_username")
		return err
	}
	if strings.TrimSpace(s.telegramBotToken) == "" {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "bot_token_missing")
		return errors.New("TELEGRAM_BOT_TOKEN is required for Telegram auth")
	}

	workspace, err := s.store.GetWorkspaceByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			metrics.IncAuthAttempt("telegram_code_request", "failure", "workspace_not_found")
			return errors.New("Telegram username not found. Open @recvmoney_bot, press Start, then request the code again")
		}
		metrics.IncAuthAttempt("telegram_code_request", "failure", "load_workspace")
		return fmt.Errorf("load workspace by username: %w", err)
	}
	if workspace.OwnerTelegramID == nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "telegram_unlinked")
		return errors.New("Telegram account is not linked yet. Open @recvmoney_bot and press Start first")
	}

	code, err := randomDigits(6)
	if err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "generate_code")
		return fmt.Errorf("generate auth code: %w", err)
	}

	expiresAt := time.Now().Add(telegramLoginCodeTTL)
	if err := s.store.StoreTelegramAuthCode(ctx, workspace.ID, hashTelegramCode(workspace.ID, code), expiresAt); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "store_code")
		return fmt.Errorf("store telegram auth code: %w", err)
	}

	if err := s.sendTelegramLoginCode(ctx, *workspace.OwnerTelegramID, username, code, expiresAt); err != nil {
		metrics.IncAuthAttempt("telegram_code_request", "failure", "send_code")
		return fmt.Errorf("send telegram auth code: %w", err)
	}
	metrics.IncAuthAttempt("telegram_code_request", "success", "sent")
	return nil
}

func (s *AuthService) AuthenticateTelegramCode(ctx context.Context, input TelegramCodeLoginInput) (AuthResult, error) {
	username, err := normalizeTelegramUsername(input.Username)
	if err != nil {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "normalize_username")
		return AuthResult{}, err
	}
	code := strings.TrimSpace(input.Code)
	if code == "" {
		metrics.IncAuthAttempt("telegram_code_login", "failure", "missing_code")
		return AuthResult{}, errors.New("verification code is required")
	}

	workspace, err := s.store.GetWorkspaceByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			metrics.IncAuthAttempt("telegram_code_login", "failure", "workspace_not_found")
			return AuthResult{}, errors.New("Telegram username not found. Open @recvmoney_bot, press Start, then request the code again")
		}
		metrics.IncAuthAttempt("telegram_code_login", "failure", "load_workspace")
		return AuthResult{}, fmt.Errorf("load workspace by username: %w", err)
	}

	if err := s.store.ConsumeTelegramAuthCode(ctx, workspace.ID, hashTelegramCode(workspace.ID, code)); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			metrics.IncAuthAttempt("telegram_code_login", "failure", "invalid_code")
			return AuthResult{}, errors.New("verification code is invalid or expired")
		}
		metrics.IncAuthAttempt("telegram_code_login", "failure", "consume_code")
		return AuthResult{}, fmt.Errorf("consume telegram auth code: %w", err)
	}

	user, err := s.store.GetUserByTelegramID(ctx, *workspace.OwnerTelegramID)
	if err != nil {
		return AuthResult{}, fmt.Errorf("load user: %w", err)
	}

	_, _ = s.store.AcceptPendingInvitesForUser(ctx, user.ID, user.Username)

	metrics.IncAuthAttempt("telegram_code_login", "success", "verified")
	if input.Attribution != nil {
		_ = s.store.RecordUTMAttribution(ctx, workspace.ID, *input.Attribution)
	}
	_ = s.store.AttachReferralSignup(ctx, workspace.ID, input.RefCode)
	return s.issueAuthResult(user, workspace)
}

func (s *AuthService) BootstrapAgentWorkspace(ctx context.Context, input AgentBootstrapInput) (AuthResult, error) {
	workspaceName := normalizeAgentWorkspaceName(input.WorkspaceName)
	email := strings.TrimSpace(strings.ToLower(input.ContactEmail))
	var lastErr error

	for attempts := 0; attempts < 5; attempts++ {
		syntheticTelegramID, err := randomSyntheticTelegramID()
		if err != nil {
			return AuthResult{}, err
		}
		suffix := randomID()[:12]
		username := fmt.Sprintf("agent_%s", suffix)
		if workspaceName != "" {
			username = fmt.Sprintf("%s_%s", workspaceName, suffix[:6])
		}

		user, workspace, err := s.store.CreateAgentWorkspace(ctx, syntheticTelegramID, username, email)
		if err != nil {
			lastErr = err
			continue
		}
		if input.Attribution != nil {
			_ = s.store.RecordUTMAttribution(ctx, workspace.ID, *input.Attribution)
		}
		_ = s.store.AttachReferralSignup(ctx, workspace.ID, input.RefCode)
		return s.issueAuthResult(user, workspace)
	}
	if lastErr != nil {
		return AuthResult{}, fmt.Errorf("bootstrap agent workspace: %w", lastErr)
	}
	return AuthResult{}, errors.New("bootstrap agent workspace failed")
}

func (s *AuthService) ParseToken(tokenString string) (Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		metrics.IncAuthAttempt("jwt_parse", "failure", "parse")
		return Claims{}, fmt.Errorf("parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		metrics.IncAuthAttempt("jwt_parse", "failure", "invalid")
		return Claims{}, errors.New("invalid token")
	}
	metrics.IncAuthAttempt("jwt_parse", "success", "valid")
	return *claims, nil
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (AuthResult, error) {
	if s.store == nil {
		return AuthResult{}, errors.New("refresh sessions are not configured")
	}
	user, workspace, err := s.store.RefreshSession(ctx, tokenHash(refreshToken))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return AuthResult{}, errors.New("invalid refresh token")
		}
		return AuthResult{}, err
	}
	return s.issueAuthResult(user, workspace)
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if s.store == nil {
		return errors.New("refresh sessions are not configured")
	}
	if err := s.store.RevokeRefreshSession(ctx, tokenHash(refreshToken)); err != nil && !errors.Is(err, store.ErrNotFound) {
		return err
	}
	return nil
}

func (s *AuthService) issueAuthResult(user store.User, workspace store.Workspace) (AuthResult, error) {
	if workspace.IsBlocked {
		return AuthResult{}, errors.New("workspace account is blocked")
	}

	token, err := s.issueToken(user, workspace)
	if err != nil {
		metrics.IncAuthAttempt("issue_token", "failure", "sign")
		return AuthResult{}, err
	}
	metrics.IncAuthAttempt("issue_token", "success", "signed")

	result := AuthResult{
		Token:       token,
		AccessToken: token,
		User:        user,
		Workspace:   workspace,
	}
	if s.store != nil {
		refreshToken, err := randomToken(32)
		if err != nil {
			return AuthResult{}, err
		}
		if err := s.store.CreateRefreshSession(context.Background(), user.ID, workspace.ID, tokenHash(refreshToken), time.Now().UTC().Add(s.refreshTTL), "", ""); err != nil {
			return AuthResult{}, err
		}
		result.RefreshToken = refreshToken
	}
	return result, nil
}

// SwitchWorkspace issues a fresh session for a different workspace the user
// already belongs to. It verifies membership before issuing the token.
func (s *AuthService) SwitchWorkspace(ctx context.Context, userID, workspaceID int64) (AuthResult, error) {
	if _, err := s.store.GetWorkspaceMemberRole(ctx, workspaceID, userID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return AuthResult{}, errors.New("you are not a member of this workspace")
		}
		return AuthResult{}, fmt.Errorf("verify membership: %w", err)
	}

	user, err := s.store.GetUserByID(ctx, userID)
	if err != nil {
		return AuthResult{}, fmt.Errorf("load user: %w", err)
	}
	workspace, err := s.store.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return AuthResult{}, fmt.Errorf("load workspace: %w", err)
	}
	return s.issueAuthResult(user, workspace)
}

func (s *AuthService) issueToken(user store.User, workspace store.Workspace) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:      user.ID,
		WorkspaceID: workspace.ID,
		TelegramID:  user.TelegramID,
		Username:    user.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
			Subject:   strconv.FormatInt(user.ID, 10),
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
	if s.telegramBotToken == "" {
		return 0, "", errors.New("TELEGRAM_BOT_TOKEN is required for Telegram auth")
	}

	values, err := url.ParseQuery(queryString)
	if err != nil {
		return 0, "", fmt.Errorf("parse widget_data: %w", err)
	}

	hash := values.Get("hash")
	if hash == "" {
		return 0, "", errors.New("widget hash is missing")
	}

	authDateValue := values.Get("auth_date")
	if authDateValue == "" {
		return 0, "", errors.New("widget auth_date is missing")
	}
	authUnix, err := strconv.ParseInt(authDateValue, 10, 64)
	if err != nil {
		return 0, "", errors.New("widget auth_date is invalid")
	}
	if time.Since(time.Unix(authUnix, 0)) > s.telegramInitMaxAge {
		return 0, "", errors.New("widget auth data is too old")
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

func hashTelegramCode(workspaceID int64, code string) string {
	sum := sha256.Sum256([]byte(strconv.FormatInt(workspaceID, 10) + "|" + strings.TrimSpace(code)))
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

func randomSyntheticTelegramID() (int64, error) {
	var buf [8]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return 0, err
	}
	var id int64
	for _, part := range buf {
		id = (id << 8) | int64(part)
	}
	id = id & 0x3fffffffffffffff
	if id == 0 {
		id = time.Now().UnixNano()
	}
	return -id, nil
}

func normalizeAgentWorkspaceName(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		return ""
	}
	var builder strings.Builder
	builder.Grow(len(raw))
	for _, ch := range raw {
		if ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9' {
			builder.WriteRune(ch)
			continue
		}
		if ch == '-' || ch == '_' || ch == ' ' {
			builder.WriteByte('_')
		}
	}
	name := strings.Trim(builder.String(), "_")
	if len(name) > 24 {
		name = name[:24]
	}
	return strings.Trim(name, "_")
}

func (s *AuthService) sendTelegramLoginCode(ctx context.Context, chatID int64, username string, code string, expiresAt time.Time) error {
	payload := map[string]any{
		"chat_id": chatID,
		"text": fmt.Sprintf(
			"recv login code for @%s\n\n%s\n\nExpires at %s UTC. If this wasn't you, ignore this message.",
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

	httpClient := s.httpClient
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 10 * time.Second}
	}
	resp, err := httpClient.Do(req)
	if err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "send_login_code", "failure", 0)
		return fmt.Errorf("telegram sendMessage: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= http.StatusBadRequest {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		metrics.ObserveUpstream("telegram_bot_api", "send_login_code", "failure", 0)
		return fmt.Errorf("telegram sendMessage failed: %s", strings.TrimSpace(string(respBody)))
	}

	var result struct {
		OK          bool   `json:"ok"`
		Description string `json:"description"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		metrics.ObserveUpstream("telegram_bot_api", "send_login_code", "failure", 0)
		return fmt.Errorf("decode telegram sendMessage: %w", err)
	}
	if !result.OK {
		metrics.ObserveUpstream("telegram_bot_api", "send_login_code", "failure", 0)
		return fmt.Errorf("telegram sendMessage failed: %s", result.Description)
	}
	metrics.ObserveUpstream("telegram_bot_api", "send_login_code", "success", 0)
	return nil
}
