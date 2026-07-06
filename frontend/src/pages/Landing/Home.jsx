import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { NavLinks } from '@/content/navigation/navConfig';
import { SHOWCASES } from '@/config';

import AmbientBackground from '@/components/Landing/AmbientBackground';
import RotatingText from '@/components/Landing/RotatingText';
import TiltCard from '@/components/Common/TiltCard';
import CardIcon from '@/components/Common/CardIcon';
import BeforeAfterSlider from '@/components/Common/BeforeAfterSlider';

/**
 * Main landing page component displaying image tools, showcases, and navigation categories.
 *
 * @returns {JSX.Element} Home hub interface.
 */
export default function HomeHub() {
  const categoryKeys = useMemo(() => Object.keys(NavLinks), []);
  const [activeTab, setActiveTab] = useState(categoryKeys[0]);
  const currentCategory = NavLinks[activeTab];
  const shouldReduceMotion = useReducedMotion();

  const showcases = SHOWCASES;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 },
    },
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.18 }
        : { type: 'spring', stiffness: 260, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <AmbientBackground />

      <main className="grow max-w-4xl mx-auto w-full px-4 sm:px-6 pt-14 sm:pt-16 pb-20 sm:pb-24">
        <div className="text-center mb-10 sm:mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-700 text-xs font-bold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>The Open-Source Image Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 flex flex-wrap items-center justify-center gap-x-1 sm:gap-x-2 gap-y-1 leading-[1.15]">
            <span>What would you like to</span>
            <RotatingText />
          </h1>

          <p className="text-slate-600 font-medium max-w-lg mx-auto text-sm sm:text-base">
            Select a toolkit below to enhance, edit, and optimize your images
            with zero compression loss.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-5xl mx-auto mb-16 relative z-10"
        >
          <div className="flex md:flex-wrap md:justify-center gap-4 sm:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory px-4 md:px-0 pb-4 md:pb-0 hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">
            {' '}
            {Object.entries(showcases).map(([key, data]) => (
              <div
                key={key}
                className="min-w-[85%] sm:min-w-[60%] md:min-w-0 md:basis-[calc((100%-3rem)/3)] md:max-w-76 snap-center flex flex-col items-center"
              >
                <div className="mb-3 px-3 py-1 rounded-full bg-white/60 backdrop-blur border border-white shadow-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  <span className="text-xs font-bold text-slate-700">
                    {data.label}
                  </span>
                </div>

                <div className="w-full p-1.5 bg-white/40 backdrop-blur-md border border-white/60 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <BeforeAfterSlider
                    beforeImage={data.before}
                    afterImage={data.after}
                    altText={`${data.label} comparison`}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center mb-8 sm:mb-10 relative z-10">
          <div className="flex items-center p-1.5 bg-white/70 md:bg-white/40 md:backdrop-blur-xl border border-white/60 rounded-full shadow-sm overflow-x-auto max-w-full hide-scrollbar">
            {categoryKeys.map((key) => {
              const isActive = activeTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive
                      ? 'text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-100"
                      transition={{
                        type: 'spring',
                        bounce: 0.2,
                        duration: 0.5,
                      }}
                    />
                  )}
                  <span className="relative z-10">{NavLinks[key].title}</span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : -8,
              transition: { duration: 0.18 },
            }}
            className="flex flex-col gap-4 relative z-10"
          >
            {currentCategory.items.map((item) => (
              <TiltCard key={item.id} to={item.to} itemVariants={itemVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <CardIcon d={item.icon} isAi={item.isAi} />

                    <div className="flex flex-col text-left">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {item.label}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-md mt-0.5 sm:mt-0">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0">
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </TiltCard>
            ))}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
