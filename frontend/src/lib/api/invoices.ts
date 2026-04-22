import type { Environment, Invoice, InvoiceListResponse } from "../types";
import { request } from "./core";

export async function fetchInvoices(token: string) {
  return request<InvoiceListResponse>("/api/invoices?page=1&page_size=50", {}, token);
}

export async function createInvoice(token: string, payload: {
  title: string;
  base_amount_usd: string;
  payable_network: string;
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
