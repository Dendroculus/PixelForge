import { AnimatePresence, motion } from 'framer-motion';
import BackButton from './BackButton';
import TypingDots from './TypingDots';

/**
 * Renders answer conversation view.
 */
export default function AnswerView({ img, activeQuestion, isTyping, showAnswer, handleBack }) {
  return (
    <div className="space-y-3 pt-1">
      <BackButton onClick={handleBack} />

      <div className="flex justify-end">
        <div
          className="max-w-[84%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white font-medium leading-relaxed"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #a21caf)', boxShadow: '0 6px 16px rgba(109,40,217,0.2)' }}
        >
          {activeQuestion.q}
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <img src={img.chatbotIcon} alt="Assistant" className="w-7 h-7 rounded-full object-cover mt-0.5" />
        <AnimatePresence mode="wait">
          {isTyping ? (
            <motion.div
              key="typing"
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -4 }}
              transition={{ duration: 0.18 }}
              className="rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
            >
              <TypingDots />
            </motion.div>
          ) : showAnswer ? (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-slate-700"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
            >
              {activeQuestion.a}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}