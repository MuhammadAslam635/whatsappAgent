import React, { memo } from 'react';
import { Star, Quote } from 'lucide-react';

interface TestimonialCardProps {
  rating: number;
  quote: string;
  author: string;
  role: string;
  initials: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = memo(({
  rating,
  quote,
  author,
  role,
  initials
}) => (
  <div className="relative group p-4 md:p-8 rounded-2xl md:rounded-4xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 transition-all duration-300 hover:shadow-3d hover:-translate-y-2 flex flex-col justify-between h-full">
    {/* Decorative Quote Icon */}
    <div className="absolute top-4 right-4 md:top-6 md:right-8 text-accent/10 dark:text-accent/20">
      <Quote size={32} className="md:w-[56px] md:h-[56px]" fill="currentColor" />
    </div>

    <div>
      {/* Rating */}
      <div className="flex gap-0.5 md:gap-1 mb-3 md:mb-6">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} size={10} className="text-accent fill-current md:w-[16px] md:h-[16px]" />
        ))}
      </div>

      {/* Quote */}
      <p className="text-[10px] md:text-base leading-relaxed text-slate-600 dark:text-slate-300 italic mb-4 md:mb-8 relative z-10 antialiased line-clamp-4 md:line-clamp-none">
        "{quote}"
      </p>
    </div>

    {/* Author Info */}
    <div className="flex items-center gap-2 md:gap-4 mt-auto border-t border-slate-50 dark:border-slate-800 pt-3 md:pt-6">
      <div className="w-7 h-7 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-[8px] md:text-sm shadow-sm flex-none">
        {initials}
      </div>
      <div className="min-w-0">
        <h4 className="font-bold text-slate-900 dark:text-white text-[9px] md:text-sm tracking-tight truncate">{author}</h4>
        <p className="text-[8px] md:text-xs text-slate-500 dark:text-slate-500 font-medium truncate">{role}</p>
      </div>
    </div>
  </div>
));

TestimonialCard.displayName = 'TestimonialCard';

const TestimonialsSection: React.FC = memo(() => {
  const testimonials = [
    {
      rating: 5,
      quote: "Transformed our outreach. We went from 100 to 10,000 messages a day with better engagement.",
      author: "Sarah Chen",
      role: "Marketing Director",
      initials: "SC"
    },
    {
      rating: 5,
      quote: "Workflow automation saved us 20 hours a week. The dashboard gives us insights we never had.",
      author: "Marcus J.",
      role: "CEO, GrowthLab",
      initials: "MJ"
    },
    {
      rating: 5,
      quote: "Clean interface, powerful features, and stellar support. Best WhatsApp tool we've used.",
      author: "Priya Sharma",
      role: "Head of Sales",
      initials: "PS"
    }
  ];

  return (
    <section className="py-10 md:py-20 bg-white dark:bg-[#020617] relative">
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight">
            Loved by <span className="text-accent">thousands</span>
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              {...testimonial}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

TestimonialsSection.displayName = 'TestimonialsSection';

export default TestimonialsSection;
