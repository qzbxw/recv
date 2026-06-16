module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},14747,(e,t,r)=>{t.exports=e.x("path",()=>require("path"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},22734,(e,t,r)=>{t.exports=e.x("fs",()=>require("fs"))},874,(e,t,r)=>{t.exports=e.x("buffer",()=>require("buffer"))},50709,e=>{"use strict";var t=e.i(22734),r=e.i(14747),n=e.i(37446),a=e.i(12931);let s=["","/dev","/merchant","/business","/security","/about","/contact","/integrations","/customers","/changelog","/help","/privacy","/terms","/blog","/blog/author/recv-core","/status","/pricing","/products","/products/checkout","/products/invoicing","/products/api","/products/mcp","/networks","/networks/ton","/networks/ton_usdt","/networks/tron","/networks/solana","/networks/base","/networks/arbitrum","/networks/bsc","/use-cases","/use-cases/telegram-shops","/use-cases/saas-billing","/use-cases/digital-goods","/use-cases/paid-communities","/compare","/compare/nowpayments","/compare/recv-vs-manual","/compare/recv-vs-custodial","/compare/coinbase-commerce","/compare/bitpay","/compare/coingate","/compare/cryptomus"];function o(){return(process.env.NEXT_PUBLIC_SITE_URL||process.env.PUBLIC_APP_URL||"https://recv.money").replace(/\/+$/,"")}function i(e){return e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;")}e.s(["PUBLIC_ROUTES",0,s,"SITEMAP_PAGE_SIZE",0,5e4,"backendApiUrl",0,function(){return(process.env.BACKEND_INTERNAL_URL||process.env.NEXT_PUBLIC_API_URL||"http://api:8080").replace(/\/+$/,"")},"documentationEntries",0,function(e){let s=o();return(e?[e]:n.LOCALES).flatMap(e=>(0,a.getAllDocSlugs)(e).map(a=>{let o=`/docs/${a.join("/")}`,i=n.LOCALES.filter(e=>t.default.existsSync(r.default.join(process.cwd(),"content","docs",e,...a)+".mdx")),l=Object.fromEntries(i.map(e=>[e,`${s}/${e}${o}`]));return i.includes("en")&&(l["x-default"]=`${s}/en${o}`),{url:`${s}/${e}${o}`,alternates:l}}))},"isNonSelfCanonical",0,function(e,t){if(!e)return!1;try{let r=new URL(e,o()),n=new URL(t,o());return r.origin!==n.origin||r.pathname.replace(/\/+$/,"")!==n.pathname.replace(/\/+$/,"")}catch{return!0}},"publicPageEntries",0,function(e){let t=o();return(e?[e]:n.LOCALES).flatMap(e=>s.map(r=>({url:`${t}/${e}${r}`,alternates:{en:`${t}/en${r}`,ru:`${t}/ru${r}`,"x-default":`${t}/en${r}`}})))},"publicSiteUrl",0,o,"renderSitemap",0,function(e){let t=e.map(e=>{let t=Object.entries(e.alternates??{}).map(([e,t])=>`    <xhtml:link rel="alternate" hreflang="${i(e)}" href="${i(t)}" />`).join("\n");return["  <url>",`    <loc>${i(e.url)}</loc>`,e.lastModified?`    <lastmod>${i(e.lastModified)}</lastmod>`:"",t,"  </url>"].filter(Boolean).join("\n")}).join("\n");return`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${t}
</urlset>
`},"renderSitemapIndex",0,function(e){let t=e.map(e=>["  <sitemap>",`    <loc>${i(e.url)}</loc>`,e.lastModified?`    <lastmod>${i(e.lastModified)}</lastmod>`:"","  </sitemap>"].filter(Boolean).join("\n")).join("\n");return`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${t}
</sitemapindex>
`},"robotsBody",0,function(){return`# Content signals (search, AI input, AI training) are all allowed.
User-agent: *
Allow: /
Disallow: /app/
Disallow: /api/
Disallow: /v1/
Disallow: /internal/

User-agent: ClaudeBot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Amazonbot
Allow: /

Sitemap: ${o()}/sitemap.xml
`},"textResponse",0,function(e,t="text/plain"){return new Response(e,{headers:{"Content-Type":`${t}; charset=utf-8`,"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400","X-Robots-Tag":"noindex"}})},"xmlResponse",0,function(e,t=3600){return new Response(e,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":`public, s-maxage=${t}, stale-while-revalidate=86400`}})}])},69569,e=>{"use strict";var t=e.i(47909),r=e.i(74017),n=e.i(96250),a=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),l=e.i(16795),c=e.i(87718),u=e.i(95169),p=e.i(47587),d=e.i(66012),m=e.i(70101),h=e.i(74838),x=e.i(10372),g=e.i(93695);e.i(20232);var v=e.i(220),f=e.i(12931),w=e.i(50709);function R(e,t){return w.PUBLIC_ROUTES.filter(e=>e.startsWith(t)).map(t=>{let r=t.split("/").filter(Boolean).at(-1)||"Home";return`- [${r.replaceAll("-"," ")}](${e}/en${t})`}).join("\n")}async function A(){let e=(0,w.publicSiteUrl)(),t=`# recv

> recv is non-custodial cryptocurrency payment infrastructure for merchants, SaaS products, Telegram businesses, developers, and AI agents. Payments settle directly to merchant-controlled wallets.

recv provides hosted checkout, invoicing, a REST API, signed webhooks, blockchain payment detection, and an MCP server. The canonical website is ${e}.

## Products
${R(e,"/products/")}

## Supported networks
${R(e,"/networks/")}

## Use cases
${R(e,"/use-cases/")}

## Developer documentation
${(0,f.getAllDocSlugs)("en").map(t=>{let r=t.join("/"),n=(0,f.getDocBySlug)(t,"en"),a=String(n?.data.title||r),s=String(n?.data.description||"").trim();return`- [${a}](${e}/en/docs/raw/${r})${s?`: ${s}`:""}`}).join("\n")}

## Machine-readable resources
- [OpenAPI specification](${e}/openapi.json): Current REST API schema.
- [Full LLM documentation](${e}/llms-full.txt): Combined English product and developer documentation.
- [Human-readable documentation](${e}/en/docs/introduction): Rendered documentation entry point.
- [RSS feed](${e}/en/rss.xml): English product and engineering updates.
- [Sitemap index](${e}/sitemap.xml): Canonical indexable pages.

## Authentication
The developer API is rooted at ${e}/v1. Authenticate with an API key in the \`X-API-Key\` header. Never place API keys in URLs or public prompts.

## Optional
- [Pricing](${e}/en/pricing): Current plans and product availability.
- [Security](${e}/en/security): Security and non-custodial architecture.
- [Status](${e}/en/status): Service and network status.
`;return(0,w.textResponse)(t)}e.s(["GET",0,A],30214);var $=e.i(30214);let E=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/llms.txt/route",pathname:"/llms.txt",filename:"route",bundlePath:""},distDir:".next_user",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/llms.txt/route.ts",nextConfigOutput:"standalone",userland:$,...{}}),{workAsyncStorage:b,workUnitAsyncStorage:y,serverHooks:C}=E;async function S(e,t,n){n.requestMeta&&(0,a.setRequestMeta)(e,n.requestMeta),E.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let f="/llms.txt/route";f=f.replace(/\/index$/,"")||"/";let w=await E.prepare(e,t,{srcPage:f,multiZoneDraftMode:!1});if(!w)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:R,params:A,nextConfig:$,parsedUrl:b,isDraftMode:y,prerenderManifest:C,routerServerContext:S,isOnDemandRevalidate:P,revalidateOnlyGenerated:T,resolvedPathname:U,clientReferenceManifest:k,serverActionsManifest:_}=w,I=(0,i.normalizeAppPath)(f),N=!!(C.dynamicRoutes[I]||C.routes[U]),O=async()=>((null==S?void 0:S.render404)?await S.render404(e,t,b,!1):t.end("This page could not be found"),null);if(N&&!y){let e=!!C.routes[U],t=C.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if($.adapterPath)return await O();throw new g.NoFallbackError}}let j=null;!N||E.isDev||y||(j="/index"===(j=U)?"/":j);let q=!0===E.isDev||!N,L=N&&!q;_&&k&&(0,o.setManifestsSingleton)({page:f,clientReferenceManifest:k,serverActionsManifest:_});let M=e.method||"GET",D=(0,s.getTracer)(),B=D.getActiveScopeSpan(),H=!!(null==S?void 0:S.isWrappedByNextServer),F=!!(0,a.getRequestMeta)(e,"minimalMode"),K=(0,a.getRequestMeta)(e,"incrementalCache")||await E.getIncrementalCache(e,$,C,F);null==K||K.resetRequestCache(),globalThis.__incrementalCache=K;let G={params:A,previewProps:C.preview,renderOpts:{experimental:{authInterrupts:!!$.experimental.authInterrupts},cacheComponents:!!$.cacheComponents,supportsDynamicResponse:q,incrementalCache:K,cacheLifeProfiles:$.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,n,a)=>E.onRequestError(e,t,n,a,S)},sharedContext:{buildId:R}},X=new l.NodeNextRequest(e),W=new l.NodeNextResponse(t),V=c.NextRequestAdapter.fromNodeNextRequest(X,(0,c.signalFromNodeResponse)(t));try{let a,o=async e=>E.handle(V,G).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=D.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=r.get("next.route");if(n){let t=`${M} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t),a&&a!==e&&(a.setAttribute("http.route",n),a.updateName(t))}else e.updateName(`${M} ${f}`)}),i=async a=>{var s,i;let l=async({previousCacheEntry:r})=>{try{if(!F&&P&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(a);e.fetchMetrics=G.renderOpts.fetchMetrics;let i=G.renderOpts.pendingWaitUntil;i&&n.waitUntil&&(n.waitUntil(i),i=void 0);let l=G.renderOpts.collectedTags;if(!N)return await (0,d.sendResponse)(X,W,s,G.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[x.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==G.renderOpts.collectedRevalidate&&!(G.renderOpts.collectedRevalidate>=x.INFINITE_CACHE)&&G.renderOpts.collectedRevalidate,n=void 0===G.renderOpts.collectedExpire||G.renderOpts.collectedExpire>=x.INFINITE_CACHE?void 0:G.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:n}}}}catch(t){throw(null==r?void 0:r.isStale)&&await E.onRequestError(e,t,{routerKind:"App Router",routePath:f,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:P})},!1,S),t}},c=await E.handleResponse({req:e,nextConfig:$,cacheKey:j,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:P,revalidateOnlyGenerated:T,responseGenerator:l,waitUntil:n.waitUntil,isMinimalMode:F});if(!N)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(i=c.value)?void 0:i.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});F||t.setHeader("x-nextjs-cache",P?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),y&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let u=(0,m.fromNodeOutgoingHttpHeaders)(c.value.headers);return F&&N||u.delete(x.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||u.get("Cache-Control")||u.set("Cache-Control",(0,h.getCacheControlHeader)(c.cacheControl)),await (0,d.sendResponse)(X,W,new Response(c.value.body,{headers:u,status:c.value.status||200})),null};H&&B?await i(B):(a=D.getActiveScopeSpan(),await D.withPropagatedContext(e.headers,()=>D.trace(u.BaseServerSpan.handleRequest,{spanName:`${M} ${f}`,kind:s.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},i),void 0,!H))}catch(t){if(t instanceof g.NoFallbackError||await E.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:P})},!1,S),N)throw t;return await (0,d.sendResponse)(X,W,new Response(null,{status:500})),null}}e.s(["handler",0,S,"patchFetch",0,function(){return(0,n.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:y})},"routeModule",0,E,"serverHooks",0,C,"workAsyncStorage",0,b,"workUnitAsyncStorage",0,y],69569)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__0hv-_r~._.js.map