import React from 'react';
import { useFormattedCurrency } from '../../hooks/useFormattedCurrency';

interface CurrencyDisplayProps {
  amount: number;
  decimals?: number;
  compact?: boolean;
  className?: string;
}

/**
 * Component that displays currency using user's database currency
 */
export function CurrencyDisplay({ 
  amount, 
  decimals, 
  compact = false, 
  className = '' 
}: CurrencyDisplayProps) {
  const { formatAmount, formatCompact, currency, symbol } = useFormattedCurrency();

  const formattedAmount = compact 
    ? formatCompact(amount)
    : formatAmount(amount, decimals);

  return (
    <span className={className}>
      {formattedAmount}
      <span className="text-xs text-gray-500 ml-1">
        {currency}
      </span>
    </span>
  );
}

// Usage examples:
/*
// Basic usage
<CurrencyDisplay amount={1234.56} />

// With custom decimals
<CurrencyDisplay amount={1234.56} decimals={2} />

// Compact format
<CurrencyDisplay amount={1234567} compact={true} />

// With custom styling
<CurrencyDisplay amount={1234.56} className="text-xl font-bold" />
*/
