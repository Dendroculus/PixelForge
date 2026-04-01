import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

export default function LegalModal({ isOpen, onClose, title, children }) {
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsMounted(true);
    } else {
      setIsAnimating(false); // Instantly starts the fade-out animation when closed
    }
  }

  useEffect(() => {
    let timer;
    if (isOpen) {
      timer = setTimeout(() => setIsAnimating(true), 10);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isMounted) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onTransitionEnd={() => {
        if (!isOpen) setIsMounted(false);
      }}
    >
      
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-in-out
          ${isAnimating ? 'bg-slate-900/40 backdrop-blur-sm opacity-100' : 'bg-slate-900/0 backdrop-blur-none opacity-0'}
        `}
        aria-hidden="true"
      />
      
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden transition-all duration-300 ease-in-out
          ${isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}
        `}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/50">
          <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            aria-label="Close dialog"
            tabIndex={isAnimating ? 0 : -1} 
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="px-6 py-6 overflow-y-auto text-slate-700 space-y-4 text-sm leading-relaxed">
          {children}
        </div>
        
        <div className="px-6 py-4 border-t border-slate-200/60 bg-slate-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
            tabIndex={isAnimating ? 0 : -1} 
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

LegalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};