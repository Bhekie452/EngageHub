
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../src/hooks/useAuth';
import { NAVIGATION_ITEMS } from '../constants';
import { MenuSection } from '../types';

interface SidebarProps {
  currentSection: MenuSection;
  onSelect: (section: MenuSection) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSelect, isCollapsed, setIsCollapsed }) => {
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  const handleSettingsClick = () => {
    onSelect(MenuSection.Settings);
    setShowUserMenu(false);
  };

  return (
    <aside
      className={`bg-sidebar border-r border-gray-200 dark:border-slate-800 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-40 theme-transition ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 h-16">
        {!isCollapsed && <h1 className="text-xl font-black text-brand-600 italic tracking-tighter">Engagehub</h1>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md text-sidebar-text"
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="p-3">
        <button className={`w-full bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center justify-center gap-2 py-2.5 shadow-lg shadow-brand-100/30 transition-all ${isCollapsed ? 'px-0' : 'px-4'}`}>
          <Plus size={20} />
          {!isCollapsed && <span className="font-bold uppercase text-xs tracking-widest">Create</span>}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1 py-4 no-scrollbar">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${currentSection === item.id
              ? 'bg-sidebar-active text-sidebar-activeText font-black'
              : 'text-sidebar-text hover:bg-black/5 dark:hover:bg-white/5 hover:text-sidebar-activeText'
              }`}
          >
            <span className={`${currentSection === item.id ? 'text-sidebar-activeText' : 'text-sidebar-text group-hover:text-sidebar-activeText'}`}>
              {/* Fix: cast to React.ReactElement<any> to avoid 'size' prop error */}
              {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18 })}
            </span>
            {!isCollapsed && <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-slate-800 relative" ref={menuRef}>
        {showUserMenu && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-2 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 min-w-[200px]">
            <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 mb-1">
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleSettingsClick}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs font-black shrink-0 shadow-lg shadow-brand-100/20">
            {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : <User size={16} />}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-black truncate text-sidebar-activeText">{user?.user_metadata?.full_name || 'User'}</p>
              <p className="text-[10px] text-sidebar-text font-bold uppercase tracking-widest truncate">{user?.email}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
