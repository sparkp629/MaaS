/**
 * Stripe Webhook — vérifie les événements Stripe (signature) et marque le paiement
 */
import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { markPaymentComplete } from '../db/dal.js';

const router = Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || null;

// Raw body parser requis pour vérifier la signature Stripe
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe non configuré' });
    }

    let event;

    if (endpointSecret) {
      const sig = req.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature invalide:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // Mode dev sans vérification de signature
      try {
        event = JSON.parse(req.body.toString());
      } catch {
        return res.status(400).send('Invalid JSON');
      }
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Paiement réussi: ${session.id} — ${session.customer_email || 'email inconnu'}`);
        markPaymentComplete({
          stripeSessionId: session.id,
          email: session.customer_email || session.customer_details?.email || null,
          amountTotal: session.amount_total,
          currency: session.currency,
        });
        break;
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        console.warn(`❌ Paiement échoué: ${intent.id}`);
        break;
      }
      default:
        // Événement non géré — on l'ignore silencieusement
        break;
    }

    res.json({ received: true });
  }
);

export { router as stripeWebhookRouter };
