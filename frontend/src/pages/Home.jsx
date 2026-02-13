import { Link } from 'react-router-dom';
import { Sparkles, BarChart3, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
      <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
        Mindshare as a Service
      </h1>
      <p className="text-slate-400 text-lg text-center max-w-2xl mb-8">
        Connectez fondateurs de Micro-SaaS et KOLs. Remplacez les métriques vanité
        par un suivi de conversion réel.
      </p>

      <div className="flex flex-wrap justify-center gap-4 mb-12">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium"
        >
          <BarChart3 className="w-5 h-5" />
          Dashboard
        </Link>
        <Link
          to="/campaign"
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium"
        >
          <Sparkles className="w-5 h-5" />
          Moteur de campagne
        </Link>
        <Link
          to="/checkout"
          className="flex items-center gap-2 px-6 py-3 border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 rounded-xl font-medium"
        >
          Magic Button
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center">
          <Users className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
          <h3 className="font-medium text-white mb-1">Matching KOLs</h3>
          <p className="text-slate-500 text-sm">
            Découvrez des influenceurs de niche avec un vrai score de conversion.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center">
          <BarChart3 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="font-medium text-white mb-1">Intelligence</h3>
          <p className="text-slate-500 text-sm">
            Segments à fort besoin, faiblesses concurrentielles.
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center">
          <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-2" />
          <h3 className="font-medium text-white mb-1">Contenu multi-format</h3>
          <p className="text-slate-500 text-sm">
            Hook → Thread X, LinkedIn, Script Short en un clic.
          </p>
        </div>
      </div>
    </div>
  );
}
