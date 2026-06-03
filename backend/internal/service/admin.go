package service

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base32"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"recv/backend/internal/metrics"
	"recv/backend/internal/store"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AdminService struct {
	store             *store.Store
	username          string
	password          string
	jwtSecret         []byte
	accessTTL         time.Duration
	refreshTTL        time.Duration
	bootstrapEmail    string
	bootstrapPassword string
	appEnv            string
}

type AdminClaims struct {
	UserID    int64    `json:"user_id,omitempty"`
	SessionID int64    `json:"session_id,omitempty"`
	Email     string   `json:"email,omitempty"`
	Username  string   `json:"username"`
	Role      string   `json:"role"`
	Roles     []string `json:"roles,omitempty"`
	jwt.RegisteredClaims
}

type adminChallengeClaims struct {
	UserID        int64  `json:"user_id"`
	Email         string `json:"email"`
	TOTPSetup     bool   `json:"totp_setup"`
	ChallengeType string `json:"challenge_type"`
	jwt.RegisteredClaims
}

type AdminLoginResult struct {
	Token             string   `json:"token,omitempty"`
	RefreshToken      string   `json:"refresh_token,omitempty"`
	Username          string   `json:"username,omitempty"`
	Email             string   `json:"email,omitempty"`
	Roles             []string `json:"roles,omitempty"`
	MFARequired       bool     `json:"mfa_required,omitempty"`
	TOTPSetupRequired bool     `json:"totp_setup_required,omitempty"`
	TOTPSecret        string   `json:"totp_secret,omitempty"`
	ChallengeToken    string   `json:"challenge_token,omitempty"`
	RecoveryCodes     []string `json:"recovery_codes,omitempty"`
}

type AdminSessionInput struct {
	UserAgent string
	IPAddress string
}

func NewAdminService(username string, password string, jwtSecret string, sessionTTL time.Duration) *AdminService {
	if sessionTTL <= 0 {
		sessionTTL = 12 * time.Hour
	}
	return &AdminService{
		username:   strings.TrimSpace(username),
		password:   password,
		jwtSecret:  []byte(strings.TrimSpace(jwtSecret)),
		accessTTL:  sessionTTL,
		refreshTTL: sessionTTL,
		appEnv:     "development",
	}
}

func NewDBAdminService(st *store.Store, username string, password string, jwtSecret string, accessTTL time.Duration, refreshTTL time.Duration, bootstrapEmail string, bootstrapPassword string, appEnv string) *AdminService {
	if accessTTL <= 0 {
		accessTTL = 15 * time.Minute
	}
	if refreshTTL <= 0 {
		refreshTTL = 12 * time.Hour
	}
	return &AdminService{
		store:             st,
		username:          strings.TrimSpace(username),
		password:          password,
		jwtSecret:         []byte(strings.TrimSpace(jwtSecret)),
		accessTTL:         accessTTL,
		refreshTTL:        refreshTTL,
		bootstrapEmail:    strings.TrimSpace(strings.ToLower(bootstrapEmail)),
		bootstrapPassword: bootstrapPassword,
		appEnv:            strings.TrimSpace(appEnv),
	}
}

func (s *AdminService) Enabled() bool {
	if len(s.jwtSecret) == 0 {
		return false
	}
	if s.store != nil {
		return true
	}
	return s.username != "" && s.password != ""
}

func (s *AdminService) Bootstrap(ctx context.Context) (bool, error) {
	if s.store == nil || s.bootstrapEmail == "" || s.bootstrapPassword == "" {
		return false, nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(s.bootstrapPassword), bcrypt.DefaultCost)
	if err != nil {
		return false, fmt.Errorf("hash bootstrap admin password: %w", err)
	}
	admin, created, err := s.store.EnsureBootstrapAdmin(ctx, s.bootstrapEmail, string(hash))
	if err != nil {
		return false, err
	}
	if created {
		_ = s.store.RecordAdminAuditEvent(ctx, admin.Email, "admin_bootstrap", "admin_user", strconv.FormatInt(admin.ID, 10), map[string]any{"roles": admin.Roles})
	}
	return created, nil
}

func (s *AdminService) Authenticate(username string, password string) (string, error) {
	result, err := s.StartLogin(context.Background(), username, password)
	if err != nil {
		return "", err
	}
	if result.MFARequired {
		return "", errors.New("admin MFA is required")
	}
	return result.Token, nil
}

