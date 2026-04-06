import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { NAV_LINKS } from '../../data/navConfig';

const AmbientBackground = () => {
  const shouldReduceMotion = useReducedMotion();
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  if (shouldReduceMotion || isMobile) {
    return (
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[460px] h-[460px] bg-indigo-400/20 rounded-full blur-[90px]" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[420px] h-[420px] bg-[#EEAECA]/20 rounded-full blur-[90px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <motion.div
        animate={{ x: [0, 40, -40, 0], y: [0, -40, 40, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
        className="absolute top-0 left-1/4 w-[560px] h-[560px] bg-indigo-400/20 rounded-full blur-[110px]"
      />
      <motion.div
        animate={{ x: [0, -45, 45, 0], y: [0, 45, -45, 0], scale: [1, 0.96, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ willChange: 'transform' }}
        className="absolute bottom-0 right-1/4 w-[560px] h-[560px] bg-[#EEAECA]/20 rounded-full blur-[110px]"
      />
    </div>
  );
};

/** Rotating hero word with no clipping/layout shift. */
const RotatingText = React.memo(() => {
  const words = useMemo(() => ['create.', 'enhance.', 'transform.', 'optimize.'], []);
  const [index, setIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <span className="inline-grid place-items-center min-w-[11ch] leading-[1.2] align-middle">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={index}
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 pb-[0.08em]"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});

const TiltCard = ({ children, to, itemVariants }) => {
  const ref = useRef(null);
  const rectRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const isTouchDevice =
    typeof window !== 'undefined' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 768px)').matches);

  const disableTilt = shouldReduceMotion || isTouchDevice;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 140, damping: 22, mass: 0.4 });
  const mouseYSpring = useSpring(y, { stiffness: 140, damping: 22, mass: 0.4 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['3deg', '-3deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-3deg', '3deg']);

  const handleMouseEnter = () => {
    if (disableTilt) return;
    if (ref.current) rectRef.current = ref.current.getBoundingClientRect();
  };

  const handleMouseMove = (e) => {
    if (!rectRef.current || disableTilt) return;
    const mouseX = e.clientX - rectRef.current.left;
    const mouseY = e.clientY - rectRef.current.top;
    x.set(mouseX / rectRef.current.width - 0.5);
    y.set(mouseY / rectRef.current.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rectRef.current = null;
  };

  return (
    <motion.div
      variants={itemVariants}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: disableTilt ? 'flat' : 'preserve-3d',
        rotateX: disableTilt ? 0 : rotateX,
        rotateY: disableTilt ? 0 : rotateY,
        willChange: disableTilt ? 'auto' : 'transform'
      }}
    >
      <Link
        to={to}
        className="group block relative p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl transition-all duration-300 hover:bg-white/80 hover:border-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
        style={{ transform: disableTilt ? 'none' : 'translateZ(16px)' }}
      >
        {children}
      </Link>
    </motion.div>
  );
};

const CardIcon = ({ d, isAi }) => {
  const bgClass = isAi
    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20'
    : 'bg-white/80 border border-slate-200/60 shadow-sm';
  const colorClass = isAi ? 'text-white' : 'text-slate-700';

  return (
    <div
      className={`w-14 h-14 min-w-[56px] rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );
};

export default function HomeHub() {
  const categoryKeys = useMemo(() => Object.keys(NAV_LINKS), []);
  const [activeTab, setActiveTab] = useState(categoryKeys[0]);
  const currentCategory = NAV_LINKS[activeTab];
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: shouldReduceMotion ? 0 : 0.06 }
    }
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: shouldReduceMotion
        ? { duration: 0.18 }
        : { type: 'spring', stiffness: 260, damping: 24 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <AmbientBackground />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 pt-14 sm:pt-16 pb-20 sm:pb-24">
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
            Select a toolkit below to enhance, edit, and optimize your images with zero compression loss.
          </p>
        </div>

        <div className="flex justify-center mb-8 sm:mb-10 relative z-10">
        <div className="flex items-center p-1.5 bg-white/70 md:bg-white/40 md:backdrop-blur-xl border border-white/60 rounded-full shadow-sm overflow-x-auto max-w-full hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none]">            {categoryKeys.map((key) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-100"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{NAV_LINKS[key].title}</span>
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
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8, transition: { duration: 0.18 } }}
            className="flex flex-col gap-4 relative z-10"
          >
            {currentCategory.items.map((item) => (
              <TiltCard key={item.id} to={item.to} itemVariants={itemVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <CardIcon d={item.icon} isAi={item.isAi} />

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.label}
                        </h3>

                        {item.isAi && (
                          <div className="relative overflow-hidden rounded-full border border-indigo-200">
                            {!shouldReduceMotion && (
                              <motion.div
                                animate={{ x: ['-120%', '220%'] }}
                                transition={{ duration: 2.2, repeat: Infinity, ease: 'linear', repeatDelay: 1.2 }}
                                className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
                              />
                            )}
                            <span className="relative block text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 font-black tracking-wider uppercase">
                              AI
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md hidden sm:block">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
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