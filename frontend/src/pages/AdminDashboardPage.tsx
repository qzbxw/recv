import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  blockAdminWorkspace,
  changeAdminWorkspacePlan,
  clearStoredAdminToken,
  createAdminBillingCheckout,
  createAdminInternalComment,
  fetchAdminAnalytics,
  fetchAdminAuditEvents,
  fetchAdminInvoices,
  fetchAdminOpsOverview,
  fetchAdminSEOTargets,
  fetchAdminWorkspaces,
  fetchAdminBillingWallets,
  updateAdminBillingWallets,
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  refreshAdminInvoiceStatus,
  resendAdminWebhookDelivery,
  reviewAdminInvoice,
  setStoredAdminToken,
} from "../lib/api";
import { CustomSelect } from "../components/CustomSelect";
import { buildCheckoutUrl, buildCheckoutPath } from "../lib/routing";
import type {
  AdminAnalyticsResponse,
  AdminAuditEvent,
  AdminInvoice,
  AdminInvoiceListResponse,
  AdminOpsOverviewResponse,
  AdminWebhookDelivery,
  AdminWorkspace,
  SEOTarget,
} from "../lib/types";

type PanelKey = "overview" | "invoices" | "review" | "workspaces" | "webhooks" | "analytics" | "audit" | "content" | "settings";

type Filters = { status: string; kind: string; query: string };
const DEFAULT_FILTERS: Filters = { status: "all", kind: "all", query: "" };

const PLAN_OPTIONS = [
  { value: "trial", label: "Trial" },
  { value: "merchant", label: "Merchant" },
  { value: "developer", label: "Developer" },
  { value: "business", label: "Business" },
];

const NETWORK_OPTIONS = [
  { value: "TON", label: "TON" },
  { value: "TON_USDT", label: "TON USDT" },
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
  audit: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  content: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  refresh: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
};

function ToneBadge({ status }: { status: string }) {
  return <span className={`dev-api-badge dev-status-badge dev-status-badge--${statusTone(status)}`}>{prettyStatus(status)}</span>;
}

function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
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
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [seoTargets, setSeoTargets] = useState<SEOTarget[]>([]);
  const [workspaces, setWorkspaces] = useState<AdminWorkspace[]>([]);

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [analyticsGroupBy, setAnalyticsGroupBy] = useState<"date" | "network" | "plan" | "mode">("date");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const invoices = invoiceList?.items || [];

  const loadDashboard = useCallback(async (activeToken: string, nextFilters: Filters) => {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextInvoices, nextAnalytics, nextAuditEvents, nextSEO, nextWorkspaces] = await Promise.all([
        fetchAdminOpsOverview(activeToken),
        fetchAdminInvoices(activeToken, { page: 1, page_size: 50, ...nextFilters }),
        fetchAdminAnalytics(activeToken, { group_by: analyticsGroupBy }),
        fetchAdminAuditEvents(activeToken),
        fetchAdminSEOTargets(activeToken),
        fetchAdminWorkspaces(activeToken).catch(() => ({ items: [] })),
      ]);
      setOverview(nextOverview);
      setInvoiceList(nextInvoices);
      setAnalytics(nextAnalytics);
      setAuditEvents(nextAuditEvents.items || []);
      setSeoTargets(nextSEO.items || []);
      setWorkspaces(nextWorkspaces.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }, [analyticsGroupBy]);

  useEffect(() => {
    if (token) void loadDashboard(token, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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
      setToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    void logoutAdmin().catch(() => undefined);
    clearStoredAdminToken();
    setToken("");
    setOverview(null);
    setInvoiceList(null);
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
      ],
    },
    {
      label: "Insights & content",
      items: [
        { key: "webhooks", label: "Webhooks", badge: overview?.failed_webhook_queue?.length || 0 },
        { key: "analytics", label: "Analytics" },
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
              <AnalyticsPanel analytics={analytics} groupBy={analyticsGroupBy} onGroupBy={(g) => void reloadAnalytics(g)} />
            )}

            {activePanel === "audit" && <AuditPanel events={auditEvents} />}

            {activePanel === "content" && <ContentPanel targets={seoTargets} />}

            {activePanel === "settings" && <SettingsPanel token={token} setToast={setToast} setError={setError} />}
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
          <div className="dev-card__base">{inv.payable_amount} {inv.payable_network}</div>
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
                    <div className="dev-card__base">recv {inv.payable_amount} {inv.payable_network}</div>
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

function AnalyticsPanel({ analytics, groupBy, onGroupBy }: {
  analytics: AdminAnalyticsResponse | null;
  groupBy: string;
  onGroupBy: (g: "date" | "network" | "plan" | "mode") => void;
}) {
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

function ContentPanel({ targets }: { targets: SEOTarget[] }) {
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
    </div>
  );
}

function SettingsPanel({ token, setToast, setError }: { token: string; setToast: (msg: string) => void; setError: (msg: string) => void }) {
  const [wallets, setWallets] = useState<Record<string, string>>({ TON: "", EVM: "", TRON: "" });
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
            <label>TON Wallet Address (for TON and TON USDT)</label>
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

          <button type="submit" className="dev-btn dev-btn--primary" disabled={saving}>
            {saving ? "Saving..." : "Save wallets"}
          </button>
        </form>
      </div>
    </div>
  );
}
