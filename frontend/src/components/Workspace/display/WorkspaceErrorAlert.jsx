import { AnimatePresence, motion } from 'framer-motion';

/**
 * Displays a consistent animated error alert block for workspace screens.
 * @param {{ error: string | null | undefined, className?: string }} props
 * @returns {JSX.Element | null}
 */
export default function WorkspaceErrorAlert({ error, className = 'mb-2' }) {
  return (
    <AnimatePresence>
      {error ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`${className} overflow-hidden`}
        >
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm backdrop-blur-sm">
            {error}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}