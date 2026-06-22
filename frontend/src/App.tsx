import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { UIProvider, useUI } from "./lib/ui";
import { getStoredToken } from "./lib/api";
import { captureAttribution, installUTMLinkClickTracking, trackUTMPageView } from "./lib/attribution";
import { buildAuthHref, isOAuthSessionReturn } from "./lib/routing";

const AdminBlogPage = lazy(() => import("./pages/AdminBlogPage").then((module) => ({ default: module.AdminBlogPage })));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const AuthPortalPage = lazy(() => import("./pages/AuthPortalPage").then((module) => ({ default: module.AuthPortalPage })));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));
const DeveloperDocsPage = lazy(() => import("./pages/DeveloperDocsPage").then((module) => ({ default: module.DeveloperDocsPage })));
const DeveloperPortalPage = lazy(() => import("./pages/DeveloperPortalPage").then((module) => ({ default: module.DeveloperPortalPage })));
const SellerConsolePage = lazy(() => import("./pages/SellerConsolePage").then((module) => ({ default: module.SellerConsolePage })));
const LegalPage = lazy(() => import("./pages/LegalPage").then((module) => ({ default: module.LegalPage })));

// Public pages are now served by Next.js at frontend-public.
// Vite SPA is mapped to /app/ namespace via Nginx.

const PAGE_TITLES = {
  ru: {
    auth: "recv | Вход",
    admin: "recv | Админ",
    blog: "recv | Управление блогом",
    console: "recv | Консоль",
    developers: "recv | Портал разработчика",
    docs: "recv | Документация API",
    checkout: "recv | Оплата",
    privacy: "recv | Политика конфиденциальности",
    terms: "recv | Условия использования",
    dpa: "recv | Соглашение DPA",
    subprocessors: "recv | Список субподрядчиков",
    fallback: "recv",
  },
  en: {
    auth: "recv | Sign In",
    admin: "recv | Admin",
    blog: "recv | Blog Management",
    console: "recv | Console",
    developers: "recv | Developer Portal",
    docs: "recv | API Documentation",
    checkout: "recv | Checkout",
    privacy: "recv | Privacy Policy",
    terms: "recv | Terms of Service",
    dpa: "recv | Data Processing Addendum (DPA)",
    subprocessors: "recv | Subprocessors List",
    fallback: "recv",
  },
} as const;

function RouteTitleManager() {
  const location = useLocation();
  const { language } = useUI();

  useEffect(() => {
    const titles = PAGE_TITLES[language as "ru" | "en"];
    const path = location.pathname;
    let title: string = titles.fallback;

    if (path === "/auth") {
      title = titles.auth;
    } else if (path === "/admin") {
      title = titles.admin;
    } else if (path === "/admin/blog") {
      title = titles.blog;
    } else if (path === "/console") {
      title = titles.console;
    } else if (path === "/developers") {
      title = titles.docs;
    } else if (path === "/developer-portal") {
      title = titles.developers;
    } else if (path === "/privacy") {
      title = titles.privacy;
    } else if (path === "/terms") {
      title = titles.terms;
    } else if (path === "/dpa") {
      title = titles.dpa;
    } else if (path === "/subprocessors") {
      title = titles.subprocessors;
    } else if (path.startsWith("/checkout/")) {
      title = titles.checkout;
    }

    document.title = title;
  }, [language, location.pathname]);

  return null;
}

function ProtectedConsoleRoute() {
  const location = useLocation();
  const token = getStoredToken();

  if (!token && !isOAuthSessionReturn(location.search)) {
    const nextPath = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate replace to={buildAuthHref(nextPath)} />;
  }

  return <SellerConsolePage />;
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    const ua = navigator.userAgent;
    const isWebView = /\bwv\b|Telegram|FBAN|FBAV|Instagram|Line\//i.test(ua);
    const isCoarsePointer = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    document.documentElement.dataset.lowPowerUi = isWebView || isCoarsePointer ? "true" : "false";
  }, []);

  useEffect(() => {
    captureAttribution();
  }, [location.pathname, location.search]);

  useEffect(() => installUTMLinkClickTracking(), []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    const timer = window.setTimeout(() => trackUTMPageView(path, document.title), 0);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <UIProvider>
      <RouteTitleManager />
      <Suspense fallback={<main className="shell"><p className="muted">Loading...</p></main>}>
        <Routes>
          {/* Main Redirect from root of SPA if somehow accessed */}
          <Route path="/" element={<Navigate to="/console" replace />} />
          
          <Route path="/auth" element={<AuthPortalPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/blog" element={<AdminBlogPage />} />
          <Route path="/console" element={<ProtectedConsoleRoute />} />
          <Route path="/developers" element={<DeveloperDocsPage />} />
          <Route path="/developer-portal" element={<DeveloperPortalPage />} />
          
          <Route path="/checkout/:publicId" element={<CheckoutPage />} />
          
          <Route path="/privacy" element={<LegalPage variant="privacy" />} />
          <Route path="/terms" element={<LegalPage variant="terms" />} />
          <Route path="/dpa" element={<LegalPage variant="dpa" />} />
          <Route path="/subprocessors" element={<LegalPage variant="subprocessors" />} />

          {/* All other routes redirect to the main public landing (handled by Next.js) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </UIProvider>
  );
}
