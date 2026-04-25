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
import { AUTH_COPY as COPY } from "../i18n";

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
    <main className="auth-portal">
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      <div className="auth-portal__glow auth-portal__glow--left" />
      <div className="auth-portal__glow auth-portal__glow--right" />

      <div className="auth-portal__shell portal-animate-in">
        <header className="auth-portal__header">
          <Link to="/" className="auth-portal__brand-link">
             <strong className="dev-portal__brand auth-portal__brand">reqst</strong>
          </Link>
        </header>

        <div className="dev-card auth-portal__card">
          <div className="auth-portal__form-header">
            <h1 className="auth-portal__title">{text.browserTitle}</h1>
            <p className="auth-portal__subtitle">{text.browserBody}</p>
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
              <div className="auth-portal__input-grid">
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
                  className="dev-btn dev-btn--secondary auth-portal__send-code-btn" 
                  disabled={sendingCode || !form.username} 
                  onClick={() => void handleSendCode()}
                >
                  {sendingCode ? text.sendingCode : text.sendCode}
                </button>
              </div>
            </div>

            <button type="submit" className="dev-btn dev-btn--primary auth-portal__submit-btn" disabled={loading}>
              {loading ? text.signingIn : text.loginAction}
            </button>
          </form>

          {message ? (
            <div className="alert alert--success auth-portal__alert">{message}</div>
          ) : null}
          {error ? (
            <div className="alert auth-portal__alert">{error}</div>
          ) : null}

          <div className="auth-portal__footer-actions">
             {initData ? (
                <button
                  type="button"
                  className="dev-btn dev-btn--secondary auth-portal__action-btn"
                  disabled={loading}
                  onClick={() => void performTelegramAuth()}
                >
                  {loading ? text.signingIn : text.continueTelegram}
                </button>
             ) : (
                <a href={BOT_URL} target="_blank" rel="noreferrer" className="dev-btn dev-btn--secondary auth-portal__action-btn auth-portal__bot-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .38.03.55.17.14.11.18.27.2.42-.01.06 0 .13-.01.2z"/></svg>
                  {text.openBot}
                </a>
             )}
             <p className="auth-portal__hint">{text.browserHint}</p>
          </div>
        </div>

        {DEV_AUTH_ENABLED ? (
          <div className="dev-portal__locked-state auth-portal__dev-panel">
            <form className="dev-form auth-portal__dev-form" onSubmit={handleDevSubmit}>
              <input
                className="dev-input auth-portal__dev-input"
                type="text"
                placeholder={text.devUsernamePlaceholder}
                value={devForm.username}
                onChange={(event) => setDevForm((current) => ({ ...current, username: event.target.value }))}
              />
              <input
                className="dev-input auth-portal__dev-input"
                type="text"
                inputMode="numeric"
                placeholder={text.devTelegramIdPlaceholder}
                value={devForm.telegramId}
                onChange={(event) => setDevForm((current) => ({ ...current, telegramId: event.target.value }))}
              />
              <button type="submit" className="dev-btn dev-btn--secondary auth-portal__dev-submit" disabled={loading}>
                {loading ? '...' : 'Dev'}
              </button>
            </form>
          </div>
        ) : null}

        <footer className="auth-portal__footer">
           <Link to="/" className="auth-portal__landing-link">{text.landing}</Link>
        </footer>
      </div>
    </main>
  );
}
