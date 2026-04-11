import { AnimatePresence, motion } from 'framer-motion';
import { bytesToMB } from '../../../utils/fileUtils';

/**
 * Displays processed result metrics and a download action.
 * @param {{
 *   resultUrl: string | null | undefined,
 *   resultBlob: Blob | null | undefined,
 *   originalFile: File | null | undefined,
 *   downloadName: string,
 *   downloadLabel?: string,
 *   className?: string
 * }} props
 * @returns {JSX.Element | null}
 */
export default function WorkspaceResultDownload({
  resultUrl,
  resultBlob,
  originalFile,
  downloadName,
  downloadLabel = 'Download Result',
  className = 'mt-3 flex shrink-0 flex-col gap-3',
}) {
  if (!resultUrl || !resultBlob || !originalFile) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={className}>
        <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/40 px-4 py-3 text-sm">
          <span className="font-semibold text-slate-600 line-through decoration-rose-400">{bytesToMB(originalFile.size)} MB</span>
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span className="font-bold text-emerald-600">{bytesToMB(resultBlob.size)} MB</span>
        </div>

        <a
          href={resultUrl}
          download={downloadName}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
        >
          {downloadLabel}
        </a>
      </motion.div>
    </AnimatePresence>
  );
}