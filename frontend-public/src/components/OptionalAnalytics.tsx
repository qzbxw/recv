"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

function subscribeToConsentChange(callback: () => void) {
  window.addEventListener("recv-consent-changed", callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("recv-consent-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

function getConsentSnapshot() {
  return localStorage.getItem("recv_analytics_consent");
}

function getServerConsentSnapshot() {
  return null;
}

export function OptionalAnalytics({
  gtmId,
  yandexMetrikaId,
}: {
  gtmId?: string;
  yandexMetrikaId?: string;
}) {
  const consent = useSyncExternalStore(
    subscribeToConsentChange,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  const gtm = gtmId?.trim();
  const yandex = yandexMetrikaId?.trim();

  // If consent is not explicitly "accepted", do not load optional analytics
  if (consent !== "accepted") return null;
  if (!gtm && !yandex) return null;

  return (
    <>
      {gtm ? (
        <Script id="recv-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}
      {yandex ? (
        <Script id="recv-yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${yandex}','ym');
ym(${JSON.stringify(yandex)},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
        </Script>
      ) : null}
      {yandex ? (
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://mc.yandex.ru/watch/${yandex}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
      ) : null}
    </>
  );
}
