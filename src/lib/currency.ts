/**
 * Format a number as currency using the provided symbol
 */
export function formatCurrency(amount: number, symbol: string = '$', decimals: number = 0): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${symbol}${formatted}`;
}

/**
 * Format a number as compact currency (e.g., $3.5k, $1.2M)
 */
export function formatCompactCurrency(amount: number, symbol: string = '$'): string {
  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return `${symbol}${amount.toFixed(0)}`;
}

/**
 * Format a number as currency with thousands separator
 */
export function formatCurrencyWithCommas(amount: number, symbol: string = '$', decimals: number = 0): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);

  return `${symbol}${formatted}`;
}

