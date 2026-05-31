import type { MemberRole, TeamResponse, WorkspaceInvite } from "../types";
import { request } from "./core";

export async function fetchTeam(token: string) {
  return request<TeamResponse>("/api/team", {}, token);
}

export async function inviteTeamMember(token: string, payload: { username: string; role: MemberRole }) {
  return request<{ invite: WorkspaceInvite }>("/api/team/invites", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function revokeTeamInvite(token: string, inviteId: number) {
  return request<{ ok: boolean }>(`/api/team/invites/${inviteId}`, { method: "DELETE" }, token);
}

export async function updateTeamMemberRole(token: string, userId: number, role: MemberRole) {
  return request<{ ok: boolean }>(`/api/team/members/${userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  }, token);
}

export async function removeTeamMember(token: string, userId: number) {
  return request<{ ok: boolean }>(`/api/team/members/${userId}`, { method: "DELETE" }, token);
}

export async function switchWorkspace(token: string, workspaceId: number) {
  return request<{ token: string; refresh_token?: string }>(`/api/workspaces/${workspaceId}/switch`, {
    method: "POST",
  }, token);
}
