import { AnimatePresence, motion } from 'framer-motion';
import { bytesToMB } from '../../../utils/fileUtils';

/**
 * Displays selected file name and file size summary with animation.
 * @param {{ file: File | null | undefined, className?: string }} props
 * @returns {JSX.Element | null}
 */
export default function WorkspaceFileSummary({ file, className = 'mt-3' }) {
  return (
    <AnimatePresence>
      {file ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={`${className} flex items-center justify-between overflow-hidden rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm shadow-sm`}
        >
          <span className="mr-4 truncate font-medium text-slate-700">{file.name}</span>
          <span className="whitespace-nowrap text-xs font-bold text-slate-400">{bytesToMB(file.size)} MB</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}