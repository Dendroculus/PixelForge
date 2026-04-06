import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { NAV_LINKS } from '../../data/navConfig';

/**
 * Purpose: Renders animated ambient background with floating blurred orbs
 * Why: Adds visual depth while respecting reduced motion preferences
 */
const AmbientBackground = () => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-pink-400/20 rounded-full blur-[120px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <motion.div
        animate={{ x: [0, 50, -50, 0], y: [0, -50, 50, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ x: [0, -60, 60, 0], y: [0, 60, -60, 0], scale: [1, 0.9, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}
        className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#EEAECA]/20 rounded-full blur-[120px]"
      />
    </div>
  );
};

/**
 * Purpose: Displays rotating action words with animation
 * Why: Makes hero text dynamic without layout shifting
 * Note: Memoized to prevent re-renders when parent state changes
 */
const RotatingText = React.memo(() => {
  const words = ["create.", "enhance.", "transform.", "optimize."];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="inline-block relative w-[220px] text-left">
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute left-0 top-0 text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      <span className="opacity-0 pointer-events-none">transform.</span>
    </div>
  );
});

/**
 * Purpose: Interactive card with 3D tilt based on cursor position
 * Why: Enhances UX by giving depth and responsiveness to card elements
 */
const TiltCard = ({ children, to, itemVariants }) => {
  const ref = useRef(null);
  const rectRef = useRef(null); // Cache the bounding box to prevent layout thrashing
  const shouldReduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-4deg", "4deg"]);

  // Calculate size ONLY when the mouse enters the card
  const handleMouseEnter = () => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e) => {
    if (!rectRef.current || shouldReduceMotion) return;

    // Use cached rectRef instead of recalculating
    const mouseX = e.clientX - rectRef.current.left;
    const mouseY = e.clientY - rectRef.current.top;

    x.set(mouseX / rectRef.current.width - 0.5);
    y.set(mouseY / rectRef.current.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rectRef.current = null; // Clear cache
  };

  return (
    <motion.div
      variants={itemVariants}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        rotateX: shouldReduceMotion ? 0 : rotateX,
        rotateY: shouldReduceMotion ? 0 : rotateY,
        willChange: "transform" // Forces GPU Hardware Acceleration
      }}
      className="perspective-1000"
    >
      <Link
        to={to}
        className="group block relative p-5 sm:p-6 bg-white/50 backdrop-blur-xl border border-white/60 rounded-3xl transition-all duration-300 hover:bg-white/80 hover:border-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
        style={{ transform: "translateZ(20px)" }}
      >
        {children}
      </Link>
    </motion.div>
  );
};

/**
 * Purpose: Renders icon for each card
 * Why: Standardizes icon styling and AI highlighting
 */
const CardIcon = ({ d, isAi }) => {
  const bgClass = isAi 
    ? "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20" 
    : "bg-white/80 border border-slate-200/60 shadow-sm";
  const colorClass = isAi ? "text-white" : "text-slate-700";

  return (
    <div className={`w-14 h-14 min-w-[56px] rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}>
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );
};

/**
 * Purpose: Main hub page displaying categorized image tools
 * Why: Central entry point for navigating all features
 */
export default function HomeHub() {
  const categoryKeys = Object.keys(NAV_LINKS);
  const [activeTab, setActiveTab] = useState(categoryKeys[0]);
  const currentCategory = NAV_LINKS[activeTab];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      <AmbientBackground />

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 pt-16 pb-24">
        <div className="text-center mb-12 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-slate-700 text-xs font-bold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>The Open-Source Image Studio</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>What would you like to</span>
            <RotatingText />
          </h1>

          <p className="text-slate-600 font-medium max-w-lg mx-auto">
            Select a toolkit below to enhance, edit, and optimize your images with zero compression loss.
          </p>
        </div>

        <div className="flex justify-center mb-10 relative z-10">
          <div className="flex items-center p-1.5 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full shadow-sm overflow-x-auto max-w-full hide-scrollbar">
            {categoryKeys.map((key) => {
              const isActive = activeTab === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative px-6 py-2.5 rounded-full text-sm font-bold transition-colors duration-300 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-100"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 relative z-10"
          >
            {currentCategory.items.map((item) => (
              <TiltCard key={item.id} to={item.to} itemVariants={itemVariants}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5 sm:gap-6">
                    <CardIcon d={item.icon} isAi={item.isAi} />

                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.label}
                        </h3>

                        {item.isAi && (
                          <div className="relative overflow-hidden rounded-full border border-indigo-200">
                            <motion.div
                              animate={{ x: ["-100%", "200%"] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                              className="absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12"
                            />
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

                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0">
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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