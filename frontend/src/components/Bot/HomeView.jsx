import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Renders chatbot home view.
 * @param {Object} props - The component props.
 * @param {Array<Object>} props.FAQ_DATA - Array containing FAQ categories and questions.
 * @param {Array<Object>} props.QUICK_ACTIONS - Array of quick action objects containing id, text, and type.
 * @param {Object} props.CAT_ACCENT - Mapping of category IDs to their specific styling configuration.
 * @param {Function} props.openFromQuickAction - Callback executed when a quick action is clicked.
 * @param {Function} props.openCategory - Callback executed when an FAQ category is clicked.
 * @returns {JSX.Element}
 */
export default function HomeView({ FAQ_DATA, QUICK_ACTIONS, CAT_ACCENT, openFromQuickAction, openCategory }) {
  return (
    <div className="space-y-2.5">
      <div
        className="rounded-2xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.4))',
          border: '1px solid rgba(255,255,255,0.8)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        }}
      >
        <p className="text-sm font-semibold text-slate-800">Hey there 👋</p>
        <p className="text-xs mt-1 leading-relaxed text-slate-600">
          Need help with PixelForge? Ask anything, pick a topic, or use a quick action below.
        </p>
      </div>

      <div
        className="rounded-2xl p-3.5"
        style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
      >
        <p className="text-[10px] font-bold tracking-[0.12em] uppercase mb-2.5 text-slate-500">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => openFromQuickAction(action)}
              className="
                text-[11px]
                font-medium
                text-left
                px-3
                py-1.5
                rounded-full
                transition-all
                duration-200
                hover:scale-105
                hover:shadow-sm
                hover:opacity-80
                active:scale-95
              "
              style={{
                color: '#5b21b6',
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.28)',
              }}
            >
              {action.text}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {FAQ_DATA.map((cat, i) => {
          const accent = CAT_ACCENT[cat.id] ?? CAT_ACCENT['getting-started'];
          return (
            <motion.button
              key={cat.id}
              onClick={() => openCategory(cat)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.055, ease: [0.22, 1, 0.36, 1] }}
              className="w-full p-3 rounded-2xl text-left transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.6)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 text-white"
                  style={{ background: accent.bg, boxShadow: `0 4px 14px ${accent.glow}` }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{cat.title}</p>
                  <p className="text-[11px] truncate mt-0.5 text-slate-500">{cat.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

HomeView.propTypes = {
  FAQ_DATA: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      icon: PropTypes.string.isRequired,
    })
  ).isRequired,
  QUICK_ACTIONS: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      target: PropTypes.string,
    })
  ).isRequired,
  CAT_ACCENT: PropTypes.objectOf(
    PropTypes.shape({
      bg: PropTypes.string.isRequired,
      glow: PropTypes.string.isRequired,
    })
  ).isRequired,
  openFromQuickAction: PropTypes.func.isRequired,
  openCategory: PropTypes.func.isRequired,
};