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
  simulateTestPayment,
} from "../lib/api";
import { ApiError, formatApiError, mapApiError } from "../lib/errors";
import { buildCheckoutUrl } from "../lib/routing";
import { formatInvoiceStatus } from "../lib/status";
import type { APIKey, DeveloperUsageResponse, Invoice, MeResponse, Network, WebhookDelivery, WebhookEndpoint, Environment } from "../lib/types";
import { useUI } from "../lib/ui";

const PLAN_OPTIONS = [
  { value: "merchant", label: "Merchant" },
  { value: "developer", label: "Developer" },
  { value: "business", label: "Business" },
] as const;

const NETWORK_OPTIONS: Array<{ value: Network; label: string }> = [
  { value: "TRON", label: "TRON" },
  { value: "SOLANA", label: "SOLANA" },
  { value: "BASE", label: "BASE" },
  { value: "ARBITRUM", label: "ARBITRUM" },
  { value: "BSC", label: "BSC" },
  { value: "EVM", label: "ETH" },
  { value: "TON", label: "TON" },
];

const DEFAULT_SCOPES = ["invoices:read", "invoices:write"];

const COPY = {
  ru: {
    hero: {
      kicker: "Developer Platform",
      title: "Стройте будущее платежей",
      subtitle: "Профессиональные инструменты для интеграции криптоплатежей. API v1 Beta для автоматизации вашего бизнеса.",
    },
    nav: {
      docs: "Документация",
      dashboard: "Дашборд",
      keys: "API Ключи",
      webhooks: "Вебхуки",
      billing: "Биллинг",
    },
    dashboard: {
      title: "Состояние системы",
      usage: "Использование API",
      limit: "Лимит",
      plan: "Текущий план",
      status: "Статус доступа",
      active: "Активен",
      inactive: "Требует активации",
    },
    keys: {
      title: "API Ключи",
      subtitle: "Ключи для аутентификации ваших запросов. Храните их в секрете.",
      create: "Создать ключ",
      label: "Название ключа",
      placeholder: "Production Backend",
      scopes: "Права доступа",
      warning: "Секретный ключ отображается только один раз!",
    },
    webhooks: {
      title: "Вебхуки",
      subtitle: "События в реальном времени. Мы отправим POST запрос на ваш URL.",
      add: "Добавить эндпоинт",
      url: "URL эндпоинта",
      secret: "Секрет подписи",
      verification: "Проверка подписи",
      verificationDesc: "Каждый вебхук содержит заголовок X-Reqst-Signature. Используйте HMAC SHA-256 для проверки подлинности.",
    },
    billing: {
      title: "Тарифные планы",
      subtitle: "Выберите план, соответствующий вашим масштабам.",
      upgrade: "Обновить план",
      current: "Ваш текущий тариф",
      enterpriseNote: "Нужны индивидуальные условия? Enterprise план настраивается под ваши задачи.",
      contactSupport: "Узнать про Enterprise",
    },
    api: {
      title: "Справочник API v1 Beta",
      subtitle: "Базовый URL для всех запросов",
      authTitle: "Аутентификация",
      authDesc: "Все запросы должны содержать заголовок Authorization: Bearer <API_KEY>.",
      rateLimitTitle: "Лимиты запросов",
      rateLimitDesc: "Мы используем стандартные заголовки X-RateLimit для контроля нагрузки.",
      params: "Параметры",
      response: "Пример ответа",
    },
    common: {
      copy: "Копировать",
      copied: "Скопировано",
      delete: "Удалить",
      loading: "Загрузка...",
      error: "Ошибка",
      save: "Сохранить",
      testMode: "Тест",
      liveMode: "Live",
    }
  },
  en: {
    hero: {
      kicker: "Developer Platform",
      title: "Build the future of payments",
      subtitle: "Professional tools for integrating crypto payments. API v1 Beta to automate your business.",
    },
    nav: {
      docs: "Documentation",
      dashboard: "Dashboard",
      keys: "API Keys",
      webhooks: "Webhooks",
      billing: "Billing",
    },
    dashboard: {
      title: "System Status",
      usage: "API Usage",
      limit: "Limit",
      plan: "Current Plan",
      status: "Access Status",
      active: "Active",
      inactive: "Requires Activation",
    },
    keys: {
      title: "API Keys",
      subtitle: "Keys to authenticate your requests. Keep them secure.",
      create: "Create Key",
      label: "Key Label",
      placeholder: "Production Backend",
      scopes: "Permissions",
      warning: "The secret key is shown only once!",
    },
    webhooks: {
      title: "Webhooks",
      subtitle: "Real-time events. We'll send a POST request to your URL.",
      add: "Add Endpoint",
      url: "Endpoint URL",
      secret: "Signing Secret",
      verification: "Signature Verification",
      verificationDesc: "Each webhook contains an X-Reqst-Signature header. Use HMAC SHA-256 to verify the payload.",
    },
    billing: {
      title: "Subscription Plans",
      subtitle: "Choose a plan that fits your scale.",
      upgrade: "Upgrade Plan",
      current: "Your current plan",
      enterpriseNote: "Looking for something custom? Enterprise plans are tailored to your needs.",
      contactSupport: "Learn about Enterprise",
    },
    api: {
      title: "API Reference v1 Beta",
      subtitle: "Base URL for all requests",
      authTitle: "Authentication",
      authDesc: "All requests must include the Authorization: Bearer <API_KEY> header.",
      rateLimitTitle: "Rate Limiting",
      rateLimitDesc: "We use standard X-RateLimit headers to control traffic load.",
      params: "Parameters",
      response: "Response Example",
    },
    common: {
      copy: "Copy",
      copied: "Copied",
      delete: "Delete",
      loading: "Loading...",
      error: "Error",
      save: "Save",
      testMode: "Test",
      liveMode: "Live",
    }
  }
} as const;

