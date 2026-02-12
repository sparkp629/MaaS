import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { api } from '../api';
import { Shield, Lock, CreditCard, ChevronRight, AlertCircle } from 'lucide-react';

function PaymentForm({ amount, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(null);
    setLoading(true);

    try {
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
          receipt_email: undefined,
          payment_method_data: {
            billing_details: {
              address: { country: 'FR' },
            },
          },
        },
      });
      if (submitError) {
        setError(submitError.message || 'Erreur de paiement');
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe PaymentElement : CB et Google Pay en onglets selon dispo navigateur */}
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['google_pay', 'card'],
          defaultCollapsed: false,
        }}
      />
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl gradient-maas text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Payer {amount} €
            <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const tierParam = searchParams.get('tier') || 'Foundation';
  const priceParam = searchParams.get('price');
  const amount = priceParam ? parseInt(priceParam, 10) : (tierParam === 'Growth' ? 25000 : tierParam === 'Scale' ? 50000 : 10000);
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    api.getStripeConfig()
      .then(({ publishableKey }) => {
        setStripePromise(loadStripe(publishableKey));
      })
      .catch((err) => {
        setConfigError(err.message || 'Stripe non configuré');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!stripePromise || amount < 0.5) return;
    api.createPaymentIntent(amount)
      .then(({ clientSecret: secret }) => {
        setClientSecret(secret);
      })
      .catch((err) => setConfigError(err.message || 'Erreur création paiement'))
      .finally(() => setLoading(false));
  }, [stripePromise, amount]);

  if (configError) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <h2 className="text-lg font-semibold mb-2">Paiement indisponible</h2>
          <p>{configError}</p>
          <p className="mt-3 text-sm text-slate-500">
            Configurez STRIPE_SECRET_KEY et STRIPE_PUBLISHABLE_KEY dans votre .env pour activer les paiements.
          </p>
        </div>
      </div>
    );
  }

  if (loading || !clientSecret) {
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#6366f1',
        colorBackground: '#0f172a',
        colorText: '#f8fafc',
        colorDanger: '#ef4444',
      },
      rules: {
        '.Input': { border: '1px solid #334155' },
        '.Label': { color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold gradient-text mb-2">Paiement sécurisé</h1>
      <p className="text-slate-400 text-sm mb-8">
        Plan {tierParam} — {amount.toLocaleString('fr-FR')} € HT (paiement unique). TVA applicable selon votre pays.
      </p>

      <div className="glass rounded-2xl p-6 mb-6">
        <Elements stripe={stripePromise} options={options}>
          <PaymentForm amount={amount} />
        </Elements>
      </div>

      {/* Bloc sécurité */}
      <div className="rounded-xl bg-slate-800/30 border border-slate-700/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Lock className="w-4 h-4 text-emerald-500" />
          Connexion SSL 256-bit
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Shield className="w-4 h-4 text-emerald-500" />
          Conformité PCI-DSS — vos données bancaires ne transitent jamais sur nos serveurs
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CreditCard className="w-4 h-4 text-emerald-500" />
          Paiement sécurisé par Stripe
        </div>
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
          TVA : facturée selon le taux applicable dans votre pays. Pour les assujettis intracommunautaires, TVA non applicable (autoliquidation).
        </p>
        <p className="text-xs text-slate-500">
          Protection anti-robot : Stripe détecte les paiements frauduleux. reCAPTCHA v3 peut être ajouté via RECAPTCHA_SITE_KEY dans .env.
        </p>
      </div>

      {/* Mention récapitulative */}
      <p className="mt-6 text-xs text-slate-500 text-center">
        En validant, vous acceptez nos conditions générales de vente et notre politique de confidentialité.
      </p>
    </div>
  );
}
