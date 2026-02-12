import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'maas_github_connected';

export function AuthProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setConnected(stored === 'true');
    setLoading(false);
  }, []);

  const connect = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setConnected(true);
  };

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConnected(false);
  };

  return (
    <AuthContext.Provider value={{ connected, loading, connect, disconnect }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
