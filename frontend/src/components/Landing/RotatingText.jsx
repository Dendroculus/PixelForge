import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

/**
 * Animated rotating text component that cycles through predefined words.
 *
 * @returns {JSX.Element} Rotating text animation component.
 */
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
          className="block whitespace-nowrap text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-500 pb-[0.08em]"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
});

RotatingText.displayName = 'RotatingText';

export default RotatingText;