import { motion } from 'framer-motion';
import EmptyWorkspaceState from '../../Common/EmptyWorkspaceState';

/**
 * Reusable component for displaying image previews and results within tool workspaces.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export default function PreviewImageBox({
  previewUrl,
  resultUrl,
  resultAlt = 'Result preview',
  isProcessing = false,
  imageRef,
  onImageLoad,
  previewClassName = 'opacity-70 transition-all duration-200',
  processingClassName = 'scale-105 opacity-60 blur-[1px] grayscale-[0.1] transition-all duration-200',
  containerClassName = 'relative flex-1 min-h-0 w-full rounded-xl border border-white/50 bg-white/20 overflow-hidden touch-none flex items-center justify-center',
  containerRef,
  children,
}) {
  return (
    <div ref={containerRef} className={containerClassName}>
      {resultUrl ? (
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          src={resultUrl}
          alt={resultAlt}
          className="absolute inset-0 w-full h-full object-contain p-2"
        />
      ) : previewUrl ? (
        <motion.img
          ref={imageRef}
          onLoad={onImageLoad}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={previewUrl}
          alt="Original preview"
          className={`absolute inset-0 w-full h-full object-contain p-2 ${
            isProcessing ? processingClassName : previewClassName
          }`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <EmptyWorkspaceState />
        </div>
      )}
      {children}
    </div>
  );
}