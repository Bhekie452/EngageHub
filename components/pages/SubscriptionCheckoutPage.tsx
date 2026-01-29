import React, { useState } from 'react';
import { PaymentCheckout } from '../PaymentCheckout';

interface SubscriptionCheckoutPageProps {
  planTier: string;
  onDone: () => void;
}

export const SubscriptionCheckoutPage: React.FC<SubscriptionCheckoutPageProps> = ({
  planTier,
  onDone,
}) => {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        {/* The actual checkout is a full-screen modal rendered on top */}
      </div>
      <PaymentCheckout
        planTier={planTier}
        onClose={() => {
          setOpen(false);
          onDone();
        }}
        onSuccess={() => {
          setOpen(false);
          onDone();
        }}
      />
    </>
  );
};

