import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  clearStoredAdminToken,
  fetchAdminInvoices,
  fetchAdminOverview,
  getStoredAdminToken,
  loginAdmin,
  setStoredAdminToken,
} from "../lib/api";
import type { AdminInvoice, AdminInvoiceListResponse, AdminOverviewResponse } from "../lib/types";

type Filters = {
  status: string;
  kind: string;
  query: string;
  page: number;
};

const STATUS_FILTERS = [
  { value: "all", label: "Все статусы" },
  { value: "paid", label: "Paid" },
  { value: "awaiting_payment", label: "Awaiting" },
  { value: "underpaid", label: "Underpaid" },
  { value: "manual_review", label: "Manual Review" },
  { value: "expired", label: "Expired" },
];

const KIND_FILTERS = [
  { value: "all", label: "Все типы" },
  { value: "merchant", label: "Merchant" },
  { value: "subscription", label: "Subscription" },
];

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  awaiting_payment: "Awaiting Payment",
  underpaid: "Underpaid",
  manual_review: "Manual Review",
  expired: "Expired",
  draft: "Draft",
};

const PLAN_LABELS: Record<string, string> = {
  merchant: "Merchant",
  pro: "Reqst PRO",
  dev: "Reqst Dev",
  enterprise: "Enterprise",
  trial: "Trial",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "#71f2b2",
  awaiting_payment: "#ffd166",
  underpaid: "#ff9b71",
  manual_review: "#8da2ff",
  expired: "#696f79",
  draft: "#989fa7",
};

function formatMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompactMoney(value: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status.replaceAll("_", " ");
}

function getPlanLabel(plan: string) {
  return PLAN_LABELS[plan] ?? plan.toUpperCase();
}

function getSellerLabel(item: AdminInvoice) {
  if (item.seller_username) {
    return `@${item.seller_username}`;
  }
  if (item.seller_email) {
    return item.seller_email;
  }
  return `Seller #${item.seller_id}`;
}

function MetricCard({ label, value, note, accent }: { label: string; value: string; note: string; accent?: string }) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong style={accent ? { color: accent } : undefined}>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

