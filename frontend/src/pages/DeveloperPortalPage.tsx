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
    title: "Разработчикам",
    body: "Инструменты интеграции: управление API-ключами и настройка вебхуков.",
    portalNav: {
      access: "Статус",
      security: "Ключи",
      delivery: "Webhooks",
      usage: "Лимиты",
    },
    authTitle: "Вход",
    authBody: "Используйте основной аккаунт для выпуска ключей.",
    authAction: "Войти",
    back: "Главная",
    console: "Консоль",
    upgradeTitle: "Активация API-доступа",
    upgradeBody: "Для работы с API необходимо выбрать один из поддерживаемых тарифов.",
    plan: "План",
    network: "Сеть оплаты",
    createCheckout: "Оплатить",
    usageTitle: "Использование квот",
    usageBody: "Мониторинг текущего потребления и лимитов API.",
    keysTitle: "API-ключи",
    keysBody: "Ваш секретный ключ будет показан только один раз при создании. Пожалуйста, сохраните его в надежном месте.",
    hooksTitle: "Webhook-эндпоинты",
    hooksBody: "Все события подписываются заголовком X-Reqst-Signature для проверки подлинности на вашей стороне.",
    keyLabel: "Описание ключа",
    keyPlaceholder: "Например: Production Backend",
    createKey: "Выпустить ключ",
    hookLabel: "Описание",
    hookLabelPlaceholder: "Обработчик платежей",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://api.example.com/webhooks",
    createHook: "Добавить эндпоинт",
    remove: "Удалить",
    copy: "Копировать",
    latestSecret: "Ваш новый API-ключ",
    latestCheckout: "Ссылка на оплату тарифа",
    sampleTitle: "Пример запроса",
    sampleBody: "Создание нового инвойса через POST-запрос.",
    monthly: "Запросов в месяц",
    rpm: "Запросов в минуту (RPM)",
    keyCap: "Всего ключей",
    hookCap: "Активных вебхуков",
    emptyKeys: "У вас пока нет активных API-ключей.",
    emptyHooks: "Webhook-эндпоинты еще не настроены.",
    heroCards: [],
    railTitle: "Возможности",
    currentPlan: "План",
    currentStatus: "Статус",
    accessEnabled: "Доступ открыт",
    rails: [
      "Активация планов через платеж.",
      "Выпуск API-ключей.",
      "Настройка Webhooks.",
      "Мониторинг квот.",
    ],
    lockedTitle: "Портал",
    lockedBody: "Авторизуйтесь для управления ключами.",
    summaryTitle: "Текущий статус",
    summaryFallback: "API недоступно",
    plansTitle: "Планы",
    plansBody: "Выберите подходящий уровень доступа.",
    plans: [
      {
        name: "Reqst Dev",
        badge: "Продукт",
        body: "Стандартный набор инструментов для интеграции.",
      },
      {
        name: "Reqst Enterprise",
        badge: "B2B",
        body: "Максимальная производительность и приоритетная очередь событий.",
      },
    ],
    billingTitle: "Биллинг",
    billingBody: "Сформируйте инвойс для активации или продления доступа.",
    securityTitle: "Безопасность",
    securityBody: "Управление ключами доступа к API.",
    deliveryTitle: "События",
    deliveryBody: "Настройка доставки уведомлений о платежах.",
    sampleCardTitle: "Quick Start",
    sampleCardBody: "Пример POST-запроса.",
  },
  en: {
    title: "Developer Portal",
    body: "Integration toolkit: manage API keys and configure webhooks.",
    portalNav: {
      access: "Access",
      security: "Keys",
      delivery: "Webhooks",
      usage: "Limits",
    },
    authTitle: "Sign in",
    authBody: "Use your seller account to issue keys.",
    authAction: "Login",
    back: "Home",
    console: "Console",
    upgradeTitle: "Enable API Access",
    upgradeBody: "Choose a plan to unlock programmatic access to Reqst.",
    plan: "Plan",
    network: "Network",
    createCheckout: "Upgrade",
    usageTitle: "API Usage",
    usageBody: "Real-time monitoring of your quotas and rate limits.",
    keysTitle: "API Keys",
    keysBody: "Your secret key is shown only once upon creation. Secure it immediately.",
    hooksTitle: "Webhooks",
    hooksBody: "Payloads are signed with an X-Reqst-Signature header for security.",
    keyLabel: "Key Label",
    keyPlaceholder: "Production",
    createKey: "Issue Key",
    hookLabel: "Label",
    hookLabelPlaceholder: "Payments hook",
    hookUrl: "URL",
    hookUrlPlaceholder: "https://app.example.com/webhooks",
    createHook: "Add hook",
    remove: "Remove",
    copy: "Copy",
    latestSecret: "Your New API Key",
    latestCheckout: "Billing Link",
    sampleTitle: "Request sample",
    sampleBody: "Create an invoice via API.",
    monthly: "Monthly Requests",
    rpm: "Requests Per Minute (RPM)",
    keyCap: "API Keys",
    hookCap: "Webhook Endpoints",
    emptyKeys: "No active API keys found.",
    emptyHooks: "No webhook endpoints configured.",
    heroCards: [],
    railTitle: "Features",
    currentPlan: "Plan",
    currentStatus: "Status",
    accessEnabled: "Active",
    rails: [
      "Self-serve plan activation.",
      "API key issuance.",
      "Webhook delivery.",
      "Real-time usage tracking.",
    ],
    lockedTitle: "Portal",
    lockedBody: "Sign in to manage credentials.",
    summaryTitle: "Access Status",
    summaryFallback: "API Disabled",
    plansTitle: "Plans",
    plansBody: "Select your integration layer.",
    plans: [
      {
        name: "Reqst Dev",
        badge: "Product",
        body: "API keys and webhooks for teams.",
      },
      {
        name: "Reqst Enterprise",
        badge: "B2B",
        body: "High limits and priority delivery.",
      },
    ],
    billingTitle: "Billing",
    billingBody: "Activate your plan.",
    securityTitle: "Security",
    securityBody: "API access keys.",
    deliveryTitle: "Events",
    deliveryBody: "Webhook endpoint management.",
    sampleCardTitle: "Quick Start",
    sampleCardBody: "API request example.",
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
      "curl -X POST https://api.reqst.xyz/v1/invoices \\",
      `  -H "Authorization: Bearer ${secret}" \\`,
      '  -H "Content-Type: application/json" \\',
      '  -d \'{"title":"Product Subscription","base_amount_usd":"25.00","payable_network":"TRON"}\'',
    ].join("\n");
  }, [latestSecret]);
  const selectedPlanMeta = text.plans.find((plan) => plan.name.toLowerCase().includes(billingPlan));

  return (
    <main className="lend-page">
      <div className="lend-backdrop lend-backdrop--grid" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--left" />
      <div className="lend-backdrop lend-backdrop--glow lend-backdrop--right" />

      <div className="lend-shell">
        <header className="lend-topbar">
          <div className="lend-topbar-main">
            <Link className="lend-brand" to="/">
              <strong>reqst</strong>
            </Link>
            <div className="lend-topbar-actions">
              <Link className="lend-secondary" to="/">{text.back}</Link>
              <Link className="lend-primary" to="/console">{text.console}</Link>
            </div>
          </div>
        </header>

        <section className="lend-hero page-section-offset">
          <div className="lend-hero-copy">
            <span className="lend-section-kicker">Integration</span>
            <h1>{text.title}</h1>
            <p>{text.body}</p>

            <div className="lend-cta-row" aria-label="portal sections">
              <span className="lend-chip">{text.portalNav.access}</span>
              <span className="lend-chip">{text.portalNav.security}</span>
              <span className="lend-chip">{text.portalNav.delivery}</span>
              <span className="lend-chip">{text.portalNav.usage}</span>
            </div>
          </div>

          <aside className="lend-hero-side">
            <article className="lend-card">
              <span className="lend-section-kicker">{text.plansTitle}</span>
              <h3 style={{ marginTop: '1rem' }}>{text.plansBody}</h3>
              <div className="lend-panel-grid" style={{ marginTop: '1.5rem' }}>
                {text.plans.map((plan) => (
                  <article key={plan.name} className="lend-stack-card" style={{ 
                    borderColor: selectedPlanMeta?.name === plan.name ? 'rgba(255, 148, 77, 0.4)' : undefined,
                    background: selectedPlanMeta?.name === plan.name ? 'rgba(255, 148, 77, 0.08)' : undefined
                  }}>
                    <span style={{ fontSize: '0.65rem' }}>{plan.badge}</span>
                    <strong>{plan.name}</strong>
                    <p style={{ fontSize: '0.85rem' }}>{plan.body}</p>
                  </article>
                ))}
              </div>
            </article>
          </aside>
        </section>

        {error ? <div className="alert page-section-offset--compact">{error}</div> : null}
        {loading ? <p className="muted page-section-offset--compact" style={{ textAlign: 'center' }}>{language === "ru" ? "Загрузка..." : "Loading..."}</p> : null}

        {!token || !me ? (
          <div className="lend-stacked-section page-section-offset">
            <article className="lend-final" style={{ textAlign: 'left', marginTop: 0 }}>
              <span className="lend-section-kicker">Access Required</span>
              <h2>{text.authTitle}</h2>
              <p>{text.authBody}</p>
              <div className="lend-cta-row">
                <Link className="lend-primary" style={{ padding: '1rem 2rem' }} to="/auth">
                  {text.authAction}
                </Link>
              </div>
            </article>
          </div>
        ) : (
          <div className="lend-flow page-section-offset">
            <div className="console-stack">
              <article className="lend-card">
                <span className="lend-section-kicker">{text.summaryTitle}</span>
                <div className="lend-overview-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '1.5rem' }}>
                  <div className="lend-stack-card">
                    <span>{text.currentPlan}</span>
                    <strong>{me.plan.code.toUpperCase()}</strong>
                  </div>
                  <div className="lend-stack-card">
                    <span>{text.currentStatus}</span>
                    <strong style={{ color: me.plan.has_api ? "var(--ok)" : "var(--warn)" }}>
                      {me.plan.has_api ? text.accessEnabled : text.summaryFallback}
                    </strong>
                  </div>
                </div>
              </article>

              {!me.plan.has_api ? (
                <article className="lend-card" style={{ marginTop: '1rem' }}>
                  <span className="lend-section-kicker">Billing</span>
                  <h3 style={{ marginTop: '1rem' }}>{text.billingTitle}</h3>
                  <p>{text.billingBody}</p>
                  
                  <div className="form-grid" style={{ marginTop: '1.5rem' }}>
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
                  <button type="button" className="lend-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => void handleCreateCheckout()}>
                    {text.createCheckout}
                  </button>
                  {checkoutUrl ? (
                    <div className="lend-stack-card" style={{ marginTop: '1rem', background: 'rgba(255, 255, 255, 0.05)' }}>
                      <span>{text.latestCheckout}</span>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <code style={{ flex: 1, fontSize: '0.8rem', opacity: 0.8 }}>{checkoutUrl}</code>
                        <button type="button" className="lend-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(checkoutUrl)}>
                          {text.copy}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ) : (
                <>
                  <article className="lend-card" style={{ marginTop: '1rem' }}>
                    <span className="lend-section-kicker">Usage</span>
                    <h3 style={{ marginTop: '1rem' }}>{text.usageTitle}</h3>
                    <div className="lend-overview-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '1.5rem' }}>
                      <div className="lend-stack-card">
                        <span>{text.monthly}</span>
                        <strong>{usage?.usage.monthly_requests ?? 0} / {usage?.usage.monthly_limit ?? me.plan.monthly_cap}</strong>
                      </div>
                      <div className="lend-stack-card">
                        <span>{text.rpm}</span>
                        <strong>{usage?.usage.requests_this_min ?? 0} / {usage?.usage.minute_limit ?? me.plan.rpm_limit}</strong>
                      </div>
                      <div className="lend-stack-card">
                        <span>{text.keyCap}</span>
                        <strong>{apiKeys.length} / {me.plan.api_key_limit}</strong>
                      </div>
                      <div className="lend-stack-card">
                        <span>{text.hookCap}</span>
                        <strong>{webhooks.length}</strong>
                      </div>
                    </div>
                  </article>

                  <article className="lend-card" style={{ marginTop: '1rem' }}>
                    <span className="lend-section-kicker">Security</span>
                    <h3 style={{ marginTop: '1rem' }}>{text.keysTitle}</h3>
                    <form onSubmit={handleCreateKey} className="form-grid" style={{ marginTop: '1.5rem' }}>
                      <label>
                        {text.keyLabel}
                        <input value={keyLabel} placeholder={text.keyPlaceholder} onChange={(event) => setKeyLabel(event.target.value)} />
                      </label>
                      <button type="submit" className="lend-primary" style={{ width: '100%' }}>{text.createKey}</button>
                    </form>
                    {latestSecret ? (
                      <div className="lend-stack-card" style={{ marginTop: '1rem', background: 'rgba(99, 215, 157, 0.1)', borderColor: 'rgba(99, 215, 157, 0.3)' }}>
                        <span>{text.latestSecret}</span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
                          <code style={{ flex: 1 }}>{latestSecret}</code>
                          <button type="button" className="lend-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => navigator.clipboard.writeText(latestSecret)}>
                            {text.copy}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="lend-panel-grid" style={{ marginTop: '1.5rem' }}>
                      {apiKeys.map((key) => (
                        <div key={key.id} className="lend-stack-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong>{key.label}</strong>
                            <code style={{ fontSize: '0.85rem', opacity: 0.7 }}>{key.prefix}***</code>
                          </div>
                          <button type="button" className="lend-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'rgba(255, 137, 125, 0.3)', color: 'var(--danger)' }} onClick={() => void handleDeleteKey(key.id)}>
                            {text.remove}
                          </button>
                        </div>
                      ))}
                      {!apiKeys.length ? <p className="muted" style={{ textAlign: 'center' }}>{text.emptyKeys}</p> : null}
                    </div>
                  </article>
                </>
              )}
            </div>

            <div className="console-stack">
              {me.plan.has_webhooks ? (
                <article className="lend-card">
                  <span className="lend-section-kicker">Events</span>
                  <h3 style={{ marginTop: '1rem' }}>{text.hooksTitle}</h3>
                  <form onSubmit={handleCreateWebhook} className="form-grid" style={{ marginTop: '1.5rem' }}>
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
                    <button type="submit" className="lend-primary" style={{ width: '100%' }}>{text.createHook}</button>
                  </form>
                  <div className="lend-panel-grid" style={{ marginTop: '1.5rem' }}>
                    {webhooks.map((hook) => (
                      <div key={hook.id} className="lend-stack-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{hook.label}</strong>
                          <button type="button" className="lend-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => void handleDeleteWebhook(hook.id)}>
                            {text.remove}
                          </button>
                        </div>
                        <code style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>{hook.url}</code>
                        <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px' }}>
                          <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', opacity: 0.5 }}>Signing Secret</span>
                          <code style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.8rem' }}>{hook.secret}</code>
                        </div>
                      </div>
                    ))}
                    {!webhooks.length ? <p className="muted" style={{ textAlign: 'center' }}>{text.emptyHooks}</p> : null}
                  </div>
                </article>
              ) : null}

              <article className="lend-card" style={{ marginTop: '1rem' }}>
                <span className="lend-section-kicker">Implementation</span>
                <h3 style={{ marginTop: '1rem' }}>{text.sampleCardTitle}</h3>
                <p>{text.sampleCardBody}</p>
                <pre style={{ 
                  marginTop: '1.5rem',
                  padding: '1.2rem',
                  background: '#000',
                  borderRadius: '18px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflowX: 'auto',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  color: '#ffb88b'
                }}>
                  <code>{sampleCurl}</code>
                </pre>
              </article>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

