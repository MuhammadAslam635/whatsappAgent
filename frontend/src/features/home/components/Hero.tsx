import React, { memo } from 'react';
import Button from '../../../components/ui/Button/Button';
import {
  Sparkles,
  Play,
  ArrowRight,
} from 'lucide-react';

const Hero: React.FC = memo(() => {
  return (
    <section className="relative pt-12 pb-8 md:pt-20 md:pb-16 overflow-hidden bg-white dark:bg-[#020617] border-b border-slate-100 dark:border-slate-950">
      {/* Grid Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.4] dark:opacity-[0.1]"
        style={{
          backgroundImage: 'var(--grid-pattern)',
          backgroundSize: '24px 24px md:32px 32px'
        }}
      />

      {/* Subtle Bottom Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-white dark:from-[#020617] to-transparent z-0" />

      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-300 font-medium text-[10px] md:text-sm animate-in fade-in slide-in-from-top-4">
            <Sparkles size={12} className="text-accent md:w-[14px] md:h-[14px]" />
            <span>Now with AI-Powered Campaigns</span>
            <ArrowRight size={12} className="text-slate-400 md:w-[14px] md:h-[14px]" />
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-7xl font-black tracking-tight text-[#334155] dark:text-slate-200 leading-[1.1]">
              Send Bulk WhatsApp Messages <br className="hidden md:block" />
              <span className="relative inline-block text-accent mt-1 md:mt-2">
                Effortlessly
                <svg className="absolute -bottom-2 left-0 w-full" height="8 md:12" viewBox="0 0 400 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 8.5C50 4.5 150 2.5 395 10.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-base md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed px-2 md:px-0">
            Reach thousands of customers instantly with personalized WhatsApp campaigns.
            Automate, schedule, and track — all from one dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto px-4 sm:px-0">
            <Button size="lg" className="w-full sm:w-auto bg-accent text-white hover:bg-accent/90 px-8 h-12 md:h-14 text-sm md:text-lg rounded-xl md:rounded-2xl shadow-3d hover:shadow-3d-hover hover:-translate-y-1 transition-all duration-300 border-none">
              Start Free Trial <ArrowRight size={18} className="md:w-[20px] md:h-[20px]" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 px-8 h-12 md:h-14 text-sm md:text-lg rounded-xl md:rounded-2xl shadow-sm hover:shadow-3d hover:-translate-y-1 transition-all duration-300">
              <Play size={18} className="fill-current md:w-[20px] md:h-[20px]" /> Watch Demo
            </Button>
          </div>

          {/* Onboarding Stack */}
          <div className="pt-2 md:pt-4 flex flex-col items-center gap-2 md:gap-3">
            <div className="flex items-center -space-x-2 md:-space-x-3">
              {['S', 'M', 'A', 'K'].map((initial, i) => (
                <div
                  key={i}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 md:border-4 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-xs md:text-sm shadow-sm"
                >
                  {initial}
                </div>
              ))}
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-slate-100">2,000+</span> teams onboard
            </p>
          </div>

        </div>
      </div>
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
