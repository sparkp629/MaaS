import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function CheckoutSuccess() {
  return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Paiement réussi</h1>
      <p className="text-slate-400 mb-8">
        Merci pour votre souscription. Vous recevrez un email de confirmation sous peu.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-maas text-white font-semibold"
      >
        Retour au Dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
