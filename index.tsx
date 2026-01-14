
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './src/lib/queryClient';
import { useAuth } from './src/hooks/useAuth';
import { LandingPage } from './components/LandingPage';
import { LoginForm } from './src/components/auth/LoginForm';
import { RegisterForm } from './src/components/auth/RegisterForm';
import App from './App';

type View = 'landing' | 'login' | 'register' | 'app';

const Router: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>('landing');

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
    return <App />;
  }

  // If not authenticated, show landing page or auth forms
  switch (currentView) {
    case 'login':
      return <LoginForm onSwitchToRegister={() => setCurrentView('register')} />;
    case 'register':
      return <RegisterForm onSwitchToLogin={() => setCurrentView('login')} />;
    case 'landing':
    default:
      return (
        <LandingPage
          onGetStarted={() => setCurrentView('register')}
          onSignIn={() => setCurrentView('login')}
        />
      );
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  </React.StrictMode>
);
