import type { Environment, Invoice, InvoiceListResponse } from "../types";
import { request } from "./core";

export async function fetchInvoices(token: string, params: { page?: number; page_size?: number; status?: string; query?: string } = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page || 1));
  search.set("page_size", String(params.page_size || 20));
  if (params.status && params.status !== "all") search.set("status", params.status);
  if (params.query?.trim()) search.set("query", params.query.trim());
  return request<InvoiceListResponse>(`/api/invoices?${search.toString()}`, {}, token);
}

export async function createInvoice(token: string, payload: {
  title: string;
  base_amount_usd: string;
  payable_network: string;
  payable_asset?: string;
  payment_options?: Array<{ network: string; asset: string }>;
  expires_in_minutes: number;
  environment?: Environment;
}) {
  return request<Invoice>("/api/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function cancelInvoice(token: string, invoiceId: number) {
  return request<Invoice>(`/api/invoices/${invoiceId}/cancel`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function markInvoicePaid(token: string, invoiceId: number) {
  return request<Invoice>(`/api/invoices/${invoiceId}/mark-paid`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function fetchPublicInvoice(publicId: string) {
  return request<Invoice>(`/api/public/invoices/${publicId}`);
}
