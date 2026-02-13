import { Link, Outlet } from 'react-router-dom';
import { LogOut, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SuggestionBox from './SuggestionBox';

export default function Layout() {
  const { user, login, logout, isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-900/40">
      <header className="border-b border-slate-700/30 px-6 py-4 shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white hover:text-indigo-300">
            MaaS — Mindshare as a Service
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-slate-400 hover:text-white text-sm"
            >
              Dashboard
            </Link>
            <Link
              to="/campaign"
              className="text-slate-400 hover:text-white text-sm"
            >
              Moteur de campagne
            </Link>
            <Link
              to="/checkout"
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
            >
              Magic Button
            </Link>
            <div className="border-l border-slate-600 pl-4 flex flex-col gap-1">
              {isLoggedIn ? (
                <>
                  {user?.avatar && (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full mr-1" />
                  )}
                  <span className="text-slate-400 text-xs">{user?.name}</span>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-amber-400 text-sm"
                    title="Déconnexion"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => login('github')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white"
                  >
                    <Github className="w-4 h-4" />
                    Connexion GitHub
                  </button>
                  <button
                    onClick={logout}
                    className="text-slate-500 hover:text-slate-400 text-xs"
                    title="Effacer toute session résiduelle"
                  >
                    Forget
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-700/30 px-6 py-6 shrink-0">
        <div className="max-w-6xl mx-auto">
          <SuggestionBox />
          <p className="text-slate-500 text-xs mt-3">
            MaaS — Remplacez les métriques vanité par un suivi de conversion.
          </p>
        </div>
      </footer>
    </div>
  );
}
