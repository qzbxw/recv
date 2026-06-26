"use client";

import { use, useEffect } from "react";
import { normalizeLocale } from "@/i18n";

export default function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = use(props.params);
  const lang = normalizeLocale(locale);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.replace("https://t.me/recvmoney");
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const title = lang === "ru" ? "Перенаправление..." : "Redirecting...";
  const subtitle =
    lang === "ru"
      ? "Мы перенаправляем вас на наш Telegram-канал @recvmoney."
      : "We are redirecting you to our Telegram channel @recvmoney.";
  const buttonText = lang === "ru" ? "Открыть Telegram" : "Open Telegram";

  return (
    <>
      <title>{lang === "ru" ? "Telegram-канал recv" : "recv Telegram Channel"}</title>
      <meta name="robots" content="noindex, nofollow" />
      <main
        className="co-page"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
          background: "#030303",
          color: "#f7f3ea",
        }}
      >
        <div className="co-aura co-aura--1" />
        <div className="co-aura co-aura--2" />

        <section
          className="co-card"
          style={{
            maxWidth: "480px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem",
            padding: "3rem 2rem",
          }}
        >
          <div
            className="co-spinner"
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid rgba(255, 255, 255, 0.05)",
              borderTopColor: "#8b5cf6",
              borderRadius: "50%",
              animation: "co-spin 1s linear infinite",
            }}
          />

          <div>
            <h1
              className="co-title"
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              {title}
            </h1>
            <p style={{ color: "#9da3ab", fontSize: "0.95rem", lineHeight: 1.5 }}>
              {subtitle}
            </p>
          </div>

          <a
            href="https://t.me/recvmoney"
            className="co-btn co-btn--primary"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              padding: "0.75rem 2rem",
              borderRadius: "9999px",
              background: "#8b5cf6",
              color: "#ffffff",
              fontWeight: 600,
              transition: "background 0.2s",
            }}
          >
            {buttonText}
          </a>
        </section>

        <style jsx global>{`
          @keyframes co-spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </main>
    </>
  );
}
