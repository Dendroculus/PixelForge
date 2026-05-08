import { motion } from 'framer-motion';
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Sub-component to render the delete action icon.
 * @param {{ className?: string }} props 
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
 * Draggable overlay layer for placing text and image watermarks on the canvas.
 * @param {Object} props - The component props.
 * @param {React.React.RefObject<HTMLDivElement>} props.overlayRef - Ref for the draggable div.
 * @param {{x: number, y: number}} props.overlayPos - Coordinates for initial placement.
 * @param {string} props.activeTab - Determines whether to show 'text' or 'image' mark.
 * @param {Object} props.textWm - State object holding text styling logic.
 * @param {Object} props.imgWm - State object holding image overlay logic.
 * @param {Object} props.dragBounds - Constraints object to keep the overlay in the canvas.
 * @param {boolean} props.isSelected - Whether the overlay is currently clicked/focused.
 * @param {Function} props.onSelect - Callback fired when clicked to set active state.
 * @param {Function} props.onDelete - Callback fired when the trash icon is clicked.
 * @returns {JSX.Element|null}
 */
export default function WatermarkPreviewOverlay({
  overlayRef,
  overlayPos,
  activeTab,
  textWm,
  imgWm,
  dragBounds,
  isSelected,
  onSelect,
  onDelete,
}) {
  const [isDragging, setIsDragging] = useState(false);

  if (overlayPos.x === 0 && overlayPos.y === 0) return null;

  const hasText = activeTab === 'text' && Boolean(textWm.text?.trim());
  const hasImage = activeTab === 'image' && Boolean(imgWm.url);
  if (!hasText && !hasImage) return null;

  const showActions = isSelected || isDragging;

  const renderTextWatermark = () => {
    const chars = textWm.text || '';
    const styles = textWm.charStyles || [];

    // Split text and styles into lines to mimic canvas multi-line behavior
    const lines = [];
    let currentLineText = '';
    let currentLineStyles = [];

    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '\n') {
        lines.push({ text: currentLineText, styles: currentLineStyles });
        currentLineText = '';
        currentLineStyles = [];
      } else {
        currentLineText += chars[i];
        currentLineStyles.push(styles[i] || { b: textWm.isBold, i: textWm.isItalic, u: textWm.isUnderline });
      }
    }
    lines.push({ text: currentLineText, styles: currentLineStyles });

    return (
      <div
        style={{
          fontFamily: `"${textWm.fontFamily}", sans-serif`,
          color: textWm.color,
          fontSize: `${textWm.fontSize}px`,
          opacity: textWm.opacity,
          textShadow: '2px 2px 4px rgba(0,0,0,0.45)',
          lineHeight: 1.2,
          whiteSpace: 'pre',
          pointerEvents: 'none',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {lines.map((line, lineIndex) => {
          // Handle completely empty lines (like pressing Enter twice)
          if (!line.text) {
            return <span key={lineIndex} style={{ height: `${textWm.fontSize * 1.2}px`, display: 'block' }} />;
          }

          // Group consecutive characters with identical styles into spans
          const segments = [];
          let currentSegment = { text: line.text[0], ...line.styles[0] };

          for (let i = 1; i < line.text.length; i++) {
            const style = line.styles[i] || { b: false, i: false, u: false };
            if (style.b === currentSegment.b && style.i === currentSegment.i && style.u === currentSegment.u) {
              currentSegment.text += line.text[i];
            } else {
              segments.push(currentSegment);
              currentSegment = { text: line.text[i], ...style };
            }
          }
          segments.push(currentSegment);

          return (
            <div key={lineIndex}>
              {segments.map((seg, segIndex) => (
                <span
                  key={segIndex}
                  style={{
                    fontWeight: seg.b ? 'bold' : 'normal',
                    fontStyle: seg.i ? 'italic' : 'normal',
                    textDecoration: seg.u ? 'underline' : 'none',
                    textDecorationSkipInk: 'none',
                  }}
                >
                  {seg.text}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <motion.div
      ref={overlayRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragBounds}
      initial={{ x: overlayPos.x, y: overlayPos.y }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onDragStart={() => {
        onSelect?.();
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className={`absolute z-50 cursor-grab active:cursor-grabbing rounded-md border border-dashed ${
        isSelected ? 'border-indigo-400 bg-white/10' : 'border-transparent hover:border-indigo-300 hover:bg-white/10'
      }`}
      style={{
        padding: 0,
        left: 0,
        top: 0,
      }}
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
          <TrashIcon className='h-5 w-5'/>
        </button>
      )}

      {hasText ? renderTextWatermark() : (
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
  overlayRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  overlayPos: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }).isRequired,
  activeTab: PropTypes.string.isRequired,
  textWm: PropTypes.shape({
    text: PropTypes.string,
    charStyles: PropTypes.arrayOf(
      PropTypes.shape({
        b: PropTypes.bool,
        i: PropTypes.bool,
        u: PropTypes.bool,
      })
    ),
    fontFamily: PropTypes.string,
    color: PropTypes.string,
    fontSize: PropTypes.number,
    isBold: PropTypes.bool,
    isItalic: PropTypes.bool,
    isUnderline: PropTypes.bool,
    opacity: PropTypes.number,
  }).isRequired,
  imgWm: PropTypes.shape({
    url: PropTypes.string,
    naturalWidth: PropTypes.number,
    naturalHeight: PropTypes.number,
    scale: PropTypes.number,
    opacity: PropTypes.number,
  }).isRequired,
  dragBounds: PropTypes.shape({
    left: PropTypes.number,
    right: PropTypes.number,
    top: PropTypes.number,
    bottom: PropTypes.number,
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  onDelete: PropTypes.func,
};