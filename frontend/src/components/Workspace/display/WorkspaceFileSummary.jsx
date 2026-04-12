import { motion, AnimatePresence } from 'framer-motion';
import { bytesToMB } from '../../../utils/file/fileUtils';

/**
 * Displays a styled summary card for a successfully staged file.
 * @param {{ file: File, label?: string }} props
 * @returns {JSX.Element | null}
 */
export default function WorkspaceFileSummary({ file }) {
  if (!file) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="flex flex-col mt-2"
      >
        <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm backdrop-blur-sm mt-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 border border-indigo-100/50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-bold text-slate-700">
              {file.name}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              { bytesToMB(file.size)} MB
            </span>
          </div>

          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-500 shadow-sm">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}