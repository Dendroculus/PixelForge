import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Decorative animated background component with responsive and reduced motion support.
 *
 * @returns {JSX.Element} Ambient background with animated or static gradients.
 */
export default function AmbientBackground() {
  const shouldReduceMotion = useReducedMotion();
  
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const indigoGradient = 'radial-gradient(circle, rgba(129,140,248,0.25) 0%, rgba(129,140,248,0) 65%)';
  const pinkGradient = 'radial-gradient(circle, rgba(238,174,202,0.25) 0%, rgba(238,174,202,0) 65%)';

  if (shouldReduceMotion || isMobile) {
    return (
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div 
          className="absolute top-10 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full" 
          style={{ background: indigoGradient }}
        />
        <div 
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full" 
          style={{ background: pinkGradient }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
      <motion.div
        animate={{ x: [0, 40, -40, 0], y: [0, -40, 40, 0], scale: [1, 1.06, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ background: indigoGradient, willChange: 'transform' }}
        className="absolute -top-20 left-1/4 w-175 h-175 rounded-full"
      />
      <motion.div
        animate={{ x: [0, -45, 45, 0], y: [0, 45, -45, 0], scale: [1, 0.96, 1.06, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{ background: pinkGradient, willChange: 'transform' }}
        className="absolute -bottom-20 right-1/4 w-175 h-175 rounded-full"
      />
    </div>
  );
}