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
const DEV_AUTH_ENABLED = import.meta.env.VITE_ENABLE_DEV_AUTH === "true";

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
    browserTitle: "Вход по коду",
    browserBody: "Безопасный вход через Telegram-бота для браузеров и настольных устройств.",
    username: "Ваш @username",
    usernamePlaceholder: "@username",
    code: "Код подтверждения",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти",
    signingIn: "Авторизация...",
    codeSent: "Код успешно отправлен в Telegram.",
    browserHint: "Пожалуйста, сначала запустите нашего бота, чтобы он мог отправить вам код.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "Если вы открыли это окно внутри Telegram, авторизация произойдет автоматически.",
    openBot: "Открыть бота",
    continueTelegram: "Продолжить в Telegram",
    landing: "На главную",
    devTitle: "Dev-вход без Telegram",
    devBody: "Локальная авторизация для обычного браузера, чтобы спокойно править интерфейс и сценарии без миниаппа.",
    devUsername: "Имя пользователя",
    devUsernamePlaceholder: "designer",
    devTelegramId: "Telegram ID",
    devTelegramIdPlaceholder: "10001",
    devAction: "Войти как dev",
    devHint: "Работает только когда backend запущен с ALLOW_INSECURE_DEV_AUTH=true.",
  },
  en: {
    browserTitle: "Sign in via code",
    browserBody: "Secure Telegram-based authentication for browsers and desktop.",
    username: "Your @username",
    usernamePlaceholder: "@username",
    code: "Verification code",
    codePlaceholder: "123456",
    sendCode: "Get code",
    sendingCode: "Sending...",
    loginAction: "Login",
    signingIn: "Signing in...",
    codeSent: "Code has been sent to your Telegram.",
    browserHint: "Please start our bot first so we can send you the authentication code.",
    telegramTitle: "Telegram Mini App",
    telegramBody: "If you are using the Telegram Mini App, you will be signed in automatically.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    landing: "Home",
    devTitle: "Dev sign-in without Telegram",
    devBody: "Local browser auth for editing the UI and flows without a Telegram Mini App.",
    devUsername: "Username",
    devUsernamePlaceholder: "designer",
    devTelegramId: "Telegram ID",
    devTelegramIdPlaceholder: "10001",
    devAction: "Login in dev mode",
    devHint: "Works only when the backend runs with ALLOW_INSECURE_DEV_AUTH=true.",
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
  const [devForm, setDevForm] = useState({
    username: "designer",
    telegramId: "10001",
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

  async function handleDevSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const username = devForm.username.trim().replace(/^@+/, "");
      const telegramId = Number(devForm.telegramId.trim());
      if (!username) {
        throw new Error(text.devUsername);
      }
      if (!Number.isFinite(telegramId) || telegramId <= 0) {
        throw new Error(text.devTelegramId);
      }

      const result = await authenticateTelegram({
        username,
        telegram_id: telegramId,
      });
      setStoredToken(result.token);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="dev-portal" style={{ display: 'grid', placeItems: 'center', padding: '2rem 1rem' }}>
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      <div className="auth-portal__glow auth-portal__glow--left" style={{ opacity: 0.1 }} />
      <div className="auth-portal__glow auth-portal__glow--right" style={{ opacity: 0.1 }} />

      <div className="portal-animate-in" style={{ width: '100%', maxWidth: '440px' }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ display: 'inline-block' }}>
             <strong className="dev-portal__brand" style={{ fontSize: '1.6rem' }}>reqst</strong>
          </Link>
        </header>

        <div className="dev-card" style={{ padding: '2.5rem', background: 'rgba(8, 8, 10, 0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', margin: 0 }}>{text.browserTitle}</h1>
            <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{text.browserBody}</p>
          </div>

          <form className="dev-form" onSubmit={handleSubmit}>
            <div className="dev-input-group">
              <label>{text.username}</label>
              <input
                className="dev-input"
                type="text"
                placeholder={text.usernamePlaceholder}
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                required
              />
            </div>

            <div className="dev-input-group">
              <label>{text.code}</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem' }}>
                <input
                  className="dev-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={text.codePlaceholder}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                />
                <button 
                  type="button" 
                  className="dev-btn dev-btn--secondary" 
                  style={{ padding: '0 1rem', fontSize: '0.85rem' }}
                  disabled={sendingCode || !form.username} 
                  onClick={() => void handleSendCode()}
                >
                  {sendingCode ? text.sendingCode : text.sendCode}
                </button>
              </div>
            </div>

            <button type="submit" className="dev-btn dev-btn--primary" style={{ width: '100%', marginTop: '0.5rem', height: '3.2rem' }} disabled={loading}>
              {loading ? text.signingIn : text.loginAction}
            </button>
          </form>

          {message ? (
            <div className="alert alert--success" style={{ marginTop: '1.2rem', fontSize: '0.85rem', padding: '0.8rem' }}>{message}</div>
          ) : null}
          {error ? (
            <div className="alert" style={{ marginTop: '1.2rem', fontSize: '0.85rem', padding: '0.8rem' }}>{error}</div>
          ) : null}

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
             {initData ? (
                <button
                  type="button"
                  className="dev-btn dev-btn--secondary"
                  style={{ width: '100%' }}
                  disabled={loading}
                  onClick={() => void performTelegramAuth()}
                >
                  {loading ? text.signingIn : text.continueTelegram}
                </button>
             ) : (
                <a href={BOT_URL} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .38.03.55.17.14.11.18.27.2.42-.01.06 0 .13-.01.2z"/></svg>
                  {text.openBot}
                </a>
             )}
             <p style={{ marginTop: '0.8rem', fontSize: '0.75rem', opacity: 0.3 }}>{text.browserHint}</p>
          </div>
        </div>

        {DEV_AUTH_ENABLED ? (
          <div className="dev-portal__locked-state" style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '18px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.05)' }}>
            <form className="dev-form" onSubmit={handleDevSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="dev-input"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                type="text"
                placeholder={text.devUsernamePlaceholder}
                value={devForm.username}
                onChange={(event) => setDevForm((current) => ({ ...current, username: event.target.value }))}
              />
              <input
                className="dev-input"
                style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
                type="text"
                inputMode="numeric"
                placeholder={text.devTelegramIdPlaceholder}
                value={devForm.telegramId}
                onChange={(event) => setDevForm((current) => ({ ...current, telegramId: event.target.value }))}
              />
              <button type="submit" className="dev-btn dev-btn--secondary" style={{ padding: '0.5rem 0.85rem', fontSize: '0.8rem' }} disabled={loading}>
                {loading ? '...' : 'Dev'}
              </button>
            </form>
          </div>
        ) : null}

        <footer style={{ marginTop: '3rem', textAlign: 'center', opacity: 0.2 }}>
           <Link to="/" style={{ fontSize: '0.85rem' }}>{text.landing}</Link>
        </footer>
      </div>
    </main>
  );
}