function RevenueChart({ points }: { points: AdminOverviewResponse["daily_sales"] }) {
  const width = 860;
  const height = 290;
  const paddingX = 22;
  const paddingTop = 18;
  const paddingBottom = 38;
  const values = points.map((item) => Number(item.paid_usd));
  const maxValue = Math.max(...values, 1);

  const chartPoints = points.map((item, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
    const y = paddingTop + (1 - Number(item.paid_usd) / maxValue) * (height - paddingTop - paddingBottom);
    return { x, y, label: item.date, value: item.paid_usd };
  });

  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${chartPoints.at(-1)?.x ?? width - paddingX} ${height - paddingBottom} L ${chartPoints[0]?.x ?? paddingX} ${height - paddingBottom} Z`;
  const gridValues = [0.25, 0.5, 0.75, 1].map((fraction) => maxValue * fraction);

  return (
    <div className="admin-chart-card admin-chart-card--feature">
      <div className="admin-card-head">
        <div>
          <span className="admin-eyebrow">30-Day Revenue</span>
          <h3>Paid volume over time</h3>
        </div>
        <strong>{formatMoney(points.reduce((sum, item) => sum + Number(item.paid_usd), 0).toFixed(2))}</strong>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="admin-chart admin-chart--line" role="img" aria-label="Revenue over the last 30 days">
        <defs>
          <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 138, 76, 0.55)" />
            <stop offset="100%" stopColor="rgba(255, 138, 76, 0.02)" />
          </linearGradient>
        </defs>
        {gridValues.map((value) => {
          const y = paddingTop + (1 - value / maxValue) * (height - paddingTop - paddingBottom);
          return (
            <g key={value}>
              <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="admin-chart-grid" />
              <text x={width - paddingX} y={y - 6} className="admin-chart-axis">{formatCompactMoney(value.toFixed(2))}</text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#adminRevenueFill)" />
        <path d={linePath} className="admin-chart-line" />
        {chartPoints.map((point, index) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r={4} className="admin-chart-node" />
            {(index === 0 || index === chartPoints.length - 1 || index % 7 === 0) && (
              <text x={point.x} y={height - 12} textAnchor="middle" className="admin-chart-axis">
                {new Date(point.label).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="admin-chart-meta">
        <span>Merchant: {formatCompactMoney(points.reduce((sum, item) => sum + Number(item.merchant_paid_usd), 0).toFixed(2))}</span>
        <span>Subscriptions: {formatCompactMoney(points.reduce((sum, item) => sum + Number(item.subscription_paid_usd), 0).toFixed(2))}</span>
        <span>Paid sales: {formatCount(points.reduce((sum, item) => sum + item.paid_count, 0))}</span>
      </div>
    </div>
  );
}

function BreakdownBars({ title, subtitle, items }: { title: string; subtitle: string; items: Array<{ label: string; value: string; note: string; color?: string }> }) {
  const maxValue = Math.max(...items.map((item) => Number(item.value)), 1);

  return (
    <div className="admin-chart-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-eyebrow">{subtitle}</span>
          <h3>{title}</h3>
        </div>
      </div>
      <div className="admin-bars">
        {items.map((item) => (
          <div key={item.label} className="admin-bar-row">
            <div className="admin-bar-copy">
              <strong>{item.label}</strong>
              <span>{item.note}</span>
            </div>
            <div className="admin-bar-track">
              <div
                className="admin-bar-fill"
                style={{
                  width: `${Math.max((Number(item.value) / maxValue) * 100, 4)}%`,
                  background: item.color ? `linear-gradient(90deg, ${item.color}, rgba(255,255,255,0.08))` : undefined,
                }}
              />
            </div>
            <strong className="admin-bar-value">{formatCompactMoney(item.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusRing({ items }: { items: AdminOverviewResponse["status_breakdown"] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
  let cursor = 0;
  const segments = items.map((item) => {
    const start = (cursor / total) * 100;
    cursor += item.count;
    const end = (cursor / total) * 100;
    return `${STATUS_COLORS[item.status] ?? "#f4efe6"} ${start}% ${end}%`;
  });

  return (
    <div className="admin-chart-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-eyebrow">Status Radar</span>
          <h3>Current invoice state mix</h3>
        </div>
        <strong>{formatCount(total)}</strong>
      </div>
      <div className="admin-status-ring-wrap">
        <div className="admin-status-ring" style={{ background: `conic-gradient(${segments.join(", ")})` }}>
          <div className="admin-status-ring-core">
            <span>Invoices</span>
            <strong>{formatCount(total)}</strong>
          </div>
        </div>
        <div className="admin-status-legend">
          {items.map((item) => (
            <div key={item.status} className="admin-status-legend-row">
              <span className="admin-status-dot" style={{ background: STATUS_COLORS[item.status] ?? "#fff" }} />
              <div>
                <strong>{getStatusLabel(item.status)}</strong>
                <small>{formatCount(item.count)} invoices · {formatCompactMoney(item.usd)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentSales({ items }: { items: AdminInvoice[] }) {
  return (
    <div className="admin-chart-card">
      <div className="admin-card-head">
        <div>
          <span className="admin-eyebrow">Signal Feed</span>
          <h3>Latest movement across the system</h3>
        </div>
      </div>
      <div className="admin-recent-list">
        {items.map((item) => (
          <a key={item.id} href={item.checkout_url} className="admin-recent-item" target="_blank" rel="noreferrer">
            <div>
              <strong>{item.title}</strong>
              <p>{getSellerLabel(item)} · {item.public_id}</p>
            </div>
            <div className="admin-recent-meta">
              <span className={`admin-status-pill status-${item.status}`}>{getStatusLabel(item.status)}</span>
              <strong>{formatMoney(item.base_amount_usd)}</strong>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(() => getStoredAdminToken());
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [invoices, setInvoices] = useState<AdminInvoiceListResponse | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loggingIn, setLoggingIn] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    kind: "all",
    query: "",
    page: 1,
  });

  async function loadOverview(authToken: string, silent = false) {
    try {
      if (!silent) {
        setLoadingOverview(true);
      }
      const data = await fetchAdminOverview(authToken);
      setOverview(data);
      setError("");
    } catch (err) {
      clearStoredAdminToken();
      setToken(null);
      setOverview(null);
      setInvoices(null);
      setError((err as Error).message);
    } finally {
      if (!silent) {
        setLoadingOverview(false);
      }
    }
  }

  async function loadInvoices(authToken: string, nextFilters: Filters, silent = false) {
    try {
      if (!silent) {
        setLoadingInvoices(true);
      }
      const data = await fetchAdminInvoices(authToken, {
        page: nextFilters.page,
        page_size: 50,
        status: nextFilters.status,
        kind: nextFilters.kind,
        query: nextFilters.query,
      });
      setInvoices(data);
      setError("");
    } catch (err) {
      clearStoredAdminToken();
      setToken(null);
      setOverview(null);
      setInvoices(null);
      setError((err as Error).message);
    } finally {
      if (!silent) {
        setLoadingInvoices(false);
      }
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadOverview(token);
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadInvoices(token, filters);
  }, [token, filters]);

  useEffect(() => {
    if (!token) {
      return;
    }
    const interval = window.setInterval(() => {
      void loadOverview(token, true);
      void loadInvoices(token, filters, true);
    }, 30000);
    return () => window.clearInterval(interval);
  }, [token, filters]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    try {
      setLoggingIn(true);
      const result = await loginAdmin(loginForm);
      setStoredAdminToken(result.token);
      setToken(result.token);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    clearStoredAdminToken();
    setToken(null);
    setOverview(null);
    setInvoices(null);
  }

  const networkBars = useMemo(() => (overview?.network_breakdown ?? []).map((item) => ({
    label: item.network,
    value: item.paid_usd,
    note: `${formatCount(item.paid_count)} paid / ${formatCount(item.total_count)} total`,
    color: STATUS_COLORS.paid,
  })), [overview]);

  const planBars = useMemo(() => (overview?.plan_breakdown ?? []).map((item, index) => ({
    label: getPlanLabel(item.plan_code),
    value: item.paid_usd,
    note: `${formatCount(item.paid_count)} paid invoices`,
    color: ["#ff8a4c", "#71f2b2", "#8da2ff", "#ffd166"][index % 4],
  })), [overview]);

  const totalPages = invoices ? Math.max(1, Math.ceil(invoices.total / invoices.page_size)) : 1;

  return (
    <main className="admin-shell">
      <div className="admin-noise" />
      <div className="admin-glow admin-glow--orange" />
      <div className="admin-glow admin-glow--blue" />

      {!token ? (
        <section className="admin-login-wrap">
          <div className="admin-login-panel">
            <div className="admin-login-copy">
              <span className="admin-eyebrow">Reqst Internal</span>
              <h1>Black Room Admin</h1>
              <p>
                Secure access to every sale, every status transition, and the full live state of the platform.
                Credentials are read from environment variables only.
              </p>
            </div>
            <form className="admin-login-form" onSubmit={handleLogin}>
              <label>
                <span>Login</span>
                <input
                  value={loginForm.username}
                  onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
                  placeholder="admin"
                  autoComplete="username"
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Long and strong password"
                  autoComplete="current-password"
                />
              </label>
              {error ? <div className="admin-error">{error}</div> : null}
              <button type="submit" className="admin-login-button" disabled={loggingIn}>
                {loggingIn ? "Authorizing..." : "Enter Admin"}
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="admin-dashboard">
          <header className="admin-topbar">
            <div>
              <span className="admin-eyebrow">Reqst Admin</span>
              <h1>Revenue Command Center</h1>
              <p>
                All sales, all statuses, all the live movement in one black dashboard.
              </p>
            </div>
            <div className="admin-topbar-actions">
              <div className="admin-generated-at">
                <span>Last snapshot</span>
                <strong>{overview ? formatDateTime(overview.generated_at) : "Loading..."}</strong>
              </div>
              <button type="button" className="admin-ghost-button" onClick={() => token && void loadOverview(token)}>
                Refresh
              </button>
              <button type="button" className="admin-ghost-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          {error ? <div className="admin-error admin-error--inline">{error}</div> : null}

          <section className="admin-metric-grid">
            <MetricCard
              label="Gross Paid"
              value={overview ? formatMoney(overview.totals.gross_paid_usd) : "—"}
              note={overview ? `${formatCount(overview.totals.paid_total)} successful invoices` : "Loading"}
              accent="#ffb36d"
            />
            <MetricCard
              label="Merchant Volume"
              value={overview ? formatMoney(overview.totals.merchant_paid_usd) : "—"}
              note={overview ? `${formatCount(overview.totals.merchant_paid_total)} direct sales` : "Loading"}
              accent="#71f2b2"
            />
            <MetricCard
              label="Subscription Revenue"
              value={overview ? formatMoney(overview.totals.subscription_paid_usd) : "—"}
              note={overview ? `${formatCount(overview.totals.subscription_paid_total)} billing checkouts` : "Loading"}
              accent="#8da2ff"
            />
            <MetricCard
              label="Open Exposure"
              value={overview ? formatMoney(overview.totals.open_invoice_usd) : "—"}
              note={overview ? `${formatCount(overview.totals.awaiting_total + overview.totals.underpaid_total + overview.totals.manual_review_total)} invoices still in play` : "Loading"}
              accent="#ffd166"
            />
            <MetricCard
              label="Active Subscribers"
              value={overview ? formatCount(overview.totals.active_subscribers) : "—"}
              note={overview ? `${formatCount(overview.totals.sellers_total)} sellers total` : "Loading"}
            />
            <MetricCard
              label="Integration Footprint"
              value={overview ? `${formatCount(overview.totals.api_keys_active)} keys` : "—"}
              note={overview ? `${formatCount(overview.totals.webhook_endpoints)} webhook endpoints · ${formatCount(overview.totals.wallets_total)} wallets` : "Loading"}
            />
          </section>

          <section className="admin-main-grid">
            <div className="admin-main-column">
              {overview ? <RevenueChart points={overview.daily_sales} /> : <div className="admin-chart-card admin-chart-card--feature admin-loading-card">Loading overview...</div>}
              {overview ? <BreakdownBars title="Paid revenue by network" subtitle="Network Split" items={networkBars} /> : null}
            </div>

            <div className="admin-side-column">
              {overview ? <StatusRing items={overview.status_breakdown} /> : null}
              {overview ? <BreakdownBars title="Revenue by plan bucket" subtitle="Plan Mix" items={planBars} /> : null}
              {overview ? <RecentSales items={overview.recent_sales} /> : null}
            </div>
          </section>

          <section className="admin-sales-board">
            <div className="admin-sales-head">
              <div>
                <span className="admin-eyebrow">Full Ledger</span>
                <h2>Absolutely all sales</h2>
              </div>
              <div className="admin-sales-filters">
                <input
                  value={filters.query}
                  onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value, page: 1 }))}
                  placeholder="Search by public ID, title, username, email"
                />
                <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <select value={filters.kind} onChange={(event) => setFilters((current) => ({ ...current, kind: event.target.value, page: 1 }))}>
                  {KIND_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-sales-summary">
              <span>{invoices ? `${formatCount(invoices.total)} invoices matched` : "Loading..."}</span>
              <span>{overview ? `${formatCount(overview.totals.blocked_sellers)} blocked sellers` : ""}</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-sales-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Seller</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Classification</th>
                    <th>Network</th>
                    <th>USD</th>
                    <th>Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingInvoices ? (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">Loading invoice stream...</td>
                    </tr>
                  ) : invoices && invoices.items.length > 0 ? (
                    invoices.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="admin-table-primary">
                            <a href={item.checkout_url} target="_blank" rel="noreferrer">{item.title}</a>
                            <span>{item.public_id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-primary">
                            <strong>{getSellerLabel(item)}</strong>
                            <span>ID {item.seller_id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="admin-table-primary">
                            <strong>{item.kind === "subscription" ? "Subscription" : "Merchant"}</strong>
                            <span>{getPlanLabel(item.plan_code || "merchant")}</span>
                          </div>
                        </td>
                        <td><span className={`admin-status-pill status-${item.status}`}>{getStatusLabel(item.status)}</span></td>
                        <td>{item.classification || "—"}</td>
                        <td>
                          <div className="admin-table-primary">
                            <strong>{item.payable_network}</strong>
                            <span>{item.payable_amount}</span>
                          </div>
                        </td>
                        <td>{formatMoney(item.base_amount_usd)}</td>
                        <td>
                          <div className="admin-table-primary">
                            <strong>Created {formatDateTime(item.created_at)}</strong>
                            <span>{item.paid_at ? `Paid ${formatDateTime(item.paid_at)}` : `Expires ${formatDateTime(item.expires_at)}`}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="admin-table-empty">Nothing matched this filter set.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="admin-ghost-button"
                onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
                disabled={filters.page <= 1}
              >
                Previous
              </button>
              <span>Page {filters.page} / {totalPages}</span>
              <button
                type="button"
                className="admin-ghost-button"
                onClick={() => setFilters((current) => ({ ...current, page: Math.min(totalPages, current.page + 1) }))}
                disabled={filters.page >= totalPages}
              >
                Next
              </button>
            </div>
          </section>
        </section>
      )}
    </main>
  );
}
