import { motion } from 'framer-motion';
import BackButton from './BackButton';

/**
 * Renders category questions view.
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
          key={idx}
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