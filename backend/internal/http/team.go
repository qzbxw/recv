package http

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"recv/backend/internal/store"

	"github.com/gin-gonic/gin"
)

// canManageTeam reports whether a role may invite/manage members.
func canManageTeam(role store.MemberRole) bool {
	return role == store.RoleOwner || role == store.RoleAdmin
}

func (s *Server) requireWorkspaceManager(c *gin.Context, wc workspaceContext) bool {
	if s.store == nil {
		respondError(c, http.StatusInternalServerError, errors.New("store unavailable"))
		return false
	}
	if wc.Claims.UserID == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "owner or admin role required"})
		return false
	}
	role, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return false
	}
	if !canManageTeam(role) {
		c.JSON(http.StatusForbidden, gin.H{"error": "owner or admin role required"})
		return false
	}
	return true
}

func validMemberRole(raw string) (store.MemberRole, bool) {
	switch store.MemberRole(strings.ToLower(strings.TrimSpace(raw))) {
	case store.RoleOwner:
		return store.RoleOwner, true
	case store.RoleAdmin:
		return store.RoleAdmin, true
	case store.RoleMember:
		return store.RoleMember, true
	default:
		return "", false
	}
}

// handleListTeam returns the workspace members, pending invites, and the
// caller's own role.
func (s *Server) handleListTeam(c *gin.Context) {
	wc := workspaceFromContext(c)

	myRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	members, err := s.store.ListWorkspaceMembers(c.Request.Context(), wc.Workspace.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	invites := []store.WorkspaceInvite{}
	if canManageTeam(myRole) {
		invites, err = s.store.ListWorkspaceInvites(c.Request.Context(), wc.Workspace.ID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"members": members,
		"invites": invites,
		"my_role": myRole,
	})
}

// handleInviteMember creates a pending invite addressed to a Telegram username.
func (s *Server) handleInviteMember(c *gin.Context) {
	wc := workspaceFromContext(c)

	myRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	if !canManageTeam(myRole) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only owners and admins can invite members"})
		return
	}

	var body struct {
		Username string `json:"username"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	username := strings.TrimPrefix(strings.TrimSpace(body.Username), "@")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
		return
	}

	role, ok := validMemberRole(body.Role)
	if !ok {
		role = store.RoleMember
	}
	// Only an owner can grant owner-level access.
	if role == store.RoleOwner && myRole != store.RoleOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner can invite another owner"})
		return
	}

	invite, err := s.store.CreateWorkspaceInvite(c.Request.Context(), wc.Workspace.ID, username, role, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusCreated, gin.H{"invite": invite})
}

// handleRevokeInvite cancels a pending invite.
func (s *Server) handleRevokeInvite(c *gin.Context) {
	wc := workspaceFromContext(c)

	myRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	if !canManageTeam(myRole) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only owners and admins can manage invites"})
		return
	}

	inviteID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid invite id"})
		return
	}

	if err := s.store.RevokeWorkspaceInvite(c.Request.Context(), wc.Workspace.ID, inviteID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "invite not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// handleUpdateMemberRole changes an existing member's role.
func (s *Server) handleUpdateMemberRole(c *gin.Context) {
	wc := workspaceFromContext(c)

	myRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	if myRole != store.RoleOwner {
		c.JSON(http.StatusForbidden, gin.H{"error": "only an owner can change roles"})
		return
	}

	targetID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	role, ok := validMemberRole(body.Role)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	// Guard: don't allow demoting the last owner.
	if role != store.RoleOwner {
		targetRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, targetID)
		if err == nil && targetRole == store.RoleOwner {
			owners, err := s.store.CountWorkspaceOwners(c.Request.Context(), wc.Workspace.ID)
			if err != nil {
				respondError(c, http.StatusInternalServerError, err)
				return
			}
			if owners <= 1 {
				c.JSON(http.StatusConflict, gin.H{"error": "cannot demote the last owner"})
				return
			}
		}
	}

	if err := s.store.UpdateWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, targetID, role); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// handleRemoveMember removes a member from the workspace.
func (s *Server) handleRemoveMember(c *gin.Context) {
	wc := workspaceFromContext(c)

	myRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, wc.Claims.UserID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	targetID, err := strconv.ParseInt(c.Param("userId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// Members may remove themselves (leave); otherwise owner/admin only.
	isSelf := targetID == wc.Claims.UserID
	if !isSelf && !canManageTeam(myRole) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only owners and admins can remove members"})
		return
	}

	targetRole, err := s.store.GetWorkspaceMemberRole(c.Request.Context(), wc.Workspace.ID, targetID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}

	// Admins cannot remove owners or other admins (only members or themselves).
	if !isSelf && myRole == store.RoleAdmin && targetRole != store.RoleMember {
		c.JSON(http.StatusForbidden, gin.H{"error": "admins can only remove regular members"})
		return
	}

	// Guard: never leave a workspace without an owner.
	if targetRole == store.RoleOwner {
		owners, err := s.store.CountWorkspaceOwners(c.Request.Context(), wc.Workspace.ID)
		if err != nil {
			respondError(c, http.StatusInternalServerError, err)
			return
		}
		if owners <= 1 {
			c.JSON(http.StatusConflict, gin.H{"error": "cannot remove the last owner"})
			return
		}
	}

	if err := s.store.RemoveWorkspaceMember(c.Request.Context(), wc.Workspace.ID, targetID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "member not found"})
			return
		}
		respondError(c, http.StatusInternalServerError, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// handleSwitchWorkspace issues a new session for another workspace the user
// belongs to.
func (s *Server) handleSwitchWorkspace(c *gin.Context) {
	wc := workspaceFromContext(c)

	targetID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workspace id"})
		return
	}

	result, err := s.authService.SwitchWorkspace(c.Request.Context(), wc.Claims.UserID, targetID)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	setRefreshCookie(c, "recv_refresh", result.RefreshToken, s.cfg.AppEnv)
	c.JSON(http.StatusOK, result)
}
