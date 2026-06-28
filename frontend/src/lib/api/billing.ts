import type { Invoice, BillingOptionsResponse } from "../types";
import { request } from "./core";

export async function getBillingOptions(token: string) {
  return request<BillingOptionsResponse>("/api/billing/options", {}, token);
}

export async function createBillingCheckout(token: string, payload: {
  payable_network?: string;
  payable_asset?: string;
  payment_options?: Array<{ network: string; asset: string }>;
  plan_code?: string;
  subscription_days?: number;
  payment_method?: string;
}) {
  return request<any>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify(payload),
  }, token);
}

export async function redeemPromoCode(token: string, code: string) {
  return request<{ workspace: any; result: string }>("/api/billing/promo-code/redeem", {
    method: "POST",
    body: JSON.stringify({ code }),
  }, token);
}

