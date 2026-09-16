import React from 'react';
import { LayoutDashboard, AlertTriangle, FileText, Sprout, Scan, MessageSquare, Bot } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../context/AuthContext';
import { MobileBottomNav } from './MobileBottomNav';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { farms, user, isDemoMode } = useAuth();
  const firstName = user?.name?.trim() ? user.name.trim().split(' ')[0] : 'My';
  const currentFarm = farms[0] || (isDemoMode
    ? { name: 'Verdant Horizon Agro (Demo)', sizeAcres: 120, location: 'Salinas Valley, CA' }
    : { name: `${firstName}'s Farm`, sizeAcres: 0, location: 'Plot Registration Pending' });

  const navItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crops' as ViewState, label: 'My Crops', icon: Sprout },
    { id: 'scan' as ViewState, label: 'Scan Crop', icon: Scan, highlight: true },
    { id: 'assistant' as ViewState, label: 'AI Assistant', icon: MessageSquare },
    { id: 'agent' as ViewState, label: 'AI Agent', icon: Bot },
    { id: 'risks' as ViewState, label: 'Risk Intelligence', icon: AlertTriangle },
    { id: 'reports' as ViewState, label: 'Reports', icon: FileText }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#2D6A4F]/10 shrink-0 min-h-[calc(100vh-4rem)] p-4 justify-between">
        <div className="space-y-6">
          {/* Farm Quick Badge */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#F8FAF8] to-[#E8F5E9]/50 border border-[#2D6A4F]/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#40916C]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Farm
            </div>
            <p className="font-outfit font-bold text-[#132A13] mt-1 truncate">
              {currentFarm.name}
            </p>
            <div className="flex items-center justify-between text-[11px] text-[#52796F] mt-1 font-medium">
              <span>{currentFarm.sizeAcres ? `${currentFarm.sizeAcres} Acres` : 'Monitored'}</span>
              <span>•</span>
              <span className="truncate">{currentFarm.location}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'crops' && currentView === 'crop-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group relative ${
                    isActive
                      ? 'bg-[#1B4332] text-white shadow-md shadow-[#1B4332]/20 font-semibold'
                      : 'text-[#2D6A4F] hover:bg-[#F0F4F1] hover:text-[#132A13]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#74C69D]' : 'text-[#40916C]'
                    }`}
                  />
                  <span>{item.label}</span>
                  {item.highlight && !isActive && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#D8F3DC] text-[#1B4332] rounded-md">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Philosophy Card in Sidebar Footer */}
        <div className="p-3.5 rounded-2xl bg-[#0B2512] text-white relative overflow-hidden shadow-inner">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-[#74C69D]">
            Philosophy
          </p>
          <p className="text-xs text-[#D8F3DC] font-medium mt-1 leading-relaxed italic">
            "Phytoscan doesn't just scan a crop. It remembers the crop."
          </p>
          <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-300">
            <span>Gemini Vision</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Autonomous Agent</span>
          </div>
        </div>
      </aside>

      <MobileBottomNav currentView={currentView} onNavigate={onNavigate} />
    </>
  );
};
