/**
 * Layout Dashboard-First — App-like, sidebar, pas de landing page
 * UX : l'utilisateur arrive directement dans l'outil, navigation par sidebar
 */
import { NavLink, Outlet } from 'react-router-dom';
import { Search, LogOut, Github, LayoutDashboard as DashIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  { to: '/app', icon: DashIcon, label: 'Dashboard' },
  { to: '/app/competitors', icon: Search, label: 'Competitor Search' },
];

export default function LayoutDashboard() {
  const { user, login, logout, isLoggedIn } = useAuth();

  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    try {
      const k = localStorage.getItem('admin_api_key');
      if (!k) return;
      fetch(`/api/admin/validate`, { headers: { 'x-admin-key': k } })
        .then((r) => r.json())
        .then((j) => {
          if (j && j.ok) setShowAdminLink(true);
        })
        .catch(() => {});
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-slate-900/40">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-slate-700/30 flex flex-col bg-slate-900/60">
        <div className="px-4 py-5 border-b border-slate-700/30">
          <span className="text-lg font-bold text-white">MaaS</span>
          <span className="text-xs text-indigo-400 ml-1">Pro</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
          {/* Admin link: visible only when admin key validated by server */}
          {showAdminLink ? (
            <NavLink
              key="/app/admin"
              to="/app/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4 12h4M16 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M6.5 17.5l2.8-2.8M14.7 9.3l2.8-2.8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Admin
            </NavLink>
          ) : null}
        </nav>

        <div className="px-3 py-4 border-t border-slate-700/30 space-y-3">
          <div className="flex items-center gap-2">
            {user?.avatar && (
              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
            )}
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{user?.name || 'Mode invité'}</div>
              <div className="text-xs text-slate-500 truncate">{user?.email || 'Aucune connexion requise'}</div>
            </div>
          </div>
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/50 text-sm w-full transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          ) : (
            <button
              onClick={() => login('github')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm w-full transition-colors"
            >
              <Github className="w-4 h-4" />
              Connexion (optionnel)
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
