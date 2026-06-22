import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice, trackPublicEvent } from "../lib/api";
import { calculateRemainingAmount, canCopyInvoicePaymentDetails, formatInvoiceStatus, formatNetworkLabel, formatPaymentAssetLabel, getInvoiceStatusMeta } from "../lib/status";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";
import { CHECKOUT_COPY as COPY } from "../i18n";
import "../styles/checkout.css";

const BOT_URL = "https://t.me/recvmoney_bot";
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

function formatAddressTruncatedMobile(address: string) {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
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
    payable_asset: "USDT",
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
  Scan: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1 2-2h12v6" />
      <path d="M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <circle cx="16" cy="14" r="1" />
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
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const statusRef = useRef("");
  const trackedCheckoutRef = useRef("");

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

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
    if (!invoice?.payment_options?.[selectedOptionIndex]) {
      setSelectedOptionIndex(0);
    }
  }, [invoice?.payment_options, selectedOptionIndex]);

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

    const option = invoice.payment_options?.[selectedOptionIndex] ?? invoice.payment_options?.[0];
    const source = option?.payment_uri || invoice.payment_uri || fallbackPaymentURI(invoice);

    void QRCode.toDataURL(source, {
      width: 288,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#ffffff",
        light: "#121214",
      },
    })
      .then(setQrDataUrl)
      .catch(async () => {
        try {
          const fallback = await QRCode.toDataURL(fallbackPaymentURI(invoice), {
            width: 288,
            margin: 2,
            errorCorrectionLevel: "M",
            color: {
              dark: "#ffffff",
              light: "#121214",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice, selectedOptionIndex]);

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
  const selectedOption = invoice?.payment_options?.[selectedOptionIndex] ?? invoice?.payment_options?.[0] ?? null;
  const activePayment = invoice && selectedOption
    ? {
        payable_amount: selectedOption.payable_amount,
        payable_network: selectedOption.network,
        payable_asset: selectedOption.asset,
        destination_address: selectedOption.destination_address,
        payment_comment: selectedOption.payment_comment,
        payment_uri: selectedOption.payment_uri,
      }
    : invoice
      ? {
          payable_amount: invoice.payable_amount,
          payable_network: invoice.payable_network,
          payable_asset: invoice.payable_asset,
          destination_address: invoice.destination_address,
          payment_comment: invoice.payment_comment,
          payment_uri: invoice.payment_uri,
        }
      : null;
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
          value: activePayment?.payable_amount || invoice.payable_amount,
          secondary: `${activePayment?.payable_asset || invoice.payable_asset || ""} ${formatNetworkLabel(activePayment?.payable_network || invoice.payable_network)}`.trim(),
          copyLabel: text.copyAmount,
        },
        {
          key: "address" as const,
          label: text.wallet,
          value: activePayment?.destination_address || invoice.destination_address,
          secondary: formatAddressPreview(activePayment?.destination_address || invoice.destination_address),
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

  const statusTone = invoice ? getInvoiceStatusMeta(invoice.status).tone : "neutral";
  const netLabel = invoice
    ? `${activePayment?.payable_asset || invoice.payable_asset || ""} ${formatNetworkLabel(activePayment?.payable_network || invoice.payable_network)}`.trim()
    : "";
  const bigAmount = activePayment?.payable_amount || invoice?.payable_amount || "";
  const addressValue = activePayment?.destination_address || invoice?.destination_address || "";
  const commentValue = activePayment?.payment_comment || invoice?.payment_comment || "";
  const finalBody = isPaid
    ? text.paidBody
    : isExpired
      ? text.expiredBody
      : isOverpaid
        ? text.overpaidBody
        : isManualReview
          ? text.manualReviewBody
          : text.warning;
  const finalTone = isPaid ? "success" : isExpired ? "danger" : isOverpaid || isManualReview ? "review" : "warning";

  return (
    <main className="co-page">
      <div className="co-aura co-aura--1" />
      <div className="co-aura co-aura--2" />

      <header className="co-top">
        <a className="co-brand" href="/">recv</a>
        <div className="co-lang" role="group" aria-label="language">
          <button id="co-lang-ru" type="button" className={language === "ru" ? "is-active" : ""} onClick={() => setLanguage("ru")}>RU</button>
          <button id="co-lang-en" type="button" className={language === "en" ? "is-active" : ""} onClick={() => setLanguage("en")}>EN</button>
        </div>
      </header>

      <section className={`co-card co-card--${checkoutVariant}`} onMouseMove={handleMouseMove}>
        {error ? (
          <div className="co-alert" role="status">
            <span>{error}</span>
            <button type="button" onClick={() => setRetryNonce((value) => value + 1)}>{text.retry}</button>
          </div>
        ) : null}

        {!invoice ? (
          <div className="co-loading"><span className="co-spinner" />{text.loading}</div>
        ) : isFinalState ? (
          <div className={`co-final co-final--${finalTone}`}>
            <div className="co-final__icon">{isPaid ? <Icons.Check /> : <Icons.Alert />}</div>
            <h1 className="co-final__title">{statusLabel}</h1>
            <div className="co-final__amount">{bigAmount}</div>
            <p className="co-final__body">{finalBody}</p>
            {isOverpaid || isManualReview ? (
              <div className="co-final__note">
                <strong>{text.underpaidReceived}: {invoice.received_amount || "0"} {formatPaymentAssetLabel(invoice.payable_asset, invoice.payable_network)}</strong>
                {invoice.review_reason ? <small>{invoice.review_reason.replaceAll("_", " ")}</small> : null}
              </div>
            ) : null}
            <div className="co-final__meta">
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
        ) : (
          <div className="co-pay">
            <div className="co-head">
              <div className="co-statusrow">
                <span className="co-statusrow__meta">
                  <span className={`co-pill co-pill--${statusTone}`} />
                  <span style={{ fontWeight: 600, color: statusTone === "neutral" ? "var(--co-muted)" : `var(--co-${statusTone})` }}>
                    {statusLabel}
                  </span>
                  <span className="co-statusrow__divider">·</span>
                  <span className="co-id">{text.invoiceId} <span style={{ color: "var(--co-faint)" }}>{invoice.public_id}</span></span>
                </span>
              </div>
              <h1 className="co-title">{title}</h1>
            </div>

            {invoice.payment_options && invoice.payment_options.length > 1 ? (
              <div className="co-options">
                {invoice.payment_options.map((option, index) => (
                  <button
                    key={`${option.network}-${option.asset}`}
                    type="button"
                    className={`co-chip ${selectedOptionIndex === index ? "is-active" : ""}`}
                    onClick={() => setSelectedOptionIndex(index)}
                  >
                    {option.asset} · {formatNetworkLabel(option.network)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="co-details">
              {/* Amount Field */}
              <div className="co-copy-line">
                <div className="co-copy-line__left">
                  <span className="co-copy-line__label">{text.amount}</span>
                  <div className="co-copy-line__val-row">
                    <span className="co-copy-line__value co-copy-line__value--amount">{bigAmount}</span>
                    <button
                      id="co-copy-amount"
                      type="button"
                      className={`co-copy-btn ${copiedField === "amount" ? "is-copied" : ""}`}
                      onClick={() => void copyValue("amount", bigAmount)}
                      title={text.copyAmount}
                    >
                      {copiedField === "amount" ? <Icons.Check /> : <Icons.Copy />}
                    </button>
                  </div>
                  <span className="co-copy-line__sub">{netLabel} {text.networkOnly}</span>
                </div>
              </div>

              {/* Comment Field (if required) */}
              {commentValue ? (
                <div className="co-copy-line">
                  <div className="co-copy-line__left">
                    <span className="co-copy-line__label">{text.payloadTitle}</span>
                    <div className="co-copy-line__val-row">
                      <span className="co-copy-line__value" style={{ fontWeight: 600 }}>{commentValue}</span>
                      <button
                        id="co-copy-comment"
                        type="button"
                        className={`co-copy-btn ${copiedField === "comment" ? "is-copied" : ""}`}
                        onClick={() => void copyValue("comment", commentValue)}
                        title={text.copyComment}
                      >
                        {copiedField === "comment" ? <Icons.Check /> : <Icons.Copy />}
                      </button>
                    </div>
                    <span className="co-copy-line__sub">{text.payloadHint}</span>
                  </div>
                </div>
              ) : null}

              {/* Wallet Address Field */}
              <div className="co-copy-line">
                <div className="co-copy-line__left">
                  <span className="co-copy-line__label">{text.wallet}</span>
                  <div className="co-copy-line__val-row">
                    <span className="co-copy-line__value co-address-desktop">{addressValue}</span>
                    <span className="co-copy-line__value co-address-mobile">{formatAddressTruncatedMobile(addressValue)}</span>
                    <button
                      id="co-copy-address"
                      type="button"
                      className={`co-copy-btn ${copiedField === "address" ? "is-copied" : ""}`}
                      onClick={() => void copyValue("address", addressValue)}
                      title={text.copyAddress}
                    >
                      {copiedField === "address" ? <Icons.Check /> : <Icons.Copy />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isUnderpaid ? (
              <div className="co-amount__note" style={{ borderTop: "none", marginTop: 0, paddingLeft: 0, paddingRight: 0 }}>
                <span>{text.underpaidReceived}: <b>{invoice.received_amount || "0"} {formatPaymentAssetLabel(invoice.payable_asset, invoice.payable_network)}</b></span>
                {remainingAmount ? <span>{text.underpaidRemaining}: <b>{remainingAmount} {formatPaymentAssetLabel(invoice.payable_asset, invoice.payable_network)}</b></span> : null}
              </div>
            ) : null}

            <div className="co-actions">
              <a
                id="co-btn-pay"
                href={activePayment?.payment_uri || fallbackPaymentURI(invoice)}
                className="co-btn co-btn--primary"
              >
                <Icons.Wallet />
                {text.payInWallet}
              </a>
            </div>

            <div className="co-qr">
              <div className="co-qr__frame">
                {qrDataUrl ? <img src={qrDataUrl} alt="Invoice QR" /> : <span className="co-qr__ph">{text.qrLoading}</span>}
              </div>
              <p className="co-qr__hint">{language === "ru" ? "Отсканируйте для быстрой оплаты" : "Scan for quick payment"}</p>
            </div>

            <div className="co-alert-bar">
              <span className="co-alert-bar__timer">
                <Icons.Clock />
                <span>{timeLeft}</span>
              </span>
              <span className="co-alert-bar__divider">·</span>
              <span className="co-alert-bar__text">{text.exactAmountWarning}</span>
            </div>
          </div>
        )}
      </section>

      {invoice ? (
        <footer className="co-foot">
          <a href="/">
            <span>{text.footerPoweredBy}</span>
            <strong>recv</strong>
          </a>
        </footer>
      ) : null}
    </main>
  );
}
