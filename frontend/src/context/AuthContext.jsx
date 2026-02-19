import { createContext, useContext, useState, useEffect, flushSync } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'maas_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function setMockUser(provider = 'mock') {
    const mockUser = {
      id: '1',
      name: 'Utilisateur démo',
      email: 'demo@maas.example',
      avatar: null,
      provider,
    };
    flushSync(() => setUser(mockUser));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
  }

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      const done = () => setLoading(false);
      // Timeout de secours : si getSession bloque (réseau, CORS, etc.), afficher la landing au plus tard après 3s
      const t = setTimeout(done, 3000);
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            setUser({
              id: session.user.id,
              name: session.user.user_metadata?.user_name || session.user.email,
              email: session.user.email,
              avatar: session.user.user_metadata?.avatar_url,
              provider: session.user.app_metadata?.provider,
            });
          }
          done();
        })
        .catch(done)
        .finally(() => clearTimeout(t));

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.user_name || session.user.email,
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider,
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (_) {}
      }
      setLoading(false);
    }
  }, []);

  const login = async (provider = 'github') => {
    if (provider === 'mock') {
      setMockUser('mock');
      return;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: provider === 'twitter' ? 'twitter' : provider === 'github' ? 'github' : 'google',
          options: { redirectTo: window.location.origin + window.location.pathname },
        });
        if (error) {
          // Si OAuth est mal configuré en preview/prod, on ne bloque pas le parcours.
          console.error('[Auth] OAuth error, fallback to mock mode:', error.message);
          setMockUser('mock-fallback');
        }
      } catch (e) {
        console.error('[Auth] OAuth failed, fallback to mock mode:', e);
        setMockUser('mock-fallback');
      }
      return;
    }

    setMockUser(provider);
  };

  const logout = async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
