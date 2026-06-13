import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { CustomSelect } from "../components/CustomSelect";
import {
  cancelInvoice,
  clearStoredToken,
  createAPIKey,
  createBillingCheckout,
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
  logoutAuth,
  markInvoicePaid,
  removeTeamMember,
  resendWebhookDelivery,
  revokeTeamInvite,
  rotateWebhookEndpointSecret,
  setStoredToken,
  switchWorkspace,
  updateContactEmail,
  updateLanguage,
  updateTeamMemberRole,
} from "../lib/api";
import { ApiError, formatApiError } from "../lib/errors";
import { buildAuthHref, buildCheckoutPath, buildCheckoutUrl } from "../lib/routing";
import { formatInvoiceStatus, getInvoiceStatusMeta, getInvoiceStatusTooltip, formatNetworkLabel } from "../lib/status";
import type { APIKey, DeveloperUsageResponse, Invoice, InvoiceStatus, MeResponse, MemberRole, Network, TeamResponse, Wallet, WebhookDelivery, WebhookEndpoint, Environment } from "../lib/types";
import { useUI } from "../lib/ui";
import { SELLER_CONSOLE_COPY as COPY } from "../i18n";

const BOT_URL = "https://t.me/recvmoney_bot";

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
};

type PanelKey = "overview" | "wallets" | "invoices" | "create" | "developer" | "billing" | "settings" | "team";

const WALLET_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "SOLANA", label: "Solana" },
  { value: "TRON", label: "TRON" },
  { value: "EVM", label: "Base/BSC wallet (EVM)" },
];

