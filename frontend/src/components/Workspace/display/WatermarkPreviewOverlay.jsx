import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { parseWatermarkTextLines, getTextSegmentStyle } from '@/utils/image/watermarkUtils';

/**
 * @param {Object} props
 * @param {string} [props.className]
 * @returns {JSX.Element}
 */
function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="black"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4.8c0-.99.81-1.8 1.8-1.8h4.4c.99 0 1.8.81 1.8 1.8V6" />
      <path d="M6.5 6l1 13.2c.08 1.03.94 1.8 1.97 1.8h5.06c1.03 0 1.89-.77 1.97-1.8L17.5 6" />
      <path d="M10 10.5v6.5" />
      <path d="M14 10.5v6.5" />
    </svg>
  );
}

TrashIcon.propTypes = {
  className: PropTypes.string,
};

/**
 * @param {Object} props
 * @param {React.MutableRefObject} props.overlayRef
 * @param {{x: number, y: number}} props.overlayPos
 * @param {string} props.activeTab
 * @param {Object} props.textWm
 * @param {Object} props.imgWm
 * @param {Object} props.dragBounds
 * @param {Object} props.imageRect
 * @param {boolean} props.isSelected
 * @param {Function} props.onSelect
 * @param {Function} props.onDelete
 * @returns {JSX.Element}
 */
export default function WatermarkPreviewOverlay({
  overlayRef,
  overlayPos,
  activeTab,
  textWm,
  imgWm,
  dragBounds,
  imageRect,
  isSelected,
  onSelect,
  onDelete,
}) {
  const showActions = isSelected;
  const hasText = activeTab === 'text';

  const maxSafeWidth = imageRect
    ? Math.max(50, imageRect.left + imageRect.width - overlayPos.x - 8)
    : '100%';

  const renderTextWatermark = () => {
    const lines = parseWatermarkTextLines(
      textWm.text || 'Watermark Text',
      textWm.charStyles,
      {
        b: textWm.isBold,
        i: textWm.isItalic,
        u: textWm.isUnderline,
      },
    );

    return (
      <div
        style={{
          opacity: textWm.opacity,
          maxWidth: `${maxSafeWidth}px`,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          textShadow: `calc(${textWm.fontSize}px * 0.04) calc(${textWm.fontSize}px * 0.04) calc(${textWm.fontSize}px * 0.08) rgba(0,0,0,0.45)`,
          lineHeight: 1.2,
          fontSize: `${textWm.fontSize}px`,
          fontFamily: `"${textWm.fontFamily}", sans-serif`,
          color: textWm.color,
        }}
      >
        {lines.map((line, lIdx) => (
          <div key={lIdx} style={{ minHeight: `${textWm.fontSize}px` }}>
            {line.segments.map((seg, sIdx) => (
              <span key={sIdx} style={getTextSegmentStyle(seg)}>
                {seg.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      ref={overlayRef}
      drag
      dragMomentum={false}
      dragConstraints={dragBounds}
      initial={overlayPos}
      animate={overlayPos}
      onPointerDown={onSelect}
      className={`absolute cursor-move z-50 ${isSelected ? 'ring-2 ring-indigo-500 bg-white/20' : 'hover:ring-1 hover:ring-slate-400 hover:bg-white/10'}`}
      style={{ padding: 0, left: 0, top: 0 }}
    >
      {showActions && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          aria-label="Delete watermark"
          title="Delete watermark"
          className="absolute -right-4 -top-4 z-70 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-black shadow-md transition hover:bg-slate-100"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}

      {hasText ? (
        renderTextWatermark()
      ) : (
        <img
          src={imgWm.url}
          alt="Logo overlay"
          style={{
            width: `${Math.max(1, (imgWm.naturalWidth || 1) * imgWm.scale)}px`,
            height: `${Math.max(1, (imgWm.naturalHeight || 1) * imgWm.scale)}px`,
            opacity: imgWm.opacity,
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'block',
          }}
        />
      )}
    </motion.div>
  );
}

WatermarkPreviewOverlay.propTypes = {
  overlayRef: PropTypes.object.isRequired,
  overlayPos: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  textWm: PropTypes.object.isRequired,
  imgWm: PropTypes.object.isRequired,
  dragBounds: PropTypes.object.isRequired,
  imageRect: PropTypes.object,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
