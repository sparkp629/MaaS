/**
 * Onglet Paiement & offres — non relié à la sidebar en prod (accès direct /app/payment).
 * Design : Magic Button + Deals KOL pré-bookés, même charte slate/indigo.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Handshake, CreditCard, ArrowLeft } from 'lucide-react';
import { api } from '../api';

export default function PaymentTab() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMagicButton = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.createCheckoutSession({
        successUrl: `${window.location.origin}/app/checkout/success`,
        cancelUrl: `${window.location.origin}/app/payment`,
      });
      if (url) window.location.href = url;
      else setError('Aucune URL de paiement reçue.');
    } catch (e) {
      setError(e.message || 'Erreur lors de la création du paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <Link
        to="/app"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au Dashboard
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-white">Paiement & offres</h1>
        <p className="text-slate-400 text-sm mt-1">
          Magic Button (audit + première campagne) et deals KOL de votre niche, prêts à réserver.
        </p>
      </header>

      {/* Bloc Magic Button — audit + première campagne */}
      <section className="rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/50 to-slate-900/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 shrink-0">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-1">Magic Button</h2>
            <p className="text-slate-400 text-sm mb-4">
              Service turnkey — audit Mindshare + première campagne clé en main (Thread X, LinkedIn, Short).
            </p>
            <ul className="text-slate-300 text-sm space-y-1.5 mb-4">
              <li>• Audit Mindshare de votre produit</li>
              <li>• Matching KOLs qualifiés par conversion réelle</li>
              <li>• Première campagne (contenu + planification)</li>
              <li>• Suivi ROI et attribution</li>
            </ul>
            <p className="text-indigo-400 font-medium text-sm mb-4">
              Tarif : à configurer (STRIPE_PRICE_ID)
            </p>
            <button
              onClick={handleMagicButton}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-white font-medium text-sm transition-colors"
            >
              {loading ? 'Redirection...' : 'Payer maintenant'}
            </button>
            {error && <p className="text-amber-400 text-sm mt-3">{error}</p>}
          </div>
        </div>
      </section>

      {/* Bloc Deals KOL pré-bookés — luxe : ne pas chercher, avoir prêt */}
      <section className="rounded-2xl border border-slate-700/30 bg-gradient-to-br from-slate-800/30 to-slate-900/20 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 shrink-0">
            <Handshake className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-1">Deals KOL déjà bookés</h2>
            <p className="text-slate-400 text-sm mb-3">
              Des KOLs de votre niche, pré-négociés (fixe, commission ou mix). Vous choisissez le deal, on livre la campagne.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-600/30 text-slate-500 text-sm">
              <CreditCard className="w-4 h-4" />
              Coming soon
            </div>
          </div>
        </div>
      </section>

      <p className="text-slate-500 text-xs">
        Cette page n’est pas encore reliée à la navigation principale. Pour l’afficher en prod, ajouter une entrée dans <code className="text-slate-400">NAV_ITEMS</code> de <code className="text-slate-400">LayoutDashboard.jsx</code>.
      </p>
    </div>
  );
}