func (s *AdminService) StartLogin(ctx context.Context, username string, password string) (AdminLoginResult, error) {
	if !s.Enabled() {
		return AdminLoginResult{}, errors.New("admin access is not configured")
	}
	if s.store == nil {
		return s.authenticateLegacy(username, password)
	}

	email := strings.TrimSpace(strings.ToLower(username))
	admin, err := s.store.GetAdminUserByEmail(ctx, email)
	if err != nil || !admin.IsActive {
		metrics.IncAuthAttempt("admin_login", "failure", "username")
		return AdminLoginResult{}, errors.New("invalid admin credentials")
	}
	if bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(password)) != nil {
		metrics.IncAuthAttempt("admin_login", "failure", "password")
		return AdminLoginResult{}, errors.New("invalid admin credentials")
	}

	setupRequired := !admin.TOTPEnabled || strings.TrimSpace(admin.TOTPSecret) == ""
	secret := admin.TOTPSecret
	if setupRequired {
		var genErr error
		secret, genErr = generateTOTPSecret()
		if genErr != nil {
			return AdminLoginResult{}, genErr
		}
		if err := s.store.SetAdminTOTPSecret(ctx, admin.ID, secret, false); err != nil {
			return AdminLoginResult{}, err
		}
	}
	challenge, err := s.issueChallengeToken(admin, setupRequired)
	if err != nil {
		return AdminLoginResult{}, err
	}
	metrics.IncAuthAttempt("admin_login", "success", "password_verified")
	return AdminLoginResult{
		Username:          admin.Email,
		Email:             admin.Email,
		MFARequired:       true,
		TOTPSetupRequired: setupRequired,
		TOTPSecret:        secret,
		ChallengeToken:    challenge,
		Roles:             admin.Roles,
	}, nil
}

func (s *AdminService) VerifyTOTP(ctx context.Context, challengeToken string, code string, input AdminSessionInput) (AdminLoginResult, error) {
	if s.store == nil {
		return AdminLoginResult{}, errors.New("admin MFA is not configured")
	}
	claims, err := s.parseChallengeToken(challengeToken)
	if err != nil {
		metrics.IncAuthAttempt("admin_mfa", "failure", "challenge")
		return AdminLoginResult{}, err
	}
	admin, err := s.store.GetAdminUserByID(ctx, claims.UserID)
	if err != nil || !admin.IsActive {
		metrics.IncAuthAttempt("admin_mfa", "failure", "admin_user")
		return AdminLoginResult{}, errors.New("invalid admin MFA challenge")
	}
	code = strings.TrimSpace(code)
	valid := validateTOTP(admin.TOTPSecret, code, time.Now().UTC())
	if !valid {
		var consumed bool
		consumed, err = s.store.ConsumeAdminRecoveryCode(ctx, admin.ID, tokenHash(strings.ToUpper(code)))
		if err != nil {
			return AdminLoginResult{}, err
		}
		valid = consumed
	}
	if !valid {
		metrics.IncAuthAttempt("admin_mfa", "failure", "code")
		return AdminLoginResult{}, errors.New("invalid admin MFA code")
	}

	recoveryCodes := []string(nil)
	if claims.TOTPSetup || !admin.TOTPEnabled {
		if err := s.store.SetAdminTOTPSecret(ctx, admin.ID, admin.TOTPSecret, true); err != nil {
			return AdminLoginResult{}, err
		}
		recoveryCodes, err = generateRecoveryCodes(10)
		if err != nil {
			return AdminLoginResult{}, err
		}
		hashes := make([]string, 0, len(recoveryCodes))
		for _, code := range recoveryCodes {
			hashes = append(hashes, tokenHash(code))
		}
		if err := s.store.StoreAdminRecoveryCodes(ctx, admin.ID, hashes); err != nil {
			return AdminLoginResult{}, err
		}
		admin.TOTPEnabled = true
	}

	refreshToken, err := randomToken(32)
	if err != nil {
		return AdminLoginResult{}, err
	}
	session, err := s.store.CreateAdminSession(ctx, admin.ID, tokenHash(refreshToken), time.Now().UTC().Add(s.refreshTTL), input.UserAgent, input.IPAddress)
	if err != nil {
		return AdminLoginResult{}, err
	}
	token, err := s.issueToken(admin, session.ID)
	if err != nil {
		return AdminLoginResult{}, err
	}
	_ = s.store.MarkAdminLogin(ctx, admin.ID)
	metrics.IncAuthAttempt("admin_mfa", "success", "verified")
	return AdminLoginResult{Token: token, RefreshToken: refreshToken, Username: admin.Email, Email: admin.Email, Roles: admin.Roles, RecoveryCodes: recoveryCodes}, nil
}

