import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function CheckoutSuccess() {
  return (
    <div className="max-w-lg mx-auto p-6 text-center">
      <div className="p-6 rounded-2xl bg-slate-800/30 border border-emerald-500/30">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          Paiement confirmé
        </h1>
        <p className="text-slate-400 mb-6">
          Merci pour votre commande. Nous vous contacterons sous 24h pour lancer
          votre audit et la première campagne.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-white font-medium"
        >
          Retour au Dashboard
        </Link>
      </div>
    </div>
  );
}
