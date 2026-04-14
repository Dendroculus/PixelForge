import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function LegalModal({ isOpen, onClose, title, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => {
        dialog.dataset.state = 'open';
      });
    } else if (dialog.open) {
      dialog.dataset.state = 'closing';
      const timer = setTimeout(() => {
        if (dialog.open) dialog.close();
        delete dialog.dataset.state;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e) => {
      e.preventDefault();
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      className="m-0 p-0 border-0 bg-transparent max-w-none max-h-none w-screen h-screen fixed inset-0 z-100"
    >
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="legal-backdrop absolute inset-0"
        />

        <div
          className="legal-panel relative bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white/50">
            <h2 id="modal-title" className="text-xl font-bold text-slate-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              aria-label="Close dialog"
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
            >
              Got it
            </button>
          </div>
        </div>
      </div>

      <style>{`
        dialog::backdrop { background: transparent; }

        .legal-backdrop {
          background: rgba(15, 23, 42, 0);
          backdrop-filter: blur(0px);
          transition: background 300ms ease, backdrop-filter 300ms ease;
        }

        .legal-panel {
          opacity: 0;
          transform: translateY(32px) scale(0.95);
          transition: opacity 300ms ease, transform 300ms ease;
        }

        dialog[data-state="open"] .legal-backdrop {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
        }

        dialog[data-state="open"] .legal-panel {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        dialog[data-state="closing"] .legal-backdrop {
          background: rgba(15, 23, 42, 0);
          backdrop-filter: blur(0px);
        }

        dialog[data-state="closing"] .legal-panel {
          opacity: 0;
          transform: translateY(32px) scale(0.95);
        }
      `}</style>
    </dialog>
  );
}

LegalModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};