import { motion } from 'framer-motion';

export default function WatermarkPreviewOverlay({
  overlayRef,
  overlayPos,
  activeTab,
  textWm,
  imgWm,
  dragBounds,
}) {
  if (overlayPos.x === 0 && overlayPos.y === 0) return null;

  return (
    <motion.div
      ref={overlayRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragBounds}
      initial={{ x: overlayPos.x, y: overlayPos.y }}
      className="absolute z-50 cursor-grab active:cursor-grabbing rounded-md border border-dashed border-transparent hover:border-indigo-400 hover:bg-white/10"
      style={{
        opacity: activeTab === 'text' ? textWm.opacity : imgWm.opacity,
        padding: 0,
        left: 0,
        top: 0,
      }}
    >
      {activeTab === 'text' ? (
        <span
          style={{
            fontFamily: `"${textWm.fontFamily}", sans-serif`,
            color: textWm.color,
            fontSize: `${textWm.fontSize}px`,
            fontWeight: textWm.isBold ? 'bold' : 'normal',
            fontStyle: textWm.isItalic ? 'italic' : 'normal',
            textDecoration: textWm.isUnderline ? 'underline' : 'none',
            textShadow: '2px 2px 4px rgba(0,0,0,0.45)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {textWm.text}
        </span>
      ) : imgWm.url ? (
        <img
          src={imgWm.url}
          alt="Logo overlay"
          style={{
            width: `${Math.max(1, (imgWm.naturalWidth || 1) * imgWm.scale)}px`,
            height: `${Math.max(1, (imgWm.naturalHeight || 1) * imgWm.scale)}px`,
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'block',
          }}
        />
      ) : null}
    </motion.div>
  );
}