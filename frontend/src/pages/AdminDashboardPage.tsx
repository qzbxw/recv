import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  blockAdminWorkspace,
  changeAdminWorkspacePlan,
  clearStoredAdminToken,
  createAdminBillingCheckout,
  createAdminInternalComment,
  fetchAdminAnalytics,
  fetchAdminWebVitals,
  fetchAdminUTMReport,
  fetchAdminAuditEvents,
  fetchAdminInvoices,
  fetchAdminOpsOverview,
  fetchAdminSEOTargets,
  fetchAdminSEORedirects,
  fetchAdminWorkspaces,
  fetchAdminBillingWallets,
  updateAdminBillingWallets,
  fetchReferralPartners,
  createReferralPartner,
  updateReferralPartner,
  fetchReferralPartnerReport,
  createReferralPayout,
  createAdminSEORedirect,
  deleteAdminSEORedirect,
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  refreshAdminInvoiceStatus,
  resendAdminWebhookDelivery,
  reviewAdminInvoice,
  setStoredAdminToken,
  fetchAdminPromoCodes,
  createAdminPromoCode,
  deleteAdminPromoCode,
  clearStoredAdminRefreshToken,
  getStoredAdminRefreshToken,
  setStoredAdminRefreshToken,
} from "../lib/api";
import { ApiError } from "../lib/errors";
import { CustomSelect } from "../components/CustomSelect";
import { buildCheckoutUrl, buildCheckoutPath } from "../lib/routing";
import { formatPaymentAssetLabel } from "../lib/status";
import type {
  AdminAnalyticsResponse,
  AdminAuditEvent,
  AdminInvoice,
  AdminInvoiceListResponse,
  AdminOpsOverviewResponse,
  AdminWebhookDelivery,
  AdminWorkspace,
  SEOTarget,
  SEORedirect,
  WebVitalsReport,
  UTMReport,
  ReferralPartnerPayload,
  ReferralPartnerReport,
  ReferralPartnerStats,
  PromoCode,
} from "../lib/types";

type PanelKey = "overview" | "invoices" | "review" | "workspaces" | "webhooks" | "analytics" | "partners" | "audit" | "content" | "settings" | "promocodes";

type Filters = { status: string; kind: string; query: string };
const DEFAULT_FILTERS: Filters = { status: "all", kind: "all", query: "" };

const PLAN_OPTIONS = [
  { value: "trial", label: "Trial" },
  { value: "merchant", label: "Merchant" },
  { value: "developer", label: "Developer" },
  { value: "business", label: "Business" },
];

const NETWORK_OPTIONS = [
  { value: "TON", label: "GRAM on TON" },
  { value: "TON_USDT", label: "USDT on TON" },
  { value: "TRON", label: "TRON USDT" },
  { value: "BASE", label: "Base USDC" },
  { value: "BSC", label: "BSC USDT" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "awaiting_payment", label: "Awaiting payment" },
  { value: "paid", label: "Paid" },
  { value: "underpaid", label: "Underpaid" },
  { value: "overpaid", label: "Overpaid" },
  { value: "manual_review", label: "Manual review" },
  { value: "expired", label: "Expired" },
];

const KIND_OPTIONS = [
  { value: "all", label: "All kinds" },
  { value: "merchant", label: "Merchant" },
  { value: "subscription", label: "Subscription" },
];

const GROUP_BY_OPTIONS = [
  { value: "date", label: "By date" },
  { value: "network", label: "By network" },
  { value: "plan", label: "By plan" },
  { value: "mode", label: "By mode" },
];

function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusTone(status: string): string {
  switch (status) {
    case "paid": return "success";
    case "awaiting_payment": return "warning";
    case "underpaid": return "danger";
    case "overpaid": return "info";
    case "manual_review": return "review";
    case "expired":
    case "cancelled": return "neutral";
    default: return "neutral";
  }
}

function prettyStatus(status: string) {
  return status.replace(/_/g, " ");
}

const ICONS: Record<PanelKey | "logout" | "refresh", React.ReactNode> = {
  overview: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>,
  invoices: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>,
  review: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  workspaces: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  webhooks: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  analytics: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  partners: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" opacity="0" /><path d="M18 8a3 3 0 1 0-6 0c0 1.5.7 2.4 1.6 3.1.5.4.4 1.2-.2 1.4C10.5 13.6 8 15.2 8 18h12c0-2.8-2.5-4.4-5.4-5.5-.6-.2-.7-1-.2-1.4.9-.7 1.6-1.6 1.6-3.1z" /><path d="M9 11a2.5 2.5 0 1 0-5 0c0 1.2.6 2 1.3 2.6.4.3.3 1-.2 1.2C3.1 15.6 1 16.9 1 19h6" /></svg>,
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  content: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  promocodes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" strokeLinecap="round" strokeWidth="3" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
};

function ToneBadge({ status }: { status: string }) {
  return <span className={`dev-api-badge dev-status-badge dev-status-badge--${statusTone(status)}`}>{prettyStatus(status)}</span>;
}

function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
  if (!window.matchMedia("(hover: hover)").matches) return;
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
}

