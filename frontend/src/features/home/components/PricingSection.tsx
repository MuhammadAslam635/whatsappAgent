import React, { memo } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Button from '../../../components/ui/Button/Button';

interface PricingFeatureProps {
  text: string;
}

const PricingFeature: React.FC<PricingFeatureProps> = memo(({ text }) => (
  <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-sm text-slate-500 dark:text-slate-400">
    <div className="flex-none w-4 h-4 md:w-5 md:h-5 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center text-accent">
      <Check size={10} className="md:w-[12px] md:h-[12px]" />
    </div>
    <span className="truncate">{text}</span>
  </div>
));

PricingFeature.displayName = 'PricingFeature';

interface PricingCardProps {
  tier: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = memo(({
  tier,
  price,
  description,
  features,
  highlighted = false
}) => (
  <div className={`
    relative flex flex-col p-5 md:p-8 rounded-2xl md:rounded-4xl border-2 transition-all duration-300
    ${highlighted
      ? 'bg-slate-50 dark:bg-slate-900/50 border-accent z-10 shadow-3d hover:shadow-3d-hover hover:-translate-y-2'
      : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:shadow-3d hover:-translate-y-1'}
  `}>
    {highlighted && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-white text-[8px] md:text-[10px] font-bold uppercase tracking-widest shadow-lg whitespace-nowrap">
        Most Popular
      </div>
    )}

    <div className="mb-4 md:mb-8">
      <h3 className="text-sm md:text-xl font-bold text-slate-900 dark:text-white mb-1 md:mb-2">{tier}</h3>
      <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 leading-tight md:leading-relaxed font-medium line-clamp-2">
        {description}
      </p>
    </div>

    <div className="mb-4 md:mb-8 flex items-baseline gap-1">
      <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">${price}</span>
      <span className="text-slate-400 dark:text-slate-500 text-[10px] md:text-sm font-medium">/mo</span>
    </div>

    <Button
      variant={highlighted ? 'primary' : 'outline'}
      className={`
        w-full h-10 md:h-12 rounded-lg md:rounded-xl mb-6 md:mb-10 group text-xs md:text-sm
        ${highlighted
          ? 'bg-accent text-white hover:bg-accent/90 border-none'
          : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900'}
      `}
    >
      Get Started
    </Button>

    <div className="space-y-2 md:space-y-4 pt-4 md:pt-8 border-t border-slate-100 dark:border-slate-800">
      {features.slice(0, 4).map((feature, i) => (
        <PricingFeature key={i} text={feature} />
      ))}
    </div>
  </div>
));

PricingCard.displayName = 'PricingCard';

const PricingSection: React.FC = memo(() => {
  const plans = [
    {
      tier: "Starter",
      price: "29",
      description: "Perfect for small businesses starting out.",
      features: [
        "1,000 messages/month",
        "Basic templates",
        "Contact management",
        "Email support",
      ]
    },
    {
      tier: "Pro",
      price: "79",
      description: "For growing teams that need automation.",
      highlighted: true,
      features: [
        "10,000 messages/month",
        "Advanced templates",
        "Campaign scheduling",
        "Priority support",
      ]
    },
    {
      tier: "Business",
      price: "199",
      description: "Enterprise features for large teams.",
      features: [
        "Unlimited messages",
        "Custom templates",
        "Advanced automation",
        "Dedicated manager",
      ]
    }
  ];

  return (
    <section id="pricing" className="py-12 md:py-24 bg-white dark:bg-[#020617] relative text-slate-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4 mb-10 md:mb-12">
          <div className="inline-flex items-center px-3 md:px-4 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[8px] md:text-[10px] font-black text-accent tracking-[0.2em] uppercase">
            Pricing
          </div>
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Simple, transparent <span className="text-accent">pricing</span>
          </h2>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              {...plan}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

PricingSection.displayName = 'PricingSection';

export default PricingSection;
