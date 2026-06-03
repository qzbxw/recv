import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice, trackPublicEvent } from "../lib/api";
import { calculateRemainingAmount, canCopyInvoicePaymentDetails, formatInvoiceStatus, formatNetworkLabel } from "../lib/status";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";
import { CHECKOUT_COPY as COPY } from "../i18n";

const BOT_URL = "https://t.me/recvxyz_bot";
const DEMO_PUBLIC_ID = "demo";

function fallbackPaymentURI(invoice: Invoice) {
  if (invoice.payable_network === "TON") {
    const amount = Math.round(Number(invoice.payable_amount) * 1_000_000_000);
    const comment = invoice.payment_comment ? `&text=${encodeURIComponent(invoice.payment_comment)}` : "";
    return `ton://transfer/${invoice.destination_address}?amount=${amount}${comment}`;
  }
  return [invoice.destination_address, invoice.payment_comment, `${invoice.payable_amount} ${invoice.payable_network}`].filter(Boolean).join("\n");
}

function formatAddressPreview(address: string) {
  if (address.length <= 22) {
    return address;
  }
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}

function formatDateTime(value: string, language: keyof typeof COPY) {
  return new Date(value).toLocaleString(language === "ru" ? "ru-RU" : "en-US");
}

function createDemoInvoice(): Invoice {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 17 * 60 * 1000).toISOString();
  return {
    id: 0,
    public_id: "RECV-DEMO-149",
    kind: "merchant",
    plan_code: "merchant",
    checkout_badge: "Demo Checkout",
    title: "recv Product Demo",
    base_amount_usd: "149.00",
    payable_amount: "149 USDT",
    payable_network: "TON",
    destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7",
    payment_comment: "RECV-DEMO-149",
    status: "awaiting_payment",
    environment: "test",
    expires_at: expiresAt,
    created_at: now.toISOString(),
    tx_hash: null,
    received_amount: "0",
    review_reason: null,
    finalized_at: null,
    checkout_url: "/app/checkout/demo",
    payment_uri: "ton://transfer/UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7?amount=149000000000&text=RECV-DEMO-149",
  };
}

