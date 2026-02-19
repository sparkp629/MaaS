import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Gate — bloquer l'accès au Dashboard tant que non connecté (Approche login-first)
 */
export default function LoginGate({ children }) {
  const { isLoggedIn, login } = useAuth();

  if (isLoggedIn) return children;

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-bold text-white mb-2">Connexion requise</h1>
      <p className="text-slate-400 text-center max-w-md mb-6">
        Connexion avec X requise, avec protection anti multi-comptes (empreinte navigateur) et blocage des adresses jetables.
      </p>
      <button
        onClick={() => login('twitter')}
        className="flex items-center gap-3 px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium"
      >
        <ShieldCheck className="w-6 h-6" />
        Se connecter avec X
      </button>
    </div>
  );
}
