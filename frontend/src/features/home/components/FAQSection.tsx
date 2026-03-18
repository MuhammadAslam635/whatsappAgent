import React, { useState, memo, useCallback } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = memo(({ question, answer, isOpen, onClick }) => (
  <div
    className={`group rounded-2xl md:rounded-3xl border-2 transition-all duration-300 overflow-hidden bg-white dark:bg-slate-900/50 ${isOpen
      ? 'border-accent shadow-3d'
      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
  >
    <button
      onClick={onClick}
      className="w-full px-4 py-3 md:px-6 md:py-5 flex items-center justify-between text-left focus:outline-none"
    >
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`flex-none w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-colors ${isOpen ? 'bg-accent text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          }`}>
          <HelpCircle size={14} className="md:w-[20px] md:h-[20px]" />
        </div>
        <span className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight pr-4">
          {question}
        </span>
      </div>
      <div className={`transition-transform duration-300 text-accent flex-none ${isOpen ? 'rotate-180' : ''}`}>
        <ChevronDown size={16} className="md:w-[20px] md:h-[20px]" />
      </div>
    </button>

    <div
      className={`transition-all duration-300 ease-in-out px-4 md:px-6 overflow-hidden ${isOpen ? 'max-h-40 pb-4 md:pb-6 opacity-100' : 'max-h-0 opacity-0'
        }`}
    >
      <div className="pl-10 md:pl-14">
        <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-3 md:mb-4" />
        <p className="text-xs md:text-sm leading-relaxed text-slate-500 dark:text-slate-400 antialiased">
          {answer}
        </p>
      </div>
    </div>
  </div>
));

FAQItem.displayName = 'FAQItem';

const FAQSection: React.FC = memo(() => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does WaBlast automate messages?",
      answer: "WaBlast uses secure automation workflows to send personalized messages to your list. Schedule campaigns and track delivery in real-time."
    },
    {
      question: "Is it safe for business outreach?",
      answer: "Yes, we implement smart throttling and follow WhatsApp's best practices to ensure your account remains safe while maximizing your reach."
    },
    {
      question: "Can I import contacts from my CRM?",
      answer: "Absolutely. You can upload CSV files or connect directly with popular CRMs to keep your contact lists synchronized effortlessly."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No hidden fees. What you see on our pricing page is exactly what you pay. Each plan includes a specific number of messages per month."
    }
  ];

  const handleToggle = useCallback((index: number) => {
    setOpenIndex(prevIndex => prevIndex === index ? null : index);
  }, []);

  return (
    <section id="faq" className="py-10 md:py-20 bg-slate-50/50 dark:bg-[#020617]">
      <div className="max-w-3xl mx-auto px-4 md:px-6">

        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Frequently Asked <span className="text-accent">Questions</span>
          </h2>
        </div>

        {/* FAQ Grid */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>

      </div>
    </section>
  );
});

FAQSection.displayName = 'FAQSection';

export default FAQSection;
