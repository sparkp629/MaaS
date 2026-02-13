import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import CampaignEngine from './pages/CampaignEngine';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import LoginGate from './pages/LoginGate';

const STRATEGY = import.meta.env.VITE_STRATEGY || 'default';

export default function App() {
  if (STRATEGY === 'dashboard-first') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="campaign" element={<CampaignEngine />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/success" element={<CheckoutSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  if (STRATEGY === 'login-first') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route
              path="dashboard"
              element={
                <LoginGate>
                  <Dashboard />
                </LoginGate>
              }
            />
            <Route path="campaign" element={<CampaignEngine />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/success" element={<CheckoutSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="campaign" element={<CampaignEngine />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="checkout/success" element={<CheckoutSuccess />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
