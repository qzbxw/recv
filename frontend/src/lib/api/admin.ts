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
  AdminMedia,
  AdminMediaListResponse,
  SEOTarget,
  SEORedirect,
  Workspace,
  WebhookDelivery,
  WebVitalsReport,
  UTMReport,
  ReferralPartner,
  ReferralPartnerPayload,
  ReferralPartnerReport,
  ReferralPartnerStats,
  PromoCode,
} from "../types";
import { getApiBase, request } from "./core";

export async function loginAdmin(payload: { username: string; password: string }) {
  return request<{ token?: string; refresh_token?: string; username?: string; email?: string; roles?: string[] }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutAdmin(refreshToken?: string | null) {
  return request<{ ok: boolean }>("/api/admin/logout", {
    method: "POST",
    body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
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

export async function fetchAdminWebVitals(token: string) {
  return request<WebVitalsReport>("/api/admin/analytics/web-vitals", {}, token);
}

export async function fetchAdminUTMReport(token: string, days = 365) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const search = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  return request<UTMReport>(`/api/admin/analytics/utm?${search.toString()}`, {}, token);
}

export async function fetchReferralPartners(token: string) {
  return request<{ items: ReferralPartnerStats[] }>("/api/admin/referrals/partners", {}, token);
}

export async function createReferralPartner(token: string, payload: ReferralPartnerPayload) {
  return request<{ partner: ReferralPartner }>("/api/admin/referrals/partners", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function updateReferralPartner(token: string, partnerId: number, payload: ReferralPartnerPayload) {
  return request<{ partner: ReferralPartner }>(`/api/admin/referrals/partners/${partnerId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchReferralPartnerReport(token: string, partnerId: number) {
  return request<ReferralPartnerReport>(`/api/admin/referrals/partners/${partnerId}/report`, {}, token);
}

export async function createReferralPayout(token: string, partnerId: number, payload: { amount_usd: string; note?: string }) {
  return request<{ payout: ReferralPartnerReport["payouts"][number] }>(`/api/admin/referrals/partners/${partnerId}/payouts`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function fetchAdminAuditEvents(token: string) {
  return request<{ items: AdminAuditEvent[] }>("/api/admin/audit-events", {}, token);
}

export async function fetchAdminSEOTargets(token: string) {
  return request<{ items: SEOTarget[] }>("/api/admin/seo-targets", {}, token);
}

export async function fetchAdminSEORedirects(token: string) {
  return request<{ items: SEORedirect[] }>("/api/admin/seo/redirects", {}, token);
}

export async function createAdminSEORedirect(token: string, payload: {
  source_path: string;
  target_url: string;
  status_code: 301 | 302 | 308;
  is_active: boolean;
}) {
  return request<SEORedirect>("/api/admin/seo/redirects", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminSEORedirect(token: string, id: number) {
  return request<void>(`/api/admin/seo/redirects/${id}`, {
    method: "DELETE",
  }, token);
}

export async function fetchAdminBlogPosts(token: string, page = 1, pageSize = 100) {
  return request<AdminBlogPost[] | AdminBlogPostListResponse>(
    `/api/admin/blog?page=${page}&page_size=${pageSize}`,
    {},
    token,
  );
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

export async function deleteAdminBlogPost(token: string, id: number) {
  return request<void>(`/api/admin/blog/${id}`, {
    method: "DELETE",
  }, token);
}

export async function fetchAdminBillingWallets(token: string) {
  return request<{ wallets: Record<string, string> }>("/api/admin/config/billing-wallets", {}, token);
}

export async function updateAdminBillingWallets(token: string, wallets: Record<string, string>) {
  return request<{ success: boolean }>("/api/admin/config/billing-wallets", {
    method: "POST",
    body: JSON.stringify({ wallets }),
  }, token);
}

export async function fetchAdminMedia(token: string, page = 1, pageSize = 100) {
  return request<AdminMediaListResponse>(`/api/admin/media?page=${page}&page_size=${pageSize}`, {}, token);
}

// Multipart upload: Content-Type must be left to the browser so the
// boundary is set, hence plain fetch instead of the JSON request helper.
export async function uploadAdminMedia(token: string, file: File, altText: string) {
  const body = new FormData();
  body.append("file", file);
  body.append("alt_text", altText);
  const response = await fetch(`${getApiBase()}/api/admin/media`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body,
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `Upload failed (${response.status})`);
  }
  return (await response.json()) as AdminMedia;
}

export async function updateAdminMediaAlt(token: string, id: number, altText: string) {
  return request<AdminMedia>(`/api/admin/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ alt_text: altText }),
  }, token);
}

export async function deleteAdminMedia(token: string, id: number) {
  return request<{ status: string }>(`/api/admin/media/${id}`, {
    method: "DELETE",
  }, token);
}

export async function fetchAdminPromoCodes(token: string) {
  return request<{ items: PromoCode[] }>("/api/admin/promocodes", {}, token);
}

export async function createAdminPromoCode(token: string, payload: {
  code: string;
  duration_days: number;
  plan_code: string;
  expires_at: string | null;
  max_uses: number | null;
  discount_percent: number;
}) {
  return request<PromoCode>("/api/admin/promocodes", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function deleteAdminPromoCode(token: string, id: number) {
  return request<{ ok: boolean }>(`/api/admin/promocodes/${id}`, {
    method: "DELETE",
  }, token);
}
