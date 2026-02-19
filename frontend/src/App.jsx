import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LayoutDashboard from './components/LayoutDashboard';
import LayoutLogin from './components/LayoutLogin';
import HomeLogin from './pages/HomeLogin';
import Dashboard from './pages/Dashboard';
import CampaignEngine from './pages/CampaignEngine';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import Onboarding from './pages/Onboarding';
import PaymentTab from './pages/PaymentTab';
import AdminPage from './pages/Admin';
import { useAuth } from './context/AuthContext';

/**
 * Flux invité :
 * - Landing page
 * - Onboarding obligatoire (7 questions)
 * - Dashboard accessible sans connexion
 */

function AppRoutes() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const [onboarded, setOnboarded] = useState(() => {
    try { return localStorage.getItem('maas_onboarded') === 'true'; } catch { return false; }
  });

  // Attendre que l'auth soit initialisée avant d'afficher quoi que ce soit
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading...</div>
      </div>
    );
  }

  function handleOnboardingComplete(answers) {
    try { localStorage.setItem('maas_onboarded', 'true'); localStorage.setItem('maas_onboarding', JSON.stringify(answers)); } catch {}
    setOnboarded(true);
    navigate('/app', { replace: true });
  }

  return (
    <Routes>
      <Route path="/" element={<LayoutLogin />}>
        <Route index element={<HomeLogin />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
      </Route>
      <Route
        path="/onboarding"
        element={onboarded ? <Navigate to="/app" replace /> : <Onboarding onComplete={handleOnboardingComplete} />}
      />
      <Route path="/dashboard" element={<Navigate to="/app" replace />} />
      <Route
        path="/app"
        element={onboarded ? <LayoutDashboard /> : <Navigate to="/onboarding" replace />}
      >
        <Route index element={<Dashboard />} />
        <Route path="competitors" element={<CampaignEngine />} />
        <Route path="payment" element={<PaymentTab />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
