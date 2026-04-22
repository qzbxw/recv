import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  clearStoredAdminToken,
  createAdminBillingCheckout,
  fetchAdminInvoices,
  fetchAdminOverview,
  getStoredAdminToken,
  loginAdmin,
  setStoredAdminToken,
} from "../lib/api";
import { buildCheckoutUrl } from "../lib/routing";
import type { AdminInvoice, AdminInvoiceListResponse, AdminOverviewResponse } from "../lib/types";

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
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "n/a";
  }
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  return `admin-status-pill status-${status}`;
}

export function AdminDashboardPage() {
  const [token, setToken] = useState(() => getStoredAdminToken() || "");
  const [credentials, setCredentials] = useState({ username: "admin", password: "admin" });
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [invoiceList, setInvoiceList] = useState<AdminInvoiceListResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sellerId, setSellerId] = useState("");
  const [planCode, setPlanCode] = useState<"pro" | "dev" | "enterprise">("dev");
  const [payableNetwork, setPayableNetwork] = useState("TON");
  const [generatedCheckoutUrl, setGeneratedCheckoutUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const invoices = invoiceList?.items || [];

  const metricCards = useMemo(() => {
    if (!overview) {
      return [];
    }
    const totals = overview.totals;
    return [
      { label: "Gross paid", value: formatMoney(totals.gross_paid_usd), note: `${totals.paid_total} paid invoices` },
      { label: "Open volume", value: formatMoney(totals.open_invoice_usd), note: `${totals.awaiting_total} awaiting` },
      { label: "Sellers", value: totals.sellers_total.toLocaleString("en-US"), note: `${totals.active_subscribers} active subscribers` },
      { label: "API surface", value: totals.api_keys_active.toLocaleString("en-US"), note: `${totals.webhook_endpoints} webhook endpoints` },
    ];
  }, [overview]);

  async function loadDashboard(activeToken: string, nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const [nextOverview, nextInvoices] = await Promise.all([
        fetchAdminOverview(activeToken),
        fetchAdminInvoices(activeToken, { page: 1, page_size: 50, ...nextFilters }),
      ]);
      setOverview(nextOverview);
      setInvoiceList(nextInvoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      void loadDashboard(token);
    }
  }, [token]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await loginAdmin(credentials);
      setStoredAdminToken(response.token);
      setToken(response.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearStoredAdminToken();
    setToken("");
    setOverview(null);
    setInvoiceList(null);
  }

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (token) {
      await loadDashboard(token, filters);
    }
  }

  async function handleCreateBillingCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }
    const id = Number(sellerId);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Seller ID is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await createAdminBillingCheckout(token, id, {
        plan_code: planCode,
        payable_network: payableNetwork,
      });
      setGeneratedCheckoutUrl(buildCheckoutUrl(response.invoice.public_id));
      await loadDashboard(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create billing checkout");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="admin-shell">
        <div className="admin-noise" />
        <section className="admin-login-wrap">
          <div className="admin-login-panel">
            <div className="admin-login-copy">
              <span className="admin-eyebrow">Reqst Admin</span>
              <h1>Revenue Command Center</h1>
              <p>Sign in to review sales, subscriptions, and operational payment status.</p>
            </div>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <label>
                <span>Username</span>
                <input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} autoComplete="username" />
              </label>
              <label>
                <span>Password</span>
                <input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} autoComplete="current-password" />
              </label>
              {error && <p className="admin-error">{error}</p>}
              <button type="submit" className="admin-login-button" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
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
            <h1>Revenue Command Center</h1>
            <p>All sales, all statuses, all live payment movement.</p>
          </div>
          <div className="admin-topbar-actions">
            <div className="admin-generated-at">
              <span>Last snapshot</span>
              <strong>{overview ? formatDateTime(overview.generated_at) : "Loading..."}</strong>
            </div>
            <Link to="/admin/blog" className="admin-ghost-button">Blog</Link>
            <button type="button" className="admin-ghost-button" onClick={() => void loadDashboard(token)} disabled={loading}>Refresh</button>
            <button type="button" className="admin-ghost-button" onClick={handleLogout}>Logout</button>
          </div>
        </header>

        {error && <p className="admin-error admin-error--inline">{error}</p>}

        <section className="admin-metric-grid">
          {metricCards.map((metric) => (
            <article className="admin-metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <p>{metric.note}</p>
            </article>
          ))}
        </section>

        <section className="admin-main-grid">
          <div className="admin-main-column">
            <article className="admin-sales-board">
              <div className="admin-sales-head">
                <div>
                  <h2>Invoices</h2>
                  <p className="admin-sales-summary">{invoiceList ? `${invoiceList.total} total matches` : "Loading invoices"}</p>
                </div>
                <form className="admin-sales-filters" onSubmit={handleFilterSubmit}>
                  <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="all">All statuses</option>
                    <option value="awaiting_payment">Awaiting</option>
                    <option value="paid">Paid</option>
                    <option value="underpaid">Underpaid</option>
                    <option value="manual_review">Manual review</option>
                    <option value="expired">Expired</option>
                  </select>
                  <select value={filters.kind} onChange={(event) => setFilters({ ...filters, kind: event.target.value })}>
                    <option value="all">All kinds</option>
                    <option value="merchant">Merchant</option>
                    <option value="subscription">Subscription</option>
                  </select>
                  <input placeholder="Search seller, email, public id" value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} />
                  <button className="admin-ghost-button" type="submit">Apply</button>
                </form>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-sales-table">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Seller</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: AdminInvoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <div className="admin-table-primary">
                            <a href={buildCheckoutUrl(invoice.public_id)} target="_blank" rel="noreferrer">{invoice.public_id}</a>
                            <span>{invoice.title}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-primary">
                            <strong>{invoice.seller_username || `Seller #${invoice.seller_id}`}</strong>
                            <span>{invoice.seller_email || "no email"}</span>
                          </div>
                        </td>
                        <td>{formatMoney(invoice.base_amount_usd)}</td>
                        <td><span className={statusClass(invoice.status)}>{invoice.status}</span></td>
                        <td>{formatDateTime(invoice.created_at)}</td>
                      </tr>
                    ))}
                    {!loading && invoices.length === 0 && (
                      <tr>
                        <td colSpan={5} className="admin-table-empty">No invoices found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <aside className="admin-side-column">
            <article className="admin-chart-card">
              <div className="admin-card-head">
                <h3>Status Mix</h3>
                <strong>{overview?.totals.invoices_total || 0}</strong>
              </div>
              <div className="admin-status-legend">
                {(overview?.status_breakdown || []).map((item) => (
                  <div className="admin-status-legend-row" key={item.status}>
                    <span className={`admin-status-dot status-${item.status}`} />
                    <strong>{item.status}</strong>
                    <small>{item.count} / {formatMoney(item.usd)}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-chart-card">
              <div className="admin-card-head">
                <h3>Create Billing Checkout</h3>
              </div>
              <form className="admin-login-form" onSubmit={handleCreateBillingCheckout}>
                <label>
                  <span>Seller ID</span>
                  <input inputMode="numeric" value={sellerId} onChange={(event) => setSellerId(event.target.value)} />
                </label>
                <label>
                  <span>Plan</span>
                  <select value={planCode} onChange={(event) => setPlanCode(event.target.value as "pro" | "dev" | "enterprise")}>
                    <option value="pro">Pro</option>
                    <option value="dev">Dev</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </label>
                <label>
                  <span>Network</span>
                  <select value={payableNetwork} onChange={(event) => setPayableNetwork(event.target.value)}>
                    <option value="TON">TON</option>
                    <option value="TON_USDT">TON USDT</option>
                    <option value="TRON">TRON</option>
                    <option value="BASE">Base</option>
                    <option value="ARBITRUM">Arbitrum</option>
                    <option value="BSC">BSC</option>
                  </select>
                </label>
                <button type="submit" className="admin-login-button" disabled={loading}>Create checkout</button>
              </form>
              {generatedCheckoutUrl && (
                <p className="admin-sales-summary">
                  <a href={generatedCheckoutUrl} target="_blank" rel="noreferrer">{generatedCheckoutUrl}</a>
                </p>
              )}
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
