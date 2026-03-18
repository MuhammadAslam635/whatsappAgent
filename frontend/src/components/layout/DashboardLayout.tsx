import React, { memo, ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../features/dashboard/components/Sidebar';
import DashboardHeader from '../../features/dashboard/components/DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = memo(({ children }) => {
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const location = useLocation();
  const isChatPage = location.pathname === '/dashboard/chat';

  const toggleSidebarPosition = () => {
    setSidebarPosition(prev => prev === 'left' ? 'right' : 'left');
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden flex flex-col">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] animate-pulse" style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }} />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-accent/10 blur-[100px] animate-bounce" style={{ backgroundColor: 'var(--accent)', opacity: 0.1, animationDuration: '8s' }} />
        <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] rounded-full bg-accent/5 blur-[80px]" style={{ backgroundColor: 'var(--accent)', opacity: 0.05 }} />
      </div>

      {/* Sticky Fixed Sidebar */}
      <Sidebar position={sidebarPosition} />

      {/* Main Container */}
      <div className={`transition-all duration-500 ease-in-out h-full flex flex-col relative z-10 ${
          isChatPage ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'
        } ${
          sidebarPosition === 'left' ? 'ml-20 md:ml-24' : 'mr-20 md:mr-24'
        }`}>
        {/* Sticky Header */}
        <DashboardHeader sidebarPosition={sidebarPosition} onToggleSidebarPosition={toggleSidebarPosition} />

        {/* Content Area */}
        <main className={`flex-1 p-4 md:p-6 lg:p-8 transition-all duration-300 relative z-0 flex flex-col ${isChatPage ? 'min-h-0 overflow-hidden' : ''}`}>
          <div className={`max-w-7xl mx-auto w-full ${isChatPage ? 'h-full flex flex-col min-h-0' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

export default DashboardLayout;
