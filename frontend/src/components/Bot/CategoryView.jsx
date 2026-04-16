import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import BackButton from './BackButton';

/**
 * Renders category questions view.
 * @param {Object} props - The component props.
 * @param {Object} props.activeCategory - The currently selected category object.
 * @param {string} props.activeCategory.id - Category ID.
 * @param {string} props.activeCategory.title - Category title.
 * @param {string} props.activeCategory.description - Category description.
 * @param {string} props.activeCategory.icon - Category icon.
 * @param {Array<Object>} props.activeCategory.questions - Array of questions belonging to this category.
 * @param {Object} props.CAT_ACCENT - Mapping of category IDs to their specific styling configuration.
 * @param {Function} props.handleBack - Callback to return to the home view.
 * @param {Function} props.startAnswerFlow - Callback to initiate the answer animation sequence.
 * @returns {JSX.Element}
 */
export default function CategoryView({ activeCategory, CAT_ACCENT, handleBack, startAnswerFlow }) {
  const accent = CAT_ACCENT[activeCategory.id] ?? CAT_ACCENT['getting-started'];

  return (
    <div className="space-y-2.5">
      <BackButton onClick={handleBack} />

      <div
        className="rounded-xl p-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 text-white"
          style={{ background: accent.bg, boxShadow: `0 4px 12px ${accent.glow}` }}
        >
          {activeCategory.icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{activeCategory.title}</p>
          <p className="text-[11px] mt-0.5 text-slate-500">{activeCategory.description}</p>
        </div>
      </div>

      {activeCategory.questions.map((qa, idx) => (
        <motion.button
          key={qa.id || qa.q} 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05, ease: 'easeOut' }} 
          onClick={() => startAnswerFlow(qa)}
          className="w-full p-3.5 rounded-xl text-left text-sm transition-all text-slate-700"
          style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
        >
          {qa.q}
        </motion.button>
      ))}
    </div>
  );
}

CategoryView.propTypes = {
  activeCategory: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    questions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        q: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
  CAT_ACCENT: PropTypes.objectOf(
    PropTypes.shape({
      bg: PropTypes.string.isRequired,
      glow: PropTypes.string.isRequired,
    })
  ).isRequired,
  handleBack: PropTypes.func.isRequired,
  startAnswerFlow: PropTypes.func.isRequired,
};