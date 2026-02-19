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
      else setError('Aucune adresse de paiement reçue.');
    } catch (e) {
      setError(e.message || 'Erreur lors de la création du paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff9f0] py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="text-slate-600 hover:text-slate-900 text-sm mb-6 inline-block">← Retour</Link>

        <div className="p-8 rounded-2xl bg-white border border-amber-300 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-100">
              <Zap className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Activation du service</h1>
              <p className="text-slate-600 text-sm">Espace de paiement indépendant de l’accueil et du tableau de bord.</p>
            </div>
          </div>

          <ul className="text-slate-700 space-y-2 mb-6">
            <li>• Audit complet de visibilité</li>
            <li>• Sélection de créateurs pertinents</li>
            <li>• Première campagne prête à publier</li>
            <li>• Suivi des résultats commerciaux</li>
          </ul>

          <button
            onClick={handleMagicButton}
            disabled={loading}
            className="w-full py-4 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-white font-bold text-lg"
          >
            {loading ? 'Redirection...' : 'Payer maintenant'}
          </button>

          {error && <p className="text-amber-700 text-sm mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
