import React, { memo, useEffect, useState, useCallback, useRef } from 'react';
import { Bell, CheckCircle2, Sun, Moon, Palette, Globe, PanelLeftClose, PanelRightClose, ChevronDown, Menu } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../store/ThemeContext';
import { useAuth } from '../../../store/AuthContext';
import chatService from '@/api/chatService';
import ProfileDetails from './ProfileDetails';
import NotificationDropdown from './NotificationDropdown';



interface DashboardHeaderProps {
  sidebarPosition?: 'left' | 'right';
  onToggleSidebarPosition?: () => void;
  onToggleMobileMenu?: () => void;
}


const LANG_OPTIONS = [
  { code: 'EN', name: 'English', flag: '🇺🇸' },
  { code: 'ES', name: 'Español', flag: '🇪🇸' },
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ZH', name: '中文', flag: '🇨🇳' },
  { code: 'AR', name: 'العربية', flag: '🇸🇦' },
];

const DashboardHeader: React.FC<DashboardHeaderProps> = memo(({ sidebarPosition = 'left', onToggleSidebarPosition, onToggleMobileMenu }) => {

  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme, setAccentColor, accentColor } = useTheme();

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentColor(e.target.value);
  }, [setAccentColor]);

  const toggleLanguageMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLangMenuOpen(prev => !prev);
    setIsProfileOpen(false);
  }, []);

  const toggleProfileMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProfileOpen(prev => !prev);
    setIsLangMenuOpen(false);
    setIsNotificationsOpen(false);
  }, []);

  const toggleNotificationsMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsNotificationsOpen(prev => !prev);
    setIsLangMenuOpen(false);
    setIsProfileOpen(false);
  }, []);


  const selectLanguage = useCallback((code: string) => {
    i18n.changeLanguage(code);
    setIsLangMenuOpen(false);
  }, [i18n]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('header.greeting_morning'));
    else if (hour < 18) setGreeting(t('header.greeting_afternoon'));
    else setGreeting(t('header.greeting_evening'));
  }, [t]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { unread_count } = await chatService.getUnreadCount();
        setUnreadCount(unread_count);
      } catch (err) {
        // Silent fail
      }
    };
    fetchUnreadCount();
    // Refresh every 30 seconds for real-time feel
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);


  return (
    <header className="shrink-0 sticky top-0 z-40 w-full bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-white/20 dark:border-slate-800/20 px-6 md:px-8 h-24 md:h-28 flex items-center justify-between transition-all duration-300 shadow-sm shadow-black/5 ring-1 ring-white/20 inset-shadow-sm">
      {/* Bottom Accent Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />

      {/* Greeting & Status */}
      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-700">
        {/* Hamburger Menu (Mobile Only) */}
        <button 
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-accent transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col">
          <h1 className="text-base md:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="opacity-70 font-medium">{greeting}, </span>

            <span className="text-accent">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400">

          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>{t('header.systems_operational')}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Toggles */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Accent Color Picker */}
          <label
            className="cursor-pointer flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-full border border-slate-200/50 dark:border-slate-800/50 hover:border-accent bg-white/20 dark:bg-slate-900/20 shadow-sm transition-all text-slate-600 dark:text-slate-400"
            title="Change accent color"
          >
            <Palette size={16} className="md:w-[18px] md:h-[18px]" style={{ color: accentColor }} />
            <input
              type="color"
              className="sr-only"
              value={accentColor}
              onChange={handleColorChange}
            />
          </label>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-full border border-slate-200/50 dark:border-slate-800/50 hover:border-accent bg-white/20 dark:bg-slate-900/20 shadow-sm text-slate-600 dark:text-slate-400 transition-all"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} className="md:w-[18px] md:h-[18px]" /> : <Sun size={16} className="md:w-[18px] md:h-[18px] text-amber-500" />}
          </button>

          {/* Language Toggle Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleLanguageMenu}
              className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-full border shadow-sm transition-all relative group ${isLangMenuOpen ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent/20' : 'border-slate-200/50 dark:border-slate-800/50 bg-white/20 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400'}`}
              title={t('header.change_language')}
            >
              <Globe size={16} className={`md:w-[18px] md:h-[18px] transition-transform duration-300 ${isLangMenuOpen ? 'rotate-180 scale-110' : ''}`} />
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center bg-accent text-[8px] text-white font-black w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 uppercase shadow-sm">
                {i18n.language.slice(0, 2)}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isLangMenuOpen && (
              <div className="absolute top-full right-0 mt-3 w-44 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200 z-[100] origin-top-right">
                <div className="flex flex-col gap-0.5 px-1.5">
                  {LANG_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => selectLanguage(lang.code)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all ${i18n.language.toUpperCase() === lang.code ? 'bg-accent text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95'}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm leading-none">{lang.flag}</span>
                        <span className="text-xs font-bold tracking-tight">{lang.name}</span>
                      </div>
                      {i18n.language.toUpperCase() === lang.code && (
                        <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Toggle */}
          {onToggleSidebarPosition && (
            <button
              onClick={onToggleSidebarPosition}
              className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-full border border-slate-200/50 dark:border-slate-800/50 hover:border-accent bg-white/20 dark:bg-slate-900/20 shadow-sm text-slate-600 dark:text-slate-400 transition-all focus:outline-none"
              title={sidebarPosition === 'left' ? t('header.move_sidebar_right') : t('header.move_sidebar_left')}
            >
              {sidebarPosition === 'left' ? <PanelLeftClose size={16} className="md:w-[18px] md:h-[18px]" /> : <PanelRightClose size={16} className="md:w-[18px] md:h-[18px]" />}
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3" ref={notificationsRef}>
          <button 
            onClick={toggleNotificationsMenu}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-md group relative ${isNotificationsOpen ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent/20' : 'bg-white/20 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-accent hover:border-accent'}`}
          >
            <Bell size={18} className={`transition-transform duration-300 ${isNotificationsOpen ? 'scale-110' : 'group-hover:scale-110'}`} />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 flex items-center justify-center bg-accent text-[8px] text-white font-black min-w-[18px] h-[18px] px-1 rounded-full border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in duration-300"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && <NotificationDropdown onClose={() => setIsNotificationsOpen(false)} />}
        </div>


        {/* Divider */}
        <div className="h-8 w-px bg-slate-200/50 dark:bg-slate-800/50 hidden sm:block mx-1 md:mx-2" />

        {/* User Profile */}
        <div
          className="flex items-center gap-3 cursor-pointer group relative"
          ref={profileRef}
          onClick={toggleProfileMenu}
        >
          <div className="relative">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 shadow-lg transition-all duration-300 group-hover:scale-105 ${isProfileOpen ? 'border-accent shadow-accent/20' : 'border-white dark:border-slate-800'}`}>
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`}
                alt={user?.name || 'User'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950 shadow-sm flex items-center justify-center">
              <CheckCircle2 size={8} className="text-white" />
            </div>
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user?.name || 'Loading...'}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter opacity-70">{user?.plan || t('header.professional_plan')}</span>
          </div>

          {isProfileOpen && <ProfileDetails onClose={() => setIsProfileOpen(false)} />}
        </div>
      </div>
    </header>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

export default DashboardHeader;
