import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Renders floating action button for chatbot open/close.
 * @param {Object} props - The component props.
 * @param {boolean} props.isOpen - Whether the chatbot is currently open.
 * @param {Function} props.setIsOpen - Callback to toggle the chatbot visibility state.
 * @param {Object} props.img - Object containing image assets.
 * @returns {JSX.Element}
 */
export default function FabToggle({ isOpen, setIsOpen, img }) {
  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative w-12 h-12 rounded-full overflow-hidden transition-all"
        style={{
          boxShadow: isOpen
            ? '0 8px 28px rgba(12,11,24,0.55)'
            : '0 8px 32px rgba(124,58,237,0.55), 0 0 0 2px rgba(124,58,237,0.45)',
        }}
        aria-label={isOpen ? 'Close chatbot' : 'Open chatbot'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
            key="close"
            initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="w-full h-full flex items-center justify-center"
            style={{
                background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #6d28d9 100%)',
                border: '2px solid rgba(196,181,253,0.22)',
            }}
            >
              <svg className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.65)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
          ) : (
            <motion.img
              key="avatar"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.18 }}
              src={img.chatbotIcon}
              alt="Open chatbot"
              className="w-full h-full object-cover"
            />
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

FabToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
  img: PropTypes.shape({
    chatbotIcon: PropTypes.string.isRequired,
  }).isRequired,
};