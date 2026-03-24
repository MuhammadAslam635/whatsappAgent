import React, { memo, useMemo, useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Upload, Settings, LogOut, Send, Bot, Loader2, X } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../store/AuthContext';

interface SidebarItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
}

interface SidebarProps {
  position?: 'left' | 'right';
  isOpen?: boolean;
  onClose?: () => void;
}


const SidebarItemComponent: React.FC<{
  item: SidebarItem;
  position: 'left' | 'right';
  // isActive: boolean; // Removed
  // onClick: () => void; // Removed
}> = memo(({ item, position }) => {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) => `
        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 group relative
        ${isActive
          ? 'bg-white text-accent shadow-lg scale-110'
          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white hover:scale-105'
        }
      `}
      style={({ isActive }) => isActive ? { color: 'var(--accent)' } : {}}
      title={item.label}
    >
      <Icon size={18} className="md:w-[22px] md:h-[22px]" />

      {/* Tooltip (Desktop) */}
      <span className={`absolute ${position === 'left' ? 'left-16' : 'right-16'} px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl`}>
        {item.label}
      </span>
    </NavLink>
  );
});

SidebarItemComponent.displayName = 'SidebarItemComponent';

const Sidebar: React.FC<SidebarProps> = memo(({ position = 'left', isOpen, onClose }) => {

  const { t } = useTranslation();

  const items: SidebarItem[] = useMemo(() => [
    { id: 'dashboard', icon: LayoutDashboard, label: t('sidebar.overview'), path: '/dashboard' },
    { id: 'chat', icon: MessageSquare, label: t('sidebar.chat'), path: '/dashboard/chat' },
    { id: 'bulk', icon: Send, label: 'Bulk Message', path: '/dashboard/bulk' },
    { id: 'upload', icon: Upload, label: t('sidebar.upload'), path: '/dashboard/upload' },
    { id: 'ai', icon: Bot, label: 'AI Bot', path: '/dashboard/ai' },
    { id: 'settings', icon: Settings, label: t('sidebar.settings'), path: '/dashboard/settings' },
  ], [t]);
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed', error);
      setIsLoggingOut(false);
    }
  }, [logout]);

  return (
    <aside
      className={`fixed top-0 h-screen w-20 md:w-24 bg-accent flex flex-col items-center py-6 md:py-10 shadow-2xl z-[100] transition-all duration-500 overflow-y-auto scrollbar-hide
        ${position === 'left' ? 'left-0 rounded-r-[40px]' : 'right-0 rounded-l-[40px]'}
        ${isOpen ? 'translate-x-0' : (position === 'left' ? '-translate-x-full' : 'translate-x-full')} lg:translate-x-0
      `}

      style={{ backgroundColor: 'var(--accent)' }}
    >
      {/* Mobile Close Button */}
      {onClose && (
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      )}

      {/* Logo Section */}
      <div className="mb-10 md:mb-16">
        <NavLink to="/" className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:rotate-12">
          <div className="w-6 h-6 md:w-8 md:h-8 text-accent font-black flex items-center justify-center text-lg md:text-xl italic" style={{ color: 'var(--accent)' }}>
            W
          </div>
        </NavLink>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center gap-6 md:gap-8">
        {items.map((item) => (
          <SidebarItemComponent
            key={item.id}
            item={item}
            position={position}
          // isActive={activeTab === item.id} // Removed
          // onClick={() => onTabChange(item.id)} // Removed
          />
        ))}
      </nav>

      {/* Logout Button */}
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300 group relative disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('sidebar.logout')}
        >
          {isLoggingOut ? (
            <Loader2 size={18} className="animate-spin md:w-[22px] md:h-[22px]" />
          ) : (
            <LogOut size={18} className="md:w-[22px] md:h-[22px]" />
          )}
          <span className={`absolute ${position === 'left' ? 'left-16' : 'right-16'} px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl`}>
            {isLoggingOut ? 'Logging out...' : t('sidebar.logout')}
          </span>
        </button>
      </div>
    </aside>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
