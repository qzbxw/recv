package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

var ErrConflict = errors.New("conflict")

func (s *Store) StoreOAuthState(ctx context.Context, state OAuthState) error {
	if strings.TrimSpace(state.StateHash) == "" || strings.TrimSpace(state.Provider) == "" || strings.TrimSpace(state.Mode) == "" {
		return fmt.Errorf("invalid oauth state")
	}
	redirectPath := strings.TrimSpace(state.RedirectPath)
	if redirectPath == "" {
		redirectPath = "/console"
	}
	if state.ExpiresAt.IsZero() {
		state.ExpiresAt = time.Now().UTC().Add(10 * time.Minute)
	}

	var attributionJSON []byte
	var err error
	if state.Attribution != nil {
		attributionJSON, err = json.Marshal(state.Attribution)
		if err != nil {
			return fmt.Errorf("marshal oauth attribution: %w", err)
		}
	}

	_, err = s.pool.Exec(ctx, `
		INSERT INTO oauth_states (state_hash, provider, mode, user_id, redirect_path, ref_code, attribution, expires_at)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, $8)
	`, state.StateHash, normalizeProvider(state.Provider), strings.TrimSpace(state.Mode), state.UserID, redirectPath, strings.TrimSpace(state.RefCode), attributionJSON, state.ExpiresAt)
	if err != nil {
		return fmt.Errorf("store oauth state: %w", err)
	}
	return nil
}

func (s *Store) ConsumeOAuthState(ctx context.Context, provider string, stateHash string) (OAuthState, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return OAuthState{}, err
	}
	defer tx.Rollback(ctx)

	var state OAuthState
	var userID sql.NullInt64
	var refCode sql.NullString
	var attributionBytes []byte
	err = tx.QueryRow(ctx, `
		UPDATE oauth_states
		SET consumed_at = NOW()
		WHERE state_hash = $1
		  AND provider = $2
		  AND consumed_at IS NULL
		  AND expires_at > NOW()
		RETURNING state_hash, provider, mode, user_id, redirect_path, ref_code, attribution, expires_at
	`, stateHash, normalizeProvider(provider)).Scan(
		&state.StateHash,
		&state.Provider,
		&state.Mode,
		&userID,
		&state.RedirectPath,
		&refCode,
		&attributionBytes,
		&state.ExpiresAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return OAuthState{}, ErrNotFound
	}
	if err != nil {
		return OAuthState{}, fmt.Errorf("consume oauth state: %w", err)
	}
	if userID.Valid {
		v := userID.Int64
		state.UserID = &v
	}
	if refCode.Valid {
		state.RefCode = refCode.String
	}
	if len(attributionBytes) > 0 {
		var attr AttributionInput
		if err := json.Unmarshal(attributionBytes, &attr); err != nil {
			return OAuthState{}, fmt.Errorf("decode oauth attribution: %w", err)
		}
		state.Attribution = &attr
	}
	if err := tx.Commit(ctx); err != nil {
		return OAuthState{}, err
	}
	return state, nil
}

func (s *Store) ListAuthIdentities(ctx context.Context, userID int64) ([]AuthIdentity, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, user_id, provider, provider_user_id, COALESCE(email, ''), email_verified,
		       COALESCE(display_name, ''), COALESCE(username, ''), COALESCE(avatar_url, ''), linked_at, last_login_at
		FROM auth_identities
		WHERE user_id = $1
		ORDER BY provider ASC, linked_at ASC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("list auth identities: %w", err)
	}
	defer rows.Close()

	identities := []AuthIdentity{}
	seenTelegram := false
	for rows.Next() {
		identity, err := scanAuthIdentity(rows)
		if err != nil {
			return nil, err
		}
		if identity.Provider == "telegram" {
			seenTelegram = true
		}
		identities = append(identities, identity)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	user, err := s.GetUserByID(ctx, userID)
	if err == nil && user.TelegramID > 0 && !seenTelegram {
		identities = append(identities, AuthIdentity{
			UserID:         user.ID,
			Provider:       "telegram",
			ProviderUserID: fmt.Sprintf("%d", user.TelegramID),
			Username:       user.Username,
			LinkedAt:       user.CreatedAt,
			LastLoginAt:    user.CreatedAt,
		})
	}
	return identities, nil
}

