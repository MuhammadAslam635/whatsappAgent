import React, { memo } from 'react';
import { Upload, FileText, Send, TrendingUp } from 'lucide-react';

interface StepCardProps {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = memo(({ number, icon: Icon, title, description }) => (
  <div className="relative flex flex-col items-center text-center p-4 md:p-8 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl md:rounded-4xl transition-all duration-300 hover:shadow-3d hover:-translate-y-2 group">
    {/* Step Number Badge */}
    <div className="absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 w-7 h-7 md:w-10 md:h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs md:text-sm shadow-xl shadow-accent/20 border-2 md:border-4 border-white dark:border-[#020617] transition-transform group-hover:scale-110">
      {number}
    </div>

    {/* Icon Container */}
    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent/5 dark:bg-accent/10 flex items-center justify-center text-accent mb-4 md:mb-6">
      <Icon size={18} className="md:w-[24px] md:h-[24px]" />
    </div>

    <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white mb-2 md:mb-3 tracking-tight">
      {title}
    </h3>

    <p className="text-[10px] md:text-sm leading-relaxed text-slate-500 dark:text-slate-400 antialiased">
      {description}
    </p>
  </div>
));

StepCard.displayName = 'StepCard';

const HowItWorks: React.FC = memo(() => {
  const steps = [
    {
      icon: Upload,
      title: "Upload",
      description: "Import your contact list via CSV or connect your CRM directly.",
    },
    {
      icon: FileText,
      title: "Create",
      description: "Design your message with templates and personalization.",
    },
    {
      icon: Send,
      title: "Send",
      description: "Launch immediately or schedule for the perfect delivery time.",
    },
    {
      icon: TrendingUp,
      title: "Track",
      description: "Monitor delivery, responses, and engagement in real-time.",
    },
  ];

  return (
    <section id="how-it-works" className="py-10 md:py-20 bg-slate-50/50 dark:bg-[#020617] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[1000px] h-[600px] md:h-[1000px] border border-accent rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">

        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-10">
          <div className="inline-flex items-center px-3 md:px-4 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[8px] md:text-[10px] font-black text-accent tracking-[0.2em] uppercase">
            How It Works
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Four steps to <span className="text-accent">go live</span>
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="relative">
          {/* Connecting Line (Desktop Only) */}
          <div
            className="hidden xl:block absolute top-[64px] left-[15%] right-[15%] h-[2px] opacity-[0.2] z-0"
            style={{
              background: 'linear-gradient(to right, transparent, var(--accent) 15%, var(--accent) 85%, transparent)',
              maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
            }}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <StepCard
                key={index}
                number={index + 1}
                icon={step.icon}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

HowItWorks.displayName = 'HowItWorks';

export default HowItWorks;
