import type {
  APIKey,
  APIKeyListResponse,
  DeveloperUsageResponse,
  Environment,
  Invoice,
  WebhookDelivery,
  WebhookDeliveryListResponse,
  WebhookEndpoint,
  WebhookListResponse,
} from "../types";
import { request } from "./core";

export async function fetchDeveloperUsage(token: string) {
  return request<DeveloperUsageResponse>("/api/developer/usage", {}, token);
}

export async function fetchAPIKeys(token: string) {
  return request<APIKeyListResponse>("/api/developer/api-keys", {}, token);
}

export async function createAPIKey(token: string, payload: { label: string; scopes?: string[]; environment?: Environment }) {
  return request<{ api_key: APIKey; secret: string }>("/api/developer/api-keys", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function createTestAPIKey(token: string, payload: { label: string; scopes?: string[] }) {
  return createAPIKey(token, { ...payload, environment: "test" });
}

export async function deleteAPIKey(token: string, keyId: number) {
  return request<void>(`/api/developer/api-keys/${keyId}`, { method: "DELETE" }, token);
}

export async function fetchWebhookEndpoints(token: string) {
  return request<WebhookListResponse>("/api/developer/webhooks", {}, token);
}

export async function createWebhookEndpoint(token: string, payload: { label: string; url: string; environment?: Environment }) {
  return request<{ webhook: WebhookEndpoint }>("/api/developer/webhooks", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function rotateWebhookEndpointSecret(token: string, endpointId: number) {
  return request<{ webhook: WebhookEndpoint }>(`/api/developer/webhooks/${endpointId}/rotate-secret`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function deleteWebhookEndpoint(token: string, endpointId: number) {
  return request<void>(`/api/developer/webhooks/${endpointId}`, { method: "DELETE" }, token);
}

export async function fetchWebhookDeliveries(token: string) {
  return request<WebhookDeliveryListResponse>("/api/developer/webhook-deliveries?limit=50", {}, token);
}

export async function resendWebhookDelivery(token: string, deliveryId: number) {
  return request<{ delivery: WebhookDelivery }>(`/api/developer/webhook-deliveries/${deliveryId}/resend`, {
    method: "POST",
    body: JSON.stringify({}),
  }, token);
}

export async function createDeveloperInvoice(apiKey: string, payload: {
  title: string;
  base_amount_usd: string;
  payable_network: string;
  expires_in_minutes: number;
  environment?: Environment;
}) {
  return request<Invoice>("/v1/invoices", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Idempotency-Key": `sample-${Date.now()}`,
    },
  }, apiKey);
}

export async function simulateTestPayment(apiKey: string, invoiceId: number) {
  return request<Invoice>(`/v1/test/invoices/${invoiceId}/simulate-payment`, {
    method: "POST",
    body: JSON.stringify({}),
  }, apiKey);
}
