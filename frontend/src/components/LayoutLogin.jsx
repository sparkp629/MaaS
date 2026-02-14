/**
 * Layout Login-First — Header minimaliste, gros CTA conversion
 * UX : focus sur la connexion, tout le contenu protégé
 */
import { Link, Outlet } from 'react-router-dom';
import { LogOut, Github, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuggestionBox from './SuggestionBox';

export default function LayoutLogin() {
  const { user, login, logout, isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/40">
      <header className="border-b border-slate-700/30 px-6 py-3 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span className="text-lg font-bold text-white">MaaS</span>
          </Link>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-slate-400 hover:text-white"
                >
                  Dashboard
                </Link>
                <div className="border-l border-slate-600 pl-3 flex items-center gap-2">
                  {user?.avatar && (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <span className="text-slate-300 text-sm">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="text-slate-500 hover:text-amber-400"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-700/30 px-6 py-6 shrink-0">
        <div className="max-w-6xl mx-auto">
          <SuggestionBox />
          <p className="text-slate-500 text-xs mt-3">
            MaaS — Accès sécurisé. Connectez-vous pour exploiter tout le potentiel.
          </p>
        </div>
      </footer>
    </div>
  );
}
