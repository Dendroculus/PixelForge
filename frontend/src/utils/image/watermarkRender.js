import { loadImage } from './watermarkMath';
import { parseWatermarkTextLines } from './watermarkUtils';

/**
 * @typedef {Object} WatermarkRenderParams
 * @property {File} file 
 * @property {string} previewUrl 
 * @property {string} activeTab 
 * @property {Object} textWm 
 * @property {Object} imgWm 
 * @property {Object} imageRect 
 * @property {HTMLElement|null} overlayNode 
 */

/**
 * @param {WatermarkRenderParams} params
 * @returns {Promise<Blob>}
 */
export async function renderWatermarkToBlob({
  file,
  previewUrl,
  activeTab,
  textWm,
  imgWm,
  imageRect,
  overlayNode
}) {
  const baseImg = await loadImage(previewUrl);
  const canvas = document.createElement('canvas');
  canvas.width = baseImg.naturalWidth || 1;
  canvas.height = baseImg.naturalHeight || 1;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(baseImg, 0, 0);

  if (!overlayNode) throw new Error('Overlay node is missing');

  const transform = new DOMMatrix(window.getComputedStyle(overlayNode).transform);
  const pctX = (transform.m41 - imageRect.left) / Math.max(1, imageRect.width);
  const pctY = (transform.m42 - imageRect.top) / Math.max(1, imageRect.height);

  const targetX = pctX * canvas.width;
  const targetY = pctY * canvas.height;

  ctx.globalAlpha = activeTab === 'text' ? textWm.opacity : imgWm.opacity;

  if (activeTab === 'text') {
    const nativeFontSize = Math.max(1, textWm.fontSize / Math.max(imageRect.scale, 0.0001));

    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = nativeFontSize * 0.08;
    ctx.shadowOffsetX = nativeFontSize * 0.04;
    ctx.shadowOffsetY = nativeFontSize * 0.04;

    const lines = parseWatermarkTextLines(textWm.text, textWm.charStyles, { 
      b: textWm.isBold, 
      i: textWm.isItalic, 
      u: textWm.isUnderline 
    });
    
    const lineHeight = nativeFontSize * 1.2;
    const padding = nativeFontSize * 0.5;
    const maxCanvasWidth = canvas.width - targetX - padding;
    
    let currentY = targetY;

    lines.forEach((line) => {
      let currentX = targetX;

      if (!line.text) {
        currentY += lineHeight;
        return;
      }

      line.segments.forEach((seg) => {
        const fontStyle = seg.i ? 'italic ' : '';
        const fontWeight = seg.b ? 'bold ' : 'normal ';
        
        ctx.font = `${fontStyle}${fontWeight}${nativeFontSize}px "${textWm.fontFamily}", sans-serif`;
        ctx.fillStyle = textWm.color;

        const tokens = seg.text.split(/(\s+)/);

        tokens.forEach((token) => {
          if (!token) return;

          const textW = Math.max(1, ctx.measureText(token).width);

          if (currentX + textW > targetX + maxCanvasWidth && currentX > targetX && token.trim() !== '') {
            currentX = targetX;
            currentY += lineHeight;
          }

          if (seg.u) {
            ctx.save();
            ctx.shadowColor = 'transparent';
            ctx.fillStyle = textWm.color;
            ctx.fillRect(currentX, currentY + nativeFontSize * 1.08, textW, Math.max(2, nativeFontSize * 0.06));
            ctx.restore();
          }

          ctx.fillText(token, currentX, currentY);
          currentX += textW;
        });
      });

      currentY += lineHeight;
    });

  } else if (activeTab === 'image' && imgWm.url) {
    const markImg = await loadImage(imgWm.url);
    const nativeW = Math.max(1, markImg.naturalWidth * imgWm.scale * (canvas.width / Math.max(1, imageRect.width)));
    const nativeH = Math.max(1, markImg.naturalHeight * imgWm.scale * (canvas.height / Math.max(1, imageRect.height)));
    ctx.drawImage(markImg, targetX, targetY, nativeW, nativeH);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Canvas export failed'));
      else resolve(blob);
    }, file.type || 'image/jpeg', 0.95);
  });
}