func (s *AdminService) Refresh(ctx context.Context, refreshToken string) (AdminLoginResult, error) {
	if s.store == nil {
		return AdminLoginResult{}, errors.New("admin refresh is not configured")
	}
	session, err := s.store.GetAdminSessionByRefreshHash(ctx, tokenHash(refreshToken))
	if err != nil || session.RevokedAt != nil || !session.ExpiresAt.After(time.Now().UTC()) {
		return AdminLoginResult{}, errors.New("invalid admin refresh session")
	}
	admin, err := s.store.GetAdminUserByID(ctx, session.AdminUserID)
	if err != nil || !admin.IsActive {
		return AdminLoginResult{}, errors.New("invalid admin refresh session")
	}
	if err := s.store.TouchAdminSession(ctx, session.ID); err != nil {
		return AdminLoginResult{}, err
	}
	token, err := s.issueToken(admin, session.ID)
	if err != nil {
		return AdminLoginResult{}, err
	}
	return AdminLoginResult{Token: token, Username: admin.Email, Email: admin.Email, Roles: admin.Roles}, nil
}

func (s *AdminService) RevokeSession(ctx context.Context, sessionID int64) error {
	if s.store == nil {
		return errors.New("admin sessions are not configured")
	}
	return s.store.RevokeAdminSession(ctx, sessionID)
}

func (s *AdminService) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	if s.store == nil {
		return errors.New("admin sessions are not configured")
	}
	session, err := s.store.GetAdminSessionByRefreshHash(ctx, tokenHash(refreshToken))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return nil
		}
		return err
	}
	return s.store.RevokeAdminSession(ctx, session.ID)
}

func (s *AdminService) ParseToken(tokenString string) (AdminClaims, error) {
	if !s.Enabled() {
		return AdminClaims{}, errors.New("admin access is not configured")
	}

	token, err := jwt.ParseWithClaims(tokenString, &AdminClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		metrics.IncAuthAttempt("admin_token", "failure", "parse")
		return AdminClaims{}, fmt.Errorf("parse admin token: %w", err)
	}

	claims, ok := token.Claims.(*AdminClaims)
	if !ok || !token.Valid || claims.Role == "" {
		metrics.IncAuthAttempt("admin_token", "failure", "invalid")
		return AdminClaims{}, errors.New("invalid admin token")
	}
	if s.store != nil {
		if claims.SessionID == 0 {
			return AdminClaims{}, errors.New("invalid admin session")
		}
		active, err := s.store.IsAdminSessionActive(context.Background(), claims.SessionID)
		if err != nil {
			return AdminClaims{}, err
		}
		if !active {
			return AdminClaims{}, errors.New("admin session revoked or expired")
		}
	}
	metrics.IncAuthAttempt("admin_token", "success", "authenticated")
	return *claims, nil
}

func (s *AdminService) authenticateLegacy(username string, password string) (AdminLoginResult, error) {
	if strings.TrimSpace(username) != s.username {
		metrics.IncAuthAttempt("admin_login", "failure", "username")
		return AdminLoginResult{}, errors.New("invalid admin credentials")
	}
	if subtle.ConstantTimeCompare([]byte(s.password), []byte(password)) != 1 {
		metrics.IncAuthAttempt("admin_login", "failure", "password")
		return AdminLoginResult{}, errors.New("invalid admin credentials")
	}
	token, err := s.issueLegacyToken()
	if err != nil {
		metrics.IncAuthAttempt("admin_login", "failure", "issue_token")
		return AdminLoginResult{}, err
	}
	metrics.IncAuthAttempt("admin_login", "success", "authenticated")
	return AdminLoginResult{Token: token, Username: s.username, Roles: []string{"super_admin"}}, nil
}

