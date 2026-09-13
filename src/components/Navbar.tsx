import React, { useState, useEffect, useRef } from 'react';
import {
  Scan,
  Search,
  Bell,
  Globe,
  User as UserIcon,
  LogOut,
  Sprout,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewState, Notification } from '../types';
import { api } from '../lib/api';
import { Logo } from './Logo';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onOpenAuth
}) => {
  const { user, isAuthenticated, isDemoMode, exploreDemoMode, logout, updateUserLanguage } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getNotifications().then(setNotifications).catch(() => {});
    }
  }, [isAuthenticated, currentView]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDemoModeToggle = async () => {
    try {
      setShowUserMenu(false);
      if (isDemoMode) {
        await logout();
        onNavigate('landing');
      } else {
        await exploreDemoMode();
        onNavigate('dashboard');
      }
    } catch (err) {
      console.error('Demo switch error', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-md border-b border-[#2D6A4F]/10 shadow-[0_2px_15px_rgba(11,37,18,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand */}
        <div 
          onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
          className="cursor-pointer shrink-0"
          title="Phytoscan Intelligence"
        >
          <Logo size="md" />
        </div>

        {/* Global Search Bar Trigger */}
        {isAuthenticated && (
          <div className="flex-1 max-w-md hidden md:block">
            <button
              onClick={onOpenSearch}
              className="w-full h-10 px-3.5 rounded-xl bg-[#F0F4F1] hover:bg-[#E5ECE7] text-[#52796F] text-sm flex items-center justify-between transition-colors border border-transparent hover:border-[#2D6A4F]/20"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#52796F]" />
                <span>Search crops, scans, reports, risks...</span>
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white text-[#52796F] rounded border border-[#2D6A4F]/10 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          {isAuthenticated && (
            <button
              onClick={onOpenSearch}
              className="p-2 rounded-xl text-[#2D6A4F] hover:bg-[#F0F4F1] md:hidden transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Quick Scan Primary Action */}
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('scan')}
              className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#132A13] hover:to-[#1B4332] text-white text-sm font-semibold shadow-md shadow-[#2D6A4F]/25 hover:shadow-lg transition-all active:scale-95"
            >
              <Scan className="w-4 h-4 text-[#74C69D]" />
              <span className="hidden xs:inline">Scan Crop</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-sm font-semibold shadow-sm transition-all"
            >
              <span>Get Started</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-xl text-[#2D6A4F] hover:bg-[#F0F4F1] transition-colors flex items-center gap-1"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase text-[#1B4332] hidden sm:inline">
                {user?.language || 'en'}
              </span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-[#2D6A4F]/15 py-1.5 z-50 text-sm">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#52796F]">
                  Select Language
                </div>
                {[
                  { code: 'en', label: 'English', native: 'English' },
                  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
                  { code: 'bn', label: 'Bengali', native: 'বাংলা' }
                ].map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      updateUserLanguage(lang.code as any);
                      setShowLangMenu(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#F0F4F1] transition-colors ${
                      user?.language === lang.code ? 'text-[#1B4332] font-bold bg-[#D8F3DC]/50' : 'text-[#2D6A4F]'
                    }`}
                  >
                    <span>{lang.native}</span>
                    <span className="text-xs text-[#52796F]">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl text-[#2D6A4F] hover:bg-[#F0F4F1] relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#2D6A4F]/15 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-[#F8FAF8] border-b border-[#2D6A4F]/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#132A13]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#2D6A4F] hover:underline font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-[#52796F]">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs transition-colors hover:bg-[#F8FAF8] flex gap-3 ${
                            !n.read ? 'bg-[#D8F3DC]/20' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'trend_alert' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            ) : n.type === 'emerging_risk' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                            ) : (
                              <Info className="w-4 h-4 text-[#2D6A4F]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[#132A13] truncate">{n.title}</p>
                            <p className="text-[#52796F] mt-0.5 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.date).toLocaleDateString()} at {new Date(n.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile Menu */}
          {isAuthenticated && (
            <div className="relative" ref={userRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F0F4F1] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-xs overflow-hidden border border-[#2D6A4F]/20">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'F'
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#52796F]" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#2D6A4F]/15 py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="font-bold text-[#132A13] truncate">{user?.name}</p>
                    <p className="text-xs text-[#52796F] truncate">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={handleDemoModeToggle}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-[#1B4332] hover:bg-[#D8F3DC]/40 flex items-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{isDemoMode ? 'Exit Demo Mode' : 'Explore Demo Farm'}</span>
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('crops');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-[#132A13] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                    >
                      <Sprout className="w-4 h-4 text-[#2D6A4F]" />
                      <span>Manage Crops</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-gray-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                        onNavigate('landing');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
