import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import {
  createAPIKey,
  createBillingCheckout,
  createDeveloperInvoice,
  createWebhookEndpoint,
  deleteAPIKey,
  deleteWebhookEndpoint,
  fetchAPIKeys,
  fetchDeveloperUsage,
  fetchMe,
  fetchWebhookDeliveries,
  fetchWebhookEndpoints,
  getApiBase,
  getStoredToken,
  resendWebhookDelivery,
  rotateWebhookEndpointSecret,
  simulateTestPayment,
  getBillingOptions,
} from "../lib/api";
import { ApiError, formatApiError, mapApiError } from "../lib/errors";
import { buildCheckoutUrl } from "../lib/routing";
import { formatInvoiceStatus } from "../lib/status";
import type { APIKey, DeveloperUsageResponse, Invoice, MeResponse, Network, PaymentAsset, WebhookDelivery, WebhookEndpoint, Environment, BillingOptionsResponse, BillingOptionPlan } from "../lib/types";
import { useUI } from "../lib/ui";
import { DEVELOPER_PORTAL_COPY as COPY, type Language } from "../i18n";

const PLAN_OPTIONS = [
  { value: "merchant", label: "Merchant" },
  { value: "developer", label: "Developer" },
  { value: "business", label: "Business" },
] as const;

const NETWORK_OPTIONS: Array<{ value: string; network: Network; asset: PaymentAsset; label: string }> = [
  { value: "TON:GRAM", network: "TON", asset: "GRAM", label: "TON GRAM" },
  { value: "TON:USDT", network: "TON", asset: "USDT", label: "TON USDT" },
  { value: "TRON:USDT", network: "TRON", asset: "USDT", label: "TRON USDT" },
  { value: "BASE:USDT", network: "BASE", asset: "USDT", label: "Base USDT" },
  { value: "BSC:USDT", network: "BSC", asset: "USDT", label: "BSC USDT" },
];

const DEFAULT_SCOPES = ["invoices:read", "invoices:write"];

