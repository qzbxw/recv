import type { Invoice, InvoiceStatus, Network } from "./types";

export type Language = "ru" | "en";

export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger" | "review";

export type InvoiceStatusMeta = {
  label: Record<Language, string>;
  shortLabel: Record<Language, string>;
  tone: StatusTone;
  isFinal: boolean;
  canCopyPaymentDetails: boolean;
  canSellerCancel: boolean;
  canSellerMarkPaid: boolean;
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, InvoiceStatusMeta> = {
  draft: {
    label: { ru: "Черновик", en: "Draft" },
    shortLabel: { ru: "Черновик", en: "Draft" },
    tone: "neutral",
    isFinal: false,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  awaiting_payment: {
    label: { ru: "Ждет оплату", en: "Awaiting payment" },
    shortLabel: { ru: "Ожидание", en: "Awaiting" },
    tone: "info",
    isFinal: false,
    canCopyPaymentDetails: true,
    canSellerCancel: true,
    canSellerMarkPaid: true,
  },
  paid: {
    label: { ru: "Оплачен", en: "Paid" },
    shortLabel: { ru: "Оплачен", en: "Paid" },
    tone: "success",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  expired: {
    label: { ru: "Срок истек", en: "Expired" },
    shortLabel: { ru: "Истек", en: "Expired" },
    tone: "danger",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  underpaid: {
    label: { ru: "Недоплата", en: "Underpaid" },
    shortLabel: { ru: "Недоплата", en: "Underpaid" },
    tone: "warning",
    isFinal: false,
    canCopyPaymentDetails: true,
    canSellerCancel: false,
    canSellerMarkPaid: true,
  },
  overpaid: {
    label: { ru: "Переплата", en: "Overpaid" },
    shortLabel: { ru: "Переплата", en: "Overpaid" },
    tone: "review",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: true,
  },
  manual_review: {
    label: { ru: "Ручная проверка", en: "Manual review" },
    shortLabel: { ru: "Проверка", en: "Review" },
    tone: "review",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: true,
  },
};

export function getInvoiceStatusMeta(status: Invoice["status"]) {
  return INVOICE_STATUS_META[status] ?? INVOICE_STATUS_META.draft;
}

export function formatInvoiceStatus(status: Invoice["status"], language: Language, short = false) {
  const meta = getInvoiceStatusMeta(status);
  return (short ? meta.shortLabel : meta.label)[language] ?? status.replaceAll("_", " ");
}

export function isInvoiceExpiredByClock(invoice: Invoice, now = Date.now()) {
  return invoice.status === "expired" || new Date(invoice.expires_at).getTime() <= now;
}

export function canCopyInvoicePaymentDetails(invoice: Invoice, now = Date.now()) {
  if (isInvoiceExpiredByClock(invoice, now)) {
    return false;
  }
  return getInvoiceStatusMeta(invoice.status).canCopyPaymentDetails;
}

export function formatNetworkLabel(network: Network) {
  switch (network) {
    case "EVM":
      return "ETHEREUM";
    case "TON_USDT":
      return "TON USDT";
    default:
      return network;
  }
}

export function formatPaymentAmount(value: string, network?: Network) {
  const trimmed = value.trim();
  if (!network || trimmed.toUpperCase().includes(network)) {
    return trimmed;
  }
  return `${trimmed} ${network}`;
}

export function calculateRemainingAmount(invoice: Invoice) {
  const expected = Number.parseFloat(invoice.payable_amount);
  const received = Number.parseFloat(invoice.received_amount || "0");
  if (!Number.isFinite(expected) || !Number.isFinite(received)) {
    return "";
  }
  const remaining = Math.max(0, expected - received);
  return remaining.toFixed(remaining >= 1 ? 6 : 9).replace(/0+$/, "").replace(/\.$/, "");
}

