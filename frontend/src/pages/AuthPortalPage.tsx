import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  authenticateTelegram,
  getStoredToken,
  loginWithTelegramCode,
  requestTelegramLoginCode,
  setStoredToken,
} from "../lib/api";
import { sanitizeNextPath } from "../lib/routing";
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
    title: "Вход в Reqst",
    body: "Основной вход теперь только через Telegram: введите свой username, получите код в боте и подтвердите вход.",
    browserTitle: "Telegram код",
    browserBody: "Сценарий для браузера и консоли без Login Widget.",
    username: "Telegram username",
    usernamePlaceholder: "@yourname",
    code: "Код",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти",
    signingIn: "Авторизация...",
    codeSent: "Код отправлен в Telegram.",
    browserHint: "Сначала откройте бота и нажмите Start, чтобы мы могли написать вам в личку.",
    browserSteps: "Шаги: открыть бота, ввести @username, получить код, вставить его сюда.",
    botStart: "Откройте",
    botStartSuffix: "и нажмите Start.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "Если вы уже внутри Telegram, вход произойдет автоматически.",
    openBot: "Открыть бота",
    continueTelegram: "Войти через Telegram",
    landing: "На главную",
    redirectHint: "После входа откроется нужный раздел.",
  },
  en: {
    title: "Sign in to Reqst",
    body: "Reqst now uses Telegram as the main auth method: enter your username, receive a code from the bot, and confirm sign-in.",
    browserTitle: "Telegram code",
    browserBody: "Browser and console sign-in without the Login Widget.",
    username: "Telegram username",
    usernamePlaceholder: "@yourname",
    code: "Code",
    codePlaceholder: "123456",
    sendCode: "Get code",
    sendingCode: "Sending...",
    loginAction: "Login",
    signingIn: "Signing in...",
    codeSent: "Code sent to Telegram.",
    browserHint: "Open the bot and press Start first so we can message your account.",
    browserSteps: "Flow: open the bot, enter your @username, request the code, and paste it here.",
    botStart: "Open",
    botStartSuffix: "and press Start first.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "If you're already inside Telegram, sign-in happens automatically.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    landing: "Home",
    redirectHint: "You will be redirected after sign-in.",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useUI();
  const text = COPY[language];
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [form, setForm] = useState({
    username: "",
    code: "",
  });
  const hasSession = Boolean(getStoredToken());
  const [initData, setInitData] = useState(window.Telegram?.WebApp?.initData || "");
  const nextPath = sanitizeNextPath(new URLSearchParams(location.search).get("next")) || "/console";

  useEffect(() => {
    if (!initData) {
      const interval = window.setInterval(() => {
        const data = window.Telegram?.WebApp?.initData;
        if (data) {
          setInitData(data);
          window.clearInterval(interval);
        }
      }, 50);
      const timeout = window.setTimeout(() => window.clearInterval(interval), 2000);
      return () => {
        window.clearInterval(interval);
        window.clearTimeout(timeout);
      };
    }
    return undefined;
  }, [initData]);

  useEffect(() => {
    if (hasSession) {
      navigate(nextPath, { replace: true });
    }
  }, [hasSession, navigate, nextPath]);

  useEffect(() => {
    if (initData && !hasSession) {
      void performTelegramAuth(initData);
    }
  }, [initData, hasSession]);

  async function performTelegramAuth(manualInitData?: string) {
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const sessionInitData = manualInitData || window.Telegram?.WebApp?.initData;
      if (!sessionInitData) {
        throw new Error("No Telegram session found");
      }
      const result = await authenticateTelegram({ init_data: sessionInitData });
      setStoredToken(result.token);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleSendCode() {
    try {
      setSendingCode(true);
      setError("");
      setMessage("");
      await requestTelegramLoginCode({ username: form.username.trim() });
      setMessage(text.codeSent);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await loginWithTelegramCode({
        username: form.username.trim(),
        code: form.code.trim(),
      });
      setStoredToken(result.token);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="shell checkout-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <Link className="topbar-brand topbar-brand--minimal" to="/">
          <strong>reqst</strong>
        </Link>
        <div className="topbar-actions">
          <Link className="ghost-button compact-button" to="/">
            {text.landing}
          </Link>
        </div>
      </header>

      <section className="auth-portal__compact">
        <div className="auth-portal__copy auth-portal__copy--compact">
          <h1>{text.title}</h1>
          <p>{text.body}</p>
          <p className="auth-portal__hint">{text.browserSteps}</p>
          <p className="auth-portal__hint">
            {text.botStart} <a href={BOT_URL} target="_blank" rel="noreferrer">@reqstxyz_bot</a> {text.botStartSuffix}
          </p>
          {nextPath !== "/console" ? <p className="auth-portal__hint">{text.redirectHint}</p> : null}
        </div>

        <article className="checkout-card checkout-card--lux auth-card auth-card--email auth-card--primary">
          <div className="completion-paper-topline">
            <span className="receipt-brandline">Primary</span>
            <span className="completion-ticket-no">Browser</span>
          </div>
          <div className="auth-card__content">
            <h2>{text.browserTitle}</h2>
            <p className="hero-copy">{text.browserBody}</p>
            <p className="auth-portal__hint">{text.browserHint}</p>
            <p className="auth-portal__hint">
              <a href={BOT_URL} target="_blank" rel="noreferrer">@reqstxyz_bot</a>
            </p>
          </div>

          <form className="auth-card__form form-grid" onSubmit={handleSubmit}>
            <label>
              {text.username}
              <input
                type="text"
                placeholder={text.usernamePlaceholder}
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>

            <div className="auth-inline-action">
              <label>
                {text.code}
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={text.codePlaceholder}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                />
              </label>
              <button type="button" className="ghost-button compact-button" disabled={sendingCode} onClick={() => void handleSendCode()}>
                {sendingCode ? text.sendingCode : text.sendCode}
              </button>
            </div>

            <button type="submit" className="lend-primary lend-primary--large" disabled={loading}>
              {loading ? text.signingIn : text.loginAction}
            </button>
          </form>

          <div className="auth-card__actions">
            <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
              {text.openBot}
            </a>
          </div>

          {message ? <div className="auth-feedback auth-feedback--success">{message}</div> : null}
          {error ? <div className="alert">{error}</div> : null}
        </article>

        <article className="checkout-card checkout-card--lux auth-card auth-card--telegram auth-card--secondary">
          <div className="completion-paper-topline">
            <span className="receipt-brandline">Quick Access</span>
            <span className="completion-ticket-no">Telegram</span>
          </div>
          <div className="auth-card__content">
            <h2>{text.telegramTitle}</h2>
            <p className="hero-copy">{text.telegramBody}</p>
          </div>
          <div className="auth-card__actions">
            {initData ? (
              <button
                type="button"
                className="lend-secondary"
                disabled={loading}
                onClick={() => void performTelegramAuth()}
              >
                {loading ? text.signingIn : text.continueTelegram}
              </button>
            ) : (
              <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                {text.openBot}
              </a>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
