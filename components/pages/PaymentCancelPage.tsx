import React from 'react';

export const PaymentCancelPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900">Payment Cancelled</h1>
        <p className="text-gray-600 mt-2">
          No charge was made. You can try again anytime.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => (window.location.href = '/pricing')}
            className="flex-1 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-colors"
          >
            Back to Pricing
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="flex-1 px-6 py-3 bg-white border-2 border-gray-200 text-gray-900 rounded-xl font-bold hover:bg-gray-50 transition-colors"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
};