func (s *Store) ResolveOAuthLogin(ctx context.Context, input OAuthIdentityInput) (User, Workspace, bool, error) {
	input = normalizeOAuthIdentityInput(input)
	if err := validateOAuthIdentityInput(input); err != nil {
		return User{}, Workspace{}, false, err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, Workspace{}, false, err
	}
	defer tx.Rollback(ctx)

	existingUserID, err := findIdentityUserID(ctx, tx, input.Provider, input.ProviderUserID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return User{}, Workspace{}, false, err
	}
	if err == nil {
		user, workspace, err := touchIdentityAndLoadPrimaryWorkspace(ctx, tx, existingUserID, input)
		if err != nil {
			return User{}, Workspace{}, false, err
		}
		return user, workspace, false, tx.Commit(ctx)
	}

	var userID int64
	if input.EmailVerified && input.Email != "" {
		userID, err = findSingleUserIDByEmail(ctx, tx, input.Email)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return User{}, Workspace{}, false, err
		}
	}

	created := false
	if userID == 0 {
		userID, _, err = createOAuthUserAndWorkspace(ctx, tx, input)
		if err != nil {
			return User{}, Workspace{}, false, err
		}
		created = true
	}

	if err := upsertAuthIdentity(ctx, tx, userID, input); err != nil {
		return User{}, Workspace{}, false, err
	}
	user, workspace, err := loadPrimaryWorkspaceForUser(ctx, tx, userID)
	if err != nil {
		return User{}, Workspace{}, false, err
	}
	return user, workspace, created, tx.Commit(ctx)
}

func (s *Store) LinkOAuthIdentity(ctx context.Context, targetUserID int64, input OAuthIdentityInput) (User, Workspace, bool, error) {
	input = normalizeOAuthIdentityInput(input)
	if err := validateOAuthIdentityInput(input); err != nil {
		return User{}, Workspace{}, false, err
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, Workspace{}, false, err
	}
	defer tx.Rollback(ctx)

	if _, err := scanUserByID(ctx, tx, targetUserID); err != nil {
		return User{}, Workspace{}, false, err
	}

	merged := false
	sourceUserID, err := findIdentityUserID(ctx, tx, input.Provider, input.ProviderUserID)
	if err != nil && !errors.Is(err, ErrNotFound) {
		return User{}, Workspace{}, false, err
	}
	if err == nil && sourceUserID != targetUserID {
		if err := mergeUserIntoUser(ctx, tx, sourceUserID, targetUserID); err != nil {
			return User{}, Workspace{}, false, err
		}
		merged = true
	}

	if err := upsertAuthIdentity(ctx, tx, targetUserID, input); err != nil {
		return User{}, Workspace{}, false, err
	}
	user, workspace, err := loadPrimaryWorkspaceForUser(ctx, tx, targetUserID)
	if err != nil {
		return User{}, Workspace{}, false, err
	}
	return user, workspace, merged, tx.Commit(ctx)
}