const Icons = {
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const { language, setLanguage } = useUI();
  const text = COPY[language];
  const demoInvoice = useMemo(() => createDemoInvoice(), []);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());
  const [copiedField, setCopiedField] = useState<"amount" | "address" | "comment" | "">("");
  const [retryNonce, setRetryNonce] = useState(0);
  const statusRef = useRef("");
  const trackedCheckoutRef = useRef("");

  const loadInvoice = useCallback(async (active = true) => {
    if (publicId === DEMO_PUBLIC_ID) {
      if (active) {
        setInvoice(demoInvoice);
        setError("");
      }
      return;
    }

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
  }, [demoInvoice, publicId]);

  useEffect(() => {
    statusRef.current = invoice?.status || "";
  }, [invoice?.status]);

  useEffect(() => {
    let active = true;

    void loadInvoice(active);
    const poll = window.setInterval(() => {
      if (["paid", "expired", "overpaid", "manual_review"].includes(statusRef.current)) {
        window.clearInterval(poll);
        return;
      }
      void loadInvoice(active);
    }, 5000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [loadInvoice, retryNonce]);

  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }
    if (trackedCheckoutRef.current !== invoice.public_id) {
      trackedCheckoutRef.current = invoice.public_id;
      trackPublicEvent({
        event_name: "checkout_viewed",
        source: "checkout",
        invoice_public_id: invoice.public_id,
        properties: { status: invoice.status, network: invoice.payable_network },
      });
    }

    const source = invoice.payment_uri || fallbackPaymentURI(invoice);

    void QRCode.toDataURL(source, {
      width: 288,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#050505",
        light: "#ffffff",
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
              dark: "#050505",
              light: "#ffffff",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice]);

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

  useEffect(() => {
    document.title = invoice?.title?.trim()
      ? `recv | ${invoice.title.trim()}`
      : text.pageTitle;
  }, [invoice?.title, text.pageTitle]);

  const title = invoice?.title?.trim() || text.paymentRequest;
  const checkoutBadge = invoice?.checkout_badge || (invoice?.kind === "subscription" ? "recv Billing" : text.paymentRequest);
  const checkoutVariant = invoice?.plan_code && invoice.plan_code !== "trial" ? invoice.plan_code : "merchant";
  const statusLabel = invoice ? formatInvoiceStatus(invoice.status, language) : "";
  const expiresDiff = invoice ? new Date(invoice.expires_at).getTime() - now : 0;
  const isExpired = invoice ? expiresDiff <= 0 || invoice.status === "expired" : false;
  const isPaid = invoice?.status === "paid";
  const isUnderpaid = invoice?.status === "underpaid";
  const isOverpaid = invoice?.status === "overpaid";
  const isManualReview = invoice?.status === "manual_review";
  const canCopyDetails = invoice ? canCopyInvoicePaymentDetails(invoice, now) : false;
  const isFinalState = !canCopyDetails;
  const isExpiringSoon = !isExpired && !isPaid && expiresDiff > 0 && expiresDiff <= 5 * 60 * 1000;
  const remainingAmount = invoice ? calculateRemainingAmount(invoice) : "";
  const paymentRows = invoice
    ? [
        {
          key: "amount" as const,
          label: text.amount,
          value: invoice.payable_amount,
          secondary: formatNetworkLabel(invoice.payable_network),
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
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
    } catch {
      setError(language === "ru" ? "Не удалось скопировать. Скопируйте значение вручную." : "Copy failed. Copy the value manually.");
    }
  }

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <div className="topbar-brand topbar-brand--minimal">
          <strong>recv</strong>
        </div>
        <div className="lend-language topbar-language" role="group" aria-label="language">
          <button type="button" className={language === "ru" ? "active" : ""} onClick={() => setLanguage("ru")}>
            RU
          </button>
          <button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>
            EN
          </button>
        </div>
      </header>

      <section className={`checkout-card checkout-card--lux checkout-card--${checkoutVariant}`}>
        {error ? <div className="alert" role="status">{error} <button type="button" className="ghost-button compact-button" onClick={() => setRetryNonce((value) => value + 1)}>{text.retry}</button></div> : null}
        {!invoice ? <p className="muted">{text.loading}</p> : null}

        {invoice ? (
          <>
            <div className={`checkout-flow portal-animate-in ${isPaid ? "is-paid" : ""} ${isExpired ? "is-expired" : ""}`}>
              <section className="checkout-story">
                <div className="receipt-hero receipt-hero--streamlined">
                  <div className="receipt-copy">
                    <div className="receipt-heading">
                      <span className={`status-pill receipt-status status-${invoice.status}`}>
                        {isPaid && <Icons.Check />}
                        {isExpired && <Icons.Alert />}
                        {formatInvoiceStatus(invoice.status, language)}
                      </span>
                    </div>
                    <h1>{title}</h1>
                    
                    {!isPaid && !isExpired && (
                      <div className={isExpiringSoon ? "receipt-timer receipt-timer--urgent" : "receipt-timer"}>
                        <strong>{timeLeft}</strong>
                        {isExpiringSoon ? <em>{text.expiresSoon}</em> : null}
                      </div>
                    )}

                    <div className={`receipt-warning-callout ${isPaid ? "is-success" : isExpired ? "is-error" : ""}`}>
                      {isPaid ? <Icons.Check /> : isExpired ? <Icons.Alert /> : <Icons.Alert />}
                      <p className="hero-copy">
                        {isPaid ? text.paidBody : isExpired ? text.expiredBody : isUnderpaid ? text.underpaidBody : isOverpaid ? text.overpaidBody : isManualReview ? text.manualReviewBody : text.warning}
                      </p>
                    </div>

                    {isUnderpaid || isOverpaid || isManualReview ? (
                      <div className="checkout-state-note">
                        <strong>{text.underpaidReceived}: {invoice.received_amount || "0"} {formatNetworkLabel(invoice.payable_network)}</strong>
                        {isUnderpaid && remainingAmount ? <small>{text.underpaidRemaining}: {remainingAmount} {formatNetworkLabel(invoice.payable_network)}</small> : null}
                        {invoice.review_reason ? <small>{invoice.review_reason.replaceAll("_", " ")}</small> : null}
                      </div>
                    ) : null}

                    <div className="receipt-docmeta">
                      <div>
                        <span>{text.invoiceId}</span>
                        <strong>{invoice.public_id}</strong>
                      </div>
                      <div>
                        <span>{isPaid ? text.status : text.expiresAt}</span>
                        <strong>{isPaid ? statusLabel : formatDateTime(invoice.expires_at, language)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <section className={`payment-sheet payment-sheet--receipt ${isFinalState ? "is-disabled" : ""}`}>
                  <div className="payment-sheet-header">
                    <span className="payment-sheet-kicker">{text.paymentDetails}</span>
                  </div>
                  <div className="payment-essentials">
                    {invoice.payment_comment ? (
                      <div className="payload-callout payload-callout--critical">
                        <div className="payload-head">
                          <div className="payload-info">
                            <div className="payload-title-row">
                              <Icons.Alert />
                              <span>{text.payloadTitle}</span>
                            </div>
                            <p>{text.payloadHint}</p>
                          </div>
                          {canCopyDetails && (
                            <button type="button" className={`field-copy field-copy--named ${copiedField === "comment" ? "is-copied" : ""}`} onClick={() => void copyValue("comment", invoice.payment_comment ?? "")} aria-label={text.copyComment}>
                              <Icons.Copy />
                              {copiedField === "comment" ? text.copied : text.copyComment}
                            </button>
                          )}
                        </div>
                        <div className="payment-field payment-field--alert">
                          <div>
                            <label>{text.comment}</label>
                            <code>{invoice.payment_comment}</code>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {paymentRows
                      .filter((row) => row.key !== "amount")
                      .map((row) => (
                        <button key={row.key} type="button" className={`payment-field ${canCopyDetails ? "payment-field--button" : ""}`} onClick={() => canCopyDetails && void copyValue(row.key, row.value)} disabled={!canCopyDetails}>
                          <div>
                            <label>{row.label}</label>
                            <code>{row.value}</code>
                            <small>{row.secondary}</small>
                          </div>
                          {canCopyDetails && (
                            <span className="field-copy field-copy--named" aria-label={row.copyLabel}>
                              <Icons.Copy />
                              {copiedField === row.key ? text.copied : row.copyLabel}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </section>
              </section>

              <aside className="payment-rail">
                <div className={`amount-totem amount-totem--receipt amount-totem--rail ${isPaid ? "is-success" : isExpired ? "is-error" : ""}`}>
                  <span>{text.amount}</span>
                  <strong>{invoice.payable_amount}</strong>
                  <div className="network-badge">
                    <b>{formatNetworkLabel(invoice.payable_network)}</b>
                    <small>{text.networkOnly}</small>
                  </div>
                  {canCopyDetails && (
                    <div className="exact-amount-warning">
                      <Icons.Alert />
                      <p>{text.exactAmountWarning}</p>
                    </div>
                  )}
                  {canCopyDetails && (
                    <button type="button" className={`ghost-button compact-button payment-rail-action ${copiedField === "amount" ? "is-copied" : ""}`} onClick={() => void copyValue("amount", invoice.payable_amount)}>
                      <Icons.Copy />
                      {copiedField === "amount" ? text.copied : text.copyAmount}
                    </button>
                  )}
                  {canCopyDetails && invoice.payment_uri ? (
                    <a className="ghost-button compact-button payment-rail-action" href={invoice.payment_uri}>
                      {text.openWallet}
                    </a>
                  ) : null}
                </div>

                <aside className="qr-stage qr-stage--receipt">
                  <div className="qr-shell qr-shell--receipt">
                    <div className={`qr-frame qr-frame--receipt ${isPaid ? "qr-frame--success" : isExpired ? "qr-frame--expired" : ""}`}>
                      {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                    </div>
                  </div>
                  {canCopyDetails ? <p className="qr-caption">{text.scanHint}</p> : null}
                </aside>
              </aside>
            </div>

            <footer className="checkout-footer">
              <a className="checkout-footer-promo" href="/">
                <div className="promo-brand">
                  <span>{text.footerPoweredBy}</span>
                  <strong>recv</strong>
                </div>
                <span className="promo-cta">{text.footerCTA}</span>
              </a>
            </footer>
          </>
        ) : null}
      </section>
    </main>
  );
}
