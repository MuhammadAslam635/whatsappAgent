import React, { memo, ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../../features/dashboard/components/Sidebar';
import DashboardHeader from '../../features/dashboard/components/DashboardHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = memo(({ children }) => {
  const [sidebarPosition, setSidebarPosition] = useState<'left' | 'right'>('left');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isChatPage = location.pathname === '/dashboard/chat';


  const toggleSidebarPosition = () => {
    setSidebarPosition(prev => prev === 'left' ? 'right' : 'left');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };


  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 relative overflow-hidden flex flex-col">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent/15 blur-[120px] animate-pulse" style={{ backgroundColor: 'var(--accent)', opacity: 0.15 }} />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] rounded-full bg-accent/10 blur-[100px] animate-bounce" style={{ backgroundColor: 'var(--accent)', opacity: 0.1, animationDuration: '8s' }} />
        <div className="absolute top-[30%] right-[10%] w-[25%] h-[25%] rounded-full bg-accent/5 blur-[80px]" style={{ backgroundColor: 'var(--accent)', opacity: 0.05 }} />
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sticky Fixed Sidebar */}
      <Sidebar position={sidebarPosition} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />


      {/* Main Container */}
      <div className={`transition-all duration-500 ease-in-out h-full flex flex-col relative z-10 ${
          isChatPage ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'
        } ${
          sidebarPosition === 'left' ? 'lg:ml-24' : 'lg:mr-24'
        } ml-0`}>
        {/* Sticky Header */}
        <DashboardHeader 
          sidebarPosition={sidebarPosition} 
          onToggleSidebarPosition={toggleSidebarPosition} 
          onToggleMobileMenu={toggleMobileMenu}
        />


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
