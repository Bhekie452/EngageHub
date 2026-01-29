import React, { useEffect, useState } from 'react';

export const PaymentSuccessPage: React.FC = () => {
  const [message, setMessage] = useState<string>('Finalizing your subscription…');

  useEffect(() => {
    // We can’t trust the return URL as proof of payment (PayFast ITN is the source of truth).
    // This page is just UX. ITN will update the subscription in the background.
    const intentRaw = sessionStorage.getItem('payfast_payment_intent');
    if (!intentRaw) {
      setMessage('Payment received. If you’re not upgraded yet, refresh in a moment or contact support.');
      return;
    }

    try {
      const intent = JSON.parse(intentRaw);
      setMessage(
        `Payment completed. We’re activating your ${String(intent?.planTier || 'plan')} subscription now.`
      );
      // Clear intent after a short delay so refresh doesn’t reuse stale intent
      setTimeout(() => sessionStorage.removeItem('payfast_payment_intent'), 1500);
    } catch {
      setMessage('Payment received. If you’re not upgraded yet, refresh in a moment or contact support.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Payment Successful</h1>
        <p className="text-gray-600 mt-2">{message}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Go to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Refresh Status
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Note: Subscription activation is confirmed via PayFast ITN and may take a moment.
        </p>
      </div>
    </div>
  );
};

