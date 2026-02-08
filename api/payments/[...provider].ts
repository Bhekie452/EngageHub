import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export const config = {
  runtime: 'nodejs18.x',
};

type Handler = (req: VercelRequest, res: VercelResponse) => void;

// Stripe Handlers
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
}) : null;

const handleStripeCheckout: Handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!stripe) {
    res.status(500).json({ error: 'Stripe is not configured on the server.' });
    return;
  }

  try {
    const { priceId, userId, successUrl, cancelUrl, paymentMethod } = req.body;

    if (!priceId || !userId || !successUrl || !cancelUrl || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: {
        userId,
      },
    });

    return res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

// PayFast Handlers
const handlePayfastNotify: Handler = async (req, res) => {
  // Existing PayFast notify logic here
  // This is a placeholder - you'll need to implement the actual PayFast notification handling
  return res.status(200).json({ status: 'success' });
};

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { provider } = req.query;

  try {
    switch (provider) {
      case 'stripe':
        await handleStripeCheckout(req, res);
        break;
      case 'payfast':
        await handlePayfastNotify(req, res);
        break;
      default:
        res.status(404).json({ error: 'Provider not found' });
    }
  } catch (error) {
    console.error('Payment handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
