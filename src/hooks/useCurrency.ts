import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface CurrencyState {
  currency: string;
  symbol: string;
  isLoading: boolean;
  availableCurrencies: typeof currencies;
  setCurrency: (code: string) => Promise<void>;
  fetchCurrency: (userId: string) => Promise<void>;
}

export const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SZL', symbol: 'E', name: 'Swazi Lilangeni' },
];

// Track ongoing requests to prevent duplicates
let ongoingRequest: Promise<void> | null = null;
let lastFetchedUserId: string | null = null;

export const useCurrency = create<CurrencyState>((set, get) => ({
  currency: 'USD',
  symbol: '$',
  isLoading: false,
  availableCurrencies: currencies,

  fetchCurrency: async (userId: string) => {
    // If same user and request already in progress, return existing promise
    if (ongoingRequest && lastFetchedUserId === userId) {
      return ongoingRequest;
    }

    // Create new request
    const request = (async () => {
      set({ isLoading: true });
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('currency, currency_symbol')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          // RLS or missing profile: use defaults without breaking the app
          set({ currency: 'USD', symbol: '$' });
          return;
        }

        if (data) {
          set({
            currency: data.currency || 'USD',
            symbol: data.currency_symbol || '$'
          });
        } else {
          // No profile row (e.g. PGRST116): use defaults
          set({ currency: 'USD', symbol: '$' });
        }
      } catch (error: any) {
        // Ignore AbortError - it's expected when requests are cancelled
        if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
          set({ currency: 'USD', symbol: '$' });
          return;
        }
        // On any other error (401, 406, network): use defaults so app doesn't break
        set({ currency: 'USD', symbol: '$' });
        console.warn('Currency fetch failed, using defaults:', error?.message || error);
      } finally {
        set({ isLoading: false });
        // Clear ongoing request when done
        if (ongoingRequest === request) {
          ongoingRequest = null;
        }
      }
    })();

    // Store as ongoing request
    ongoingRequest = request;
    lastFetchedUserId = userId;
    
    return request;
  },

  setCurrency: async (code: string) => {
    const selected = currencies.find(c => c.code === code);
    if (!selected) return;

    set({ currency: code, symbol: selected.symbol }); // Optimistic update

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ currency: code, currency_symbol: selected.symbol })
        .eq('id', user.id);

      if (error) {
        throw error;
        // Revert on error could be implemented here
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  },
}));
