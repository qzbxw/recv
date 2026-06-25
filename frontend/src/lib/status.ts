import type { Invoice, InvoiceStatus, Network, PaymentAsset } from "./types";

export type Language = "ru" | "en" | "uk" | "uz" | "de";

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
    label: { ru: "Черновик", en: "Draft", uk: "Чернетка", uz: "Qoralama", de: "Entwurf" },
    shortLabel: { ru: "Черновик", en: "Draft", uk: "Чернетка", uz: "Qoralama", de: "Entwurf" },
    tone: "neutral",
    isFinal: false,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  awaiting_payment: {
    label: { ru: "Ждет оплату", en: "Awaiting payment", uk: "Очікує оплату", uz: "To'lov kutilmoqda", de: "Wartet auf Zahlung" },
    shortLabel: { ru: "Ожидание", en: "Awaiting", uk: "Очікує", uz: "Kutilmoqda", de: "Ausstehend" },
    tone: "info",
    isFinal: false,
    canCopyPaymentDetails: true,
    canSellerCancel: true,
    canSellerMarkPaid: true,
  },
  paid: {
    label: { ru: "Оплачен", en: "Paid", uk: "Оплачено", uz: "To'langan", de: "Bezahlt" },
    shortLabel: { ru: "Оплачен", en: "Paid", uk: "Оплачено", uz: "To'langan", de: "Bezahlt" },
    tone: "success",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  expired: {
    label: { ru: "Срок истек", en: "Expired", uk: "Строк минув", uz: "Muddati o'tgan", de: "Abgelaufen" },
    shortLabel: { ru: "Истек", en: "Expired", uk: "Минув", uz: "Muddati o'tgan", de: "Abgelaufen" },
    tone: "danger",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: false,
  },
  underpaid: {
    label: { ru: "Недоплата", en: "Underpaid", uk: "Недоплата", uz: "Kam to'langan", de: "Unterbezahlt" },
    shortLabel: { ru: "Недоплата", en: "Underpaid", uk: "Недоплата", uz: "Kam to'langan", de: "Unterbezahlt" },
    tone: "warning",
    isFinal: false,
    canCopyPaymentDetails: true,
    canSellerCancel: false,
    canSellerMarkPaid: true,
  },
  overpaid: {
    label: { ru: "Переплата", en: "Overpaid", uk: "Переплата", uz: "Ortiqcha to'langan", de: "Überbezahlt" },
    shortLabel: { ru: "Переплата", en: "Overpaid", uk: "Переплата", uz: "Ortiqcha", de: "Überbezahlt" },
    tone: "review",
    isFinal: true,
    canCopyPaymentDetails: false,
    canSellerCancel: false,
    canSellerMarkPaid: true,
  },
  manual_review: {
    label: { ru: "Ручная проверка", en: "Manual review", uk: "Ручна перевірка", uz: "Qo'lda tekshirish", de: "Manuelle Prüfung" },
    shortLabel: { ru: "Проверка", en: "Review", uk: "Перевірка", uz: "Tekshiruv", de: "Prüfung" },
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

export function getInvoiceStatusTooltip(status: Invoice["status"], language: Language) {
  const tooltips: Partial<Record<InvoiceStatus, Record<Language, string>>> = {
    underpaid: {
      ru: "Клиент прислал меньше (возможно, биржа съела комиссию). Можно принять вручную",
      en: "Customer sent less (possibly exchange withdrawal fee was deducted). You can accept it manually.",
      uk: "Клієнт надіслав менше (можливо, біржа утримала комісію). Можна прийняти вручну.",
      uz: "Mijoz kamroq yubordi (ehtimol, birja yechib olish komissiyasini ushlab qolgan). Qo'lda qabul qilishingiz mumkin.",
      de: "Der Kunde hat weniger gesendet (möglicherweise wurde eine Börsen-Auszahlungsgebühr abgezogen). Sie können die Zahlung manuell akzeptieren.",
    },
    expired: {
      ru: "Оплата пришла после истечения таймера",
      en: "Payment arrived after the timer expired.",
      uk: "Оплата надійшла після завершення таймера.",
      uz: "To'lov taymer muddati tugagandan keyin keldi.",
      de: "Die Zahlung ist nach Ablauf des Timers eingegangen.",
    },
    manual_review: {
      ru: "Сумма не сошлась точно, требуется ваше решение",
      en: "The amount did not match exactly and needs your decision.",
      uk: "Сума не збіглася точно, потрібне ваше рішення.",
      uz: "Summa aniq mos kelmadi, qaroringiz kerak.",
      de: "Der Betrag stimmt nicht exakt überein und benötigt Ihre Entscheidung.",
    },
  };
  return tooltips[status]?.[language] ?? "";
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
      return "USDT on TON";
    case "SOLANA":
      return "Solana";
    case "ARBITRUM":
      return "Arbitrum";
    case "BASE":
      return "Base";
    case "BSC":
      return "BSC";
    case "TRON":
      return "TRON";
    case "TON":
      return "TON";
    default:
      return network;
  }
}

export function formatPaymentAssetLabel(asset: PaymentAsset | undefined, network?: Network) {
  if (asset) {
    return asset;
  }
  return network === "TON" ? "GRAM" : network || "";
}

export function formatPaymentAmount(value: string, network?: Network) {
  const trimmed = value.trim();
  const asset = formatPaymentAssetLabel(undefined, network);
  if (!asset || trimmed.toUpperCase().includes(asset)) {
    return trimmed;
  }
  return `${trimmed} ${asset}`;
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
