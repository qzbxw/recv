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
    title: "Панель интеграции Reqst",
    body: "Здесь живёт весь контур для API, ключей, уведомлений и оплаты Dev или Enterprise. Логика простая: активируете план, получаете доступ и управляете интеграцией из одной плотной панели.",
    authTitle: "Нужен вход в рабочий кабинет",
    authBody: "Авторизуйтесь тем же аккаунтом продавца, чтобы выпускать ключи, подключать адреса уведомлений и покупать Dev или Enterprise без отдельной переписки.",
    authAction: "Войти в Reqst",
    back: "Главная",
    console: "Панель продавца",
    upgradeTitle: "Включите Dev или Enterprise",
    upgradeBody: "У аккаунта пока нет доступа к интеграциям. Оплатите подходящий план через обычную ссылку Reqst, и доступ откроется автоматически после подтверждения транзакции.",
    plan: "План",
    network: "Сеть оплаты",
    createCheckout: "Создать оплату",
    usageTitle: "Нагрузка и лимиты",
    usageBody: "Текущее состояние квот, минутной нагрузки и числа активных подключений.",
    keysTitle: "Ключи доступа",
    keysBody: "Полный секрет показывается только один раз в момент выпуска, дальше остаётся только короткий префикс.",
    hooksTitle: "Адреса уведомлений",
    hooksBody: "Reqst подписывает каждую доставку заголовком X-Reqst-Signature, чтобы вы могли проверить источник.",
    keyLabel: "Название ключа",
    keyPlaceholder: "Продакшн-сервис",
    createKey: "Выпустить ключ",
    hookLabel: "Название адреса",
    hookLabelPlaceholder: "Оплаты продакшн",
    hookUrl: "Адрес уведомлений",
    hookUrlPlaceholder: "https://app.example.com/webhooks/reqst",
    createHook: "Добавить адрес",
    remove: "Удалить",
    copy: "Копировать",
    latestSecret: "Новый ключ",
    latestCheckout: "Последняя ссылка на оплату",
    sampleTitle: "Пример запроса",
    sampleBody: "Базовый запрос на создание инвойса через API Reqst.",
    monthly: "Запросов за месяц",
    rpm: "Нагрузка за минуту",
    keyCap: "Активные ключи",
    hookCap: "Адреса уведомлений",
    emptyKeys: "Ключей доступа пока нет.",
    emptyHooks: "Адреса уведомлений пока не добавлены.",
    heroCards: [
      {
        title: "Один кабинет вместо хаоса",
        body: "Покупка плана, выпуск ключей, квоты и адреса уведомлений собраны в одном месте и не размазаны по разным экранам.",
      },
      {
        title: "Прямой запуск без sales-слоя",
        body: "План активируется через обычную оплату внутри Reqst. После подтверждения кабинет сразу открывает нужные лимиты.",
      },
      {
        title: "Нормальная операционная база",
        body: "Можно держать отдельные ключи под сервисы, отслеживать текущую нагрузку и не гадать, почему интеграция упёрлась в лимит.",
      },
    ],
    railTitle: "Что здесь можно сделать",
    currentPlan: "План",
    currentStatus: "Статус",
    accessEnabled: "Доступ открыт",
    rails: [
      "Активировать Dev или Enterprise через оплату в нужной сети.",
      "Выпустить отдельные ключи под сервисы и окружения.",
      "Подключить адреса уведомлений для событий оплаты.",
      "Видеть текущую загрузку и лимиты без ручной сверки.",
    ],
    lockedTitle: "До входа это выглядит так",
    lockedBody: "Сначала авторизация, потом рабочие инструменты. Но структура кабинета и логика активации уже прозрачны: ничего лишнего, только контур интеграции.",
    summaryTitle: "Состояние кабинета",
    summaryFallback: "Доступ к интеграциям пока не активирован",
  },
  en: {
    title: "Reqst Integration Portal",
    body: "This page combines plan activation, API keys, delivery endpoints, and usage visibility in one working surface.",
    authTitle: "Sign in to access the integration portal",
    authBody: "Use the same seller account to issue keys, connect delivery endpoints, and buy Dev or Enterprise without a separate sales flow.",
    authAction: "Sign in to Reqst",
    back: "Home",
    console: "Seller Console",
    upgradeTitle: "Enable Dev or Enterprise",
    upgradeBody: "This account does not have integration access yet. Buy a plan through a normal Reqst billing link and access will unlock automatically after payment.",
    plan: "Plan",
    network: "Payment network",
    createCheckout: "Create billing link",
    usageTitle: "Usage and limits",
    usageBody: "Current quotas, minute load, and active integrations.",
    keysTitle: "Access keys",
    keysBody: "A full secret is shown only once after creation.",
    hooksTitle: "Delivery endpoints",
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
    heroCards: [
      {
        title: "One operating surface",
        body: "Billing activation, key issuance, quotas, and delivery endpoints live in one place.",
      },
      {
        title: "Self-serve plan activation",
        body: "Buy the plan through a normal Reqst payment flow and unlock access automatically after confirmation.",
      },
      {
        title: "Clear operational visibility",
        body: "Track current usage and split credentials across services without guessing where the limit is.",
      },
    ],
    railTitle: "What you can do here",
    currentPlan: "Plan",
    currentStatus: "Status",
    accessEnabled: "Access enabled",
    rails: [
      "Activate Dev or Enterprise through a normal payment flow.",
      "Issue separate keys for services and environments.",
      "Connect delivery endpoints for payment events.",
      "Watch current load and quota usage in one panel.",
    ],
    lockedTitle: "What the portal covers",
    lockedBody: "Sign-in comes first, but the structure is straightforward: billing, credentials, delivery endpoints, and usage state.",
    summaryTitle: "Portal state",
    summaryFallback: "Integration access is not active yet",
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
      '  -d \'{"title":"Подписка на сервис","base_amount_usd":"2500.00","payable_network":"TRON","expires_in_minutes":60}\'',
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
        <div className="developer-portal__hero-copy">
          <span className="plan-page__badge">Reqst Dev / Enterprise</span>
          <h1>{text.title}</h1>
          <p>{text.body}</p>

          <div className="developer-portal__rail">
            <span>{text.railTitle}</span>
            <div className="developer-portal__rail-list">
              {text.rails.map((item) => (
                <article key={item} className="developer-portal__rail-item">
                  <span />
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="developer-portal__hero-stack">
          {text.heroCards.map((card) => (
            <article key={card.title} className="developer-portal__hero-card">
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}
      {loading ? <p className="muted">{language === "ru" ? "Загрузка..." : "Loading..."}</p> : null}

      {!token || !me ? (
        <div className="developer-portal__locked">
          <section className="developer-portal__auth">
            <h2>{text.authTitle}</h2>
            <p>{text.authBody}</p>
            <Link className="lend-primary" to="/auth">
              {text.authAction}
            </Link>
          </section>

          <section className="developer-card developer-card--intro">
            <span className="developer-card__eyebrow">{text.lockedTitle}</span>
            <p>{text.lockedBody}</p>
            <div className="developer-card__tile-grid">
              {text.rails.map((item, index) => (
                <article key={item} className="developer-card__tile">
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="developer-portal__grid">
          <section className="developer-portal__column">
            <article className="developer-card developer-card--summary">
              <span className="developer-card__eyebrow">{text.summaryTitle}</span>
                <div className="developer-metrics">
                <div className="developer-metric">
                  <span>{text.currentPlan}</span>
                  <strong>{me.plan.code.toUpperCase()}</strong>
                </div>
                <div className="developer-metric">
                  <span>{text.currentStatus}</span>
                  <strong>{me.plan.has_api ? text.accessEnabled : text.summaryFallback}</strong>
                </div>
              </div>
            </article>

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
