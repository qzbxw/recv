import { Navigate, Route, Routes } from "react-router-dom";
import { UIProvider } from "./lib/ui";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthPortalPage } from "./pages/AuthPortalPage";
import { DeveloperPortalPage } from "./pages/DeveloperPortalPage";
import { LandingPage } from "./pages/LandingPage";
import { LegalPage } from "./pages/LegalPage";
import { PlanPage } from "./pages/PlanPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

export default function App() {
  return (
    <UIProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lend" element={<Navigate to="/" replace />} />
        <Route path="/auth" element={<AuthPortalPage />} />
        <Route path="/console" element={<SellerConsolePage />} />
        <Route path="/developers" element={<DeveloperPortalPage />} />
        <Route path="/dev" element={<PlanPage variant="dev" />} />
        <Route path="/enterprise" element={<PlanPage variant="enterprise" />} />
        <Route path="/privacy" element={<LegalPage variant="privacy" />} />
        <Route path="/terms" element={<LegalPage variant="terms" />} />
        <Route path="/checkout/:publicId" element={<CheckoutPage />} />
      </Routes>
    </UIProvider>
  );
}
