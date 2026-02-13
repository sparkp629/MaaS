import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { api } from '../api';

export default function Checkout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleMagicButton = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await api.createCheckoutSession({
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout`,
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
    <div className="max-w-2xl mx-auto p-6">
      <Link to="/dashboard" className="text-slate-400 hover:text-white text-sm mb-6 inline-block">
        ← Retour
      </Link>

      <div className="p-8 rounded-2xl bg-slate-800/30 border border-indigo-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-indigo-500/20">
            <Zap className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Magic Button</h1>
            <p className="text-slate-400 text-sm">Service turnkey — audit + première campagne</p>
          </div>
        </div>

        <ul className="text-slate-300 space-y-2 mb-6">
          <li>• Audit Mindshare de votre produit</li>
          <li>• Matching KOLs qualifiés</li>
          <li>• Première campagne clé en main (Thread X, LinkedIn, Short)</li>
          <li>• Suivi ROI et attribution</li>
        </ul>

        <p className="text-indigo-400 font-medium mb-4">
          Tarif : à configurer (STRIPE_PRICE_ID)
        </p>

        <button
          onClick={handleMagicButton}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 rounded-xl text-white font-bold text-lg"
        >
          {loading ? 'Redirection...' : 'Payer maintenant'}
        </button>

        {error && (
          <p className="text-amber-400 text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
