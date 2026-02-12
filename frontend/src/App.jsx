import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MarketAudit from './pages/MarketAudit';
import KOLScoring from './pages/KOLScoring';
import CampaignEngine from './pages/CampaignEngine';
import ClientROI from './pages/ClientROI';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import { useAuth } from './context/AuthContext';

function NavigateToDefault() {
  const { connected } = useAuth();
  return <Navigate to={connected ? '/dashboard' : '/'} replace />;
}

function HomeOrRedirect() {
  const { connected, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (connected) return <Navigate to="/dashboard" replace />;
  return <Home />;
}

function ProtectedRoute({ children }) {
  const { connected, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!connected) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeOrRedirect />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="market"
          element={
            <ProtectedRoute>
              <MarketAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="kols"
          element={
            <ProtectedRoute>
              <KOLScoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="campaigns"
          element={
            <ProtectedRoute>
              <CampaignEngine />
            </ProtectedRoute>
          }
        />
        <Route
          path="roi"
          element={
            <ProtectedRoute>
              <ClientROI />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout/success"
          element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NavigateToDefault />} />
      </Route>
    </Routes>
  );
}
