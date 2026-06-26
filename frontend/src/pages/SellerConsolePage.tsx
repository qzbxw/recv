import React, { FormEvent, Fragment, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { CustomSelect } from "../components/CustomSelect";
import { AssetLabel, CryptoLogo, NetworkLabel } from "../components/CryptoLogo";
import { LanguageSelect } from "../components/LanguageSelect";
import { MultiSelect } from "../components/MultiSelect";
import {
  cancelInvoice,
  clearStoredToken,
  createAPIKey,
  createBillingCheckout,
  redeemPromoCode,
  createInvoice,
  createWallet,
  createWebhookEndpoint,
  deleteAPIKey,
  deleteWallet,
  deleteWebhookEndpoint,
  fetchAPIKeys,
  fetchDeveloperUsage,
  fetchInvoices,
  fetchMe,
  fetchTeam,
  fetchWallets,
  fetchWebhookDeliveries,
  fetchWebhookEndpoints,
  getApiBase,
  getStoredToken,
  inviteTeamMember,
  listAuthIdentities,
  logoutAuth,
  markInvoicePaid,
  removeTeamMember,
  refreshAuth,
  resendWebhookDelivery,
  revokeTeamInvite,
  rotateWebhookEndpointSecret,
  setStoredToken,
  startAuthIdentityLink,
  switchWorkspace,
  updateContactEmail,
  updateLanguage,
  updateTeamMemberRole,
} from "../lib/api";
import { ApiError, formatApiError } from "../lib/errors";
import { buildAuthHref, buildCheckoutPath, buildCheckoutUrl } from "../lib/routing";
import { formatInvoiceStatus, getInvoiceStatusMeta, getInvoiceStatusTooltip, formatNetworkLabel, formatPaymentAssetLabel } from "../lib/status";
import { PAYABLE_PAYMENT_OPTIONS, walletBucket } from "../lib/paymentOptions";
import type { APIKey, AuthIdentity, DeveloperUsageResponse, Invoice, InvoiceStatus, MeResponse, MemberRole, Network, PaymentAsset, TeamResponse, Wallet, WebhookDelivery, WebhookEndpoint, Environment } from "../lib/types";
import { useUI } from "../lib/ui";
import { SELLER_CONSOLE_COPY as COPY, type Language } from "../i18n";

const BOT_URL = "https://t.me/recvmoney_bot";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .38.03.55.17.14.11.18.27.2.42-.01.06 0 .13-.01.2z" />
    </svg>
  );
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

type SessionState = {
  token: string;
  me: MeResponse;
  wallets: Wallet[];
  invoices: Invoice[];
  invoiceTotal: number;
  invoicePage: number;
  invoicePageSize: number;
  apiKeys: APIKey[];
  webhooks: WebhookEndpoint[];
  authIdentities: AuthIdentity[];
};

type PanelKey = "overview" | "wallets" | "invoices" | "create" | "developer" | "billing" | "settings" | "team";

const WALLET_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "SOLANA", label: "Solana" },
  { value: "TRON", label: "TRON" },
  { value: "EVM", label: "Base/BSC wallet (EVM)" },
];

function LiveValue({ value }: { value: string | number }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(true);
    const t = setTimeout(() => setAnimate(false), 600);
    return () => clearTimeout(t);
  }, [value]);
  return <span className={animate ? "live-value is-updating" : "live-value"}>{value}</span>;
}

const STATUS_TONE_CLASS: Record<string, string> = {
  neutral: "neutral",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "danger",
  review: "review",
};

function statusToneClass(status: InvoiceStatus) {
  return STATUS_TONE_CLASS[getInvoiceStatusMeta(status).tone] ?? "neutral";
}

const AMOUNT_PRESETS = ["10.00", "25.00", "50.00", "100.00", "250.00"];

const PLAN_COMPARE_ORDER = ["merchant", "developer", "business"] as const;

function QrImage({ value, alt }: { value: string; alt: string }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    if (!value) { setSrc(""); return; }
    void QRCode.toDataURL(value, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#050505", light: "#ffffff" },
    }).then(url => { if (active) setSrc(url); }).catch(() => { if (active) setSrc(""); });
    return () => { active = false; };
  }, [value]);
  if (!src) return <div className="dev-qr dev-qr--loading" aria-hidden="true" />;
  return <img className="dev-qr" src={src} alt={alt} />;
}

