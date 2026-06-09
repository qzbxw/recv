import Script from "next/script";

export function OptionalAnalytics({
  gtmId,
  yandexMetrikaId,
}: {
  gtmId?: string;
  yandexMetrikaId?: string;
}) {
  const gtm = gtmId?.trim();
  const yandex = yandexMetrikaId?.trim();

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
m[i].l=1*new Date();k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window,document,'script','https://mc.yandex.ru/metrika/tag.js','ym');
ym(${JSON.stringify(yandex)},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:false});`}
        </Script>
      ) : null}
    </>
  );
}
