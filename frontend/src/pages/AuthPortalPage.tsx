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
    eyebrow: "Access",
    title: "Вход в reqst console",
    body:
      "Нормальная схема здесь выглядит так: Telegram остается identity-ядром, а email становится веб-точкой входа и recovery-каналом. В этом проходе уже выносим auth в отдельную страницу и даем привязать почту внутри консоли.",
    telegramTitle: "Telegram-first вход",
    telegramBody: "Если ты уже внутри Telegram WebApp, можно зайти сразу. Если заходишь с сайта, открой бота и продолжи оттуда.",
    openBot: "Открыть Telegram bot",
    continueTelegram: "Продолжить через Telegram",
    devTitle: "Web / dev вход",
    devBody: "Пока email login не завершен на backend-уровне, веб-вход остается через Telegram identity. Для локальной разработки можно зайти вручную.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Войти в консоль",
    signingIn: "Входим...",
    linkedTitle: "Что уже готово",
    linkedItems: [
      "Корень сайта можно держать под landing, а консоль отдельно на /console.",
      "Auth вынесен в отдельную точку входа на /auth.",
      "После Telegram-входа в консоли можно привязать email к аккаунту.",
    ],
    landing: "На лендинг",
    console: "В консоль",
  },
  en: {
    eyebrow: "Access",
    title: "Sign in to reqst console",
    body:
      "The clean structure here is hybrid: Telegram stays the identity core, while email becomes the web access and recovery layer. This pass moves auth into its own page and adds email linking inside the console.",
    telegramTitle: "Telegram-first sign-in",
    telegramBody: "If you are already inside Telegram WebApp, continue directly. If you are on the website, open the bot first and keep going from there.",
    openBot: "Open Telegram bot",
    continueTelegram: "Continue with Telegram",
    devTitle: "Web / dev sign-in",
    devBody: "Until email login is finished end-to-end on the backend, website sign-in still uses Telegram identity. Manual entry stays available for local development.",
    telegramId: "Telegram ID",
    username: "Username",
    signIn: "Enter console",
    signingIn: "Signing in...",
    linkedTitle: "What is already in place",
    linkedItems: [
      "The website root can stay a landing page, while the console lives at /console.",
      "Auth now has its own entry point at /auth.",
      "After Telegram sign-in, a seller can link an email inside the console.",
    ],
    landing: "Back to landing",
    console: "Open console",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const { language } = useUI();
  const text = COPY[language];
  const [authForm, setAuthForm] = useState({ telegramId: "1001001", username: "reqst_dev" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  async function handleAuth(event: FormEvent) {
    event.preventDefault();
    await performAuth();
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

        <section className="auth-portal__hero">
          <div className="auth-portal__copy">
            <span className="lend-kicker">{text.eyebrow}</span>
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>

          <div className="auth-portal__grid">
            <article className="auth-card auth-card--telegram">
              <h2>{text.telegramTitle}</h2>
              <p>{text.telegramBody}</p>
              <div className="auth-card__actions">
                <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                  {text.openBot}
                </a>
                <button type="button" disabled={!hasTelegramInitData || loading} onClick={() => void performAuth()}>
                  {loading ? text.signingIn : text.continueTelegram}
                </button>
              </div>
            </article>

            <article className="auth-card">
              <h2>{text.devTitle}</h2>
              <p>{text.devBody}</p>
              <form onSubmit={handleAuth} className="form-grid auth-card__form">
                <label>
                  {text.telegramId}
                  <input value={authForm.telegramId} onChange={(event) => setAuthForm((current) => ({ ...current, telegramId: event.target.value }))} />
                </label>
                <label>
                  {text.username}
                  <input value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} />
                </label>
                <button disabled={loading} type="submit">
                  {loading ? text.signingIn : text.signIn}
                </button>
              </form>
              {error ? <div className="alert">{error}</div> : null}
            </article>

            <article className="auth-card auth-card--notes">
              <h2>{text.linkedTitle}</h2>
              <ul className="note-list note-list--console">
                {text.linkedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
