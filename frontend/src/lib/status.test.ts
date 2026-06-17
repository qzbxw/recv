import { describe, expect, it } from "vitest";
import {
  calculateRemainingAmount,
  canCopyInvoicePaymentDetails,
  formatInvoiceStatus,
  formatNetworkLabel,
  formatPaymentAmount,
  getInvoiceStatusMeta,
  isInvoiceExpiredByClock,
} from "./status";
import type { Invoice } from "./types";

const baseInvoice: Invoice = {
  id: 1,
  public_id: "RECV-1",
  title: "Demo",
  base_amount_usd: "10.00",
  payable_amount: "10.000000",
  payable_network: "TON",
  destination_address: "wallet",
  payment_comment: "memo",
  status: "awaiting_payment",
  environment: "test",
  expires_at: "2026-01-01T00:00:00.000Z",
  created_at: "2025-01-01T00:00:00.000Z",
  received_amount: "0",
  checkout_url: "/app/checkout/RECV-1",
  payment_uri: "ton://transfer/wallet",
};

describe("invoice status helpers", () => {
  it("formats status labels by locale and falls back for unknown values", () => {
    expect(formatInvoiceStatus("awaiting_payment", "en")).toBe("Awaiting payment");
    expect(formatInvoiceStatus("awaiting_payment", "ru", true)).toBe("Ожидание");
    expect(formatInvoiceStatus("unknown_status" as Invoice["status"], "en")).toBe("Draft");
  });

  it("exposes status behavior flags", () => {
    expect(getInvoiceStatusMeta("paid").isFinal).toBe(true);
    expect(getInvoiceStatusMeta("underpaid").canSellerMarkPaid).toBe(true);
  });

  it("blocks copying details for expired invoices", () => {
    expect(isInvoiceExpiredByClock(baseInvoice, Date.parse("2025-12-31T00:00:00.000Z"))).toBe(false);
    expect(canCopyInvoicePaymentDetails(baseInvoice, Date.parse("2025-12-31T00:00:00.000Z"))).toBe(true);
    expect(canCopyInvoicePaymentDetails(baseInvoice, Date.parse("2026-01-02T00:00:00.000Z"))).toBe(false);
  });

  it("formats network and payment amount labels", () => {
    expect(formatNetworkLabel("EVM")).toBe("ETHEREUM");
    expect(formatNetworkLabel("TON_USDT")).toBe("USDT on TON");
    expect(formatPaymentAmount("1.25", "TON")).toBe("1.25 GRAM");
    expect(formatPaymentAmount("1.25 GRAM", "TON")).toBe("1.25 GRAM");
  });

  it("calculates remaining payable amount without trailing zero noise", () => {
    expect(calculateRemainingAmount({ ...baseInvoice, payable_amount: "10.000000", received_amount: "2.500000" })).toBe("7.5");
    expect(calculateRemainingAmount({ ...baseInvoice, payable_amount: "0.000001000", received_amount: "0" })).toBe("0.000001");
    expect(calculateRemainingAmount({ ...baseInvoice, payable_amount: "oops", received_amount: "0" })).toBe("");
  });
});
