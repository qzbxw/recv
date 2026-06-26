import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice, trackPublicEvent } from "../lib/api";
import { calculateRemainingAmount, canCopyInvoicePaymentDetails, formatInvoiceStatus, formatNetworkLabel, formatPaymentAssetLabel, getInvoiceStatusMeta } from "../lib/status";
import type { Invoice, Network, PaymentAsset } from "../lib/types";
import { useUI } from "../lib/ui";
import { CHECKOUT_COPY as COPY } from "../i18n";
import { LanguageSelect } from "../components/LanguageSelect";
import { AssetLabel, CryptoLogo, NetworkLabel, type DisplayNetwork } from "../components/CryptoLogo";
import "../styles/checkout.css";

const BOT_URL = "https://t.me/recvmoney_bot";
const DEMO_PUBLIC_ID = "demo";
const WALLET_URI_SCHEMES = new Set(["ton", "ethereum", "solana", "tron"]);

type CheckoutPaymentDetails = Pick<Invoice, "payable_amount" | "payable_network" | "payable_asset" | "destination_address" | "payment_comment" | "payment_uri">;

function isWalletURI(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  const match = value.trim().match(/^([a-z][a-z0-9+.-]*):/i);
  return match ? WALLET_URI_SCHEMES.has(match[1].toLowerCase()) : false;
}

function fallbackPaymentURI(payment: CheckoutPaymentDetails) {
  if (payment.payable_network === "TON" && payment.payable_asset === "GRAM") {
    const amount = Math.round(Number(payment.payable_amount) * 1_000_000_000);
    const comment = payment.payment_comment ? `&text=${encodeURIComponent(payment.payment_comment)}` : "";
    return `ton://transfer/${payment.destination_address}?amount=${amount}${comment}`;
  }
  return "";
}

