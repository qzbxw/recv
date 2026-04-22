import type { Invoice } from "../types";
import { request } from "./core";

export async function createBillingCheckout(token: string, payload: {
  payable_network: string;
  plan_code?: string;
}) {
  return request<Invoice>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

