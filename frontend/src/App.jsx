import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const MarketAudit = lazy(() => import('./pages/MarketAudit'));
const KOLScoring = lazy(() => import('./pages/KOLScoring'));
const CampaignEngine = lazy(() => import('./pages/CampaignEngine'));
const ClientROI = lazy(() => import('./pages/ClientROI'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={withSuspense(Dashboard)} />
        <Route path="market" element={withSuspense(MarketAudit)} />
        <Route path="kols" element={withSuspense(KOLScoring)} />
        <Route path="campaigns" element={withSuspense(CampaignEngine)} />
        <Route path="roi" element={withSuspense(ClientROI)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
