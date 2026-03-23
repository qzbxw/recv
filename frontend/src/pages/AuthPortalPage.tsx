import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authenticate, getStoredToken, setStoredToken } from "../lib/api";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
      };
    };
  }
}

const COPY = {
  ru: {
    title: "Вход в reqst",
    body: "Используйте ваш аккаунт Telegram для безопасного входа в панель управления продавца.",
    telegramTitle: "Авторизация через Telegram",
    telegramBody: "Нажмите кнопку ниже, чтобы войти в консоль. Если вы заходите не из Telegram, мы предложим открыть бота для подтверждения личности.",
    openBot: "Открыть бота",
    continueTelegram: "Войти через Telegram",
    signingIn: "Входим...",
    landing: "На главную",
    console: "В консоль",
    devAccess: "Вход для разработчиков (Manual ID)",
    devEnter: "Войти по ID",
  },
  en: {
    title: "Sign in to reqst",
    body: "Use your Telegram account to securely access your seller dashboard.",
    telegramTitle: "Telegram Authentication",
    telegramBody: "Click the button below to enter the console. If you are browsing outside of Telegram, you can use our bot to verify your identity.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    signingIn: "Signing in...",
    landing: "Back to Home",
    console: "Open Console",
    devAccess: "Developer Access (Manual ID)",
    devEnter: "Enter by ID",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const { language } = useUI();
  const text = COPY[language];
  const [authForm, setAuthForm] = useState({ telegramId: "1001001", username: "reqst_dev" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const hasTelegramInitData = useMemo(() => Boolean(window.Telegram?.WebApp?.initData), []);
  const hasSession = Boolean(getStoredToken());

  async function performAuth() {
    try {
      setLoading(true);
      setError("");
      const initData = window.Telegram?.WebApp?.initData;
      const payload = initData
        ? { init_data: initData }
        : { telegram_id: Number(authForm.telegramId), username: authForm.username };
      const result = await authenticate(payload);
      setStoredToken(result.token);
      navigate("/console");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="auth-portal">
      <div className="auth-portal__glow auth-portal__glow--left" />
      <div className="auth-portal__glow auth-portal__glow--right" />

      <div className="auth-portal__shell">
        <header className="auth-portal__topbar">
          <Link className="lend-brand" to="/">
            <strong>reqst</strong>
          </Link>
          <div className="auth-portal__links">
            <Link className="lend-nav-link" to="/">
              {text.landing}
            </Link>
            {hasSession ? (
              <Link className="lend-primary" to="/console">
                {text.console}
              </Link>
            ) : null}
          </div>
        </header>

        <section className="auth-portal__hero auth-portal__hero--centered">
          <div className="auth-portal__copy">
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>

          <div className="auth-portal__main-action">
            <article className="auth-card auth-card--hero">
              <div className="auth-card__content">
                <h2>{text.telegramTitle}</h2>
                <p>{text.telegramBody}</p>
              </div>
              <div className="auth-card__actions">
                <button 
                  type="button" 
                  className="lend-primary lend-primary--large"
                  disabled={loading} 
                  onClick={() => void performAuth()}
                >
                  {loading ? text.signingIn : text.continueTelegram}
                </button>
                <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                  {text.openBot}
                </a>
              </div>
              {error ? <div className="alert">{error}</div> : null}
            </article>
          </div>

          <div className="auth-portal__dev-trigger">
            <button type="button" className="ghost-link" onClick={() => setShowDev(!showDev)}>
              {text.devAccess}
            </button>
            {showDev && (
              <div className="dev-form-mini">
                <input 
                  value={authForm.telegramId} 
                  placeholder="ID"
                  onChange={(e) => setAuthForm(c => ({ ...c, telegramId: e.target.value }))} 
                />
                <input 
                  value={authForm.username} 
                  placeholder="Username"
                  onChange={(e) => setAuthForm(c => ({ ...c, username: e.target.value }))} 
                />
                <button onClick={() => void performAuth()}>{text.devEnter}</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
