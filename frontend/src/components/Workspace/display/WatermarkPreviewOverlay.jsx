import { motion } from 'framer-motion';

export default function WatermarkPreviewOverlay({
  overlayRef,
  dragConstraintsRef,
  overlayPos,
  activeTab,
  textWm,
  imgWm,
}) {
  if (overlayPos.x === 0 && overlayPos.y === 0) return null;

  return (
    <motion.div
      ref={overlayRef}
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={dragConstraintsRef}
      initial={{ x: overlayPos.x, y: overlayPos.y }}
      className="absolute z-50 cursor-grab active:cursor-grabbing rounded-md border border-dashed border-transparent hover:border-indigo-400 hover:bg-white/10"
      style={{ opacity: activeTab === 'text' ? textWm.opacity : imgWm.opacity, padding: '4px', left: 0, top: 0 }}
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
          style={{ transform: `scale(${imgWm.scale})`, transformOrigin: 'top left', pointerEvents: 'none', userSelect: 'none', display: 'block' }}
        />
      ) : null}
    </motion.div>
  );
}