function formatDate(value: string | null | undefined, language: "ru" | "en") {
  if (!value) return language === "ru" ? "Никогда" : "Never";
  const date = new Date(value);
  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "en-US", {
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
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("hero");

  // Form states
  const [latestSecret, setLatestSecret] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [billingPlan, setBillingPlan] = useState<string>("developer");
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");
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
      const [meRes, usageRes, keysRes, hooksRes, deliveriesRes] = await Promise.all([
        fetchMe(sessionToken),
        fetchDeveloperUsage(sessionToken).catch(() => null),
        fetchAPIKeys(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookDeliveries(sessionToken).catch(() => ({ items: [] })),
      ]);
      setMe(meRes);
      setUsage(usageRes);
      setAPIKeys(keysRes.items ?? []);
      setWebhooks(hooksRes.items ?? []);
      setDeliveries(deliveriesRes.items ?? []);
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
      await createWebhookEndpoint(token, { label: hookForm.label, url: hookForm.url, environment: hookForm.environment });
      setHookForm({ label: "", url: "", environment: "test" });
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
    try {
      const invoice = await createBillingCheckout(token, { payable_network: billingNetwork, plan_code: billingPlan });
      setCheckoutUrl(buildCheckoutUrl(invoice.public_id));
    } catch (err) { setError(formatApiError(err)); }
  };

  const testKey = apiKeys.find(key => key.environment === "test");
  const liveKey = apiKeys.find(key => key.environment === "live");

  async function handleCreateSampleInvoice() {
    const secret = sampleSecret;
    if (!secret) {
      setError(language === "ru" ? "Создайте тестовый ключ и сохраните секрет для симулятора." : "Create a test key and keep the secret visible for the simulator.");
      return;
    }
    setSampleBusy(true);
    try {
      const invoice = await createDeveloperInvoice(secret, {
        title: "Reqst API test invoice",
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
      title: language === "ru" ? "Аккаунт и лимиты" : "Account & Limits",
      desc: language === "ru" ? "Возвращает информацию о текущем API ключе, тарифном плане и остатке месячной квоты." : "Returns information about the current API key, plan, and monthly quota.",
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
      title: language === "ru" ? "Список инвойсов" : "List Invoices",
      desc: language === "ru" ? "Возвращает список инвойсов с поддержкой пагинации. Сортировка по дате создания (новые сверху)." : "Returns a list of invoices with pagination. Sorted by creation date (newest first).",
      params: [
        { name: "page", type: "int", desc: language === "ru" ? "Номер страницы (по умолчанию 1)" : "Page number (default 1)" },
        { name: "page_size", type: "int", desc: language === "ru" ? "Количество элементов (default 20, max 100)" : "Items per page (default 20, max 100)" }
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
      title: language === "ru" ? "Создать инвойс" : "Create Invoice",
      desc: language === "ru" ? "Создает новый счет на оплату. Возвращает объект инвойса с checkout_url для пользователя." : "Creates a new payment invoice. Returns an invoice object with a checkout_url for the user.",
      params: [
        { name: "title", type: "string", desc: language === "ru" ? "Заголовок счета (виден клиенту)" : "Invoice title (visible to client)" },
        { name: "base_amount_usd", type: "decimal", desc: language === "ru" ? "Сумма в USD (например, '25.00')" : "Amount in USD (e.g., '25.00')" },
        { name: "payable_network", type: "string", desc: "TRON, SOLANA, BASE, TON, ETH, etc." },
        { name: "expires_in_minutes", type: "int", desc: language === "ru" ? "Время жизни (default 30, max 1440)" : "Expiration time (default 30, max 1440)" }
      ],
      response: {
        id: 1842,
        public_id: "RQST-9N2QK7",
        title: "Product Subscription",
        status: "awaiting_payment",
        checkout_url: "https://reqst.xyz/app/checkout/RQST-9N2QK7",
        base_amount_usd: "25.00",
        payable_amount: "25.000000",
        payable_network: "TRON",
        environment: "live"
      }
    },
    {
      method: "GET",
      path: "/invoices/:id",
      title: language === "ru" ? "Детали инвойса" : "Invoice Details",
      desc: language === "ru" ? "Получение полной информации об инвойсе по его системному ID." : "Get full invoice information by its system ID.",
      params: [
        { name: "id", type: "int", desc: language === "ru" ? "Системный ID инвойса" : "System invoice ID" }
      ],
      response: { id: 1842, public_id: "RQST-9N2QK7", status: "paid", tx_hash: "0x...", environment: "live" }
    },
    {
      method: "POST",
      path: "/invoices/:id/cancel",
      title: language === "ru" ? "Отменить инвойс" : "Cancel Invoice",
      desc: language === "ru" ? "Переводит инвойс в статус 'expired'. Можно отменить только неоплаченные счета." : "Sets invoice status to 'expired'. Only unpaid invoices can be canceled.",
      params: [
        { name: "id", type: "int", desc: language === "ru" ? "Системный ID инвойса" : "System invoice ID" }
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
          <Link className="dev-portal__brand" to="/">reqst</Link>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link className="dev-btn dev-btn--primary" to="/console">{language === "ru" ? "Консоль" : "Console"}</Link>
          </div>
        </header>

        <div className="dev-portal__main">
          <nav className="dev-portal__nav portal-animate-in" style={{ animationDelay: "0.1s" }}>
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">Platform</span>
              <a href="#hero" className={`dev-portal__nav-link ${activeSection === "hero" ? "is-active" : ""}`}>{t.nav.docs}</a>
              <a href="#dashboard" className={`dev-portal__nav-link ${activeSection === "dashboard" ? "is-active" : ""}`}>{t.nav.dashboard}</a>
            </div>
            <div className="dev-portal__nav-group">
              <span className="dev-portal__nav-label">Management</span>
              <a href="#keys" className={`dev-portal__nav-link ${activeSection === "keys" ? "is-active" : ""}`}>{t.nav.keys}</a>
              <a href="#webhooks" className={`dev-portal__nav-link ${activeSection === "webhooks" ? "is-active" : ""}`}>{t.nav.webhooks}</a>
              <a href="#billing" className={`dev-portal__nav-link ${activeSection === "billing" ? "is-active" : ""}`}>{t.nav.billing}</a>
            </div>
          </nav>

          <div className="dev-portal__body">
            {error && <div className="alert portal-animate-in">{error}</div>}

            <section id="hero" className="dev-portal__hero portal-animate-in">
              <span className="dev-api-badge dev-api-badge--post" style={{ width: "fit-content" }}>{t.hero.kicker}</span>
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
                  <div className="dev-widget__meta">{me?.plan.has_api ? t.dashboard.active : t.dashboard.inactive}</div>
                </div>
                <div className="dev-card dev-widget">
                  <span className="dev-widget__label">{t.dashboard.usage}</span>
                  <div className="dev-widget__value">{usage?.usage.monthly_requests ?? 0} <small style={{fontSize: "1rem", opacity: 0.5}}>/ {usage?.usage.monthly_limit || "∞"}</small></div>
                  <div className="dev-usage-bar">
                    <div className="dev-usage-fill" style={{ width: `${Math.min(100, ((usage?.usage.monthly_requests ?? 0) / (usage?.usage.monthly_limit || 1)) * 100)}%` }} />
                  </div>
                </div>
                <div className="dev-card dev-widget">
                  <span className="dev-widget__label">RPM Limit</span>
                  <div className="dev-widget__value">{usage?.usage.minute_limit ?? 0}</div>
                  <div className="dev-widget__meta">{t.dashboard.limit} per minute</div>
                </div>
              </div>
            </section>

            <section id="quickstart" className="dev-portal__section portal-animate-in">
              <div className="dev-portal__section-header">
                <h2>Quickstart</h2>
                <p>One flow: test key, test invoice, simulation, webhook, live.</p>
              </div>
              <div className="portal-quickstart">
                {[
                  { done: Boolean(testKey || sampleSecret), title: language === "ru" ? "Тестовый ключ" : "Test key", body: testKey?.prefix ?? "rqst_test_..." },
                  { done: Boolean(sampleInvoice), title: language === "ru" ? "Тестовый инвойс" : "Test invoice", body: sampleInvoice?.public_id ?? "POST /v1/invoices" },
                  { done: sampleInvoice?.status === "paid", title: language === "ru" ? "Симуляция" : "Simulate", body: sampleInvoice ? formatInvoiceStatus(sampleInvoice.status, language) : "simulate-payment" },
                  { done: webhooks.length > 0, title: language === "ru" ? "Вебхук" : "Webhook", body: webhooks[0]?.url ?? "https://..." },
                  { done: Boolean(liveKey), title: "Live", body: liveKey?.prefix ?? "rqst_live_..." },
                ].map((step) => (
                  <div key={step.title} className="portal-quickstart__step">
                    <span className={`dev-api-badge dev-api-badge--${step.done ? "done" : "post"}`}>{step.done ? "done" : "next"}</span>
                    <h3 style={{ margin: "0.75rem 0 0.35rem", fontSize: "1rem" }}>{step.title}</h3>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem", overflowWrap: "anywhere" }}>{step.body}</p>
                  </div>
                ))}
              </div>
              <div className="dev-card">
                <div className="dev-portal__section-header" style={{ marginBottom: "1rem" }}>
                  <h3>Sample invoice simulator</h3>
                  <p>{language === "ru" ? "Использует секрет rqst_test_, показанный при создании ключа. Секрет не сохраняется сервером в открытом виде." : "Uses the rqst_test_ secret shown when you create a key. The server does not reveal it again."}</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button className="dev-btn dev-btn--primary" disabled={sampleBusy || !sampleSecret} onClick={() => void handleCreateSampleInvoice()}>
                    {language === "ru" ? "Создать test invoice" : "Create test invoice"}
                  </button>
                  <button className="dev-btn dev-btn--secondary" disabled={sampleBusy || !sampleInvoice || sampleInvoice.status === "paid"} onClick={() => void handleSimulatePayment()}>
                    {language === "ru" ? "Симулировать оплату" : "Simulate payment"}
                  </button>
                  {sampleInvoice ? <a className="dev-btn dev-btn--secondary" href={buildCheckoutUrl(sampleInvoice.public_id)} target="_blank" rel="noreferrer">{language === "ru" ? "Открыть checkout" : "Open checkout"}</a> : null}
                </div>
                {sampleInvoice ? (
                  <div className="dev-resource-card" style={{ marginTop: "1rem" }}>
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
                  <div className="dev-card" style={{ marginBottom: "1rem" }}>
                    <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{t.api.authTitle}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{t.api.authDesc}</p>
                  </div>

                  {endpoints.map((ep, idx) => (
                    <div key={ep.path} className={`dev-api-method ${selectedMethod === idx ? "is-selected" : ""}`} onClick={() => setSelectedMethod(idx)} style={{ cursor: "pointer", padding: "1rem", borderRadius: "16px", background: selectedMethod === idx ? "rgba(255,255,255,0.04)" : "transparent", transition: "all 0.2s" }}>
                      <div className="dev-api-method__head">
                        <span className={`dev-api-badge dev-api-badge--${ep.method.toLowerCase()}`}>{ep.method}</span>
                        <code className="dev-api-path">{ep.path}</code>
                      </div>
                      <h3 style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>{ep.title}</h3>
                      <p style={{ fontSize: "0.9rem" }}>{ep.desc}</p>
                      
                      {selectedMethod === idx && ep.params.length > 0 && (
                        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--line)", paddingTop: "1rem" }}>
                          <span className="dev-widget__label" style={{ marginBottom: "0.5rem" }}>{t.api.params}</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {ep.params.map(p => (
                              <div key={p.name} style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
                                <code style={{ color: "var(--accent)" }}>{p.name}</code>
                                <span style={{ opacity: 0.5 }}>{p.type}</span>
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
                      <span className={`dev-code-box__tab ${apiView === "params" ? "is-active" : ""}`} onClick={() => setApiView("params")}>Request (cURL)</span>
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
                <div className="dev-portal__section-header" style={{ marginBottom: "1rem" }}>
                  <h3>API Error Guide</h3>
                  <p>Concrete fixes for common response statuses.</p>
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
                  <h3>Sign in required</h3>
                  <p>Authentication is required to manage API keys.</p>
                  <Link to="/auth" className="dev-btn dev-btn--primary">Sign In</Link>
                </div>
              ) : (
                <div className="dev-card">
                  <form onSubmit={handleCreateKey} className="dev-form">
                    <div className="portal-mode-tabs" role="tablist" aria-label="API key mode">
                      {(["test", "live"] as const).map(mode => (
                        <button key={mode} type="button" className={keyEnvironment === mode ? "is-active" : ""} onClick={() => setKeyEnvironment(mode)}>
                          {mode === 'test' ? t.common.testMode : t.common.liveMode}
                        </button>
                      ))}
                    </div>
                    <div className="dev-api-grid" style={{ gridTemplateColumns: "1fr auto", alignItems: "flex-end" }}>
                      <div className="dev-input-group">
                        <label>{t.keys.label}</label>
                        <input className="dev-input" value={keyLabel} onChange={e => setKeyLabel(e.target.value)} placeholder={t.keys.placeholder} required />
                      </div>
                      <button type="submit" className="dev-btn dev-btn--primary" disabled={!me?.plan.has_api}>{t.keys.create}</button>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      {["invoices:read", "invoices:write"].map(s => (
                        <label key={s} className={`dev-scope-pill ${keyScopes.includes(s) ? "is-active" : ""}`} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <input type="checkbox" checked={keyScopes.includes(s)} onChange={() => toggleScope(s)} style={{ width: "auto" }} />
                          {s}
                        </label>
                      ))}
                    </div>
                  </form>

                  {latestSecret && (
                    <div className="alert alert--success" style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <small style={{ display: "block", marginBottom: "0.25rem" }}>{t.keys.warning}</small>
                        <code style={{ fontSize: "1.1rem" }}>{latestSecret}</code>
                      </div>
                      <button className="dev-code-box__copy" onClick={() => handleCopy(latestSecret, "latest")}>
                        {copiedId === "latest" ? t.common.copied : t.common.copy}
                      </button>
                    </div>
                  )}

                  <div className="dev-resource-list" style={{ marginTop: "2rem" }}>
                    {apiKeys.map(key => (
                      <div key={key.id} className="dev-resource-card">
                        <div className="dev-resource-card__info">
                          <div className="dev-resource-card__title">{key.label}</div>
                          <div className="dev-resource-card__meta">
                            <code>{key.prefix}***</code> • {key.environment} • {formatDate(key.created_at, language)}
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
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
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>{t.webhooks.verification}</h3>
                    <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "1rem" }}>{t.webhooks.verificationDesc}</p>
                    <pre className="dev-code-box__content" style={{ borderRadius: "12px", fontSize: "0.75rem" }}>
                      <code>{`// Verification example\nconst hash = crypto.createHmac('sha256', secret)\n  .update(payload)\n  .digest('hex');`}</code>
                    </pre>
                  </div>

                  <form onSubmit={handleCreateWebhook} className="dev-card dev-form">
                    <div className="portal-mode-tabs" role="tablist" style={{ marginBottom: "1rem" }}>
                        {(["test", "live"] as const).map(mode => (
                          <button key={mode} type="button" className={hookForm.environment === mode ? "is-active" : ""} onClick={() => setHookForm({ ...hookForm, environment: mode })}>
                            {mode === 'test' ? t.common.testMode : t.common.liveMode}
                          </button>
                        ))}
                    </div>
                    <div className="dev-input-group">
                      <label>{language === "ru" ? "Название" : "Label"}</label>
                      <input className="dev-input" value={hookForm.label} onChange={e => setHookForm({...hookForm, label: e.target.value})} placeholder="Production Hook" required />
                    </div>
                    <div className="dev-input-group">
                      <label>{t.webhooks.url}</label>
                      <input className="dev-input" value={hookForm.url} onChange={e => setHookForm({...hookForm, url: e.target.value})} placeholder="https://api.myapp.com/webhook" required />
                    </div>
                    <button type="submit" className="dev-btn dev-btn--primary" disabled={!me?.plan.has_webhooks}>{t.webhooks.add}</button>
                  </form>
                </div>

                <div className="dev-resource-list">
                  {webhooks.map(hook => (
                    <div key={hook.id} className="dev-resource-card" style={{ flexDirection: "column", alignItems: "stretch", gap: "1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div className="dev-resource-card__info">
                          <div className="dev-resource-card__title">{hook.label}</div>
                          <code style={{ opacity: 0.6, fontSize: "0.85rem" }}>{hook.url}</code>
                          <div style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.25rem" }}>Environment: {hook.environment}</div>
                        </div>
                        <button className="dev-btn dev-btn--danger" onClick={() => handleDeleteWebhook(hook.id)}>{t.common.delete}</button>
                      </div>
                      <div className="dev-card" style={{ padding: "0.75rem 1rem", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", opacity: 0.5, display: "block" }}>{t.webhooks.secret}</span>
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
              <div className="dev-card">
                <div className="dev-portal__section-header" style={{ marginBottom: "1rem" }}>
                  <h3>Delivery Logs</h3>
                  <p>Recent webhook attempts, statuses, and errors.</p>
                </div>
                <div className="dev-resource-list">
                  {deliveries.length === 0 ? (
                    <div style={{ color: "var(--muted)", padding: "1rem" }}>No deliveries yet.</div>
                  ) : deliveries.map(delivery => (
                    <div key={delivery.id} className="dev-resource-card delivery-row">
                      <div className="dev-resource-card__info">
                        <div className="dev-resource-card__title">{delivery.event_type}</div>
                        <div className="dev-resource-card__meta">
                          {delivery.status} • {delivery.attempts}/{delivery.max_attempts} attempts • {delivery.last_http_status ?? "no status"}
                        </div>
                        {delivery.last_error ? <code style={{ color: "var(--danger)", fontSize: "0.78rem" }}>{delivery.last_error}</code> : null}
                      </div>
                      <span className={`dev-api-badge dev-api-badge--${delivery.status === "delivered" ? "done" : "post"}`}>{delivery.status}</span>
                      <button className="dev-btn dev-btn--secondary dev-btn--compact" onClick={() => void handleResendDelivery(delivery.id)}>
                        {language === "ru" ? "Повторить" : "Resend"}
                      </button>
                    </div>
                  ))}
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
                    <label>Plan</label>
                    <CustomSelect value={billingPlan} options={PLAN_OPTIONS.map(o => ({...o}))} ariaLabel="Plan" onChange={v => setBillingPlan(v)} />
                  </div>
                  <div className="dev-input-group">
                    <label>Network</label>
                    <CustomSelect value={billingNetwork} options={NETWORK_OPTIONS} ariaLabel="Network" onChange={v => setBillingNetwork(v as any)} />
                  </div>
                  <button className="dev-btn dev-btn--primary" onClick={handleUpgrade}>{t.billing.upgrade}</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", borderLeft: "1px solid var(--line)", paddingLeft: "2rem", gap: "1.5rem" }}>
                  {checkoutUrl ? (
                    <div className="dev-form">
                      <div className="alert alert--success">Checkout Link Generated!</div>
                      <code className="dev-input" style={{ fontSize: "0.8rem" }}>{checkoutUrl}</code>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <button className="dev-btn dev-btn--secondary" onClick={() => handleCopy(checkoutUrl, "billing")}>
                          {copiedId === "billing" ? t.common.copied : t.common.copy}
                        </button>
                        <a href={checkoutUrl} target="_blank" rel="noreferrer" className="dev-btn dev-btn--primary">Pay Now</a>
                      </div>
                    </div>
                  ) : (
                    <div className="dev-form" style={{ textAlign: "center", gap: "1rem" }}>
                      <div style={{ padding: "1rem", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--line)" }}>
                        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>{t.billing.enterpriseNote}</p>
                      </div>
                      <Link to="/enterprise" className="dev-btn dev-btn--secondary" style={{ width: "100%" }}>{t.billing.contactSupport}</Link>
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
