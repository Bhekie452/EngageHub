import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = stripeSecretKey && new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!stripe || !webhookSecret) {
    console.error('Stripe is not properly configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const signature = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    if (!signature) {
      throw new Error('No Stripe signature found in request headers');
    }

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    ) as Stripe.Event;
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        // Handle successful checkout session
        console.log('Checkout session completed:', session.id);
        // Add your business logic here (e.g., update user subscription status)
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription updated/created:', subscription.id);
        // Handle subscription updates
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Handle subscription cancellation
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment succeeded:', invoice.id);
        // Handle successful payment
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', failedInvoice.id);
        // Handle failed payment
        break;

      // Add more event types as needed

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Required for raw body parsing
  },
};
