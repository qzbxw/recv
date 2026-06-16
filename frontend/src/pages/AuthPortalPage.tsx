import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  authenticateTelegram,
  getOAuthStartUrl,
  getStoredToken,
  loginWithTelegramCode,
  refreshAuth,
  requestTelegramLoginCode,
  setStoredToken,
  trackEvent,
  validateReferralCode,
} from "../lib/api";
import { sanitizeNextPath } from "../lib/routing";
import { readAttribution, readRefCode, sanitizeRefCode } from "../lib/attribution";
import { useUI } from "../lib/ui";
import { AUTH_COPY as COPY } from "../i18n";

const BOT_URL = "https://t.me/recvmoney_bot";
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function TelegramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.38-.49 1.05-.75 4.12-1.79 6.87-2.97 8.25-3.54 3.92-1.63 4.73-1.91 5.26-1.92.12 0 .38.03.55.17.14.11.18.27.2.42-.01.06 0 .13-.01.2z" />
    </svg>
  );
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
  const [codeRequested, setCodeRequested] = useState(false);
  const [form, setForm] = useState({
    username: "",
    code: "",
  });
  const [refCode, setRefCode] = useState(() => readRefCode());
  const [showRefCode, setShowRefCode] = useState(() => Boolean(readRefCode()));
  const [refStatus, setRefStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const [refPartner, setRefPartner] = useState("");

  useEffect(() => {
    const code = sanitizeRefCode(refCode);
    if (!code) {
      setRefStatus("idle");
      setRefPartner("");
      return;
    }
    const timeout = window.setTimeout(() => {
      validateReferralCode(code)
        .then((result) => {
          setRefStatus(result.valid ? "valid" : "invalid");
          setRefPartner(result.partner_name || "");
        })
        .catch(() => setRefStatus("idle"));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [refCode]);
  const [devForm, setDevForm] = useState({
    username: "designer",
    telegramId: "10001",
  });
  const hasSession = Boolean(getStoredToken());
  const [initData, setInitData] = useState(window.Telegram?.WebApp?.initData || "");
  const nextPath = sanitizeNextPath(new URLSearchParams(location.search).get("next")) || "/console";

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hashParams.get("oauth_token");
    const searchParams = new URLSearchParams(location.search);
    const oauthError = hashParams.get("oauth_error") || searchParams.get("oauth_error");
    if (token) {
      setStoredToken(token);
      window.history.replaceState(null, "", nextPath);
      navigate(nextPath, { replace: true });
      return;
    }
    if (searchParams.get("oauth") === "success") {
      setLoading(true);
      refreshAuth()
        .then((result) => {
          const nextToken = result.token || result.access_token || "";
          if (!nextToken) throw new Error("OAuth session refresh failed");
          setStoredToken(nextToken);
          navigate(nextPath, { replace: true });
        })
        .catch((err) => setError((err as Error).message))
        .finally(() => setLoading(false));
      return;
    }
    if (oauthError) {
      setError(oauthError);
      window.history.replaceState(null, "", "/auth");
    }
  }, [location.search, navigate, nextPath]);

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
      const result = await authenticateTelegram({ init_data: sessionInitData, attribution: readAttribution(), ref_code: sanitizeRefCode(refCode) });
      setStoredToken(result.token);
      void trackEvent(result.token, { event_name: "signup_completed", source: "auth", properties: { method: "telegram_init_data" } }).catch(() => undefined);
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
      setCodeRequested(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!codeRequested) {
      void handleSendCode();
      return;
    }
    try {
      setLoading(true);
      setError("");
      setMessage("");
      const result = await loginWithTelegramCode({
        username: form.username.trim(),
        code: form.code.trim(),
        attribution: readAttribution(),
        ref_code: sanitizeRefCode(refCode),
      });
      setStoredToken(result.token);
      void trackEvent(result.token, { event_name: "signup_completed", source: "auth", properties: { method: "telegram_code" } }).catch(() => undefined);
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
        attribution: readAttribution(),
        ref_code: sanitizeRefCode(refCode),
      });
      setStoredToken(result.token);
      void trackEvent(result.token, { event_name: "signup_completed", source: "auth", properties: { method: "dev" } }).catch(() => undefined);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const card = cardRef.current;
    if (!card) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHovered = false;
    let frameId: number;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
    };

    const onMouseEnter = () => {
      isHovered = true;
      card.style.setProperty("--spotlight-opacity", "1");
    };

    const onMouseLeave = () => {
      isHovered = false;
      card.style.setProperty("--spotlight-opacity", "0");
      
      // Settle back to center slowly when mouse leaves
      const rect = card.getBoundingClientRect();
      targetX = rect.width / 2;
      targetY = rect.height / 2;
    };

    const update = () => {
      // Interpolate with a factor of 0.08 (liquid lag)
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      card.style.setProperty("--mouse-x", `${currentX}px`);
      card.style.setProperty("--mouse-y", `${currentY}px`);

      frameId = requestAnimationFrame(update);
    };

    card.addEventListener("mousemove", onMouseMove);
    card.addEventListener("mouseenter", onMouseEnter);
    card.addEventListener("mouseleave", onMouseLeave);

    // Set initial position to center
    const rect = card.getBoundingClientRect();
    targetX = rect.width / 2;
    targetY = rect.height / 2;
    currentX = targetX;
    currentY = targetY;

    frameId = requestAnimationFrame(update);

    return () => {
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseenter", onMouseEnter);
      card.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <main className="auth-portal">
      <div className="dev-portal__backdrop dev-portal__backdrop--grid" />
      <div className="auth-portal__glow auth-portal__glow--left" />
      <div className="auth-portal__glow auth-portal__glow--right" />

      <div className="auth-portal__shell portal-animate-in">
        <header className="auth-portal__header">
          <Link to="/" className="auth-portal__brand-link" style={{ textDecoration: 'none' }}>
            <strong className="dev-portal__brand auth-portal__brand">recv<span className="brand-dot">.</span></strong>
          </Link>
        </header>

        <div ref={cardRef} className="dev-card auth-portal__card lend-spotlight-card">
          <div className="lend-card-spotlight" />
          <div className="auth-portal__form-header">
            <h1 className="auth-portal__title">{text.browserTitle}</h1>
            <p className="auth-portal__subtitle">{text.browserBody}</p>
          </div>

          <div className="auth-portal__oauth-grid">
            <a className="auth-portal__oauth-btn auth-portal__oauth-btn--google" href={getOAuthStartUrl("google", { next: nextPath, ref_code: sanitizeRefCode(refCode) })}>
              <GoogleIcon />
              <span>Google</span>
            </a>
            <a className="auth-portal__oauth-btn auth-portal__oauth-btn--github" href={getOAuthStartUrl("github", { next: nextPath, ref_code: sanitizeRefCode(refCode) })}>
              <GithubIcon />
              <span>GitHub</span>
            </a>
          </div>

          <div className="auth-portal__divider"><span>{text.telegramFallback}</span></div>

          <form className="dev-form" onSubmit={handleSubmit}>
            <div className="dev-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>{text.username}</label>
                {codeRequested && (
                  <button
                    type="button"
                    className="auth-portal__change-username-btn"
                    onClick={() => {
                      setCodeRequested(false);
                      setForm((current) => ({ ...current, code: "" }));
                      setMessage("");
                    }}
                  >
                    {language === "ru" ? "изменить" : "change"}
                  </button>
                )}
              </div>
              <div className="auth-portal__input-wrapper">
                <span className="auth-portal__input-icon">
                  <TelegramIcon size={16} />
                </span>
                <input
                  className="dev-input"
                  type="text"
                  placeholder={text.usernamePlaceholder}
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                  disabled={codeRequested}
                />
              </div>
            </div>

            {codeRequested && (
              <div className="dev-input-group anim-fade-in" style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>{text.code}</label>
                <input
                  className="dev-input"
                  type="text"
                  inputMode="numeric"
                  placeholder={text.codePlaceholder}
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  required
                  autoFocus
                />
              </div>
            )}

            {!showRefCode ? (
              <div className="auth-portal__ref-toggle-container">
                <button
                  type="button"
                  className="auth-portal__ref-toggle"
                  onClick={() => setShowRefCode(true)}
                >
                  + {text.refCode}
                </button>
              </div>
            ) : (
              <div className="dev-input-group anim-fade-in" style={{ marginTop: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '8px' }}>{text.refCode}</label>
                <input
                  className="dev-input"
                  type="text"
                  placeholder={text.refCodePlaceholder}
                  value={refCode}
                  onChange={(event) => setRefCode(event.target.value)}
                />
                {refStatus === "valid" ? (
                  <p className="auth-portal__ref-status auth-portal__ref-status--success">{text.refCodeApplied} {refPartner}</p>
                ) : null}
                {refStatus === "invalid" ? (
                  <p className="auth-portal__ref-status auth-portal__ref-status--error">{text.refCodeInvalid}</p>
                ) : null}
              </div>
            )}

            {!codeRequested ? (
              <button
                type="button"
                className="dev-btn dev-btn--primary auth-portal__submit-btn"
                disabled={sendingCode || !form.username}
                onClick={() => void handleSendCode()}
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                {sendingCode ? text.sendingCode : text.sendCode}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  className="dev-btn dev-btn--primary auth-portal__submit-btn"
                  disabled={loading || !form.code}
                  style={{ width: '100%' }}
                >
                  {loading ? text.signingIn : text.loginAction}
                </button>
                <button
                  type="button"
                  className="auth-portal__resend-btn"
                  disabled={sendingCode}
                  onClick={() => void handleSendCode()}
                >
                  {sendingCode ? text.sendingCode : (language === "ru" ? "Отправить код повторно" : "Resend confirmation code")}
                </button>
              </div>
            )}
          </form>

          {message ? (
            <div className="alert alert--success auth-portal__alert" style={{ marginTop: '1.25rem' }}>{message}</div>
          ) : null}
          {error ? (
            <div className="alert auth-portal__alert" style={{ marginTop: '1.25rem' }}>{error}</div>
          ) : null}

          <p className="auth-portal__disclaimer-text">
            {text.termsDisclaimer}
          </p>

          <div className="auth-portal__footer-actions">
             {initData ? (
                <button
                  type="button"
                  className="dev-btn dev-btn--secondary auth-portal__action-btn"
                  disabled={loading}
                  onClick={() => void performTelegramAuth()}
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  {loading ? text.signingIn : text.continueTelegram}
                </button>
             ) : (
                <div className="auth-portal__bot-hint-box">
                  <p className="auth-portal__hint-text">{text.browserHint}</p>
                  <a href={BOT_URL} target="_blank" rel="noreferrer" className="auth-portal__bot-link">
                    <TelegramIcon size={14} />
                    <span>{text.openBot}</span>
                  </a>
                </div>
             )}
          </div>
        </div>

        {DEV_AUTH_ENABLED ? (
          <div className="dev-portal__locked-state auth-portal__dev-panel">
            <form className="dev-form auth-portal__dev-form" onSubmit={handleDevSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
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
              <button type="submit" className="dev-btn dev-btn--secondary auth-portal__dev-submit" disabled={loading} style={{ padding: '10px 16px' }}>
                {loading ? '...' : 'Dev'}
              </button>
            </form>
          </div>
        ) : null}

        <footer className="auth-portal__footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
           <Link to="/" className="auth-portal__landing-link" style={{ textDecoration: 'none' }}>{text.landing}</Link>
        </footer>
      </div>
    </main>
  );
}
