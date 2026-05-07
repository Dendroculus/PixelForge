import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import EmptyWorkspaceState from '../../Common/EmptyWorkspaceState';

/**
 * Standardized container for displaying active workspace images and processing states.
 * @param {Object} props - The component props.
 * @param {string} [props.previewUrl] - The object URL of the source image.
 * @param {string} [props.resultUrl] - The object URL of the completed output.
 * @param {string} [props.resultAlt='Result preview'] - Alt text for the result image.
 * @param {boolean} [props.isProcessing=false] - Triggers blur/grayscale loading state.
 * @param {React.React.RefObject<T>} [props.imageRef] - Ref attached to the preview image.
 * @param {Function} [props.onImageLoad] - Callback fired when the preview image loads.
 * @param {string} [props.previewClassName] - Custom classes for the base preview.
 * @param {string} [props.processingClassName] - Custom classes for the active processing state.
 * @param {string} [props.containerClassName] - Custom classes for the outer wrapper.
 * @param {React.React.RefObject<HTMLDivElement>} [props.containerRef] - Ref attached to the outer wrapper.
 * @param {React.ReactNode} [props.children] - Absolute positioned overlays (like watermarks or points).
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
  let mediaContent = null;

  if (resultUrl) {
    mediaContent = (
      <motion.img
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        src={resultUrl}
        alt={resultAlt}
        className="absolute inset-0 w-full h-full object-contain p-2"
      />
    );
  } else if (previewUrl) {
    mediaContent = (
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
    );
  } else {
    mediaContent = (
      <div className="absolute inset-0 flex items-center justify-center">
        <EmptyWorkspaceState />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={containerClassName}>
      {mediaContent}
      {children}
    </div>
  );
}

PreviewImageBox.propTypes = {
  previewUrl: PropTypes.string,
  resultUrl: PropTypes.string,
  resultAlt: PropTypes.string,
  isProcessing: PropTypes.bool,
  imageRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  onImageLoad: PropTypes.func,
  previewClassName: PropTypes.string,
  processingClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  containerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  children: PropTypes.node,
};