function formatDate(value: string | null | undefined, language: Language) {
  if (!value) return COPY[language].common.never;
  const dateLocale: Record<Language, string> = {
    ru: "ru-RU",
    en: "en-US",
    uk: "uk-UA",
    uz: "uz-UZ",
    de: "de-DE",
  };
  const date = new Date(value);
  return new Intl.DateTimeFormat(dateLocale[language], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function DeveloperPortalPage() {
  const { language } = useUI();
  const t = COPY[language];
  const [token] = useState(() => getStoredToken());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [usage, setUsage] = useState<DeveloperUsageResponse | null>(null);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [billingOptions, setBillingOptions] = useState<BillingOptionsResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("hero");

  // Form states
  const [latestSecret, setLatestSecret] = useState("");
  const [latestWebhookSecret, setLatestWebhookSecret] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [billingPlan, setBillingPlan] = useState<string>("developer");
  const [billingOption, setBillingOption] = useState<string>("TRON:USDT");
  const [billingDays, setBillingDays] = useState<number>(30);
  const [keyLabel, setKeyLabel] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(DEFAULT_SCOPES);
  const [keyEnvironment, setKeyEnvironment] = useState<Environment>("test");
  const [hookForm, setHookForm] = useState({ label: "", url: "", environment: "test" as Environment });
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [apiView, setApiView] = useState<"params" | "response">("params");
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [sampleSecret, setSampleSecret] = useState("");
  const [sampleInvoice, setSampleInvoice] = useState<Invoice | null>(null);
  const [sampleBusy, setSampleBusy] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    void loadPortal(token);
  }, [token]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll("section[id]").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  async function loadPortal(sessionToken: string) {
    try {
      setLoading(true);
      const [meRes, usageRes, keysRes, hooksRes, deliveriesRes, billingOpts] = await Promise.all([
        fetchMe(sessionToken),
        fetchDeveloperUsage(sessionToken).catch(() => null),
        fetchAPIKeys(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookDeliveries(sessionToken).catch(() => ({ items: [] })),
        getBillingOptions(sessionToken).catch(() => null),
      ]);
      setMe(meRes);
      setUsage(usageRes);
      setAPIKeys(keysRes.items ?? []);
      setWebhooks(hooksRes.items ?? []);
      setDeliveries(deliveriesRes.items ?? []);
      setBillingOptions(billingOpts);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }

  const handleCopy = async (val: string, id: string) => {
    await navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const handleCreateKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await createAPIKey(token, { label: keyLabel, scopes: keyScopes, environment: keyEnvironment });
      setLatestSecret(res.secret);
      if (keyEnvironment === "test") {
        setSampleSecret(res.secret);
      }
      setKeyLabel("");
      await loadPortal(token);
    } catch (err) { setError(formatApiError(err)); }
  };

  const toggleScope = (scope: string) => {
    setKeyScopes(prev => prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]);
  };

  const handleDeleteKey = async (id: number) => {
    if (!token) return;
    try {
      await deleteAPIKey(token, id);
      await loadPortal(token);
    } catch (err) { setError(formatApiError(err)); }
  };

  const handleCreateWebhook = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await createWebhookEndpoint(token, { label: hookForm.label, url: hookForm.url, environment: hookForm.environment });
      setLatestWebhookSecret(res.webhook.secret);
      setHookForm({ label: "", url: "", environment: "test" });
      await loadPortal(token);
    } catch (err) { setError(formatApiError(err)); }
  };

  const handleRotateWebhook = async (id: number) => {
    if (!token) return;
    try {
      const res = await rotateWebhookEndpointSecret(token, id);
      setLatestWebhookSecret(res.webhook.secret);
      await loadPortal(token);
    } catch (err) { setError(formatApiError(err)); }
  };

  const handleDeleteWebhook = async (id: number) => {
    if (!token) return;
    try {
      await deleteWebhookEndpoint(token, id);
      await loadPortal(token);
    } catch (err) { setError(formatApiError(err)); }
  };

  const handleUpgrade = async () => {
    if (!token) return;
    if (billingDays < 14) {
      setError(t.billing.durationInvalid || "Subscription duration must be at least 14 days");
      return;
    }
    try {
      const selectedBillingOption = NETWORK_OPTIONS.find(option => option.value === billingOption) ?? NETWORK_OPTIONS[2];
      const invoice = await createBillingCheckout(token, {
        payment_method: "crypto",
        payable_network: selectedBillingOption.network,
        payable_asset: selectedBillingOption.asset,
        payment_options: [{ network: selectedBillingOption.network, asset: selectedBillingOption.asset }],
        plan_code: billingPlan,
        subscription_days: billingDays,
      });
      setCheckoutUrl(buildCheckoutUrl(invoice.public_id));
    } catch (err) { setError(formatApiError(err)); }
  };

  const testKey = apiKeys.find(key => key.environment === "test");
  const liveKey = apiKeys.find(key => key.environment === "live");

  async function handleCreateSampleInvoice() {
    const secret = sampleSecret;
    if (!secret) {
      setError(t.common.createTestKeyFirst);
      return;
    }
    setSampleBusy(true);
    try {
      const invoice = await createDeveloperInvoice(secret, {
        title: "recv API test invoice",
        base_amount_usd: "10.00",
        payable_network: "TRON",
        expires_in_minutes: 30,
      });
      setSampleInvoice(invoice);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSampleBusy(false);
    }
  }

  async function handleSimulatePayment() {
    if (!sampleSecret || !sampleInvoice) return;
    setSampleBusy(true);
    try {
      const invoice = await simulateTestPayment(sampleSecret, sampleInvoice.id);
      setSampleInvoice(invoice);
      if (token) await loadPortal(token);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSampleBusy(false);
    }
  }

  async function handleResendDelivery(id: number) {
    if (!token) return;
    try {
      await resendWebhookDelivery(token, id);
      await loadPortal(token);
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const apiBase = useMemo(() => `${getApiBase() || window.location.origin}/v1`, []);

  const endpoints = [
    {
      method: "GET",
      path: "/me",
      title: t.api.endpoints[0].title,
      desc: t.api.endpoints[0].desc,
      params: [],
      response: {
        user: { id: 1, username: "merchant_one", email: "biz@example.com" },
        workspace: { id: 1, username: "workspace_one", plan_code: "developer" },
        plan: { code: "developer", name: "Developer", requests_per_minute: 90, monthly_cap: 50000 },
        usage: { monthly_requests: 450, monthly_limit: 50000 },
        key: { id: 12, label: "Production Backend", scopes: ["invoices:read", "invoices:write"], environment: "live" }
      }
    },
    {
      method: "GET",
      path: "/invoices",
      title: t.api.endpoints[1].title,
      desc: t.api.endpoints[1].desc,
      params: [
        { name: "page", type: "int", desc: t.api.endpoints[1].params[0] },
        { name: "page_size", type: "int", desc: t.api.endpoints[1].params[1] }
      ],
      response: {
        items: [{ id: 1, public_id: "RQST-X1", title: "Order #1", status: "paid", base_amount_usd: "10.00", environment: "live" }],
        page: 1,
        page_size: 20
      }
    },
    {
      method: "POST",
      path: "/invoices",
      title: t.api.endpoints[2].title,
      desc: t.api.endpoints[2].desc,
      params: [
        { name: "title", type: "string", desc: t.api.endpoints[2].params[0] },
        { name: "base_amount_usd", type: "decimal", desc: t.api.endpoints[2].params[1] },
        { name: "payable_network", type: "string", desc: "Network code such as TON, TRON, BASE, or BSC. Use payable_asset to choose GRAM or USDT on TON." },
        { name: "expires_in_minutes", type: "int", desc: t.api.endpoints[2].params[2] }
      ],
      response: {
        id: 1842,
        public_id: "RQST-9N2QK7",
        title: "Product Subscription",
        status: "awaiting_payment",
        checkout_url: "https://recv.money/app/checkout/RQST-9N2QK7",
        base_amount_usd: "25.00",
        payable_amount: "25.000000",
        payable_network: "TRON",
        environment: "live"
      }
    },
    {
      method: "GET",
      path: "/invoices/:id",
      title: t.api.endpoints[3].title,
      desc: t.api.endpoints[3].desc,
      params: [
        { name: "id", type: "int", desc: t.api.endpoints[3].params[0] }
      ],
      response: { id: 1842, public_id: "RQST-9N2QK7", status: "paid", tx_hash: "0x...", environment: "live" }
    },
    {
      method: "POST",
      path: "/invoices/:id/cancel",
      title: t.api.endpoints[4].title,
      desc: t.api.endpoints[4].desc,
      params: [
        { name: "id", type: "int", desc: t.api.endpoints[4].params[0] }
      ],
      response: { id: 1842, status: "expired" }
    }
  ];

  const currentEp = endpoints[selectedMethod];
  const commonErrors = [400, 401, 403, 404, 409, 429, 500].map(status => mapApiError(new ApiError(status, "")));

  const curlExample = `curl -X ${currentEp.method} ${apiBase}${currentEp.path.replace(":id", "1842")} \\
  -H "Authorization: Bearer YOUR_KEY" \\
  ${currentEp.method === "POST" ? "-H 'Content-Type: application/json' \\\n  -d '{\"title\":\"Order\", \"base_amount_usd\":\"10.00\"}'" : ""}`;

  return (
    <main className="dev-portal">
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      
      <div className="dev-portal__shell">
        <header className="dev-portal__topbar portal-animate-in">
          <Link className="dev-portal__brand" to="/">recv</Link>
          <div className="dev-portal__header-links">
            <Link className="dev-btn dev-btn--primary" to="/console">{t.common.console}</Link>
          </div>
        </header>

        <div className="dev-portal__main">
          <nav className="dev-portal__nav portal-animate-in">
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">Platform</span>
              <a href="#hero" className={`dev-portal__nav-link ${activeSection === "hero" ? "is-active" : ""}`}>{t.nav.docs}</a>
              <a href="#dashboard" className={`dev-portal__nav-link ${activeSection === "dashboard" ? "is-active" : ""}`}>{t.nav.dashboard}</a>
            </div>
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">Management</span>
              <a href="#keys" className={`dev-portal__nav-link ${activeSection === "keys" ? "is-active" : ""}`}>{t.nav.keys}</a>
              <a href="#webhooks" className={`dev-portal__nav-link ${activeSection === "webhooks" ? "is-active" : ""}`}>{t.nav.webhooks}</a>
              <a href="#mcp" className={`dev-portal__nav-link ${activeSection === "mcp" ? "is-active" : ""}`}>{t.nav.mcp}</a>
              <a href="#billing" className={`dev-portal__nav-link ${activeSection === "billing" ? "is-active" : ""}`}>{t.nav.billing}</a>
            </div>
          </nav>

          <div className="dev-portal__body">
            {error && <div className="alert portal-animate-in">{error}</div>}

            <section id="hero" className="dev-portal__hero portal-animate-in">
              <span className="dev-api-badge dev-api-badge--post dev-api-badge--fit">{t.hero.kicker}</span>
              <h1>{t.hero.title}</h1>
              <p>{t.hero.subtitle}</p>
            </section>

            <section id="dashboard" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.dashboard.title}</h2>
              </div>
              
              <div className="dev-widget-grid">
                <div className="dev-card dev-card--accent dev-widget">
                  <span className="dev-widget__label">{t.dashboard.plan}</span>
                  <div className="dev-widget__value">{me?.plan.name ?? "—"}</div>
                  <div className="dev-widget__meta">{(me?.plan.has_api || import.meta.env.DEV) ? t.dashboard.active : t.dashboard.inactive}</div>
                </div>
                <div className="dev-card dev-widget">
                  <span className="dev-widget__label">{t.dashboard.usage}</span>
                  <div className="dev-widget__value">{usage?.usage.monthly_requests ?? 0} <small className="dev-widget__usage-meta">/ {usage?.usage.monthly_limit || "∞"}</small></div>
                  <div className="dev-usage-bar">
                    <div className="dev-usage-fill" style={{ width: `${Math.min(100, ((usage?.usage.monthly_requests ?? 0) / (usage?.usage.monthly_limit || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="dev-card dev-widget">
                  <span className="dev-widget__label">RPM Limit</span>
                  <div className="dev-widget__value">{usage?.usage.minute_limit ?? 0}</div>
                  <div className="dev-widget__meta">{t.dashboard.limit} {t.dashboard.perMinute}</div>
                </div>
              </div>
            </section>

            <section id="quickstart" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.quickstart.title}</h2>
                <p>{t.quickstart.subtitle}</p>
              </div>
              <div className="portal-quickstart">
                {[
                  { done: Boolean(testKey || sampleSecret), title: t.quickstart.testKey, body: testKey?.prefix ?? "test_..." },
                  { done: Boolean(sampleInvoice), title: t.quickstart.testInvoice, body: sampleInvoice?.public_id ?? "POST /v1/invoices" },
                  { done: sampleInvoice?.status === "paid", title: t.quickstart.simulate, body: sampleInvoice ? formatInvoiceStatus(sampleInvoice.status, language) : "simulate-payment" },
                  { done: webhooks.length > 0, title: t.quickstart.webhook, body: webhooks[0]?.url ?? "https://..." },
                  { done: Boolean(liveKey), title: "Live", body: liveKey?.prefix ?? "live_..." },
                ].map((step) => (
                  <div key={step.title} className="portal-quickstart__step">
                    <span className={`dev-api-badge dev-api-badge--${step.done ? "done" : "post"}`}>{step.done ? t.quickstart.done : t.quickstart.next}</span>
                    <h3 className="portal-quickstart__title">{step.title}</h3>
                    <p className="portal-quickstart__body">{step.body}</p>
                  </div>
                ))}
              </div>
              <div className="dev-card">
                <div className="dev-portal__section-header dev-portal__section-header--tight">
                  <h3>{t.quickstart.simulatorTitle}</h3>
                  <p>{t.quickstart.simulatorDesc}</p>
                </div>
                <div className="dev-portal__actions-row">
                  <button className="dev-btn dev-btn--primary" disabled={sampleBusy || !sampleSecret} onClick={() => void handleCreateSampleInvoice()}>
                    {t.quickstart.createInvoice}
                  </button>
                  <button className="dev-btn dev-btn--secondary" disabled={sampleBusy || !sampleInvoice || sampleInvoice.status === "paid"} onClick={() => void handleSimulatePayment()}>
                    {t.quickstart.simulatePayment}
                  </button>
                  {sampleInvoice ? <a className="dev-btn dev-btn--secondary" href={buildCheckoutUrl(sampleInvoice.public_id)} target="_blank" rel="noreferrer">{t.quickstart.openCheckout}</a> : null}
                </div>
                {sampleInvoice ? (
                  <div className="dev-resource-card dev-resource-card--margin">
                    <div className="dev-resource-card__info">
                      <div className="dev-resource-card__title">{sampleInvoice.title}</div>
                      <div className="dev-resource-card__meta">{sampleInvoice.public_id} • {formatInvoiceStatus(sampleInvoice.status, language)} • {sampleInvoice.environment}</div>
                    </div>
                    <button className="dev-btn dev-btn--secondary" onClick={() => handleCopy(buildCheckoutUrl(sampleInvoice.public_id), "sample-url")}>
                      {copiedId === "sample-url" ? t.common.copied : "URL"}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section id="api" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.api.title}</h2>
                <p>{t.api.subtitle}: <code>{apiBase}</code></p>
              </div>

              <div className="dev-api-grid">
                <div className="dev-api-docs">
                  <div className="dev-card dev-card--margin-bottom">
                    <h3 className="dev-card__title--small">{t.api.authTitle}</h3>
                    <p className="dev-card__desc--small">{t.api.authDesc}</p>
                  </div>

                  {endpoints.map((ep, idx) => (
                    <div 
                      key={ep.path} 
                      className={`dev-api-method dev-api-method--interactive ${selectedMethod === idx ? "is-selected" : ""}`} 
                      onClick={() => setSelectedMethod(idx)}
                    >
                      <div className="dev-api-method__head">
                        <span className={`dev-api-badge dev-api-badge--${ep.method.toLowerCase()}`}>{ep.method}</span>
                        <code className="dev-api-path">{ep.path}</code>
                      </div>
                      <h3 className="dev-api-method__title">{ep.title}</h3>
                      <p className="dev-api-method__desc">{ep.desc}</p>
                      
                      {selectedMethod === idx && ep.params.length > 0 && (
                        <div className="dev-api-method__params">
                          <span className="dev-widget__label dev-api-method__params-label">{t.api.params}</span>
                          <div className="dev-api-method__params-list">
                            {ep.params.map(p => (
                              <div key={p.name} className="dev-api-method__param-row">
                                <code className="dev-api-method__param-name">{p.name}</code>
                                <span className="dev-api-method__param-type">{p.type}</span>
                                <span>{p.desc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="dev-code-box">
                  <div className="dev-code-box__header">
                    <div className="dev-code-box__tabs">
                      <span className={`dev-code-box__tab ${apiView === "params" ? "is-active" : ""}`} onClick={() => setApiView("params")}>{t.api.requestCurl}</span>
                      <span className={`dev-code-box__tab ${apiView === "response" ? "is-active" : ""}`} onClick={() => setApiView("response")}>{t.api.response}</span>
                    </div>
                    <button className="dev-code-box__copy" onClick={() => handleCopy(apiView === "params" ? curlExample : JSON.stringify(currentEp.response, null, 2), "code")}>
                      {copiedId === "code" ? t.common.copied : t.common.copy}
                    </button>
                  </div>
                  <pre className="dev-code-box__content">
                    <code>{apiView === "params" ? curlExample : JSON.stringify(currentEp.response, null, 2)}</code>
                  </pre>
                </div>
              </div>
              <div className="dev-card">
                <div className="dev-portal__section-header dev-portal__section-header--tight">
                  <h3>{t.api.errorsTitle}</h3>
                  <p>{t.api.errorsSubtitle}</p>
                </div>
                <div className="dev-resource-list">
                  {commonErrors.map(item => (
                    <div key={item.status} className="dev-resource-card">
                      <div className="dev-resource-card__info">
                        <div className="dev-resource-card__title">{item.status} {item.message}</div>
                        <div className="dev-resource-card__meta">{item.action}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="keys" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.keys.title}</h2>
                <p>{t.keys.subtitle}</p>
              </div>

              {!token ? (
                <div className="dev-portal__locked-state">
                  <h3>{t.common.signInRequired}</h3>
                  <p>{t.common.signInRequiredBody}</p>
                  <Link to="/auth" className="dev-btn dev-btn--primary">{t.common.signIn}</Link>
                </div>
              ) : (
                <div className="dev-card">
                  <form onSubmit={handleCreateKey} className="dev-form">
                    <div className="portal-mode-tabs portal-mode-tabs--margin" role="tablist" aria-label="API key mode">
                      {(["test", "live"] as const).map(mode => (
                        <button key={mode} type="button" className={keyEnvironment === mode ? "is-active" : ""} onClick={() => setKeyEnvironment(mode)}>
                          {mode === 'test' ? t.common.testMode : t.common.liveMode}
                        </button>
                      ))}
                    </div>
                    <div className="dev-form__row-grid">
                      <div className="dev-input-group">
                        <label>{t.keys.label}</label>
                        <input className="dev-input" value={keyLabel} onChange={e => setKeyLabel(e.target.value)} placeholder={t.keys.placeholder} required />
                      </div>
                      <button type="submit" className="dev-btn dev-btn--primary" disabled={!(me?.plan.has_api || import.meta.env.DEV)}>{t.keys.create}</button>
                    </div>
                    <div className="dev-form__scopes-row">
                      {["invoices:read", "invoices:write"].map(s => (
                        <label key={s} className={`dev-scope-pill dev-scope-pill--interactive ${keyScopes.includes(s) ? "is-active" : ""}`}>
                          <input type="checkbox" className="dev-scope-pill__checkbox" checked={keyScopes.includes(s)} onChange={() => toggleScope(s)} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </form>

                  {latestSecret && (
                    <div className="alert alert--success alert--secret">
                      <div>
                        <small className="alert__label">{t.keys.warning}</small>
                        <code className="alert__code">{latestSecret}</code>
                      </div>
                      <button className="dev-code-box__copy" onClick={() => handleCopy(latestSecret, "latest")}>
                        {copiedId === "latest" ? t.common.copied : t.common.copy}
                      </button>
                    </div>
                  )}

                  <div className="dev-resource-list dev-resource-list--margin">
                    {apiKeys.map(key => (
                      <div key={key.id} className="dev-resource-card">
                        <div className="dev-resource-card__info">
                          <div className="dev-resource-card__title">{key.label}</div>
                          <div className="dev-resource-card__meta">
                            <code>{key.prefix}***</code> • {key.environment} • {formatDate(key.created_at, language)}
                          </div>
                          <div className="dev-form__scopes-row dev-form__scopes-row--margin">
                            {key.scopes.map(s => <span key={s} className="dev-scope-pill">{s}</span>)}
                          </div>
                        </div>
                        <button className="dev-btn dev-btn--danger" onClick={() => handleDeleteKey(key.id)}>{t.common.delete}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section id="webhooks" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.webhooks.title}</h2>
                <p>{t.webhooks.subtitle}</p>
              </div>

              <div className="dev-api-grid">
                <div className="dev-form">
                  <div className="dev-card">
                    <h3 className="dev-card__title--small">{t.webhooks.verification}</h3>
                    <p className="dev-card__desc--small dev-card__desc--margin">{t.webhooks.verificationDesc}</p>
                    <pre className="dev-code-box__content dev-code-box__content--compact">
                      <code>{`// Verification example\nconst hash = crypto.createHmac('sha256', secret)\n  .update(payload)\n  .digest('hex');`}</code>
                    </pre>
                  </div>

                  <form onSubmit={handleCreateWebhook} className="dev-card dev-form">
                    <div className="portal-mode-tabs portal-mode-tabs--margin" role="tablist">
                        {(["test", "live"] as const).map(mode => (
                          <button key={mode} type="button" className={hookForm.environment === mode ? "is-active" : ""} onClick={() => setHookForm({ ...hookForm, environment: mode })}>
                            {mode === 'test' ? t.common.testMode : t.common.liveMode}
                          </button>
                        ))}
                    </div>
                    <div className="dev-input-group">
                      <label>{t.common.label}</label>
                      <input className="dev-input" value={hookForm.label} onChange={e => setHookForm({...hookForm, label: e.target.value})} placeholder="Production Hook" required />
                    </div>
                    <div className="dev-input-group">
                      <label>{t.webhooks.url}</label>
                      <input className="dev-input" value={hookForm.url} onChange={e => setHookForm({...hookForm, url: e.target.value})} placeholder="https://api.myapp.com/webhook" required />
                    </div>
                    <button type="submit" className="dev-btn dev-btn--primary" disabled={!me?.plan.has_webhooks}>{t.webhooks.add}</button>
                  </form>
                </div>

                {latestWebhookSecret && (
                  <div className="alert alert--warning">
                    <div>
                      <strong>{t.keys.warning}</strong>
                      <code className="alert__code">{latestWebhookSecret}</code>
                    </div>
                    <button className="dev-code-box__copy" onClick={() => handleCopy(latestWebhookSecret, "latest-webhook")}>
                      {copiedId === "latest-webhook" ? t.common.copied : t.common.copy}
                    </button>
                  </div>
                )}

                <div className="dev-resource-list">
                  {webhooks.map(hook => (
                    <div key={hook.id} className="dev-resource-card dev-resource-card--column">
                      <div className="dev-resource-card__header">
                        <div className="dev-resource-card__info">
                          <div className="dev-resource-card__title">{hook.label}</div>
                          <code className="dev-resource-card__url">{hook.url}</code>
                          <div className="dev-resource-card__meta-extra">{t.common.environment}: {hook.environment}</div>
                        </div>
                        <div className="dev-resource-card__actions">
                          <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => handleRotateWebhook(hook.id)}>{t.webhooks.rotate}</button>
                          <button className="dev-btn dev-btn--danger" onClick={() => handleDeleteWebhook(hook.id)}>{t.common.delete}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dev-card">
                <div className="dev-portal__section-header dev-portal__section-header--tight">
                  <h3>{t.common.deliveriesTitle}</h3>
                  <p>{t.common.deliveriesSubtitle}</p>
                </div>
                <div className="dev-resource-list">
                  {deliveries.length === 0 ? (
                    <div className="dev-portal__empty-state dev-portal__empty-state--padding">{t.common.noDeliveries}</div>
                  ) : deliveries.map(delivery => (
                    <div key={delivery.id} className="dev-resource-card delivery-row">
                      <div className="dev-resource-card__info">
                        <div className="dev-resource-card__title">{delivery.event_type}</div>
                        <div className="dev-resource-card__meta">
                          {delivery.status} • {delivery.attempts}/{delivery.max_attempts} {t.common.attempts} • {delivery.last_http_status ?? t.common.noStatus}
                        </div>
                        {delivery.last_error ? <code className="dev-resource-card__error">{delivery.last_error}</code> : null}
                      </div>
                      <span className={`dev-api-badge dev-api-badge--${delivery.status === "delivered" ? "done" : "post"}`}>{delivery.status}</span>
                      <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void handleResendDelivery(delivery.id)}>
                        {t.common.resend}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="mcp" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.mcp.title}</h2>
                <p>{t.mcp.subtitle}</p>
              </div>

              <div className="dev-card dev-card--margin-bottom">
                <p className="dev-card__desc--small" style={{ marginBottom: "1.5rem" }}>
                  {t.mcp.desc}
                </p>
                <div className="dev-api-grid">
                  <div className="dev-form">
                    <h3 className="dev-card__title--small">{t.mcp.runTitle}</h3>
                    <pre className="dev-code-box__content dev-code-box__content--compact" style={{ marginTop: "0.5rem" }}>
                      <code>{`npx -y recv-mcp`}</code>
                    </pre>
                  </div>
                  
                  <div className="dev-form">
                    <h3 className="dev-card__title--small">{t.mcp.configTitle}</h3>
                    <p className="dev-card__desc--small" style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>{t.mcp.configDesc}</p>
                    <pre className="dev-code-box__content dev-code-box__content--compact">
                      <code>{JSON.stringify({
                        mcpServers: {
                          recv: {
                            command: "npx",
                            args: ["-y", "recv-mcp"],
                            env: {
                              RECV_API_KEY: liveKey?.prefix ? `${liveKey.prefix}***` : "live_...",
                              RECV_ACCESS_TOKEN: token ? `${token.substring(0, 10)}...` : "your_token"
                            }
                          }
                        }
                      }, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            <section id="billing" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>{t.billing.title}</h2>
                <p>{t.billing.subtitle}</p>
              </div>

              <div className="dev-card dev-billing-card">
                <div className="dev-form">
                  <h3>{t.billing.upgrade}</h3>
                  <div className="dev-input-group">
                    <label>{t.common.plan}</label>
                    <CustomSelect value={billingPlan} options={PLAN_OPTIONS.map(o => ({...o}))} ariaLabel={t.common.plan} onChange={v => setBillingPlan(v)} />
                  </div>
                  <div className="dev-input-group">
                    <label>{t.billing.durationDays || "Duration (days)"}</label>
                    <input
                      type="number"
                      min="14"
                      className="dev-input"
                      value={billingDays}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setBillingDays(isNaN(val) ? 30 : val);
                      }}
                    />
                    <span className="dev-input-hint" style={{ fontSize: "0.8em", opacity: 0.7, marginTop: "0.25rem" }}>
                      {t.billing.durationDaysHint || "Minimum 14 days"}
                    </span>
                  </div>
                  <div className="dev-input-group">
                    <label>{t.common.network}</label>
                    <CustomSelect value={billingOption} options={NETWORK_OPTIONS} ariaLabel={t.common.network} onChange={setBillingOption} />
                  </div>
                  {(() => {
                    const selectedPlan = ((billingOptions?.plans || me?.plans) as BillingOptionPlan[] | undefined)?.find(p => p.code === billingPlan);
                    if (!selectedPlan) return null;
                    const days = billingDays;
                    if (days < 14) return null;

                    const periodOpt = selectedPlan.periods?.find(p => p.days === days);
                    let finalPrice = 0;
                    if (billingOptions && periodOpt) {
                      finalPrice = Number(periodOpt.price_usd);
                    } else {
                      const dailyRate = Number(selectedPlan.price_usd) / 30;
                      const totalPrice = dailyRate * days;
                      const dPct = me?.workspace?.discount_percent || 0;
                      const dPlan = me?.workspace?.discount_plan_code;
                      const hasD = dPct > 0 && (!dPlan || dPlan === billingPlan);
                      finalPrice = hasD ? totalPrice * (1 - dPct / 100) : totalPrice;
                    }

                    return (
                      <div style={{ fontSize: "0.9em", marginBottom: "1rem", opacity: 0.9 }}>
                        {t.billing.estimatedPrice || "Estimated price"}: <strong>${finalPrice.toFixed(2)} USD</strong> {days !== 30 && `(for ${days} days)`}
                      </div>
                    );
                  })()}
                  <button className="dev-btn dev-btn--primary" onClick={handleUpgrade}>{t.billing.upgrade}</button>
                </div>

                <div className="dev-card__side-col">
                  {checkoutUrl ? (
                    <div className="dev-form">
                      <div className="alert alert--success">{t.common.checkoutGenerated}</div>
                      <code className="dev-input dev-input--readonly-box">{checkoutUrl}</code>
                      <div className="dev-form__actions-row">
                        <button className="dev-btn dev-btn--secondary" onClick={() => handleCopy(checkoutUrl, "billing")}>
                          {copiedId === "billing" ? t.common.copied : t.common.copy}
                        </button>
                        <a 
                          href={checkoutUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="dev-btn dev-btn--primary"
                          onClick={e => {
                            if ((window as any).Telegram?.WebApp?.openLink) {
                              e.preventDefault();
                              (window as any).Telegram.WebApp.openLink(checkoutUrl);
                            }
                          }}
                        >
                          {t.common.payNow}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="dev-form dev-form--centered">
                      <div className="dev-card--note">
                        <p className="dev-card__note-text">{t.billing.businessNote}</p>
                      </div>
                      <Link to="/auth" className="dev-btn dev-btn--secondary dev-btn--large dev-btn--full-width">{t.billing.contactSupport}</Link>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
