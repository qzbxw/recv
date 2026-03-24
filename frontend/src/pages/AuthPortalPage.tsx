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
    title: "Авторизация в системе Reqst",
    body: "Моментальный доступ через Telegram или классическая связка почты и пароля для работы в браузере.",
    telegramTitle: "Вход через Telegram",
    telegramBody: "Если сайт открыт в браузере, сначала запустите Mini App через официального бота для автоматической привязки сессии.",
    openBot: "Открыть Telegram бота",
    continueTelegram: "Продолжить через Telegram",
    signingIn: "Авторизация...",
    landing: "На главную",
    console: "В панель управления",
    emailTitle: "Почта и пароль",
    emailBody: "Стандартный метод доступа для ежедневной работы из любой точки мира.",
    emailModes: {
      login: "Вход",
      register: "Регистрация",
      reset: "Сброс пароля",
    },
    email: "Email",
    emailPlaceholder: "name@example.com",
    password: "Пароль",
    passwordPlaceholder: "Минимум 8 символов",
    newPassword: "Новый пароль",
    code: "Код подтверждения",
    codePlaceholder: "123456",
    sendCode: "Получить код",
    sendingCode: "Отправка...",
    loginAction: "Войти",
    registerAction: "Зарегистрироваться",
    resetAction: "Обновить пароль",
    codeSent: "Код подтвержден и отправлен. Проверьте почту (включая папку Спам).",
    asideTitle: "Возможности аккаунта",
    asideCards: [
      {
        title: "Контроль транзакций",
        body: "Создание инвойсов, мониторинг входящих платежей и автоматическая сверка статусов.",
      },
      {
        title: "Единый профиль",
        body: "Telegram для быстрого старта и почта для штатной работы в браузере внутри одного аккаунта.",
      },
      {
        title: "Рабочий контур",
        body: "Прямой доступ к панели продавца, разделу интеграции и биллингу планов из одного окна.",
      },
    ],
    asidePoints: [
      "Прямой приём платежей на ваш кошелёк.",
      "Автоматическое подтверждение статусов.",
      "Управление Dev и Enterprise планами.",
    ],
    browserHint: "При работе из браузера рекомендуется использовать почту или Mini App.",
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

      <div className="auth-portal__grid">
        <section className="auth-portal__aside">
          <div className="auth-portal__copy">
            <span className="eyebrow">Reqst Access</span>
            <h1>{text.title}</h1>
            <p>{text.body}</p>
          </div>

          <div className="auth-portal__aside-cards">
            {text.asideCards.map((card) => (
              <article key={card.title} className="console-link-card">
                <span>Access Layer</span>
                <strong>{card.title}</strong>
                <p>{card.body}</p>
              </article>
            ))}
          </div>

          <div className="auth-portal__signal-list">
            <span>{text.asideTitle}</span>
            <div className="auth-portal__signals">
              {text.asidePoints.map((item) => (
                <article key={item} className="auth-portal__signal">
                  <span />
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="auth-portal__cards">
          <div className="auth-portal__stack">
            <article className="checkout-card checkout-card--lux auth-card--telegram">
              <div className="completion-paper-topline">
                <span className="receipt-brandline">Fast Access</span>
                <span className="completion-ticket-no">Telegram</span>
              </div>
              <div className="auth-card__content">
                <h2>{text.telegramTitle}</h2>
                <p className="hero-copy">{text.telegramBody}</p>
                <p className="auth-portal__hint">{text.browserHint}</p>
              </div>
              <div className="auth-card__actions">
                {initData ? (
                  <button
                    type="button"
                    className="lend-primary lend-primary--large"
                    style={{ width: "100%" }}
                    disabled={loading}
                    onClick={() => void performTelegramAuth()}
                  >
                    {loading ? text.signingIn : text.continueTelegram}
                  </button>
                ) : (
                  <a className="lend-primary lend-primary--large" style={{ width: "100%" }} href={BOT_URL} target="_blank" rel="noreferrer">
                    {text.openBot}
                  </a>
                )}
              </div>
            </article>

            <article className="checkout-card checkout-card--lux auth-card--email">
              <div className="completion-paper-topline">
                <span className="receipt-brandline">Standard Access</span>
                <span className="completion-ticket-no">Email</span>
              </div>
              
              <div className="auth-mode-switch" role="tablist" style={{ marginTop: "1.5rem" }}>
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

              <form className="auth-card__form form-grid" style={{ marginTop: "1.5rem" }} onSubmit={handleEmailSubmit}>
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
                    <div className="auth-inline-action" style={{ display: "grid", gap: "0.5rem" }}>
                      <label>
                        {text.code}
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder={text.codePlaceholder}
                            value={form.code}
                            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                          />
                          <button type="button" className="ghost-button compact-button" style={{ whiteSpace: "nowrap" }} disabled={sendingCode} onClick={() => void handleSendCode()}>
                            {sendingCode ? text.sendingCode : text.sendCode}
                          </button>
                        </div>
                      </label>
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

              {message ? <div className="auth-feedback auth-feedback--success" style={{ marginTop: "1rem" }}>{message}</div> : null}
              {error ? <div className="alert" style={{ marginTop: "1rem" }}>{error}</div> : null}
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}

