import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { bytesToMB } from '../../../../utils/file/fileUtils';

/**
 * Displays the final result size comparison and the download action button.
 * @param {Object} props - The component props.
 * @param {string} props.resultUrl - The object URL linking to the blob.
 * @param {Blob} props.resultBlob - The exported Blob object payload.
 * @param {File} props.originalFile - The source File object payload.
 * @param {string} props.downloadName - Formatted string for the file download name.
 * @param {string} [props.downloadLabel='Download Image'] - Text for the action button.
 * @returns {JSX.Element | null}
 */
export default function WorkspaceResultDownload({
  resultUrl,
  resultBlob,
  originalFile,
  downloadName,
  downloadLabel = "Download Image"
}) {
  if (!resultUrl) return null;

  const originalSize = originalFile?.size || 0;
  const newSize = resultBlob?.size || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mt-3 shrink-0 flex flex-col gap-3"
    >
      {originalFile && resultBlob && (
        <div className="overflow-hidden rounded-xl border border-white/60 bg-white/60 p-1.5 shadow-sm backdrop-blur-sm">
          <div className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-white px-4 py-2.5">
            
          <div className="flex flex-col">
            <span className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Original
            </span>
            <span className="text-sm font-bold text-slate-500">
              {bytesToMB(originalSize)} MB
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-4">
            <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" stroke='#999999'/>
            </svg>
          </div>

          <div className="flex flex-col text-right">
            <span className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-500">
              New Size
            </span>
            <span className="text-sm font-bold text-emerald-500">
              {bytesToMB(newSize)} MB
            </span>
          </div>

          </div>
        </div>
      )}

      <a
        href={resultUrl}
        download={downloadName}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {downloadLabel}
      </a>
    </motion.div>
  );
}

WorkspaceResultDownload.propTypes = {
  resultUrl: PropTypes.string,
  resultBlob: PropTypes.shape({ size: PropTypes.number }),
  originalFile: PropTypes.shape({ size: PropTypes.number }),
  downloadName: PropTypes.string.isRequired,
  downloadLabel: PropTypes.string,
};