import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

const COPY = {
  ru: {
    loading: "Загружаем инвойс...",
    waitingPayment: "Ожидание оплаты",
    expiresSoon: "Скоро истечёт",
    expired: "Истёк",
    wallet: "Адрес кошелька",
    amount: "Точная сумма",
    network: "Сеть",
    comment: "Comment / payload",
    expires: "Истекает",
    invoiceId: "Инвойс",
    expiresAt: "До",
    copyAddress: "Копировать адрес",
    copyComment: "Копировать payload",
    copyAmount: "Копировать сумму",
    copied: "Скопировано",
    openWallet: "Открыть в кошельке",
    warning: "Переводи только точную сумму в нужной сети. Если таймер истёк, запроси новый инвойс.",
    payloadTitle: "Payload обязателен",
    payloadHint: "Без этого comment платёж может потеряться. Для TON вставь его без единого изменения.",
    qrLoading: "Готовим QR...",
    paymentRequest: "Платёжный запрос",
    ru: "РУ",
    en: "EN",
    receiptLabel: "Инвойс",
    footerLink: "Powered by Reqst",
    networkOnly: "Только эта сеть",
    paidTitle: "Оплата получена",
    paidBody: "Платёж подтверждён. Можно возвращаться к продавцу или закрывать страницу.",
    paidBadge: "Payment complete",
    expiredTitle: "Инвойс просрочен",
    expiredBody: "Этот платёжный запрос уже неактуален. Не отправляй деньги по этим реквизитам.",
    expiredBadge: "Expired invoice",
    refreshLabel: "Обнови чат с продавцом",
    verifyManually: "Если уже оплатил, дождись ручной проверки.",
  },
  en: {
    loading: "Loading invoice...",
    waitingPayment: "Awaiting payment",
    expiresSoon: "Expires soon",
    expired: "Expired",
    wallet: "Wallet address",
    amount: "Exact amount",
    network: "Network",
    comment: "Comment / payload",
    expires: "Expires",
    invoiceId: "Invoice",
    expiresAt: "Until",
    copyAddress: "Copy address",
    copyComment: "Copy payload",
    copyAmount: "Copy amount",
    copied: "Copied",
    openWallet: "Open in wallet",
    warning: "Send only the exact amount on the correct network. If the timer is over, ask for a fresh invoice.",
    payloadTitle: "Payload required",
    payloadHint: "Without this comment the payment may be lost. For TON, paste it exactly as shown.",
    qrLoading: "Preparing QR...",
    paymentRequest: "Payment request",
    ru: "RU",
    en: "EN",
    receiptLabel: "Invoice",
    footerLink: "Powered by Reqst",
    networkOnly: "Only this network",
    paidTitle: "Payment received",
    paidBody: "The payment is confirmed. You can return to the seller or close this page.",
    paidBadge: "Payment complete",
    expiredTitle: "Invoice expired",
    expiredBody: "This payment request is no longer valid. Do not send funds using these details.",
    expiredBadge: "Expired invoice",
    refreshLabel: "Refresh your chat with the seller",
    verifyManually: "If you already paid, wait for manual review.",
  },
} as const;

const STATUS_LABELS = {
  ru: {
    awaiting_payment: "Ждёт оплату",
    paid: "Оплачен",
    expired: "Истёк",
    underpaid: "Недоплата",
    manual_review: "Ручная проверка",
    draft: "Черновик",
  },
  en: {
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    expired: "Expired",
    underpaid: "Underpaid",
    manual_review: "Manual review",
    draft: "Draft",
  },
} as const;

function fallbackPaymentURI(invoice: Invoice) {
  if (invoice.payable_network === "TON") {
    const amount = Math.round(Number(invoice.payable_amount) * 1_000_000_000);
    const comment = invoice.payment_comment ? `&text=${encodeURIComponent(invoice.payment_comment)}` : "";
    return `ton://transfer/${invoice.destination_address}?amount=${amount}${comment}`;
  }
  return [invoice.destination_address, invoice.payment_comment, `${invoice.payable_amount} ${invoice.payable_network}`].filter(Boolean).join("\n");
}

