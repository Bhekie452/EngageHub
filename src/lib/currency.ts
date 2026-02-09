import { useCurrency } from '../hooks/useCurrency';

/**
 * Format a number as currency using the current user's currency from database
 */
export function formatCurrency(amount: number, symbol?: string, decimals: number = 0): string {
  // Get current currency state
  const currencyState = useCurrency.getState();
  const currentSymbol = symbol || currencyState.symbol || '$';
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${currentSymbol}${formatted}`;
}

/**
 * Format a number as compact currency using current user's currency from database
 */
export function formatCompactCurrency(amount: number, symbol?: string): string {
  const currencyState = useCurrency.getState();
  const currentSymbol = symbol || currencyState.symbol || '$';
  
  if (amount >= 1000000) {
    return `${currentSymbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${currentSymbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${currentSymbol}${amount.toFixed(0)}`;
}

/**
 * Format a number as currency with thousands separator using current user's currency from database
 */
export function formatCurrencyWithCommas(amount: number, symbol?: string, decimals: number = 0): string {
  const currencyState = useCurrency.getState();
  const currentSymbol = symbol || currencyState.symbol || '$';
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${currentSymbol}${formatted}`;
}

/**
 * Get current currency code from database
 */
export function getCurrentCurrency(): string {
  const currencyState = useCurrency.getState();
  return currencyState.currency || 'USD';
}

/**
 * Get current currency symbol from database
 */
export function getCurrentCurrencySymbol(): string {
  const currencyState = useCurrency.getState();
  return currencyState.symbol || '$';
}

