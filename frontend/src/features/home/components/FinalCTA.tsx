import React, { memo } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../../../components/ui/Button/Button';

const FinalCTA: React.FC = memo(() => {
  return (
    <section className="py-8 md:py-16 bg-white dark:bg-[#020617] relative px-4 md:px-6 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        {/* Banner Container */}
        <div
          className="relative overflow-hidden rounded-4xl md:rounded-[3rem] bg-accent p-8 md:p-20 text-center shadow-3d hover:shadow-3d-hover transition-shadow duration-500"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          {/* Glassmorphic Background Blobs */}
          <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[60%] bg-white/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[35%] h-[50%] bg-slate-900/10 rounded-full blur-[60px] md:blur-[100px] pointer-events-none" />

          {/* Glowing "Laser" Lines */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-[-10%] w-[120%] h-px bg-linear-to-r from-transparent via-white/20 to-transparent rotate-[-15deg] blur-xs" />
            <div className="absolute top-1/3 left-[-10%] w-[120%] h-px bg-linear-to-r from-transparent via-white/10 to-transparent rotate-10 blur-xs" />
          </div>

          {/* Grainy Texture / Grid Overlay */}
          <div
            className="absolute inset-0 z-0 opacity-[0.08]"
            style={{
              backgroundImage: 'var(--grid-pattern)',
              backgroundSize: '24px 24px'
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center space-y-5 md:space-y-7">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-[10px] md:text-xs shadow-inner uppercase tracking-wider">
              <Sparkles size={12} className="animate-pulse" />
              Upgrade Your Outreach
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-2xl leading-[1.1] md:leading-tight">
              Ready to transform <br className="hidden md:block" /> your communication?
            </h2>

            <p className="text-sm md:text-lg text-white/80 max-w-xl mx-auto font-medium px-4 md:px-0 opacity-90">
              Join 10,000+ top-tier businesses already scaling with WaBlast.
              Start your 14-day free trial today.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 pt-4 w-full sm:w-auto px-4 md:px-0">
              <Button
                variant="primary"
                className="w-full sm:w-auto bg-white text-accent hover:bg-slate-50 px-8 h-12 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-lg font-bold group shadow-xl transition-all hover:-translate-y-1 border-none"
                style={{ color: 'var(--accent)' }}
              >
                Get Started Free <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                className="w-full sm:w-auto bg-white/5 backdrop-blur-sm border-white/20 text-white hover:bg-white/10 px-8 h-12 md:h-14 rounded-xl md:rounded-2xl text-sm md:text-lg font-bold transition-all hover:-translate-y-1"
              >
                Book a Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

FinalCTA.displayName = 'FinalCTA';

export default FinalCTA;