function formatStatus(language: keyof typeof STATUS_LABELS, status: string) {
  return STATUS_LABELS[language][status as keyof (typeof STATUS_LABELS)[typeof language]] ?? status.replaceAll("_", " ");
}

function formatAddressPreview(address: string) {
  if (address.length <= 22) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const { language, theme, setLanguage, setTheme } = useUI();
  const text = COPY[language];
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copiedField, setCopiedField] = useState<"amount" | "address" | "comment" | "">("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await fetchPublicInvoice(publicId);
        if (!active) {
          return;
        }
        setInvoice(result);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }
        setError((err as Error).message);
      }
    }

    void load();
    const poll = window.setInterval(load, 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [publicId]);

  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }

    const source = invoice.payment_uri || fallbackPaymentURI(invoice);

    void QRCode.toDataURL(source, {
      width: 288,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: theme === "dark" ? "#f7f3ea" : "#14181b",
        light: theme === "dark" ? "#050505" : "#fffaf4",
      },
    })
      .then(setQrDataUrl)
      .catch(async () => {
        try {
          const fallback = await QRCode.toDataURL(fallbackPaymentURI(invoice), {
            width: 288,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
              dark: theme === "dark" ? "#f7f3ea" : "#14181b",
              light: theme === "dark" ? "#050505" : "#fffaf4",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice, theme]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }
    const timeout = window.setTimeout(() => setCopiedField(""), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  const timeLeft = useMemo(() => {
    if (!invoice) {
      return "00:00";
    }
    const diff = new Date(invoice.expires_at).getTime() - now;
    if (diff <= 0) {
      return text.expired;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [invoice, now, text.expired]);

  const title = invoice?.title?.trim() || text.paymentRequest;
  const statusLabel = invoice ? formatStatus(language, invoice.status) : "";
  const expiresDiff = invoice ? new Date(invoice.expires_at).getTime() - now : 0;
  const isExpired = invoice ? expiresDiff <= 0 || invoice.status === "expired" : false;
  const isPaid = invoice?.status === "paid";
  const isExpiringSoon = !isExpired && !isPaid && expiresDiff > 0 && expiresDiff <= 5 * 60 * 1000;
  const paymentRows = invoice
    ? [
        {
          key: "amount" as const,
          label: text.amount,
          value: `${invoice.payable_amount} ${invoice.payable_network}`,
          secondary: `${text.network}: ${invoice.payable_network}`,
          copyLabel: text.copyAmount,
        },
        {
          key: "address" as const,
          label: text.wallet,
          value: invoice.destination_address,
          secondary: formatAddressPreview(invoice.destination_address),
          copyLabel: text.copyAddress,
        },
      ]
    : [];

  async function copyValue(key: "amount" | "address" | "comment", value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(key);
  }

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <div className="topbar-brand topbar-brand--minimal">
          <strong>reqst</strong>
          <span>{text.receiptLabel}</span>
        </div>
        <div className="micro-actions">
          <div className="micro-action-group" role="group" aria-label="language">
            <button type="button" className={language === "ru" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("ru")}>
              {text.ru}
            </button>
            <span className="micro-divider">|</span>
            <button type="button" className={language === "en" ? "micro-action active" : "micro-action"} onClick={() => setLanguage("en")}>
              {text.en}
            </button>
          </div>
          <button
            type="button"
            className="micro-action micro-action--icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
          >
            {theme === "light" ? "☀" : "☾"}
          </button>
        </div>
      </header>

      <section className="checkout-card checkout-card--lux">
        {error ? <div className="alert">{error}</div> : null}
        {!invoice ? <p className="muted">{text.loading}</p> : null}

        {invoice ? (
          <>
            <div className={isPaid ? "receipt-hero receipt-hero--paid" : isExpired ? "receipt-hero receipt-hero--expired" : "receipt-hero"}>
              <div className="receipt-copy">
                <div className="receipt-brandline">
                  <span className="receipt-brandmark" aria-hidden="true" />
                  <span>{text.receiptLabel}</span>
                </div>
                <div className="receipt-heading">
                  <span className={`status-dot status-${invoice.status}`} aria-hidden="true" />
                  <span className={`status-pill receipt-status status-${invoice.status}`}>
                    {isPaid ? text.paidBadge : isExpired ? text.expiredBadge : statusLabel}
                  </span>
                </div>
                <h1>{isPaid ? text.paidTitle : isExpired ? text.expiredTitle : title}</h1>
                {!isPaid ? (
                  <div className={isExpiringSoon ? "receipt-timer receipt-timer--urgent" : "receipt-timer"}>
                    <span>{isExpired ? text.expired : text.waitingPayment}</span>
                    <strong>{timeLeft}</strong>
                    {isExpiringSoon ? <em>{text.expiresSoon}</em> : null}
                  </div>
                ) : null}
                <p className="hero-copy">{isPaid ? text.paidBody : isExpired ? text.expiredBody : text.warning}</p>
                <div className="receipt-docmeta">
                  <div>
                    <span>{text.invoiceId}</span>
                    <strong>{invoice.public_id}</strong>
                  </div>
                  <div>
                    <span>{text.expiresAt}</span>
                    <strong>{new Date(invoice.expires_at).toLocaleString()}</strong>
                  </div>
                </div>
                {isExpired && !isPaid ? <p className="muted">{text.verifyManually}</p> : null}
              </div>

              <div className="amount-totem amount-totem--receipt">
                <span>{text.amount}</span>
                <strong>{invoice.payable_amount}</strong>
                <p>{invoice.payable_network}</p>
                <div className="network-badge">
                  <b>{invoice.payable_network}</b>
                  <small>{text.networkOnly}</small>
                </div>
              </div>
            </div>

            <div className="checkout-grid checkout-grid--receipt">
              <section className="payment-sheet payment-sheet--receipt">
                <div className="payment-sheet-header">
                  {!isPaid && !isExpired && invoice.payment_uri ? (
                    <a className="inline-link inline-link--wallet" href={invoice.payment_uri}>
                      {text.openWallet}
                    </a>
                  ) : null}
                </div>
                <div className="payment-essentials">
                  {invoice.payment_comment ? (
                    <div className="payload-callout payload-callout--critical">
                      <div className="payload-head">
                        <div>
                          <span>{text.payloadTitle}</span>
                          <p>{text.payloadHint}</p>
                        </div>
                        <button type="button" className="field-copy" onClick={() => void copyValue("comment", invoice.payment_comment ?? "")} aria-label={text.copyComment}>
                          {copiedField === "comment" ? text.copied : "⧉"}
                        </button>
                      </div>
                      <div className="payment-field payment-field--alert">
                        <div>
                          <label>{text.comment}</label>
                          <code>{invoice.payment_comment}</code>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {paymentRows.map((row) => (
                    <button key={row.key} type="button" className="payment-field payment-field--button" onClick={() => void copyValue(row.key, row.value)}>
                      <div>
                        <label>{row.label}</label>
                        <code>{row.value}</code>
                        <small>{row.secondary}</small>
                      </div>
                      <span className="field-copy" aria-label={row.copyLabel}>
                        {copiedField === row.key ? text.copied : "⧉"}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="receipt-meta">
                  <span>{text.expires}</span>
                  <strong>{new Date(invoice.expires_at).toLocaleString()}</strong>
                </div>
              </section>

              <aside className="qr-stage qr-stage--receipt">
                <div className="qr-shell qr-shell--receipt">
                  <div className={isPaid ? "qr-frame qr-frame--receipt qr-frame--paid" : isExpired ? "qr-frame qr-frame--receipt qr-frame--expired" : "qr-frame qr-frame--receipt"}>
                    {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                  </div>
                </div>
              </aside>
            </div>

            <footer className="checkout-footer">
              <a className="checkout-footer-link" href={BOT_URL} target="_blank" rel="noreferrer">
                reqst · {text.footerLink}
              </a>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
