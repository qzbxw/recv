package store

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func (s *Store) EnsureBootstrapAdmin(ctx context.Context, email string, passwordHash string) (AdminUser, bool, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" || passwordHash == "" {
		return AdminUser{}, false, nil
	}

	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return AdminUser{}, false, fmt.Errorf("begin bootstrap admin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var count int
	if err := tx.QueryRow(ctx, `SELECT COUNT(1) FROM admin_users`).Scan(&count); err != nil {
		return AdminUser{}, false, fmt.Errorf("count admin users: %w", err)
	}
	if count > 0 {
		return AdminUser{}, false, nil
	}

	var admin AdminUser
	if err := tx.QueryRow(ctx, `
		INSERT INTO admin_users (email, display_name, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, email, display_name, password_hash, COALESCE(totp_secret, ''), totp_enabled, is_active, created_at, updated_at, last_login_at
	`, email, email, passwordHash).Scan(
		&admin.ID, &admin.Email, &admin.DisplayName, &admin.PasswordHash, &admin.TOTPSecret, &admin.TOTPEnabled,
		&admin.IsActive, &admin.CreatedAt, &admin.UpdatedAt, &admin.LastLoginAt,
	); err != nil {
		return AdminUser{}, false, fmt.Errorf("insert bootstrap admin: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO admin_user_roles (admin_user_id, role_name)
		VALUES ($1, 'super_admin')
	`, admin.ID); err != nil {
		return AdminUser{}, false, fmt.Errorf("assign bootstrap admin role: %w", err)
	}
	admin.Roles = []string{"super_admin"}
	if err := tx.Commit(ctx); err != nil {
		return AdminUser{}, false, fmt.Errorf("commit bootstrap admin: %w", err)
	}
	return admin, true, nil
}

func (s *Store) GetAdminUserByEmail(ctx context.Context, email string) (AdminUser, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, email, display_name, password_hash, COALESCE(totp_secret, ''), totp_enabled, is_active, created_at, updated_at, last_login_at
		FROM admin_users
		WHERE email = $1
	`, strings.TrimSpace(strings.ToLower(email)))
	return s.scanAdminUser(ctx, row)
}

func (s *Store) GetAdminUserByID(ctx context.Context, id int64) (AdminUser, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT id, email, display_name, password_hash, COALESCE(totp_secret, ''), totp_enabled, is_active, created_at, updated_at, last_login_at
		FROM admin_users
		WHERE id = $1
	`, id)
	return s.scanAdminUser(ctx, row)
}

func (s *Store) scanAdminUser(ctx context.Context, row pgx.Row) (AdminUser, error) {
	var admin AdminUser
	if err := row.Scan(
		&admin.ID, &admin.Email, &admin.DisplayName, &admin.PasswordHash, &admin.TOTPSecret, &admin.TOTPEnabled,
		&admin.IsActive, &admin.CreatedAt, &admin.UpdatedAt, &admin.LastLoginAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return AdminUser{}, ErrNotFound
		}
		return AdminUser{}, err
	}
	roles, err := s.ListAdminUserRoles(ctx, admin.ID)
	if err != nil {
		return AdminUser{}, err
	}
	admin.Roles = roles
	return admin, nil
}

func (s *Store) ListAdminUserRoles(ctx context.Context, adminUserID int64) ([]string, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT role_name
		FROM admin_user_roles
		WHERE admin_user_id = $1
		ORDER BY role_name ASC
	`, adminUserID)
	if err != nil {
		return nil, fmt.Errorf("list admin user roles: %w", err)
	}
	defer rows.Close()
	var roles []string
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return nil, err
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

func (s *Store) SetAdminTOTPSecret(ctx context.Context, adminUserID int64, secret string, enabled bool) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE admin_users
		SET totp_secret = $2,
		    totp_enabled = $3,
		    updated_at = NOW()
		WHERE id = $1
	`, adminUserID, strings.TrimSpace(secret), enabled)
	if err != nil {
		return fmt.Errorf("set admin totp secret: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) MarkAdminLogin(ctx context.Context, adminUserID int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, adminUserID)
	return err
}

func (s *Store) CreateAdminSession(ctx context.Context, adminUserID int64, refreshTokenHash string, expiresAt time.Time, userAgent string, ipAddress string) (AdminSession, error) {
	var session AdminSession
	err := s.pool.QueryRow(ctx, `
		INSERT INTO admin_sessions (admin_user_id, refresh_token_hash, user_agent, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, admin_user_id, user_agent, ip_address, expires_at, revoked_at, created_at, last_used_at
	`, adminUserID, refreshTokenHash, userAgent, ipAddress, expiresAt).Scan(
		&session.ID, &session.AdminUserID, &session.UserAgent, &session.IPAddress, &session.ExpiresAt,
		&session.RevokedAt, &session.CreatedAt, &session.LastUsedAt,
	)
	if err != nil {
		return AdminSession{}, fmt.Errorf("create admin session: %w", err)
	}
	return session, nil
}

func (s *Store) GetAdminSessionByRefreshHash(ctx context.Context, refreshTokenHash string) (AdminSession, error) {
	var session AdminSession
	err := s.pool.QueryRow(ctx, `
		SELECT id, admin_user_id, user_agent, ip_address, expires_at, revoked_at, created_at, last_used_at
		FROM admin_sessions
		WHERE refresh_token_hash = $1
	`, refreshTokenHash).Scan(
		&session.ID, &session.AdminUserID, &session.UserAgent, &session.IPAddress, &session.ExpiresAt,
		&session.RevokedAt, &session.CreatedAt, &session.LastUsedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return AdminSession{}, ErrNotFound
	}
	if err != nil {
		return AdminSession{}, fmt.Errorf("get admin session: %w", err)
	}
	return session, nil
}

func (s *Store) TouchAdminSession(ctx context.Context, sessionID int64) error {
	_, err := s.pool.Exec(ctx, `UPDATE admin_sessions SET last_used_at = NOW() WHERE id = $1 AND revoked_at IS NULL`, sessionID)
	return err
}

func (s *Store) IsAdminSessionActive(ctx context.Context, sessionID int64) (bool, error) {
	var active bool
	err := s.pool.QueryRow(ctx, `
		SELECT EXISTS(
			SELECT 1 FROM admin_sessions
			WHERE id = $1 AND revoked_at IS NULL AND expires_at > NOW()
		)
	`, sessionID).Scan(&active)
	return active, err
}

func (s *Store) RevokeAdminSession(ctx context.Context, sessionID int64) error {
	tag, err := s.pool.Exec(ctx, `UPDATE admin_sessions SET revoked_at = COALESCE(revoked_at, NOW()) WHERE id = $1`, sessionID)
	if err != nil {
		return fmt.Errorf("revoke admin session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) StoreAdminRecoveryCodes(ctx context.Context, adminUserID int64, codeHashes []string) error {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM admin_recovery_codes WHERE admin_user_id = $1 AND used_at IS NULL`, adminUserID); err != nil {
		return err
	}
	for _, hash := range codeHashes {
		if _, err := tx.Exec(ctx, `INSERT INTO admin_recovery_codes (admin_user_id, code_hash) VALUES ($1, $2)`, adminUserID, hash); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

func (s *Store) ConsumeAdminRecoveryCode(ctx context.Context, adminUserID int64, codeHash string) (bool, error) {
	tag, err := s.pool.Exec(ctx, `
		UPDATE admin_recovery_codes
		SET used_at = NOW()
		WHERE admin_user_id = $1 AND code_hash = $2 AND used_at IS NULL
	`, adminUserID, codeHash)
	if err != nil {
		return false, fmt.Errorf("consume admin recovery code: %w", err)
	}
	return tag.RowsAffected() > 0, nil
}

func (s *Store) CreateRefreshSession(ctx context.Context, userID int64, workspaceID int64, refreshTokenHash string, expiresAt time.Time, userAgent string, ipAddress string) error {
	_, err := s.pool.Exec(ctx, `
		INSERT INTO refresh_sessions (user_id, workspace_id, refresh_token_hash, user_agent, ip_address, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, userID, workspaceID, refreshTokenHash, userAgent, ipAddress, expiresAt)
	if err != nil {
		return fmt.Errorf("create refresh session: %w", err)
	}
	return nil
}

func (s *Store) RefreshSession(ctx context.Context, refreshTokenHash string) (User, Workspace, error) {
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, Workspace{}, err
	}
	defer tx.Rollback(ctx)

	var userID, workspaceID int64
	if err := tx.QueryRow(ctx, `
		SELECT user_id, workspace_id
		FROM refresh_sessions
		WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > NOW()
		FOR UPDATE
	`, refreshTokenHash).Scan(&userID, &workspaceID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, Workspace{}, ErrNotFound
		}
		return User{}, Workspace{}, err
	}
	if _, err := tx.Exec(ctx, `UPDATE refresh_sessions SET last_used_at = NOW() WHERE refresh_token_hash = $1`, refreshTokenHash); err != nil {
		return User{}, Workspace{}, err
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, Workspace{}, err
	}
	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return User{}, Workspace{}, err
	}
	workspace, err := s.GetWorkspaceByID(ctx, workspaceID)
	if err != nil {
		return User{}, Workspace{}, err
	}
	return user, workspace, nil
}

func (s *Store) RevokeRefreshSession(ctx context.Context, refreshTokenHash string) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE refresh_sessions
		SET revoked_at = COALESCE(revoked_at, NOW())
		WHERE refresh_token_hash = $1
	`, refreshTokenHash)
	if err != nil {
		return fmt.Errorf("revoke refresh session: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Store) RecordUTMAttribution(ctx context.Context, workspaceID int64, attr AttributionInput) error {
	if workspaceID <= 0 || attributionIsEmpty(attr) {
		return nil
	}
	touchType := strings.TrimSpace(attr.TouchType)
	if touchType != "first" && touchType != "last" {
		touchType = "last"
	}
	attributionID := strings.TrimSpace(attr.AttributionID)
	if attributionID == "" {
		attributionID = fmt.Sprintf("workspace-%d-%d", workspaceID, time.Now().UTC().UnixNano())
	}
	_, err := s.pool.Exec(ctx, `
		INSERT INTO utm_attributions (
			workspace_id, attribution_id, touch_type, source, medium, campaign, term, content, landing_path, referrer
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, workspaceID, limitString(attributionID, 160), touchType, limitString(attr.Source, 160), limitString(attr.Medium, 160), limitString(attr.Campaign, 240), limitString(attr.Term, 240), limitString(attr.Content, 240), limitString(attr.LandingPath, 500), limitString(attr.Referrer, 500))
	if err != nil {
		return fmt.Errorf("record utm attribution: %w", err)
	}
	return nil
}

func attributionIsEmpty(attr AttributionInput) bool {
	return strings.TrimSpace(attr.Source+attr.Medium+attr.Campaign+attr.Term+attr.Content+attr.LandingPath+attr.Referrer) == ""
}

func limitString(value string, limit int) string {
	value = strings.TrimSpace(value)
	if len(value) <= limit {
		return value
	}
	return value[:limit]
}
