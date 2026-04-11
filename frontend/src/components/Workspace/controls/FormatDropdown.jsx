import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

/**
 * Renders a reusable fixed-position format dropdown.
 * @param {{
 *   value: string,
 *   options: string[],
 *   onChange: (value: string) => void,
 *   label?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function FormatDropdown({
  value,
  options,
  onChange,
  label = 'Convert To',
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  useEffect(() => {
    function handleClickOutside(event) {
      const inTrigger = triggerRef.current && triggerRef.current.contains(event.target);
      const inMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!inTrigger && !inMenu) setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={triggerRef}>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {String(value).toUpperCase()}
        <svg className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && menuStyle && createPortal(
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={menuStyle}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex flex-col p-2">
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${value === opt ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'}`}
              >
                {String(opt).toUpperCase()}
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}