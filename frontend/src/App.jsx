import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LayoutDashboard from './components/LayoutDashboard';
import LayoutLogin from './components/LayoutLogin';
import HomeLogin from './pages/HomeLogin';
import Dashboard from './pages/Dashboard';
import CampaignEngine from './pages/CampaignEngine';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import PaymentTab from './pages/PaymentTab';
import LoginGate from './pages/LoginGate';
import Onboarding from './pages/Onboarding';
import { useAuth } from './context/AuthContext';

/**
 * Architecture hybride :
 * - Non connecté → Landing conversion (login-first)
 * - Connecté sans onboarding → Onboarding obligatoire (7 questions)
 * - Connecté + onboarding fait → Dashboard sidebar (dashboard-first)
 */

function AppRoutes() {
  const { isLoggedIn, loading } = useAuth();
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
  }

  // Connecté mais pas onboardé → onboarding obligatoire
  if (isLoggedIn && !onboarded) {
    return <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />;
  }

  // Connecté + onboardé → Dashboard sidebar (URL /app pour forcer le bon écran)
  if (isLoggedIn) {
    return (
      <Routes key="dashboard">
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<LayoutDashboard />}>
          <Route index element={<Dashboard />} />
          <Route path="competitors" element={<CampaignEngine />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/success" element={<CheckoutSuccess />} />
          {/* Preview interne: route prête, non liée dans la sidebar pour l'instant */}
          <Route path="payment-preview" element={<PaymentTab />} />
        </Route>
      </Routes>
    );
  }

  // Non connecté → Landing conversion
  return (
    <Routes key="landing">
      <Route path="/" element={<LayoutLogin />}>
        <Route index element={<HomeLogin />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
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
