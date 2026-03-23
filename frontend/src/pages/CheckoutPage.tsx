import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { fetchPublicInvoice } from "../lib/api";
import type { Invoice } from "../lib/types";
import { useUI } from "../lib/ui";

const BOT_URL = "https://t.me/reqstxyzbot";

const COPY = {
  ru: {
    eyebrow: "Buyer Checkout",
    loading: "Загружаем инвойс...",
    status: "Статус",
    timeLeft: "Осталось",
    expired: "Истёк",
    network: "Сеть",
    wallet: "Адрес кошелька",
    amount: "Точная сумма",
    comment: "Comment / payload",
    expires: "Истекает",
    expiresAt: "До",
    copyAddress: "Скопировать адрес",
    copyComment: "Скопировать payload",
    scanTitle: "Сканируй и плати",
    warning: "Переводи только точную сумму на точную сеть. Если таймер истёк — попроси новый инвойс.",
    stepsTitle: "Как оплатить",
    payloadTitle: "Обязательный comment / payload",
    payloadHint: "Для TON его нужно вставить без единого изменения, иначе автоподтверждение может не сработать.",
    qrLoading: "Готовим QR...",
    qrFallback: "Если QR не открылся, используй адрес и payload справа.",
    paymentRequest: "Платёжный запрос",
    brandLabel: "Платформа",
    steps: [
      "Открой нужную сеть и проверь адрес.",
      "Отправь точную сумму, которую видишь на экране.",
      "Если есть comment/payload для TON — скопируй его без изменений.",
    ],
    light: "Свет",
    dark: "Тьма",
    ru: "РУ",
    en: "EN",
  },
  en: {
    eyebrow: "Buyer Checkout",
    loading: "Loading invoice...",
    status: "Status",
    timeLeft: "Time left",
    expired: "Expired",
    network: "Network",
    wallet: "Wallet address",
    amount: "Exact amount",
    comment: "Comment / payload",
    expires: "Expires",
    expiresAt: "Until",
    copyAddress: "Copy address",
    copyComment: "Copy payload",
    scanTitle: "Scan and pay",
    warning: "Send only the exact amount on the exact network. If the timer is over, ask the seller for a fresh invoice.",
    stepsTitle: "How to pay",
    payloadTitle: "Required comment / payload",
    payloadHint: "For TON, paste it exactly as shown or automatic matching may fail.",
    qrLoading: "Preparing QR...",
    qrFallback: "If the QR does not open, use the address and payload shown here.",
    paymentRequest: "Payment request",
    brandLabel: "Platform",
    steps: [
      "Open the correct network and verify the wallet address.",
      "Send the exact amount shown on this screen.",
      "If TON requires a comment or payload, copy it exactly as shown.",
    ],
    light: "Light",
    dark: "Dark",
    ru: "RU",
    en: "EN",
  },
} as const;

const STATUS_LABELS = {
  ru: {
    awaiting_payment: "Ждёт оплату",
    paid: "Оплачен",
    expired: "Истёк",
    underpaid: "Недоплата",
    manual_review: "Ручная проверка",
    draft: "Черновик",
  },
  en: {
    awaiting_payment: "Awaiting payment",
    paid: "Paid",
    expired: "Expired",
    underpaid: "Underpaid",
    manual_review: "Manual review",
    draft: "Draft",
  },
} as const;

function fallbackPaymentURI(invoice: Invoice) {
  if (invoice.payable_network === "TON") {
    const amount = Math.round(Number(invoice.payable_amount) * 1_000_000_000);
    const comment = invoice.payment_comment ? `&text=${encodeURIComponent(invoice.payment_comment)}` : "";
    return `ton://transfer/${invoice.destination_address}?amount=${amount}${comment}`;
  }
  return [invoice.destination_address, invoice.payment_comment, `${invoice.payable_amount} ${invoice.payable_network}`].filter(Boolean).join("\n");
}

function formatStatus(language: keyof typeof STATUS_LABELS, status: string) {
  return STATUS_LABELS[language][status as keyof (typeof STATUS_LABELS)[typeof language]] ?? status.replaceAll("_", " ");
}

