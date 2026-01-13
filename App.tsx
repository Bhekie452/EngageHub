import React, { useState, useEffect } from 'react';
import { useTheme } from './src/hooks/useTheme';
import { useAuth } from './src/hooks/useAuth';
import { useCurrency } from './src/hooks/useCurrency';
import { MenuSection } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inbox from './components/Inbox';
import AIStudio from './components/AIStudio';
import SocialMedia from './components/SocialMedia';
import Content from './components/Content';
import Campaigns from './components/Campaigns';
import CRM from './components/CRM';
import Customers from './components/Customers';
import Deals from './components/Deals';
import Tasks from './components/Tasks';
import Analytics from './components/Analytics';
import Integrations from './components/Integrations';
import Automations from './components/Automations';
import Assets from './components/Assets';
import Settings from './components/Settings';
import { Bell, Search, HelpCircle, AlertCircle } from 'lucide-react';

const Header: React.FC<{ section: MenuSection }> = ({ section }) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 sticky top-0 z-30">
      <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">{section}</h2>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-600/20 focus:bg-white dark:focus:bg-slate-700 transition-all outline-none w-64 dark:text-slate-200"
          />
        </div>
        <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>
        <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
};

const EmptyState: React.FC<{ title: string; onReturn: () => void }> = ({ title, onReturn }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 text-gray-300">
      <AlertCircle size={40} />
    </div>
    <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2">{title} is coming soon</h3>
    <p className="text-gray-500 dark:text-slate-400 max-w-sm">We're building out the full solo-operator experience.</p>
    <button
      onClick={onReturn}
      className="mt-8 px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-all"
    >
      Return to Dashboard
    </button>
  </div>
);

const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<MenuSection>(MenuSection.Dashboard);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const { fetchTheme } = useTheme();
  const { fetchCurrency } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    fetchTheme();
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchCurrency(user.id);
    }
  }, [user?.id]);

  const renderContent = () => {
    switch (currentSection) {
      case MenuSection.Dashboard:
        return <Dashboard />;
      case MenuSection.Inbox:
        return <Inbox />;
      case MenuSection.AIStudio:
        return <AIStudio />;
      case MenuSection.SocialMedia:
        return <SocialMedia />;
      case MenuSection.Content:
        return <Content />;
      case MenuSection.Campaigns:
        return <Campaigns />;
      case MenuSection.CRM:
        return <CRM />;
      case MenuSection.Customers:
        return <Customers />;
      case MenuSection.Deals:
        return <Deals />;
      case MenuSection.Tasks:
        return <Tasks />;
      case MenuSection.Analytics:
        return <Analytics />;
      case MenuSection.Assets:
        return <Assets />;
      case MenuSection.Automations:
        return <Automations />;
      case MenuSection.Integrations:
        return <Integrations />;
      case MenuSection.Settings:
        return <Settings />;
      default:
        return <EmptyState title={currentSection} onReturn={() => setCurrentSection(MenuSection.Dashboard)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">
      <Sidebar
        currentSection={currentSection}
        onSelect={setCurrentSection}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <Header section={currentSection} />
        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <button className="fixed bottom-6 right-6 w-14 h-14 bg-brand-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all md:hidden z-50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
      </button>
    </div>
  );
};

export default App;
