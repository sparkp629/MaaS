/**
 * Landing page — slogan + CTA direct vers le dashboard
 * Pas de "connexion" visible : le bouton invite à découvrir
 */
import {
  CheckCircle,
  ArrowRight,
  Zap,
  Copy,
  TrendingUp,
  Target,
  Calendar,
  Handshake,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  'Audit Mindshare de votre produit',
  'Matching KOLs qualifiés par conversion réelle',
  'Première campagne clé en main (X Thread, LinkedIn, Short)',
  'Suivi ROI et attribution en temps réel',
  'Intelligence concurrentielle automatisée',
];

const LANDING_ICONS = [
  { icon: Copy, label: 'Contenus qui performent' },
  { icon: TrendingUp, label: 'Canaux qui engagent' },
  { icon: Target, label: 'Sujets à reproduire' },
  { icon: Calendar, label: 'Planification IA' },
  { icon: Handshake, label: 'Deals KOL bookés' },
];

export default function HomeLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleCta = () => {
    login('github').then(() => navigate('/app', { replace: true }));
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-6">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-6">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        100% gratuit pour votre premier audit
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-white text-center mb-4 leading-tight">
        Vos concurrents ont une longueur d&apos;avance.
        <br />
        <span className="text-indigo-400">On vous montre laquelle.</span>
      </h1>

      <p className="text-slate-400 text-lg text-center max-w-xl mb-6">
        MaaS analyse votre niche, identifie les KOLs qui convertissent vraiment,
        et vous donne un plan d&apos;action concret en quelques minutes.
      </p>

      <p className="text-slate-300/90 text-base text-center max-w-2xl mb-8 italic">
        Le but n&apos;est pas de se démarquer, le but serait paradoxalement de faire comme la concurrence.
        Incongru mais réaliste : on ne réinvente pas un truc qui marche, on vous montre ce qui marche.
      </p>

      <div className="flex flex-wrap justify-center gap-6 mb-10">
        {LANDING_ICONS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-300 transition-colors">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-600/40">
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs text-center max-w-[110px]">{label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleCta}
        className="flex items-center gap-3 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 rounded-2xl text-white font-semibold text-lg shadow-xl shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:scale-[1.02] mb-12"
      >
        <Zap className="w-5 h-5" />
        Voir ce que je manque
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="max-w-md w-full space-y-3">
        {FEATURES.map((f) => (
          <div key={f} className="flex items-center gap-3 text-slate-300 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>

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
