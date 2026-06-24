"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function CookieConsent({ language }: { language: "ru" | "en" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("recv_analytics_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("recv_analytics_consent", "accepted");
    window.dispatchEvent(new Event("recv-consent-changed"));
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("recv_analytics_consent", "rejected");
    window.dispatchEvent(new Event("recv-consent-changed"));
    setVisible(false);
  };

  if (!visible) return null;

  const content = {
    en: {
      text: "We use strictly necessary cookies to keep you authenticated, and optional analytics to measure site performance and usage. We do not sell your data.",
      accept: "Accept All",
      decline: "Decline Optional",
      privacy: "Privacy Policy",
    },
    ru: {
      text: "Мы используем необходимые файлы cookie для авторизации, а также дополнительные аналитические инструменты для измерения производительности. Мы не продаем ваши данные.",
      accept: "Принять всё",
      decline: "Отклонить необязательные",
      privacy: "Политика конфиденциальности",
    },
  }[language];

  return (
    <div className="fixed bottom-3 left-3 right-3 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-[100] p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-2xl flex flex-col gap-3 md:gap-4 max-h-[36vh] overflow-auto">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-white font-['Montserrat'] uppercase tracking-wider">
          {language === "ru" ? "Использование Cookie" : "Cookie Settings"}
        </h3>
        <p className="hidden md:block text-xs text-white/70 leading-relaxed">
          {content.text}{" "}
          <Link
            href={`/${language}/privacy`}
            className="text-accent hover:underline font-medium"
          >
            {content.privacy}
          </Link>
          .
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="flex-1 px-3 md:px-4 py-2 text-[11px] md:text-xs font-semibold rounded-xl bg-accent text-white hover:bg-accent/80 transition-colors cursor-pointer"
        >
          {content.accept}
        </button>
        <button
          onClick={handleDecline}
          className="px-3 md:px-4 py-2 text-[11px] md:text-xs font-semibold rounded-xl border border-white/10 hover:bg-white/[0.05] text-white/75 hover:text-white transition-colors cursor-pointer"
        >
          {content.decline}
        </button>
      </div>
    </div>
  );
}
