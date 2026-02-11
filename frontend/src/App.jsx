import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MarketAudit from './pages/MarketAudit';
import KOLScoring from './pages/KOLScoring';
import CampaignEngine from './pages/CampaignEngine';
import ClientROI from './pages/ClientROI';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="market" element={<MarketAudit />} />
        <Route path="kols" element={<KOLScoring />} />
        <Route path="campaigns" element={<CampaignEngine />} />
        <Route path="roi" element={<ClientROI />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
