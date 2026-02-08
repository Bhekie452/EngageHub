import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export const config = {
  runtime: 'nodejs18.x',
  maxDuration: 30,
};

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

const stripe =
  stripeSecretKey &&
  new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia' as any,
  });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  if (!stripe) {
    res.status(500).json({ error: 'Stripe is not configured on the server.' });
    return;
  }

  try {
    const { planTier, userId, email, origin, trialDays } = req.body || {};

    if (!planTier || !userId || !email || !origin) {
      res.status(400).json({ error: 'Missing required fields for Stripe checkout.' });
      return;
    }

    const tierKey = String(planTier).toLowerCase();

    const priceIdMap: Record<string, string | undefined> = {
      starter: process.env.STRIPE_PRICE_ID_STARTER,
      professional: process.env.STRIPE_PRICE_ID_PROFESSIONAL,
      business: process.env.STRIPE_PRICE_ID_BUSINESS,
    };

    const priceId = priceIdMap[tierKey];

    if (!priceId) {
      res
        .status(400)
        .json({ error: `Stripe price ID is not configured for plan tier "${tierKey}".` });
      return;
    }

    const parsedTrialDays =
      typeof trialDays === 'number' && trialDays > 0 ? Math.floor(trialDays) : undefined;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: String(email),
      success_url: `${origin}/payment/success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancel`,
      subscription_data: {
        trial_period_days: parsedTrialDays,
        metadata: {
          userId: String(userId),
          planTier: tierKey,
        },
      },
      metadata: {
        userId: String(userId),
        planTier: tierKey,
      },
    });

    res.status(200).json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe create-checkout-session error:', error);
    res.status(500).json({ error: 'Failed to create Stripe checkout session.' });
  }
}

