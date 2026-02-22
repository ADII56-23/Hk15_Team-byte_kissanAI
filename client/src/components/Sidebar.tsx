import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, LogOut, Sprout, Wheat,
  Calendar, Gift, MessageSquare, Clock, Search, X, Map, Store
} from 'lucide-react';

interface SidebarProps {
  customItems?: {
    id: string;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    icon?: any;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
  }[];
  customTitle?: string;
  showLogo?: boolean;
}

import { useLanguage } from '../contexts/LanguageContext';

const Sidebar: React.FC<SidebarProps> = ({ customItems, customTitle, showLogo = true }) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/dashboard' },
    { icon: Wheat, label: t('predictive_analysis'), path: '/analytics' },
    { icon: ListChecks, label: t('smart_planner'), path: '/tasks' },
    { icon: Calendar, label: t('weekly_planner'), path: '/weekly-planner' },
    { icon: Map, label: t('satellite_analysis'), path: '/satellite-analysis' },
    { icon: Store, label: t('store'), path: '/store' },
    { icon: Gift, label: t('refer_earn'), path: '/refer-earn' },
  ];

  const filteredItems = customItems?.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 bg-earth-dark h-full text-white flex flex-col border-r border-earth-main shadow-2xl transition-all duration-300 relative">
      {showLogo && (
        <Link to="/" className="p-6 flex items-center space-x-3 mb-8 hover:opacity-80 transition-opacity">
          <div className="bg-earth-light p-2 rounded-xl">
            <Sprout size={24} className="text-earth-dark" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">FarmCopilot</h1>
            <p className="text-[10px] text-earth-light font-bold uppercase tracking-widest">{customTitle || 'v1 Operations'}</p>
          </div>
        </Link>
      )}

      {!showLogo && customTitle && (
        <div className="p-6 pb-2">
          <p className="text-[10px] text-earth-light/60 font-black uppercase tracking-[0.2em]">{customTitle}</p>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
        {customItems ? (
          <>
            <div className="px-2 mb-4 relative">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-light/40" />
                <input
                  type="text"
                  placeholder={t('search_history')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-earth-main/50 transition-all placeholder:text-earth-light/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-earth-light/40 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 mb-2">
              <p className="text-[10px] font-black uppercase text-earth-light/30 tracking-widest flex items-center gap-2">
                <Clock size={10} />
                {t('recent_chats')}
              </p>
            </div>

            <div className="space-y-1">
              {filteredItems?.map((item) => (
                <div key={item.id} className="relative group">
                  <button
                    onClick={item.onClick}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${item.isActive
                      ? 'bg-earth-main text-white shadow-lg'
                      : 'text-earth-light hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <item.icon size={16} className={item.isActive ? 'text-white' : 'text-earth-light/40'} />
                    <span className="font-semibold text-[11px] truncate text-left flex-1">{item.label}</span>
                  </button>
                </div>
              ))}

              {filteredItems?.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-earth-light/20 font-bold">
                    {searchQuery ? t('no_matches_found') : t('no_history_yet')}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                  ? 'bg-earth-main text-white shadow-lg'
                  : 'text-earth-light hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span className="font-semibold text-sm">{item.label}</span>
            </NavLink>
          ))
        )}
      </nav>

      <div className="p-4 mt-auto">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-earth-light hover:bg-red-500/10 hover:text-red-400 transition-all font-semibold text-sm">
          <LogOut size={20} />
          <span>{t('sign_out')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
