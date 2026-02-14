/**
 * Home Login-First — Landing orientée conversion
 * UX : pas de navigation libre, gros CTA login, social proof
 */
import { Github, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const FEATURES = [
  'Matching KOLs par score de conversion réel',
  'Intelligence concurrentielle automatisée',
  'Contenu multi-format en un clic (X, LinkedIn, Short)',
  'ROI tracking par campagne',
  'Mindshare Index multi-canaux',
];

export default function HomeLogin() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/dashboard', { replace: true });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Accès gratuit — aucune carte bancaire requise
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 leading-tight">
        Remplacez les métriques vanité
        <br />
        <span className="text-indigo-400">par un suivi de conversion réel</span>
      </h1>

      <p className="text-slate-400 text-lg text-center max-w-xl mb-10">
        MaaS connecte fondateurs de Micro-SaaS et KOLs de niche.
        Un seul outil pour découvrir, analyser et convertir.
      </p>

      {/* CTA principal */}
      <button
        onClick={() => login('github')}
        className="flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] mb-12"
      >
        <Github className="w-5 h-5" />
        Accéder au Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Features list */}
      <div className="max-w-md w-full space-y-3">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {/* Social proof */}
      <div className="mt-12 flex items-center gap-6 text-slate-500 text-sm">
        <span>Utilisé par des fondateurs en</span>
        <div className="flex gap-2">
          {['Dev Tools', 'No-code', 'API-first', 'CRM'].map((n) => (
            <span key={n} className="px-2 py-0.5 rounded bg-slate-800/50 text-slate-400 text-xs">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
