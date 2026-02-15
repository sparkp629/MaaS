import { createContext, useContext, useState, useEffect, flushSync } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'maas_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            name: session.user.user_metadata?.user_name || session.user.email,
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider,
          });
        }
        setLoading(false);
      });

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
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signInWithOAuth({
        provider: provider === 'github' ? 'github' : 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    } else {
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
