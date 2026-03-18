import React, { memo } from 'react';
import Hero from '../components/Hero';
import TrustedSection from '../components/TrustedSection';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import PricingSection from '../components/PricingSection';
import TestimonialsSection from '../components/TestimonialsSection';
import FAQSection from '../components/FAQSection';
import FinalCTA from '../components/FinalCTA';
import Footer from '../../../components/layout/Footer';

const HomePage: React.FC = memo(() => {
  return (
    <div className="flex flex-col w-full">
      <Hero />
      <TrustedSection />
      <FeaturesSection />
      <HowItWorks />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;
