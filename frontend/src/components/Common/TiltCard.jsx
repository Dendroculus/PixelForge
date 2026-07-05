import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Interactive card component with 3D tilt animation and navigation support.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Card content.
 * @param {string} props.to - Navigation destination path.
 * @param {Object} props.itemVariants - Framer Motion animation variants.
 *
 * @returns {JSX.Element} Tilt-enabled navigation card.
 */
export default function TiltCard({ children, to, itemVariants }) {
  const ref = useRef(null);
  const rectRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  const [isTouchDevice] = useState(() => {
      if (typeof window === 'undefined') return false;
      return window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
    });

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
        className="group block relative p-5 sm:p-6 bg-white/80 md:bg-white/50 backdrop-blur-md md:backdrop-blur-xl border border-white/60 rounded-3xl transition-all duration-300 hover:bg-white/90 md:hover:bg-white/80 hover:border-white shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transform-gpu"
        style={{ transform: disableTilt ? 'none' : 'translateZ(16px)' }}
      >
        {children}
      </Link>
    </motion.div>
  );
}

TiltCard.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string.isRequired,
  itemVariants: PropTypes.object.isRequired,
};