func (s *Store) LinkTelegramIdentity(ctx context.Context, userID int64, telegramID int64, username string) error {
	if telegramID <= 0 {
		return nil
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO auth_identities (user_id, provider, provider_user_id, username, last_login_at)
		VALUES ($1, 'telegram', $2, NULLIF($3, ''), NOW())
		ON CONFLICT (provider, provider_user_id)
		DO UPDATE SET
			user_id = EXCLUDED.user_id,
			username = COALESCE(EXCLUDED.username, auth_identities.username),
			last_login_at = NOW()
	`, userID, fmt.Sprintf("%d", telegramID), strings.TrimSpace(username))
	if err != nil {
		return fmt.Errorf("link telegram identity: %w", err)
	}
	return nil
}

func normalizeOAuthIdentityInput(input OAuthIdentityInput) OAuthIdentityInput {
	input.Provider = normalizeProvider(input.Provider)
	input.ProviderUserID = strings.TrimSpace(input.ProviderUserID)
	input.Email = strings.ToLower(strings.TrimSpace(input.Email))
	input.DisplayName = strings.TrimSpace(input.DisplayName)
	input.Username = strings.TrimSpace(input.Username)
	input.AvatarURL = strings.TrimSpace(input.AvatarURL)
	return input
}

func normalizeProvider(provider string) string {
	return strings.ToLower(strings.TrimSpace(provider))
}

func validateOAuthIdentityInput(input OAuthIdentityInput) error {
	if input.Provider != "google" && input.Provider != "github" {
		return fmt.Errorf("unsupported oauth provider")
	}
	if input.ProviderUserID == "" {
		return fmt.Errorf("oauth provider user id is required")
	}
	if input.Provider == "google" && !input.EmailVerified {
		return fmt.Errorf("google account email must be verified")
	}
	return nil
}

func findIdentityUserID(ctx context.Context, tx pgx.Tx, provider string, providerUserID string) (int64, error) {
	var userID int64
	err := tx.QueryRow(ctx, `
		SELECT user_id
		FROM auth_identities
		WHERE provider = $1 AND provider_user_id = $2
		FOR UPDATE
	`, normalizeProvider(provider), strings.TrimSpace(providerUserID)).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	return userID, err
}

func findSingleUserIDByEmail(ctx context.Context, tx pgx.Tx, email string) (int64, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return 0, ErrNotFound
	}
	rows, err := tx.Query(ctx, `
		SELECT id
		FROM users
		WHERE LOWER(email) = $1
		ORDER BY id ASC
		LIMIT 2
	`, email)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return 0, err
		}
		ids = append(ids, id)
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	if len(ids) == 0 {
		return 0, ErrNotFound
	}
	if len(ids) > 1 {
		return 0, fmt.Errorf("%w: multiple recv users have this email", ErrConflict)
	}
	return ids[0], nil
}

func createOAuthUserAndWorkspace(ctx context.Context, tx pgx.Tx, input OAuthIdentityInput) (int64, int64, error) {
	telegramID, err := randomNegativeID()
	if err != nil {
		return 0, 0, err
	}
	username := oauthWorkspaceName(input)
	var user User
	if err := tx.QueryRow(ctx, `
		INSERT INTO users (telegram_id, username, email)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''))
		RETURNING id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
	`, telegramID, username, input.Email).Scan(&user.ID, &user.TelegramID, &user.Username, &user.Email, &user.CreatedAt); err != nil {
		return 0, 0, fmt.Errorf("create oauth user: %w", err)
	}

	var workspaceID int64
	if err := tx.QueryRow(ctx, `
		INSERT INTO workspaces (username, email)
		VALUES (NULLIF($1, ''), NULLIF($2, ''))
		RETURNING id
	`, username, input.Email).Scan(&workspaceID); err != nil {
		return 0, 0, fmt.Errorf("create oauth workspace: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO workspace_members (workspace_id, user_id, role)
		VALUES ($1, $2, $3)
	`, workspaceID, user.ID, RoleOwner); err != nil {
		return 0, 0, fmt.Errorf("create oauth workspace member: %w", err)
	}
	return user.ID, workspaceID, nil
}

func oauthWorkspaceName(input OAuthIdentityInput) string {
	for _, candidate := range []string{input.Username, input.DisplayName, strings.Split(input.Email, "@")[0], input.Provider + "_" + input.ProviderUserID} {
		value := sanitizeWorkspaceName(candidate)
		if value != "" {
			return value
		}
	}
	return "merchant"
}

func sanitizeWorkspaceName(raw string) string {
	raw = strings.ToLower(strings.TrimSpace(raw))
	var builder strings.Builder
	for _, ch := range raw {
		if ch >= 'a' && ch <= 'z' || ch >= '0' && ch <= '9' {
			builder.WriteRune(ch)
			continue
		}
		if ch == '_' || ch == '-' || ch == '.' || ch == ' ' {
			builder.WriteByte('_')
		}
	}
	value := strings.Trim(builder.String(), "_")
	if len(value) > 32 {
		value = value[:32]
	}
	return strings.Trim(value, "_")
}

