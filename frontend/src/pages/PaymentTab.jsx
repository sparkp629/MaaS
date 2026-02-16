import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, Calendar, Handshake, Lock, ArrowRight, CircleDollarSign } from 'lucide-react';
import { api } from '../api';

/**
 * Onglet de paiement (preview interne)
 * - Non branché dans la sidebar pour l'instant
 * - Accès direct via /app/payment
 */
export default function PaymentTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.createCheckoutSession({
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/app/payment`,
      });
      if (url) window.location.href = url;
      else setError('Coming soon');
    } catch {
      setError('Coming soon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paiement &amp; Activation</h1>
          <p className="text-slate-400 text-sm mt-1">
            Prévisualisation interne — non affichée dans la navigation publique.
          </p>
        </div>
        <Link to="/app" className="text-slate-400 hover:text-white text-sm">
          ← Retour dashboard
        </Link>
      </div>

      {/* Bloc principal */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-slate-800/30 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <Sparkles className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Magic Button — Pack exécution</h2>
              <p className="text-slate-400 text-sm mt-1">
                On ne vous laisse pas analyser seul : on vous donne directement quoi publier, où publier et avec qui.
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full text-xs border border-amber-500/30 bg-amber-500/10 text-amber-300">
            Preview
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <CircleDollarSign className="w-4 h-4 text-emerald-400" />
              Ce que vous activez
            </div>
            <p className="text-slate-400 text-sm">Audit mindshare + exécution de la première campagne.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Planification
            </div>
            <p className="text-slate-400 text-sm">Calendrier éditorial généré depuis les contenus qui performent.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/40">
            <div className="flex items-center gap-2 text-slate-300 text-sm mb-2">
              <Handshake className="w-4 h-4 text-indigo-300" />
              Deals KOL prêts
            </div>
            <p className="text-slate-400 text-sm">Shortlist de deals pré-bookés par niche (coming soon).</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-medium transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Redirection...' : 'Activer ce pack'}
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Lock className="w-3.5 h-3.5" />
            Paiement sécurisé (Stripe)
          </span>
        </div>
        {error && <p className="text-amber-400 text-sm mt-3">{error}</p>}
      </div>

      {/* Bloc roadmap */}
      <div className="rounded-2xl border border-slate-700/40 bg-slate-800/20 p-6">
        <h3 className="text-sm font-semibold text-slate-200 mb-3">Roadmap paiement (tab gardé sous le coude)</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li>• Génération IA multi-formats optimisée par canal — <span className="text-slate-300">Coming soon</span></li>
          <li>• Planification éditoriale automatique — <span className="text-slate-300">Coming soon</span></li>
          <li>• Deals KOL pré-bookés avec répartition de gains — <span className="text-slate-300">Coming soon</span></li>
        </ul>
      </div>
    </div>
  );
}
