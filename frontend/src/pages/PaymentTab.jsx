import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, Sparkles, Calendar, Handshake, Lock, ArrowRight, CircleDollarSign } from 'lucide-react';
import { api } from '../api';

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
    <div className="min-h-screen bg-[#fff9f0] text-slate-900">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Paiement et activation</h1>
            <p className="text-slate-600 text-sm mt-1">Espace de paiement séparé du tableau de bord.</p>
          </div>
          <Link to="/app" className="text-slate-600 hover:text-slate-900 text-sm">← Retour au tableau de bord</Link>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-100 border border-amber-200">
                <Sparkles className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Pack d’activation</h2>
                <p className="text-slate-600 text-sm mt-1">Vous passez de l’analyse à l’exécution concrète.</p>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-full text-xs border border-amber-300 bg-amber-100 text-amber-700">Préversion</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 text-slate-800 text-sm mb-2"><CircleDollarSign className="w-4 h-4 text-emerald-600" /> Ce que vous activez</div>
              <p className="text-slate-600 text-sm">Audit de présence et lancement de première campagne.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 text-slate-800 text-sm mb-2"><Calendar className="w-4 h-4 text-cyan-700" /> Planification</div>
              <p className="text-slate-600 text-sm">Calendrier éditorial basé sur les contenus qui convertissent.</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 text-slate-800 text-sm mb-2"><Handshake className="w-4 h-4 text-indigo-600" /> Accords créateurs</div>
              <p className="text-slate-600 text-sm">Liste d’accords prêts à activer par niche (Coming soon).</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-700 disabled:opacity-60 text-white font-medium transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {loading ? 'Redirection...' : 'Activer ce pack'}
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-600"><Lock className="w-3.5 h-3.5" /> Paiement sécurisé</span>
          </div>
          {error && <p className="text-amber-700 text-sm mt-3">{error}</p>}
        </div>
      </div>
    </div>
  );
}
