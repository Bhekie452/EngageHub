import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
}) : null;

// Stripe webhook handler
const handleStripeWebhook = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured on the server.' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !endpointSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      (req as any).rawBody || JSON.stringify(req.body),
      sig,
      endpointSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful payment
        const session = event.data.object;
        console.log('Checkout session completed:', session);
        // Add your business logic here
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription changes
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription);
        // Add your business logic here
        break;
      // Add more event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ error: 'Error processing webhook' });
  }
};

// Main webhook handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type } = req.query;

  try {
    switch (type) {
      case 'stripe':
        return await handleStripeWebhook(req, res);
      // Add more webhook types as needed
      default:
        return res.status(404).json({ error: 'Webhook type not found' });
    }
  } catch (error) {
    console.error(`Error in webhook handler (${type}):`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for webhooks to work with raw body
  },
};