func (s *AdminService) issueToken(admin store.AdminUser, sessionID int64) (string, error) {
	now := time.Now().UTC()
	role := "admin"
	if len(admin.Roles) > 0 {
		role = admin.Roles[0]
	}
	claims := AdminClaims{
		UserID:    admin.ID,
		SessionID: sessionID,
		Email:     admin.Email,
		Username:  admin.Email,
		Role:      role,
		Roles:     admin.Roles,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomAdminID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
			Subject:   strconv.FormatInt(admin.ID, 10),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign admin token: %w", err)
	}
	return signed, nil
}

func (s *AdminService) issueLegacyToken() (string, error) {
	now := time.Now().UTC()
	claims := AdminClaims{
		Username: s.username,
		Role:     "admin",
		Roles:    []string{"super_admin"},
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomAdminID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessTTL)),
			Subject:   s.username,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign admin token: %w", err)
	}
	return signed, nil
}

func (s *AdminService) issueChallengeToken(admin store.AdminUser, setup bool) (string, error) {
	now := time.Now().UTC()
	claims := adminChallengeClaims{
		UserID:        admin.ID,
		Email:         admin.Email,
		TOTPSetup:     setup,
		ChallengeType: "admin_mfa",
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        randomAdminID(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(5 * time.Minute)),
			Subject:   strconv.FormatInt(admin.ID, 10),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.jwtSecret)
	if err != nil {
		return "", fmt.Errorf("sign admin MFA challenge: %w", err)
	}
	return signed, nil
}

func (s *AdminService) parseChallengeToken(tokenString string) (adminChallengeClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &adminChallengeClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("unexpected signing method: %s", token.Method.Alg())
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return adminChallengeClaims{}, fmt.Errorf("parse admin MFA challenge: %w", err)
	}
	claims, ok := token.Claims.(*adminChallengeClaims)
	if !ok || !token.Valid || claims.ChallengeType != "admin_mfa" {
		return adminChallengeClaims{}, errors.New("invalid admin MFA challenge")
	}
	return *claims, nil
}

func generateTOTPSecret() (string, error) {
	var buf [20]byte
	if _, err := rand.Read(buf[:]); err != nil {
		return "", fmt.Errorf("generate TOTP secret: %w", err)
	}
	return strings.TrimRight(base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(buf[:]), "="), nil
}

func validateTOTP(secret string, code string, now time.Time) bool {
	code = strings.TrimSpace(code)
	if len(code) != 6 {
		return false
	}
	for _, char := range code {
		if char < '0' || char > '9' {
			return false
		}
	}
	for offset := -1; offset <= 1; offset++ {
		expected, err := totpCode(secret, now.Add(time.Duration(offset)*30*time.Second))
		if err == nil && subtle.ConstantTimeCompare([]byte(expected), []byte(code)) == 1 {
			return true
		}
	}
	return false
}

func totpCode(secret string, t time.Time) (string, error) {
	decoded, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(strings.ToUpper(strings.TrimSpace(secret)))
	if err != nil {
		return "", err
	}
	counter := uint64(t.Unix() / 30)
	var msg [8]byte
	binary.BigEndian.PutUint64(msg[:], counter)
	mac := hmac.New(sha1.New, decoded)
	_, _ = mac.Write(msg[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	value := (uint32(sum[offset])&0x7f)<<24 |
		(uint32(sum[offset+1])&0xff)<<16 |
		(uint32(sum[offset+2])&0xff)<<8 |
		(uint32(sum[offset+3]) & 0xff)
	code := value % uint32(math.Pow10(6))
	return fmt.Sprintf("%06d", code), nil
}

func generateRecoveryCodes(count int) ([]string, error) {
	codes := make([]string, 0, count)
	for i := 0; i < count; i++ {
		token, err := randomToken(8)
		if err != nil {
			return nil, err
		}
		codes = append(codes, strings.ToUpper(token[:4]+"-"+token[4:8]+"-"+token[8:12]))
	}
	return codes, nil
}

func randomAdminID() string {
	token, err := randomToken(16)
	if err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return token
}

func randomToken(size int) (string, error) {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return hex.EncodeToString(buf), nil
}

func tokenHash(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}