export function AdminDashboardPage() {
  const [token, setToken] = useState(() => getStoredAdminToken() || "");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [activePanel, setActivePanel] = useState<PanelKey>("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [overview, setOverview] = useState<AdminOpsOverviewResponse | null>(null);
  const [invoiceList, setInvoiceList] = useState<AdminInvoiceListResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [webVitals, setWebVitals] = useState<WebVitalsReport | null>(null);
  const [utmReport, setUtmReport] = useState<UTMReport | null>(null);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [seoTargets, setSeoTargets] = useState<SEOTarget[]>([]);
  const [seoRedirects, setSeoRedirects] = useState<SEORedirect[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState<"date" | "network" | "plan" | "mode">("date");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const invoices = invoiceList?.items || [];

  const resetAdminSession = useCallback((message?: string) => {
    clearStoredAdminToken();
    clearStoredAdminRefreshToken();
    setToken("");
    setOverview(null);
    setInvoiceList(null);
    setAnalytics(null);
    setWebVitals(null);
    setUtmReport(null);
    setAuditEvents([]);
    setSeoTargets([]);
    setSeoRedirects([]);
    setWorkspaces([]);
    if (message) setError(message);
  }, []);

  const loadDashboard = useCallback(async (activeToken: string, nextFilters: Filters) => {
    setLoading(true);
    setError("");
    try {
      const nextOverview = await fetchAdminOpsOverview(activeToken);
      const currentToken = getStoredAdminToken() || activeToken;
      if (currentToken !== activeToken) {
        setToken(currentToken);
      }
      const [nextInvoices, nextAnalytics, nextVitals, nextUTM, nextAuditEvents, nextSEO, nextWorkspaces, nextRedirects] = await Promise.all([
        fetchAdminInvoices(currentToken, { page: 1, page_size: 50, ...nextFilters }),
        fetchAdminAnalytics(currentToken, { group_by: analyticsGroupBy }),
        fetchAdminWebVitals(currentToken).catch(() => null),
        fetchAdminUTMReport(currentToken).catch(() => null),
        fetchAdminAuditEvents(currentToken),
        fetchAdminSEOTargets(currentToken),
        fetchAdminWorkspaces(currentToken).catch(() => ({ items: [] })),
        fetchAdminSEORedirects(currentToken).catch(() => ({ items: [] })),
      ]);
      setOverview(nextOverview);
      setInvoiceList(nextInvoices);
      setAnalytics(nextAnalytics);
      setWebVitals(nextVitals);
      setUtmReport(nextUTM);
      setAuditEvents(nextAuditEvents.items || []);
      setSeoTargets(nextSEO.items || []);
      setWorkspaces(nextWorkspaces.items || []);
      setSeoRedirects(nextRedirects.items || []);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        resetAdminSession("Admin session expired. Sign in again.");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [analyticsGroupBy, resetAdminSession]);

  useEffect(() => {
    if (token) void loadDashboard(token, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => {
      resetAdminSession("Admin session expired. Sign in again.");
    };
    window.addEventListener("recv_admin_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("recv_admin_unauthorized", handleUnauthorized);
  }, [resetAdminSession]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await loginAdmin(credentials);
      if (!response.token) throw new Error("Admin token was not returned");
      setStoredAdminToken(response.token);
      setStoredAdminRefreshToken(response.refresh_token || "");
      setToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    void logoutAdmin(getStoredAdminRefreshToken()).catch(() => undefined);
    resetAdminSession();
  }

  const runAction = useCallback(async (key: string, fn: () => Promise<{ result: string }>) => {
    if (!token) return;
    setBusyKey(key);
    setError("");
    try {
      const response = await fn();
      setToast(response.result || "Done");
      await loadDashboard(token, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed");
    } finally {
      setBusyKey("");
    }
  }, [token, filters, loadDashboard]);

  function handleNavClick(key: PanelKey) {
    setActivePanel(key);
    setIsMobileMenuOpen(false);
  }

  async function applyFilters(next: Filters) {
    setFilters(next);
    if (token) await loadDashboard(token, next);
  }

  async function reloadAnalytics(groupBy: "date" | "network" | "plan" | "mode") {
    setAnalyticsGroupBy(groupBy);
    if (!token) return;
    try {
      const res = await fetchAdminAnalytics(token, { group_by: groupBy });
      setAnalytics(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    }
  }

  if (!token) {
    return (
      <main className="dev-portal dev-portal--console admin-auth">
        <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
        <section className="admin-auth__wrap portal-animate-in">
          <div className="dev-card admin-auth__card console-spotlight-card" onMouseMove={handleMouseMove}>
            <div className="console-card-spotlight" />
            <div className="admin-auth__brand">
              <strong>recv<span className="brand-dot">.</span></strong>
              <span className="dev-api-badge dev-api-badge--post dev-api-badge--micro">Ops Center</span>
            </div>
            <h1>Admin sign in</h1>
            <p className="dev-card__note-text">Operate merchants, invoices, billing, webhooks and content.</p>
            <form className="dev-form" onSubmit={handleLogin}>
              <div className="dev-input-group">
                <label>Email</label>
                <input className="dev-input" value={credentials.username} onChange={(e) => setCredentials({ ...credentials, username: e.target.value })} autoComplete="username" />
              </div>
              <div className="dev-input-group">
                <label>Password</label>
                <input className="dev-input" type="password" value={credentials.password} onChange={(e) => setCredentials({ ...credentials, password: e.target.value })} autoComplete="current-password" />
              </div>
              {error && <div className="alert">{error}</div>}
              <button type="submit" className="dev-btn dev-btn--primary dev-btn--large" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const navGroups: Array<{ label: string; items: Array<{ key: PanelKey; label: string; badge?: number }> }> = [
    {
      label: "Operations",
      items: [
        { key: "overview", label: "Overview" },
        { key: "invoices", label: "Invoices" },
        { key: "review", label: "Manual review", badge: overview?.invoices.manual_review || 0 },
        { key: "workspaces", label: "Workspaces" },
        { key: "promocodes", label: "Promo Codes" },
      ],
    },
    {
      label: "Insights & content",
      items: [
        { key: "webhooks", label: "Webhooks", badge: overview?.failed_webhook_queue?.length || 0 },
        { key: "analytics", label: "Analytics" },
        { key: "partners", label: "Partners" },
        { key: "audit", label: "Audit log" },
        { key: "content", label: "Content & SEO" },
        { key: "settings", label: "Settings" },
      ],
    },
  ];

  return (
    <main className={`dev-portal dev-portal--console admin-ops ${isMobileMenuOpen ? "is-menu-open" : ""}`}>
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      {isMobileMenuOpen && <div className="dev-portal__nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />}

      <div className="dev-portal__layout">
        <aside className={`dev-portal__sidebar portal-animate-in ${isMobileMenuOpen ? "is-open" : ""}`}>
          <div className="dev-portal__sidebar-brand">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ textDecoration: "none" }}>
              <strong>recv<span className="brand-dot">.</span></strong>
            </Link>
            <span className="dev-api-badge dev-api-badge--post dev-api-badge--micro admin-brand-tag">Ops</span>
          </div>
          <nav className="dev-portal__nav-menu">
            {navGroups.map((group) => (
              <div className="dev-portal__nav-group" key={group.label}>
                <span className="dev-portal__nav-label">{group.label}</span>
                {group.items.map((item) => (
                  <button key={item.key} className={`dev-portal__nav-link ${activePanel === item.key ? "is-active" : ""}`} onClick={() => handleNavClick(item.key)}>
                    {ICONS[item.key]}
                    <span className="admin-nav-text">{item.label}</span>
                    {item.badge ? <span className="admin-nav-badge">{item.badge}</span> : null}
                  </button>
                ))}
              </div>
            ))}
            <div className="dev-portal__nav-group dev-portal__nav-logout">
              <button className="dev-portal__nav-link dev-btn--danger-color" onClick={handleLogout}>
                {ICONS.logout}
                <span className="admin-nav-text">Logout</span>
              </button>
            </div>
          </nav>
        </aside>

        <div className="dev-portal__content">
          <header className="dev-portal__header portal-animate-in">
            <div className="dev-portal__mobile-brand-row">
              <button className="dev-portal__menu-trigger" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu">
                <div className="dev-portal__menu-icon"><span /><span /><span /></div>
              </button>
              <Link className="dev-portal__brand-mobile" to="/" style={{ textDecoration: "none" }}>
                <strong>recv<span className="brand-dot">.</span></strong>
              </Link>
            </div>
            <div className="dev-portal__header-actions">
              <div className="dev-portal__workspace-badge admin-snapshot">
                <span>Last snapshot</span>
                <strong>{overview ? formatDateTime(overview.generated_at) : "Loading…"}</strong>
              </div>
              <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact admin-refresh-btn" onClick={() => void loadDashboard(token, filters)} disabled={loading}>
                {ICONS.refresh}<span>{loading ? "Refreshing…" : "Refresh"}</span>
              </button>
            </div>
          </header>

          <div className="dev-portal__body">
            {error && <div className="alert portal-animate-in" onClick={() => setError("")}>{error}</div>}
            {toast && <div className="alert alert--success portal-animate-in" onClick={() => setToast("")}>{toast}</div>}

            {activePanel === "overview" && (
              <OverviewPanel overview={overview} busyKey={busyKey} runAction={runAction} onGoto={handleNavClick} />
            )}

            {activePanel === "invoices" && (
              <InvoicesPanel
                invoices={invoices}
                total={invoiceList?.total || 0}
                filters={filters}
                onApplyFilters={applyFilters}
                workspaces={workspaces}
                busyKey={busyKey}
                runAction={runAction}
                loading={loading}
              />
            )}

            {activePanel === "review" && (
              <ReviewPanel queue={overview?.manual_review_queue || []} busyKey={busyKey} runAction={runAction} />
            )}

            {activePanel === "workspaces" && (
              <WorkspacesPanel workspaces={workspaces} busyKey={busyKey} runAction={runAction} />
            )}

            {activePanel === "webhooks" && (
              <WebhooksPanel deliveries={overview?.failed_webhook_queue || []} busyKey={busyKey} runAction={runAction} />
            )}

            {activePanel === "analytics" && (
              <AnalyticsPanel analytics={analytics} webVitals={webVitals} utmReport={utmReport} groupBy={analyticsGroupBy} onGroupBy={(g) => void reloadAnalytics(g)} setToast={setToast} />
            )}

            {activePanel === "partners" && (
              <PartnersPanel token={token} setToast={setToast} setError={setError} />
            )}

            {activePanel === "audit" && <AuditPanel events={auditEvents} />}

            {activePanel === "content" && (
              <ContentPanel
                targets={seoTargets}
                redirects={seoRedirects}
                token={token}
                onChanged={() => loadDashboard(token, filters)}
                setToast={setToast}
                setError={setError}
              />
            )}

            {activePanel === "settings" && <SettingsPanel token={token} setToast={setToast} setError={setError} />}
            {activePanel === "promocodes" && (
              <PromoCodesPanel token={token} setToast={setToast} setError={setError} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------------- panels ---------------- */

function PanelHeader({ title, subtitle, children }: { title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="admin-panel-head">
      <div className="dev-portal__section-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {children ? <div className="admin-panel-head__actions">{children}</div> : null}
    </div>
  );
}

function MetricCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="dev-metric-item console-spotlight-card" onMouseMove={handleMouseMove}>
      <div className="console-card-spotlight" />
      <span className="dev-metric-label">{label}</span>
      <strong className="dev-metric-value">{value}</strong>
      <span className="dev-metric-meta">{meta}</span>
    </div>
  );
}

type ActionRunner = (key: string, fn: () => Promise<{ result: string }>) => Promise<void>;

function OverviewPanel({ overview, busyKey, runAction, onGoto }: {
  overview: AdminOpsOverviewResponse | null;
  busyKey: string;
  runAction: ActionRunner;
  onGoto: (key: PanelKey) => void;
}) {
  if (!overview) {
    return <div className="dev-card dev-portal__empty-large">Loading operations snapshot…</div>;
  }
  const totalStatus = overview.invoices.total || 1;
  const maxNet = (overview.network_breakdown || []).reduce((m, n) => Math.max(m, Number(n.paid_usd)), 0) || 1;
  const metricCards = [
    { label: "Gross paid", value: formatMoney(overview.revenue.gross_paid_usd), meta: `${overview.invoices.paid} paid invoices` },
    { label: "Open volume", value: formatMoney(overview.revenue.open_invoice_usd), meta: `${overview.invoices.manual_review} in review` },
    { label: "Workspaces", value: overview.workspaces.total.toLocaleString("en-US"), meta: `${overview.workspaces.active_subscribers} subscribers · ${overview.workspaces.blocked} blocked` },
    { label: "Subscriptions", value: overview.subscriptions.active.toLocaleString("en-US"), meta: `${overview.subscriptions.paid_invoices} paid checkouts` },
    { label: "Manual review", value: String(overview.invoices.manual_review), meta: "needs attention" },
    { label: "Underpaid", value: String(overview.invoices.underpaid), meta: "follow up required" },
    { label: "Failed webhooks", value: String(overview.failed_webhook_queue?.length || 0), meta: "in retry queue" },
    { label: "Bot queue", value: String((overview.notification_health.pending_total || 0) + (overview.notification_health.failed_total || 0)), meta: `${overview.notification_health.sent_24h} sent in 24h` },
  ];
  return (
    <div className="dev-portal__section portal-animate-in">
      <div className="dev-portal__hero dev-portal__hero--compact">
        <span className="dev-api-badge dev-api-badge--post dev-api-badge--fit">Operations</span>
        <h1>Ops overview</h1>
        <p>Live snapshot of revenue, invoices, infrastructure health and the work queues that need a human.</p>
      </div>

      <div className="dev-metrics-grid">
        {metricCards.map((m) => <MetricCard key={m.label} {...m} />)}
      </div>

      <div className="dev-analytics-panel">
        <div className="dev-analytics-col console-spotlight-card" onMouseMove={handleMouseMove}>
          <div className="console-card-spotlight" />
          <div className="dev-portal__section-header dev-portal__section-header--margin">
            <h3>Status mix</h3>
            <p>{overview.invoices.total} invoices total</p>
          </div>
          <div className="dev-breakdown">
            {(overview.status_breakdown || []).map((item) => {
              const pct = Math.round((item.count / totalStatus) * 100);
              return (
                <div key={item.status} className="dev-breakdown__row">
                  <div className="dev-breakdown__head">
                    <span className={`dev-status-dot dev-status-dot--${statusTone(item.status)}`} />
                    <span className="dev-breakdown__label">{prettyStatus(item.status)}</span>
                    <span className="dev-breakdown__value">{item.count} · {formatMoney(item.usd)}</span>
                  </div>
                  <div className="dev-breakdown__track">
                    <div className={`dev-breakdown__fill dev-breakdown__fill--${statusTone(item.status)}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {(overview.status_breakdown || []).length === 0 && <div className="dev-portal__empty-state">No invoices yet.</div>}
          </div>
        </div>

        <div className="dev-analytics-col console-spotlight-card" onMouseMove={handleMouseMove}>
          <div className="console-card-spotlight" />
          <div className="dev-portal__section-header dev-portal__section-header--margin">
            <h3>Revenue by network</h3>
            <p>Paid volume per chain</p>
          </div>
          <div className="dev-breakdown">
            {(overview.network_breakdown || []).map((item) => (
              <div key={item.network} className="dev-breakdown__row">
                <div className="dev-breakdown__head">
                  <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{item.network}</span>
                  <span className="dev-breakdown__label">{item.paid_count} paid</span>
                  <span className="dev-breakdown__value">{formatMoney(item.paid_usd)}</span>
                </div>
                <div className="dev-breakdown__track">
                  <div className="dev-breakdown__fill dev-breakdown__fill--accent" style={{ width: `${Math.round((Number(item.paid_usd) / maxNet) * 100)}%` }} />
                </div>
              </div>
            ))}
            {(overview.network_breakdown || []).length === 0 && <div className="dev-portal__empty-state">No paid invoices yet.</div>}
          </div>
        </div>
      </div>

      <div className="dev-analytics-panel">
        <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
          <div className="console-card-spotlight" />
          <div className="dev-portal__section-header dev-portal__section-header--margin admin-inline-head">
            <h3>Manual review queue</h3>
            <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => onGoto("review")}>Open queue</button>
          </div>
          {(overview.manual_review_queue || []).length === 0 ? (
            <div className="dev-portal__empty-state">Queue is clear 🎉</div>
          ) : (
            <div className="dev-resource-list">
              {(overview.manual_review_queue || []).slice(0, 5).map((inv) => (
                <div key={inv.id} className="dev-resource-card">
                  <div className="dev-resource-card__info">
                    <div className="dev-resource-card__title">{inv.title}</div>
                    <div className="dev-resource-card__meta dev-resource-card__meta--row">
                      <ToneBadge status={inv.status} />
                      <span>{inv.workspace_name || `#${inv.workspace_id}`}</span>
                      <span className="dev-resource-card__amount">{formatMoney(inv.base_amount_usd)}</span>
                    </div>
                  </div>
                  <div className="dev-resource-card__actions">
                    <button className="dev-btn dev-btn--secondary dev-btn--compact dev-btn--success-color" disabled={!!busyKey} onClick={() => void runAction(`mp-${inv.id}`, () => reviewAdminInvoice(getStoredAdminToken() || "", inv.id, { result: "mark_paid", comment: "approved from overview" }))}>
                      Mark paid
                    </button>
                    <a className="dev-btn dev-btn--secondary dev-btn--compact" href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer">View</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
          <div className="console-card-spotlight" />
          <div className="dev-portal__section-header dev-portal__section-header--margin">
            <h3>Infrastructure health</h3>
            <p>Watcher freshness & webhook retries</p>
          </div>
          <div className="dev-resource-list">
            {(overview.watcher_health || []).slice(0, 6).map((w) => {
              const stale = w.freshness_seconds > 600;
              return (
                <div key={`${w.poll_network}-${w.destination_address}`} className="dev-resource-card">
                  <div className="dev-resource-card__info">
                    <div className="dev-resource-card__title">
                      <span className={`dev-status-dot dev-status-dot--${stale ? "danger" : "success"}`} /> {w.poll_network}
                    </div>
                    <div className="dev-resource-card__meta">block {w.last_block} · {Math.round(w.freshness_seconds / 60)}m ago</div>
                  </div>
                </div>
              );
            })}
            {(overview.watcher_health || []).length === 0 && <div className="dev-portal__empty-state">No watcher data.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceCard({ inv, workspaces, busyKey, runAction }: {
  inv: AdminInvoice;
  workspaces: AdminWorkspace[];
  busyKey: string;
  runAction: ActionRunner;
}) {
  const [manage, setManage] = useState(false);
  const [note, setNote] = useState("");
  const tok = () => getStoredAdminToken() || "";
  const ws = workspaces.find((w) => w.workspace.id === inv.workspace_id);
  const isBlocked = ws?.workspace.is_blocked ?? false;
  const busy = !!busyKey;
  return (
    <div className="dev-card dev-card--invoice console-spotlight-card" onMouseMove={handleMouseMove}>
      <div className="console-card-spotlight" />
      <div className="dev-card__head">
        <div>
          <div className="dev-card__status-row">
            <ToneBadge status={inv.status} />
            <span className="dev-api-badge dev-api-badge--secondary">{inv.payable_network}</span>
            <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{inv.kind}</span>
          </div>
          <h3 className="dev-card__title">{inv.title}</h3>
          <code className="dev-card__id">{inv.public_id}</code>
          <div className="dev-resource-card__meta admin-invoice-ws">
            {inv.workspace_name || `Workspace #${inv.workspace_id}`}{inv.user_email ? ` · ${inv.user_email}` : ""}
          </div>
        </div>
        <div className="dev-card__amount-col">
          <div className="dev-card__amount">{formatMoney(inv.base_amount_usd)}</div>
          <div className="dev-card__base">{inv.payable_amount} {formatPaymentAssetLabel(inv.payable_asset, inv.payable_network)}</div>
          <div className="dev-card__date">{formatDateTime(inv.created_at)}</div>
        </div>
      </div>

      <div className="dev-card__actions admin-actions">
        <a href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary dev-btn--compact dev-btn--centered">Open checkout</a>
        <button className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy} onClick={() => void runAction(`rf-${inv.id}`, () => refreshAdminInvoiceStatus(tok(), inv.id))}>
          {busyKey === `rf-${inv.id}` ? "…" : "Refresh status"}
        </button>
        <button className="dev-btn dev-btn--secondary dev-btn--compact dev-btn--success-color" disabled={busy} onClick={() => void runAction(`mp-${inv.id}`, () => reviewAdminInvoice(tok(), inv.id, { result: "mark_paid", comment: "approved" }))}>
          Mark paid
        </button>
        <button className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy} onClick={() => void runAction(`exp-${inv.id}`, () => reviewAdminInvoice(tok(), inv.id, { result: "expire", comment: "expired" }))}>
          Expire
        </button>
        <button className={`dev-btn dev-btn--compact ${manage ? "dev-btn--primary" : "dev-btn--secondary"}`} onClick={() => setManage((v) => !v)}>
          {manage ? "Close" : "Manage workspace"}
        </button>
      </div>

      {manage && (
        <div className="admin-manage">
          <div className="admin-manage__row">
            <span className="admin-manage__label">Workspace #{inv.workspace_id}{isBlocked ? " · blocked" : ""}</span>
            <button
              className={`dev-btn dev-btn--compact ${isBlocked ? "dev-btn--secondary dev-btn--success-color" : "dev-btn--danger"}`}
              disabled={busy}
              onClick={() => void runAction(`blk-${inv.workspace_id}`, () => blockAdminWorkspace(tok(), inv.workspace_id, { blocked: !isBlocked, reason: isBlocked ? "unblocked from invoice" : "blocked from invoice" }))}
            >
              {isBlocked ? "Unblock" : "Block"}
            </button>
          </div>
          <PlanChanger workspaceId={inv.workspace_id} busy={busy} runAction={runAction} />
          <BillingCheckout workspaceId={inv.workspace_id} busy={busy} runAction={runAction} />
          <div className="admin-manage__note">
            <input className="dev-input" placeholder="Internal note for this invoice" value={note} onChange={(e) => setNote(e.target.value)} />
            <button className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy || !note.trim()} onClick={() => void runAction(`note-${inv.id}`, async () => { const r = await createAdminInternalComment(tok(), { target_type: "invoice", target_id: String(inv.id), body: note }); setNote(""); return r; })}>
              Add note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanChanger({ workspaceId, busy, runAction }: { workspaceId: number; busy: boolean; runAction: ActionRunner }) {
  const [plan, setPlan] = useState<"trial" | "merchant" | "developer" | "business">("developer");
  const [days, setDays] = useState("30");
  const tok = () => getStoredAdminToken() || "";
  return (
    <div className="admin-manage__row admin-manage__form">
      <span className="admin-manage__label">Change plan</span>
      <div className="admin-manage__controls">
        <CustomSelect value={plan} options={PLAN_OPTIONS} ariaLabel="Plan" onChange={(v) => setPlan(v as typeof plan)} />
        <input className="dev-input admin-input--narrow" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value)} placeholder="days" />
        <button className="dev-btn dev-btn--primary dev-btn--compact" disabled={busy} onClick={() => void runAction(`plan-${workspaceId}`, () => changeAdminWorkspacePlan(tok(), workspaceId, { plan_code: plan, days: Number(days) || undefined, reason: "plan changed by admin" }))}>
          Apply
        </button>
      </div>
    </div>
  );
}

function BillingCheckout({ workspaceId, busy, runAction }: { workspaceId: number; busy: boolean; runAction: ActionRunner }) {
  const [plan, setPlan] = useState("merchant");
  const [network, setNetwork] = useState("TON");
  const [url, setUrl] = useState("");
  const tok = () => getStoredAdminToken() || "";
  return (
    <div className="admin-manage__row admin-manage__form">
      <span className="admin-manage__label">Billing checkout</span>
      <div className="admin-manage__controls">
        <CustomSelect value={plan} options={PLAN_OPTIONS.filter((p) => p.value !== "trial")} ariaLabel="Plan" onChange={setPlan} />
        <CustomSelect value={network} options={NETWORK_OPTIONS} ariaLabel="Network" onChange={setNetwork} />
        <button className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy} onClick={() => void runAction(`bill-${workspaceId}`, async () => {
          const r = await createAdminBillingCheckout(tok(), workspaceId, { plan_code: plan, payable_network: network });
          setUrl(buildCheckoutUrl(r.invoice.public_id));
          return { result: `Checkout created for ${r.plan.name}` };
        })}>
          Create
        </button>
      </div>
      {url && <a className="admin-manage__url" href={url} target="_blank" rel="noreferrer">{url}</a>}
    </div>
  );
}

function InvoicesPanel({ invoices, total, filters, onApplyFilters, workspaces, busyKey, runAction, loading }: {
  invoices: AdminInvoice[];
  total: number;
  filters: Filters;
  onApplyFilters: (f: Filters) => void;
  workspaces: AdminWorkspace[];
  busyKey: string;
  runAction: ActionRunner;
  loading: boolean;
}) {
  const [query, setQuery] = useState(filters.query);
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Invoices" subtitle={`${total} invoices match the current filters — act on them inline without leaving this page.`} />
      <div className="dev-card dev-toolbar console-spotlight-card admin-toolbar" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <form
          className="admin-toolbar__form"
          onSubmit={(e) => { e.preventDefault(); onApplyFilters({ ...filters, query }); }}
        >
          <input className="dev-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search seller, email, public id" />
          <CustomSelect value={filters.status} options={STATUS_OPTIONS} ariaLabel="Status" onChange={(v) => onApplyFilters({ ...filters, status: v })} />
          <CustomSelect value={filters.kind} options={KIND_OPTIONS} ariaLabel="Kind" onChange={(v) => onApplyFilters({ ...filters, kind: v })} />
          <button className="dev-btn dev-btn--primary" type="submit" disabled={loading}>Search</button>
        </form>
      </div>

      <div className="dev-resource-list">
        {invoices.length === 0 ? (
          <div className="dev-card dev-portal__empty-large">No invoices found for these filters.</div>
        ) : invoices.map((inv) => (
          <InvoiceCard key={inv.id} inv={inv} workspaces={workspaces} busyKey={busyKey} runAction={runAction} />
        ))}
      </div>
    </div>
  );
}

function ReviewPanel({ queue, busyKey, runAction }: { queue: AdminInvoice[]; busyKey: string; runAction: ActionRunner }) {
  const tok = () => getStoredAdminToken() || "";
  const [comments, setComments] = useState<Record<number, string>>({});
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Manual review" subtitle="Invoices flagged for a human decision. Resolve each one inline with an optional comment." />
      {queue.length === 0 ? (
        <div className="dev-card dev-portal__empty-large">Manual review queue is clear 🎉</div>
      ) : (
        <div className="dev-resource-list">
          {queue.map((inv) => {
            const comment = comments[inv.id] || "";
            const busy = !!busyKey;
            const decide = (result: "mark_paid" | "keep_manual_review" | "expire") =>
              runAction(`rev-${inv.id}`, () => reviewAdminInvoice(tok(), inv.id, { result, comment: comment || result }));
            return (
              <div key={inv.id} className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="console-card-spotlight" />
                <div className="dev-card__head">
                  <div>
                    <div className="dev-card__status-row">
                      <ToneBadge status={inv.status} />
                      <span className="dev-api-badge dev-api-badge--secondary">{inv.payable_network}</span>
                      {inv.classification && <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{inv.classification}</span>}
                    </div>
                    <h3 className="dev-card__title">{inv.title}</h3>
                    <code className="dev-card__id">{inv.public_id}</code>
                    <div className="dev-resource-card__meta admin-invoice-ws">{inv.workspace_name || `#${inv.workspace_id}`}{inv.user_email ? ` · ${inv.user_email}` : ""}</div>
                  </div>
                  <div className="dev-card__amount-col">
                    <div className="dev-card__amount">{formatMoney(inv.base_amount_usd)}</div>
                    <div className="dev-card__base">recv {inv.payable_amount} {formatPaymentAssetLabel(inv.payable_asset, inv.payable_network)}</div>
                    <div className="dev-card__date">{formatDateTime(inv.created_at)}</div>
                  </div>
                </div>
                {inv.tx_hash && (
                  <div className="dev-settings-row admin-tx-row">
                    <span className="dev-settings-row__label">tx hash</span>
                    <code className="dev-wallet-address">{inv.tx_hash}</code>
                  </div>
                )}
                <div className="admin-review-actions">
                  <input className="dev-input" placeholder="Decision comment (optional)" value={comment} onChange={(e) => setComments((c) => ({ ...c, [inv.id]: e.target.value }))} />
                  <div className="admin-actions">
                    <button className="dev-btn dev-btn--primary dev-btn--compact dev-btn--success-color" disabled={busy} onClick={() => void decide("mark_paid")}>Mark paid</button>
                    <button className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy} onClick={() => void decide("keep_manual_review")}>Keep in review</button>
                    <button className="dev-btn dev-btn--danger dev-btn--compact" disabled={busy} onClick={() => void decide("expire")}>Expire</button>
                    <a className="dev-btn dev-btn--secondary dev-btn--compact dev-btn--centered" href={buildCheckoutPath(inv.public_id)} target="_blank" rel="noreferrer">View</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WorkspacesPanel({ workspaces, busyKey, runAction }: { workspaces: AdminWorkspace[]; busyKey: string; runAction: ActionRunner }) {
  const [query, setQuery] = useState("");
  const tok = () => getStoredAdminToken() || "";
  const filtered = workspaces.filter((w) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (w.workspace.username || "").toLowerCase().includes(q)
      || (w.workspace.email || "").toLowerCase().includes(q)
      || String(w.workspace.id).includes(q);
  });
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Workspaces" subtitle="Every merchant with usage stats. Block, change plan or issue a billing checkout inline." />
      <div className="dev-card dev-toolbar console-spotlight-card admin-toolbar" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <input className="dev-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter by id, username or email" />
        <div className="dev-toolbar__meta">{filtered.length} workspaces</div>
      </div>
      {filtered.length === 0 ? (
        <div className="dev-card dev-portal__empty-large">No workspaces.</div>
      ) : (
        <div className="dev-resource-list">
          {filtered.map((w) => {
            const ws = w.workspace;
            const busy = !!busyKey;
            return (
              <div key={ws.id} className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="console-card-spotlight" />
                <div className="dev-card__head">
                  <div>
                    <div className="dev-card__status-row">
                      <span className="dev-api-badge dev-api-badge--post dev-api-badge--micro">{ws.plan_code}</span>
                      {ws.is_blocked && <span className="dev-api-badge dev-status-badge dev-status-badge--danger dev-api-badge--micro">blocked</span>}
                      {w.manual_review_invoices > 0 && <span className="dev-api-badge dev-status-badge dev-status-badge--warning dev-api-badge--micro">{w.manual_review_invoices} review</span>}
                    </div>
                    <h3 className="dev-card__title">{ws.username ? `@${ws.username}` : ws.name || `Workspace #${ws.id}`}</h3>
                    <code className="dev-card__id">#{ws.id}{ws.email ? ` · ${ws.email}` : ""}</code>
                  </div>
                  <div className="dev-card__amount-col">
                    <div className="dev-card__amount">{formatMoney(w.gross_paid_usd)}</div>
                    <div className="dev-card__base">{w.paid_invoices}/{w.invoices_total} paid</div>
                    <div className="dev-card__date">{w.active_api_keys} keys · {w.webhook_endpoints} hooks</div>
                  </div>
                </div>
                <div className="admin-manage admin-manage--flat">
                  <div className="admin-manage__row">
                    <span className="admin-manage__label">Last invoice {w.last_invoice_at ? formatDateTime(w.last_invoice_at) : "never"}</span>
                    <button
                      className={`dev-btn dev-btn--compact ${ws.is_blocked ? "dev-btn--secondary dev-btn--success-color" : "dev-btn--danger"}`}
                      disabled={busy}
                      onClick={() => void runAction(`blk-${ws.id}`, () => blockAdminWorkspace(tok(), ws.id, { blocked: !ws.is_blocked, reason: ws.is_blocked ? "unblocked by admin" : "blocked by admin" }))}
                    >
                      {ws.is_blocked ? "Unblock" : "Block"}
                    </button>
                  </div>
                  <PlanChanger workspaceId={ws.id} busy={busy} runAction={runAction} />
                  <BillingCheckout workspaceId={ws.id} busy={busy} runAction={runAction} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WebhooksPanel({ deliveries, busyKey, runAction }: { deliveries: AdminWebhookDelivery[]; busyKey: string; runAction: ActionRunner }) {
  const tok = () => getStoredAdminToken() || "";
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Webhooks" subtitle="Failed and stuck webhook deliveries. Resend any of them inline." />
      {deliveries.length === 0 ? (
        <div className="dev-card dev-portal__empty-large">No failed webhook deliveries 🎉</div>
      ) : (
        <div className="dev-resource-list">
          {deliveries.map((d) => {
            const tone = d.status === "delivered" ? "success" : d.status === "failed" || d.status === "exhausted" ? "danger" : "warning";
            const busy = !!busyKey;
            return (
              <div key={d.id} className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
                <div className="console-card-spotlight" />
                <div className="dev-card__head">
                  <div>
                    <div className="dev-card__status-row">
                      <span className={`dev-api-badge dev-status-badge dev-status-badge--${tone}`}>{d.status}</span>
                      <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{d.event_type}</span>
                    </div>
                    <h3 className="dev-card__title">{d.endpoint_label || d.workspace_name || `Delivery #${d.id}`}</h3>
                    <code className="dev-card__id">{d.endpoint_url || d.target_url}</code>
                    {d.last_error && <div className="dev-resource-card__error">{d.last_error}</div>}
                  </div>
                  <div className="dev-card__amount-col">
                    <div className="dev-card__base">{d.attempts}/{d.max_attempts} attempts</div>
                    {d.last_http_status ? <div className="dev-card__base">HTTP {d.last_http_status}</div> : null}
                    <div className="dev-card__date">{formatDateTime(d.created_at)}</div>
                  </div>
                </div>
                <div className="admin-actions">
                  <button className="dev-btn dev-btn--primary dev-btn--compact" disabled={busy} onClick={() => void runAction(`hook-${d.id}`, () => resendAdminWebhookDelivery(tok(), d.id))}>
                    {busyKey === `hook-${d.id}` ? "Resending…" : "Resend"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function slugifyUTMValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?t\.me\//, "")
    .replace(/^t\.me\//, "")
    .replace(/^@+/, "")
    .replace(/[^a-z0-9а-яё_-]+/gi, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "");
}

function UTMLinkBuilder({ setToast }: { setToast: (message: string) => void }) {
  const [target, setTarget] = useState<"web" | "bot">("web");
  const [platform, setPlatform] = useState<"tg" | "other">("tg");
  const [channel, setChannel] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [medium, setMedium] = useState("cpc");
  const [landingPath, setLandingPath] = useState("/ru");

  const channelSlug = slugifyUTMValue(channel);
  const campaignSlug = slugifyUTMValue(campaign);

  let link = "";
  if (channelSlug) {
    const finalSource = platform === "tg" ? `tg_${channelSlug}` : channelSlug;

    if (target === "web") {
      const params = new URLSearchParams();
      params.set("utm_source", finalSource);
      if (medium.trim()) params.set("utm_medium", slugifyUTMValue(medium));
      if (campaignSlug) params.set("utm_campaign", campaignSlug);
      if (content.trim()) params.set("utm_content", slugifyUTMValue(content));
      const path = landingPath.trim().startsWith("/") ? landingPath.trim() : `/${landingPath.trim()}`;
      link = `${window.location.origin}${path}?${params.toString()}`;
    } else {
      // Telegram Bot start parameter
      // Format: utm__[source]__[medium]__[campaign]__[content]
      const cleanSource = finalSource.replace(/__/g, "_");
      const cleanMedium = slugifyUTMValue(medium).replace(/__/g, "_");
      const cleanCampaign = campaignSlug.replace(/__/g, "_");
      const cleanContent = slugifyUTMValue(content).replace(/__/g, "_");

      const parts = ["utm", cleanSource];
      if (cleanMedium || cleanCampaign || cleanContent) {
        parts.push(cleanMedium);
      }
      if (cleanCampaign || cleanContent) {
        parts.push(cleanCampaign);
      }
      if (cleanContent) {
        parts.push(cleanContent);
      }

      const startParam = parts.join("__");
      link = `https://t.me/recvmoney_bot?start=${startParam}`;
    }
  }

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setToast("Link copied");
    } catch {
      setToast("Copy failed — select the link manually");
    }
  }

  return (
    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
      <div className="console-card-spotlight" />
      <div className="dev-portal__section-header dev-portal__section-header--margin">
        <h3>UTM link builder</h3>
        <span className="dev-card__note-text">
          Generate campaign tracking links for the Web App or Telegram Bot. Results land in the table below.
        </span>
      </div>
      <div className="dev-form">
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div className="dev-input-group" style={{ flex: "1 1 200px" }}>
            <label>Link Target</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                className={`dev-btn dev-btn--compact ${target === "web" ? "dev-btn--primary" : "dev-btn--secondary"}`}
                onClick={() => setTarget("web")}
              >
                Web Landing Page
              </button>
              <button
                type="button"
                className={`dev-btn dev-btn--compact ${target === "bot" ? "dev-btn--primary" : "dev-btn--secondary"}`}
                onClick={() => setTarget("bot")}
              >
                Telegram Bot
              </button>
            </div>
          </div>

          <div className="dev-input-group" style={{ flex: "1 1 200px" }}>
            <label>Platform / Traffic Source</label>
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                className={`dev-btn dev-btn--compact ${platform === "tg" ? "dev-btn--primary" : "dev-btn--secondary"}`}
                onClick={() => setPlatform("tg")}
              >
                Telegram (prefixes tg_)
              </button>
              <button
                type="button"
                className={`dev-btn dev-btn--compact ${platform === "other" ? "dev-btn--primary" : "dev-btn--secondary"}`}
                onClick={() => setPlatform("other")}
              >
                Web / Article / Other
              </button>
            </div>
          </div>
        </div>

        <div className="admin-blog-grid">
          <div className="dev-input-group">
            <label>{platform === "tg" ? "Telegram channel/chat" : "Source (site, blog, platform)"}</label>
            <input
              className="dev-input"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder={platform === "tg" ? "@durov or t.me/durov" : "e.g. vcru, habr, google"}
            />
          </div>
          <div className="dev-input-group">
            <label>Campaign</label>
            <input className="dev-input" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="telega-june" />
          </div>
          <div className="dev-input-group">
            <label>Creative (optional)</label>
            <input className="dev-input" value={content} onChange={(e) => setContent(e.target.value)} placeholder="post-v1" />
          </div>
        </div>

        <div className="admin-blog-grid">
          {target === "web" && (
            <div className="dev-input-group">
              <label>Landing page</label>
              <input className="dev-input" value={landingPath} onChange={(e) => setLandingPath(e.target.value)} placeholder="/ru" />
            </div>
          )}
          <div className="dev-input-group">
            <label>Medium</label>
            <input className="dev-input" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="cpc" />
          </div>
        </div>

        <div className="dev-input-group">
          <label>Generated Tagged Link</label>
          <div className="admin-manage__note">
            <input
              className="dev-input"
              readOnly
              value={link}
              placeholder="Fill in the source to generate a link"
              onFocus={(e) => e.target.select()}
            />
            <button type="button" className="dev-btn dev-btn--primary dev-btn--compact" disabled={!link} onClick={() => void handleCopy()}>
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_PARTNER_FORM = {
  name: "",
  contact: "",
  code: "",
  commission_pct: "25",
  launch_commission_pct: "",
  launch_months: "",
  payout_address: "",
  notes: "",
};

function partnerLink(code: string) {
  return `${window.location.origin}/?ref=${code}`;
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date(value));
}

function PartnersPanel({ token, setToast, setError }: {
  token: string;
  setToast: (message: string) => void;
  setError: (message: string) => void;
}) {
  const [partners, setPartners] = useState<ReferralPartnerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_PARTNER_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [report, setReport] = useState<ReferralPartnerReport | null>(null);
  const [payoutForm, setPayoutForm] = useState({ amount: "", note: "" });
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchReferralPartners(token);
      setPartners(next.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load referral partners");
    } finally {
      setLoading(false);
    }
  }, [token, setError]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function buildPayload(): ReferralPartnerPayload {
    const payload: ReferralPartnerPayload = {
      name: form.name,
      contact: form.contact,
      commission_pct: form.commission_pct || "25",
      payout_address: form.payout_address,
      notes: form.notes,
    };
    if (!editingId && form.code.trim()) payload.code = form.code.trim();
    if (form.launch_commission_pct.trim()) {
      payload.launch_commission_pct = form.launch_commission_pct.trim();
      payload.launch_months = Number(form.launch_months) || 3;
    }
    return payload;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (editingId) {
        const current = partners.find((p) => p.id === editingId);
        await updateReferralPartner(token, editingId, { ...buildPayload(), is_archived: current?.is_archived || false });
        setToast("Partner updated");
      } else {
        const created = await createReferralPartner(token, buildPayload());
        setToast(`Partner created — link: ${partnerLink(created.partner.code)}`);
      }
      setForm(EMPTY_PARTNER_FORM);
      setEditingId(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save partner");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(partner: ReferralPartnerStats) {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      contact: partner.contact,
      code: partner.code,
      commission_pct: partner.commission_pct,
      launch_commission_pct: partner.launch_commission_pct || "",
      launch_months: "",
      payout_address: partner.payout_address,
      notes: partner.notes,
    });
  }

  async function toggleArchive(partner: ReferralPartnerStats) {
    setBusy(true);
    try {
      await updateReferralPartner(token, partner.id, {
        name: partner.name,
        contact: partner.contact,
        commission_pct: partner.commission_pct,
        launch_commission_pct: partner.launch_commission_pct || undefined,
        launch_ends_at: partner.launch_ends_at || undefined,
        payout_address: partner.payout_address,
        notes: partner.notes,
        is_archived: !partner.is_archived,
      });
      setToast(partner.is_archived ? "Partner restored" : "Partner archived");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update partner");
    } finally {
      setBusy(false);
    }
  }

  async function openReport(partner: ReferralPartnerStats) {
    try {
      const next = await fetchReferralPartnerReport(token, partner.id);
      setReport(next);
      setPayoutForm({ amount: partner.owed_usd, note: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load partner report");
    }
  }

  async function handlePayout(event: FormEvent) {
    event.preventDefault();
    if (!report) return;
    setBusy(true);
    try {
      await createReferralPayout(token, report.partner.id, { amount_usd: payoutForm.amount, note: payoutForm.note });
      setToast("Payout recorded — don't forget the actual USDT transfer");
      const [nextReport] = await Promise.all([fetchReferralPartnerReport(token, report.partner.id), reload()]);
      setReport(nextReport);
      setPayoutForm({ amount: "", note: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payout");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(partnerLink(code));
      setToast("Referral link copied");
    } catch {
      setToast("Copy failed — build the link manually: /?ref=" + code);
    }
  }

  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Referral partners" subtitle="25% recurring (auto-bumps to 30% at 10 referrals paying in the same month), optional launch rate. Payouts in USDT are sent manually and recorded here." />

      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>{editingId ? "Edit partner" : "New partner"}</h3>
          <span className="dev-card__note-text">The referral link is recv.money/?ref=code. Leave the code empty to generate one from the name.</span>
        </div>
        <form className="dev-form" onSubmit={handleSubmit}>
          <div className="admin-blog-grid">
            <div className="dev-input-group">
              <label>Name</label>
              <input className="dev-input" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Ivan, TG-shop developer" required />
            </div>
            <div className="dev-input-group">
              <label>Contact</label>
              <input className="dev-input" value={form.contact} onChange={(e) => setForm((c) => ({ ...c, contact: e.target.value }))} placeholder="@ivan / email" />
            </div>
            <div className="dev-input-group">
              <label>Code {editingId ? "(immutable)" : "(optional)"}</label>
              <input className="dev-input" value={form.code} disabled={Boolean(editingId)} onChange={(e) => setForm((c) => ({ ...c, code: e.target.value }))} placeholder="tg-ivan" />
            </div>
          </div>
          <div className="admin-blog-grid">
            <div className="dev-input-group">
              <label>Commission %</label>
              <input className="dev-input" value={form.commission_pct} onChange={(e) => setForm((c) => ({ ...c, commission_pct: e.target.value }))} placeholder="25" />
            </div>
            <div className="dev-input-group">
              <label>Launch % (optional)</label>
              <input className="dev-input" value={form.launch_commission_pct} onChange={(e) => setForm((c) => ({ ...c, launch_commission_pct: e.target.value }))} placeholder="40" />
            </div>
            <div className="dev-input-group">
              <label>Launch months</label>
              <input className="dev-input" value={form.launch_months} onChange={(e) => setForm((c) => ({ ...c, launch_months: e.target.value }))} placeholder="3" />
            </div>
          </div>
          <div className="admin-blog-grid">
            <div className="dev-input-group">
              <label>USDT payout address</label>
              <input className="dev-input" value={form.payout_address} onChange={(e) => setForm((c) => ({ ...c, payout_address: e.target.value }))} placeholder="TRC-20 / TON address" />
            </div>
            <div className="dev-input-group">
              <label>Notes</label>
              <input className="dev-input" value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Builds Tilda shops, ~10 clients" />
            </div>
          </div>
          <div className="admin-manage__note">
            <button type="submit" className="dev-btn dev-btn--primary dev-btn--compact" disabled={busy}>{editingId ? "Save changes" : "Create partner"}</button>
            {editingId ? (
              <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => { setEditingId(null); setForm(EMPTY_PARTNER_FORM); }}>Cancel</button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Partners</h3>
          <span className="dev-card__note-text">Clicks → signups → referred subscription revenue. "Owed" is accrued commission minus recorded payouts; suggested payout threshold is $10.</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead><tr><th>Partner</th><th>Code</th><th>Rate</th><th>Clicks</th><th>Signups</th><th>Paying/mo</th><th>Revenue</th><th>Accrued</th><th>Paid</th><th>Owed</th><th>Actions</th></tr></thead>
            <tbody>
              {partners.map((partner) => {
                const launchActive = partner.launch_ends_at && new Date(partner.launch_ends_at) > new Date();
                return (
                  <tr key={partner.id} style={partner.is_archived ? { opacity: 0.5 } : undefined}>
                    <td>
                      <strong>{partner.name}</strong>
                      {partner.contact ? <div className="dev-card__note-text">{partner.contact}</div> : null}
                    </td>
                    <td><span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{partner.code}</span></td>
                    <td>
                      {partner.commission_pct}%
                      {launchActive ? <div className="dev-card__note-text">launch {partner.launch_commission_pct}% until {formatDateTime(partner.launch_ends_at)}</div> : null}
                    </td>
                    <td>{partner.clicks}</td>
                    <td>{partner.signups}</td>
                    <td>{partner.active_referrals}</td>
                    <td>{formatMoney(partner.revenue_usd)}</td>
                    <td>{formatMoney(partner.accrued_usd)}</td>
                    <td>{formatMoney(partner.paid_usd)}</td>
                    <td><strong>{formatMoney(partner.owed_usd)}</strong></td>
                    <td>
                      <div className="admin-manage__note">
                        <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void copyLink(partner.code)}>Link</button>
                        <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void openReport(partner)}>Report</button>
                        <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => startEdit(partner)}>Edit</button>
                        <button type="button" className="dev-btn dev-btn--secondary dev-btn--compact" disabled={busy} onClick={() => void toggleArchive(partner)}>{partner.is_archived ? "Restore" : "Archive"}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {partners.length === 0 && <tr><td colSpan={11} className="admin-table-empty">{loading ? "Loading partners…" : "No partners yet. Create the first one above and share recv.money/?ref=code."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {report ? (
        <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
          <div className="console-card-spotlight" />
          <div className="dev-portal__section-header dev-portal__section-header--margin">
            <h3>{report.partner.name} — monthly report</h3>
            <span className="dev-card__note-text">Verify the month, send USDT to {report.partner.payout_address || "the partner (no address on file!)"}, then record the payout below.</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-sales-table">
              <thead><tr><th>Month</th><th>Paying referrals</th><th>Referred revenue</th><th>Rate</th><th>Commission</th></tr></thead>
              <tbody>
                {report.months.map((month) => (
                  <tr key={month.month}>
                    <td>{formatMonth(month.month)}</td>
                    <td>{month.active_referrals}</td>
                    <td>{formatMoney(month.revenue_usd)}</td>
                    <td>{month.rate_pct}%</td>
                    <td>{formatMoney(month.accrued_usd)}</td>
                  </tr>
                ))}
                {report.months.length === 0 && <tr><td colSpan={5} className="admin-table-empty">No referred subscription payments yet.</td></tr>}
              </tbody>
            </table>
          </div>

          <form className="dev-form" onSubmit={handlePayout} style={{ marginTop: "1rem" }}>
            <div className="admin-blog-grid">
              <div className="dev-input-group">
                <label>Payout amount (USD)</label>
                <input className="dev-input" value={payoutForm.amount} onChange={(e) => setPayoutForm((c) => ({ ...c, amount: e.target.value }))} placeholder="25.00" required />
              </div>
              <div className="dev-input-group">
                <label>Note / tx hash</label>
                <input className="dev-input" value={payoutForm.note} onChange={(e) => setPayoutForm((c) => ({ ...c, note: e.target.value }))} placeholder="june 2026, tx 0x…" />
              </div>
              <div className="dev-input-group" style={{ alignSelf: "end" }}>
                <button type="submit" className="dev-btn dev-btn--primary dev-btn--compact" disabled={busy}>Record payout</button>
              </div>
            </div>
          </form>

          {report.payouts.length > 0 ? (
            <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
              <table className="admin-sales-table">
                <thead><tr><th>Paid at</th><th>Amount</th><th>Note</th><th>By</th></tr></thead>
                <tbody>
                  {report.payouts.map((payout) => (
                    <tr key={payout.id}>
                      <td>{formatDateTime(payout.paid_at)}</td>
                      <td>{formatMoney(payout.amount_usd)}</td>
                      <td>{payout.note || "—"}</td>
                      <td>{payout.created_by || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="dev-portal__section-header dev-portal__section-header--margin">
            <h3>Referred workspaces</h3>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-sales-table">
              <thead><tr><th>Workspace</th><th>Username</th><th>Signed up</th><th>Subscription revenue</th></tr></thead>
              <tbody>
                {report.referrals.map((row) => (
                  <tr key={row.workspace_id}>
                    <td>#{row.workspace_id}</td>
                    <td>{row.username ? `@${row.username}` : "—"}</td>
                    <td>{formatDateTime(row.signed_up_at)}</td>
                    <td>{formatMoney(row.revenue_usd)}</td>
                  </tr>
                ))}
                {report.referrals.length === 0 && <tr><td colSpan={4} className="admin-table-empty">No referred signups yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UTMPathTable({ title, rows, empty, activityLabel }: {
  title: string;
  rows: UTMReport["top_pages"];
  empty: string;
  activityLabel?: string;
}) {
  return (
    <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
      <div className="console-card-spotlight" />
      <div className="dev-portal__section-header dev-portal__section-header--margin">
        <h3>{title}</h3>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-sales-table">
          <thead><tr><th>Path</th><th>Visitors</th><th>{activityLabel || "Events"}</th><th>Signup visitors</th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.path}>
                <td>
                  <strong>{row.title || row.path}</strong>
                  {row.title && <span className="admin-muted-line">{row.path}</span>}
                </td>
                <td>{row.visitors}</td>
                <td>{row.events}</td>
                <td>{row.signup_visitors}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={4} className="admin-table-empty">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UTMBehaviorDetail({ row }: { row: UTMReport["campaigns"][number] }) {
  const signupStartCR = (row.signup_starts || 0) > 0 ? `${((row.signups / row.signup_starts) * 100).toFixed(1)}%` : "—";
  const docsPerVisitor = row.unique_visitors > 0 ? (row.docs_opened / row.unique_visitors).toFixed(1) : "0";
  return (
    <div className="admin-utm-detail">
      <span><strong>{row.events || 0}</strong> events</span>
      <span><strong>{row.docs_opened || 0}</strong> docs opened</span>
      <span><strong>{row.app_opens || 0}</strong> app opens</span>
      <span><strong>{row.bot_opens || 0}</strong> bot opens</span>
      <span><strong>{row.signup_starts || 0}</strong> signup starts</span>
      <span><strong>{signupStartCR}</strong> start to signup</span>
      <span><strong>{docsPerVisitor}</strong> docs / visitor</span>
    </div>
  );
}

function AnalyticsPanel({ analytics, webVitals, utmReport, groupBy, onGroupBy, setToast }: {
  analytics: AdminAnalyticsResponse | null;
  webVitals: WebVitalsReport | null;
  utmReport: UTMReport | null;
  groupBy: string;
  onGroupBy: (g: "date" | "network" | "plan" | "mode") => void;
  setToast: (message: string) => void;
}) {
  const vital = (name: "LCP" | "INP" | "CLS") => webVitals?.metrics.find((metric) => metric.metric_name === name);
  const formatVital = (name: "LCP" | "INP" | "CLS") => {
    const metric = vital(name);
    if (!metric) return "No data";
    return name === "CLS" ? metric.p75.toFixed(3) : `${Math.round(metric.p75)} ms`;
  };
  const campaigns = utmReport?.campaigns || [];
  const leads = utmReport?.leads || [];
  const totalUnique = campaigns.reduce((sum, row) => sum + row.unique_visitors, 0);
  const totalSignupStarts = campaigns.reduce((sum, row) => sum + (row.signup_starts || 0), 0);
  const totalSignups = campaigns.reduce((sum, row) => sum + row.signups, 0);
  const totalDocsOpened = campaigns.reduce((sum, row) => sum + (row.docs_opened || 0), 0);
  const totalAppOpens = campaigns.reduce((sum, row) => sum + (row.app_opens || 0), 0);
  const totalBotOpens = campaigns.reduce((sum, row) => sum + (row.bot_opens || 0), 0);
  const startedToSignup = totalSignupStarts > 0 ? `${((totalSignups / totalSignupStarts) * 100).toFixed(1)}%` : "—";
  const visitorToSignup = totalUnique > 0 ? `${((totalSignups / totalUnique) * 100).toFixed(1)}%` : "—";
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Analytics" subtitle="Revenue, conversion and reliability metrics across the platform.">
        <div className="admin-groupby">
          <CustomSelect value={groupBy} options={GROUP_BY_OPTIONS} ariaLabel="Group by" onChange={(v) => onGroupBy(v as "date" | "network" | "plan" | "mode")} />
        </div>
      </PanelHeader>
      <div className="dev-metrics-grid">
        <MetricCard label="MRR" value={formatMoney(analytics?.mrr_usd)} meta="monthly recurring" />
        <MetricCard label="ARR" value={formatMoney(analytics?.arr_usd)} meta="annual run-rate" />
        <MetricCard label="Paid volume" value={formatMoney(analytics?.paid_volume_usd)} meta={`${analytics?.paid_invoices || 0} paid invoices`} />
        <MetricCard label="Active merchants" value={String(analytics?.active_merchants || 0)} meta={`${analytics?.created_invoices || 0} invoices created`} />
        <MetricCard label="Manual review rate" value={analytics?.manual_review_rate ? `${analytics.manual_review_rate}` : "0"} meta="share of invoices" />
        <MetricCard label="Failed webhook rate" value={analytics?.failed_webhook_rate ? `${analytics.failed_webhook_rate}` : "0"} meta="delivery reliability" />
        <MetricCard label="Underpaid share" value={analytics?.underpaid_share ? `${analytics.underpaid_share}` : "0"} meta="of all invoices" />
      </div>
      <div className="dev-portal__section-header dev-portal__section-header--margin">
        <h3>Core Web Vitals p75</h3>
        <span className="dev-card__note-text">Anonymous field data, rolling 28 days</span>
      </div>
      <div className="dev-metrics-grid">
        {(["LCP", "INP", "CLS"] as const).map((name) => {
          const metric = vital(name);
          const target = name === "LCP" ? "target ≤ 2500 ms" : name === "INP" ? "target ≤ 200 ms" : "target ≤ 0.1";
          return (
            <MetricCard
              key={name}
              label={`${name} p75`}
              value={formatVital(name)}
              meta={`${target}${metric ? ` · ${metric.samples} samples · ${metric.good ? "good" : "needs work"}` : ""}`}
            />
          );
        })}
      </div>
      <UTMLinkBuilder setToast={setToast} />
      <div className="dev-portal__section-header dev-portal__section-header--margin">
        <h3>Lead journey funnel</h3>
        <span className="dev-card__note-text">UTM visitors, docs activity, app and bot opens, and signup completion, rolling 365 days</span>
      </div>
      <div className="dev-metrics-grid">
        <MetricCard label="UTM visitors" value={String(totalUnique)} meta={`${campaigns.reduce((sum, row) => sum + row.visits, 0)} tracked visits`} />
        <MetricCard label="Docs opened" value={String(totalDocsOpened)} meta="docs page views and docs clicks" />
        <MetricCard label="App opens" value={String(totalAppOpens)} meta="auth, console and app route opens" />
        <MetricCard label="Bot opens" value={String(totalBotOpens)} meta="Telegram bot clicks and /start opens" />
        <MetricCard label="Signup starts" value={String(totalSignupStarts)} meta={`${startedToSignup} start to signup`} />
        <MetricCard label="Signups" value={String(totalSignups)} meta={`${visitorToSignup} visitor to signup`} />
      </div>
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Campaign tracking (classic + journey)</h3>
          <span className="dev-card__note-text">Old funnel columns first, with post-click behavior folded into one detail column.</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-sales-table admin-sales-table--utm">
            <thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Visits</th><th>Unique</th><th>Signups</th><th>CR</th><th>Paying</th><th>Revenue</th><th>Behavior detail</th></tr></thead>
            <tbody>
              {campaigns.map((row) => {
                const cr = row.unique_visitors > 0 ? `${((row.signups / row.unique_visitors) * 100).toFixed(1)}%` : "—";
                return (
                  <tr key={`${row.source}|${row.medium}|${row.campaign}`}>
                    <td><span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{row.source || "—"}</span></td>
                    <td>{row.medium || "—"}</td>
                    <td>{row.campaign || "—"}</td>
                    <td>{row.visits}</td>
                    <td>{row.unique_visitors}</td>
                    <td>{row.signups}</td>
                    <td>{cr}</td>
                    <td>{row.paying_workspaces}</td>
                    <td>{formatMoney(row.paid_usd)}</td>
                    <td><UTMBehaviorDetail row={row} /></td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && <tr><td colSpan={10} className="admin-table-empty">No campaign traffic yet. Add ?utm_source=…&utm_campaign=… to your ad links.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="admin-grid admin-grid--two">
        <UTMPathTable title="Top campaign landings" rows={utmReport?.top_landings || []} empty="No attributed landings yet." activityLabel="Visits" />
        <UTMPathTable title="Top pages before signup" rows={utmReport?.top_pages || []} empty="No attributed page activity yet." />
        <UTMPathTable title="Docs opened by leads" rows={utmReport?.top_docs || []} empty="No attributed docs activity yet." />
      </div>
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Recent attributed leads</h3>
          <span className="dev-card__note-text">Latest visitors with UTM/ref attribution and their first 30 tracked actions.</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-sales-table admin-sales-table--journeys">
            <thead><tr><th>Lead</th><th>Campaign</th><th>Status</th><th>Activity</th><th>Timeline</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.attribution_id}>
                  <td>
                    <strong>{lead.workspace_name || lead.workspace_email || lead.attribution_id.slice(0, 12)}</strong>
                    <span className="admin-muted-line">{lead.workspace_id ? `Workspace #${lead.workspace_id}` : "Anonymous visitor"}</span>
                    <span className="admin-muted-line">{formatDateTime(lead.first_seen_at)} → {formatDateTime(lead.last_seen_at)}</span>
                  </td>
                  <td>
                    <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{lead.source || "—"}</span>
                    <span className="admin-muted-line">{[lead.medium, lead.campaign].filter(Boolean).join(" / ") || "No campaign"}</span>
                    <span className="admin-muted-line">{lead.landing_path || "No landing path"}</span>
                  </td>
                  <td>
                    <ToneBadge status={lead.signed_up_at ? "paid" : lead.signup_started ? "awaiting_payment" : "draft"} />
                    <span className="admin-muted-line">{lead.signed_up_at ? `Signed up ${formatDateTime(lead.signed_up_at)}` : lead.signup_started ? "Signup started" : "Browsing only"}</span>
                  </td>
                  <td>
                    <span>{lead.event_count} events</span>
                    <span className="admin-muted-line">{lead.docs_opened} docs · {lead.app_opens} app opens</span>
                  </td>
                  <td>
                    <div className="admin-journey-list">
                      {(lead.timeline || []).slice(0, 8).map((event) => (
                        <span key={`${event.event_name}|${event.path}|${event.created_at}`} className="admin-journey-event">
                          <strong>{event.event_name.replace(/_/g, " ")}</strong>
                          <span>{event.path || event.title || "n/a"}</span>
                        </span>
                      ))}
                      {(lead.timeline || []).length === 0 && <span className="admin-muted-line">No events after landing.</span>}
                    </div>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={5} className="admin-table-empty">No attributed lead journeys yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Breakdown ({groupBy})</h3>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead><tr><th>Bucket</th><th>Created</th><th>Paid</th><th>Manual review</th><th>Underpaid</th><th>Paid volume</th></tr></thead>
            <tbody>
              {(analytics?.breakdown || []).map((item) => (
                <tr key={item.bucket}>
                  <td>{item.bucket}</td>
                  <td>{item.created_invoices}</td>
                  <td>{item.paid_invoices}</td>
                  <td>{item.manual_review_invoices}</td>
                  <td>{item.underpaid_invoices}</td>
                  <td>{formatMoney(item.paid_volume_usd)}</td>
                </tr>
              ))}
              {(analytics?.breakdown || []).length === 0 && <tr><td colSpan={6} className="admin-table-empty">No analytics data.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuditPanel({ events }: { events: AdminAuditEvent[] }) {
  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Audit log" subtitle={`${events.length} most recent administrative actions.`} />
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Metadata</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{formatDateTime(e.created_at)}</td>
                  <td>{e.actor || "system"}</td>
                  <td><span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{e.action}</span></td>
                  <td>{e.target_type}:{e.target_id}</td>
                  <td className="admin-meta-cell">{JSON.stringify(e.metadata || {})}</td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={5} className="admin-table-empty">No audit events yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ContentPanel({
  targets,
  redirects,
  token,
  onChanged,
  setToast,
  setError,
}: {
  targets: SEOTarget[];
  redirects: SEORedirect[];
  token: string;
  onChanged: () => Promise<void>;
  setToast: (message: string) => void;
  setError: (message: string) => void;
}) {
  const [redirectDraft, setRedirectDraft] = useState({
    source_path: "",
    target_url: "",
    status_code: 301 as 301 | 302 | 308,
  });
  const [savingRedirect, setSavingRedirect] = useState(false);

  async function handleCreateRedirect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingRedirect(true);
    setError("");
    try {
      await createAdminSEORedirect(token, {
        ...redirectDraft,
        is_active: true,
      });
      setRedirectDraft({ source_path: "", target_url: "", status_code: 301 });
      setToast("Redirect created");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create redirect");
    } finally {
      setSavingRedirect(false);
    }
  }

  async function handleDeleteRedirect(id: number) {
    setError("");
    try {
      await deleteAdminSEORedirect(token, id);
      setToast("Redirect deleted");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete redirect");
    }
  }

  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Content & SEO" subtitle="Blog editor and SEO target tracking.">
        <Link to="/admin/blog" className="dev-btn dev-btn--primary dev-btn--compact">Open blog editor</Link>
      </PanelHeader>
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>SEO targets</h3>
          <p>{targets.length} keyword clusters tracked</p>
        </div>
        <div className="admin-seo-cards">
          {targets.map((t) => (
            <article key={t.id} className="admin-seo-card">
              <div>
                <span>Cluster</span>
                <strong>{t.keyword_cluster}</strong>
              </div>
              <div>
                <span>Target page</span>
                <code>{t.target_page}</code>
              </div>
              <div className="admin-seo-card__meta">
                <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{t.publish_status}</span>
                <span>{t.index_status}</span>
                <span>{t.internal_links_count} links</span>
                <span>{t.video_attached ? "video" : "no video"}</span>
              </div>
            </article>
          ))}
          {targets.length === 0 && <div className="dev-portal__empty-state">No SEO targets yet.</div>}
        </div>
        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead><tr><th>Cluster</th><th>Target page</th><th>Publish</th><th>Index</th><th>Links</th><th>Video</th><th>Comparison</th></tr></thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t.id}>
                  <td>{t.keyword_cluster}</td>
                  <td>{t.target_page}</td>
                  <td><span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">{t.publish_status}</span></td>
                  <td>{t.index_status}</td>
                  <td>{t.internal_links_count}</td>
                  <td>{t.video_attached ? "yes" : "no"}</td>
                  <td>{t.comparison_page_status}</td>
                </tr>
              ))}
              {targets.length === 0 && <tr><td colSpan={7} className="admin-table-empty">No SEO targets yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Managed redirects</h3>
          <p>Exact-path 301, 302, and 308 redirects with server-side cycle protection.</p>
        </div>
        <form onSubmit={handleCreateRedirect} className="dev-form">
          <div className="admin-blog-grid">
            <div className="dev-input-group">
              <label>Source path</label>
              <input className="dev-input" required placeholder="/en/old-page" value={redirectDraft.source_path} onChange={(event) => setRedirectDraft({ ...redirectDraft, source_path: event.target.value })} />
            </div>
            <div className="dev-input-group">
              <label>Target URL</label>
              <input className="dev-input" required placeholder="/en/new-page" value={redirectDraft.target_url} onChange={(event) => setRedirectDraft({ ...redirectDraft, target_url: event.target.value })} />
            </div>
            <div className="dev-input-group">
              <label>Status</label>
              <select className="dev-input" value={redirectDraft.status_code} onChange={(event) => setRedirectDraft({ ...redirectDraft, status_code: Number(event.target.value) as 301 | 302 | 308 })}>
                <option value={301}>301 Permanent</option>
                <option value={302}>302 Temporary</option>
                <option value={308}>308 Permanent</option>
              </select>
            </div>
          </div>
          <button type="submit" className="dev-btn dev-btn--primary" disabled={savingRedirect}>
            {savingRedirect ? "Saving..." : "Add redirect"}
          </button>
        </form>
        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead><tr><th>Source</th><th>Target</th><th>Status</th><th>State</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {redirects.map((redirect) => (
                <tr key={redirect.id}>
                  <td><code>{redirect.source_path}</code></td>
                  <td><code>{redirect.target_url}</code></td>
                  <td>{redirect.status_code}</td>
                  <td>{redirect.is_active ? "active" : "disabled"}</td>
                  <td>{formatDateTime(redirect.updated_at)}</td>
                  <td><button type="button" className="dev-btn dev-btn--danger dev-btn--compact" onClick={() => void handleDeleteRedirect(redirect.id)}>Delete</button></td>
                </tr>
              ))}
              {redirects.length === 0 && <tr><td colSpan={6} className="admin-table-empty">No managed redirects.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ token, setToast, setError }: { token: string; setToast: (msg: string) => void; setError: (msg: string) => void }) {
  const [wallets, setWallets] = useState<Record<string, string>>({ TON: "", EVM: "", TRON: "", SOLANA: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAdminBillingWallets(token)
      .then(res => {
        setWallets({
          TON: res.wallets.TON || "",
          EVM: res.wallets.EVM || "",
          TRON: res.wallets.TRON || "",
          SOLANA: res.wallets.SOLANA || "",
        });
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load billing wallets");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, setError]);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateAdminBillingWallets(token, wallets);
      setToast("Billing wallets updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save billing wallets");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="dev-portal__section portal-animate-in">
        <PanelHeader title="Settings" subtitle="Manage system configurations and billing wallets." />
        <div className="dev-card"><p>Loading wallets...</p></div>
      </div>
    );
  }

  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Settings" subtitle="Manage system configurations and billing wallets." />
      
      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Billing Wallets</h3>
          <p>These addresses receive subscription payments for paid plans.</p>
        </div>

        <form onSubmit={handleSave} className="dev-form">
          <div className="dev-input-group dev-input-group--margin">
            <label>TON Wallet Address (for GRAM and USDT on TON)</label>
            <input
              className="dev-input"
              value={wallets.TON}
              onChange={e => setWallets({ ...wallets, TON: e.target.value })}
              placeholder="e.g. UQAS_ton_wallet_addr..."
              required
            />
          </div>

          <div className="dev-input-group dev-input-group--margin">
            <label>EVM Wallet Address (for BASE USDC, BSC USDT, and EVM networks)</label>
            <input
              className="dev-input"
              value={wallets.EVM}
              onChange={e => setWallets({ ...wallets, EVM: e.target.value })}
              placeholder="e.g. 0xDEADBEEF..."
              required
            />
          </div>

          <div className="dev-input-group dev-input-group--margin">
            <label>TRON Wallet Address (for TRON USDT)</label>
            <input
              className="dev-input"
              value={wallets.TRON}
              onChange={e => setWallets({ ...wallets, TRON: e.target.value })}
              placeholder="e.g. TX_tron_wallet_addr..."
              required
            />
          </div>

          <div className="dev-input-group dev-input-group--margin">
            <label>Solana Wallet Address (for SOL, Solana USDT, and Solana USDC)</label>
            <input
              className="dev-input"
              value={wallets.SOLANA}
              onChange={e => setWallets({ ...wallets, SOLANA: e.target.value })}
              placeholder="e.g. SOL_wallet_addr..."
              required
            />
          </div>

          <button type="submit" className="dev-btn dev-btn--primary" disabled={saving}>
            {saving ? "Saving..." : "Save wallets"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PromoCodesPanel({ token, setToast, setError }: { token: string; setToast: (msg: string) => void; setError: (msg: string) => void }) {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [planCode, setPlanCode] = useState("merchant");
  const [expiresAt, setExpiresAt] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);

  const loadPromos = useCallback(() => {
    setLoading(true);
    fetchAdminPromoCodes(token)
      .then(res => {
        setPromos(res.items || []);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : "Failed to load promo codes");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, setError]);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        duration_days: Number(durationDays),
        plan_code: planCode,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        max_uses: maxUses ? Number(maxUses) : null,
        discount_percent: Number(discountPercent),
      };

      await createAdminPromoCode(token, payload);
      setToast("Promo code created successfully");
      setCode("");
      setDurationDays(30);
      setPlanCode("merchant");
      setExpiresAt("");
      setMaxUses("");
      setDiscountPercent(0);
      loadPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create promo code");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure you want to delete this promo code?")) return;
    setError("");
    try {
      await deleteAdminPromoCode(token, id);
      setToast("Promo code deleted");
      loadPromos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete promo code");
    }
  }

  return (
    <div className="dev-portal__section portal-animate-in">
      <PanelHeader title="Promo Codes" subtitle="Generate discount and subscription promo codes for users." />

      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove} style={{ marginBottom: "2rem" }}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Create Promo Code</h3>
          <p>Generate a new code which grants a plan with subscription days or a discount.</p>
        </div>

        <form onSubmit={handleCreate} className="dev-form">
          <div className="dev-preset-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", width: "100%", marginBottom: "1rem" }}>
            <div className="dev-input-group">
              <label>Promo Code</label>
              <input
                className="dev-input"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. MON100"
                required
              />
            </div>
            <div className="dev-input-group">
              <label>Plan Restricted/Granted</label>
              <CustomSelect
                value={planCode}
                options={[
                  { value: "", label: "Any Plan (Discount only)" },
                  { value: "merchant", label: "Merchant" },
                  { value: "developer", label: "Developer" },
                  { value: "business", label: "Business" },
                ]}
                ariaLabel="Plan"
                onChange={setPlanCode}
              />
            </div>
            <div className="dev-input-group">
              <label>Duration (Days)</label>
              <input
                type="number"
                min="0"
                className="dev-input"
                value={durationDays}
                onChange={e => setDurationDays(Number(e.target.value))}
                required
              />
            </div>
            <div className="dev-input-group">
              <label>Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="dev-input"
                value={discountPercent}
                onChange={e => setDiscountPercent(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="dev-preset-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", width: "100%", marginBottom: "1rem" }}>
            <div className="dev-input-group">
              <label>Expiration Date (Optional)</label>
              <input
                type="datetime-local"
                className="dev-input"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="dev-input-group">
              <label>Max Uses (Optional)</label>
              <input
                type="number"
                min="1"
                className="dev-input"
                value={maxUses}
                onChange={e => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <button type="submit" className="dev-btn dev-btn--primary" disabled={creating}>
            {creating ? "Creating..." : "Create Promo Code"}
          </button>
        </form>
      </div>

      <div className="dev-card console-spotlight-card" onMouseMove={handleMouseMove}>
        <div className="console-card-spotlight" />
        <div className="dev-portal__section-header dev-portal__section-header--margin">
          <h3>Active Promo Codes</h3>
          <p>List of all existing promo codes and their current usage metrics.</p>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-sales-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Plan</th>
                <th>Discount</th>
                <th>Duration</th>
                <th>Expires</th>
                <th>Usage</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && promos.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-table-empty">Loading promo codes...</td>
                </tr>
              )}
              {!loading && promos.length === 0 && (
                <tr>
                  <td colSpan={9} className="admin-table-empty">No promo codes yet.</td>
                </tr>
              )}
              {promos.map(promo => (
                <tr key={promo.id}>
                  <td><strong>{promo.code}</strong></td>
                  <td>
                    {promo.plan_code ? (
                      <span className={`dev-api-badge dev-api-badge--get dev-api-badge--micro`}>
                        {promo.plan_code}
                      </span>
                    ) : (
                      <span className="dev-api-badge dev-api-badge--secondary dev-api-badge--micro">
                        Any
                      </span>
                    )}
                  </td>
                  <td>
                    {promo.discount_percent > 0 ? (
                      <span className="dev-api-badge dev-api-badge--post dev-api-badge--micro" style={{ backgroundColor: "#27c24c", borderColor: "#27c24c", color: "#fff" }}>
                        {promo.discount_percent}% off
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>{promo.duration_days} days</td>
                  <td>{promo.expires_at ? formatDateTime(promo.expires_at) : "Never"}</td>
                  <td>
                    {promo.uses_count} / {promo.max_uses !== null ? promo.max_uses : "∞"}
                  </td>
                  <td>{promo.created_by}</td>
                  <td>{formatDateTime(promo.created_at)}</td>
                  <td>
                    <button
                      className="dev-btn dev-btn--secondary dev-btn--micro"
                      onClick={() => handleDelete(promo.id)}
                      style={{ color: "#ff4d4f", borderColor: "#ff4d4f" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