const PAYABLE_PAYMENT_OPTIONS: Array<{ key: string; network: Network; asset: string; label: string }> = [
  { key: "TON:TON", network: "TON", asset: "TON", label: "TON" },
  { key: "TON_USDT:USDT", network: "TON_USDT", asset: "USDT", label: "TON USDT" },
  { key: "TRON:USDT", network: "TRON", asset: "USDT", label: "TRON USDT" },
  { key: "SOLANA:SOL", network: "SOLANA", asset: "SOL", label: "SOL" },
  { key: "SOLANA:USDT", network: "SOLANA", asset: "USDT", label: "Solana USDT" },
  { key: "SOLANA:USDC", network: "SOLANA", asset: "USDC", label: "Solana USDC" },
  { key: "BASE:USDT", network: "BASE", asset: "USDT", label: "Base USDT" },
  { key: "BASE:USDC", network: "BASE", asset: "USDC", label: "Base USDC" },
  { key: "ARBITRUM:USDT", network: "ARBITRUM", asset: "USDT", label: "Arbitrum USDT" },
  { key: "ARBITRUM:USDC", network: "ARBITRUM", asset: "USDC", label: "Arbitrum USDC" },
  { key: "BSC:BNB", network: "BSC", asset: "BNB", label: "BNB" },
  { key: "BSC:USDT", network: "BSC", asset: "USDT", label: "BSC USDT" },
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

function walletBucket(network: Network) {
  return network === "BASE" || network === "BSC" || network === "ARBITRUM" ? "EVM" : network === "TON_USDT" ? "TON" : network;
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

  // Form States
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [invoiceForm, setInvoiceForm] = useState({ title: "Product/Service", amount: "10.00", network: "TON" as Network, ttl: 30, optionKeys: ["TON:TON"] });
  const [keyForm, setKeyForm] = useState({ label: "" });
  const [hookForm, setHookForm] = useState({ label: "", url: "" });
  const [latestKeySecret, setLatestKeySecret] = useState("");
  const [latestWebhookSecret, setLatestWebhookSecret] = useState("");
  const [billingForm, setBillingForm] = useState<{ plan: string; network: Network; optionKeys: string[] }>({ plan: "merchant", network: "TRON", optionKeys: ["TRON:USDT"] });
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [emailNotice, setEmailNotice] = useState("");
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [recentCreated, setRecentCreated] = useState<Invoice[]>([]);
  const [invoiceFilters, setInvoiceFilters] = useState({ page: 1, pageSize: 20, status: "all", query: "" });
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  useEffect(() => {
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
      const [me, wallets, invoices, keys, hooks] = await Promise.all([
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
    if (activePanel === "developer" && session?.token && session.me.plan.has_api) {
      void loadDeveloperData(session.token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePanel, session?.token]);

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

  async function onCreateInvoice(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    if (isCreatingInvoice) return;
    setIsCreatingInvoice(true);
    setCreatedInvoice(null);
    try {
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

  async function onSetLanguage(next: "en" | "ru") {
    setLanguage(next);
    if (!session) return;
    try {
      await updateLanguage(session.token, { language: next });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onUpgrade() {
    if (!session) return;
    try {
      const inv = await createBillingCheckout(session.token, {
        payable_network: billingForm.network,
        payment_options: billingForm.optionKeys
          .map(key => PAYABLE_PAYMENT_OPTIONS.find(option => option.key === key))
          .filter(Boolean)
          .map(option => ({ network: option!.network, asset: option!.asset })),
        plan_code: billingForm.plan,
      });
      setCheckoutUrl(buildCheckoutUrl(inv.public_id));
    } catch (err) { setError(formatApiError(err)); }
  }

  const filteredInvoices = useMemo(() => session?.invoices.filter(inv => inv.environment === environment) ?? [], [session, environment]);
  const filteredWallets = useMemo(() => session?.wallets.filter(w => w.environment === environment) ?? [], [session, environment]);
  const filteredKeys = useMemo(() => session?.apiKeys.filter(k => k.environment === environment) ?? [], [session, environment]);
  const filteredHooks = useMemo(() => session?.webhooks.filter(h => h.environment === environment) ?? [], [session, environment]);

  const navItems: Array<{ key: PanelKey; label: string }> = [
    { key: "overview", label: t.nav.overview },
    { key: "wallets", label: t.nav.wallets },
    { key: "invoices", label: t.nav.invoices },
    { key: "create", label: t.nav.create },
    { key: "developer", label: t.nav.developer },
    { key: "team", label: t.nav.team },
    { key: "billing", label: t.nav.billing },
    { key: "settings", label: t.nav.settings },
  ];

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
              <div className="dev-portal__skeleton-nav-label" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="dev-portal__skeleton-nav-link" />
              ))}
              <div className="dev-portal__skeleton-nav-label" style={{ marginTop: '1.5rem' }} />
              {[...Array(4)].map((_, i) => (
                <div key={i + 4} className="dev-portal__skeleton-nav-link" />
              ))}
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

  const workspaceName = session.me.workspace.username || `#${session.me.workspace.id}`;
  const activeWalletsCount = filteredWallets.filter(w => w.is_active).length;
  const walletNetworks = new Set(filteredWallets.filter(w => w.is_active).map(w => w.network));
  const configuredBuckets = new Set(filteredWallets.map(w => walletBucket(w.network)));
  const missingWalletNetworks = WALLET_NETWORK_OPTIONS.filter(opt => !configuredBuckets.has(walletBucket(opt.value)));
  const walletCoveragePct = Math.round((configuredBuckets.size / WALLET_NETWORK_OPTIONS.length) * 100);

  // Dashboard metrics (current environment)
  const paidInvoices = filteredInvoices.filter(inv => inv.status === "paid");
  const paidRevenue = paidInvoices.reduce((sum, inv) => sum + (Number(inv.base_amount_usd) || 0), 0);
  const hasApi = session.me.plan.has_api;
  const avgTicket = paidInvoices.length > 0 ? paidRevenue / paidInvoices.length : 0;
  const openValue = filteredInvoices
    .filter(inv => inv.status === "awaiting_payment" || inv.status === "underpaid")
    .reduce((sum, inv) => sum + (Number(inv.base_amount_usd) || 0), 0);
  const conversionPct = filteredInvoices.length > 0 ? Math.round((paidInvoices.length / filteredInvoices.length) * 100) : 0;

  // Status breakdown (current environment)
  const statusCounts = filteredInvoices.reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {});
  const statusBreakdown = (Object.keys(statusCounts) as InvoiceStatus[])
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
  const networkBreakdown = Object.entries(networkTotals)
    .map(([network, v]) => ({ network: network as Network, ...v }))
    .sort((a, b) => b.usd - a.usd);
  const maxNetworkUsd = networkBreakdown.reduce((m, n) => Math.max(m, n.usd), 0);

  const apiBaseUrl = getApiBase() || "https://api.recv.money";
  const apiSnippet = `curl -X POST ${apiBaseUrl}/v1/invoices \\
  -H "X-API-Key: ${environment === "test" ? "test_..." : "live_..."}" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Order #1","base_amount_usd":"49.00","payable_network":"${invoiceForm.network}","expires_in_minutes":30}'`;
  const onboardingSteps = [
    { done: activeWalletsCount > 0, body: t.overview.setupWallet, action: t.overview.setupWalletAction, target: "wallets" as PanelKey },
    ...(hasApi ? [{ done: filteredKeys.length > 0, body: t.overview.setupKey, action: t.overview.setupKeyAction, target: "developer" as PanelKey }] : []),
    { done: filteredInvoices.length > 0, body: t.overview.setupInvoice, action: t.overview.setupInvoiceAction, target: "create" as PanelKey },
  ];
  const onboardingComplete = onboardingSteps.every(s => s.done);
  const payableNetworkOptions = PAYABLE_PAYMENT_OPTIONS.map(option => ({
    value: option.key,
    label: option.label,
    disabled: !walletNetworks.has(walletBucket(option.network)),
    hint: walletNetworks.has(walletBucket(option.network)) ? t.common.walletReady : t.common.addWalletFirst,
  }));
  const billingNetworkOptions = PAYABLE_PAYMENT_OPTIONS.map(option => ({
    value: option.key,
    label: option.label,
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
          
          <nav className="dev-portal__nav-menu">
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.common.management}</span>
              {navItems.slice(0, 4).map(item => (
                <button key={item.key} className={`dev-portal__nav-link ${activePanel === item.key ? "is-active" : ""}`} onClick={() => handleNavClick(item.key)}>
                  {PANEL_ICONS[item.key]}
                  {item.label}
                </button>
              ))}
            </div>
            
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.common.advanced}</span>
              {navItems.slice(4).map(item => (
                <button key={item.key} className={`dev-portal__nav-link ${activePanel === item.key ? "is-active" : ""}`} onClick={() => handleNavClick(item.key)}>
                  {PANEL_ICONS[item.key]}
                  {item.label}
                </button>
              ))}
            </div>
            
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
              <div className="env-toggle">
                <button className={`env-toggle__btn ${environment === 'live' ? 'is-active' : ''}`} onClick={() => setEnvironment('live')}>{t.common.liveMode}</button>
                <button className={`env-toggle__btn ${environment === 'test' ? 'is-active' : ''}`} onClick={() => setEnvironment('test')}>{t.common.testMode}</button>
              </div>
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
                  <span className="dev-api-badge dev-api-badge--post dev-api-badge--fit">{t.overview.badge}</span>
                  <h1>{t.overview.welcome} {session.me.user.username || 'User'}</h1>
                  <p>{t.overview.subtitle} {t.overview.currentWorkspace}: <strong>{workspaceName}</strong></p>
                </div>

                <div className="dev-metrics-grid">
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.revenue}</span>
                    <strong className="dev-metric-value"><LiveValue value={`$${paidRevenue.toFixed(2)}`} /></strong>
                    <span className="dev-metric-meta">{t.overview.revenuePaid} ({environment})</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.stats.plan}</span>
                    <strong className="dev-metric-value">{session.me.plan.name}</strong>
                    <span className="dev-metric-meta">
                      {session.me.plan.code === 'trial' ? `${t.billing.trial}` : t.billing.active}
                    </span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.stats.networks}</span>
                    <strong className="dev-metric-value"><LiveValue value={activeWalletsCount} /></strong>
                    <span className="dev-metric-meta">/{WALLET_NETWORK_OPTIONS.length} {t.overview.active} ({environment})</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.stats.invoices}</span>
                    <strong className="dev-metric-value"><LiveValue value={filteredInvoices.length} /></strong>
                    <span className="dev-metric-meta">{paidInvoices.length} {t.overview.paidCount} ({environment})</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.conversion}</span>
                    <strong className="dev-metric-value"><LiveValue value={`${conversionPct}%`} /></strong>
                    <span className="dev-metric-meta">{paidInvoices.length}/{filteredInvoices.length} {t.overview.conversionMeta}</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.avgTicket}</span>
                    <strong className="dev-metric-value"><LiveValue value={`$${avgTicket.toFixed(2)}`} /></strong>
                    <span className="dev-metric-meta">{t.overview.avgTicketMeta}</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{t.overview.openValue}</span>
                    <strong className="dev-metric-value"><LiveValue value={`$${openValue.toFixed(2)}`} /></strong>
                    <span className="dev-metric-meta">{t.overview.openValueMeta}</span>
                  </div>
                  <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <span className="dev-metric-label">{language === 'ru' ? 'Вебхуки' : 'Webhooks'}</span>
                    <strong className="dev-metric-value"><LiveValue value={filteredHooks.length} /></strong>
                    <span className="dev-metric-meta">
                      /{session.me.plan.webhook_limit || 0} {language === 'ru' ? 'активно' : 'active'} ({environment})
                    </span>
                  </div>
                </div>

                {filteredInvoices.length > 0 && (
                  <div className="dev-analytics-panel">
                    <div className="dev-analytics-col console-spotlight-card" onMouseMove={handleMouseMove}>
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

                    <div className="dev-analytics-col console-spotlight-card" onMouseMove={handleMouseMove}>
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
                                <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{formatNetworkLabel(network)}</span>
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

                {!onboardingComplete && (
                  <div className="dev-setup-panel portal-animate-in">
                    <div className="dev-setup-header">
                      <div className="dev-setup-title-row">
                        <h3>{t.overview.setupTitle}</h3>
                        <span className="dev-setup-progress-badge">
                          {onboardingSteps.filter(s => s.done).length} / {onboardingSteps.length} {language === "ru" ? "пройдено" : "completed"}
                        </span>
                      </div>
                      <div className="dev-setup-progress-track">
                        <div 
                          className="dev-setup-progress-fill" 
                          style={{ width: `${Math.round((onboardingSteps.filter(s => s.done).length / onboardingSteps.length) * 100)}%` }} 
                        />
                      </div>
                    </div>
                    <div className="dev-setup-stepper">
                      {onboardingSteps.map((step, i) => (
                        <div key={i} className={`dev-setup-step ${step.done ? "is-done" : ""}`}>
                          <div className="dev-setup-step-indicator">
                            <span className="dev-setup-step-marker">{step.done ? "✓" : i + 1}</span>
                          </div>
                          <div className="dev-setup-step-content">
                            <span className="dev-setup-step-body">{step.body}</span>
                            {step.done ? null : (
                              <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => setActivePanel(step.target)}>
                                {step.action}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {session.me.plan.code === 'trial' && (
                  <div className="dev-card dev-card--accent dev-promo-card portal-animate-in console-spotlight-card" onMouseMove={handleMouseMove}>
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

                <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin">
                    <h3>{t.overview.activity} ({environment})</h3>
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
                              <span className="dev-resource-card__amount">{inv.payable_amount} {inv.payable_network}</span>
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
                  <h2>{t.wallets.title} ({environment})</h2>
                  <p>{t.wallets.subtitle}</p>
                </div>

                <div className="dev-card dev-card--accent dev-coverage console-spotlight-card" onMouseMove={handleMouseMove}>
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

                <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <form onSubmit={onAddWallet} className="dev-form">
                    <div className="dev-wallet-form-grid">
                      <div className="dev-input-group">
                        <label>{t.wallets.network}</label>
                        <CustomSelect
                          value={walletForm.network}
                          options={WALLET_NETWORK_OPTIONS}
                          ariaLabel={t.wallets.network}
                          onChange={(v) => setWalletForm(c => ({ ...c, network: v as Network }))}
                        />
                      </div>
                      <div className="dev-input-group">
                        <label>{t.wallets.address}</label>
                        <input className="dev-input" placeholder={t.wallets.placeholder} value={walletForm.address} onChange={e => setWalletForm(c => ({ ...c, address: e.target.value }))} required />
                      </div>
                      <button type="submit" className="dev-btn dev-btn--primary dev-wallet-add-btn">{t.wallets.add}</button>
                    </div>
                  </form>
                </div>

                <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin">
                    <h3>{t.wallets.configured}</h3>
                  </div>
                  <div className="dev-network-grid">
                    {WALLET_NETWORK_OPTIONS.map(opt => {
                      const wallets = filteredWallets.filter(w => walletBucket(w.network) === walletBucket(opt.value));
                      const configured = wallets.length > 0;
                      return (
                        <div key={opt.value} className={`dev-network-card console-spotlight-card ${configured ? "is-active" : "is-missing"}`} onMouseMove={handleMouseMove}>
                          <div className="console-card-spotlight" />
                          <div className="console-dogfood-glow" />
                          <div className="dev-network-card__head">
                            <span className="dev-network-card__name">{opt.label}</span>
                            <span className={`dev-api-badge dev-api-badge--${configured ? "get" : "secondary"} dev-api-badge--micro`}>
                              {configured ? t.wallets.active : t.wallets.missing}
                            </span>
                          </div>
                          {configured ? (
                            <div className="dev-network-card__addresses">
                              {wallets.map(w => (
                                <div key={w.id} className="dev-network-card__addr">
                                  <code className="dev-wallet-address">{w.address}</code>
                                  <button className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void onDeleteWallet(w.id)}>{t.common.delete}</button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="dev-network-card__empty">
                              <p className="dev-card__note-text">{t.wallets.missingHint}</p>
                              <button
                                className="dev-btn dev-btn--secondary dev-btn--compact"
                                onClick={() => setWalletForm({ network: opt.value, address: "" })}
                              >
                                {t.wallets.addFor}
                              </button>
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
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.invoices.title} ({environment})</h2>
                  <p>{t.invoices.subtitle}</p>
                </div>
                <div className="dev-card dev-toolbar console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <input
                    className="dev-input"
                    value={invoiceFilters.query}
                    onChange={(event) => setInvoiceFilters(current => ({ ...current, page: 1, query: event.target.value }))}
                    placeholder={language === "ru" ? "Поиск по названию, ID или tx hash" : "Search title, ID, or tx hash"}
                  />
                  <CustomSelect
                    value={invoiceFilters.status}
                    onChange={(value) => setInvoiceFilters(current => ({ ...current, page: 1, status: value }))}
                    options={statusOptions}
                    ariaLabel={language === "ru" ? "Фильтр статуса" : "Status filter"}
                  />
                  <div className="dev-toolbar__meta">
                    {language === "ru" ? "Всего" : "Total"}: {session.invoiceTotal}
                  </div>
                </div>
                <div className="dev-resource-list">
                  {filteredInvoices.length === 0 ? (
                    <div className="dev-card dev-portal__empty-large console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      {t.invoices.empty}
                    </div>
                  ) : filteredInvoices.map(inv => {
                    const isOpen = expandedInvoice === inv.id;
                    return (
                    <div key={inv.id} className="dev-card dev-card--invoice console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-card__head">
                        <div>
                          <div className="dev-card__status-row">
                            <span className={`dev-api-badge dev-status-badge dev-status-badge--${statusToneClass(inv.status)}`} title={getInvoiceStatusTooltip(inv.status, language) || undefined}>
                              {formatInvoiceStatus(inv.status, language, true)}
                            </span>
                            <span className="dev-api-badge dev-api-badge--secondary">{formatNetworkLabel(inv.payable_network)}</span>
                          </div>
                          <h3 className="dev-card__title">{inv.title}</h3>
                          <code className="dev-card__id">{inv.public_id}</code>
                        </div>
                        <div className="dev-card__amount-col">
                          <div className="dev-card__amount">{inv.payable_amount} <small className="dev-card__currency">{inv.payable_network}</small></div>
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
                              <span className="dev-settings-row__value">{inv.payable_amount} {inv.payable_network}</span>
                            </div>
                            {Number(inv.received_amount) > 0 && (
                              <div className="dev-settings-row">
                                <span className="dev-settings-row__label">{t.invoices.received}</span>
                                <span className="dev-settings-row__value">{inv.received_amount} {inv.payable_network}</span>
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
                  })}
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
                  <h2>{t.create.title} ({environment})</h2>
                  <p>{t.create.subtitle}</p>
                </div>
                <div className="dev-create-grid">
                  <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
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
                        <CustomSelect
                          value={invoiceForm.optionKeys[0]}
                          options={payableNetworkOptions}
                          ariaLabel={t.create.network}
                          onChange={(v) => {
                            const selected = PAYABLE_PAYMENT_OPTIONS.find(option => option.key === v);
                            setInvoiceForm(c => ({
                              ...c,
                              network: selected?.network ?? c.network,
                              optionKeys: [v, ...c.optionKeys.filter(key => key !== v)].slice(0, 2),
                            }));
                          }}
                        />
                        <div className="dev-preset-row">
                          {PAYABLE_PAYMENT_OPTIONS.filter(option => walletNetworks.has(walletBucket(option.network))).map(option => (
                            <button
                              key={option.key}
                              type="button"
                              className={`dev-preset-chip ${invoiceForm.optionKeys.includes(option.key) ? "is-active" : ""}`}
                              onClick={() => setInvoiceForm(c => {
                                const exists = c.optionKeys.includes(option.key);
                                const next = exists ? c.optionKeys.filter(key => key !== option.key) : [...c.optionKeys, option.key].slice(-2);
                                const fallback = next.length > 0 ? next : [option.key];
                                return { ...c, network: option.network, optionKeys: fallback };
                              })}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {Number(invoiceForm.amount) <= 0 && <p className="dev-resource-card__error">{t.create.amountInvalid}</p>}
                      <button type="submit" className="dev-btn dev-btn--primary dev-btn--large" disabled={isCreatingInvoice || activeWalletsCount === 0 || Number(invoiceForm.amount) <= 0}>
                        {isCreatingInvoice ? t.common.creating : t.create.generate}
                      </button>
                    </form>
                  </div>

                  <div className="dev-card dev-create-preview console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.create.preview}</h3>
                      <p>{t.create.previewHint}</p>
                    </div>
                    {createdInvoice ? (
                      <div className="dev-create-preview__body">
                        <QrImage value={createdInvoice.payment_uri || buildCheckoutUrl(createdInvoice.public_id)} alt={t.create.qrAlt} />
                        <div className="dev-create-preview__amount">{createdInvoice.payable_amount} {createdInvoice.payable_network}</div>
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
                  <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
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
                              <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{formatNetworkLabel(inv.payable_network)}</span>
                              <span className="dev-resource-card__amount">{inv.payable_amount} {inv.payable_network}</span>
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
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.developer.title} ({environment})</h2>
                  <p>{t.developer.subtitle}</p>
                </div>

                {!session.me.plan.has_api ? (
                  <div className="dev-portal__locked-state">
                    <h3>{t.developer.locked}</h3>
                    <button className="dev-btn dev-btn--primary" onClick={() => setActivePanel("billing")}>{t.promo.action}</button>
                  </div>
                ) : (
                  <>
                    {devUsage && (
                      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
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

                    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.quickstartTitle}</h3>
                        <p>{t.developer.quickstartSubtitle}</p>
                      </div>
                      <div className="dev-settings-row">
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

                    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.keysTitle}</h3>
                        <p>{t.developer.keysSubtitle}</p>
                      </div>
                      <form onSubmit={onCreateKey} className="dev-form">
                        <div className="dev-form__row-grid">
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

                      <div className="dev-resource-list dev-resource-list--margin">
                        {filteredKeys.length === 0 ? (
                          <div className="dev-portal__empty-state">{t.developer.noKeys}</div>
                        ) : filteredKeys.map(key => (
                          <div key={key.id} className="dev-resource-card">
                            <div className="dev-resource-card__info">
                              <div className="dev-resource-card__title">{key.label}</div>
                              <code className="dev-resource-card__meta">{key.prefix}***</code>
                            </div>
                            <button className="dev-btn dev-btn--danger" onClick={() => void onDeleteKey(key.id)}>{t.common.delete}</button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.hooksTitle}</h3>
                        <p>{t.developer.hooksSubtitle}</p>
                      </div>
                      <form onSubmit={onCreateHook} className="dev-form">
                        <div className="dev-webhook-form-grid">
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

                      <div className="dev-resource-list dev-resource-list--margin">
                        {filteredHooks.length === 0 ? (
                          <div className="dev-portal__empty-state">{t.developer.noEndpoints}</div>
                        ) : filteredHooks.map(hook => (
                          <div key={hook.id} className="dev-resource-card dev-resource-card--column">
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

                    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.developer.deliveriesTitle}</h3>
                        <p>{t.developer.deliveriesSubtitle}</p>
                      </div>
                      {(() => {
                        const envDeliveries = deliveries.filter(d => d.environment === environment);
                        if (envDeliveries.length === 0) {
                          return <div className="dev-portal__empty-state">{t.developer.noDeliveries}</div>;
                        }
                        return (
                          <div className="dev-resource-list">
                            {envDeliveries.map(d => {
                              const tone = d.status === "delivered" ? "success" : d.status === "failed" || d.status === "exhausted" ? "danger" : "warning";
                              return (
                                <div key={d.id} className="dev-resource-card">
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
              const myRole: MemberRole = team?.my_role ?? "member";
              const canManage = myRole === "owner" || myRole === "admin";
              const isOwner = myRole === "owner";
              const meTelegramId = session.me.user.telegram_id;
              const members = team?.members ?? [];
              const invites = team?.invites ?? [];
              const ownerCount = members.filter(m => m.role === "owner").length;
              const roleLabel = (r: MemberRole) => r === "owner" ? t.team.roleOwner : r === "admin" ? t.team.roleAdmin : t.team.roleMember;
              const roleTone = (r: MemberRole) => r === "owner" ? "post" : r === "admin" ? "get" : "secondary";
              const roleSelectOptions = [
                { value: "owner", label: t.team.roleOwner },
                { value: "admin", label: t.team.roleAdmin },
                { value: "member", label: t.team.roleMember },
              ];
              const inviteRoleOptions = (isOwner ? roleSelectOptions : roleSelectOptions.filter(o => o.value !== "owner"));
              return (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.team.title}</h2>
                  <p>{t.team.subtitle}</p>
                </div>

                <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin">
                    <h3>{t.team.membersTitle} ({members.length})</h3>
                    {!canManage && <p>{t.team.manageHint}</p>}
                  </div>
                  <div className="dev-resource-list">
                    {members.map(m => {
                      const isSelf = m.telegram_id === meTelegramId;
                      const displayName = m.username ? `@${m.username}` : `#${m.telegram_id}`;
                      const isLastOwner = m.role === "owner" && ownerCount <= 1;
                      const canEditRole = isOwner && !isLastOwner;
                      const canRemove = (isSelf && !isLastOwner) || (canManage && !isSelf && !(myRole === "admin" && m.role !== "member") && !isLastOwner);
                      return (
                        <div key={m.user_id} className="dev-resource-card dev-team-member">
                          <div className="dev-resource-card__info">
                            <div className="dev-resource-card__title">
                              {displayName}{isSelf ? <span className="dev-team-you"> ({t.team.you})</span> : null}
                            </div>
                            {m.email ? <div className="dev-resource-card__meta">{m.email}</div> : null}
                          </div>
                          <div className="dev-team-member__controls">
                            {canEditRole ? (
                              <div className="dev-team-role-select">
                                <CustomSelect
                                  value={m.role}
                                  options={roleSelectOptions}
                                  ariaLabel={t.team.changeRole}
                                  onChange={(v) => void onChangeMemberRole(m.user_id, v as MemberRole)}
                                />
                              </div>
                            ) : (
                              <span className={`dev-api-badge dev-api-badge--${roleTone(m.role)}`}>{roleLabel(m.role)}</span>
                            )}
                            {canRemove ? (
                              <button className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void onRemoveMember(m.user_id, isSelf)}>
                                {isSelf ? t.team.leave : t.team.remove}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {canManage && (
                  <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.team.add}</h3>
                      <p>{t.team.inviteHint}</p>
                    </div>
                    <form onSubmit={onInviteMember} className="dev-form">
                      <div className="dev-team-invite-grid">
                        <div className="dev-input-group">
                          <label>{t.team.name}</label>
                          <input
                            className="dev-input"
                            value={inviteForm.username}
                            onChange={e => setInviteForm(c => ({ ...c, username: e.target.value }))}
                            placeholder={t.team.invitePlaceholder}
                            required
                          />
                        </div>
                        <div className="dev-input-group">
                          <label>{t.team.role}</label>
                          <CustomSelect
                            value={inviteForm.role}
                            options={inviteRoleOptions}
                            ariaLabel={t.team.role}
                            onChange={(v) => setInviteForm(c => ({ ...c, role: v as MemberRole }))}
                          />
                        </div>
                        <button type="submit" className="dev-btn dev-btn--primary dev-team-invite-btn" disabled={invitingMember || !inviteForm.username.trim()}>
                          {invitingMember ? t.team.inviting : t.team.inviteAction}
                        </button>
                      </div>
                    </form>
                    {teamNotice ? <div className="alert alert--success alert--margin">{teamNotice}</div> : null}

                    <div className="dev-portal__section-header dev-portal__section-header--margin dev-team-invites-header">
                      <h3>{t.team.invitesTitle}</h3>
                    </div>
                    {invites.length === 0 ? (
                      <div className="dev-portal__empty-state">{t.team.noInvites}</div>
                    ) : (
                      <div className="dev-resource-list">
                        {invites.map(inv => (
                          <div key={inv.id} className="dev-resource-card">
                            <div className="dev-resource-card__info">
                              <div className="dev-resource-card__title">@{inv.invited_username}</div>
                              <div className="dev-resource-card__meta">{t.team.invitedAs} {roleLabel(inv.role)}</div>
                            </div>
                            <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void onRevokeInvite(inv.id)}>{t.team.revoke}</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })()}

            {activePanel === "billing" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-billing-section-header">
                  <div>
                    <h2>{t.billing.title}</h2>
                    <p>{t.billing.subtitle}</p>
                  </div>
                  <div className="dev-billing-plan-badge">
                    <span className="dev-billing-plan-badge__label">
                      {language === 'ru' ? 'Текущий план' : 'Current plan'}
                    </span>
                    <strong className="dev-billing-plan-badge__name">{session.me.plan.name}</strong>
                    {session.me.plan.code === 'trial' && (
                      <span className="dev-billing-plan-badge__trial">
                        {language === 'ru' ? 'Пробный период' : 'Trial Period'}
                      </span>
                    )}
                  </div>
                </div>

                {(() => {
                  const fmt = (n: number | undefined) => (n && n > 0 ? n.toLocaleString() : t.common.unlimited);
                  const comparePlans = PLAN_COMPARE_ORDER
                    .map(code => session.me.plans.find(p => p.code === code))
                    .filter((p): p is NonNullable<typeof p> => Boolean(p));
                  const featRow = (label: string, on: boolean) => (
                    <div className="dev-plan-feat">
                      <span className={`dev-plan-feat__icon dev-plan-feat__icon--${on ? "yes" : "no"}`}>{on ? "✓" : "—"}</span>
                      <span>{label}</span>
                    </div>
                  );
                  return (
                    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                      <div className="console-card-spotlight" />
                      <div className="console-dogfood-glow" />
                      <div className="dev-portal__section-header dev-portal__section-header--margin">
                        <h3>{t.billing.comparisonTitle}</h3>
                        <p>{t.billing.comparisonSubtitle}</p>
                      </div>
                      <div className="dev-plan-grid">
                        {comparePlans.map(plan => {
                          const isCurrent = plan.code === session.me.plan.code;
                          const isSelected = plan.code === billingForm.plan;
                          return (
                            <div key={plan.code} className={`dev-plan-card console-spotlight-card ${isSelected ? "is-selected" : ""} ${isCurrent ? "is-current" : ""}`} onMouseMove={handleMouseMove}>
                              <div className="console-card-spotlight" />
                              <div className="console-dogfood-glow" />
                              <div className="dev-plan-card__head">
                                <span className="dev-plan-card__name">{plan.name}</span>
                                {isCurrent && <span className="dev-api-badge dev-api-badge--get dev-api-badge--micro">{t.billing.currentBadge}</span>}
                              </div>
                              <div className="dev-plan-card__price">${plan.price_usd}<span className="dev-plan-card__period">{t.billing.perMonth}</span></div>
                              <div className="dev-plan-card__feats">
                                {featRow(t.billing.featApi, plan.has_api)}
                                {featRow(t.billing.featWebhooks, plan.has_webhooks)}
                                {featRow(t.billing.featUnlimited, plan.has_unlimited_sales)}
                                {featRow(t.billing.featPriority, plan.priority_support)}
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featKeys}</span><strong>{fmt(plan.api_key_limit)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featRpm}</span><strong>{fmt(plan.requests_per_minute)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featMonthly}</span><strong>{fmt(plan.monthly_request_cap)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featRetries}</span><strong>{fmt(plan.webhook_retries)}</strong>
                                </div>
                                <div className="dev-plan-feat dev-plan-feat--metric">
                                  <span>{t.billing.featSeats}</span><strong>{fmt(plan.max_seats)}</strong>
                                </div>
                              </div>
                              <button
                                className={`dev-btn ${isSelected ? "dev-btn--primary" : "dev-btn--secondary"} dev-btn--full-width`}
                                disabled={isCurrent}
                                onClick={() => setBillingForm(c => ({ ...c, plan: plan.code }))}
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

                <div className="dev-card dev-billing-card console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-form">
                    <h3>{t.billing.checkoutTitle}</h3>
                    <p className="dev-card__note-text">{t.billing.checkoutSubtitle}</p>
                    <div className="dev-input-group">
                      <label>{t.common.plan}</label>
                      <CustomSelect
                        value={billingForm.plan}
                        options={session.me.plans.filter(p => p.code !== 'trial').map(p => ({ value: p.code, label: p.name }))}
                        ariaLabel={t.common.plan}
                        onChange={v => setBillingForm(c => ({ ...c, plan: v }))}
                      />
                    </div>
                    <div className="dev-input-group">
                      <label>{t.common.network}</label>
                      <CustomSelect
                        value={billingForm.optionKeys[0]}
                        options={billingNetworkOptions}
                        ariaLabel={t.common.network}
                        onChange={v => {
                          const selected = PAYABLE_PAYMENT_OPTIONS.find(option => option.key === v);
                          setBillingForm(c => ({
                            ...c,
                            network: selected?.network ?? c.network,
                            optionKeys: [v, ...c.optionKeys.filter(key => key !== v)].slice(0, 2),
                          }));
                        }}
                      />
                      <div className="dev-preset-row">
                        {PAYABLE_PAYMENT_OPTIONS.map(option => (
                          <button
                            key={option.key}
                            type="button"
                            className={`dev-preset-chip ${billingForm.optionKeys.includes(option.key) ? "is-active" : ""}`}
                            onClick={() => setBillingForm(c => {
                              const exists = c.optionKeys.includes(option.key);
                              const next = exists ? c.optionKeys.filter(key => key !== option.key) : [...c.optionKeys, option.key].slice(-2);
                              const fallback = next.length > 0 ? next : [option.key];
                              return { ...c, network: option.network, optionKeys: fallback };
                            })}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button className="dev-btn dev-btn--primary" onClick={onUpgrade}>{t.billing.upgrade}</button>
                  </div>
                  <div className="dev-card__side-col">
                    {checkoutUrl ? (
                      <div className="dev-form">
                        <div className="alert alert--success">{t.common.checkoutGenerated}</div>
                        <code className="dev-input dev-input--readonly-box">{checkoutUrl}</code>
                        <div className="dev-form__actions-row">
                          <button className="dev-btn dev-btn--secondary dev-btn--flex-grow" onClick={() => handleCopy(checkoutUrl, "billing-url")}>
                            {copiedId === "billing-url" ? t.common.copied : t.common.copy}
                          </button>
                          <a href={checkoutUrl} target="_blank" rel="noreferrer" className="dev-btn dev-btn--primary dev-btn--flex-grow dev-btn--centered">{t.common.payNow}</a>
                        </div>
                      </div>
                    ) : (
                      <div className="dev-card__footer-text">
                        <p className="dev-card__plan-label">{t.billing.current}: <strong className="dev-card__plan-strong">{session.me.plan.name}</strong></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "settings" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.settings.title}</h2>
                  <p>{t.settings.subtitle}</p>
                </div>
                <div className="dev-card dev-card--max-width console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-portal__section-header dev-portal__section-header--margin">
                    <h3>{t.settings.account}</h3>
                  </div>
                  <div className="dev-settings-grid">
                    <div className="dev-settings-row">
                      <span className="dev-settings-row__label">{t.settings.workspaceId}</span>
                      <code className="dev-settings-row__value">#{session.me.workspace.id} ({workspaceName})</code>
                    </div>
                    <div className="dev-settings-row">
                      <span className="dev-settings-row__label">{t.settings.planLabel}</span>
                      <span className="dev-settings-row__value">{session.me.plan.name}</span>
                    </div>
                    <div className="dev-settings-row">
                      <span className="dev-settings-row__label">{t.settings.memberSince}</span>
                      <span className="dev-settings-row__value">{new Date(session.me.workspace.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="dev-card dev-card--max-width console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <form onSubmit={onUpdateEmail} className="dev-form">
                    <div className="dev-input-group">
                      <label>{t.settings.email}</label>
                      <input
                        className="dev-input"
                        type="email"
                        value={emailForm}
                        placeholder={t.settings.emailPlaceholder}
                        onChange={e => { setEmailForm(e.target.value); setEmailNotice(""); }}
                      />
                      <p className="dev-settings__hint">{t.settings.emailHint}</p>
                    </div>
                    <button type="submit" className="dev-btn dev-btn--primary">{t.settings.save}</button>
                    {emailNotice ? <div className="alert alert--success alert--margin">{emailNotice}</div> : null}
                  </form>
                </div>

                {hasApi && (
                  <div className="dev-card dev-card--max-width console-spotlight-card" onMouseMove={handleMouseMove}>
                    <div className="console-card-spotlight" />
                    <div className="console-dogfood-glow" />
                    <div className="dev-portal__section-header dev-portal__section-header--margin">
                      <h3>{t.usage.title}</h3>
                      <p>{t.usage.subtitle}</p>
                    </div>
                    <div className="dev-widget-grid">
                      <div className="dev-card dev-widget console-spotlight-card" onMouseMove={handleMouseMove}>
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <span className="dev-widget__label">{t.usage.rpm}</span>
                        <div className="dev-widget__value">{session.me.plan.requests_per_minute}</div>
                      </div>
                      <div className="dev-card dev-widget console-spotlight-card" onMouseMove={handleMouseMove}>
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <span className="dev-widget__label">{t.usage.monthly}</span>
                        <div className="dev-widget__value">{session.me.plan.monthly_request_cap.toLocaleString()}</div>
                      </div>
                      <div className="dev-card dev-widget console-spotlight-card" onMouseMove={handleMouseMove}>
                        <div className="console-card-spotlight" />
                        <div className="console-dogfood-glow" />
                        <span className="dev-widget__label">{t.usage.keys}</span>
                        <div className="dev-widget__value">{filteredKeys.length}/{session.me.plan.api_key_limit}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="dev-card dev-card--max-width console-spotlight-card" onMouseMove={handleMouseMove}>
                  <div className="console-card-spotlight" />
                  <div className="console-dogfood-glow" />
                  <div className="dev-input-group">
                    <label>{t.settings.language}</label>
                    <div className="dev-form__grid">
                      <button className={`dev-btn ${language === 'ru' ? 'dev-btn--primary' : 'dev-btn--secondary'}`} onClick={() => void onSetLanguage('ru')}>RU</button>
                      <button className={`dev-btn ${language === 'en' ? 'dev-btn--primary' : 'dev-btn--secondary'}`} onClick={() => void onSetLanguage('en')}>EN</button>
                    </div>
                  </div>

                  <div className="dev-card--danger-zone">
                    <label className="dev-settings__label--danger">{t.settings.session}</label>
                    <p className="dev-settings__hint">{t.settings.logoutHint}</p>
                    <button className="dev-btn dev-btn--danger dev-btn--full-width" onClick={handleLogout}>{t.nav.logout}</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
