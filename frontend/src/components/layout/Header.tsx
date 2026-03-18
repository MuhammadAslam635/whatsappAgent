import React, { memo, useMemo, useCallback, useState, Suspense, lazy } from 'react';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { Sun, Moon, Palette, Menu, X, LogIn } from 'lucide-react';
import Button from '../ui/Button/Button';

const Modal = lazy(() => import('../ui/Modal/Modal'));
const LoginForm = lazy(() => import('../../features/auth/components/LoginForm'));

interface NavItemProps {
  label: string;
  href: string;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = memo(({ label, href, onClick }) => (
  <a
    href={href}
    onClick={onClick}
    className="text-slate-900 dark:text-slate-300 hover:text-accent dark:hover:text-accent font-semibold transition-colors text-sm md:text-base"
  >
    {label}
  </a>
));

NavItem.displayName = 'NavItem';

const Header: React.FC = memo(() => {
  const { theme, toggleTheme, setAccentColor, accentColor } = useTheme();
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const toggleLoginModal = useCallback(() => setIsLoginModalOpen(prev => !prev), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAccentColor(e.target.value);
  }, [setAccentColor]);

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <div className="fixed top-2 md:top-4 left-0 right-0 z-50 px-2 md:px-4 flex justify-center">
      <header className={`w-full max-w-4xl bg-white dark:bg-slate-900/90 dark:backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl shadow-xl transition-all duration-300 ${isMenuOpen ? 'h-[320px]' : 'h-14'}`}>
        <div className="px-4 md:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 group cursor-pointer">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-accent rounded-lg md:rounded-xl flex items-center justify-center text-white font-black text-base md:text-xl shadow-lg shadow-accent/20 transition-transform group-hover:scale-110">
              W
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              WaBlast
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <NavItem key={item.label} label={item.label} href={item.href} />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Theme & Color (Compact on Mobile) */}
            <div className="flex items-center gap-2">
              <label
                className="cursor-pointer flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-accent bg-white dark:bg-slate-900 shadow-sm"
                title="Change accent color"
              >
                <Palette
                  size={16}
                  className="md:hidden"
                  style={{ color: accentColor }}
                />
                <Palette
                  size={20}
                  className="hidden md:block transition-colors"
                  style={{ color: accentColor }}
                />
                <input
                  type="color"
                  className="sr-only"
                  value={accentColor}
                  onChange={handleColorChange}
                />
              </label>

              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-accent bg-white dark:bg-slate-900 shadow-sm transition-all duration-300"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <Moon size={16} className="md:hidden text-slate-700" />
                ) : (
                  <Sun size={16} className="md:hidden text-amber-500" />
                )}
                {theme === 'light' ? (
                  <Moon size={20} className="hidden md:block text-slate-700" />
                ) : (
                  <Sun size={20} className="hidden md:block text-amber-500" />
                )}
              </button>
            </div>

            <div className="hidden xs:block h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <div className="hidden md:flex items-center">
              {isAuthenticated ? (
                <a href="/dashboard">
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold"
                  >
                    Dashboard
                  </Button>
                </a>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-accent hover:border-accent"
                  onClick={toggleLoginModal}
                >
                  <LogIn size={16} />
                  Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-slate-600 dark:text-slate-400"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden px-6 py-4 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
            {navItems.map((item) => (
              <NavItem
                key={item.label}
                label={item.label}
                href={item.href}
                onClick={toggleMenu}
              />
            ))}
            <div className="h-px bg-slate-100 dark:border-slate-800 my-2" />
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <a href="/dashboard" onClick={toggleMenu} className="w-full">
                  <Button className="w-full font-bold">
                    Dashboard
                  </Button>
                </a>
              ) : (
                <Button variant="outline" className="w-full font-bold" onClick={toggleLoginModal}>
                  <LogIn size={18} />
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      <Suspense fallback={null}>
        <Modal
          isOpen={isLoginModalOpen}
          onClose={closeLoginModal}
          title="Welcome Back"
        >
          <LoginForm onSuccess={closeLoginModal} />
        </Modal>
      </Suspense>
    </div>
  );
});

Header.displayName = 'Header';

export default Header;
