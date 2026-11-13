import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import App from "./App.tsx";
import AppV2 from "./AppV2.tsx";
import AppV3 from "./AppV3.tsx";
import PoliticaPrivacidade from "./PoliticaPrivacidade.tsx";
import PoliticaReembolso from "./PoliticaReembolso.tsx";
import TermosServico from "./TermosServico.tsx";
import Contato from "./Contato.tsx";
import Revendedores from "./Revendedores.tsx";
import SobreNos from "./SobreNos.tsx";
import Obrigado from "./Obrigado.tsx";
import ObrigadoPix from "./ObrigadoPix.tsx";
import Recompra from "./Recompra.tsx";
import RecompraOfertas from "./RecompraOfertas.tsx";
import CookieBanner from "./components/CookieBanner.tsx";
import NotFound from "./NotFound.tsx";
import AdminLogin from "./components/AdminLogin.tsx";
import AdminDashboard from "./components/AdminDashboard.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import AdminSystemInfo from "./components/AdminSystemInfo.tsx";
import "./index.css";

import { trackPageView } from "./services/tracking";

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    // Clear page-specific tracking flags when navigation occurs
    if ((window as any).lastViewContentPath && (window as any).lastViewContentPath !== location.pathname) {
      delete (window as any).lastViewContentPath;
    }

    const getCookie = (name: string) => {
      try {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
      } catch (e) {
        // ignore
      }
      return null;
    };

    const lpVersion = getCookie('lp_version') || (() => {
      try {
        return localStorage.getItem('lp_version');
      } catch (e) {
        return null;
      }
    })() || 'original';

    trackPageView(lpVersion);
  }, [location.pathname, location.search]);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <RouteTracker />
      <CookieBanner />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/lp-v2" element={<AppV2 />} />
        <Route path="/lp-v3" element={<AppV3 />} />
        <Route path="/sobre-nos" element={<SobreNos />} />
        <Route
          path="/politica-de-privacidade"
          element={<PoliticaPrivacidade />}
        />
        <Route path="/politica-de-reembolso" element={<PoliticaReembolso />} />
        <Route path="/termos-de-servico" element={<TermosServico />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/revendedores" element={<Revendedores />} />
        <Route path="/obrigado" element={<Obrigado />} />
        <Route path="/obrigado-pix/:paymentId" element={<ObrigadoPix />} />
        <Route path="/recompra" element={<Recompra />} />
        <Route path="/recompra/ofertas" element={<RecompraOfertas />} />
        <Route path="/checkout" element={<App />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/system"
          element={
            <ProtectedRoute>
              <AdminSystemInfo />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