function UsageBar({ label, value, limit, suffix }: { label: string; value: number; limit: number; suffix?: string }) {
  const safeLimit = limit > 0 ? limit : 0;
  const pct = safeLimit > 0 ? Math.min(100, Math.round((value / safeLimit) * 100)) : 0;
  const tone = pct >= 90 ? "danger" : pct >= 70 ? "warning" : "ok";
  return (
    <div className="dev-usage-row">
      <div className="dev-usage-row__head">
        <span className="dev-usage-row__label">{label}</span>
        <span className="dev-usage-row__value">
          {value.toLocaleString()} / {safeLimit > 0 ? safeLimit.toLocaleString() : "∞"}{suffix ? ` ${suffix}` : ""}
        </span>
      </div>
      <div className="dev-usage-bar">
        <div className={`dev-usage-fill dev-usage-fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function formatPlanLimit(value: number | null | undefined, fallback = "∞") {
  if (value === 0) return "0";
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value.toLocaleString()
    : fallback;
}

const PANEL_ICONS: Record<PanelKey | "logout", React.ReactNode> = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>,
  wallets: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="17" cy="15" r="1" /></svg>,
  invoices: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.5" x2="16.5" y2="9.501" /><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="10" y1="9" x2="10" y2="9.01" /></svg>,
  create: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  developer: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>,
  team: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  billing: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
};

const MOCK_INVOICES: Invoice[] = [
  {
    id: 101,
    public_id: "RECV-2026-001",
    kind: "merchant",
    title: "SaaS Premium Subscription",
    base_amount_usd: "49.00",
    payable_amount: "49.00",
    payable_network: "TON",
    payable_asset: "USDT",
    destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7",
    payment_comment: "RECV-2026-001",
    status: "paid",
    environment: "live",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date().toISOString(),
    tx_hash: "tx_ton_mock_1111111111111111111111111111111111111111111111111111111111111111",
    received_amount: "49.00",
    review_reason: null,
    finalized_at: new Date().toISOString(),
    checkout_url: "/app/checkout/RECV-2026-001",
    payment_uri: "ton://transfer/UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7?amount=49000000000&text=RECV-2026-001"
  },
  {
    id: 102,
    public_id: "RECV-2026-002",
    kind: "merchant",
    title: "E-commerce Payment #1054",
    base_amount_usd: "125.50",
    payable_amount: "125.50",
    payable_network: "ARBITRUM",
    payable_asset: "USDC",
    destination_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    payment_comment: "RECV-2026-002",
    status: "paid",
    environment: "live",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    tx_hash: "0x3333333333333333333333333333333333333333333333333333333333333333",
    received_amount: "125.50",
    review_reason: null,
    finalized_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    checkout_url: "/app/checkout/RECV-2026-002",
    payment_uri: "ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e?value=0"
  },
  {
    id: 103,
    public_id: "RECV-2026-003",
    kind: "merchant",
    title: "Consulting Fee",
    base_amount_usd: "1500.00",
    payable_amount: "1500.00",
    payable_network: "TRON",
    payable_asset: "USDT",
    destination_address: "TXDemoAddressTRON1111111111111111",
    payment_comment: "RECV-2026-003",
    status: "awaiting_payment",
    environment: "live",
    expires_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    tx_hash: null,
    received_amount: "0.00",
    review_reason: null,
    finalized_at: null,
    checkout_url: "/app/checkout/RECV-2026-003",
    payment_uri: "tron:TXDemoAddressTRON1111111111111111?amount=1500000000"
  },
  {
    id: 104,
    public_id: "RECV-2026-004",
    kind: "merchant",
    title: "Digital Art Asset #99",
    base_amount_usd: "350.00",
    payable_amount: "140.00",
    payable_network: "TON",
    payable_asset: "GRAM",
    destination_address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7",
    payment_comment: "RECV-2026-004",
    status: "expired",
    environment: "live",
    expires_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    tx_hash: null,
    received_amount: "0.00",
    review_reason: null,
    finalized_at: null,
    checkout_url: "/app/checkout/RECV-2026-004",
    payment_uri: "ton://transfer/..."
  },
  {
    id: 105,
    public_id: "RECV-2026-005",
    kind: "merchant",
    title: "Custom Integration Work",
    base_amount_usd: "2500.00",
    payable_amount: "2500.00",
    payable_network: "BASE",
    payable_asset: "USDC",
    destination_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    payment_comment: "RECV-2026-005",
    status: "manual_review",
    environment: "live",
    expires_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    tx_hash: "0x5555555555555555555555555555555555555555555555555555555555555555",
    received_amount: "2499.00",
    review_reason: "underpaid",
    finalized_at: null,
    checkout_url: "/app/checkout/RECV-2026-005",
    payment_uri: "ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e?value=0"
  },
  {
    id: 106,
    public_id: "RECV-2026-006",
    kind: "merchant",
    title: "API Starter Monthly Plan",
    base_amount_usd: "29.00",
    payable_amount: "29.00",
    payable_network: "BSC",
    payable_asset: "USDT",
    destination_address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    payment_comment: "RECV-2026-006",
    status: "paid",
    environment: "live",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    tx_hash: "0x6666666666666666666666666666666666666666666666666666666666666666",
    received_amount: "29.00",
    review_reason: null,
    finalized_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    checkout_url: "/app/checkout/RECV-2026-006",
    payment_uri: "ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e?value=0"
  },
  {
    id: 107,
    public_id: "RECV-2026-007",
    kind: "merchant",
    title: "Merch Store Order #441",
    base_amount_usd: "85.00",
    payable_amount: "85.00",
    payable_network: "SOLANA",
    payable_asset: "USDC",
    destination_address: "So11111111111111111111111111111111111111112",
    payment_comment: null,
    status: "paid",
    environment: "live",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    tx_hash: "sol_tx_hash_mock_7777777777777777777777777777777777777777777777777777777",
    received_amount: "85.00",
    review_reason: null,
    finalized_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    checkout_url: "/app/checkout/RECV-2026-007",
    payment_uri: "solana:So11111111111111111111111111111111111111112"
  }
];

const MOCK_WALLETS: Wallet[] = [
  {
    id: 1,
    workspace_id: 1,
    network: "TON",
    address: "UQDemo4A7m9f6jK2x8mP3sL0qW8rT2nV5yH1cD6pQ9zX4aB7",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    environment: "live"
  },
  {
    id: 2,
    workspace_id: 1,
    network: "ARBITRUM",
    address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    environment: "live"
  },
  {
    id: 3,
    workspace_id: 1,
    network: "TRON",
    address: "TXDemoAddressTRON1111111111111111",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    environment: "live"
  }
];

const MOCK_KEYS: APIKey[] = [
  {
    id: 1,
    workspace_id: 1,
    label: "Production Backend Key",
    prefix: "recv_live_8f7b...3a",
    environment: "live",
    scopes: ["invoices:read", "invoices:write"],
    last_used_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 2,
    workspace_id: 1,
    label: "Staging Testing Key",
    prefix: "recv_test_e3b1...9c",
    environment: "test",
    scopes: ["invoices:read", "invoices:write"],
    last_used_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
  }
];

const MOCK_HOOKS: WebhookEndpoint[] = [
  {
    id: 1,
    workspace_id: 1,
    label: "Production Server Webhook",
    url: "https://api.merchant.com/v1/recv-payments",
    environment: "live",
    is_active: true,
    last_delivery_at: new Date().toISOString(),
    last_success_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
    secret: "whsec_ProdSecret1234567890abcdef"
  },
  {
    id: 2,
    workspace_id: 1,
    label: "Staging Test Webhook",
    url: "https://staging.merchant.com/v1/recv-payments",
    environment: "test",
    is_active: true,
    last_delivery_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    last_success_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    secret: "whsec_TestSecret1234567890abcdef"
  }
];

const MOCK_DELIVERIES: WebhookDelivery[] = [
  {
    id: 1,
    event_id: "evt_1111111111111111",
    endpoint_id: 1,
    workspace_id: 1,
    event_type: "invoice.paid",
    payload: { id: 101, public_id: "RECV-2026-001", status: "paid" },
    status: "delivered",
    environment: "live",
    attempts: 1,
    max_attempts: 5,
    last_http_status: 200,
    last_error: null,
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString()
  },
  {
    id: 2,
    event_id: "evt_2222222222222222",
    endpoint_id: 1,
    workspace_id: 1,
    event_type: "invoice.created",
    payload: { id: 103, public_id: "RECV-2026-003", status: "awaiting_payment" },
    status: "delivered",
    environment: "live",
    attempts: 1,
    max_attempts: 5,
    last_http_status: 200,
    last_error: null,
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString()
  },
  {
    id: 3,
    event_id: "evt_3333333333333333",
    endpoint_id: 2,
    workspace_id: 1,
    event_type: "invoice.paid",
    payload: { id: 102, public_id: "RECV-2026-002", status: "paid" },
    status: "delivered",
    environment: "test",
    attempts: 1,
    max_attempts: 5,
    last_http_status: 200,
    last_error: null,
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString()
  },
  {
    id: 4,
    event_id: "evt_4444444444444444",
    endpoint_id: 1,
    workspace_id: 1,
    event_type: "invoice.payment_failed",
    payload: { id: 104, public_id: "RECV-2026-004", status: "expired" },
    status: "failed",
    environment: "live",
    attempts: 5,
    max_attempts: 5,
    last_http_status: 502,
    last_error: "Bad Gateway",
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString()
  }
];

const MOCK_TEAM: TeamResponse = {
  my_role: "owner",
  members: [
    {
      user_id: 1,
      telegram_id: 12345,
      username: "demo_owner",
      email: "owner@example.com",
      role: "owner",
      joined_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      user_id: 2,
      telegram_id: 67890,
      username: "alex_dev",
      email: "alex@example.com",
      role: "admin",
      joined_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      user_id: 3,
      telegram_id: 11223,
      username: "maria_support",
      email: "maria@example.com",
      role: "member",
      joined_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ],
  invites: [
    {
      id: 1,
      workspace_id: 1,
      invited_username: "serge_marketing",
      role: "member",
      status: "pending",
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ]
};

function validateWalletAddress(network: Network, address: string): boolean {
  const trimmed = address.trim();
  if (!trimmed) return true;
  switch (network) {
    case "TON": {
      const friendlyRegex = /^[EQ|UQ|kQ|0Q][a-zA-Z0-9_\-\+\/]{47}$/;
      const rawRegex = /^-?[0-9]+:[a-fA-F0-9]{64}$/;
      return friendlyRegex.test(trimmed) || rawRegex.test(trimmed);
    }
    case "SOLANA": {
      const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      return solanaRegex.test(trimmed);
    }
    case "TRON": {
      const tronRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
      return tronRegex.test(trimmed);
    }
    case "EVM": {
      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      return evmRegex.test(trimmed);
    }
    default:
      return true;
  }
}

function renderAssetPill(coin: string) {
  return (
    <span key={coin} className="payout-asset-pill">
      <CryptoLogo type="asset" value={coin} />
      {coin}
    </span>
  );
}

function NetworkPill({ network, className = "" }: { network: Network | string; className?: string }) {
  return (
    <span className={`dev-api-badge dev-api-badge--secondary ${className}`.trim()}>
      <NetworkLabel network={network}>{formatNetworkLabel(network as Network)}</NetworkLabel>
    </span>
  );
}

function AssetAmount({ amount, asset, network, className = "" }: { amount: string; asset?: string; network: Network; className?: string }) {
  const label = formatPaymentAssetLabel(asset as PaymentAsset | undefined, network);
  return (
    <span className={`crypto-amount ${className}`.trim()}>
      <span>{amount}</span>
      <AssetLabel asset={label}>{label}</AssetLabel>
    </span>
  );
}

function PaymentOptionLogos({ network, asset }: { network: Network | string; asset: PaymentAsset | string }) {
  return (
    <span className="crypto-pair-logos" aria-hidden="true">
      <CryptoLogo type="network" value={network} />
      <CryptoLogo type="asset" value={asset} />
    </span>
  );
}

export function SellerConsolePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage } = useUI();
  const t = COPY[language];
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelKey>("overview");
  const [copiedId, setCopiedId] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [environment, setEnvironment] = useState<Environment>("live");
  const [showDemoData, setShowDemoData] = useState(import.meta.env.DEV);

  // Form States
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [editingNetwork, setEditingNetwork] = useState<Record<string, boolean>>({});
  const [networkInputs, setNetworkInputs] = useState<Record<string, string>>({});
  const [isSavingNetwork, setIsSavingNetwork] = useState<Record<string, boolean>>({});
  const [networkErrors, setNetworkErrors] = useState<Record<string, string>>({});
  const [invoiceForm, setInvoiceForm] = useState({ title: "Product/Service", amount: "10.00", network: "TON" as Network, ttl: 30, optionKeys: ["TON:GRAM"] });
  const [keyForm, setKeyForm] = useState({ label: "" });
  const [hookForm, setHookForm] = useState({ label: "", url: "" });
  const [latestKeySecret, setLatestKeySecret] = useState("");
  const [latestWebhookSecret, setLatestWebhookSecret] = useState("");
  const [billingForm, setBillingForm] = useState<{ plan: string; network: Network; optionKeys: string[]; subscriptionDays: number }>({ plan: "merchant", network: "TRON", optionKeys: ["TRON:USDT"], subscriptionDays: 30 });
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [recentCreated, setRecentCreated] = useState<Invoice[]>([]);
  const [invoiceFilters, setInvoiceFilters] = useState({ page: 1, pageSize: 50, status: "all", query: "" });
  const [searchVal, setSearchVal] = useState("");

  // Debounce search query to avoid spamming the network on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoiceFilters(current => {
        if (current.query === searchVal) return current;
        return { ...current, page: 1, query: searchVal };
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // Keep searchVal in sync with external updates to invoiceFilters.query
  useEffect(() => {
    setSearchVal(invoiceFilters.query);
  }, [invoiceFilters.query]);

  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | null>(null);

  // Developer panel extras
  const [devUsage, setDevUsage] = useState<DeveloperUsageResponse | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Team state
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [inviteForm, setInviteForm] = useState<{ username: string; role: MemberRole }>({ username: "", role: "member" });
  const [invitingMember, setInvitingMember] = useState(false);
  const [teamNotice, setTeamNotice] = useState("");
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [promoNotice, setPromoNotice] = useState("");
  const [promoError, setPromoError] = useState("");
  const [linkingProvider, setLinkingProvider] = useState<"google" | "github" | "">("");

  useEffect(() => {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();
  }, []);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const oauthToken = hashParams.get("oauth_token");
    if (oauthToken) {
      setStoredToken(oauthToken);
      window.history.replaceState(null, "", location.pathname + location.search);
      setActivePanel("settings");
      void loadSession(oauthToken);
      return;
    }
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("oauth") === "success") {
      setLoading(true);
      refreshAuth()
        .then((result) => {
          const nextToken = result.token || result.access_token || "";
          if (!nextToken) throw new Error("OAuth session refresh failed");
          setStoredToken(nextToken);
          window.history.replaceState(null, "", location.pathname);
          setActivePanel("settings");
          void loadSession(nextToken);
        })
        .catch((err) => {
          clearStoredToken();
          setError(formatApiError(err));
          setLoading(false);
        });
      return;
    }
    const token = getStoredToken();
    if (!token) { setLoading(false); return; }
    void loadSession(token);
  }, []);

  useEffect(() => {
    if (!session?.token) return;
    const interval = setInterval(() => void loadSession(session.token, { silent: true }), 20000);
    return () => clearInterval(interval);
  }, [session?.token]);

  useEffect(() => {
    if (!session || session.wallets.length === 0) return;
    const currentBucket = walletBucket(invoiceForm.network);
    if (session.wallets.some(wallet => wallet.is_active && wallet.network === currentBucket)) return;
    const firstWallet = session.wallets.find(wallet => wallet.is_active);
    if (firstWallet) {
      setInvoiceForm(current => ({ ...current, network: firstWallet.network }));
    }
  }, [invoiceForm.network, session]);

  async function loadSession(token: string, options?: { silent?: boolean }) {
    try {
      if (!options?.silent) setLoading(true);
      const [me, wallets, invoices, keys, hooks, identities] = await Promise.all([
        fetchMe(token),
        fetchWallets(token),
        fetchInvoices(token, {
          page: invoiceFilters.page,
          page_size: invoiceFilters.pageSize,
          status: invoiceFilters.status,
          query: invoiceFilters.query,
        }),
        fetchAPIKeys(token).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(token).catch(() => ({ items: [] })),
        listAuthIdentities(token).catch(() => ({ identities: [] })),
      ]);
      setSession({
        token,
        me,
        wallets: wallets.items ?? [],
        invoices: invoices.items ?? [],
        invoiceTotal: invoices.total ?? (invoices.items ?? []).length,
        invoicePage: invoices.page ?? invoiceFilters.page,
        invoicePageSize: invoices.page_size ?? invoiceFilters.pageSize,
        apiKeys: keys.items ?? [],
        webhooks: hooks.items ?? [],
        authIdentities: identities.identities ?? [],
      });
      setEmailForm(me.workspace.email || "");
      if (me.workspace.language && me.workspace.language !== language) {
        setLanguage(me.workspace.language);
      }
    } catch (err) {
      if (!options?.silent) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          clearStoredToken();
          navigate(buildAuthHref(location.pathname), { replace: true });
          return;
        }
        setError(formatApiError(err));
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!session?.token) return;
    void loadSession(session.token, { silent: true });
  }, [invoiceFilters.page, invoiceFilters.pageSize, invoiceFilters.status, invoiceFilters.query]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearStoredToken();
      navigate(buildAuthHref(location.pathname), { replace: true });
    };
    window.addEventListener("recv_seller_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("recv_seller_unauthorized", handleUnauthorized);
  }, [navigate, location.pathname]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleLogout = () => {
    void logoutAuth().catch(() => undefined);
    clearStoredToken();
    navigate("/auth", { replace: true });
  };

  // Team actions
  async function loadTeam() {
    if (!session) return;
    try {
      const data = await fetchTeam(session.token);
      setTeam(data);
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onInviteMember(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    const username = inviteForm.username.trim().replace(/^@+/, "");
    if (!username) return;
    setInvitingMember(true);
    setTeamNotice("");
    try {
      await inviteTeamMember(session.token, { username, role: inviteForm.role });
      setInviteForm({ username: "", role: "member" });
      setTeamNotice(t.team.inviteSent);
      await loadTeam();
    } catch (err) { setError(formatApiError(err)); }
    finally { setInvitingMember(false); }
  }

  async function onRevokeInvite(id: number) {
    if (!session) return;
    try { await revokeTeamInvite(session.token, id); await loadTeam(); }
    catch (err) { setError(formatApiError(err)); }
  }

  async function onChangeMemberRole(userId: number, role: MemberRole) {
    if (!session) return;
    try { await updateTeamMemberRole(session.token, userId, role); await loadTeam(); }
    catch (err) { setError(formatApiError(err)); }
  }

  async function onRemoveMember(userId: number, isSelf: boolean) {
    if (!session) return;
    if (!window.confirm(isSelf ? t.team.confirmLeave : t.team.confirmRemove)) return;
    try {
      await removeTeamMember(session.token, userId);
      if (isSelf) { handleLogout(); return; }
      await loadTeam();
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onSwitchWorkspace(workspaceId: number) {
    if (!session || switchingWorkspace || workspaceId === session.me.workspace.id) return;
    setSwitchingWorkspace(true);
    try {
      const res = await switchWorkspace(session.token, workspaceId);
      setStoredToken(res.token);
      setTeam(null);
      await loadSession(res.token);
    } catch (err) { setError(formatApiError(err)); }
    finally { setSwitchingWorkspace(false); }
  }

  useEffect(() => {
    if (activePanel === "team" && session?.token) {
      setTeamNotice("");
      void loadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, session?.token]);

  async function loadDeveloperData(token: string) {
    const [usage, deliv] = await Promise.all([
      fetchDeveloperUsage(token).catch(() => null),
      fetchWebhookDeliveries(token).catch(() => ({ items: [] as WebhookDelivery[] })),
    ]);
    setDevUsage(usage);
    setDeliveries(deliv.items ?? []);
  }

  useEffect(() => {
    const hasApi = session?.me.plan.has_api || environment === 'test' || import.meta.env.DEV;
    if (activePanel === "developer" && session?.token && hasApi) {
      void loadDeveloperData(session.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, session?.token, environment]);

  async function onResendDelivery(id: number) {
    if (!session) return;
    setResendingId(id);
    try {
      await resendWebhookDelivery(session.token, id);
      await loadDeveloperData(session.token);
    } catch (err) { setError(formatApiError(err)); }
    finally { setResendingId(null); }
  }

  async function onRotateHook(id: number) {
    if (!session) return;
    try {
      const res = await rotateWebhookEndpointSecret(session.token, id);
      setLatestWebhookSecret(res.webhook.secret);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  // Actions
  async function onAddWallet(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      await createWallet(session.token, { ...walletForm, environment });
      setWalletForm({ network: "TON", address: "" });
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onDeleteWallet(id: number) {
    if (!session) return;
    try {
      await deleteWallet(session.token, id);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onSaveWalletInline(network: Network, oldId: number | null, address: string) {
    if (!session) return;
    if (!address.trim()) {
      setNetworkErrors(c => ({ ...c, [network]: "Address is required" }));
      return;
    }
    setNetworkErrors(c => ({ ...c, [network]: "" }));
    setIsSavingNetwork(c => ({ ...c, [network]: true }));
    try {
      if (oldId !== null) {
        await deleteWallet(session.token, oldId);
      }
      await createWallet(session.token, { network, address: address.trim(), environment });
      setNetworkInputs(c => ({ ...c, [network]: "" }));
      setEditingNetwork(c => ({ ...c, [network]: false }));
      void loadSession(session.token, { silent: true });
    } catch (err) {
      setNetworkErrors(c => ({ ...c, [network]: formatApiError(err) }));
    } finally {
      setIsSavingNetwork(c => ({ ...c, [network]: false }));
    }
  }

  async function onDeleteWalletInline(network: Network, id: number) {
    if (!session) return;
    setNetworkErrors(c => ({ ...c, [network]: "" }));
    setIsSavingNetwork(c => ({ ...c, [network]: true }));
    try {
      await deleteWallet(session.token, id);
      void loadSession(session.token, { silent: true });
    } catch (err) {
      setNetworkErrors(c => ({ ...c, [network]: formatApiError(err) }));
    } finally {
      setIsSavingNetwork(c => ({ ...c, [network]: false }));
    }
  }

  async function onCreateInvoice(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (isCreatingInvoice) return;
    setIsCreatingInvoice(true);
    setCreatedInvoice(null);
    try {
      if (activeWalletsCount === 0) {
        // Auto-create dummy wallets for selected network options
        const selectedOptions = invoiceForm.optionKeys
          .map(key => PAYABLE_PAYMENT_OPTIONS.find(option => option.key === key))
          .filter(Boolean);
        const bucketsToCreate = new Set(selectedOptions.map(opt => walletBucket(opt!.network)));
        
        for (const bucket of Array.from(bucketsToCreate)) {
          let address = "";
          if (bucket === "TON") {
            address = "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn";
          } else if (bucket === "EVM") {
            address = "0x0000000000000000000000000000000000000000";
          } else if (bucket === "TRON") {
            address = "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb";
          } else if (bucket === "SOLANA") {
            address = "HN7cABViJeKaQRXmgUeJZr1H2dCxsf2A6Dks4K624zY1";
          }
          if (address) {
            await createWallet(session.token, { network: bucket, address, environment });
          }
        }
        await loadSession(session.token, { silent: true });
      }

      const invoice = await createInvoice(session.token, {
        title: invoiceForm.title,
        base_amount_usd: invoiceForm.amount,
        payable_network: invoiceForm.network,
        payment_options: invoiceForm.optionKeys
          .map(key => PAYABLE_PAYMENT_OPTIONS.find(option => option.key === key))
          .filter(Boolean)
          .map(option => ({ network: option!.network, asset: option!.asset })),
        expires_in_minutes: invoiceForm.ttl,
        environment,
      });
      setCreatedInvoice(invoice);
      setRecentCreated(prev => [invoice, ...prev.filter(i => i.id !== invoice.id)].slice(0, 5));
      await loadSession(session.token, { silent: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setIsCreatingInvoice(false);
    }
  }

  async function onInvoiceAction(id: number, action: "cancel" | "mark_paid") {
    if (!session) return;
    try {
      if (action === "mark_paid") await markInvoicePaid(session.token, id);
      else await cancelInvoice(session.token, id);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onCreateKey(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await createAPIKey(session.token, { label: keyForm.label, scopes: ["invoices:read", "invoices:write"], environment });
      setLatestKeySecret(res.secret);
      setKeyForm({ label: "" });
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onDeleteKey(id: number) {
    if (!session) return;
    try {
      await deleteAPIKey(session.token, id);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onCreateHook(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      const res = await createWebhookEndpoint(session.token, { ...hookForm, environment });
      setLatestWebhookSecret(res.webhook.secret);
      setHookForm({ label: "", url: "" });
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onDeleteHook(id: number) {
    if (!session) return;
    try {
      await deleteWebhookEndpoint(session.token, id);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onUpdateEmail(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    try {
      await updateContactEmail(session.token, { email: emailForm });
      setEmailNotice(t.settings.emailSaved);
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onSetLanguage(next: Language) {
    setLanguage(next);
    if (!session) return;
    try {
      await updateLanguage(session.token, { language: next });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onLinkProvider(provider: "google" | "github") {
    if (!session) return;
    try {
      setLinkingProvider(provider);
      const result = await startAuthIdentityLink(session.token, provider, { redirect_path: "/console" });
      window.location.href = result.url;
    } catch (err) {
      setLinkingProvider("");
      setError(formatApiError(err));
    }
  }

  async function onUpgrade() {
    if (!session) return;
    if (billingForm.subscriptionDays < 14) {
      setError(t.billing.durationInvalid || "Subscription duration must be at least 14 days");
      return;
    }
    try {
      const inv = await createBillingCheckout(session.token, {
        payable_network: "TRON",
        payment_options: PAYABLE_PAYMENT_OPTIONS.map(option => ({ network: option.network, asset: option.asset })),
        plan_code: billingForm.plan,
        subscription_days: billingForm.subscriptionDays,
      });
      setCheckoutUrl(buildCheckoutUrl(inv.public_id));
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onRedeemPromoCode() {
    if (!session || !promoCode.trim()) return;
    setRedeemingPromo(true);
    setPromoNotice("");
    setPromoError("");
    try {
      const res = await redeemPromoCode(session.token, promoCode.trim().toUpperCase());
      const updatedWs = res.workspace;
      let msg = res.result || "Promo code redeemed successfully!";
      if (updatedWs && updatedWs.discount_percent > 0) {
        if (updatedWs.discount_plan_code) {
          const planName = updatedWs.discount_plan_code.charAt(0).toUpperCase() + updatedWs.discount_plan_code.slice(1);
          msg = `Promo code redeemed! A ${updatedWs.discount_percent}% discount on ${planName} plan is applied.`;
        } else {
          msg = `Promo code redeemed! A ${updatedWs.discount_percent}% discount on any plan is applied.`;
        }
      }
      setPromoNotice(msg);
      setPromoCode("");
      await loadSession(session.token, { silent: true });
    } catch (err) {
      setPromoError(formatApiError(err));
    } finally {
      setRedeemingPromo(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    if (showDemoData) {
      return MOCK_INVOICES.map(inv => ({ ...inv, environment }));
    }
    return session?.invoices.filter(inv => inv.environment === environment) ?? [];
  }, [session, environment, showDemoData]);

  // Local filtering by network and date range for the Transaction History tab
  const displayInvoices = useMemo(() => {
    return filteredInvoices.filter(inv => {
      // 1. Network Filter
      if (selectedNetwork !== "all" && inv.payable_network !== selectedNetwork) {
        return false;
      }
      
      // 2. Date Range Filter
      if (selectedDate !== "all") {
        const invDate = new Date(inv.created_at);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        if (selectedDate === "today") {
          if (invDate < todayStart) return false;
        } else if (selectedDate === "yesterday") {
          const yesterdayStart = new Date(todayStart);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          if (invDate < yesterdayStart || invDate >= todayStart) return false;
        } else if (selectedDate === "last7") {
          const sevenDaysAgo = new Date(todayStart);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (invDate < sevenDaysAgo) return false;
        } else if (selectedDate === "last30") {
          const thirtyDaysAgo = new Date(todayStart);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          if (invDate < thirtyDaysAgo) return false;
        }
      }
      
      return true;
    });
  }, [filteredInvoices, selectedNetwork, selectedDate]);

  // Export to CSV utility
  const handleExportCSV = () => {
    const headers = ["Invoice ID", "Title", "Status", "Network", "Crypto Amount", "USD Amount", "Date", "Tx Hash"];
    const rows = displayInvoices.map(inv => [
      inv.public_id,
      inv.title,
      inv.status,
      inv.payable_network,
      `${inv.payable_amount} ${inv.payable_asset || ""}`,
      `$${Number(inv.base_amount_usd).toFixed(2)}`,
      new Date(inv.created_at).toLocaleString(),
      inv.tx_hash || ""
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Transaction History tab metrics
  const tabPaidInvoices = useMemo(() => displayInvoices.filter(inv => inv.status === "paid"), [displayInvoices]);
  const tabBasePaidRevenue = useMemo(() => tabPaidInvoices.reduce((sum, inv) => sum + (Number(inv.base_amount_usd) || 0), 0), [tabPaidInvoices]);
  
  const tabVolume = showDemoData ? 14250.00 : tabBasePaidRevenue;
  const tabCompletedCount = showDemoData ? 142 : tabPaidInvoices.length;
  const tabPendingCount = showDemoData 
    ? 8 
    : displayInvoices.filter(inv => inv.status === "awaiting_payment" || inv.status === "manual_review").length;

  const filteredWallets = useMemo(() => {
    if (showDemoData) {
      return MOCK_WALLETS.map(w => ({ ...w, environment }));
    }
    return session?.wallets.filter(w => w.environment === environment) ?? [];
  }, [session, environment, showDemoData]);

  const filteredKeys = useMemo(() => {
    if (showDemoData) {
      return MOCK_KEYS.filter(k => k.environment === environment);
    }
    return session?.apiKeys.filter(k => k.environment === environment) ?? [];
  }, [session, environment, showDemoData]);

  const filteredHooks = useMemo(() => {
    if (showDemoData) {
      return MOCK_HOOKS.filter(h => h.environment === environment);
    }
    return session?.webhooks.filter(h => h.environment === environment) ?? [];
  }, [session, environment, showDemoData]);

  const liveInvoices = useMemo(() => {
    if (showDemoData) {
      return MOCK_INVOICES;
    }
    return session?.invoices.filter(inv => inv.environment === "live") ?? [];
  }, [session, showDemoData]);

  const operationsGroup: PanelKey[] = ["overview", "invoices", "wallets"];
  const integrationsGroup: PanelKey[] = ["developer", "team"];
  const accountGroup: PanelKey[] = ["billing", "settings"];

  if (loading) {
    return (
      <div className="dev-portal dev-portal--console dev-portal--skeleton-loading">
        <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
        <div className="dev-portal__layout">
          <aside className="dev-portal__sidebar">
            <div className="dev-portal__sidebar-brand">
              <strong className="dev-portal__skeleton-brand">recv<span className="brand-dot">.</span></strong>
            </div>
            <div className="dev-portal__nav-menu">
              <div className="dev-sidebar-cta" style={{ opacity: 0.5, marginBottom: '0.5rem' }}>
                <div className="dev-sidebar-cta-btn" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', cursor: 'default' }} />
              </div>
              <div className="dev-portal__nav-group">
                <div className="dev-portal__skeleton-nav-label" />
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="dev-portal__skeleton-nav-link" style={{ marginBottom: '0.2rem' }} />
                ))}
              </div>
              <div className="dev-portal__nav-group">
                <div className="dev-portal__skeleton-nav-label" style={{ marginTop: '0.5rem' }} />
                {[...Array(2)].map((_, i) => (
                  <div key={i + 3} className="dev-portal__skeleton-nav-link" style={{ marginBottom: '0.2rem' }} />
                ))}
              </div>
            </div>
          </aside>
          <div className="dev-portal__content">
            <header className="dev-portal__header">
              <div className="dev-portal__skeleton-toggle" />
              <div className="dev-portal__skeleton-badge" />
            </header>
            <div className="dev-portal__body">
              <div className="dev-portal__skeleton-hero" />
              <div className="dev-metrics-grid">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="dev-portal__skeleton-metric" />
                ))}
              </div>
              <div className="dev-analytics-panel" style={{ marginTop: '1.5rem' }}>
                <div className="dev-portal__skeleton-panel" />
                <div className="dev-portal__skeleton-panel" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    const storedToken = getStoredToken();
    return (
      <main className="auth-portal">
        <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
        <div className="dev-portal__locked-state">
          <h3>{language === "ru" ? "Не удалось загрузить консоль" : "Could not load the console"}</h3>
          <p>
            {error || (language === "ru"
              ? "Сессия недоступна. Повторите загрузку или войдите снова."
              : "The session is unavailable. Retry loading or sign in again.")}
          </p>
          <div className="cluster">
            {storedToken ? (
              <button type="button" className="dev-btn dev-btn--primary" onClick={() => void loadSession(storedToken)}>
                {language === "ru" ? "Повторить" : "Retry"}
              </button>
            ) : null}
            <Link className="dev-btn dev-btn--secondary" to={buildAuthHref(location.pathname)}>
              {language === "ru" ? "Войти снова" : "Sign in again"}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const DUMMY_WALLETS_LIST = [
    "UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHaWqcn",
    "0x0000000000000000000000000000000000000000",
    "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb",
    "HN7cABViJeKaQRXmgUeJZr1H2dCxsf2A6Dks4K624zY1"
  ];

  const workspaceName = session.me.workspace.username || `#${session.me.workspace.id}`;
  const activeWallets = filteredWallets.filter(w => w.is_active);
  const activeWalletsCount = activeWallets.length;
  const hasRealWalletsCount = activeWallets.filter(w => !DUMMY_WALLETS_LIST.includes(w.address)).length;
  const isPayoutConfigured = activeWalletsCount > 0 && hasRealWalletsCount > 0;
  const isPayoutDemo = activeWalletsCount > 0 && hasRealWalletsCount === 0;

  const walletNetworks = new Set(filteredWallets.filter(w => w.is_active).map(w => w.network));
  const configuredBuckets = new Set(filteredWallets.map(w => walletBucket(w.network)));
  const missingWalletNetworks = WALLET_NETWORK_OPTIONS.filter(opt => !configuredBuckets.has(walletBucket(opt.value)));
  const walletCoveragePct = Math.round((configuredBuckets.size / WALLET_NETWORK_OPTIONS.length) * 100);

  // Dashboard metrics (current environment)
  const paidInvoices = filteredInvoices.filter(inv => inv.status === "paid");
  const basePaidRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.base_amount_usd) || 0), 0);
  const paidRevenue = showDemoData ? 12450.00 : basePaidRevenue;
  
  const hasApi = session.me.plan.has_api || environment === 'test' || import.meta.env.DEV;
  const connectedProviderMap = new Map(session.authIdentities.map(identity => [identity.provider, identity]));
  const authProviderRows = [
    { provider: "telegram" as const, label: "Telegram", action: "", identity: connectedProviderMap.get("telegram") },
    { provider: "google" as const, label: "Google", action: t.settings.connect, identity: connectedProviderMap.get("google") },
    { provider: "github" as const, label: "GitHub", action: t.settings.connect, identity: connectedProviderMap.get("github") },
  ];
  const avgTicket = showDemoData 
    ? 87.68 
    : (paidInvoices.length > 0 ? basePaidRevenue / paidInvoices.length : 0);
  const openValue = showDemoData
    ? 790.00
    : filteredInvoices
        .filter(inv => inv.status === "awaiting_payment" || inv.status === "underpaid")
        .reduce((sum, inv) => sum + (Number(inv.base_amount_usd) || 0), 0);
  const conversionPct = showDemoData
    ? 94
    : (filteredInvoices.length > 0 ? Math.round((paidInvoices.length / filteredInvoices.length) * 100) : 0);

  const totalInvoicesCount = showDemoData ? 151 : filteredInvoices.length;
  const paidInvoicesCount = showDemoData ? 142 : paidInvoices.length;

  const liveInvoicesCount = liveInvoices.length;
  const trialLimit = 15;
  const subscriptionEndsAt = session.me.workspace.subscription_ends_at
    ? new Date(session.me.workspace.subscription_ends_at).getTime()
    : 0;
  const hasActivePaidPlan = session.me.plan.code !== "trial"
    || (session.me.workspace.plan_code !== "trial" && Number.isFinite(subscriptionEndsAt) && subscriptionEndsAt > Date.now());
  const estimatedFeesSaved = paidRevenue * 0.025; // 2.5% standard gateway fee estimation

  // Status breakdown (current environment)
  const statusCounts = filteredInvoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  const statusBreakdown = showDemoData
    ? [
        { status: "paid" as InvoiceStatus, count: 142, pct: 94 },
        { status: "awaiting_payment" as InvoiceStatus, count: 6, pct: 4 },
        { status: "expired" as InvoiceStatus, count: 3, pct: 2 },
      ]
    : (Object.keys(statusCounts) as InvoiceStatus[])
        .map(status => ({
          status,
          count: statusCounts[status],
          pct: filteredInvoices.length > 0 ? Math.round((statusCounts[status] / filteredInvoices.length) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

  // Revenue by network (paid only)
  const networkTotals = paidInvoices.reduce<Record<string, { usd: number; count: number }>>((acc, inv) => {
    const key = inv.payable_network;
    if (!acc[key]) acc[key] = { usd: 0, count: 0 };
    acc[key].usd += Number(inv.base_amount_usd) || 0;
    acc[key].count += 1;
    return acc;
  }, {});
  const networkBreakdown = showDemoData
    ? [
        { network: "TON" as Network, usd: 8240.00, count: 95 },
        { network: "TRON" as Network, usd: 4210.00, count: 47 },
      ]
    : Object.entries(networkTotals)
        .map(([network, v]) => ({ network: network as Network, ...v }))
        .sort((a, b) => b.usd - a.usd);
  const maxNetworkUsd = networkBreakdown.reduce((m, n) => Math.max(m, n.usd), 0);

  const apiBaseUrl = getApiBase() || "https://api.recv.money";
  const apiSnippet = `curl -X POST ${apiBaseUrl}/v1/invoices \\
  -H "X-API-Key: ${environment === "test" ? "test_..." : "live_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Order #1","base_amount_usd":"49.00","payable_network":"${invoiceForm.network}","expires_in_minutes":30}'`;
  const onboardingSteps = [
    { done: isPayoutConfigured, body: t.overview.setupWallet, action: t.overview.setupWalletAction, target: "wallets" as PanelKey },
    ...(hasApi ? [{ done: filteredKeys.length > 0, body: t.overview.setupKey, action: t.overview.setupKeyAction, target: "developer" as PanelKey }] : []),
    { done: filteredInvoices.length > 0, body: t.overview.setupInvoice, action: t.overview.setupInvoiceAction, target: "create" as PanelKey },
    { done: hasActivePaidPlan, body: t.overview.setupPlan, action: t.overview.setupPlanAction, target: "billing" as PanelKey },
  ];
  const onboardingComplete = onboardingSteps.every(s => s.done);
  const isNewActivation = !onboardingComplete && filteredInvoices.length === 0;
  const payableNetworkOptions = PAYABLE_PAYMENT_OPTIONS.map(option => ({
    value: option.key,
    label: option.label,
    leadingIcon: <PaymentOptionLogos network={option.network} asset={option.asset} />,
    disabled: activeWalletsCount > 0 && !walletNetworks.has(walletBucket(option.network)),
    hint: activeWalletsCount === 0 
      ? (language === 'ru' ? "Демо-режим" : "Demo mode")
      : (walletNetworks.has(walletBucket(option.network)) ? t.common.walletReady : t.common.addWalletFirst),
  }));
  const billingNetworkOptions = PAYABLE_PAYMENT_OPTIONS.map(option => ({
    value: option.key,
    label: option.label,
    leadingIcon: <PaymentOptionLogos network={option.network} asset={option.asset} />,
  }));

  const handleNavClick = (key: PanelKey) => {
    setActivePanel(key);
    setIsMobileMenuOpen(false);
  };
  const invoicePageCount = Math.max(1, Math.ceil((session.invoiceTotal || 0) / session.invoicePageSize));
  const statusOptions = [
    { value: "all", label: language === "ru" ? "Все статусы" : "All statuses" },
    { value: "awaiting_payment", label: formatInvoiceStatus("awaiting_payment", language, true) },
    { value: "paid", label: formatInvoiceStatus("paid", language, true) },
    { value: "underpaid", label: formatInvoiceStatus("underpaid", language, true) },
    { value: "overpaid", label: formatInvoiceStatus("overpaid", language, true) },
    { value: "manual_review", label: formatInvoiceStatus("manual_review", language, true) },
    { value: "expired", label: formatInvoiceStatus("expired", language, true) },
  ];

  return (
    <main className={`dev-portal dev-portal--console ${isMobileMenuOpen ? "is-menu-open" : ""}`}>
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      
      {isMobileMenuOpen && (
        <div className="dev-portal__nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className="dev-portal__layout">
        <aside className={`dev-portal__sidebar portal-animate-in ${isMobileMenuOpen ? "is-open" : ""}`}>
          <div className="dev-portal__sidebar-brand">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
              <strong>recv<span className="brand-dot">.</span></strong>
            </Link>
          </div>
          
          <div className="dev-sidebar-cta">
            <button 
              className="dev-sidebar-cta-btn" 
              onClick={() => handleNavClick("create")}
            >
              {PANEL_ICONS.create}
              {t.nav.create}
            </button>
          </div>

          <nav className="dev-portal__nav-menu">
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.nav.operations}</span>
              {operationsGroup.map(key => {
                const label = key === "overview" ? t.nav.overview : (key === "invoices" ? t.nav.invoices : t.nav.wallets);
                return (
                  <button key={key} className={`dev-portal__nav-link ${activePanel === key ? "is-active" : ""}`} onClick={() => handleNavClick(key)}>
                    {PANEL_ICONS[key]}
                    {label}
                  </button>
                );
              })}
            </div>
            
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.nav.integrations}</span>
              {integrationsGroup.map(key => {
                const label = key === "developer" ? t.nav.developer : t.nav.team;
                return (
                  <button key={key} className={`dev-portal__nav-link ${activePanel === key ? "is-active" : ""}`} onClick={() => handleNavClick(key)}>
                    {PANEL_ICONS[key]}
                    {label}
                  </button>
                );
              })}
            </div>
            
            <div className="dev-portal__nav-group">
              {accountGroup.map(key => {
                const label = key === "billing" ? t.nav.billing : t.nav.settings;
                return (
                  <button key={key} className={`dev-portal__nav-link ${activePanel === key ? "is-active" : ""}`} onClick={() => handleNavClick(key)}>
                    {PANEL_ICONS[key]}
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Trial progress widget / Active plan badge */}
            {!hasActivePaidPlan ? (
              <div className="dev-sidebar-plan-widget">
                <div className="dev-sidebar-plan-header">
                  <span className="dev-sidebar-plan-title">{t.common.plan}</span>
                  <a className="dev-sidebar-plan-upgrade-link" onClick={() => handleNavClick("billing")}>
                    {t.nav.upgrade}
                  </a>
                </div>
                <div className="dev-sidebar-plan-stats">
                  {liveInvoicesCount} / {trialLimit}
                </div>
                <div className="dev-sidebar-plan-bar">
                  <div 
                    className={`dev-sidebar-plan-progress ${
                      liveInvoicesCount >= trialLimit 
                        ? 'dev-sidebar-plan-progress--danger' 
                        : (liveInvoicesCount >= trialLimit - 3 ? 'dev-sidebar-plan-progress--warning' : 'dev-sidebar-plan-progress--normal')
                    }`} 
                    style={{ width: `${Math.min(100, Math.round((liveInvoicesCount / trialLimit) * 100))}%` }} 
                  />
                </div>
                <div className="dev-sidebar-plan-hint">
                  {language === 'ru' ? 'Лимит live-инвойсов' : 'Live invoice limit'}
                </div>
              </div>
            ) : (
              <div className="dev-sidebar-plan-active-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                <span className="dev-sidebar-plan-active-label">{session.me.plan.name}</span>
              </div>
            )}
            
            <div className="dev-portal__nav-group dev-portal__nav-logout">
              <button className="dev-portal__nav-link dev-btn--danger-color" onClick={handleLogout}>
                {PANEL_ICONS.logout}
                {t.nav.logout}
              </button>
            </div>
          </nav>
        </aside>

        <div className="dev-portal__content">
          <header className="dev-portal__header portal-animate-in">
            <div className="dev-portal__mobile-brand-row">
              <button 
                className="dev-portal__menu-trigger" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={t.common.toggleMenu}
              >
                <div className="dev-portal__menu-icon">
                  <span />
                  <span />
                  <span />
                </div>
              </button>
              <Link className="dev-portal__brand-mobile" to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                <strong>recv<span className="brand-dot">.</span></strong>
              </Link>
            </div>

            <div className="dev-portal__header-actions">
              {session.me.workspaces.length > 1 ? (
                <div className={`workspace-switcher ${switchingWorkspace ? "is-busy" : ""}`}>
                  <CustomSelect
                    value={String(session.me.workspace.id)}
                    options={session.me.workspaces.map(w => ({
                      value: String(w.id),
                      label: w.username ? `@${w.username}` : (w.name || `#${w.id}`),
                    }))}
                    ariaLabel={t.overview.currentWorkspace}
                    onChange={(v) => void onSwitchWorkspace(Number(v))}
                  />
                </div>
              ) : (
                <div className="dev-portal__workspace-badge">{workspaceName}</div>
              )}
            </div>
          </header>

          <div className="dev-portal__body">
            {error && <div className="alert portal-animate-in" onClick={() => setError("")}>{error}</div>}

            {activePanel === "overview" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__hero dev-portal__hero--compact">
                  <h1>{t.overview.welcome} {session.me.user.username || 'User'}</h1>
                  <p>{t.overview.subtitle} {t.overview.currentWorkspace}: <strong>{workspaceName}</strong></p>
                </div>

                {/* Trial HUD Widget */}
                {session.me.plan.code === 'trial' && (
                  <div className="console-trial-hud" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '8px 12px',
                    background: 'rgba(139, 92, 246, 0.03)',
                    border: '1px solid rgba(139, 92, 246, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    fontSize: '14.5px',
                    color: '#ffffff',
                    flexWrap: 'wrap'
                  }}>
                    <div className="console-trial-hud__copy" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                      <span style={{ fontWeight: 500, color: '#f8fafc' }}>
                        {t.overview.trialHudSubtitle.replace('{used}', String(liveInvoicesCount)).replace('{limit}', String(trialLimit))}
                      </span>
                      {/* Thin inline progress bar */}
                      <div className="console-trial-hud__bar" style={{ width: '70px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, Math.round((liveInvoicesCount / trialLimit) * 100))}%`, background: liveInvoicesCount >= trialLimit ? '#ef4444' : '#8b5cf6' }} />
                      </div>
                    </div>
                    <button
                      className="dev-btn dev-btn--trial-ghost dev-btn--compact"
                      onClick={() => setActivePanel("billing")}
                      style={{
                        padding: '0 12px',
                        fontSize: '11px',
                        height: '28px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {t.overview.trialHudAction}
                    </button>
                  </div>
                )}

                {/* Quick Setup Checklist */}
                <div className="console-quick-setup" style={{
                  marginBottom: '24px',
                  background: 'rgba(18, 14, 30, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '1.25rem',
                  borderRadius: '12px'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                      {t.overview.setupTitle}
                    </h3>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Row 1: Payout Address */}
                    <div className="console-quick-setup__row" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      gap: '16px'
                    }}>
                      <div className="console-quick-setup__copy" style={{ display: 'grid', gridTemplateColumns: '24px 170px 1fr', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span className={`dev-status-dot dev-status-dot--${isPayoutConfigured ? 'success' : 'warning'}`} style={{ justifySelf: 'center' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                          {t.overview.integrationHealthPayouts}
                        </span>
                        <span style={{ fontSize: '13px', color: isPayoutConfigured ? '#94a3b8' : '#f59e0b' }}>
                          {isPayoutConfigured 
                            ? t.overview.integrationHealthPayoutsConfigured 
                            : (isPayoutDemo 
                                ? (language === 'ru' ? 'Привязан демо-кошелек (замените на реальный)' : 'Demo wallet configured (replace with real)') 
                                : t.overview.integrationHealthPayoutsMissing
                              )
                          }
                        </span>
                      </div>
                      <button 
                        className={`dev-btn dev-btn--compact ${isPayoutConfigured ? 'dev-btn--secondary' : 'dev-btn--primary-accent'}`} 
                        onClick={() => setActivePanel("wallets")} 
                        style={{ width: '100px', borderRadius: '6px', fontSize: '12px', height: '32px', padding: 0, margin: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontWeight: 600, textTransform: 'none' }}
                      >
                        {language === 'ru' ? 'Настроить' : 'Configure'}
                      </button>
                    </div>

                    {/* Row 2: Test Invoice */}
                    <div className="console-quick-setup__row" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      gap: '16px'
                    }}>
                      <div className="console-quick-setup__copy" style={{ display: 'grid', gridTemplateColumns: '24px 170px 1fr', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span className={`dev-status-dot dev-status-dot--${filteredInvoices.length > 0 ? 'success' : 'neutral'}`} style={{ justifySelf: 'center' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                          {language === 'ru' ? 'Тест платежа' : 'Payment Test'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                          {filteredInvoices.length > 0 ? t.overview.invoiceTested : t.overview.invoiceMissing}
                        </span>
                      </div>
                      <button 
                        className={`dev-btn dev-btn--compact ${(activeWalletsCount > 0 && filteredInvoices.length === 0) ? 'dev-btn--primary-accent' : 'dev-btn--secondary'}`} 
                        onClick={() => setActivePanel("create")} 
                        style={{ width: '100px', borderRadius: '6px', fontSize: '12px', height: '32px', padding: 0, margin: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontWeight: 600, textTransform: 'none' }}
                      >
                        {language === 'ru' ? 'Создать' : 'Create'}
                      </button>
                    </div>

                    {/* Row 3: Go Live / Billing */}
                    <div className="console-quick-setup__row" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0 0 0',
                      gap: '16px'
                    }}>
                      <div className="console-quick-setup__copy" style={{ display: 'grid', gridTemplateColumns: '24px 170px 1fr', alignItems: 'center', gap: '8px', flex: 1 }}>
                        <span className={`dev-status-dot dev-status-dot--${session.me.plan.code !== 'trial' ? 'success' : 'neutral'}`} style={{ justifySelf: 'center' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                          {language === 'ru' ? 'Снять лимиты' : 'Upgrade Plan'}
                        </span>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                          {session.me.plan.code !== 'trial' 
                            ? (language === 'ru' ? 'Вы на активном платном тарифе' : 'Unlimited active plan is active')
                            : (language === 'ru' ? 'Снимите ограничения в 15 инвойсов и откройте API' : 'Unlock unlimited invoices, REST API access, and webhooks')
                          }
                        </span>
                      </div>
                      <button 
                        className="dev-btn dev-btn--secondary dev-btn--compact" 
                        onClick={() => setActivePanel("billing")} 
                        style={{ width: '100px', borderRadius: '6px', fontSize: '12px', height: '32px', padding: 0, margin: 0, display: 'inline-flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, fontWeight: 600 }}
                      >
                        {language === 'ru' ? 'Тарифы' : 'Billing'}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Unified Performance Analytics Panel */}
                <div className="dev-setup-panel console-sales-analytics portal-animate-in" style={{ background: 'rgba(18, 14, 30, 0.45)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '1.75rem', marginBottom: '2.5rem' }}>
                  
                  {/* Title & Simulation Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>
                      {language === 'ru' ? 'Аналитика продаж' : 'Sales Analytics'}
                    </h3>
                    
                    {/* Sandbox preview control - hidden in production, shown only in development mode */}
                    {import.meta.env.DEV && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.08)', padding: '5px 12px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{t.overview.sandboxToggle}</span>
                        <button
                          type="button"
                          className={`env-toggle__btn ${showDemoData ? 'is-active' : ''}`}
                          onClick={() => setShowDemoData(!showDemoData)}
                          style={{ padding: '2px 8px', fontSize: '10px', height: 'auto', borderRadius: '8px', margin: 0 }}
                        >
                          {showDemoData ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="dev-metrics-telemetry console-sales-analytics__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    
                    {/* Left Column: Big Revenue Card */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.25rem', paddingRight: '2rem', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }} className="telemetry-revenue-col console-sales-analytics__revenue">
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8f9cae', fontWeight: 600, letterSpacing: '0.05em' }}>
                          {t.overview.revenue}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', color: '#ffffff', letterSpacing: '-0.02em' }}>
                            ${paidRevenue.toFixed(2)}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#8f9cae' }}>
                          {t.overview.revenuePaid}
                        </span>
                      </div>

                      {/* Sparkline trend simulator */}
                      <div style={{ height: '40px', display: 'flex', alignItems: 'flex-end', gap: '4px', paddingBottom: '4px' }}>
                        {showDemoData ? (
                          [25, 40, 60, 35, 75, 50, 90, 65, 85, 100].map((h, i) => (
                            <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(to top, rgba(139, 92, 246, 0.2), var(--accent, #8b5cf6))', borderRadius: '2px', transition: 'height 0.3s ease' }} />
                          ))
                        ) : (
                          // Flat line when 0 real invoices
                          <div style={{ width: '100%', height: '2px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '1px' }} />
                        )}
                      </div>
                    </div>

                    {/* Right Column: Performance KPIs */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                      
                      {/* Metric Row 1: Invoices */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>{t.overview.stats.invoices}</span>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>{totalInvoicesCount}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8f9cae' }}>{paidInvoicesCount} {t.overview.paidCount}</span>
                        </div>
                      </div>

                      {/* Metric Row 2: Conversion */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>{t.overview.conversion}</span>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>{conversionPct}%</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8f9cae' }}>{paidInvoicesCount}/{totalInvoicesCount} {t.overview.conversionMeta}</span>
                        </div>
                      </div>

                      {/* Metric Row 3: Avg Ticket */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>{t.overview.avgTicket}</span>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>${avgTicket.toFixed(2)}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8f9cae' }}>{t.overview.avgTicketMeta}</span>
                        </div>
                      </div>

                      {/* Metric Row 4: Open Value */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#8f9cae', fontWeight: 500 }}>{t.overview.openValue}</span>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '15px', color: '#ffffff' }}>${openValue.toFixed(2)}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: '#8f9cae' }}>{t.overview.openValueMeta}</span>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

                {filteredInvoices.length > 0 && (
                  <div className="dev-analytics-panel">
                    <div className="dev-analytics-col console-spotlight-card">
                      <div className="console-card-spotlight" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.overview.statusTitle}</h3>
                        <p>{t.overview.statusSubtitle}</p>
                      </div>
                      <div className="dev-breakdown">
                        {statusBreakdown.map(({ status, count, pct }) => (
                          <div key={status} className="dev-breakdown__row">
                            <div className="dev-breakdown__head">
                              <span className={`dev-status-dot dev-status-dot--${statusToneClass(status)}`} />
                              <span className="dev-breakdown__label" title={getInvoiceStatusTooltip(status, language) || undefined}>{formatInvoiceStatus(status, language, true)}</span>
                              <span className="dev-breakdown__value">{count} · {pct}%</span>
                            </div>
                            <div className="dev-breakdown__track">
                              <div className={`dev-breakdown__fill dev-breakdown__fill--${statusToneClass(status)}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dev-analytics-col console-spotlight-card">
                      <div className="console-card-spotlight" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.overview.networksTitle}</h3>
                        <p>{t.overview.networksSubtitle}</p>
                      </div>
                      {networkBreakdown.length === 0 ? (
                        <div className="dev-portal__empty-state">{t.overview.noNetworkData}</div>
                      ) : (
                        <div className="dev-breakdown">
                          {networkBreakdown.map(({ network, usd, count }) => (
                            <div key={network} className="dev-breakdown__row">
                              <div className="dev-breakdown__head">
                                <NetworkPill network={network} className="dev-api-badge--micro" />
                                <span className="dev-breakdown__label">{count} {t.overview.invoicesLabel}</span>
                                <span className="dev-breakdown__value">${usd.toFixed(2)}</span>
                              </div>
                              <div className="dev-breakdown__track">
                                <div className="dev-breakdown__fill dev-breakdown__fill--accent" style={{ width: `${maxNetworkUsd > 0 ? Math.round((usd / maxNetworkUsd) * 100) : 0}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}


                {session.me.plan.code === 'trial' && (
                  <div className="dev-card dev-card--accent dev-promo-card portal-animate-in console-spotlight-card">
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-promo-card__content">
                      <h3>{t.promo.title}</h3>
                      <p>{t.promo.subtitle}</p>
                    </div>
                    <button className="dev-btn dev-btn--primary dev-promo-card__btn" onClick={() => setActivePanel("billing")}>
                      {t.promo.action}
                    </button>
                  </div>
                )}

                <div className="dev-card console-spotlight-card">
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin">
                    <h3>{t.overview.activity}</h3>
                  </div>
                  {filteredInvoices.length === 0 ? (
                    <div className="dev-portal__empty-state">{t.overview.noActivity}</div>
                  ) : (
                    <div className="dev-resource-list">
                      {filteredInvoices.slice(0, 5).map(inv => (
                        <div key={inv.id} className="dev-resource-card dev-resource-card--compact" onClick={() => setActivePanel("invoices")}>
                          <div className="dev-resource-card__info dev-resource-card__info--tight">
                            <div className="dev-resource-card__title dev-resource-card__title--small">{inv.title}</div>
                            <div className="dev-resource-card__meta dev-resource-card__meta--row">
                              <span className={`dev-api-badge dev-api-badge--${getInvoiceStatusMeta(inv.status).tone === 'success' ? 'get' : 'post'} dev-api-badge--micro`} title={getInvoiceStatusTooltip(inv.status, language) || undefined}>
                                {formatInvoiceStatus(inv.status, language, true)}
                              </span>
                              <span className="dev-resource-card__amount"><AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} /></span>
                            </div>
                          </div>
                          <div className="dev-resource-card__actions" onClick={e => e.stopPropagation()}>
                            <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => handleCopy(buildCheckoutUrl(inv.public_id), `quick-${inv.id}`)}>
                               {copiedId === `quick-${inv.id}` ? t.common.copied : t.common.url}
                            </button>
                            <a href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary dev-btn--compact">
                               {t.common.viewInvoice}
                            </a>
                            <div className="dev-resource-card__date">
                              {new Date(inv.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activePanel === "wallets" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.wallets.title}</h2>
                  <p>{t.wallets.subtitle}</p>
                </div>

                <div className="dev-card dev-card--accent dev-coverage console-spotlight-card">
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-coverage__info">
                    <span className="dev-widget__label">{t.wallets.coverage}</span>
                    <div className="dev-widget__value"><LiveValue value={`${configuredBuckets.size}/${WALLET_NETWORK_OPTIONS.length}`} /></div>
                    <div className="dev-widget__meta">{walletCoveragePct}% {t.wallets.coverageMeta}</div>
                  </div>
                  <div className="dev-coverage__bar">
                    <div className="dev-breakdown__track">
                      <div className="dev-breakdown__fill dev-breakdown__fill--accent" style={{ width: `${walletCoveragePct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="payout-network-container">
                  <div className="dev-network-grid">
                    {WALLET_NETWORK_OPTIONS.map(opt => {
                      const wallets = filteredWallets.filter(w => walletBucket(w.network) === walletBucket(opt.value));
                      const configured = wallets.length > 0;
                      const currentWallet = wallets[0] || null;
                      
                      const isEditing = editingNetwork[opt.value] || !configured;
                      const isSaving = isSavingNetwork[opt.value];
                      const errorMsg = networkErrors[opt.value];
                      
                      const addressVal = networkInputs[opt.value] !== undefined 
                        ? networkInputs[opt.value] 
                        : (currentWallet ? currentWallet.address : "");

                      const isValidAddress = validateWalletAddress(opt.value, addressVal);
                      const isAddressEmpty = !addressVal.trim();
                      const showValidationError = !isAddressEmpty && !isValidAddress;

                      // Define helper for network icons
                      let networkCoins: string[] = [];

                      switch (opt.value) {
                        case "TON":
                          networkCoins = ["GRAM", "USDT"];
                          break;
                        case "SOLANA":
                          networkCoins = ["SOL", "USDT", "USDC"];
                          break;
                        case "TRON":
                          networkCoins = ["USDT"];
                          break;
                        case "EVM":
                          networkCoins = ["BNB", "USDT", "USDC"];
                          break;
                      }

                      // Truncate address for display on mobile / compact
                      const formatAddress = (addr: string) => {
                        if (addr.length <= 16) return addr;
                        return `${addr.slice(0, 10)}...${addr.slice(-8)}`;
                      };

                      const explorerUrl = currentWallet ? (
                        environment === "live" ? (
                          opt.value === "TON" ? `https://tonviewer.com/${currentWallet.address}` :
                          opt.value === "SOLANA" ? `https://solscan.io/account/${currentWallet.address}` :
                          opt.value === "TRON" ? `https://tronscan.org/#/address/${currentWallet.address}` :
                          `https://basescan.org/address/${currentWallet.address}`
                        ) : (
                          opt.value === "TON" ? `https://testnet.tonviewer.com/${currentWallet.address}` :
                          opt.value === "SOLANA" ? `https://solscan.io/account/${currentWallet.address}?cluster=testnet` :
                          opt.value === "TRON" ? `https://shasta.tronscan.org/#/address/${currentWallet.address}` :
                          `https://sepolia.basescan.org/address/${currentWallet.address}`
                        )
                      ) : "#";

                      return (
                        <div key={opt.value} className={`payout-card dev-card console-spotlight-card ${configured ? "is-active" : "is-missing"}`}>
                          <div className="console-card-spotlight" />
                          <div className="console-dogfood-glow" />
                          
                          <div className="payout-card__head">
                            <div className="payout-card__network-info">
                              <div className="payout-card__icon-wrapper">
                                <CryptoLogo type="network" value={opt.value} className="payout-network-icon" />
                              </div>
                              <div className="payout-card__label-group">
                                <span className="payout-card__name">{opt.label}</span>
                                <div className="payout-card__assets">
                                  <span className="payout-card__assets-label">{t.wallets.assets}:</span>
                                  {networkCoins.map(coin => renderAssetPill(coin))}
                                </div>
                              </div>
                            </div>
                            
                            <span className={`payout-card__status payout-card__status--${configured ? "active" : "missing"}`}>
                              {configured ? t.wallets.active : t.wallets.missing}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="payout-card__edit-form">
                              <div className="dev-input-group">
                                <label className="payout-input-label">{t.wallets.address}</label>
                                <div className="payout-input-wrapper">
                                  <input 
                                    className={`dev-input payout-input ${showValidationError ? "is-invalid" : ""}`} 
                                    placeholder={t.wallets.placeholder} 
                                    value={addressVal} 
                                    disabled={isSaving}
                                    onChange={e => setNetworkInputs(c => ({ ...c, [opt.value]: e.target.value }))}
                                  />
                                </div>
                                {showValidationError && (
                                  <div className="payout-card__validation-error">
                                    {t.wallets.invalidFormat.replace("{network}", opt.label)}
                                  </div>
                                )}
                              </div>
                              
                              {errorMsg && (
                                <div className="payout-card__error">
                                  {errorMsg}
                                </div>
                              )}

                              <div className="payout-card__actions-row">
                                <button 
                                  className="dev-btn dev-btn--primary dev-btn--compact payout-btn"
                                  disabled={isSaving || isAddressEmpty || !isValidAddress}
                                  onClick={() => void onSaveWalletInline(opt.value, currentWallet ? currentWallet.id : null, addressVal)}
                                >
                                  {isSaving ? t.wallets.updating : t.wallets.save}
                                </button>
                                {configured && (
                                  <button 
                                    className="dev-btn dev-btn--secondary dev-btn--compact payout-btn"
                                    disabled={isSaving}
                                    onClick={() => {
                                      setEditingNetwork(c => ({ ...c, [opt.value]: false }));
                                      setNetworkErrors(c => ({ ...c, [opt.value]: "" }));
                                      setNetworkInputs(c => ({ ...c, [opt.value]: currentWallet.address }));
                                    }}
                                  >
                                    {t.common.cancel}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="payout-card__view-mode">
                              <div className="payout-address-block">
                                <code className="payout-address payout-address--desktop">{currentWallet.address}</code>
                                <code className="payout-address payout-address--mobile">{formatAddress(currentWallet.address)}</code>
                              </div>
                              {DUMMY_WALLETS_LIST.includes(currentWallet.address) && (
                                <div style={{
                                  fontSize: '11px',
                                  color: '#f59e0b',
                                  marginTop: '6px',
                                  fontWeight: 500,
                                  background: 'rgba(245, 158, 11, 0.08)',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(245, 158, 11, 0.15)'
                                }}>
                                  {language === 'ru' 
                                    ? '⚠️ Демо-адрес. Нажмите кнопку «Редактировать» ниже, чтобы привязать ваш собственный кошелек для реальных выплат.' 
                                    : '⚠️ Demo address. Click the "Edit" button below to link your own wallet for real payouts.'}
                                </div>
                              )}
                              
                              <div className="payout-card__toolbar">
                                <button 
                                  className="dev-btn dev-btn--secondary dev-btn--compact payout-icon-btn"
                                  title={t.common.copy}
                                  onClick={() => void handleCopy(currentWallet.address, `wallet-${currentWallet.id}`)}
                                >
                                  {copiedId === `wallet-${currentWallet.id}` ? (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                      {t.common.copied}
                                    </>
                                  ) : (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                      </svg>
                                      {t.common.copy}
                                    </>
                                  )}
                                </button>
                                
                                <a 
                                  href={explorerUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="dev-btn dev-btn--secondary dev-btn--compact payout-icon-btn"
                                  title={t.wallets.explorer}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                  {t.wallets.explorer}
                                </a>

                                <button 
                                  className="dev-btn dev-btn--secondary dev-btn--compact payout-icon-btn"
                                  disabled={isSaving}
                                  onClick={() => {
                                    setEditingNetwork(c => ({ ...c, [opt.value]: true }));
                                    setNetworkInputs(c => ({ ...c, [opt.value]: currentWallet.address }));
                                  }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  {t.wallets.edit}
                                </button>

                                <button 
                                  className="dev-btn dev-btn--danger dev-btn--compact payout-icon-btn"
                                  disabled={isSaving}
                                  onClick={() => void onDeleteWalletInline(opt.value, currentWallet.id)}
                                >
                                  {isSaving ? (
                                    t.wallets.updating
                                  ) : (
                                    <>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        <line x1="10" y1="11" x2="10" y2="17" />
                                        <line x1="14" y1="11" x2="14" y2="17" />
                                      </svg>
                                      {t.common.delete}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "invoices" && (
              <div className="dev-portal__section console-transactions portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.invoices.title}</h2>
                  <p>{t.invoices.subtitle}</p>
                </div>

                {/* Metrics Cards */}
                <div className="dev-metrics-telemetry console-sales-analytics__grid console-transactions__metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  {/* Volume Card */}
                  <div className="dev-card console-spotlight-card console-transactions__metric console-transactions__metric--volume" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #10b981' }}>
                    <div className="console-card-spotlight" />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8f9cae', fontWeight: 600, letterSpacing: '0.05em' }}>
                      {t.invoices.metricsVolume}
                    </span>
                    <strong style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
                      ${tabVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                    {showDemoData && <span style={{ fontSize: '11px', color: '#10b981' }}>+$342.10 (2.4%)</span>}
                  </div>

                  {/* Completed Card */}
                  <div className="dev-card console-spotlight-card console-transactions__metric console-transactions__metric--completed" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #3b82f6' }}>
                    <div className="console-card-spotlight" />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8f9cae', fontWeight: 600, letterSpacing: '0.05em' }}>
                      {t.invoices.metricsCompleted}
                    </span>
                    <strong style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {tabCompletedCount}
                    </strong>
                    {showDemoData && <span style={{ fontSize: '11px', color: '#3b82f6' }}>11 new today</span>}
                  </div>

                  {/* Pending Card */}
                  <div className="dev-card console-spotlight-card console-transactions__metric console-transactions__metric--pending" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: '4px solid #a855f7' }}>
                    <div className="console-card-spotlight" />
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#8f9cae', fontWeight: 600, letterSpacing: '0.05em' }}>
                      {t.invoices.metricsPending}
                    </span>
                    <strong style={{ fontSize: '1.8rem', color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {tabPendingCount}
                    </strong>
                    {showDemoData && <span style={{ fontSize: '11px', color: '#a855f7' }}>3 awaiting confirmation</span>}
                  </div>
                </div>

                {/* Toolbar / Filters */}
                <div className="dev-card dev-toolbar console-spotlight-card console-transactions__toolbar" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'stretch', marginBottom: '1.5rem' }}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  
                  {/* Row 1: Search & Layout Toggle */}
                  <div className="console-transactions__toolbar-row console-transactions__toolbar-row--primary" style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <input
                      className="dev-input"
                      value={searchVal}
                      onChange={(event) => setSearchVal(event.target.value)}
                      placeholder={language === "ru" ? "Поиск по названию, ID или tx hash" : "Search title, ID, or tx hash"}
                      style={{ flex: 1, minWidth: '240px' }}
                    />
                    <div className="console-transactions__view-toggle" style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px', flexShrink: 0 }}>
                      <button 
                        type="button"
                        onClick={() => setViewMode("table")}
                        className="dev-btn dev-btn--compact" 
                        style={{ 
                          background: viewMode === "table" ? 'rgba(255,255,255,0.1)' : 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          padding: '4px 8px',
                          color: viewMode === "table" ? '#ffffff' : '#8f9cae',
                          minWidth: 'auto'
                        }}
                        title={t.invoices.viewTable}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="3" y1="12" x2="21" y2="12" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setViewMode("card")}
                        className="dev-btn dev-btn--compact" 
                        style={{ 
                          background: viewMode === "card" ? 'rgba(255,255,255,0.1)' : 'transparent',
                          border: 'none',
                          boxShadow: 'none',
                          padding: '4px 8px',
                          color: viewMode === "card" ? '#ffffff' : '#8f9cae',
                          minWidth: 'auto'
                        }}
                        title={t.invoices.viewCard}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="9" />
                          <rect x="14" y="3" width="7" height="5" />
                          <rect x="14" y="12" width="7" height="9" />
                          <rect x="3" y="16" width="7" height="5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Selectors */}
                  <div className="console-transactions__toolbar-row console-transactions__filters" style={{ display: 'flex', gap: '1rem', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="dev-toolbar-select">
                      <CustomSelect
                        value={selectedNetwork}
                        onChange={(value) => setSelectedNetwork(value)}
                        options={[
                          { value: "all", label: t.invoices.filterAllNetworks },
                          { value: "TON", label: "TON" },
                          { value: "TON_USDT", label: "TON (USDT)" },
                          { value: "TRON", label: "TRON" },
                          { value: "EVM", label: "Ethereum" },
                          { value: "SOLANA", label: "Solana" },
                          { value: "BASE", label: "Base" },
                          { value: "ARBITRUM", label: "Arbitrum" },
                          { value: "BSC", label: "BSC" },
                        ]}
                        ariaLabel={t.invoices.filterNetwork}
                      />
                    </div>
                    <div className="dev-toolbar-select">
                      <CustomSelect
                        value={invoiceFilters.status}
                        onChange={(value) => setInvoiceFilters(current => ({ ...current, page: 1, status: value }))}
                        options={statusOptions}
                        ariaLabel={language === "ru" ? "Фильтр статуса" : "Status filter"}
                      />
                    </div>
                    <div className="dev-toolbar-select">
                      <CustomSelect
                        value={selectedDate}
                        onChange={(value) => setSelectedDate(value)}
                        options={[
                          { value: "all", label: t.invoices.filterAllDates },
                          { value: "today", label: t.invoices.filterToday },
                          { value: "yesterday", label: t.invoices.filterYesterday },
                          { value: "last7", label: t.invoices.filterLast7Days },
                          { value: "last30", label: t.invoices.filterLast30Days },
                        ]}
                        ariaLabel={t.invoices.filterDateRange}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoices List / Table */}
                <div className="dev-resource-list console-transactions__list">
                  {filteredInvoices.length === 0 ? (
                    /* True Empty State - No invoices created at all */
                    <div className="dev-card dev-portal__empty-large console-spotlight-card" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8f9cae' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div style={{ maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>{t.invoices.empty}</h3>
                        <p style={{ fontSize: '13px', color: '#8f9cae', lineHeight: 1.5 }}>
                          {language === "ru" ? "Здесь будут отображаться ваши счета и платежи от клиентов." : "Your invoices and client payments will be displayed here."}
                        </p>
                      </div>
                      <button className="dev-btn dev-btn--primary" onClick={() => setActivePanel("create")}>
                        {t.invoices.createFirst}
                      </button>
                    </div>
                  ) : displayInvoices.length === 0 ? (
                    /* Filters Empty State - Invoices exist but none match filters */
                    <div className="dev-card dev-portal__empty-large console-spotlight-card" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div style={{ fontSize: '15px', fontWeight: 500, color: '#ffffff' }}>
                        {language === "ru" ? "Нет счетов, соответствующих фильтрам" : "No invoices match active filters"}
                      </div>
                      <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => {
                        setSearchVal("");
                        setInvoiceFilters(current => ({ ...current, page: 1, status: "all", query: "" }));
                        setSelectedNetwork("all");
                        setSelectedDate("all");
                      }}>
                        {language === "ru" ? "Сбросить фильтры" : "Reset filters"}
                      </button>
                    </div>
                  ) : viewMode === "card" ? (
                    /* Card View Mode */
                    displayInvoices.map(inv => {
                      const isOpen = expandedInvoice === inv.id;
                      return (
                        <div key={inv.id} className="dev-card dev-card--invoice console-spotlight-card console-transaction-card">
                          <div className="console-card-spotlight" />
                          <div className="console-dogfood-glow" />
                          <div className="dev-card__head">
                            <div>
                              <div className="dev-card__status-row">
                                <span className={`dev-api-badge dev-status-badge dev-status-badge--${statusToneClass(inv.status)}`} title={getInvoiceStatusTooltip(inv.status, language) || undefined}>
                                  {formatInvoiceStatus(inv.status, language, true)}
                                </span>
                                <NetworkPill network={inv.payable_network} />
                              </div>
                              <h3 className="dev-card__title">{inv.title}</h3>
                              <code className="dev-card__id">{inv.public_id}</code>
                            </div>
                            <div className="dev-card__amount-col">
                              <div className="dev-card__amount"><AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} className="crypto-amount--large" /></div>
                              <div className="dev-card__base">${Number(inv.base_amount_usd).toFixed(2)} {t.invoices.baseUsd}</div>
                              <div className="dev-card__date">{new Date(inv.created_at).toLocaleString()}</div>
                            </div>
                          </div>

                          <div className={`dev-invoice-details-wrapper ${isOpen ? "is-expanded" : ""}`}>
                            <div className="dev-invoice-details-inner">
                              <div className="dev-invoice-details">
                                <div className="dev-settings-row">
                                  <span className="dev-settings-row__label">{t.invoices.baseUsd}</span>
                                  <span className="dev-settings-row__value">${Number(inv.base_amount_usd).toFixed(2)}</span>
                                </div>
                                <div className="dev-settings-row">
                                  <span className="dev-settings-row__label">{t.invoices.payable}</span>
                                  <span className="dev-settings-row__value"><AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} /></span>
                                </div>
                                {Number(inv.received_amount) > 0 && (
                                  <div className="dev-settings-row">
                                    <span className="dev-settings-row__label">{t.invoices.received}</span>
                                    <span className="dev-settings-row__value"><AssetAmount amount={inv.received_amount} asset={inv.payable_asset} network={inv.payable_network} /></span>
                                  </div>
                                )}
                                <div className="dev-settings-row">
                                  <span className="dev-settings-row__label">{t.invoices.created}</span>
                                  <span className="dev-settings-row__value">{new Date(inv.created_at).toLocaleString()}</span>
                                </div>
                                <div className="dev-settings-row dev-invoice-details__tx">
                                  <span className="dev-settings-row__label">{t.invoices.txHash}</span>
                                  {inv.tx_hash ? (
                                    <div className="dev-invoice-details__tx-val">
                                      <code className="dev-wallet-address">{inv.tx_hash}</code>
                                      <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => handleCopy(inv.tx_hash || "", `tx-${inv.id}`)}>
                                        {copiedId === `tx-${inv.id}` ? t.common.copied : t.invoices.copyTx}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="dev-settings-row__value dev-card__note-text">{t.invoices.noTx}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="dev-card__actions">
                            <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => handleCopy(buildCheckoutUrl(inv.public_id), `inv-${inv.id}`)}>
                              {copiedId === `inv-${inv.id}` ? t.common.copied : t.invoices.copyLink}
                            </button>
                            <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => handleCopy(inv.public_id, `id-${inv.id}`)}>
                              {copiedId === `id-${inv.id}` ? t.common.copied : t.invoices.copyId}
                            </button>
                            <a href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary dev-btn--flex-grow dev-btn--centered">{t.invoices.view}</a>
                            <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => setExpandedInvoice(isOpen ? null : inv.id)}>
                              {isOpen ? t.invoices.hide : t.invoices.details}
                            </button>
                            {(getInvoiceStatusMeta(inv.status).canSellerMarkPaid || getInvoiceStatusMeta(inv.status).canSellerCancel) && (
                              <>
                                {getInvoiceStatusMeta(inv.status).canSellerMarkPaid ? <button className="dev-btn dev-btn--secondary dev-btn--flex-grow dev-btn--success-color" onClick={() => void onInvoiceAction(inv.id, "mark_paid")}>{t.invoices.confirm}</button> : null}
                                {getInvoiceStatusMeta(inv.status).canSellerCancel ? <button className="dev-btn dev-btn--danger dev-btn--flex-grow" onClick={() => void onInvoiceAction(inv.id, "cancel")}>{t.invoices.cancel}</button> : null}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Modern Density-Optimized Table View Mode */
                    <div className="dev-card console-spotlight-card console-transactions-table-wrap" style={{ padding: '0', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <table className="console-transactions-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600 }}>{t.invoices.status}</th>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600 }}>{language === "ru" ? "Название" : "Invoice Title"}</th>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600 }}>{t.invoices.id}</th>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600 }}>{t.invoices.date}</th>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600, textAlign: 'right' }}>{t.invoices.amount}</th>
                            <th style={{ padding: '12px 16px', color: '#8f9cae', fontWeight: 600, textAlign: 'right' }}>{t.invoices.actions}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayInvoices.map(inv => {
                            const isOpen = expandedInvoice === inv.id;
                            const isMenuOpen = activeActionMenuId === inv.id;
                            return (
                              <React.Fragment key={inv.id}>
                                <tr className="console-transactions-table__row" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' }}>
                                  {/* Status badge */}
                                  <td className="console-transactions-table__status" data-label={t.invoices.status} style={{ padding: '14px 16px' }}>
                                    <span className={`dev-api-badge dev-status-badge dev-status-badge--${statusToneClass(inv.status)}`} title={getInvoiceStatusTooltip(inv.status, language) || undefined}>
                                      {formatInvoiceStatus(inv.status, language, true)}
                                    </span>
                                  </td>
                                  
                                  {/* Title & Network label */}
                                  <td className="console-transactions-table__title" data-label={language === "ru" ? "Название" : "Invoice Title"} style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontWeight: 500, color: '#ffffff' }}>{inv.title}</span>
                                      <span style={{ fontSize: '11px', color: '#8f9cae' }}>
                                        <NetworkPill network={inv.payable_network} className="dev-api-badge--micro" />
                                      </span>
                                    </div>
                                  </td>
                                  
                                  {/* Public ID with quick copy */}
                                  <td className="console-transactions-table__id" data-label={t.invoices.id} style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#e2e8f0' }}>
                                        {inv.public_id}
                                      </code>
                                      <button 
                                        onClick={() => handleCopy(inv.public_id, `id-${inv.id}`)}
                                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#8f9cae', display: 'flex', alignItems: 'center' }}
                                        title={t.invoices.copyId}
                                      >
                                        {copiedId === `id-${inv.id}` ? (
                                          <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 500 }}>{t.invoices.copiedShort}</span>
                                        ) : (
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                  
                                  {/* Date */}
                                  <td className="console-transactions-table__date" data-label={t.invoices.date} style={{ padding: '14px 16px', color: '#8f9cae' }}>
                                    {new Date(inv.created_at).toLocaleDateString()} <span style={{ fontSize: '11px', color: '#4a5568' }}>{new Date(inv.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </td>
                                  
                                  {/* Amount crypto + base usd */}
                                  <td className="console-transactions-table__amount" data-label={t.invoices.amount} style={{ padding: '14px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <span style={{ fontWeight: 600, color: '#ffffff' }}>
                                        <AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} />
                                      </span>
                                      <span style={{ fontSize: '11px', color: '#8f9cae' }}>
                                        ${Number(inv.base_amount_usd).toFixed(2)}
                                      </span>
                                    </div>
                                  </td>
                                  
                                  {/* Actions dropdown trigger */}
                                  <td className="console-transactions-table__actions" data-label={t.invoices.actions} style={{ padding: '14px 16px', textAlign: 'right', position: 'relative' }}>
                                    <div className="console-transactions-table__actions-inner" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                                      <button 
                                        className="dev-btn dev-btn--secondary dev-btn--compact"
                                        onClick={() => setExpandedInvoice(isOpen ? null : inv.id)}
                                        style={{ padding: '4px 8px', fontSize: '11px', minWidth: 'auto' }}
                                      >
                                        {isOpen ? t.invoices.hide : t.invoices.details}
                                      </button>
                                      
                                      <div className="console-transaction-menu" style={{ position: 'relative' }}>
                                        <button 
                                          className="dev-btn dev-btn--secondary dev-btn--compact"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(isMenuOpen ? null : inv.id);
                                          }}
                                          style={{ padding: '4px 6px', minWidth: 'auto' }}
                                        >
                                          &#8942;
                                        </button>
                                        
                                        {isMenuOpen && (
                                          <>
                                            <div 
                                              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                                              onClick={() => setActiveActionMenuId(null)}
                                            />
                                            <div className="console-transaction-menu__panel" style={{
                                              position: 'absolute',
                                              right: 0,
                                              top: '100%',
                                              marginTop: '4px',
                                              background: '#1a202c',
                                              border: '1px solid rgba(255,255,255,0.08)',
                                              borderRadius: '6px',
                                              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                              zIndex: 999,
                                              minWidth: '150px',
                                              textAlign: 'left',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              padding: '4px 0'
                                            }}>
                                              <button 
                                                className="dropdown-item" 
                                                style={{ background: 'none', border: 'none', color: '#e2e8f0', padding: '8px 12px', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '12px' }}
                                                onClick={() => { handleCopy(buildCheckoutUrl(inv.public_id), `inv-${inv.id}`); setActiveActionMenuId(null); }}
                                              >
                                                {copiedId === `inv-${inv.id}` ? t.common.copied : t.invoices.copyLink}
                                              </button>
                                              
                                              <a 
                                                href={buildCheckoutPath(inv.public_id)} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="dropdown-item"
                                                style={{ color: '#e2e8f0', padding: '8px 12px', width: '100%', textAlign: 'left', display: 'block', textDecoration: 'none', fontSize: '12px' }}
                                                onClick={() => setActiveActionMenuId(null)}
                                              >
                                                {t.invoices.view}
                                              </a>
                                              
                                              {getInvoiceStatusMeta(inv.status).canSellerMarkPaid && (
                                                <button 
                                                  className="dropdown-item" 
                                                  style={{ background: 'none', border: 'none', color: '#10b981', padding: '8px 12px', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '12px' }}
                                                  onClick={() => { void onInvoiceAction(inv.id, "mark_paid"); setActiveActionMenuId(null); }}
                                                >
                                                  {t.invoices.confirm}
                                                </button>
                                              )}
                                              
                                              {getInvoiceStatusMeta(inv.status).canSellerCancel && (
                                                <button 
                                                  className="dropdown-item" 
                                                  style={{ background: 'none', border: 'none', color: '#ef4444', padding: '8px 12px', width: '100%', textAlign: 'left', cursor: 'pointer', fontSize: '12px' }}
                                                  onClick={() => { void onInvoiceAction(inv.id, "cancel"); setActiveActionMenuId(null); }}
                                                >
                                                  {t.invoices.cancel}
                                                </button>
                                              )}
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                                
                                {/* Expandable details block */}
                                {isOpen && (
                                  <tr className="console-transactions-table__details-row" style={{ background: 'rgba(255,255,255,0.01)' }}>
                                    <td colSpan={6} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                      <div className="console-transactions-table__details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', fontSize: '12px' }}>
                                        <div>
                                          <div style={{ color: '#8f9cae', marginBottom: '4px' }}>{t.invoices.baseUsd}</div>
                                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>${Number(inv.base_amount_usd).toFixed(2)}</div>
                                        </div>
                                        <div>
                                          <div style={{ color: '#8f9cae', marginBottom: '4px' }}>{t.invoices.payable}</div>
                                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}><AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} /></div>
                                        </div>
                                        {Number(inv.received_amount) > 0 && (
                                          <div>
                                            <div style={{ color: '#8f9cae', marginBottom: '4px' }}>{t.invoices.received}</div>
                                            <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}><AssetAmount amount={inv.received_amount} asset={inv.payable_asset} network={inv.payable_network} /></div>
                                          </div>
                                        )}
                                        <div>
                                          <div style={{ color: '#8f9cae', marginBottom: '4px' }}>{t.invoices.created}</div>
                                          <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '14px' }}>{new Date(inv.created_at).toLocaleString()}</div>
                                        </div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                          <div style={{ color: '#8f9cae', marginBottom: '4px' }}>{t.invoices.txHash}</div>
                                          {inv.tx_hash ? (
                                            <div className="console-transactions-table__tx-value">
                                              <code className="console-transactions-table__tx-code" style={{ background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px', color: '#cbd5e0', wordBreak: 'break-all', fontSize: '11px' }}>
                                                {inv.tx_hash}
                                              </code>
                                              <button 
                                                className="dev-btn dev-btn--secondary dev-btn--compact" 
                                                onClick={() => handleCopy(inv.tx_hash || "", `tx-${inv.id}`)}
                                                style={{ padding: '2px 8px', minWidth: 'auto', fontSize: '10px' }}
                                              >
                                                {copiedId === `tx-${inv.id}` ? t.common.copied : t.invoices.copyTx}
                                              </button>
                                            </div>
                                          ) : (
                                            <span style={{ color: '#718096' }} className="dev-card__note-text">{t.invoices.noTx}</span>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="dev-pagination">
                  <button
                    className="dev-btn dev-btn--secondary"
                    disabled={session.invoicePage <= 1}
                    onClick={() => setInvoiceFilters(current => ({ ...current, page: Math.max(1, current.page - 1) }))}
                  >
                    {language === "ru" ? "Назад" : "Previous"}
                  </button>
                  <span className="dev-pagination__label">
                    {session.invoicePage} / {invoicePageCount}
                  </span>
                  <button
                    className="dev-btn dev-btn--secondary"
                    disabled={session.invoicePage >= invoicePageCount}
                    onClick={() => setInvoiceFilters(current => ({ ...current, page: Math.min(invoicePageCount, current.page + 1) }))}
                  >
                    {language === "ru" ? "Дальше" : "Next"}
                  </button>
                </div>
              </div>
            )}

            {activePanel === "create" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.create.title}</h2>
                  <p>{t.create.subtitle}</p>
                </div>
                <div className="dev-create-grid">
                  <div className="dev-card console-spotlight-card">
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <form onSubmit={onCreateInvoice} className="dev-form">
                      <div className="dev-input-group">
                        <label>{t.create.service}</label>
                        <input className="dev-input" value={invoiceForm.title} onChange={e => setInvoiceForm(c => ({ ...c, title: e.target.value }))} required />
                      </div>
                      <div className="dev-form__grid">
                        <div className="dev-input-group">
                          <label>{t.create.amount}</label>
                          <input className="dev-input" value={invoiceForm.amount} onChange={e => setInvoiceForm(c => ({ ...c, amount: e.target.value }))} required />
                        </div>
                        <div className="dev-input-group">
                          <label>{t.create.lifetime}</label>
                          <input className="dev-input" type="number" value={invoiceForm.ttl} onChange={e => setInvoiceForm(c => ({ ...c, ttl: Number(e.target.value) }))} required />
                        </div>
                      </div>
                      <div className="dev-input-group">
                        <label>{t.create.presets}</label>
                        <div className="dev-preset-row">
                          {AMOUNT_PRESETS.map(p => (
                            <button
                              type="button"
                              key={p}
                              className={`dev-preset-chip ${invoiceForm.amount === p ? "is-active" : ""}`}
                              onClick={() => setInvoiceForm(c => ({ ...c, amount: p }))}
                            >
                              ${p}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="dev-input-group">
                        <label>{t.create.network}</label>
                        <MultiSelect
                          values={invoiceForm.optionKeys}
                          options={payableNetworkOptions}
                          ariaLabel={t.create.network}
                          placeholder={t.create.network}
                          onChange={v => {
                            const selected = PAYABLE_PAYMENT_OPTIONS.find(option => option.key === v[0]);
                            setInvoiceForm(c => ({
                              ...c,
                              network: selected?.network ?? c.network,
                              optionKeys: v,
                            }));
                          }}
                        />
                      </div>
                      {Number(invoiceForm.amount) <= 0 && <p className="dev-resource-card__error">{t.create.amountInvalid}</p>}
                      {activeWalletsCount === 0 && (
                        <div style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0', display: 'flex', alignItems: 'flex-start', gap: '8px', background: 'rgba(139, 92, 246, 0.08)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.15)' }}>
                          <span style={{ color: '#8b5cf6' }}>💡</span>
                          <span>
                            {language === 'ru' 
                              ? 'Кошелек не настроен. Будет автоматически привязан демо-адрес и создан демонстрационный счет.' 
                              : 'No wallet configured. A demo address will be auto-linked to generate a preview invoice.'}
                          </span>
                        </div>
                      )}
                      <button 
                        type="submit" 
                        className={`dev-btn dev-btn--large ${activeWalletsCount === 0 ? 'dev-btn--primary-accent' : 'dev-btn--primary'}`} 
                        disabled={isCreatingInvoice || Number(invoiceForm.amount) <= 0}
                      >
                        {isCreatingInvoice 
                          ? t.common.creating 
                          : (activeWalletsCount === 0 
                              ? (language === 'ru' ? 'Создать демо-инвойс' : 'Create Demo Invoice') 
                              : t.create.generate
                            )
                        }
                      </button>
                    </form>
                  </div>

                  <div className="dev-card dev-create-preview console-spotlight-card">
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.create.preview}</h3>
                      <p>{t.create.previewHint}</p>
                    </div>
                    {createdInvoice ? (
                      <div className="dev-create-preview__body">
                        <QrImage value={createdInvoice.payment_uri || buildCheckoutUrl(createdInvoice.public_id)} alt={t.create.qrAlt} />
                        <div className="dev-create-preview__amount"><AssetAmount amount={createdInvoice.payable_amount} asset={createdInvoice.payable_asset} network={createdInvoice.payable_network} className="crypto-amount--large" /></div>
                        <div className="dev-card__note-text">{t.create.scanToPay}</div>
                        <code className="dev-input dev-input--readonly-box">{buildCheckoutUrl(createdInvoice.public_id)}</code>
                        <div className="dev-form__actions-row">
                          <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => handleCopy(buildCheckoutUrl(createdInvoice.public_id), "created-invoice")}>
                            {copiedId === "created-invoice" ? t.common.copied : t.invoices.copyLink}
                          </button>
                          <a className="dev-btn dev-btn--primary dev-btn--flex-grow dev-btn--centered" href={buildCheckoutPath(createdInvoice.public_id)} target="_blank" rel="noreferrer">{t.create.openLink}</a>
                        </div>
                      </div>
                    ) : (
                      <div className="dev-portal__empty-dashed">{t.create.noRecent}</div>
                    )}
                  </div>
                </div>

                {recentCreated.length > 0 && (
                  <div className="dev-card console-spotlight-card">
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.create.recent}</h3>
                    </div>
                    <div className="dev-resource-list">
                      {recentCreated.map(inv => (
                        <div key={inv.id} className="dev-resource-card">
                          <div className="dev-resource-card__info">
                            <div className="dev-resource-card__title">{inv.title}</div>
                            <div className="dev-resource-card__meta dev-resource-card__meta--row">
                              <NetworkPill network={inv.payable_network} className="dev-api-badge--micro" />
                              <span className="dev-resource-card__amount"><AssetAmount amount={inv.payable_amount} asset={inv.payable_asset} network={inv.payable_network} /></span>
                            </div>
                          </div>
                          <div className="dev-resource-card__actions">
                            <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => handleCopy(buildCheckoutUrl(inv.public_id), `recent-${inv.id}`)}>
                              {copiedId === `recent-${inv.id}` ? t.common.copied : t.common.url}
                            </button>
                            <a className="dev-btn dev-btn--secondary dev-btn--compact" href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer">{t.create.openLink}</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activePanel === "developer" && (
              <div className="dev-portal__section console-developer portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.developer.title}</h2>
                  <p>{t.developer.subtitle}</p>
                </div>

                {!(session.me.plan.has_api || environment === 'test' || import.meta.env.DEV) ? (
                  <div className="dev-portal__locked-state">
                    <h3>{t.developer.locked}</h3>
                    <button className="dev-btn dev-btn--primary" onClick={() => setActivePanel("billing")}>{t.promo.action}</button>
                  </div>
                ) : (
                  <>
                    {!session.me.plan.has_api && environment === 'test' && (
                      <div className="dev-card settings-profile-card" style={{ 
                        marginBottom: '1.5rem', 
                        background: 'linear-gradient(135deg, rgba(242, 177, 74, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)',
                        borderColor: 'rgba(242, 177, 74, 0.25)',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        padding: '1.25rem 1.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f2b14a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <div style={{ textAlign: 'left' }}>
                            <strong style={{ display: 'block', color: '#fff', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                              {language === 'ru' ? 'Тестовый доступ к API' : 'Test API Access'}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                              {language === 'ru' 
                                ? 'Вы тестируете API в тестовой сети. Перейдите на план Developer или Business для приема реальных платежей в Live-сети.'
                                : 'You are testing the API in test mode. Upgrade to Developer or Business plan to accept real payments in the Live network.'}
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          className="dev-btn dev-btn--primary dev-btn--compact" 
                          onClick={() => setActivePanel("billing")}
                          style={{ 
                            width: 'auto', 
                            padding: '0.5rem 1rem', 
                            background: 'linear-gradient(135deg, #f2b14a 0%, #e0972c 100%)',
                            border: 'none',
                            color: '#000',
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(242, 177, 74, 0.2)'
                          }}
                        >
                          {language === 'ru' ? 'Подключить Live' : 'Go Live / Upgrade'}
                        </button>
                      </div>
                    )}
                    {devUsage && (
                      <div className="dev-card console-spotlight-card console-developer__usage-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <div className="dev-portal__section-header dev-portal__section-header--margin">
                          <h3>{t.developer.usageTitle}</h3>
                          <p>{t.developer.usageSubtitle}</p>
                        </div>
                        <div className="dev-usage-list">
                          <UsageBar label={t.developer.monthlyUsage} value={devUsage.usage.monthly_requests} limit={devUsage.usage.monthly_limit} />
                          <UsageBar label={t.developer.minuteUsage} value={devUsage.usage.requests_this_min} limit={devUsage.usage.minute_limit} />
                          <UsageBar label={t.developer.keysUsage} value={devUsage.usage.active_api_keys} limit={devUsage.usage.api_key_limit} />
                          <UsageBar label={t.developer.hooksUsage} value={devUsage.usage.webhook_endpoints} limit={session.me.plan.webhook_limit ?? 0} />
                        </div>
                      </div>
                    )}

                    <div className="dev-card console-spotlight-card console-developer__quickstart-card">
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.quickstartTitle}</h3>
                        <p>{t.developer.quickstartSubtitle}</p>
                      </div>
                      <div className="dev-settings-row console-developer__base-url-row">
                        <span className="dev-settings-row__label">{t.developer.baseUrl}</span>
                        <div className="dev-invoice-details__tx-val">
                          <code className="dev-wallet-address">{apiBaseUrl}</code>
                          <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => handleCopy(apiBaseUrl, "base-url")}>
                            {copiedId === "base-url" ? t.common.copied : t.common.copy}
                          </button>
                        </div>
                      </div>
                      <div className="dev-code-box dev-code-box--inline">
                        <div className="dev-code-box__header">
                          <span className="dev-code-box__tab is-active">cURL</span>
                          <button className="dev-code-box__copy" onClick={() => handleCopy(apiSnippet, "api-snippet")}>
                            {copiedId === "api-snippet" ? t.common.copied : t.common.copy}
                          </button>
                        </div>
                        <pre className="dev-code-box__content dev-code-box__content--compact">{apiSnippet}</pre>
                      </div>
                      <p className="dev-card__note-text">{t.developer.snippetHint}</p>
                    </div>

                    <div className="dev-card console-spotlight-card console-developer__keys-card">
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.keysTitle}</h3>
                        <p>{t.developer.keysSubtitle}</p>
                      </div>
                      <form onSubmit={onCreateKey} className="dev-form">
                        <div className="dev-form__row-grid console-developer__key-form">
                          <div className="dev-input-group">
                            <label>{t.developer.keyLabel}</label>
                            <input className="dev-input" value={keyForm.label} onChange={e => setKeyForm({ label: e.target.value })} placeholder="Production App" required />
                          </div>
                          <button type="submit" className="dev-btn dev-btn--primary">{t.developer.addKey}</button>
                        </div>
                      </form>

                      {latestKeySecret && (
                        <div className="alert alert--success alert--secret">
                          <div>
                            <small className="alert__label">{t.developer.warning}</small>
                            <code className="alert__code">{latestKeySecret}</code>
                          </div>
                          <button className="dev-code-box__copy" onClick={() => handleCopy(latestKeySecret, "latest-key")}>
                            {copiedId === "latest-key" ? t.common.copied : t.common.copy}
                          </button>
                        </div>
                      )}

                      <div className="dev-resource-list dev-resource-list--margin console-developer__resource-list">
                        {filteredKeys.length === 0 ? (
                          <div className="dev-portal__empty-state">{t.developer.noKeys}</div>
                        ) : filteredKeys.map(key => (
                          <div key={key.id} className="dev-resource-card console-developer__key-row">
                            <div className="dev-resource-card__info">
                              <div className="dev-resource-card__title">{key.label}</div>
                              <code className="dev-resource-card__meta">{key.prefix}***</code>
                            </div>
                            <button className="dev-btn dev-btn--danger" onClick={() => void onDeleteKey(key.id)}>{t.common.delete}</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dev-card console-spotlight-card console-developer__hooks-card">
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.hooksTitle}</h3>
                        <p>{t.developer.hooksSubtitle}</p>
                      </div>
                      <form onSubmit={onCreateHook} className="dev-form">
                        <div className="dev-webhook-form-grid console-developer__webhook-form">
                          <div className="dev-input-group">
                            <label>{t.common.label}</label>
                            <input className="dev-input" value={hookForm.label} onChange={e => setHookForm({ ...hookForm, label: e.target.value })} placeholder="Main Server" required />
                          </div>
                          <div className="dev-input-group">
                            <label>{t.developer.hookUrl}</label>
                            <input className="dev-input" value={hookForm.url} onChange={e => setHookForm({ ...hookForm, url: e.target.value })} placeholder="https://api.yoursite.com/webhook" required />
                          </div>
                          <button type="submit" className="dev-btn dev-btn--primary dev-webhook-add-btn">{t.developer.addHook}</button>
                        </div>
                      </form>

                      {latestWebhookSecret && (
                        <div className="alert alert--warning">
                          <div>
                            <strong>{t.developer.warning}</strong>
                            <code className="alert__code">{latestWebhookSecret}</code>
                          </div>
                          <button className="dev-code-box__copy" onClick={() => handleCopy(latestWebhookSecret, "latest-webhook")}>
                            {copiedId === "latest-webhook" ? t.common.copied : t.common.copy}
                          </button>
                        </div>
                      )}

                      <div className="dev-resource-list dev-resource-list--margin console-developer__resource-list">
                        {filteredHooks.length === 0 ? (
                          <div className="dev-portal__empty-state">{t.developer.noEndpoints}</div>
                        ) : filteredHooks.map(hook => (
                          <div key={hook.id} className="dev-resource-card dev-resource-card--column console-developer__hook-row">
                            <div className="dev-resource-card__header">
                              <div className="dev-resource-card__info">
                                <div className="dev-resource-card__title">{hook.label}</div>
                                <code className="dev-resource-card__url">{hook.url}</code>
                              </div>
                              <div className="dev-resource-card__actions">
                                <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void onRotateHook(hook.id)}>{t.developer.rotate}</button>
                                <button className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void onDeleteHook(hook.id)}>{t.common.delete}</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dev-card console-spotlight-card console-developer__deliveries-card">
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.deliveriesTitle}</h3>
                        <p>{t.developer.deliveriesSubtitle}</p>
                      </div>
                      {(() => {
                        const envDeliveries = showDemoData
                          ? MOCK_DELIVERIES.filter(d => d.environment === environment)
                          : deliveries.filter(d => d.environment === environment);
                        if (envDeliveries.length === 0) {
                          return <div className="dev-portal__empty-state">{t.developer.noDeliveries}</div>;
                        }
                        return (
                          <div className="dev-resource-list console-developer__resource-list console-developer__deliveries-list">
                            {envDeliveries.map(d => {
                              const tone = d.status === "delivered" ? "success" : d.status === "failed" || d.status === "exhausted" ? "danger" : "warning";
                              return (
                                <div key={d.id} className="dev-resource-card console-developer__delivery-row">
                                  <div className="dev-resource-card__info">
                                    <div className="dev-resource-card__title">
                                      <span className={`dev-status-dot dev-status-dot--${tone}`} /> {d.event_type}
                                    </div>
                                    <div className="dev-resource-card__meta dev-resource-card__meta--row">
                                      <span className={`dev-api-badge dev-status-badge dev-status-badge--${tone} dev-api-badge--micro`}>{d.status}</span>
                                      <span>{d.attempts}/{d.max_attempts} {t.developer.attempts}</span>
                                      {d.last_http_status ? <span>{t.developer.lastStatus} {d.last_http_status}</span> : null}
                                      <span>{new Date(d.created_at).toLocaleString()}</span>
                                    </div>
                                    {d.last_error ? <div className="dev-resource-card__error">{d.last_error}</div> : null}
                                  </div>
                                  <button
                                    className="dev-btn dev-btn--secondary dev-btn--compact"
                                    disabled={resendingId === d.id}
                                    onClick={() => void onResendDelivery(d.id)}
                                  >
                                    {resendingId === d.id ? t.developer.resending : t.developer.resend}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

            {activePanel === "team" && (() => {
              const displayTeam = showDemoData ? MOCK_TEAM : team;
              const isLocked = !(session.me.plan.code === 'business' || import.meta.env.DEV);

              if (isLocked) {
                return (
                  <div className="dev-portal__section portal-animate-in">
                    <div className="dev-portal__section-header">
                      <h2>{t.team.title}</h2>
                      <p>{t.team.subtitle}</p>
                    </div>
                    <div className="dev-portal__locked-state">
                      <div className="dev-locked-glow" />
                      <svg className="dev-locked-icon" viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--accent)", marginBottom: "0.5rem" }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <h3>{t.team.locked}</h3>
                      <p style={{ maxWidth: "460px", marginBottom: "1rem" }}>{t.team.lockedSub}</p>
                      <button className="dev-btn dev-btn--primary" onClick={() => setActivePanel("billing")}>
                        {t.team.lockedAction}
                      </button>
                    </div>
                  </div>
                );
              }

              const myRole: MemberRole = displayTeam?.my_role ?? "member";
              const canManage = myRole === "owner" || myRole === "admin";
              const isOwner = myRole === "owner";
              const meTelegramId = session.me.user.telegram_id;
              const members = displayTeam?.members ?? [];
              const invites = displayTeam?.invites ?? [];
              const ownerCount = members.filter(m => m.role === "owner").length;
              const roleLabel = (r: MemberRole) => r === "owner" ? t.team.roleOwner : r === "admin" ? t.team.roleAdmin : t.team.roleMember;
              const roleTone = (r: MemberRole) => r === "owner" ? "post" : r === "admin" ? "get" : "secondary";
              const roleSelectOptions = [
                { value: "owner", label: t.team.roleOwner },
                { value: "admin", label: t.team.roleAdmin },
                { value: "member", label: t.team.roleMember },
              ];
              const inviteRoleOptions = (isOwner ? roleSelectOptions : roleSelectOptions.filter(o => o.value !== "owner"));

              const activeSeats = members.length + invites.length;
              const maxSeats = showDemoData ? 10 : (session.me.plan.max_seats ?? 1);

              return (
              <div className="dev-portal__section console-team portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.team.title}</h2>
                  <p>{t.team.subtitle}</p>
                </div>

                {/* Card 1: Members list */}
                <div className="dev-card console-spotlight-card console-team__members-card">
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin dev-team-seats-header-inline">
                    <h3>{t.team.membersTitle} ({members.length})</h3>
                    <div className="dev-team-seats-summary-inline">
                      <span className="dev-team-seats-label-inline">{language === 'ru' ? 'Использование мест:' : 'Seat usage:'}</span>
                      <strong className="dev-team-seats-count-inline">{activeSeats} / {maxSeats}</strong>
                      <div className="dev-team-seats-bar-inline">
                        <div className="dev-team-seats-fill-inline" style={{ width: `${Math.min(100, (activeSeats / maxSeats) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                  {!canManage && <p className="dev-team-manage-hint-inline">{t.team.manageHint}</p>}
                  
                  <div className="dev-resource-list console-team__member-list">
                    {members.map(m => {
                      const isSelf = m.telegram_id === meTelegramId;
                      const displayName = m.username ? `@${m.username}` : `#${m.telegram_id}`;
                      const isLastOwner = m.role === "owner" && ownerCount <= 1;
                      const canEditRole = isOwner && !isLastOwner;
                      const canRemove = (isSelf && !isLastOwner) || (canManage && !isSelf && !(myRole === "admin" && m.role !== "member") && !isLastOwner);
                      const initial = (m.username ? m.username.charAt(0) : "U").toUpperCase();
                      return (
                        <div key={m.user_id} className="dev-resource-card dev-team-member-row-inline">
                          <div className="dev-team-member-profile-inline">
                            <div className={`dev-team-avatar-icon-inline dev-team-avatar-icon-inline--${m.role}`}>
                              {initial}
                            </div>
                            <div className="dev-resource-card__info">
                              <div className="dev-resource-card__title">
                                {displayName}{isSelf ? <span className="dev-team-you-badge-inline"> ({t.team.you})</span> : null}
                              </div>
                              {m.email ? <div className="dev-resource-card__meta">{m.email}</div> : null}
                            </div>
                          </div>
                          
                          <div className="dev-team-member-controls-inline">
                            {canEditRole ? (
                              <div className="dev-team-role-select-inline">
                                <CustomSelect
                                  value={m.role}
                                  options={roleSelectOptions}
                                  ariaLabel={t.team.changeRole}
                                  onChange={(v) => void onChangeMemberRole(m.user_id, v as MemberRole)}
                                />
                              </div>
                            ) : (
                              <span className={`dev-api-badge dev-api-badge--${roleTone(m.role)} dev-team-role-badge-static`}>{roleLabel(m.role)}</span>
                            )}
                            <div className="dev-team-action-inline">
                              {canRemove ? (
                                <button className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void onRemoveMember(m.user_id, isSelf)}>
                                  {isSelf ? t.team.leave : t.team.remove}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Invite Member */}
                {canManage && (
                  <div className="dev-card console-spotlight-card console-team__invite-card" style={{ marginTop: "1.5rem" }}>
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.team.add}</h3>
                      <p>{t.team.inviteHint}</p>
                    </div>
                    <form onSubmit={onInviteMember} className="dev-form">
                      <div className="dev-team-invite-form-row">
                        <div className="dev-input-group" style={{ flex: 1, minWidth: "200px" }}>
                          <label>{t.team.name}</label>
                          <input
                            className="dev-input"
                            value={inviteForm.username}
                            onChange={e => setInviteForm(c => ({ ...c, username: e.target.value }))}
                            placeholder={t.team.invitePlaceholder}
                            required
                          />
                        </div>
                        <div className="dev-input-group" style={{ width: "180px", minWidth: "150px" }}>
                          <label>{t.team.role}</label>
                          <CustomSelect
                            value={inviteForm.role}
                            options={inviteRoleOptions}
                            ariaLabel={t.team.role}
                            onChange={(v) => setInviteForm(c => ({ ...c, role: v as MemberRole }))}
                          />
                        </div>
                        <button type="submit" className="dev-btn dev-btn--primary dev-team-invite-submit-btn" disabled={invitingMember || !inviteForm.username.trim()}>
                          {invitingMember ? t.team.inviting : t.team.inviteAction}
                        </button>
                      </div>
                    </form>
                    {teamNotice ? <div className="alert alert--success alert--margin">{teamNotice}</div> : null}
                  </div>
                )}

                {/* Card 3: Pending Invites */}
                {canManage && invites.length > 0 && (
                  <div className="dev-card console-spotlight-card console-team__pending-card" style={{ marginTop: "1.5rem" }}>
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.team.invitesTitle}</h3>
                    </div>
                    <div className="dev-resource-list console-team__invite-list">
                      {invites.map(inv => (
                        <div key={inv.id} className="dev-resource-card dev-team-invite-card-row">
                          <div className="dev-team-invite-username-col">
                            <div className="dev-team-invite-avatar-placeholder">@</div>
                            <div className="dev-resource-card__info">
                              <div className="dev-resource-card__title">@{inv.invited_username}</div>
                              <div className="dev-resource-card__meta">{t.team.invitedAs} <strong>{roleLabel(inv.role)}</strong></div>
                            </div>
                          </div>
                          <button className="dev-btn dev-btn--secondary dev-btn--compact dev-team-revoke-btn-inline" onClick={() => void onRevokeInvite(inv.id)}>{t.team.revoke}</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              );
            })()}

            {activePanel === "billing" && (
              <div className="dev-portal__section console-billing portal-animate-in">
                {/* Redesigned Premium Billing Status Header */}
                <div className="billing-status-banner">
                  <div className="billing-status-banner__info">
                    <div className="billing-status-banner__title-group">
                      <h2>{t.billing.title}</h2>
                      <p>{t.billing.subtitle}</p>
                    </div>
                  </div>
                  
                  <div className="billing-status-card">
                    <span className="billing-status-card__label">
                      {language === 'ru' ? 'Текущий тариф' : 'Current Plan'}
                    </span>
                    <div className="billing-status-card__plan-row">
                      <strong className="billing-status-card__plan-name">
                        {session.me.plan.name}
                      </strong>
                      {session.me.plan.code !== 'trial' && (
                        <span className={`billing-status-card__badge billing-status-card__badge--${session.me.plan.code}`}>
                          {language === 'ru' ? 'Активен' : 'Active'}
                        </span>
                      )}
                    </div>
                    
                    <div className="billing-status-card__details">
                      {(() => {
                        const endsAt = session.me.workspace.subscription_ends_at;
                        if (session.me.plan.code === 'trial') {
                          return (
                            <span className="billing-status-card__expiry-text">
                              {language === 'ru' 
                                ? 'Тестовый доступ. Выберите тариф ниже для активации.' 
                                : 'Trial access. Select a plan below to upgrade.'}
                            </span>
                          );
                        } else if (endsAt) {
                          const diffTime = new Date(endsAt).getTime() - Date.now();
                          const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          const formattedDate = new Date(endsAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          if (remainingDays > 0) {
                            return (
                              <span className="billing-status-card__expiry-text">
                                {language === 'ru' 
                                  ? `Действует до ${formattedDate} (осталось ${remainingDays} дн.)` 
                                  : `Active until ${formattedDate} (${remainingDays} days left)`}
                              </span>
                            );
                          } else {
                            return (
                              <span className="billing-status-card__expiry-text billing-status-card__expiry-text--expired">
                                {language === 'ru' 
                                  ? `Истёк ${formattedDate}` 
                                  : `Expired on ${formattedDate}`}
                              </span>
                            );
                          }
                        } else {
                          return (
                            <span className="billing-status-card__expiry-text">
                              {language === 'ru' ? 'Подписка активна' : 'Subscription active'}
                            </span>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>

                {(() => {
                  const fmt = (n: number | undefined, available = true) => {
                    if (!available) return t.billing.notIncluded;
                    return n && n > 0 ? n.toLocaleString() : t.common.unlimited;
                  };
                  const comparePlans = PLAN_COMPARE_ORDER
                    .map(code => session.me.plans.find(p => p.code === code))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p));
                  
                  const planDescriptions: Record<string, { en: string; ru: string }> = {
                    merchant: {
                      en: "Ideal for simple online stores & digital sales via payment links. Zero development required.",
                      ru: "Идеально для простых онлайн-магазинов и продаж по платежным ссылкам без разработки."
                    },
                    developer: {
                      en: "Best for developers building custom checkouts. Includes REST API access & webhooks.",
                      ru: "Лучший выбор для разработчиков. Доступ к REST API, вебхукам и интеграциям."
                    },
                    business: {
                      en: "For growing teams and high-volume operations. Priority support & advanced limits.",
                      ru: "Для растущих команд и больших объемов продаж. Приоритетная поддержка и лимиты."
                    }
                  };

                  const featRow = (label: string, on: boolean) => (
                    <div className={`dev-plan-feat ${!on ? "dev-plan-feat--dimmed" : ""}`}>
                      <span className={`dev-plan-feat__icon dev-plan-feat__icon--${on ? "yes" : "no"}`}>{on ? "✓" : "—"}</span>
                      <span>{label}</span>
                    </div>
                  );
                  
                  return (
                    <div className="dev-card console-billing__plans-card console-spotlight-card">
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.billing.comparisonTitle}</h3>
                        <p>{t.billing.comparisonSubtitle}</p>
                      </div>
                      <div className="dev-plan-grid console-billing__plan-grid">
                        {comparePlans.map(plan => {
                          const isCurrent = plan.code === session.me.plan.code;
                          const isSelected = plan.code === billingForm.plan;
                          const descLanguage = language === "ru" ? "ru" : "en";
                          const desc = planDescriptions[plan.code]?.[descLanguage] || "";
                          
                          return (
                            <div key={plan.code} className={`dev-plan-card console-billing__plan-card console-spotlight-card ${isSelected ? "is-selected" : ""} ${isCurrent ? "is-current" : ""}`}>
                              <div className="console-card-spotlight" />
                              <div className="console-dogfood-glow" />
                              <div className="dev-plan-card__head">
                                <span className="dev-plan-card__name">{plan.name}</span>
                                {isCurrent && <span className="dev-api-badge dev-api-badge--get dev-api-badge--micro">{t.billing.currentBadge}</span>}
                              </div>
                              
                              {(() => {
                                const dPct = session.me.workspace.discount_percent || 0;
                                const dPlan = session.me.workspace.discount_plan_code;
                                const hasD = dPct > 0 && (!dPlan || dPlan === plan.code);
                                if (hasD) {
                                  const originalPrice = Number(plan.price_usd);
                                  const discountedPrice = originalPrice * (1 - dPct / 100);
                                  const formattedPrice = discountedPrice % 1 === 0 ? String(discountedPrice) : discountedPrice.toFixed(2);
                                  return (
                                    <div className="dev-plan-card__price">
                                      <span style={{ textDecoration: "line-through", opacity: 0.6, fontSize: "0.85em", marginRight: "0.5rem" }}>
                                        ${plan.price_usd}
                                      </span>
                                      <span style={{ color: "#27c24c", fontWeight: "bold" }}>
                                        ${formattedPrice}
                                      </span>
                                      <span className="dev-plan-card__period">{t.billing.perMonth}</span>
                                      <div style={{ fontSize: "0.68em", color: "#27c24c", marginTop: "0.25rem", fontWeight: "normal" }}>
                                        {language === 'ru' ? `(скидка ${dPct}% применена)` : `(${dPct}% discount applied)`}
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="dev-plan-card__price">${plan.price_usd}<span className="dev-plan-card__period">{t.billing.perMonth}</span></div>
                                );
                              })()}
                              
                              <p className="dev-plan-card__description">{desc}</p>
                              
                              <div className="dev-plan-card__feats">
                                {featRow(t.billing.featApi, plan.has_api)}
                                {featRow(t.billing.featWebhooks, plan.has_webhooks)}
                                {featRow(t.billing.featUnlimited, plan.has_unlimited_sales)}
                                {featRow(t.billing.featPriority, plan.priority_support)}
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featKeys}</span><strong>{fmt(plan.api_key_limit, plan.has_api)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featRpm}</span><strong>{fmt(plan.requests_per_minute, plan.has_api)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featMonthly}</span><strong>{fmt(plan.monthly_request_cap, plan.has_api)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featRetries}</span><strong>{fmt(plan.webhook_retries, plan.has_webhooks)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featSeats}</span><strong>{fmt(plan.max_seats)}</strong>
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`dev-btn ${isSelected ? "dev-btn--primary" : "dev-btn--secondary"} dev-btn--full-width`}
                                disabled={isCurrent}
                                onClick={() => {
                                  setCheckoutUrl("");
                                  setBillingForm(c => ({ ...c, plan: plan.code }));
                                }}
                              >
                                {isCurrent ? t.billing.currentBadge : t.billing.selectPlan}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                <h3 className="checkout-section-title">
                  {language === 'ru' ? 'Оформление подписки' : 'Checkout & Upgrade'}
                </h3>

                <div className="dev-card billing-checkout-container console-billing__checkout console-spotlight-card">
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  
                  {checkoutUrl ? (
                    <div className="billing-checkout-success console-billing__success" style={{ gridColumn: "span 2" }}>
                      <div className="success-icon-wrapper">✓</div>
                      <h4 className="success-title">
                        {language === 'ru' ? 'Счёт успешно создан!' : 'Invoice Generated Successfully!'}
                      </h4>
                      <p className="success-subtitle">
                        {language === 'ru' 
                          ? 'Счёт готов к оплате криптовалютой. Выберите любую удобную для вас сеть и монету на странице оплаты.' 
                          : 'Your subscription invoice is ready. You can complete the payment in any network/asset on the payment checkout page.'}
                      </p>
                      
                      <div className="success-actions-row">
                        <a href={checkoutUrl} target="_blank" rel="noreferrer" className="dev-btn dev-btn--primary dev-btn--flex-grow dev-btn--centered">
                          {t.common.payNow || 'Pay Now'}
                        </a>
                        <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => handleCopy(checkoutUrl, "billing-url")}>
                          {copiedId === "billing-url" ? t.common.copied : t.common.copy}
                        </button>
                      </div>
                      
                      <button className="success-back-button" onClick={() => setCheckoutUrl("")}>
                        {language === 'ru' ? '← Изменить тариф или срок' : '← Change plan or duration'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="billing-checkout__left">
                        <div className="dev-form">
                          <div className="console-billing__selected-label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
                            <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: "600" }}>
                              {language === 'ru' ? 'Выбранный тариф' : 'Selected Plan'}
                            </span>
                          </div>
                          <div className="console-billing__selected-plan" style={{ fontSize: "1.4rem", fontWeight: "800", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
                            {(() => {
                              const plan = session.me.plans.find(p => p.code === billingForm.plan);
                              return plan ? plan.name : billingForm.plan;
                            })()}
                          </div>
                          
                          <div className="billing-duration-selector" style={{ marginTop: "1.5rem" }}>
                            <label style={{ fontSize: "0.85rem", color: "var(--muted)", fontWeight: "600" }}>
                              {t.billing.durationDays || "Duration (days)"}
                            </label>
                            
                            <div className="duration-presets console-billing__duration-presets">
                              {[
                                { days: 30, label: language === 'ru' ? '30 дней' : '30 Days' },
                                { days: 90, label: language === 'ru' ? '90 дней' : '90 Days' },
                                { days: 180, label: language === 'ru' ? '180 дней' : '180 Days' },
                                { days: 365, label: language === 'ru' ? '365 дней' : '365 Days' }
                              ].map(preset => (
                                <button
                                  key={preset.days}
                                  type="button"
                                  className={`preset-pill ${billingForm.subscriptionDays === preset.days ? 'is-active' : ''}`}
                                  onClick={() => {
                                    setCheckoutUrl("");
                                    setBillingForm(c => ({ ...c, subscriptionDays: preset.days }));
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>
                            
                            <div className="dev-input-group" style={{ marginTop: "0.5rem" }}>
                              <input
                                type="number"
                                min="14"
                                className="dev-input"
                                value={billingForm.subscriptionDays}
                                onChange={e => {
                                  const val = parseInt(e.target.value, 10);
                                  setCheckoutUrl("");
                                  setBillingForm(c => ({ ...c, subscriptionDays: isNaN(val) ? 30 : val }));
                                }}
                              />
                              <span className="dev-input-hint" style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "0.25rem" }}>
                                {t.billing.durationDaysHint || "Minimum 14 days"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="billing-checkout__right">
                        <div className="billing-price-summary">
                          <span style={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: "0.05em", color: "var(--muted)", fontWeight: "600" }}>
                            {language === 'ru' ? 'Детали цены' : 'Pricing Details'}
                          </span>
                          
                          {(() => {
                            const selectedPlan = session.me.plans.find(p => p.code === billingForm.plan);
                            if (!selectedPlan) return null;
                            const days = billingForm.subscriptionDays;
                            const dailyRate = Number(selectedPlan.price_usd) / 30;
                            const totalPrice = dailyRate * days;
                            const dPct = session.me.workspace.discount_percent || 0;
                            const dPlan = session.me.workspace.discount_plan_code;
                            const hasD = dPct > 0 && (!dPlan || dPlan === selectedPlan.code);
                            const finalPrice = hasD ? totalPrice * (1 - dPct / 100) : totalPrice;
                            
                            return (
                              <>
                                <div className="price-summary-row" style={{ marginTop: "0.5rem" }}>
                                  <span>{language === 'ru' ? 'Базовый тариф' : 'Base rate'}</span>
                                  <span>${selectedPlan.price_usd} / {language === 'ru' ? '30 дн.' : '30 days'}</span>
                                </div>
                                <div className="price-summary-row">
                                  <span>{language === 'ru' ? 'Срок подписки' : 'Duration'}</span>
                                  <span>{days} {language === 'ru' ? 'дн.' : 'days'}</span>
                                </div>
                                <div className="price-summary-row">
                                  <span>{language === 'ru' ? 'Промежуточный итог' : 'Subtotal'}</span>
                                  <span>${totalPrice.toFixed(2)} USD</span>
                                </div>
                                {hasD && (
                                  <div className="price-summary-row">
                                    <span>{language === 'ru' ? 'Скидка' : 'Discount'} ({dPct}%)</span>
                                    <span className="price-summary-value--discount">-${(totalPrice - finalPrice).toFixed(2)} USD</span>
                                  </div>
                                )}
                                <div className="price-summary-row price-summary-row--total">
                                  <span>{language === 'ru' ? 'Итого к оплате' : 'Estimated Total'}</span>
                                  <strong style={{ fontSize: "1.25rem", color: "#fff" }}>${finalPrice.toFixed(2)} USD</strong>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="console-billing__promo" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
                          <label style={{ fontSize: "0.8rem", color: "var(--muted)", fontWeight: "600", display: "block", marginBottom: "0.4rem" }}>
                            {t.billing.promoCodeLabel}
                          </label>
                          
                          {promoNotice && (
                            <div className="alert alert--success console-billing__promo-alert" style={{ padding: "0.4rem 0.6rem", fontSize: "0.78rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                              <span>{promoNotice}</span>
                              <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setPromoNotice("")}>×</span>
                            </div>
                          )}
                          {promoError && (
                            <div className="alert console-billing__promo-alert" style={{ padding: "0.4rem 0.6rem", fontSize: "0.78rem", color: "#ff4d4f", borderColor: "#ff4d4f", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between" }}>
                              <span>{promoError}</span>
                              <span style={{ cursor: "pointer", fontWeight: "bold" }} onClick={() => setPromoError("")}>×</span>
                            </div>
                          )}
                          
                          <div className="billing-promo-input-row console-billing__promo-input-row">
                            <input
                              type="text"
                              className="dev-input"
                              placeholder="SUMMER30"
                              value={promoCode}
                              onChange={e => setPromoCode(e.target.value.toUpperCase())}
                              style={{ flex: 1, padding: "0.4rem 0.60rem", fontSize: "0.85rem" }}
                            />
                            <button
                              type="button"
                              className="dev-btn dev-btn--secondary"
                              onClick={onRedeemPromoCode}
                              disabled={!promoCode.trim() || redeemingPromo}
                              style={{ padding: "0 0.75rem", height: "auto" }}
                            >
                              {redeemingPromo ? t.common.loading : (language === 'ru' ? 'ОК' : 'Apply')}
                            </button>
                          </div>
                        </div>
                        
                        <div className="console-billing__network-note" style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: "1.4", opacity: 0.8 }}>
                          {language === 'ru' 
                            ? 'Сгенерированный счёт можно оплатить любой криптовалютой во всех популярных сетях (TON, TRON, BSC, Solana, Base, Arbitrum).' 
                            : 'All major crypto networks are supported at checkout (TON, TRON, BSC, Solana, Base, Arbitrum).'}
                        </div>
                        
                        <button
                          type="button"
                          className="dev-btn dev-btn--primary dev-btn--full-width console-billing__create-btn"
                          onClick={onUpgrade}
                          style={{ marginTop: "0.5rem" }}
                        >
                          {language === 'ru' ? 'Создать счёт' : 'Create Invoice'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {activePanel === "settings" && (() => {
              const isTrial = session.me.plan.code === 'trial';
              const endsAt = session.me.workspace.subscription_ends_at;
              let subscriptionExpiryMsg = "";
              if (isTrial) {
                subscriptionExpiryMsg = language === 'ru' 
                  ? 'Тестовый доступ. Выберите тариф для активации.' 
                  : 'Trial access. Select a plan to upgrade.';
              } else if (endsAt) {
                const diffTime = new Date(endsAt).getTime() - Date.now();
                const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const formattedDate = new Date(endsAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
                if (remainingDays > 0) {
                  subscriptionExpiryMsg = language === 'ru' 
                    ? `Действует до ${formattedDate} (осталось ${remainingDays} дн.)` 
                    : `Active until ${formattedDate} (${remainingDays} days left)`;
                } else {
                  subscriptionExpiryMsg = language === 'ru' 
                    ? `Истёк ${formattedDate}` 
                    : `Expired on ${formattedDate}`;
                }
              } else {
                subscriptionExpiryMsg = language === 'ru' ? 'Подписка активна' : 'Subscription active';
              }

              const upgradeButtonLabel = language === 'ru' 
                ? (isTrial ? 'Купить подписку' : 'Продлить или изменить тариф')
                : (isTrial ? 'Buy Subscription' : 'Extend / Manage Plan');

              const displayProfileName = session.me.workspace.email || session.me.user.username || workspaceName;

              const rpmLimit = typeof session.me.plan.requests_per_minute === 'number' 
                ? session.me.plan.requests_per_minute 
                : ((session.me.plan as any).rpm_limit as number | undefined);
              const monthlyCap = typeof session.me.plan.monthly_request_cap === 'number' 
                ? session.me.plan.monthly_request_cap 
                : ((session.me.plan as any).monthly_cap as number | undefined);

              return (
                <div className="dev-portal__section console-settings portal-animate-in">
                  <div className="dev-portal__section-header">
                    <h2>{t.settings.title}</h2>
                    <p>{t.settings.subtitle}</p>
                  </div>
                  
                  <div className="settings-dashboard-grid">
                    {/* Left Column */}
                    <div className="dev-settings-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Profile & Subscription Card */}
                      <div className="dev-card settings-profile-card console-settings__profile-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        
                        <div className="settings-profile-header">
                          <div className="settings-avatar-circle">
                            {displayProfileName ? displayProfileName[0] : 'U'}
                          </div>
                          <div className="settings-profile-info">
                            <h3 className="settings-profile-title">{displayProfileName}</h3>
                            <p className="settings-profile-subtitle" style={{ color: 'var(--muted)' }}>
                              {t.settings.workspaceId}: #{session.me.workspace.id} ({workspaceName})
                            </p>
                            <p className="settings-profile-subtitle" style={{ color: 'var(--muted)' }}>
                              {t.settings.memberSince}: {new Date(session.me.workspace.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="settings-divider" />

                        <div className="settings-subscription-status">
                          <div className="settings-subscription-header">
                            <span className="settings-subscription-label">{t.settings.planLabel}</span>
                            <span className={`billing-status-card__badge billing-status-card__badge--${session.me.plan.code}`}>
                              {session.me.plan.name}
                            </span>
                          </div>
                          <div className="settings-expiry-text">
                            {subscriptionExpiryMsg}
                          </div>
                        </div>

                        <button 
                          type="button" 
                          className="settings-upgrade-btn"
                          onClick={() => setActivePanel("billing")}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {upgradeButtonLabel}
                        </button>
                      </div>

                      {/* Network environment mode switcher */}
                      <div className="dev-card settings-profile-card console-settings__env-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <div className="dev-portal__section-header dev-portal__section-header--margin" style={{ marginBottom: '1rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{language === 'ru' ? 'Режим сети' : 'Network Environment'}</h3>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                            {language === 'ru' 
                              ? 'Выберите Live (реальные транзакции) или Test (симуляция).' 
                              : 'Toggle between Live (real transactions) and Test (simulated sandbox) environments.'}
                          </p>
                        </div>
                        <div className="settings-env-toggle">
                          <button 
                            type="button"
                            className={`settings-env-btn ${environment === 'live' ? 'active live' : ''}`}
                            onClick={() => setEnvironment('live')}
                          >
                            {t.common.liveMode}
                          </button>
                          <button 
                            type="button"
                            className={`settings-env-btn ${environment === 'test' ? 'active test' : ''}`}
                            onClick={() => setEnvironment('test')}
                          >
                            {t.common.testMode}
                          </button>
                        </div>
                      </div>

                      {/* Interface Language & Logout Card */}
                      <div className="dev-card settings-profile-card console-settings__session-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <div className="dev-input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                            {t.settings.language}
                          </label>
                          <LanguageSelect value={language} onChange={(next) => void onSetLanguage(next)} ariaLabel={t.settings.language} className="console-language-picker" menuPlacement="bottom" />
                        </div>

                        <div className="settings-logout-row">
                          <div>
                            <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>{t.settings.session}</strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.settings.logoutHint}</span>
                          </div>
                          <button 
                            type="button"
                            className="dev-btn dev-btn--compact settings-logout-btn" 
                            onClick={handleLogout}
                            style={{ width: 'auto', minWidth: '100px' }}
                          >
                            {t.nav.logout}
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Right Column */}
                    <div className="dev-settings-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Contact Email card */}
                      <div className="dev-card settings-profile-card console-settings__email-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <form onSubmit={onUpdateEmail} className="dev-form" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div className="dev-input-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                              {t.settings.email}
                            </label>
                            <input
                              className="dev-input"
                              type="email"
                              value={emailForm}
                              placeholder={t.settings.emailPlaceholder}
                              onChange={e => { setEmailForm(e.target.value); setEmailNotice(""); }}
                              style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
                            />
                            <p className="dev-settings__hint" style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                              {t.settings.emailHint}
                            </p>
                          </div>
                          <button type="submit" className="dev-btn dev-btn--primary console-settings__save-btn" style={{ alignSelf: 'flex-start', minWidth: '160px' }}>
                            {t.settings.save}
                          </button>
                          {emailNotice ? <div className="alert alert--success" style={{ marginTop: '0.5rem' }}>{emailNotice}</div> : null}
                        </form>
                      </div>

                      {/* Connected accounts */}
                      <div className="dev-card settings-profile-card console-settings__accounts-card">
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <div className="dev-portal__section-header dev-portal__section-header--margin" style={{ marginBottom: '1.25rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t.settings.connectedAccounts}</h3>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>{t.settings.connectedAccountsHint}</p>
                        </div>
                        <div className="auth-link-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {authProviderRows.map(row => {
                            const connected = Boolean(row.identity);
                            const detail = row.identity?.email || (row.identity?.username ? `@${row.identity.username}` : row.identity?.provider_user_id || "");
                            return (
                              <div key={row.provider} className="auth-link-row console-settings__auth-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                                <div className="auth-link-row__provider" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <div className={`auth-provider-mark auth-provider-mark--${row.provider}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {row.provider === "github" ? <GithubIcon /> : row.provider === "google" ? <GoogleIcon /> : <TelegramIcon />}
                                  </div>
                                  <div className="console-settings__auth-copy" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{row.label}</strong>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{connected ? detail || t.settings.connected : t.settings.notConnected}</span>
                                  </div>
                                </div>
                                {connected ? (
                                  <span className="auth-link-row__status" style={{ fontSize: '0.8rem', color: 'var(--ok)', fontWeight: 600 }}>{t.settings.connected}</span>
                                ) : row.provider === "telegram" ? (
                                  <span className="auth-link-row__status auth-link-row__status--muted" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.settings.notConnected}</span>
                                ) : (
                                  <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" style={{ width: 'auto', minHeight: '32px' }} onClick={() => void onLinkProvider(row.provider)} disabled={linkingProvider === row.provider}>
                                    {linkingProvider === row.provider ? t.settings.linkStarted : row.action}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Usage limits */}
                      {hasApi && (
                        <div className="dev-card settings-profile-card console-settings__usage-card">
                          <div className="console-card-spotlight" />
                          <div className="console-dogfood-glow" />
                          <div className="dev-portal__section-header dev-portal__section-header--margin" style={{ marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t.usage.title}</h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--muted)' }}>{t.usage.subtitle}</p>
                          </div>
                          <div className="settings-stats-grid">
                            <div className="settings-stat-item">
                              <span className="settings-stat-label">{t.usage.rpm}</span>
                              <div className="settings-stat-value">{formatPlanLimit(rpmLimit, t.common.unlimited)}</div>
                            </div>
                            <div className="settings-stat-item">
                              <span className="settings-stat-label">{t.usage.monthly}</span>
                              <div className="settings-stat-value">{formatPlanLimit(monthlyCap, t.common.unlimited)}</div>
                            </div>
                            <div className="settings-stat-item">
                              <span className="settings-stat-label">{t.usage.keys}</span>
                              <div className="settings-stat-value">{filteredKeys.length}/{formatPlanLimit(session.me.plan.api_key_limit, t.common.unlimited)}</div>
                            </div>
                          </div>
                          {import.meta.env.DEV && !session.me.plan.has_api && (
                            <p className="dev-settings__hint" style={{ marginTop: '1rem', fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--muted)', lineHeight: '1.4' }}>
                              {language === 'ru' 
                                ? '* Лимиты API/ключей временно симулируются в режиме разработки (Dev Mode)' 
                                : '* API/key limits are temporarily simulated in local development (Dev Mode)'}
                            </p>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </main>
  );
}
