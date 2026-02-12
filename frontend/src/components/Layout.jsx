import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft } from 'lucide-react';
import SuggestionBox from './SuggestionBox';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 flex items-center gap-4 px-6 py-4 bg-slate-950/90 border-b border-slate-800/50 backdrop-blur-sm">
        <button
          onClick={() => (isHome ? navigate('/') : navigate(-1))}
          className="flex items-center gap-2 text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">{isHome ? 'Accueil' : 'Retour'}</span>
        </button>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg gradient-maas flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">MaaS</span>
          </div>
        </div>
        <div className="w-20" />
      </header>

      <main className="flex-1">
        <div className="p-6 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
        <footer className="border-t border-slate-800/50 bg-slate-900/30">
          <SuggestionBox />
          <div className="text-center py-4 text-xs text-slate-600">
            MaaS — Mindshare-as-a-Service &copy; {new Date().getFullYear()}
          </div>
        </footer>
      </main>
    </div>
  );
}
