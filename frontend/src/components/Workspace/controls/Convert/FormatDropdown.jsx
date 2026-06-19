import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Renders a reusable fixed-position format dropdown with Type-to-Search.
 * @param {{
 * value: string,
 * options: string[],
 * onChange: (value: string) => void,
 * label?: string,
 * transform?: 'uppercase' | 'lowercase' | 'none',
 * labelClassName?: string,
 * buttonClassName?: string,
 * getOptionStyle?: (opt: string) => object,
 * optionClassName?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function FormatDropdown({
  value,
  options,
  onChange,
  label = 'Convert To',
  transform = 'uppercase',
  labelClassName = 'mb-2 block text-xs font-bold text-slate-700',
  buttonClassName = 'flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
  getOptionStyle = () => ({}),
  optionClassName = '',
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef({});
  const searchBuffer = useRef('');
  const searchTimeout = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);

  const formatText = (text) => {
    if (transform === 'uppercase') return String(text).toUpperCase();
    if (transform === 'lowercase') return String(text).toLowerCase();
    return String(text);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      const inTrigger = triggerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard Navigation (Type-to-Search)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }

      // Ignore modifiers and non-character keys (except for standard navigation)
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;

      e.preventDefault(); // Stop page scrolling when typing

      searchBuffer.current += e.key.toLowerCase();
      
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => {
        searchBuffer.current = '';
      }, 600); // Reset buffer after 600ms of inactivity

      const matchIndex = options.findIndex((opt) =>
        String(opt).toLowerCase().startsWith(searchBuffer.current)
      );

      if (matchIndex !== -1) {
        const matchOpt = options[matchIndex];
        const el = optionRefs.current[matchOpt];
        if (el) {
          el.scrollIntoView({ block: 'nearest' });
          el.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [isOpen, options]);

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
      {label && <label className={labelClassName}>{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={buttonClassName}
      >
        <span className="truncate">{formatText(value)}</span>
        <svg className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          className="overflow-y-auto max-h-48 custom-scrollbar rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="flex flex-col p-1.5">
            {options.map((opt) => (
              <button
                key={opt}
                ref={(el) => (optionRefs.current[opt] = el)}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                style={getOptionStyle(opt)}
                className={`rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-indigo-50 ${
                  value === opt 
                    ? 'bg-indigo-100 text-indigo-700 font-bold' 
                    : 'text-slate-700 hover:bg-slate-100'
                } ${optionClassName}`}
              >
                {formatText(opt)}
              </button>
            ))}
          </div>
        </motion.div>,
        document.body
      )}
    </div>
  );
}

FormatDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  transform: PropTypes.oneOf(['uppercase', 'lowercase', 'none']),
  labelClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  getOptionStyle: PropTypes.func,
  optionClassName: PropTypes.string,
};