func upsertAuthIdentity(ctx context.Context, tx pgx.Tx, userID int64, input OAuthIdentityInput) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO auth_identities (
			user_id, provider, provider_user_id, email, email_verified, display_name, username, avatar_url, last_login_at
		)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, NULLIF($6, ''), NULLIF($7, ''), NULLIF($8, ''), NOW())
		ON CONFLICT (provider, provider_user_id)
		DO UPDATE SET
			user_id = EXCLUDED.user_id,
			email = COALESCE(EXCLUDED.email, auth_identities.email),
			email_verified = EXCLUDED.email_verified OR auth_identities.email_verified,
			display_name = COALESCE(EXCLUDED.display_name, auth_identities.display_name),
			username = COALESCE(EXCLUDED.username, auth_identities.username),
			avatar_url = COALESCE(EXCLUDED.avatar_url, auth_identities.avatar_url),
			last_login_at = NOW()
	`, userID, input.Provider, input.ProviderUserID, input.Email, input.EmailVerified, input.DisplayName, input.Username, input.AvatarURL)
	if err != nil {
		return fmt.Errorf("upsert auth identity: %w", err)
	}
	if input.EmailVerified && input.Email != "" {
		_, _ = tx.Exec(ctx, `
			UPDATE users
			SET email = COALESCE(NULLIF(email, ''), $2)
			WHERE id = $1
		`, userID, input.Email)
	}
	return nil
}

func touchIdentityAndLoadPrimaryWorkspace(ctx context.Context, tx pgx.Tx, userID int64, input OAuthIdentityInput) (User, Workspace, error) {
	if err := upsertAuthIdentity(ctx, tx, userID, input); err != nil {
		return User{}, Workspace{}, err
	}
	return loadPrimaryWorkspaceForUser(ctx, tx, userID)
}

func loadPrimaryWorkspaceForUser(ctx context.Context, tx pgx.Tx, userID int64) (User, Workspace, error) {
	user, err := scanUserByID(ctx, tx, userID)
	if err != nil {
		return User{}, Workspace{}, err
	}
	row := tx.QueryRow(ctx, `
		SELECT
			w.id,
			w.owner_telegram_id,
			COALESCE(w.username, ''),
			COALESCE(w.email, ''),
			w.default_network,
			COALESCE(w.language, 'en'),
			w.plan_code,
			w.subscription_ends_at,
			w.free_invoices_used,
			w.is_blocked,
			w.telegram_linked_at,
			w.created_at,
			w.discount_percent,
			COALESCE(w.discount_plan_code, ''),
			w.bot_blocked,
			w.last_retention_reminder_at,
			w.retention_stage
		FROM workspaces w
		JOIN workspace_members wm ON wm.workspace_id = w.id
		WHERE wm.user_id = $1
		ORDER BY CASE wm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, wm.created_at ASC
		LIMIT 1
	`, userID)
	workspace, err := scanWorkspace(row)
	if err != nil {
		return User{}, Workspace{}, err
	}
	return user, workspace, nil
}

func scanUserByID(ctx context.Context, tx pgx.Tx, userID int64) (User, error) {
	var user User
	err := tx.QueryRow(ctx, `
		SELECT id, telegram_id, COALESCE(username, ''), COALESCE(email, ''), created_at
		FROM users
		WHERE id = $1
	`, userID).Scan(&user.ID, &user.TelegramID, &user.Username, &user.Email, &user.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrNotFound
	}
	return user, err
}

func mergeUserIntoUser(ctx context.Context, tx pgx.Tx, sourceUserID, targetUserID int64) error {
	if sourceUserID == targetUserID {
		return nil
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO workspace_members (workspace_id, user_id, role, created_at)
		SELECT workspace_id, $2, role, created_at
		FROM workspace_members
		WHERE user_id = $1
		ON CONFLICT (workspace_id, user_id) DO UPDATE
		SET role = CASE
			WHEN workspace_members.role = 'owner' OR EXCLUDED.role = 'owner' THEN 'owner'::member_role
			WHEN workspace_members.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'admin'::member_role
			ELSE 'member'::member_role
		END
	`, sourceUserID, targetUserID); err != nil {
		return fmt.Errorf("merge workspace memberships: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE auth_identities
		SET user_id = $2
		WHERE user_id = $1
	`, sourceUserID, targetUserID); err != nil {
		return fmt.Errorf("merge auth identities: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		UPDATE refresh_sessions
		SET revoked_at = COALESCE(revoked_at, NOW())
		WHERE user_id = $1 AND revoked_at IS NULL
	`, sourceUserID); err != nil {
		return fmt.Errorf("revoke merged user sessions: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		DELETE FROM workspace_members
		WHERE user_id = $1
	`, sourceUserID); err != nil {
		return fmt.Errorf("remove merged memberships: %w", err)
	}
	return nil
}

func scanAuthIdentity(row interface{ Scan(dest ...any) error }) (AuthIdentity, error) {
	var identity AuthIdentity
	err := row.Scan(
		&identity.ID,
		&identity.UserID,
		&identity.Provider,
		&identity.ProviderUserID,
		&identity.Email,
		&identity.EmailVerified,
		&identity.DisplayName,
		&identity.Username,
		&identity.AvatarURL,
		&identity.LinkedAt,
		&identity.LastLoginAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return AuthIdentity{}, ErrNotFound
	}
	if err != nil {
		return AuthIdentity{}, fmt.Errorf("scan auth identity: %w", err)
	}
	return identity, nil
}

func randomNegativeID() (int64, error) {
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
