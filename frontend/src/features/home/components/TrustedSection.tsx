import React, { memo } from 'react';
import { Users, TrendingUp, Zap, Globe } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
}

const StatCard: React.FC<StatCardProps> = memo(({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center justify-center p-4 md:p-6 bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-3xl transition-all duration-300 hover:shadow-3d hover:-translate-y-2">
    <div className="mb-3 md:mb-4 text-accent">
      <Icon size={20} className="md:w-[24px] md:h-[24px]" />
    </div>
    <div className="text-2xl md:text-4xl font-black mb-1" style={{ color: 'var(--accent)' }}>
      {value}
    </div>
    <div className="text-[8px] md:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase text-center">
      {label}
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const TrustedSection: React.FC = memo(() => {
  const stats = [
    { icon: Users, value: '10,000+', label: 'Businesses Trust Us' },
    { icon: TrendingUp, value: '5M+', label: 'Messages Sent' },
    { icon: Zap, value: '99.2%', label: 'Delivery Rate' },
    { icon: Globe, value: '150+', label: 'Countries Served' },
  ];

  return (
    <section className="py-8 md:py-16 bg-white dark:bg-[#020617] relative z-20">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-[9px] md:text-xs font-bold text-slate-400 dark:text-slate-500 tracking-[0.25em] uppercase px-4">
            Trusted by Leading Companies Worldwide
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

TrustedSection.displayName = 'TrustedSection';

export default TrustedSection;
