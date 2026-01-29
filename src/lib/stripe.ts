import { PLAN_CONFIGS } from './payfast';

export type SupportedStripeTier = 'starter' | 'professional' | 'business';

export interface StripeGatewayConfig {
  publishableKey: string;
  priceIds: Record<SupportedStripeTier, string | undefined>;
}

export const getStripeGatewayConfig = (): StripeGatewayConfig => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

  if (!publishableKey) {
    console.warn('Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY) is not configured.');
  }

  return {
    publishableKey,
    priceIds: {
      starter: import.meta.env.VITE_STRIPE_PRICE_ID_STARTER,
      professional: import.meta.env.VITE_STRIPE_PRICE_ID_PROFESSIONAL,
      business: import.meta.env.VITE_STRIPE_PRICE_ID_BUSINESS,
    },
  };
};

export const getStripePlanConfig = (planTier: string) => {
  const key = planTier.toLowerCase() as SupportedStripeTier;
  const plan = PLAN_CONFIGS[key];
  if (!plan) {
    throw new Error(`Invalid Stripe plan tier: ${planTier}`);
  }
  return plan;
};

