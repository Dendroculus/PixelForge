import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import BackButton from './BackButton';

/**
 * Renders search results view.
 * @param {Object} props - The component props.
 * @param {string} props.query - The current active search query string.
 * @param {Function} props.setQuery - Callback to update the search query state.
 * @param {Array<Object>} props.filteredResults - Array of questions matching the current search query.
 * @param {Function} props.handleBack - Callback to return to the previous view.
 * @param {Function} props.startAnswerFlow - Callback to initiate the answer animation sequence.
 * @returns {JSX.Element}
 */
export default function SearchView({ query, setQuery, filteredResults, handleBack, startAnswerFlow }) {
  let content;

  if (!query) {
    content = (
      <div className="rounded-xl p-3.5 text-sm text-slate-500" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}>
        Start typing to search FAQs…
      </div>
    );
  } else if (filteredResults.length === 0) {
    content = (
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}>
        <p className="text-sm text-slate-600">No matches. Try:</p>
        <div className="flex gap-2 mt-2.5 flex-wrap">
          {['upscale', 'background', 'privacy'].map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="text-xs px-2.5 py-1 rounded-full transition-all text-purple-800"
              style={{ background: 'rgba(124,58,237,0.13)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  } else {
    content = filteredResults.map((item, idx) => (
      <motion.button
        key={`${item.q}-${idx}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04 }}
        onClick={() => startAnswerFlow(item)}
        className="w-full p-3.5 rounded-xl text-left transition-all"
        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
      >
        <p className="text-[11px] mb-1 text-slate-500">{item.icon} {item.category}</p>
        <p className="text-sm font-medium text-slate-800">{item.q}</p>
      </motion.button>
    ));
  }

  return (
    <div className="space-y-2.5">
      <BackButton onClick={handleBack} />
      {content}
    </div>
  );
}

SearchView.propTypes = {
  query: PropTypes.string.isRequired,
  setQuery: PropTypes.func.isRequired,
  filteredResults: PropTypes.arrayOf(
    PropTypes.shape({
      q: PropTypes.string.isRequired,
      category: PropTypes.string,
      icon: PropTypes.string,
    })
  ).isRequired,
  handleBack: PropTypes.func.isRequired,
  startAnswerFlow: PropTypes.func.isRequired,
};