function paymentDetailsText(payment: CheckoutPaymentDetails, labels: { amount: string; wallet: string; network: string; comment: string }) {
  return [
    `${labels.amount}: ${payment.payable_amount}`,
    `${labels.network}: ${payment.payable_asset ? `${payment.payable_asset} ` : ""}${formatNetworkLabel(payment.payable_network)}`.trim(),
    `${labels.wallet}: ${payment.destination_address}`,
    payment.payment_comment ? `${labels.comment}: ${payment.payment_comment}` : "",
  ].filter(Boolean).join("\n");
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

function CheckoutAssetAmount({ amount, asset, network }: { amount: string; asset?: PaymentAsset; network: Network }) {
  const label = formatPaymentAssetLabel(asset, network);
  return (
    <span className="crypto-amount">
      <span>{amount}</span>
      <AssetLabel asset={label}>{label}</AssetLabel>
    </span>
  );
}

function CheckoutNetworkAsset({ asset, network, suffix = "" }: { asset?: PaymentAsset; network: Network; suffix?: string }) {
  const assetLabel = formatPaymentAssetLabel(asset, network);
  return (
    <span className="co-network-asset">
      <AssetLabel asset={assetLabel}>{assetLabel}</AssetLabel>
      <NetworkLabel network={network}>{formatNetworkLabel(network)}</NetworkLabel>
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
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
    payment_options: [
      { network: "TON_USDT", asset: "USDT", payable_amount: "149.000000", destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7", payment_comment: "RECV-DEMO-149", payment_uri: "", is_default: true },
      { network: "TON", asset: "GRAM", payable_amount: "1234.500000", destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7", payment_comment: "RECV-DEMO-149", payment_uri: "ton://transfer/UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7?amount=1234500000000&text=RECV-DEMO-149", is_default: false },
      { network: "TRON", asset: "USDT", payable_amount: "149.000000", destination_address: "TXDemoTRON4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1", payment_comment: null, payment_uri: "", is_default: false },
      { network: "SOLANA", asset: "USDT", payable_amount: "149.000000", destination_address: "DemoSoLana7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7", payment_comment: null, payment_uri: "", is_default: false },
      { network: "SOLANA", asset: "USDC", payable_amount: "149.000000", destination_address: "DemoSoLana7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7", payment_comment: null, payment_uri: "", is_default: false },
      { network: "BASE", asset: "USDT", payable_amount: "149.000000", destination_address: "0xDemoBase4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD", payment_comment: null, payment_uri: "", is_default: false },
      { network: "ARBITRUM", asset: "USDC", payable_amount: "149.000000", destination_address: "0xDemoArb4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD", payment_comment: null, payment_uri: "", is_default: false },
      { network: "BSC", asset: "BNB", payable_amount: "0.412000", destination_address: "0xDemoBSC4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD", payment_comment: null, payment_uri: "", is_default: false },
      { network: "BSC", asset: "USDT", payable_amount: "149.000000", destination_address: "0xDemoBSC4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD", payment_comment: null, payment_uri: "", is_default: false },
    ],
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
  ChevronDown: ({ className }: { className?: string }) => (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: "transform 0.2s ease", transform: className?.includes("is-flipped") ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
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
  const [copiedField, setCopiedField] = useState<"amount" | "address" | "comment" | "details" | "">("");
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [networkDropOpen, setNetworkDropOpen] = useState(false);
  const [assetDropOpen, setAssetDropOpen] = useState(false);
  const networkDropRef = useRef<HTMLDivElement>(null);
  const assetDropRef = useRef<HTMLDivElement>(null);
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
    const source = option
      ? (isWalletURI(option.payment_uri) ? option.payment_uri : paymentDetailsText({
          payable_amount: option.payable_amount,
          payable_network: option.network,
          payable_asset: option.asset,
          destination_address: option.destination_address,
          payment_comment: option.payment_comment,
          payment_uri: option.payment_uri,
        }, text))
      : (isWalletURI(invoice.payment_uri) ? invoice.payment_uri : paymentDetailsText(invoice, text));

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
          const fallback = await QRCode.toDataURL(paymentDetailsText(invoice, text), {
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
  }, [invoice, selectedOptionIndex, text]);

  useEffect(() => {
    if (!copiedField) {
      return;
    }
    const timeout = window.setTimeout(() => setCopiedField(""), 1400);
    return () => window.clearTimeout(timeout);
  }, [copiedField]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (networkDropRef.current && !networkDropRef.current.contains(e.target as Node)) {
        setNetworkDropOpen(false);
      }
      if (assetDropRef.current && !assetDropRef.current.contains(e.target as Node)) {
        setAssetDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

  // Cascade dropdown derived state
  // TON_USDT is a backend implementation detail — in the UI it's just TON + USDT asset.
  const paymentOptions = invoice?.payment_options ?? [];

  function getDisplayNetwork(network: string): string {
    return network === "TON_USDT" ? "TON" : network;
  }

  const uniqueNetworks = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const o of paymentOptions) {
      const display = getDisplayNetwork(o.network);
      if (!seen.has(display)) {
        seen.add(display);
        result.push(display);
      }
    }
    return result;
  }, [paymentOptions]);

  const selectedOption = invoice?.payment_options?.[selectedOptionIndex] ?? invoice?.payment_options?.[0] ?? null;
  const selectedDisplayNetwork = selectedOption ? getDisplayNetwork(selectedOption.network) as DisplayNetwork : null;
  const selectedAsset = selectedOption?.asset ?? null;

  // All assets available under the currently selected display-network
  const assetsForNetwork = useMemo(() => {
    if (!selectedDisplayNetwork) return [];
    const seen = new Set<string>();
    const result: string[] = [];
    for (const o of paymentOptions) {
      if (getDisplayNetwork(o.network) === selectedDisplayNetwork && !seen.has(o.asset)) {
        seen.add(o.asset);
        result.push(o.asset);
      }
    }
    return result;
  }, [paymentOptions, selectedDisplayNetwork]);

  function selectNetwork(displayNetwork: DisplayNetwork) {
    // Pick first option that matches the display network
    const idx = paymentOptions.findIndex(o => getDisplayNetwork(o.network) === displayNetwork);
    if (idx >= 0) setSelectedOptionIndex(idx);
    setNetworkDropOpen(false);
    setAssetDropOpen(false);
  }

  function selectAsset(asset: PaymentAsset) {
    // Match by display-network + asset (handles TON/TON_USDT transparently)
    const idx = paymentOptions.findIndex(
      o => getDisplayNetwork(o.network) === selectedDisplayNetwork && o.asset === asset
    );
    if (idx >= 0) setSelectedOptionIndex(idx);
    setAssetDropOpen(false);
  }



  const title = invoice?.title?.trim() || text.paymentRequest;
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

  async function copyPaymentDetails(payment: CheckoutPaymentDetails) {
    try {
      await navigator.clipboard.writeText(paymentDetailsText(payment, text));
      setCopiedField("details");
    } catch {
      setError(language === "ru" ? "Не удалось скопировать реквизиты. Скопируйте значения вручную." : "Could not copy payment details. Copy the values manually.");
    }
  }

  const statusTone = invoice ? getInvoiceStatusMeta(invoice.status).tone : "neutral";
  const bigAmount = activePayment?.payable_amount || invoice?.payable_amount || "";
  const addressValue = activePayment?.destination_address || invoice?.destination_address || "";
  const commentValue = activePayment?.payment_comment || invoice?.payment_comment || "";
  const walletURI = activePayment ? (isWalletURI(activePayment.payment_uri) ? activePayment.payment_uri : fallbackPaymentURI(activePayment)) : "";
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
        <LanguageSelect value={language} onChange={setLanguage} ariaLabel="language" compact className="co-lang" />
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
                <strong>{text.underpaidReceived}: <CheckoutAssetAmount amount={invoice.received_amount || "0"} asset={invoice.payable_asset} network={invoice.payable_network} /></strong>
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

            {paymentOptions.length > 1 ? (
              <div className="co-options co-options--dropdowns">
                {/* Network Dropdown */}
                <div className="co-drop-wrap" ref={networkDropRef}>
                  <button
                    id="co-drop-network"
                    type="button"
                    className={`co-drop-btn ${networkDropOpen ? "is-open" : ""}`}
                    onClick={() => { setNetworkDropOpen(o => !o); setAssetDropOpen(false); }}
                    aria-haspopup="listbox"
                    aria-expanded={networkDropOpen}
                  >
                    <span className="co-drop-btn__label">{text.network}</span>
                    <span className="co-drop-btn__value">
                      {selectedDisplayNetwork ? (
                        <span className="co-drop-btn__choice">
                          <CryptoLogo type="network" value={selectedDisplayNetwork} />
                          {formatNetworkLabel(selectedDisplayNetwork)}
                        </span>
                      ) : text.selectNetwork}
                    </span>
                    <Icons.ChevronDown className={networkDropOpen ? "is-flipped" : ""} />
                  </button>
                  {networkDropOpen && (
                    <ul className="co-drop-menu" role="listbox">
                      {uniqueNetworks.map(net => (
                        <li
                          key={net}
                          role="option"
                          aria-selected={net === selectedDisplayNetwork}
                          className={`co-drop-item ${net === selectedDisplayNetwork ? "is-selected" : ""}`}
                          onClick={() => selectNetwork(net as DisplayNetwork)}
                        >
                          <span className="co-drop-item__main">
                            <CryptoLogo type="network" value={net as DisplayNetwork} />
                            {formatNetworkLabel(net as Network)}
                          </span>
                          {net === selectedDisplayNetwork && <Icons.Check />}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Asset Dropdown — only when network has multiple assets */}
                {assetsForNetwork.length > 1 && (
                  <div className="co-drop-wrap" ref={assetDropRef}>
                    <button
                      id="co-drop-asset"
                      type="button"
                      className={`co-drop-btn ${assetDropOpen ? "is-open" : ""}`}
                      onClick={() => { setAssetDropOpen(o => !o); setNetworkDropOpen(false); }}
                      aria-haspopup="listbox"
                      aria-expanded={assetDropOpen}
                    >
                      <span className="co-drop-btn__label">{text.selectAsset}</span>
                      <span className="co-drop-btn__value">
                        {selectedAsset ? (
                          <span className="co-drop-btn__choice">
                            <CryptoLogo type="asset" value={selectedAsset} />
                            {selectedAsset}
                          </span>
                        ) : text.selectAsset}
                      </span>
                      <Icons.ChevronDown className={assetDropOpen ? "is-flipped" : ""} />
                    </button>
                    {assetDropOpen && (
                      <ul className="co-drop-menu" role="listbox">
                        {assetsForNetwork.map(asset => (
                          <li
                            key={asset}
                            role="option"
                            aria-selected={asset === selectedAsset}
                            className={`co-drop-item ${asset === selectedAsset ? "is-selected" : ""}`}
                            onClick={() => selectAsset(asset as PaymentAsset)}
                          >
                            <span className="co-drop-item__main">
                              <CryptoLogo type="asset" value={asset as PaymentAsset} />
                              {asset}
                            </span>
                            {asset === selectedAsset && <Icons.Check />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
                  <span className="co-copy-line__sub">
                    <CheckoutNetworkAsset asset={activePayment?.payable_asset || invoice.payable_asset} network={activePayment?.payable_network || invoice.payable_network} suffix={text.networkOnly} />
                  </span>
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
                <span>{text.underpaidReceived}: <b><CheckoutAssetAmount amount={invoice.received_amount || "0"} asset={invoice.payable_asset} network={invoice.payable_network} /></b></span>
                {remainingAmount ? <span>{text.underpaidRemaining}: <b><CheckoutAssetAmount amount={remainingAmount} asset={invoice.payable_asset} network={invoice.payable_network} /></b></span> : null}
              </div>
            ) : null}

            <div className="co-actions">
              {walletURI ? (
                <a
                  id="co-btn-pay"
                  href={walletURI}
                  className="co-btn co-btn--primary"
                >
                  <Icons.Wallet />
                  {text.payInWallet}
                </a>
              ) : (
                <button
                  id="co-btn-pay"
                  type="button"
                  className={`co-btn co-btn--primary ${copiedField === "details" ? "is-copied" : ""}`}
                  onClick={() => activePayment && void copyPaymentDetails(activePayment)}
                >
                  {copiedField === "details" ? <Icons.Check /> : <Icons.Wallet />}
                  {copiedField === "details" ? text.copied : text.copyPaymentDetails}
                </button>
              )}
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

      {invoice?.kind === "subscription" && (
        <div className="co-help">
          <a href="https://t.me/recvmoneysupport" target="_blank" rel="noopener noreferrer" className="co-help__link">
            {text.needHelp}
          </a>
        </div>
      )}

      {invoice ? (
        <footer className={`co-foot ${invoice.kind === "subscription" ? "co-foot--with-help" : ""}`}>
          <a href="/">
            <span>{text.footerVerifiedBy}</span>
            <strong>recv</strong>
          </a>
        </footer>
      ) : null}
    </main>
  );
}
