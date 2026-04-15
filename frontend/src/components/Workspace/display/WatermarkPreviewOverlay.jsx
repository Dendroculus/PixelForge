import { motion } from 'framer-motion';
import { useState } from 'react';

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

      {hasText ? (
        <span
          style={{
            fontFamily: `"${textWm.fontFamily}", sans-serif`,
            color: textWm.color,
            fontSize: `${textWm.fontSize}px`,
            fontWeight: textWm.isBold ? 'bold' : 'normal',
            fontStyle: textWm.isItalic ? 'italic' : 'normal',
            textDecoration: textWm.isUnderline ? 'underline' : 'none',
            textDecorationSkipInk: 'none',
            opacity: textWm.opacity,
            textShadow: '2px 2px 4px rgba(0,0,0,0.45)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {textWm.text}
        </span>
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