import React, { memo, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

const Card: React.FC<CardProps> = memo(({ children, className = '', glass = false }) => {
  const baseStyles = 'rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden';
  const glassStyles = glass ? 'bg-white/70 backdrop-blur-xl' : 'bg-white dark:bg-slate-950';

  return (
    <div className={`${baseStyles} ${glassStyles} ${className}`}>
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
