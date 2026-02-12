import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import MarketAudit from './pages/MarketAudit';
import KOLScoring from './pages/KOLScoring';
import CampaignEngine from './pages/CampaignEngine';
import ClientROI from './pages/ClientROI';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';

export default function App() {
  const githubConnected = typeof window !== 'undefined' && localStorage.getItem('maas_github_connected') === 'true';

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={githubConnected ? <Navigate to="/dashboard" replace /> : <Homepage />} />
        <Route path="dashboard" element={githubConnected ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="market" element={<MarketAudit />} />
        <Route path="kols" element={<KOLScoring />} />
        <Route path="campaigns" element={<CampaignEngine />} />
        <Route path="roi" element={<ClientROI />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="checkout/success" element={<CheckoutSuccess />} />
        <Route path="*" element={<Navigate to={githubConnected ? "/dashboard" : "/"} replace />} />
      </Route>
    </Routes>
  );
}
