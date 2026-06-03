import type {
  AdminActionResponse,
  AdminAuditEvent,
  AdminAnalyticsResponse,
  AdminBillingCheckoutResponse,
  AdminBlogPost,
  AdminBlogPostListResponse,
  AdminInternalComment,
  AdminInvoiceListResponse,
  AdminOpsOverviewResponse,
  AdminOverviewResponse,
  Invoice,
  SEOTarget,
  Workspace,
  WebhookDelivery,
} from "../types";
import { request } from "./core";

export async function loginAdmin(payload: { username: string; password: string }) {
  return request<{ token?: string; username?: string; email?: string; roles?: string[]; mfa_required?: boolean; totp_setup_required?: boolean; totp_secret?: string; challenge_token?: string; recovery_codes?: string[] }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyAdminTotp(payload: { challenge_token: string; code: string }) {
  return request<{ token: string; username: string; email?: string; roles?: string[]; recovery_codes?: string[] }>("/api/admin/login/verify-totp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutAdmin() {
  return request<{ ok: boolean }>("/api/admin/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchAdminOverview(token: string) {
  return request<AdminOverviewResponse>("/api/admin/overview", {}, token);
}

export async function fetchAdminOpsOverview(token: string) {
  return request<AdminOpsOverviewResponse>("/api/admin/ops/overview", {}, token);
}

export async function fetchAdminWorkspaces(token: string, limit = 100) {
  return request<{ items: import("../types").AdminWorkspace[] }>(`/api/admin/workspaces?limit=${limit}`, {}, token);
}

export async function fetchAdminInvoices(token: string, params: {
  page?: number;
  page_size?: number;
  status?: string;
  kind?: string;
  query?: string;
}) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.page_size) search.set("page_size", String(params.page_size));
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.kind && params.kind !== "all") search.set("kind", params.kind);
  if (params.query?.trim()) search.set("query", params.query.trim());
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return request<AdminInvoiceListResponse>(`/api/admin/invoices${suffix}`, {}, token);
}

export async function createAdminBillingCheckout(token: string, workspaceId: number, payload: { payable_network: string; plan_code?: string; base_amount_usd?: string }) {
  return request<AdminBillingCheckoutResponse>(`/api/admin/workspaces/${workspaceId}/billing-checkout`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function blockAdminWorkspace(token: string, workspaceId: number, payload: { blocked: boolean; reason: string }) {
  return request<AdminActionResponse<{ workspace: Workspace }>>(`/api/admin/workspaces/${workspaceId}/block`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function changeAdminWorkspacePlan(token: string, workspaceId: number, payload: { plan_code: "trial" | "merchant" | "developer" | "business"; days?: number; subscription_ends_at?: string | null; reason: string }) {
  return request<AdminActionResponse<{ workspace: Workspace }>>(`/api/admin/workspaces/${workspaceId}/plan`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function resendAdminWebhookDelivery(token: string, deliveryId: number) {
  return request<AdminActionResponse<{ delivery: WebhookDelivery }>>(`/api/admin/webhook-deliveries/${deliveryId}/resend`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function reviewAdminInvoice(token: string, invoiceId: number, payload: { result: "mark_paid" | "keep_manual_review" | "expire"; comment: string }) {
  return request<AdminActionResponse<{ invoice: Invoice }>>(`/api/admin/invoices/${invoiceId}/review`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function refreshAdminInvoiceStatus(token: string, invoiceId: number) {
  return request<AdminActionResponse<{ invoice: Invoice }>>(`/api/admin/invoices/${invoiceId}/refresh-status`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function createAdminInternalComment(token: string, payload: { target_type: string; target_id: string; body: string }) {
  return request<AdminActionResponse<{ comment: AdminInternalComment }>>("/api/admin/internal-comments", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchAdminAnalytics(token: string, params: { from?: string; to?: string; group_by?: "date" | "network" | "plan" | "mode" }) {
  const search = new URLSearchParams();
  if (params.from) search.set("from", params.from);
  if (params.to) search.set("to", params.to);
  if (params.group_by) search.set("group_by", params.group_by);
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return request<AdminAnalyticsResponse>(`/api/admin/analytics${suffix}`, {}, token);
}

export async function fetchAdminAuditEvents(token: string) {
  return request<{ items: AdminAuditEvent[] }>("/api/admin/audit-events", {}, token);
}

export async function fetchAdminSEOTargets(token: string) {
  return request<{ items: SEOTarget[] }>("/api/admin/seo-targets", {}, token);
}

export async function fetchAdminBlogPosts(token: string) {
  return request<AdminBlogPost[] | AdminBlogPostListResponse>("/api/admin/blog", {}, token);
}

export async function createAdminBlogPost(token: string, payload: Partial<AdminBlogPost>) {
  return request<AdminBlogPost>("/api/admin/blog", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateAdminBlogPost(token: string, id: number, payload: Partial<AdminBlogPost>) {
  return request<AdminBlogPost>(`/api/admin/blog/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}
