import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  fetchInvoices,
  fetchMe,
  fetchWallets,
  fetchWebhookEndpoints,
  getStoredToken,
  markInvoicePaid,
  updateContactEmail,
} from "../lib/api";
import { formatApiError } from "../lib/errors";
import { buildAuthHref, buildCheckoutPath, buildCheckoutUrl } from "../lib/routing";
import { formatInvoiceStatus, getInvoiceStatusMeta, formatNetworkLabel } from "../lib/status";
import type { APIKey, Invoice, MeResponse, Network, Wallet, WebhookEndpoint, Plan, Environment } from "../lib/types";
import { useUI } from "../lib/ui";
import { SELLER_CONSOLE_COPY as COPY } from "../i18n";

const BOT_URL = "https://t.me/reqstxyz_bot";

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
  apiKeys: APIKey[];
  webhooks: WebhookEndpoint[];
};

type PanelKey = "overview" | "wallets" | "invoices" | "create" | "developer" | "billing" | "settings" | "team";

const WALLET_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "EVM", label: "ETHEREUM (EVM)" },
];

const PAYABLE_NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "BASE", label: "BASE" },
  { value: "ARBITRUM", label: "ARBITRUM" },
  { value: "BSC", label: "BSC" },
  { value: "EVM", label: "ETHEREUM" },
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
  return network === "BASE" || network === "ARBITRUM" || network === "BSC" ? "EVM" : network === "TON_USDT" ? "TON" : network;
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

  // Form States
  const [walletForm, setWalletForm] = useState<{ network: Network; address: string }>({ network: "TON", address: "" });
  const [invoiceForm, setInvoiceForm] = useState({ title: "Product/Service", amount: "10.00", network: "TON" as Network, ttl: 30 });
  const [keyForm, setKeyForm] = useState({ label: "" });
  const [hookForm, setHookForm] = useState({ label: "", url: "" });
  const [latestKeySecret, setLatestKeySecret] = useState("");
  const [billingForm, setBillingForm] = useState<{ plan: string; network: Network }>({ plan: "merchant", network: "TRON" });
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [emailForm, setEmailForm] = useState("");
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

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
        fetchInvoices(token),
        fetchAPIKeys(token).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(token).catch(() => ({ items: [] })),
      ]);
      setSession({
        token,
        me,
        wallets: wallets.items ?? [],
        invoices: invoices.items ?? [],
        apiKeys: keys.items ?? [],
        webhooks: hooks.items ?? [],
      });
      setEmailForm(me.workspace.email || "");
    } catch (err) {
      if (!options?.silent) {
        clearStoredToken();
        navigate(buildAuthHref(location.pathname), { replace: true });
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleLogout = () => {
    clearStoredToken();
    navigate("/auth", { replace: true });
  };

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
        expires_in_minutes: invoiceForm.ttl,
        environment,
      });
      setCreatedInvoice(invoice);
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
      await createWebhookEndpoint(session.token, { ...hookForm, environment });
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
      void loadSession(session.token, { silent: true });
    } catch (err) { setError(formatApiError(err)); }
  }

  async function onUpgrade() {
    if (!session) return;
    try {
      const inv = await createBillingCheckout(session.token, {
        payable_network: billingForm.network,
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
      <div className="dev-portal">
        <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
        <div style={{ display: "grid", placeItems: "center", minHeight: "100vh", color: "var(--muted)" }}>
          {t.common.loading}
        </div>
      </div>
    );
  }

  if (!session) return null;

  const workspaceName = session.me.workspace.username || `#${session.me.workspace.id}`;
  const activeWalletsCount = filteredWallets.filter(w => w.is_active).length;
  const walletNetworks = new Set(filteredWallets.filter(w => w.is_active).map(w => w.network));
  const payableNetworkOptions = PAYABLE_NETWORK_OPTIONS.map(option => ({
    ...option,
    disabled: !walletNetworks.has(walletBucket(option.value)),
    hint: walletNetworks.has(walletBucket(option.value)) ? t.common.walletReady : t.common.addWalletFirst,
  }));

  const handleNavClick = (key: PanelKey) => {
    setActivePanel(key);
    setIsMobileMenuOpen(false);
  };

  return (
    <main className={`dev-portal ${isMobileMenuOpen ? "is-menu-open" : ""}`}>
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      
      {isMobileMenuOpen && (
        <div className="dev-portal__nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className="dev-portal__shell">
        <header className="dev-portal__topbar portal-animate-in">
          <Link className="dev-portal__brand" to="/" onClick={() => setIsMobileMenuOpen(false)}>reqst</Link>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="env-toggle">
              <button className={`env-toggle__btn ${environment === 'live' ? 'is-active' : ''}`} onClick={() => setEnvironment('live')}>{t.common.liveMode}</button>
              <button className={`env-toggle__btn ${environment === 'test' ? 'is-active' : ''}`} onClick={() => setEnvironment('test')}>{t.common.testMode}</button>
            </div>
            {session.me.workspaces.length > 1 && (
              <div className="workspace-switcher">
                {/* Simplified switcher for now */}
                <span className="dev-portal__nav-link dev-portal__seller-badge">{workspaceName}</span>
              </div>
            )}
            {!session.me.workspaces.length && <div className="dev-portal__nav-link dev-portal__seller-badge">{workspaceName}</div>}
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
          </div>
        </header>

        <div className="dev-portal__main">
          <nav className={`dev-portal__nav portal-animate-in ${isMobileMenuOpen ? "is-open" : ""}`} style={{ animationDelay: "0.1s" }}>
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.common.management}</span>
              {navItems.slice(0, 4).map(item => (
                <button key={item.key} className={`dev-portal__nav-link ${activePanel === item.key ? "is-active" : ""}`} onClick={() => handleNavClick(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">{t.common.advanced}</span>
              {navItems.slice(4).map(item => (
                <button key={item.key} className={`dev-portal__nav-link ${activePanel === item.key ? "is-active" : ""}`} onClick={() => handleNavClick(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="dev-portal__nav-group" style={{ marginTop: "auto" }}>
              <button className="dev-portal__nav-link" onClick={handleLogout} style={{ color: "var(--danger)" }}>{t.nav.logout}</button>
            </div>
          </nav>

          <div className="dev-portal__body">
            {error && <div className="alert portal-animate-in" onClick={() => setError("")}>{error}</div>}

            {activePanel === "overview" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__hero" style={{ padding: "1rem 0 2rem" }}>
                  <span className="dev-api-badge dev-api-badge--post" style={{ width: "fit-content" }}>{t.overview.badge}</span>
                  <h1>{t.overview.welcome} {session.me.user.username || 'User'}</h1>
                  <p>{t.overview.subtitle} {t.overview.currentWorkspace}: <strong>{workspaceName}</strong></p>
                </div>

                <div className="dev-widget-grid">
                  <div className="dev-card dev-card--accent dev-widget">
                    <span className="dev-widget__label">{t.overview.stats.plan}</span>
                    <div className="dev-widget__value">{session.me.plan.name}</div>
                    <div className="dev-widget__meta">
                      {session.me.plan.code === 'trial' ? `${t.billing.trial}` : t.billing.active}
                    </div>
                  </div>
                  <div className="dev-card dev-widget">
                    <span className="dev-widget__label">{t.overview.stats.networks}</span>
                    <div className="dev-widget__value"><LiveValue value={activeWalletsCount} /></div>
                    <div className="dev-widget__meta">/{WALLET_NETWORK_OPTIONS.length} {t.overview.active} ({environment})</div>
                  </div>
                  <div className="dev-card dev-widget">
                    <span className="dev-widget__label">{t.overview.stats.invoices}</span>
                    <div className="dev-widget__value"><LiveValue value={filteredInvoices.length} /></div>
                    <div className="dev-widget__meta">{t.overview.totalIn} {environment}</div>
                  </div>
                </div>

                {session.me.plan.code === 'trial' && (
                  <div className="dev-card dev-card--accent dev-promo-card portal-animate-in">
                    <div className="dev-promo-card__content">
                      <h3>{t.promo.title}</h3>
                      <p>{t.promo.subtitle}</p>
                    </div>
                    <button className="dev-btn dev-btn--primary dev-promo-card__btn" onClick={() => setActivePanel("billing")}>
                      {t.promo.action}
                    </button>
                  </div>
                )}

                <div className="dev-card">
                  <div className="dev-portal__section-header" style={{ marginBottom: "1.5rem" }}>
                    <h3>{t.overview.activity} ({environment})</h3>
                  </div>
                  {filteredInvoices.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>{t.overview.noActivity}</div>
                  ) : (
                    <div className="dev-resource-list">
                      {filteredInvoices.slice(0, 5).map(inv => (
                        <div key={inv.id} className="dev-resource-card" style={{ padding: "0.75rem 1rem" }} onClick={() => setActivePanel("invoices")}>
                          <div className="dev-resource-card__info" style={{ gap: "0.15rem" }}>
                            <div className="dev-resource-card__title" style={{ fontSize: "0.95rem" }}>{inv.title}</div>
                            <div className="dev-resource-card__meta" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                              <span className={`dev-api-badge dev-api-badge--${getInvoiceStatusMeta(inv.status).tone === 'success' ? 'get' : 'post'}`} style={{ padding: "0.1rem 0.4rem", fontSize: "0.65rem" }}>
                                {formatInvoiceStatus(inv.status, language, true)}
                              </span>
                              <span style={{ opacity: 0.6 }}>{inv.payable_amount} {inv.payable_network}</span>
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
                <div className="dev-card">
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

                  <div className="dev-resource-list" style={{ marginTop: "2.5rem" }}>
                    {filteredWallets.length === 0 ? (
                      <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)", border: "1px dashed var(--line)", borderRadius: "20px" }}>
                        {t.wallets.empty}
                      </div>
                    ) : filteredWallets.map(w => (
                      <div key={w.id} className="dev-resource-card dev-wallet-card">
                        <div className="dev-resource-card__info">
                          <div className="dev-resource-card__title">{w.network}</div>
                          <code className="dev-resource-card__meta dev-wallet-address">{w.address}</code>
                        </div>
                        <button className="dev-btn dev-btn--danger dev-wallet-delete" onClick={() => void onDeleteWallet(w.id)}>{t.common.delete}</button>
                      </div>
                    ))}
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
                <div className="dev-resource-list">
                  {filteredInvoices.length === 0 ? (
                    <div className="dev-card" style={{ textAlign: "center", padding: "4rem", color: "var(--muted)" }}>{t.invoices.empty}</div>
                  ) : filteredInvoices.map(inv => (
                    <div key={inv.id} className="dev-card" style={{ padding: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                        <div>
                          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span className={`dev-api-badge dev-api-badge--${getInvoiceStatusMeta(inv.status).tone === 'success' ? 'get' : 'post'}`}>
                              {formatInvoiceStatus(inv.status, language, true)}
                            </span>
                            <span className="dev-api-badge" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--line)" }}>{formatNetworkLabel(inv.payable_network)}</span>
                          </div>
                          <h3 style={{ fontSize: "1.25rem", margin: 0 }}>{inv.title}</h3>
                          <code style={{ fontSize: "0.8rem", opacity: 0.4 }}>{inv.public_id}</code>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{inv.payable_amount} <small style={{ fontSize: "0.9rem", opacity: 0.5 }}>{inv.payable_network}</small></div>
                          <div style={{ fontSize: "0.85rem", opacity: 0.5 }}>{new Date(inv.created_at).toLocaleString()}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                        <button className="dev-btn dev-btn--secondary" style={{ flexGrow: 1 }} onClick={() => handleCopy(buildCheckoutUrl(inv.public_id), `inv-${inv.id}`)}>
                          {copiedId === `inv-${inv.id}` ? t.common.copied : t.invoices.copyLink}
                        </button>
                        <a href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary" style={{ flexGrow: 1, textAlign: "center" }}>{t.invoices.view}</a>
                        {(getInvoiceStatusMeta(inv.status).canSellerMarkPaid || getInvoiceStatusMeta(inv.status).canSellerCancel) && (
                          <>
                            {getInvoiceStatusMeta(inv.status).canSellerMarkPaid ? <button className="dev-btn dev-btn--secondary" style={{ flexGrow: 1, color: "var(--success)" }} onClick={() => void onInvoiceAction(inv.id, "mark_paid")}>{t.invoices.confirm}</button> : null}
                            {getInvoiceStatusMeta(inv.status).canSellerCancel ? <button className="dev-btn dev-btn--danger" style={{ flexGrow: 1 }} onClick={() => void onInvoiceAction(inv.id, "cancel")}>{t.invoices.cancel}</button> : null}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "create" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.create.title} ({environment})</h2>
                  <p>{t.create.subtitle}</p>
                </div>
                <div className="dev-card" style={{ maxWidth: "640px" }}>
                  <form onSubmit={onCreateInvoice} className="dev-form">
                    <div className="dev-input-group">
                      <label>{t.create.service}</label>
                      <input className="dev-input" value={invoiceForm.title} onChange={e => setInvoiceForm(c => ({ ...c, title: e.target.value }))} required />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                      <label>{t.create.network}</label>
                      <CustomSelect
                        value={invoiceForm.network}
                        options={payableNetworkOptions}
                        ariaLabel={t.create.network}
                        onChange={(v) => setInvoiceForm(c => ({ ...c, network: v as Network }))}
                      />
                    </div>
                    <button type="submit" className="dev-btn dev-btn--primary" style={{ padding: "1.25rem", fontSize: "1rem" }} disabled={isCreatingInvoice || activeWalletsCount === 0}>
                      {isCreatingInvoice ? t.common.creating : t.create.generate}
                    </button>
                  </form>
                  {createdInvoice ? (
                    <div className="alert alert--success" style={{ marginTop: "1rem" }}>
                      <strong>{t.create.success}</strong>
                      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                        <button className="dev-btn dev-btn--secondary" onClick={() => handleCopy(buildCheckoutUrl(createdInvoice.public_id), "created-invoice")}>
                          {copiedId === "created-invoice" ? t.common.copied : t.invoices.copyLink}
                        </button>
                        <a className="dev-btn dev-btn--primary" href={buildCheckoutPath(createdInvoice.public_id)} target="_blank" rel="noreferrer">{t.invoices.view}</a>
                      </div>
                    </div>
                  ) : null}
                </div>
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
                    <div className="dev-card">
                      <div className="dev-portal__section-header" style={{ marginBottom: "1.5rem" }}>
                        <h3>{t.developer.keysTitle}</h3>
                        <p>{t.developer.keysSubtitle}</p>
                      </div>
                      <form onSubmit={onCreateKey} className="dev-form">
                        <div className="dev-api-grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "flex-end", gap: "1rem" }}>
                          <div className="dev-input-group">
                            <label>{t.developer.keyLabel}</label>
                            <input className="dev-input" value={keyForm.label} onChange={e => setKeyForm({ label: e.target.value })} placeholder="Production App" required />
                          </div>
                          <button type="submit" className="dev-btn dev-btn--primary">{t.developer.addKey}</button>
                        </div>
                      </form>

                      {latestKeySecret && (
                        <div className="alert alert--success" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <small style={{ display: "block", marginBottom: "0.25rem" }}>{t.developer.warning}</small>
                            <code style={{ fontSize: "1.1rem" }}>{latestKeySecret}</code>
                          </div>
                          <button className="dev-code-box__copy" onClick={() => handleCopy(latestKeySecret, "latest-key")}>
                            {copiedId === "latest-key" ? t.common.copied : t.common.copy}
                          </button>
                        </div>
                      )}

                      <div className="dev-resource-list" style={{ marginTop: "2rem" }}>
                        {filteredKeys.map(key => (
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

                    <div className="dev-card">
                      <div className="dev-portal__section-header" style={{ marginBottom: "1.5rem" }}>
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

                      <div className="dev-resource-list" style={{ marginTop: "2rem" }}>
                        {filteredHooks.map(hook => (
                          <div key={hook.id} className="dev-resource-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div className="dev-resource-card__info">
                                <div className="dev-resource-card__title">{hook.label}</div>
                                <code style={{ opacity: 0.6, fontSize: "0.85rem" }}>{hook.url}</code>
                              </div>
                              <button className="dev-btn dev-btn--danger" onClick={() => void onDeleteHook(hook.id)}>{t.common.delete}</button>
                            </div>
                            <div className="dev-card" style={{ padding: "0.75rem 1rem", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.5, display: "block" }}>{t.developer.hookSecret}</span>
                                <code style={{ fontSize: "0.85rem" }}>{hook.secret}</code>
                              </div>
                              <button className="dev-code-box__copy" onClick={() => handleCopy(hook.secret, `hook-${hook.id}`)}>
                                {copiedId === `hook-${hook.id}` ? t.common.copied : t.common.copy}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activePanel === "team" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.team.title}</h2>
                  <p>{t.team.subtitle}</p>
                </div>
                <div className="dev-card">
                  <div className="dev-resource-list">
                    <div className="dev-resource-card">
                      <div className="dev-resource-card__info">
                         <div className="dev-resource-card__title">{session.me.user.username || `@${session.me.user.telegram_id}`} ({t.team.you})</div>
                         <div className="dev-resource-card__meta">{t.team.owner}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px dashed var(--line)", borderRadius: "20px", textAlign: "center" }}>
                    <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>{t.team.inviteBody}</p>
                    <button className="dev-btn dev-btn--secondary" disabled>{t.team.add} ({t.team.comingSoon})</button>
                  </div>
                </div>
              </div>
            )}

            {activePanel === "billing" && (
              <div className="dev-portal__section portal-animate-in">
                <div className="dev-portal__section-header">
                  <h2>{t.billing.title}</h2>
                  <p>{t.billing.subtitle}</p>
                </div>
                <div className="dev-card dev-billing-card">
                  <div className="dev-form">
                    <h3>{t.billing.upgrade}</h3>
                    <div className="dev-input-group">
                      <label>{t.common.plan}</label>
                      <CustomSelect
                        value={billingForm.plan}
                        options={session.me.plans.filter(p => p.code !== 'enterprise' && p.code !== 'trial').map(p => ({ value: p.code, label: p.name }))}
                        ariaLabel={t.common.plan}
                        onChange={v => setBillingForm(c => ({ ...c, plan: v }))}
                      />
                    </div>
                    <div className="dev-input-group">
                      <label>{t.common.network}</label>
                      <CustomSelect
                        value={billingForm.network}
                        options={NETWORK_OPTIONS}
                        ariaLabel={t.common.network}
                        onChange={v => setBillingForm(c => ({ ...c, network: v as Network }))}
                      />
                    </div>
                    <button className="dev-btn dev-btn--primary" onClick={onUpgrade}>{t.billing.upgrade}</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px solid var(--line)", paddingLeft: "2rem", gap: "1.5rem" }}>
                    {checkoutUrl ? (
                      <div className="dev-form">
                        <div className="alert alert--success" style={{ marginBottom: 0 }}>{t.common.checkoutGenerated}</div>
                        <code className="dev-input" style={{ fontSize: "0.85rem", background: "rgba(0,0,0,0.2)" }}>{checkoutUrl}</code>
                        <div style={{ display: "flex", gap: "1rem" }}>
                          <button className="dev-btn dev-btn--secondary" style={{ flexGrow: 1 }} onClick={() => handleCopy(checkoutUrl, "billing-url")}>
                            {copiedId === "billing-url" ? t.common.copied : t.common.copy}
                          </button>
                          <a href={checkoutUrl} target="_blank" rel="noreferrer" className="dev-btn dev-btn--primary" style={{ flexGrow: 1, textAlign: "center" }}>{t.common.payNow}</a>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--muted)" }}>
                        <p style={{ fontSize: "0.95rem" }}>{t.billing.current}: <strong style={{ color: "var(--ink)" }}>{session.me.plan.name}</strong></p>
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
                <div className="dev-card" style={{ maxWidth: "600px" }}>
                  <div className="dev-input-group">
                    <label>{t.settings.language}</label>
                    <div className="dev-api-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <button className={`dev-btn ${language === 'ru' ? 'dev-btn--primary' : 'dev-btn--secondary'}`} onClick={() => setLanguage('ru')}>RU</button>
                      <button className={`dev-btn ${language === 'en' ? 'dev-btn--primary' : 'dev-btn--secondary'}`} onClick={() => setLanguage('en')}>EN</button>
                    </div>
                  </div>

                  <div className="dev-input-group" style={{ marginTop: "2.5rem", padding: "1.5rem", borderRadius: "20px", background: "rgba(255, 137, 125, 0.05)", border: "1px solid rgba(255, 137, 125, 0.1)" }}>
                    <label style={{ color: "var(--danger)" }}>{t.settings.session}</label>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1rem" }}>{t.settings.logoutHint}</p>
                    <button className="dev-btn dev-btn--danger" style={{ width: "100%" }} onClick={handleLogout}>{t.nav.logout}</button>
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

const NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "BASE", label: "BASE" },
  { value: "ARBITRUM", label: "ARBITRUM" },
  { value: "BSC", label: "BSC" },
  { value: "EVM", label: "ETH" },
  { value: "TON", label: "TON" },
];
