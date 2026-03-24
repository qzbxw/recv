import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomSelect } from "../components/CustomSelect";
import {
  createAPIKey,
  createBillingCheckout,
  createWebhookEndpoint,
  deleteAPIKey,
  deleteWebhookEndpoint,
  fetchAPIKeys,
  fetchDeveloperUsage,
  fetchMe,
  fetchWebhookEndpoints,
  getStoredToken,
} from "../lib/api";
import type { APIKey, DeveloperUsageResponse, MeResponse, Network, WebhookEndpoint } from "../lib/types";
import { useUI } from "../lib/ui";

const PLAN_OPTIONS = [
  { value: "dev", label: "Reqst Dev" },
  { value: "enterprise", label: "Reqst Enterprise" },
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

const COPY = {
  ru: {
    title: "Reqst Developers",
    body: "Управляйте API keys, webhooks и Dev/Enterprise-подпиской из отдельного кабинета. Все покупки проходят через обычные Reqst checkout links.",
    authTitle: "Вход нужен для Dev/B2B кабинета",
    authBody: "Авторизуйтесь тем же seller-аккаунтом, чтобы выпускать ключи, подключать webhooks и покупать Reqst Dev или Reqst Enterprise.",
    authAction: "Войти в Reqst",
    back: "Главная",
    console: "Seller Console",
    upgradeTitle: "Включите Dev API или Enterprise",
    upgradeBody: "Пока у аккаунта нет API-доступа. Купите нужный план через Reqst checkout и после оплаты API откроется автоматически.",
    plan: "План",
    network: "Сеть оплаты",
    createCheckout: "Создать checkout",
    usageTitle: "API Usage",
    usageBody: "Текущее состояние квот, rate limits и активных интеграций.",
    keysTitle: "API Keys",
    keysBody: "Полный ключ показывается один раз после создания.",
    hooksTitle: "Webhooks",
    hooksBody: "Reqst подписывает доставку заголовком X-Reqst-Signature.",
    keyLabel: "Название ключа",
    keyPlaceholder: "Production backend",
    createKey: "Создать API key",
    hookLabel: "Название endpoint",
    hookLabelPlaceholder: "Payments webhook",
    hookUrl: "Webhook URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks/reqst",
    createHook: "Добавить webhook",
    remove: "Удалить",
    copy: "Копировать",
    latestSecret: "Новый API ключ",
    latestCheckout: "Последний billing checkout",
    sampleTitle: "Пример запроса",
    sampleBody: "Создание invoice через Reqst Dev API.",
    monthly: "Запросов за месяц",
    rpm: "Текущая минутная нагрузка",
    keyCap: "Активные ключи",
    hookCap: "Webhook endpoints",
    emptyKeys: "Активных API keys пока нет.",
    emptyHooks: "Webhook endpoints пока не добавлены.",
  },
  en: {
    title: "Reqst Developers",
    body: "Manage API keys, webhooks, and Dev or Enterprise billing from a dedicated portal. Every upgrade still goes through normal Reqst checkout links.",
    authTitle: "Sign in to access the Dev/B2B portal",
    authBody: "Use the same seller account to issue API keys, add webhooks, and buy Reqst Dev or Reqst Enterprise.",
    authAction: "Sign in to Reqst",
    back: "Home",
    console: "Seller Console",
    upgradeTitle: "Enable Dev API or Enterprise",
    upgradeBody: "This account does not have API access yet. Buy a plan through a normal Reqst checkout and the API will unlock automatically after payment.",
    plan: "Plan",
    network: "Payment network",
    createCheckout: "Create checkout",
    usageTitle: "API Usage",
    usageBody: "Current quotas, rate limits, and active integrations.",
    keysTitle: "API Keys",
    keysBody: "A full secret is shown only once after creation.",
    hooksTitle: "Webhooks",
    hooksBody: "Reqst signs webhook deliveries with the X-Reqst-Signature header.",
    keyLabel: "Key label",
    keyPlaceholder: "Production backend",
    createKey: "Create API key",
    hookLabel: "Endpoint label",
    hookLabelPlaceholder: "Payments webhook",
    hookUrl: "Webhook URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks/reqst",
    createHook: "Add webhook",
    remove: "Remove",
    copy: "Copy",
    latestSecret: "Newest API key",
    latestCheckout: "Latest billing checkout",
    sampleTitle: "Request sample",
    sampleBody: "Create an invoice through the Reqst Dev API.",
    monthly: "Monthly usage",
    rpm: "Current minute usage",
    keyCap: "Active keys",
    hookCap: "Webhook endpoints",
    emptyKeys: "No active API keys yet.",
    emptyHooks: "No webhook endpoints yet.",
  },
} as const;

export function DeveloperPortalPage() {
  const { language } = useUI();
  const text = COPY[language];
  const [token] = useState(() => getStoredToken());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [usage, setUsage] = useState<DeveloperUsageResponse | null>(null);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(Boolean(token));
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [latestSecret, setLatestSecret] = useState("");
  const [billingPlan, setBillingPlan] = useState<"dev" | "enterprise">(() => {
    const selected = new URLSearchParams(window.location.search).get("plan");
    return selected === "enterprise" ? "enterprise" : "dev";
  });
  const [billingNetwork, setBillingNetwork] = useState<Network>("TRON");
  const [keyLabel, setKeyLabel] = useState("");
  const [hookForm, setHookForm] = useState({ label: "", url: "" });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    void loadPortal(token);
  }, [token]);

  async function loadPortal(sessionToken: string) {
    try {
      setLoading(true);
      const [meResult, usageResult, keyResult, webhookResult] = await Promise.all([
        fetchMe(sessionToken),
        fetchDeveloperUsage(sessionToken).catch(() => null),
        fetchAPIKeys(sessionToken).catch(() => ({ items: [] })),
        fetchWebhookEndpoints(sessionToken).catch(() => ({ items: [] })),
      ]);
      setMe(meResult);
      setUsage(usageResult);
      setAPIKeys(keyResult.items ?? []);
      setWebhooks(webhookResult.items ?? []);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCheckout() {
    if (!token) {
      return;
    }
    try {
      const invoice = await createBillingCheckout(token, {
        payable_network: billingNetwork,
        plan_code: billingPlan,
      });
      setCheckoutUrl(`${window.location.origin}/checkout/${invoice.public_id}`);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateKey(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    try {
      const result = await createAPIKey(token, { label: keyLabel.trim() });
      setLatestSecret(result.secret);
      setKeyLabel("");
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteKey(id: number) {
    if (!token) {
      return;
    }
    try {
      await deleteAPIKey(token, id);
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCreateWebhook(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    try {
      await createWebhookEndpoint(token, {
        label: hookForm.label.trim(),
        url: hookForm.url.trim(),
      });
      setHookForm({ label: "", url: "" });
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleDeleteWebhook(id: number) {
    if (!token) {
      return;
    }
    try {
      await deleteWebhookEndpoint(token, id);
      await loadPortal(token);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const sampleCurl = useMemo(() => {
    const secret = latestSecret || "rk_live_your_key";
    return [
      "curl -X POST https://your-domain.tld/v1/invoices \\",
      `  -H "Authorization: Bearer ${secret}" \\`,
      '  -H "Content-Type: application/json" \\',
      '  -d \'{"title":"Enterprise retainer","base_amount_usd":"2500.00","payable_network":"TRON","expires_in_minutes":60}\'',
    ].join("\n");
  }, [latestSecret]);

  return (
    <main className="developer-portal">
      <div className="developer-portal__glow developer-portal__glow--left" />
      <div className="developer-portal__glow developer-portal__glow--right" />

      <header className="developer-portal__topbar">
        <Link className="lend-brand" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="developer-portal__nav">
          <Link className="lend-nav-link" to="/">
            {text.back}
          </Link>
          <Link className="lend-nav-link" to="/console">
            {text.console}
          </Link>
        </div>
      </header>

      <section className="developer-portal__hero">
        <span className="plan-page__badge">Reqst Dev / Enterprise</span>
        <h1>{text.title}</h1>
        <p>{text.body}</p>
      </section>

      {error ? <div className="alert">{error}</div> : null}
      {loading ? <p className="muted">{language === "ru" ? "Загрузка..." : "Loading..."}</p> : null}

      {!token || !me ? (
        <section className="developer-portal__auth">
          <h2>{text.authTitle}</h2>
          <p>{text.authBody}</p>
          <Link className="lend-primary" to="/auth">
            {text.authAction}
          </Link>
        </section>
      ) : (
        <div className="developer-portal__grid">
          <section className="developer-portal__column">
            {!me.plan.has_api ? (
              <article className="developer-card">
                <h2>{text.upgradeTitle}</h2>
                <p>{text.upgradeBody}</p>
                <div className="developer-form-grid">
                  <label>
                    {text.plan}
                    <CustomSelect
                      value={billingPlan}
                      options={PLAN_OPTIONS.map((option) => ({ ...option }))}
                      ariaLabel={text.plan}
                      onChange={(value) => setBillingPlan(value as "dev" | "enterprise")}
                    />
                  </label>
                  <label>
                    {text.network}
                    <CustomSelect
                      value={billingNetwork}
                      options={NETWORK_OPTIONS}
                      ariaLabel={text.network}
                      onChange={(value) => setBillingNetwork(value)}
                    />
                  </label>
                </div>
                <button type="button" className="lend-primary developer-card__button" onClick={() => void handleCreateCheckout()}>
                  {text.createCheckout}
                </button>
                {checkoutUrl ? (
                  <div className="developer-inline-box">
                    <span>{text.latestCheckout}</span>
                    <div>
                      <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(checkoutUrl)}>
                        {text.copy}
                      </button>
                      <a className="inline-link" href={checkoutUrl} target="_blank" rel="noreferrer">
                        {checkoutUrl}
                      </a>
                    </div>
                  </div>
                ) : null}
              </article>
            ) : (
              <>
                <article className="developer-card">
                  <h2>{text.usageTitle}</h2>
                  <p>{text.usageBody}</p>
                  <div className="developer-metrics">
                    <div className="developer-metric">
                      <span>{text.monthly}</span>
                      <strong>{usage?.usage.monthly_requests ?? 0} / {usage?.usage.monthly_limit ?? me.plan.monthly_cap}</strong>
                    </div>
                    <div className="developer-metric">
                      <span>{text.rpm}</span>
                      <strong>{usage?.usage.requests_this_min ?? 0} / {usage?.usage.minute_limit ?? me.plan.rpm_limit}</strong>
                    </div>
                    <div className="developer-metric">
                      <span>{text.keyCap}</span>
                      <strong>{usage?.usage.active_api_keys ?? apiKeys.length} / {usage?.usage.api_key_limit ?? me.plan.api_key_limit}</strong>
                    </div>
                    <div className="developer-metric">
                      <span>{text.hookCap}</span>
                      <strong>{usage?.usage.webhook_endpoints ?? webhooks.length}</strong>
                    </div>
                  </div>
                </article>

                <article className="developer-card">
                  <h2>{text.keysTitle}</h2>
                  <p>{text.keysBody}</p>
                  <form onSubmit={handleCreateKey} className="developer-form-grid">
                    <label>
                      {text.keyLabel}
                      <input value={keyLabel} placeholder={text.keyPlaceholder} onChange={(event) => setKeyLabel(event.target.value)} />
                    </label>
                    <button type="submit">{text.createKey}</button>
                  </form>
                  {latestSecret ? (
                    <div className="developer-inline-box">
                      <span>{text.latestSecret}</span>
                      <div>
                        <code>{latestSecret}</code>
                        <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(latestSecret)}>
                          {text.copy}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <div className="developer-list">
                    {apiKeys.map((key) => (
                      <article key={key.id} className="developer-list-item">
                        <div>
                          <strong>{key.label}</strong>
                          <p>{key.prefix} · {key.scopes.join(", ")}</p>
                        </div>
                        <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteKey(key.id)}>
                          {text.remove}
                        </button>
                      </article>
                    ))}
                    {!apiKeys.length ? <p className="muted">{text.emptyKeys}</p> : null}
                  </div>
                </article>
              </>
            )}
          </section>

          <section className="developer-portal__column">
            {me.plan.has_webhooks ? (
              <article className="developer-card">
                <h2>{text.hooksTitle}</h2>
                <p>{text.hooksBody}</p>
                <form onSubmit={handleCreateWebhook} className="developer-form-grid developer-form-grid--stacked">
                  <label>
                    {text.hookLabel}
                    <input
                      value={hookForm.label}
                      placeholder={text.hookLabelPlaceholder}
                      onChange={(event) => setHookForm((current) => ({ ...current, label: event.target.value }))}
                    />
                  </label>
                  <label>
                    {text.hookUrl}
                    <input
                      value={hookForm.url}
                      placeholder={text.hookUrlPlaceholder}
                      onChange={(event) => setHookForm((current) => ({ ...current, url: event.target.value }))}
                    />
                  </label>
                  <button type="submit">{text.createHook}</button>
                </form>
                <div className="developer-list">
                  {webhooks.map((hook) => (
                    <article key={hook.id} className="developer-list-item developer-list-item--stacked">
                      <div>
                        <strong>{hook.label}</strong>
                        <p>{hook.url}</p>
                        <small>{hook.secret}</small>
                      </div>
                      <button type="button" className="ghost-button compact-button" onClick={() => void handleDeleteWebhook(hook.id)}>
                        {text.remove}
                      </button>
                    </article>
                  ))}
                  {!webhooks.length ? <p className="muted">{text.emptyHooks}</p> : null}
                </div>
              </article>
            ) : null}

            <article className="developer-card">
              <h2>{text.sampleTitle}</h2>
              <p>{text.sampleBody}</p>
              <pre className="developer-code-block"><code>{sampleCurl}</code></pre>
            </article>
          </section>
        </div>
      )}
    </main>
  );
}
