import { Route, Routes } from "react-router-dom";
import { UIProvider } from "./lib/ui";
import { CheckoutPage } from "./pages/CheckoutPage";
import { SellerConsolePage } from "./pages/SellerConsolePage";

export default function App() {
  return (
    <UIProvider>
      <Routes>
        <Route path="/" element={<SellerConsolePage />} />
        <Route path="/checkout/:publicId" element={<CheckoutPage />} />
      </Routes>
    </UIProvider>
  );
}
