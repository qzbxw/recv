package store

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

// WorkspaceMemberDetail is a workspace member joined with their user profile.
type WorkspaceMemberDetail struct {
	UserID     int64      `json:"user_id"`
	TelegramID int64      `json:"telegram_id"`
	Username   string     `json:"username"`
	Email      string     `json:"email"`
	Role       MemberRole `json:"role"`
	JoinedAt   time.Time  `json:"joined_at"`
}

// WorkspaceInvite is a pending invitation to join a workspace.
type WorkspaceInvite struct {
	ID              int64      `json:"id"`
	WorkspaceID     int64      `json:"workspace_id"`
	InvitedUsername string     `json:"invited_username"`
	Role            MemberRole `json:"role"`
	Status          string     `json:"status"`
	InvitedBy       *int64     `json:"invited_by,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
}

// ListWorkspaceMembers returns all members of a workspace, owners first.
func (s *Store) ListWorkspaceMembers(ctx context.Context, workspaceID int64) ([]WorkspaceMemberDetail, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT u.id, u.telegram_id, COALESCE(u.username, ''), COALESCE(u.email, ''), wm.role, wm.created_at
		FROM workspace_members wm
		JOIN users u ON u.id = wm.user_id
		WHERE wm.workspace_id = $1
		ORDER BY
			CASE wm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END,
			wm.created_at ASC
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := []WorkspaceMemberDetail{}
	for rows.Next() {
		var m WorkspaceMemberDetail
		if err := rows.Scan(&m.UserID, &m.TelegramID, &m.Username, &m.Email, &m.Role, &m.JoinedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

// GetWorkspaceMemberRole returns the role of a user in a workspace, or ErrNotFound.
func (s *Store) GetWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64) (MemberRole, error) {
	var role MemberRole
	err := s.pool.QueryRow(ctx, `
		SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2
	`, workspaceID, userID).Scan(&role)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	return role, err
}

// CountWorkspaceOwners returns the number of owners in a workspace.
func (s *Store) CountWorkspaceOwners(ctx context.Context, workspaceID int64) (int, error) {
	var count int
	err := s.pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM workspace_members WHERE workspace_id = $1 AND role = 'owner'
	`, workspaceID).Scan(&count)
	return count, err
}

// UpdateWorkspaceMemberRole changes the role of an existing member.
func (s *Store) UpdateWorkspaceMemberRole(ctx context.Context, workspaceID, userID int64, role MemberRole) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE workspace_members SET role = $3 WHERE workspace_id = $1 AND user_id = $2
	`, workspaceID, userID, role)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// RemoveWorkspaceMember removes a user from a workspace.
func (s *Store) RemoveWorkspaceMember(ctx context.Context, workspaceID, userID int64) error {
	tag, err := s.pool.Exec(ctx, `
		DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2
	`, workspaceID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ListWorkspaceInvites returns pending invites for a workspace.
func (s *Store) ListWorkspaceInvites(ctx context.Context, workspaceID int64) ([]WorkspaceInvite, error) {
	rows, err := s.pool.Query(ctx, `
		SELECT id, workspace_id, invited_username, role, status, invited_by, created_at
		FROM workspace_invites
		WHERE workspace_id = $1 AND status = 'pending'
		ORDER BY created_at DESC
	`, workspaceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	invites := []WorkspaceInvite{}
	for rows.Next() {
		var inv WorkspaceInvite
		if err := rows.Scan(&inv.ID, &inv.WorkspaceID, &inv.InvitedUsername, &inv.Role, &inv.Status, &inv.InvitedBy, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invites = append(invites, inv)
	}
	return invites, rows.Err()
}

// CreateWorkspaceInvite creates a pending invite (or revives a revoked one).
func (s *Store) CreateWorkspaceInvite(ctx context.Context, workspaceID int64, username string, role MemberRole, invitedBy int64) (WorkspaceInvite, error) {
	var inv WorkspaceInvite
	err := s.pool.QueryRow(ctx, `
		INSERT INTO workspace_invites (workspace_id, invited_username, role, status, invited_by)
		VALUES ($1, $2, $3, 'pending', $4)
		ON CONFLICT (workspace_id, (lower(invited_username))) WHERE status = 'pending'
		DO UPDATE SET role = EXCLUDED.role, invited_by = EXCLUDED.invited_by, created_at = NOW()
		RETURNING id, workspace_id, invited_username, role, status, invited_by, created_at
	`, workspaceID, username, role, invitedBy).Scan(
		&inv.ID, &inv.WorkspaceID, &inv.InvitedUsername, &inv.Role, &inv.Status, &inv.InvitedBy, &inv.CreatedAt)
	return inv, err
}

// RevokeWorkspaceInvite marks a pending invite as revoked.
func (s *Store) RevokeWorkspaceInvite(ctx context.Context, workspaceID, inviteID int64) error {
	tag, err := s.pool.Exec(ctx, `
		UPDATE workspace_invites SET status = 'revoked'
		WHERE id = $1 AND workspace_id = $2 AND status = 'pending'
	`, inviteID, workspaceID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// AcceptPendingInvitesForUser converts all pending invites matching the user's
// username into workspace memberships. Returns the number of invites accepted.
// Called at login time.
func (s *Store) AcceptPendingInvitesForUser(ctx context.Context, userID int64, username string) (int, error) {
	username = trimUsername(username)
	if username == "" {
		return 0, nil
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	rows, err := tx.Query(ctx, `
		SELECT id, workspace_id, role
		FROM workspace_invites
		WHERE status = 'pending' AND lower(invited_username) = lower($1)
		FOR UPDATE
	`, username)
	if err != nil {
		return 0, err
	}

	type pending struct {
		id          int64
		workspaceID int64
		role        MemberRole
	}
	var items []pending
	for rows.Next() {
		var p pending
		if err := rows.Scan(&p.id, &p.workspaceID, &p.role); err != nil {
			rows.Close()
			return 0, err
		}
		items = append(items, p)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}

	accepted := 0
	for _, p := range items {
		if _, err := tx.Exec(ctx, `
			INSERT INTO workspace_members (workspace_id, user_id, role)
			VALUES ($1, $2, $3)
			ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
		`, p.workspaceID, userID, p.role); err != nil {
			return 0, fmt.Errorf("add member from invite: %w", err)
		}
		if _, err := tx.Exec(ctx, `
			UPDATE workspace_invites SET status = 'accepted', accepted_user_id = $2, accepted_at = NOW()
			WHERE id = $1
		`, p.id, userID); err != nil {
			return 0, fmt.Errorf("mark invite accepted: %w", err)
		}
		accepted++
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}
	return accepted, nil
}

func trimUsername(s string) string {
	out := s
	for len(out) > 0 && (out[0] == '@' || out[0] == ' ') {
		out = out[1:]
	}
	return out
}
