/**
 * Landing page — lecture du slogan + CTA direct vers le dashboard
 * Pas de "connexion" visible : le bouton invite a decouvrir, pas a s'identifier
 */
import { CheckCircle, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  'Audit Mindshare de votre produit',
  'Matching KOLs qualifies par conversion reelle',
  'Premiere campagne cle en main (X Thread, LinkedIn, Short)',
  'Suivi ROI et attribution en temps reel',
  'Intelligence concurrentielle automatisee',
];

export default function HomeLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCta = () => {
    login('github').then(() => navigate('/app', { replace: true }));
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        100% gratuit pour votre premier audit
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 leading-tight">
        Vos concurrents ont une longueur d'avance.
        <br />
        <span className="text-indigo-400">On vous montre laquelle.</span>
      </h1>

      <p className="text-slate-400 text-lg text-center max-w-xl mb-10">
        MaaS analyse votre niche, identifie les KOLs qui convertissent vraiment,
        et vous donne un plan d'action concret en quelques minutes.
      </p>

      {/* CTA principal — pas de mention "connexion", invite a decouvrir */}
      <button
        onClick={handleCta}
        className="flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] mb-12"
      >
        <Zap className="w-5 h-5" />
        Voir ce que je manque
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
        <span>Niches couvertes</span>
        <div className="flex gap-2">
          {['Dev Tools', 'No-code', 'API-first', 'CRM', 'EdTech'].map((n) => (
            <span key={n} className="px-2 py-0.5 rounded bg-slate-800/50 text-slate-400 text-xs">
              {n}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
