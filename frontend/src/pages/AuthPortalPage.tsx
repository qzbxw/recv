import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  authenticateTelegram,
  getStoredToken,
  loginWithEmail,
  registerWithEmail,
  requestEmailRegistrationCode,
  requestPasswordResetCode,
  resetPassword,
  setStoredToken,
} from "../lib/api";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyz_bot";

type EmailMode = "login" | "register" | "reset";

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
    title: "Вход в рабочий кабинет Reqst",
    body: "Страница авторизации теперь должна не стыдить, а быстро заводить в продукт. Здесь два нормальных сценария: моментальный вход через Telegram и обычный доступ по почте с паролем.",
    telegramTitle: "Быстрый вход через Telegram",
    telegramBody: "Если вы уже внутри Telegram, вход займёт пару секунд. Если сайт открыт в браузере, сначала зайдите в бота и откройте Mini App оттуда.",
    openBot: "Открыть Telegram бота",
    continueTelegram: "Войти через Telegram",
    signingIn: "Вход в аккаунт...",
    landing: "На главную",
    console: "В панель управления",
    emailTitle: "Почта и пароль",
    emailBody: "Подходит для обычной работы из браузера: вход, регистрация и восстановление доступа собраны в одном блоке.",
    emailModes: {
      login: "Вход",
      register: "Регистрация",
      reset: "Сброс пароля",
    },
    email: "Ваш Email",
    emailPlaceholder: "name@example.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    newPassword: "Новый пароль",
    code: "Код подтверждения",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти в панель",
    registerAction: "Создать аккаунт",
    resetAction: "Сбросить пароль",
    codeSent: "Код подтверждения отправлен. Пожалуйста, проверьте папку 'Входящие' или 'Спам'.",
    asideTitle: "Что даёт кабинет",
    asideCards: [
      {
        title: "Платежи под контролем",
        body: "Создавайте инвойсы, следите за оплатой и не тратьте время на ручную сверку переводов.",
      },
      {
        title: "Один вход для всех сценариев",
        body: "Telegram удобен для быстрого старта, а почта с паролем нормальна для ежедневной работы из браузера.",
      },
      {
        title: "Тот же строгий контур",
        body: "После входа доступны кабинет продавца, интеграционный раздел и все ссылки на оплату без прыжков между разными страницами.",
      },
    ],
    asidePoints: [
      "Прямой приём оплат на ваш кошелёк.",
      "Автоматическое подтверждение статусов.",
      "Доступ к Dev и Enterprise из того же аккаунта.",
    ],
    browserHint: "Если вы в браузере, используйте почту или сначала откройте Mini App через бота.",
  },
  en: {
    title: "Sign in to reqst",
    body: "Use Telegram or email/password. Both methods can belong to the same account once you link them in the profile.",
    telegramTitle: "Telegram",
    telegramBody: "Telegram sign-in works only from inside Telegram itself. If you opened the site in a browser, open the bot first and launch the Mini App from there.",
    openBot: "Open Bot",
    continueTelegram: "Login with Telegram",
    signingIn: "Signing in...",
    landing: "Back to Home",
    console: "Open Console",
    emailTitle: "Email + password",
    emailBody: "Regular email sign-in without relying only on Telegram.",
    emailModes: {
      login: "Login",
      register: "Sign up",
      reset: "Reset",
    },
    email: "Email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "At least 8 characters",
    newPassword: "New password",
    code: "Email code",
    codePlaceholder: "123456",
    sendCode: "Send code",
    sendingCode: "Sending...",
    loginAction: "Login",
    registerAction: "Create account",
    resetAction: "Reset password",
    codeSent: "Code sent. Check your inbox and finish the flow in this form.",
    asideTitle: "What the account unlocks",
    asideCards: [
      {
        title: "Payments under control",
        body: "Create invoices, track incoming transfers, and avoid manual verification work.",
      },
      {
        title: "One account for both paths",
        body: "Telegram is fast inside the app, while email and password work cleanly in the browser.",
      },
      {
        title: "A stricter working surface",
        body: "The same account gives access to the seller console, the integration portal, and billing links.",
      },
    ],
    asidePoints: [
      "Direct-to-wallet payment intake.",
      "Automatic status confirmation.",
      "Dev and Enterprise access from the same account.",
    ],
    browserHint: "If you are in a browser, use email or open the Mini App from the bot first.",
  },
} as const;

