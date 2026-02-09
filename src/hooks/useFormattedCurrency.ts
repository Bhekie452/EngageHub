import { useCallback } from 'react';
import { useCurrency } from './useCurrency';
import { formatCurrency, formatCompactCurrency, formatCurrencyWithCommas } from '../lib/currency';

/**
 * Hook for formatting currency with user's database currency
 */
export function useFormattedCurrency() {
  const { currency, symbol } = useCurrency();

  const formatAmount = useCallback((amount: number, decimals?: number) => {
    return formatCurrency(amount, undefined, decimals);
  }, [symbol]);

  const formatCompact = useCallback((amount: number) => {
    return formatCompactCurrency(amount, undefined);
  }, [symbol]);

  const formatWithCommas = useCallback((amount: number, decimals?: number) => {
    return formatCurrencyWithCommas(amount, undefined, decimals);
  }, [symbol]);

  return {
    currency,
    symbol,
    formatAmount,
    formatCompact,
    formatWithCommas,
  };
}
