import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { trackEventSafe } from '../lib/analytics';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session (Supabase automatically handles OAuth callbacks from URL hash)
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          if (session?.user) {
            // best-effort login tracking (on first load)
            trackEventSafe({ event_type: 'login' });
          }
          // Clean up OAuth hash from URL after session is loaded
          if (session && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      })
      .catch((error) => {
        // Ignore abort errors in development
        if (error.name !== 'AbortError') {
          console.error('Error getting session:', error);
        }
        if (mounted) {
          setLoading(false);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) {
          trackEventSafe({ event_type: (_event === 'SIGNED_IN' && session?.user?.app_metadata?.provider === 'email') ? 'signup' : 'login' });
        }
        // Clean up hash after auth state change
        if (session && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // session start/end tracking
  useEffect(() => {
    if (!user) return;
    const startedAt = Date.now();
    trackEventSafe({ event_type: 'session_start' });

    const onBeforeUnload = () => {
      const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
      trackEventSafe({ event_type: 'session_end', value_numeric: seconds });
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [user]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) {
      console.error("Signup Error Details:", error);
    }
    if (!error) {
      trackEventSafe({ event_type: 'signup' });
    }
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      trackEventSafe({ event_type: 'login' });
    }
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const signInWithOAuth = async (provider: 'google' | 'facebook') => {
    // Use current origin (localhost:3000 in dev, vercel URL in prod)
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { data, error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
  };
}
