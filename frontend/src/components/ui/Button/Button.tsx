import React, { ButtonHTMLAttributes, ReactNode, memo } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = memo(({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'rounded-xl transition-all duration-300 font-semibold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs md:text-sm',
    md: 'px-5 py-2.5 text-xs md:text-base',
    lg: 'px-8 py-3 md:py-4 text-sm md:text-lg',
  };

  const variants = {
    primary: 'bg-accent text-white hover:opacity-90 shadow-lg shadow-accent/20 border border-accent/10',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700',
    outline: 'border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white hover:border-accent dark:hover:border-accent bg-transparent',
    ghost: 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900',
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