export function CheckoutPage() {
  const { publicId = "" } = useParams();
  const { language, theme, setLanguage, setTheme } = useUI();
  const text = COPY[language];
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await fetchPublicInvoice(publicId);
        if (!active) {
          return;
        }
        setInvoice(result);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }
        setError((err as Error).message);
      }
    }

    void load();
    const poll = window.setInterval(load, 10000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [publicId]);

  useEffect(() => {
    if (!invoice) {
      setQrDataUrl("");
      return;
    }

    const source = invoice.payment_uri || fallbackPaymentURI(invoice);

    void QRCode.toDataURL(source, {
      width: 360,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: theme === "dark" ? "#f7f3ea" : "#14181b",
        light: theme === "dark" ? "#050505" : "#fffaf4",
      },
    })
      .then(setQrDataUrl)
      .catch(async () => {
        try {
          const fallback = await QRCode.toDataURL(fallbackPaymentURI(invoice), {
            width: 360,
            margin: 1,
            errorCorrectionLevel: "M",
            color: {
              dark: theme === "dark" ? "#f7f3ea" : "#14181b",
              light: theme === "dark" ? "#050505" : "#fffaf4",
            },
          });
          setQrDataUrl(fallback);
        } catch {
          setQrDataUrl("");
        }
      });
  }, [invoice, theme]);

  const timeLeft = useMemo(() => {
    if (!invoice) {
      return "00:00";
    }
    const diff = new Date(invoice.expires_at).getTime() - now;
    if (diff <= 0) {
      return text.expired;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [invoice, now, text.expired]);

  const title = invoice?.title?.trim() || text.paymentRequest;
  const statusLabel = invoice ? formatStatus(language, invoice.status) : "";

  return (
    <main className="shell checkout-shell checkout-shell--wide">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="topbar topbar--checkout">
        <div className="topbar-brand">
          <span className="eyebrow">{text.eyebrow}</span>
          <a className="brand-link" href={BOT_URL} target="_blank" rel="noreferrer">
            <strong>reqst</strong>
            <span>{text.brandLabel} · t.me/reqstxyzbot</span>
          </a>
        </div>
        <div className="topbar-actions">
          <div className="toggle-shell">
            <span className="toggle-caption">Lang</span>
            <div className="toggle-group" role="group" aria-label="language">
              <button type="button" className={language === "ru" ? "toggle active" : "toggle"} onClick={() => setLanguage("ru")}>
                {text.ru}
              </button>
              <button type="button" className={language === "en" ? "toggle active" : "toggle"} onClick={() => setLanguage("en")}>
                {text.en}
              </button>
            </div>
          </div>
          <div className="toggle-shell">
            <span className="toggle-caption">Theme</span>
            <div className="toggle-group" role="group" aria-label="theme">
              <button type="button" className={theme === "light" ? "toggle active" : "toggle"} onClick={() => setTheme("light")}>
                {text.light}
              </button>
              <button type="button" className={theme === "dark" ? "toggle active" : "toggle"} onClick={() => setTheme("dark")}>
                {text.dark}
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="checkout-card checkout-card--lux">
        {error ? <div className="alert">{error}</div> : null}
        {!invoice ? <p className="muted">{text.loading}</p> : null}

        {invoice ? (
          <>
            <div className="checkout-billboard">
              <div className="billboard-copy">
                <h1>{title}</h1>
                <p className="hero-copy">{text.warning}</p>

                <div className="billboard-grid">
                  <div className="billboard-pill">
                    <span>{text.status}</span>
                    <strong className={`status-${invoice.status}`}>{statusLabel}</strong>
                  </div>
                  <div className="billboard-pill billboard-pill--timer">
                    <span>{text.timeLeft}</span>
                    <strong>{timeLeft}</strong>
                    <small>{text.expiresAt}: {new Date(invoice.expires_at).toLocaleString()}</small>
                  </div>
                  <div className="billboard-pill">
                    <span>{text.network}</span>
                    <strong>{invoice.payable_network}</strong>
                  </div>
                </div>
              </div>

              <div className="amount-totem">
                <span>{text.amount}</span>
                <strong>{invoice.payable_amount}</strong>
                <p>{invoice.payable_network}</p>
              </div>
            </div>

            <div className="checkout-grid checkout-grid--lux">
              <article className="panel elevated-panel">
                <div className="panel-header">
                  <h2>{text.stepsTitle}</h2>
                </div>
                <ol className="step-list">
                  {text.steps.map((step, index) => (
                    <li key={step} className="step-item">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>

                <div className="detail-row">
                  <span>{text.wallet}</span>
                  <code>{invoice.destination_address}</code>
                  <button type="button" className="ghost-button compact-button detail-copy" onClick={() => navigator.clipboard.writeText(invoice.destination_address)}>
                    {text.copyAddress}
                  </button>
                </div>
                <div className="detail-row">
                  <span>{text.amount}</span>
                  <code>{invoice.payable_amount} {invoice.payable_network}</code>
                </div>
                {invoice.payment_comment ? (
                  <div className="payload-callout">
                    <div className="payload-head">
                      <div>
                        <span>{text.payloadTitle}</span>
                        <p>{text.payloadHint}</p>
                      </div>
                      <button type="button" className="ghost-button compact-button" onClick={() => navigator.clipboard.writeText(invoice.payment_comment ?? "")}>
                        {text.copyComment}
                      </button>
                    </div>
                    <code>{invoice.payment_comment}</code>
                  </div>
                ) : null}
                <div className="detail-row">
                  <span>{text.expires}</span>
                  <code>{new Date(invoice.expires_at).toLocaleString()}</code>
                </div>
              </article>

              <aside className="panel qr-stage">
                <div className="panel-header">
                  <h2>{text.scanTitle}</h2>
                </div>
                <div className="qr-shell">
                  <div className="qr-frame">
                    {qrDataUrl ? <img className="qr-image qr-image--lux" src={qrDataUrl} alt="Invoice QR" /> : <p className="muted">{text.qrLoading}</p>}
                  </div>
                </div>
                <p className="muted center-text">{text.qrFallback}</p>
              </aside>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
