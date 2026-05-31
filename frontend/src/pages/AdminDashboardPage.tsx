import { FormEvent, useEffect, useMemo, useState } from "react";
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
  getStoredAdminToken,
  loginAdmin,
  logoutAdmin,
  refreshAdminInvoiceStatus,
  resendAdminWebhookDelivery,
  reviewAdminInvoice,
  setStoredAdminToken,
  verifyAdminTotp,
} from "../lib/api";
import { buildCheckoutUrl } from "../lib/routing";
import type { AdminAnalyticsResponse, AdminAuditEvent, AdminInvoice, AdminInvoiceListResponse, AdminOpsOverviewResponse, SEOTarget } from "../lib/types";

type Tab = "core" | "actions" | "analytics" | "audit" | "content" | "seo";

type Filters = {
  status: string;
  kind: string;
  query: string;
};

const DEFAULT_FILTERS: Filters = {
  status: "all",
  kind: "all",
  query: "",
};

function formatMoney(value: string | number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "n/a";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusClass(status: string) {
  return `admin-status-pill status-${status}`;
}

export function AdminDashboardPage() {
  const [token, setToken] = useState(() => getStoredAdminToken() || "");
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [mfa, setMfa] = useState<{ challengeToken: string; code: string; setupSecret: string; recoveryCodes: string[] }>({ challengeToken: "", code: "", setupSecret: "", recoveryCodes: [] });
  const [activeTab, setActiveTab] = useState<Tab>("core");
  const [overview, setOverview] = useState<AdminOpsOverviewResponse | null>(null);
  const [invoiceList, setInvoiceList] = useState<AdminInvoiceListResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [seoTargets, setSeoTargets] = useState<SEOTarget[]>([]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  const [workspaceAction, setWorkspaceAction] = useState({ workspaceId: "", blocked: true, planCode: "developer" as "trial" | "merchant" | "developer" | "business" | "enterprise", days: "30", reason: "" });
  const [billingAction, setBillingAction] = useState({ workspaceId: "", planCode: "merchant" as "merchant" | "developer" | "business" | "enterprise", payableNetwork: "TON", baseAmountUSD: "" });
  const [invoiceAction, setInvoiceAction] = useState({ invoiceId: "", result: "keep_manual_review" as "mark_paid" | "keep_manual_review" | "expire", comment: "" });
  const [webhookAction, setWebhookAction] = useState({ deliveryId: "" });
  const [commentAction, setCommentAction] = useState({ targetType: "invoice", targetId: "", body: "" });
  const [generatedCheckoutUrl, setGeneratedCheckoutUrl] = useState("");
  const [actionResult, setActionResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const invoices = invoiceList?.items || [];

  const metricCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: "Gross paid", value: formatMoney(overview.revenue.gross_paid_usd), note: `${overview.invoices.paid} paid invoices` },
      { label: "Open volume", value: formatMoney(overview.revenue.open_invoice_usd), note: `${overview.invoices.manual_review} manual reviews` },
      { label: "Workspaces", value: overview.workspaces.total.toLocaleString("en-US"), note: `${overview.workspaces.active_subscribers} active subscribers` },
      { label: "Subscriptions", value: overview.subscriptions.active.toLocaleString("en-US"), note: `${overview.subscriptions.paid_invoices} paid checkouts` },
      { label: "Failed webhooks", value: String(overview.failed_webhook_queue.length), note: "latest retry queue" },
      { label: "Bot queue", value: String(overview.notification_health.pending_total + overview.notification_health.failed_total), note: `${overview.notification_health.sent_24h} sent in 24h` },
    ];
  }, [overview]);

  async function loadDashboard(activeToken: string, nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextInvoices, nextAnalytics, nextAuditEvents, nextSEO] = await Promise.all([
        fetchAdminOpsOverview(activeToken),
        fetchAdminInvoices(activeToken, { page: 1, page_size: 50, ...nextFilters }),
        fetchAdminAnalytics(activeToken, { group_by: "date" }),
        fetchAdminAuditEvents(activeToken),
        fetchAdminSEOTargets(activeToken),
      ]);
      setOverview(nextOverview);
      setInvoiceList(nextInvoices);
      setAnalytics(nextAnalytics);
      setAuditEvents(nextAuditEvents.items || []);
      setSeoTargets(nextSEO.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) void loadDashboard(token);
  }, [token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await loginAdmin(credentials);
      if (response.mfa_required && response.challenge_token) {
        setMfa({ challengeToken: response.challenge_token, code: "", setupSecret: response.totp_secret || "", recoveryCodes: [] });
        return;
      }
      if (!response.token) throw new Error("Admin token was not returned");
      setStoredAdminToken(response.token);
      setToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyMFA(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await verifyAdminTotp({ challenge_token: mfa.challengeToken, code: mfa.code });
      setStoredAdminToken(response.token);
      setToken(response.token);
      setMfa({ challengeToken: "", code: "", setupSecret: "", recoveryCodes: response.recovery_codes || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin MFA failed");
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

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (token) await loadDashboard(token, filters);
  }

  async function runAction(fn: () => Promise<{ result: string }>) {
    if (!token) return;
    setLoading(true);
    setError("");
    setActionResult("");
    try {
      const response = await fn();
      setActionResult(response.result);
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkspaceBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspaceId = Number(workspaceAction.workspaceId);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) return setError("Workspace ID is required");
    await runAction(() => blockAdminWorkspace(token, workspaceId, { blocked: workspaceAction.blocked, reason: workspaceAction.reason }));
  }

  async function handlePlanChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspaceId = Number(workspaceAction.workspaceId);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) return setError("Workspace ID is required");
    await runAction(() => changeAdminWorkspacePlan(token, workspaceId, {
      plan_code: workspaceAction.planCode,
      days: Number(workspaceAction.days) || undefined,
      reason: workspaceAction.reason,
    }));
  }

  async function handleCreateBillingCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const workspaceId = Number(billingAction.workspaceId);
    if (!Number.isFinite(workspaceId) || workspaceId <= 0) return setError("Workspace ID is required");
    await runAction(async () => {
      const response = await createAdminBillingCheckout(token, workspaceId, {
        plan_code: billingAction.planCode,
        payable_network: billingAction.payableNetwork,
        base_amount_usd: billingAction.planCode === "enterprise" ? billingAction.baseAmountUSD : undefined,
      });
      setGeneratedCheckoutUrl(buildCheckoutUrl(response.invoice.public_id));
      return { result: `Billing checkout created for ${response.plan.name}.` };
    });
  }

  async function handleInvoiceReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invoiceId = Number(invoiceAction.invoiceId);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) return setError("Invoice ID is required");
    await runAction(() => reviewAdminInvoice(token, invoiceId, { result: invoiceAction.result, comment: invoiceAction.comment }));
  }

  async function handleRefreshInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invoiceId = Number(invoiceAction.invoiceId);
    if (!Number.isFinite(invoiceId) || invoiceId <= 0) return setError("Invoice ID is required");
    await runAction(() => refreshAdminInvoiceStatus(token, invoiceId));
  }

  async function handleResendWebhook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const deliveryId = Number(webhookAction.deliveryId);
    if (!Number.isFinite(deliveryId) || deliveryId <= 0) return setError("Webhook delivery ID is required");
    await runAction(() => resendAdminWebhookDelivery(token, deliveryId));
  }

  async function handleInternalComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(() => createAdminInternalComment(token, {
      target_type: commentAction.targetType,
      target_id: commentAction.targetId,
      body: commentAction.body,
    }));
  }

  if (!token) {
    return (
      <main className="admin-shell">
        <div className="admin-noise" />
        <section className="admin-login-wrap">
          <div className="admin-login-panel">
            <div className="admin-login-copy">
              <span className="admin-eyebrow">Reqst Admin</span>
              <h1>Ops Center</h1>
              <p>Sign in to operate merchants, invoices, billing, webhooks, content, and SEO status.</p>
            </div>
            {mfa.challengeToken ? (
              <form className="admin-login-form" onSubmit={handleVerifyMFA}>
                {mfa.setupSecret && (
                  <label>
                    <span>TOTP secret</span>
                    <input value={mfa.setupSecret} readOnly />
                  </label>
                )}
                <label><span>Authenticator code</span><input value={mfa.code} onChange={(event) => setMfa({ ...mfa, code: event.target.value })} autoComplete="one-time-code" /></label>
                {error && <p className="admin-error">{error}</p>}
                <button type="submit" className="admin-login-button" disabled={loading}>{loading ? "Verifying..." : "Verify"}</button>
              </form>
            ) : (
              <form className="admin-login-form" onSubmit={handleLogin}>
                <label><span>Email</span><input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} autoComplete="username" /></label>
                <label><span>Password</span><input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} autoComplete="current-password" /></label>
                {error && <p className="admin-error">{error}</p>}
                <button type="submit" className="admin-login-button" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
              </form>
            )}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-noise" />
      <section className="admin-dashboard">
        <header className="admin-topbar">
          <div>
            <span className="admin-eyebrow">Reqst Admin</span>
            <h1>Ops Center</h1>
            <p>Guarded operational controls over live merchants, invoices, webhooks, content, and SEO work.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-generated-at">
              <span>Last snapshot</span>
              <strong>{overview ? formatDateTime(overview.generated_at) : "Loading..."}</strong>
            </div>
            <Link to="/admin/blog" className="admin-ghost-button">Content</Link>
            <button type="button" className="admin-ghost-button" onClick={() => void loadDashboard(token)} disabled={loading}>Refresh</button>
            <button type="button" className="admin-ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        <nav className="admin-tabbar" aria-label="Admin sections">
          {[
            ["core", "Core Ops"],
            ["actions", "Actions"],
            ["analytics", "Analytics"],
            ["audit", "Audit"],
            ["content", "Content"],
            ["seo", "SEO Ops"],
          ].map(([id, label]) => (
            <button key={id} type="button" className={activeTab === id ? "admin-tab is-active" : "admin-tab"} onClick={() => setActiveTab(id as Tab)}>{label}</button>
          ))}
        </nav>

        {error && <p className="admin-error admin-error--inline">{error}</p>}
        {actionResult && <p className="admin-success admin-error--inline">{actionResult}</p>}

        <section className="admin-metric-grid">
          {metricCards.map((metric) => (
            <article className="admin-metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </section>

        {activeTab === "core" && (
          <section className="admin-main-grid">
            <div className="admin-main-column">
              <InvoiceBoard
                invoices={invoices}
                invoiceList={invoiceList}
                filters={filters}
                setFilters={setFilters}
                onSubmit={handleFilterSubmit}
                onSelect={(invoice) => {
                  setSelectedInvoice(invoice);
                  setInvoiceAction({ ...invoiceAction, invoiceId: String(invoice.id) });
                  setCommentAction({ ...commentAction, targetType: "invoice", targetId: String(invoice.id) });
                }}
                loading={loading}
              />
              <QueueBoard title="Manual Review Queue" invoices={overview?.manual_review_queue || []} onSelect={(invoice) => setInvoiceAction({ ...invoiceAction, invoiceId: String(invoice.id) })} />
            </div>
            <aside className="admin-side-column">
              <StatusMix overview={overview} />
              <HealthBoard overview={overview} />
            </aside>
          </section>
        )}

        {activeTab === "actions" && (
          <section className="admin-main-grid">
            <div className="admin-main-column">
              <article className="admin-sales-board admin-form-board">
                <h2>Workspace Actions</h2>
                <form className="admin-action-grid" onSubmit={handleWorkspaceBlock}>
                  <label><span>Workspace ID</span><input inputMode="numeric" value={workspaceAction.workspaceId} onChange={(event) => setWorkspaceAction({ ...workspaceAction, workspaceId: event.target.value })} /></label>
                  <label><span>Block state</span><select value={workspaceAction.blocked ? "blocked" : "unblocked"} onChange={(event) => setWorkspaceAction({ ...workspaceAction, blocked: event.target.value === "blocked" })}><option value="blocked">Block</option><option value="unblocked">Unblock</option></select></label>
                  <label><span>Reason</span><input value={workspaceAction.reason} onChange={(event) => setWorkspaceAction({ ...workspaceAction, reason: event.target.value })} /></label>
                  <button className="admin-login-button" type="submit" disabled={loading}>Apply block state</button>
                </form>
                <form className="admin-action-grid" onSubmit={handlePlanChange}>
                  <label><span>Plan</span><select value={workspaceAction.planCode} onChange={(event) => setWorkspaceAction({ ...workspaceAction, planCode: event.target.value as typeof workspaceAction.planCode })}><option value="trial">Trial</option><option value="merchant">Merchant</option><option value="developer">Developer</option><option value="business">Business</option><option value="enterprise">Enterprise</option></select></label>
                  <label><span>Days</span><input inputMode="numeric" value={workspaceAction.days} onChange={(event) => setWorkspaceAction({ ...workspaceAction, days: event.target.value })} /></label>
                  <button className="admin-login-button" type="submit" disabled={loading}>Change plan</button>
                </form>
              </article>

              <article className="admin-sales-board admin-form-board">
                <h2>Invoice Actions</h2>
                <form className="admin-action-grid" onSubmit={handleInvoiceReview}>
                  <label><span>Invoice ID</span><input inputMode="numeric" value={invoiceAction.invoiceId} onChange={(event) => setInvoiceAction({ ...invoiceAction, invoiceId: event.target.value })} /></label>
                  <label><span>Review result</span><select value={invoiceAction.result} onChange={(event) => setInvoiceAction({ ...invoiceAction, result: event.target.value as typeof invoiceAction.result })}><option value="keep_manual_review">Keep review</option><option value="mark_paid">Mark paid</option><option value="expire">Expire</option></select></label>
                  <label><span>Comment</span><input value={invoiceAction.comment} onChange={(event) => setInvoiceAction({ ...invoiceAction, comment: event.target.value })} /></label>
                  <button className="admin-login-button" type="submit" disabled={loading}>Submit review</button>
                </form>
                <form className="admin-action-grid" onSubmit={handleRefreshInvoice}>
                  <button className="admin-ghost-button" type="submit" disabled={loading}>Refresh invoice status</button>
                </form>
              </article>
            </div>

            <aside className="admin-side-column">
              <article className="admin-chart-card">
                <div className="admin-card-head"><h3>Create Billing Checkout</h3></div>
                <form className="admin-login-form" onSubmit={handleCreateBillingCheckout}>
                  <label><span>Workspace ID</span><input inputMode="numeric" value={billingAction.workspaceId} onChange={(event) => setBillingAction({ ...billingAction, workspaceId: event.target.value })} /></label>
                  <label><span>Plan</span><select value={billingAction.planCode} onChange={(event) => setBillingAction({ ...billingAction, planCode: event.target.value as typeof billingAction.planCode })}><option value="merchant">Merchant</option><option value="developer">Developer</option><option value="business">Business</option><option value="enterprise">Enterprise</option></select></label>
                  <label><span>Network</span><select value={billingAction.payableNetwork} onChange={(event) => setBillingAction({ ...billingAction, payableNetwork: event.target.value })}><option value="TON">TON</option><option value="TRON">TRON</option><option value="BASE">Base</option><option value="ARBITRUM">Arbitrum</option><option value="BSC">BSC</option></select></label>
                  {billingAction.planCode === "enterprise" && <label><span>Enterprise USD</span><input value={billingAction.baseAmountUSD} onChange={(event) => setBillingAction({ ...billingAction, baseAmountUSD: event.target.value })} /></label>}
                  <button type="submit" className="admin-login-button" disabled={loading}>Create checkout</button>
                </form>
                {generatedCheckoutUrl && <p className="admin-sales-summary"><a href={generatedCheckoutUrl} target="_blank" rel="noreferrer">{generatedCheckoutUrl}</a></p>}
              </article>

              <article className="admin-chart-card">
                <div className="admin-card-head"><h3>Webhook / Notes</h3></div>
                <form className="admin-login-form" onSubmit={handleResendWebhook}>
                  <label><span>Delivery ID</span><input inputMode="numeric" value={webhookAction.deliveryId} onChange={(event) => setWebhookAction({ deliveryId: event.target.value })} /></label>
                  <button type="submit" className="admin-login-button" disabled={loading}>Resend webhook</button>
                </form>
                <form className="admin-login-form" onSubmit={handleInternalComment}>
                  <label><span>Target type</span><input value={commentAction.targetType} onChange={(event) => setCommentAction({ ...commentAction, targetType: event.target.value })} /></label>
                  <label><span>Target ID</span><input value={commentAction.targetId} onChange={(event) => setCommentAction({ ...commentAction, targetId: event.target.value })} /></label>
                  <label><span>Comment</span><input value={commentAction.body} onChange={(event) => setCommentAction({ ...commentAction, body: event.target.value })} /></label>
                  <button type="submit" className="admin-login-button" disabled={loading}>Add comment</button>
                </form>
              </article>
            </aside>
          </section>
        )}

        {activeTab === "analytics" && <AnalyticsBoard analytics={analytics} />}
        {activeTab === "audit" && <AuditBoard events={auditEvents} />}
        {activeTab === "content" && <ContentBoard />}
        {activeTab === "seo" && <SEOBoard targets={seoTargets} />}
        {selectedInvoice && <p className="admin-sales-summary">Selected invoice #{selectedInvoice.id} / {selectedInvoice.public_id}</p>}
      </section>
    </main>
  );
}

function InvoiceBoard(props: {
  invoices: AdminInvoice[];
  invoiceList: AdminInvoiceListResponse | null;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSelect: (invoice: AdminInvoice) => void;
  loading: boolean;
}) {
  return (
    <article className="admin-sales-board">
      <div className="admin-sales-head">
        <div><h2>Invoices</h2><p className="admin-sales-summary">{props.invoiceList ? `${props.invoiceList.total} total matches` : "Loading invoices"}</p></div>
        <form className="admin-sales-filters" onSubmit={props.onSubmit}>
          <select value={props.filters.status} onChange={(event) => props.setFilters({ ...props.filters, status: event.target.value })}><option value="all">All statuses</option><option value="awaiting_payment">Awaiting</option><option value="paid">Paid</option><option value="underpaid">Underpaid</option><option value="manual_review">Manual review</option><option value="expired">Expired</option></select>
          <select value={props.filters.kind} onChange={(event) => props.setFilters({ ...props.filters, kind: event.target.value })}><option value="all">All kinds</option><option value="merchant">Merchant</option><option value="subscription">Subscription</option></select>
          <input placeholder="Search seller, email, public id" value={props.filters.query} onChange={(event) => props.setFilters({ ...props.filters, query: event.target.value })} />
          <button className="admin-ghost-button" type="submit">Apply</button>
        </form>
      </div>
      <InvoiceTable invoices={props.invoices} emptyLabel="No invoices found." loading={props.loading} onSelect={props.onSelect} />
    </article>
  );
}

function QueueBoard(props: { title: string; invoices: AdminInvoice[]; onSelect: (invoice: AdminInvoice) => void }) {
  return (
    <article className="admin-sales-board">
      <div className="admin-sales-head"><div><h2>{props.title}</h2><p className="admin-sales-summary">{props.invoices.length} invoices need attention</p></div></div>
      <InvoiceTable invoices={props.invoices} emptyLabel="Manual review queue is clear." loading={false} onSelect={props.onSelect} />
    </article>
  );
}

function InvoiceTable(props: { invoices: AdminInvoice[]; emptyLabel: string; loading: boolean; onSelect: (invoice: AdminInvoice) => void }) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-sales-table">
        <thead><tr><th>Invoice</th><th>Workspace</th><th>Amount</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
        <tbody>
          {props.invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td><div className="admin-table-primary"><a href={buildCheckoutUrl(invoice.public_id)} target="_blank" rel="noreferrer">{invoice.public_id}</a><span>{invoice.title}</span></div></td>
              <td><div className="admin-table-primary"><strong>{invoice.workspace_name || `Workspace #${invoice.workspace_id}`}</strong><span>{invoice.user_email || "no email"}</span></div></td>
              <td>{formatMoney(invoice.base_amount_usd)}</td>
              <td><span className={statusClass(invoice.status)}>{invoice.status}</span></td>
              <td>{formatDateTime(invoice.created_at)}</td>
              <td><button type="button" className="admin-ghost-button" onClick={() => props.onSelect(invoice)}>Use</button></td>
            </tr>
          ))}
          {!props.loading && props.invoices.length === 0 && <tr><td colSpan={6} className="admin-table-empty">{props.emptyLabel}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function StatusMix({ overview }: { overview: AdminOpsOverviewResponse | null }) {
  return (
    <article className="admin-chart-card">
      <div className="admin-card-head"><h3>Status Mix</h3><strong>{overview?.invoices.total || 0}</strong></div>
      <div className="admin-status-legend">
        {(overview?.status_breakdown || []).map((item) => (
          <div className="admin-status-legend-row" key={item.status}><span className={`admin-status-dot status-${item.status}`} /><strong>{item.status}</strong><small>{item.count} / {formatMoney(item.usd)}</small></div>
        ))}
      </div>
    </article>
  );
}

function HealthBoard({ overview }: { overview: AdminOpsOverviewResponse | null }) {
  return (
    <article className="admin-chart-card">
      <div className="admin-card-head"><h3>Health</h3><strong>{overview?.watcher_health.length || 0}</strong></div>
      <div className="admin-status-legend">
        {(overview?.watcher_health || []).slice(0, 6).map((watcher) => (
          <div className="admin-status-legend-row" key={`${watcher.poll_network}-${watcher.destination_address}`}><strong>{watcher.poll_network}</strong><small>{Math.round(watcher.freshness_seconds / 60)}m stale / block {watcher.last_block}</small></div>
        ))}
        {(overview?.failed_webhook_queue || []).slice(0, 5).map((delivery) => (
          <div className="admin-status-legend-row" key={delivery.id}><strong>Webhook #{delivery.id}</strong><small>{delivery.status} / {delivery.event_type}</small></div>
        ))}
      </div>
    </article>
  );
}

function AnalyticsBoard({ analytics }: { analytics: AdminAnalyticsResponse | null }) {
  return (
    <section className="admin-sales-board">
      <div className="admin-sales-head"><div><h2>Analytics</h2><p className="admin-sales-summary">MRR {formatMoney(analytics?.mrr_usd)} / ARR {formatMoney(analytics?.arr_usd)} / paid volume {formatMoney(analytics?.paid_volume_usd)}</p></div></div>
      <div className="admin-table-wrap">
        <table className="admin-sales-table">
          <thead><tr><th>Bucket</th><th>Created</th><th>Paid</th><th>Manual review</th><th>Underpaid</th><th>Paid volume</th></tr></thead>
          <tbody>
            {(analytics?.breakdown || []).map((item) => (
              <tr key={item.bucket}><td>{item.bucket}</td><td>{item.created_invoices}</td><td>{item.paid_invoices}</td><td>{item.manual_review_invoices}</td><td>{item.underpaid_invoices}</td><td>{formatMoney(item.paid_volume_usd)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AuditBoard({ events }: { events: AdminAuditEvent[] }) {
  return (
    <section className="admin-sales-board">
      <div className="admin-sales-head"><div><h2>Audit</h2><p className="admin-sales-summary">{events.length} latest admin events</p></div></div>
      <div className="admin-table-wrap">
        <table className="admin-sales-table">
          <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Metadata</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{formatDateTime(event.created_at)}</td>
                <td>{event.actor || "system"}</td>
                <td>{event.action}</td>
                <td>{event.target_type}:{event.target_id}</td>
                <td>{JSON.stringify(event.metadata || {})}</td>
              </tr>
            ))}
            {events.length === 0 && <tr><td colSpan={5} className="admin-table-empty">No audit events yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ContentBoard() {
  return (
    <section className="admin-sales-board admin-form-board">
      <h2>Content</h2>
      <p className="admin-sales-summary">Draft and published content is managed in the expanded editor.</p>
      <Link className="admin-login-button admin-inline-link" to="/admin/blog">Open content editor</Link>
    </section>
  );
}

function SEOBoard({ targets }: { targets: SEOTarget[] }) {
  return (
    <section className="admin-sales-board">
      <div className="admin-sales-head"><div><h2>SEO Ops</h2><p className="admin-sales-summary">{targets.length} keyword targets</p></div></div>
      <div className="admin-table-wrap">
        <table className="admin-sales-table">
          <thead><tr><th>Cluster</th><th>Target page</th><th>Publish</th><th>Index</th><th>Links</th><th>Video</th><th>Comparison</th></tr></thead>
          <tbody>
            {targets.map((target) => (
              <tr key={target.id}><td>{target.keyword_cluster}</td><td>{target.target_page}</td><td>{target.publish_status}</td><td>{target.index_status}</td><td>{target.internal_links_count}</td><td>{target.video_attached ? "yes" : "no"}</td><td>{target.comparison_page_status}</td></tr>
            ))}
            {targets.length === 0 && <tr><td colSpan={7} className="admin-table-empty">No SEO targets yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
