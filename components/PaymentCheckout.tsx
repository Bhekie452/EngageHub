import React, { useState, useEffect } from 'react';
import { X, Loader2, CreditCard, Shield, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { supabase } from '../src/lib/supabase';
import {
  createSubscriptionPayment,
  submitPayFastPayment,
  PLAN_CONFIGS,
  getPayFastConfig,
} from '../src/lib/payfast';
import { getStripeGatewayConfig } from '../src/lib/stripe';
import { loadStripe } from '@stripe/stripe-js';

interface PaymentCheckoutProps {
  planTier: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentCheckout: React.FC<PaymentCheckoutProps> = ({
  planTier,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialDays, setTrialDays] = useState(14);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [gateway, setGateway] = useState<'payfast' | 'stripe'>('payfast');

  const stripeConfig = getStripeGatewayConfig();
  const isStripeEnabled = Boolean(stripeConfig.publishableKey);

  const plan = PLAN_CONFIGS[planTier.toLowerCase()];

  useEffect(() => {
    // Fetch user workspace
    const fetchWorkspace = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('workspaces')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching workspace:', error);
        } else if (data) {
          setWorkspaceId(data.id);
        }
      } catch (err) {
        console.error('Error fetching workspace:', err);
      }
    };

    fetchWorkspace();
  }, [user]);

  if (!plan) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">Invalid Plan</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">The selected plan is not available.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-gray-900">Authentication Required</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            Please sign in or create an account to continue with payment.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                // Remember the user's subscription intent
                sessionStorage.setItem('pending_subscription_plan', planTier);
                window.dispatchEvent(
                  new CustomEvent('subscription:intent', { detail: { planTier } })
                );
                // Ask the root Router to open the sign-in view
                window.dispatchEvent(
                  new CustomEvent('auth:navigate', { detail: { view: 'login' } })
                );
                onClose();
              }}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                // Remember the user's subscription intent
                sessionStorage.setItem('pending_subscription_plan', planTier);
                window.dispatchEvent(
                  new CustomEvent('subscription:intent', { detail: { planTier } })
                );
                // Ask the root Router to open the registration view
                window.dispatchEvent(
                  new CustomEvent('auth:navigate', { detail: { view: 'register' } })
                );
                onClose();
              }}
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (gateway === 'payfast') {
        // PayFast payment flow
        const config = getPayFastConfig();
        if (config.sandbox && !config.merchantId) {
          setError('PayFast is not configured. Please contact support.');
          setIsLoading(false);
          return;
        }

        // Get user profile for full name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        // Create payment data
        const paymentData = createSubscriptionPayment(
          planTier,
          {
            id: user.id,
            email: user.email || '',
            full_name: profile?.full_name || user.email?.split('@')[0] || 'User',
            workspace_id: workspaceId || undefined,
          },
          trialDays
        );

        // Store payment intent in session storage for callback handling
        sessionStorage.setItem(
          'payfast_payment_intent',
          JSON.stringify({
            planTier: plan.tier,
            userId: user.id,
            workspaceId: workspaceId,
            paymentId: paymentData.m_payment_id,
            amount: paymentData.amount,
            trialDays,
            timestamp: Date.now(),
          })
        );

        // Submit to PayFast
        submitPayFastPayment(paymentData);
      } else {
        // Stripe payment flow
        if (!isStripeEnabled) {
          setError('Stripe is not configured. Please contact support.');
          setIsLoading(false);
          return;
        }

        const stripe = await loadStripe(stripeConfig.publishableKey);
        if (!stripe) {
          setError('Unable to initialise Stripe. Please try again.');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planTier,
            userId: user.id,
            email: user.email,
            origin: window.location.origin,
            trialDays,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.error || 'Failed to create Stripe checkout session.');
        }

        const { sessionId } = await response.json();
        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

        if (stripeError) {
          throw new Error(stripeError.message);
        }
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
      return;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">
              Complete Your Subscription
            </h2>
            <p className="text-gray-600 text-sm">
              Secure payment via {gateway === 'payfast' ? 'PayFast' : 'Stripe'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Plan Summary */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-1">{plan.name} Plan</h3>
              <p className="text-sm text-gray-600">{plan.monthlyPosts} AI posts/mo • {plan.crmContacts.toLocaleString()} CRM contacts</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-purple-600">
                R{plan.price.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>

          {/* Trial Period */}
          <div className="flex items-center gap-2 p-3 bg-white/60 rounded-lg mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">
                {trialDays}-Day Free Trial
              </p>
              <p className="text-xs text-gray-600">
                No charge until {new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            {plan.features.slice(0, 4).map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gateway selection + Payment Info */}
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3">Select Payment Gateway</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setGateway('payfast')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${gateway === 'payfast'
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Gateway</p>
                  {gateway === 'payfast' && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-black text-gray-900 mb-1">PayFast (ZAR)</p>
                <p className="text-xs text-gray-600">
                  Ideal for South African merchants with local payment methods.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setGateway('stripe')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${gateway === 'stripe'
                    ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-200'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase">Gateway</p>
                  {gateway === 'stripe' && (
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-black text-gray-900 mb-1">Stripe (Cards)</p>
                <p className="text-xs text-gray-600">
                  Global card payments powered by Stripe Checkout.
                </p>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Shield className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Secure Payment</p>
              <p className="text-xs text-gray-600">
                Your payment is processed securely by{' '}
                {gateway === 'payfast' ? 'PayFast' : 'Stripe'}. We never store your card details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <CreditCard className="w-5 h-5 text-gray-600" />
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900">Payment Method</p>
              <p className="text-xs text-gray-600">
                {gateway === 'payfast'
                  ? "You'll be redirected to PayFast to complete payment with your preferred method."
                  : "You'll be redirected to Stripe Checkout to complete payment with your card."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={isLoading}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <CreditCard className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          By proceeding, you agree to our Terms of Service and Privacy Policy.
          You can cancel your subscription anytime.
        </p>
      </div>
    </div>
  );
};
