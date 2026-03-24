import { Link } from "react-router-dom";
import { useUI } from "../lib/ui";

type Variant = "dev" | "enterprise";

const COPY = {
  ru: {
    back: "На главную",
    auth: "Войти в Reqst",
    console: "Открыть консоль",
    billing: "Открыть checkout",
    dev: {
      badge: "Reqst Dev",
      title: "API-план для продуктовых команд и интеграторов.",
      body: "Покупаете доступ через обычный Reqst checkout, получаете API keys, webhooks, месячную квоту и rate limits без кастомной интеграции со стороны sales.",
      price: "149 USDT / 30 дней",
      bullets: [
        "До 3 активных API keys",
        "До 50 000 API-запросов в месяц",
        "До 90 запросов в минуту на ключ",
        "Webhook retries и seller-console для управления",
      ],
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B-план для команд с высоким объёмом и SLA-ожиданиями.",
      body: "Тот же self-serve checkout через Reqst, но с enterprise-лимитами, большим числом ключей, повышенными rate limits и расширенным webhook pipeline.",
      price: "499 USDT / 30 дней",
      bullets: [
        "До 20 активных API keys",
        "До 500 000 API-запросов в месяц",
        "До 600 запросов в минуту на ключ",
        "Усиленные retries и приоритетный support-трек",
      ],
    },
  },
  en: {
    back: "Back home",
    auth: "Sign in to Reqst",
    console: "Open console",
    billing: "Open checkout",
    dev: {
      badge: "Reqst Dev",
      title: "Developer API plan for product teams and integrators.",
      body: "You buy access through a normal Reqst checkout, then manage API keys, webhooks, monthly quotas, and rate limits from the same console.",
      price: "149 USDT / 30 days",
      bullets: [
        "Up to 3 active API keys",
        "Up to 50,000 API requests per month",
        "Up to 90 requests per minute per key",
        "Webhook retries and seller-console management",
      ],
    },
    enterprise: {
      badge: "Reqst Enterprise",
      title: "B2B plan for larger teams, higher volume, and stronger operational guarantees.",
      body: "The same self-serve Reqst billing flow, but with enterprise quotas, more API keys, higher rate limits, and a deeper webhook delivery pipeline.",
      price: "499 USDT / 30 days",
      bullets: [
        "Up to 20 active API keys",
        "Up to 500,000 API requests per month",
        "Up to 600 requests per minute per key",
        "Stronger retries and priority support track",
      ],
    },
  },
} as const;

export function PlanPage({ variant }: { variant: Variant }) {
  const { language } = useUI();
  const text = COPY[language];
  const product = text[variant];

  return (
    <main className={`plan-page plan-page--${variant}`}>
      <div className="plan-page__glow plan-page__glow--left" />
      <div className="plan-page__glow plan-page__glow--right" />

      <header className="plan-page__topbar">
        <Link className="lend-brand" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="plan-page__topbar-links">
          <Link className="lend-nav-link" to="/">
            {text.back}
          </Link>
          <Link className="lend-nav-link" to="/auth">
            {text.auth}
          </Link>
        </div>
      </header>

      <section className="plan-page__hero">
        <div className="plan-page__copy">
          <span className="plan-page__badge">{product.badge}</span>
          <h1>{product.title}</h1>
          <p>{product.body}</p>
          <strong className="plan-page__price">{product.price}</strong>

          <div className="plan-page__actions">
            <Link className="lend-primary" to={`/console?plan=${variant}`}>
              {text.billing}
            </Link>
            <Link className="lend-secondary" to="/console">
              {text.console}
            </Link>
          </div>
        </div>

        <div className="plan-page__card">
          {product.bullets.map((bullet) => (
            <article key={bullet} className="plan-page__bullet">
              <span />
              <p>{bullet}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
