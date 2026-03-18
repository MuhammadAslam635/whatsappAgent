import React, { memo } from 'react';
import {
  MessageSquare,
  Calendar,
  Users,
  BarChart3,
  Zap,
  Image as ImageIcon,
  ArrowUpRight
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  highlighted?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({
  icon: Icon,
  title,
  description,
  highlighted = false
}) => (
  <div className={`
    relative group p-4 md:p-8 rounded-2xl md:rounded-4xl border-2 transition-all duration-300 overflow-hidden
    ${highlighted
      ? 'bg-slate-50 dark:bg-slate-900/50 border-accent/20'
      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800'}
    hover:border-accent/30 hover:shadow-3d hover:-translate-y-2
  `}>
    {/* Highlight Background Decoration */}
    {highlighted && (
      <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-accent/5 rounded-full blur-2xl md:blur-3xl -mr-8 -mt-8 md:-mr-16 md:-mt-16 group-hover:bg-accent/10 transition-colors" />
    )}

    {/* Icon Container */}
    <div className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent/5 dark:bg-accent/10 flex items-center justify-center text-accent mb-3 md:mb-6">
      <Icon size={18} className="md:w-[24px] md:h-[24px]" />
    </div>

    {/* Arrow Icon for Highlighted Card */}
    {highlighted && (
      <div className="absolute top-4 right-4 md:top-8 md:right-8 text-slate-400 dark:text-slate-600 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
        <ArrowUpRight size={14} className="md:w-[20px] md:h-[20px]" />
      </div>
    )}

    <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white mb-1.5 md:mb-3 tracking-tight">
      {title}
    </h3>

    <p className="text-[10px] md:text-sm leading-relaxed text-slate-500 dark:text-slate-400 antialiased">
      {description}
    </p>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

const FeaturesSection: React.FC = memo(() => {
  const features = [
    {
      icon: MessageSquare,
      title: "Bulk Messaging",
      description: "Send thousands of personalized WhatsApp messages with a single click.",
      highlighted: true
    },
    {
      icon: Calendar,
      title: "Scheduling",
      description: "Schedule campaigns at optimal times for timezone-aware delivery.",
    },
    {
      icon: Users,
      title: "Contacts",
      description: "Import, segment, and manage contacts effortlessly with smart filters.",
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Real-time delivery reports and conversion tracking for every campaign.",
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Build automated workflows with multi-step replies and routing.",
    },
    {
      icon: ImageIcon,
      title: "Media",
      description: "Send images, videos, and PDFs to drive higher engagement.",
    },
  ];

  return (
    <section id="features" className="py-10 md:py-20 bg-white dark:bg-[#020617]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 mb-8 md:mb-10">
          <div className="inline-flex items-center px-3 md:px-4 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-[8px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 tracking-[0.2em] uppercase">
            Features
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Everything you need <br className="hidden md:block" />
            to scale your <span className="text-accent">outreach</span>
          </h2>
          <p className="text-sm md:text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto px-4">
            A complete toolkit for WhatsApp marketing.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              highlighted={feature.highlighted}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

export default FeaturesSection;
