import React, { memo } from 'react';

const Footer: React.FC = memo(() => {
  return (
    <footer
      className="py-12 border-t border-white/10 dark:border-slate-900 transition-colors duration-300 bg-accent dark:bg-[#020617]"
      style={{ backgroundColor: 'var(--accent)' }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-white font-black text-sm border border-white/20 transition-transform group-hover:scale-110">
              W
            </div>
            <span className="text-lg font-bold tracking-tight text-white dark:text-white">
              WaBlast
            </span>
          </div>

          {/* Minimal Links */}
          <nav className="flex items-center gap-8">
            <a href="#" className="text-sm font-semibold text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm font-semibold text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="text-sm font-semibold text-white/70 dark:text-slate-400 hover:text-white dark:hover:text-accent transition-colors">Contact</a>
          </nav>

          {/* Copyright */}
          <div className="text-sm text-white/50 dark:text-slate-600 font-medium">
            © {new Date().getFullYear()} WaBlast. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;
