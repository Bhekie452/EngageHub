// Handle Supabase auth token-refresh failures (network timeout / offline) so they don't show as uncaught
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const isSupabaseAuthAbort =
      reason?.name === 'AbortError' ||
      (reason?.message && /signal is aborted|failed to fetch|AuthRetryableFetchError/i.test(String(reason.message)));
    if (isSupabaseAuthAbort) {
      event.preventDefault();
      console.warn('Supabase auth refresh skipped (offline or timeout). You can still use the app.');
    }
  });
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { useAuth } from './src/hooks/useAuth';
import { LandingPage } from './components/LandingPage';
import { WebsiteLayout } from './components/WebsiteLayout';
import { FeaturesPage } from './components/pages/FeaturesPage';
import { PricingPage } from './components/pages/PricingPage';
import { IntegrationsPage } from './components/pages/IntegrationsPage';
import { AboutPage } from './components/pages/AboutPage';
import { PaymentSuccessPage } from './components/pages/PaymentSuccessPage';
import { PaymentCancelPage } from './components/pages/PaymentCancelPage';
import { SubscriptionCheckoutPage } from './components/pages/SubscriptionCheckoutPage';
import { LoginForm } from './src/components/auth/LoginForm';
import { RegisterForm } from './src/components/auth/RegisterForm';
import App from './App';

function getPathname(): string {
  return typeof window !== 'undefined' ? window.location.pathname : '/';
}

type View = 'landing' | 'login' | 'register' | 'app';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
            >
              Reload Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-slate-800 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Router: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = React.useState<View>('landing');
  const [pathname, setPathname] = React.useState(getPathname);
  const [pendingPlan, setPendingPlan] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('pending_subscription_plan');
  });

  React.useEffect(() => {
    const onPop = () => setPathname(getPathname());
    window.addEventListener('popstate', onPop);

    const handleAuthNavigate = (event: Event) => {
      const detail = (event as CustomEvent)?.detail || {};
      const view = detail.view as View | undefined;
      if (view === 'login' || view === 'register') {
        setCurrentView(view);
      }
    };

    const handleSubscriptionIntent = (event: Event) => {
      const detail = (event as CustomEvent)?.detail || {};
      if (detail.planTier) {
        setPendingPlan(String(detail.planTier));
      }
    };

    window.addEventListener('auth:navigate', handleAuthNavigate as EventListener);
    window.addEventListener('subscription:intent', handleSubscriptionIntent as EventListener);

    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('auth:navigate', handleAuthNavigate as EventListener);
      window.removeEventListener('subscription:intent', handleSubscriptionIntent as EventListener);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the main app
  if (user) {
    if (pendingPlan) {
      return (
        <SubscriptionCheckoutPage
          planTier={pendingPlan}
          onDone={() => {
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem('pending_subscription_plan');
            }
            setPendingPlan(null);
          }}
        />
      );
    }
    return <App />;
  }

  // If not authenticated, show landing pages (pathname-based) or auth forms
  switch (currentView) {
    case 'login':
      return <LoginForm onSwitchToRegister={() => setCurrentView('register')} />;
    case 'register':
      return <RegisterForm onSwitchToLogin={() => setCurrentView('login')} />;
    case 'landing':
    default: {
      const onSignIn = () => setCurrentView('login');
      const onGetStarted = () => setCurrentView('register');
      const layoutProps = { onSignIn, onGetStarted };
      if (pathname === '/features') {
        return (
          <WebsiteLayout {...layoutProps}>
            <FeaturesPage />
          </WebsiteLayout>
        );
      }
      if (pathname === '/pricing') {
        return (
          <WebsiteLayout {...layoutProps}>
            <PricingPage />
          </WebsiteLayout>
        );
      }
      if (pathname === '/integrations') {
        return (
          <WebsiteLayout {...layoutProps}>
            <IntegrationsPage />
          </WebsiteLayout>
        );
      }
      if (pathname === '/about') {
        return (
          <WebsiteLayout {...layoutProps}>
            <AboutPage />
          </WebsiteLayout>
        );
      }
      if (pathname === '/payment/success') {
        return (
          <WebsiteLayout {...layoutProps}>
            <PaymentSuccessPage />
          </WebsiteLayout>
        );
      }
      if (pathname === '/payment/cancel') {
        return (
          <WebsiteLayout {...layoutProps}>
            <PaymentCancelPage />
          </WebsiteLayout>
        );
      }
      return <LandingPage onGetStarted={onGetStarted} onSignIn={onSignIn} />;
    }
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
