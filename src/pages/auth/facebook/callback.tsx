import React, { useEffect, useState, useRef } from 'react';
import { handleFacebookCallback } from '../../../lib/facebook';

export default function FacebookCallback() {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Prevent double-firing with ref
  const hasProcessed = useRef(false);

  useEffect(() => {
    // CRITICAL: Only process once
    if (hasProcessed.current) {
      console.log(' Already processed this callback - skipping');
      return;
    }

    hasProcessed.current = true;
    console.log(' Starting Facebook callback processing...');

    const processCallback = async () => {
      try {
        const result = await handleFacebookCallback();

        if (result?.success) {
          setStatus("success");
          console.log(' Facebook connection successful');

          // Redirect after success
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else if (result?.skipped) {
          setStatus("success");
          console.log(' Connection already processed');

          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        } else {
          setStatus("failed");
          console.log(' No result from callback');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to connect Facebook');
        setStatus("failed");
        console.error('Facebook callback error:', err);
      }
    };

    processCallback();
  }, []);

  if (status === "Processing...") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Connecting to Facebook...</h2>
          <p className="text-gray-500 mt-2">Please wait while we complete the connection.</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Connected Successfully!</h2>
          <p className="text-gray-600">Your Facebook account has been connected.</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting you back to the app...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-red-700 mb-2">Connection Failed</h2>
        <p className="text-gray-600 mb-4">{error}</p>

        <button
          onClick={() => (window.location.href = "/")}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Go Back to App
        </button>
      </div>
    </div>
  );
}