export function AuthPortalPage() {
  const navigate = useNavigate();
  const { language } = useUI();
  const text = COPY[language];
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [emailMode, setEmailMode] = useState<EmailMode>("login");
  const [form, setForm] = useState({
    email: "",
    password: "",
    code: "",
    newPassword: "",
  });
  const hasSession = Boolean(getStoredToken());
  const [initData, setInitData] = useState(window.Telegram?.WebApp?.initData || "");

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
      navigate("/console", { replace: true });
    }
  }, [hasSession, navigate]);

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
      navigate("/console");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      setLoading(true);
      setError("");
      setMessage("");

      if (emailMode === "login") {
        const result = await loginWithEmail({
          email: form.email.trim(),
          password: form.password,
        });
        setStoredToken(result.token);
        navigate("/console");
        return;
      }

      if (emailMode === "register") {
        const result = await registerWithEmail({
          email: form.email.trim(),
          code: form.code.trim(),
          password: form.password,
        });
        setStoredToken(result.token);
        navigate("/console");
        return;
      }

      const result = await resetPassword({
        email: form.email.trim(),
        code: form.code.trim(),
        new_password: form.newPassword,
      });
      setStoredToken(result.token);
      navigate("/console");
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

      if (emailMode === "register") {
        await requestEmailRegistrationCode({ email: form.email.trim() });
      } else {
        await requestPasswordResetCode({ email: form.email.trim() });
      }

      setMessage(text.codeSent);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  }

  function setMode(mode: EmailMode) {
    setEmailMode(mode);
    setError("");
    setMessage("");
  }

  const emailActionLabel = emailMode === "login"
    ? text.loginAction
    : emailMode === "register"
      ? text.registerAction
      : text.resetAction;

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
          <div className="auth-portal__grid">
            <aside className="auth-portal__aside">
              <div className="auth-portal__copy">
                <span className="plan-page__badge">Reqst Access</span>
                <h1>{text.title}</h1>
                <p>{text.body}</p>
                <p className="auth-portal__hint">{text.browserHint}</p>
              </div>

              <div className="auth-portal__aside-cards">
                {text.asideCards.map((card) => (
                  <article key={card.title} className="auth-aside-card">
                    <h2>{card.title}</h2>
                    <p>{card.body}</p>
                  </article>
                ))}
              </div>

              <div className="auth-portal__signal-list">
                <span>{text.asideTitle}</span>
                {text.asidePoints.map((item) => (
                  <article key={item} className="auth-portal__signal">
                    <span />
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </aside>

            <div className="auth-portal__cards">
            <article className="auth-card auth-card--telegram">
              <div className="auth-card__content">
                <h2>{text.telegramTitle}</h2>
                <p>{text.telegramBody}</p>
              </div>
              <div className="auth-card__actions">
                {initData ? (
                  <button
                    type="button"
                    className="lend-primary lend-primary--large"
                    disabled={loading}
                    onClick={() => void performTelegramAuth()}
                  >
                    {loading ? text.signingIn : text.continueTelegram}
                  </button>
                ) : (
                  <a className="lend-primary lend-primary--large" href={BOT_URL} target="_blank" rel="noreferrer">
                    {text.openBot}
                  </a>
                )}
                <a className="lend-secondary" href={BOT_URL} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              </div>
            </article>

            <article className="auth-card auth-card--email">
              <div className="auth-card__content">
                <h2>{text.emailTitle}</h2>
                <p>{text.emailBody}</p>
              </div>

              <div className="auth-mode-switch" role="tablist" aria-label="email auth mode">
                {(["login", "register", "reset"] as EmailMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={emailMode === mode ? "switch-pill active" : "switch-pill"}
                    onClick={() => setMode(mode)}
                  >
                    {text.emailModes[mode]}
                  </button>
                ))}
              </div>

              <form className="auth-card__form auth-card__form--stacked" onSubmit={handleEmailSubmit}>
                <label>
                  {text.email}
                  <input
                    type="email"
                    placeholder={text.emailPlaceholder}
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </label>

                {emailMode === "login" ? (
                  <label>
                    {text.password}
                    <input
                      type="password"
                      placeholder={text.passwordPlaceholder}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />
                  </label>
                ) : (
                  <>
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
                      <button type="button" className="ghost-button" disabled={sendingCode} onClick={() => void handleSendCode()}>
                        {sendingCode ? text.sendingCode : text.sendCode}
                      </button>
                    </div>

                    {emailMode === "register" ? (
                      <label>
                        {text.password}
                        <input
                          type="password"
                          placeholder={text.passwordPlaceholder}
                          value={form.password}
                          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                        />
                      </label>
                    ) : (
                      <label>
                        {text.newPassword}
                        <input
                          type="password"
                          placeholder={text.passwordPlaceholder}
                          value={form.newPassword}
                          onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                        />
                      </label>
                    )}
                  </>
                )}

                <button type="submit" className="lend-primary lend-primary--large" disabled={loading}>
                    {loading ? text.signingIn : emailActionLabel}
                  </button>
              </form>
            </article>
            </div>
          </div>

          {message ? <div className="auth-feedback auth-feedback--success">{message}</div> : null}
          {error ? <div className="alert">{error}</div> : null}
        </section>
      </div>
    </main>
  );
}
