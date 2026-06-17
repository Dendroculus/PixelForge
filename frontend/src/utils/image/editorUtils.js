export const getCssBrightness = (val) => 100 + (Number(val) * 0.6);
export const getCssContrast   = (val) => 100 + (Number(val) * 0.6);
export const getCssSaturation = (val) => 100 + Number(val);

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error('Missing image URL'));
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Renders all filters onto a canvas and returns the canvas.
 * Shared by both the live preview and the export path.
 *
 * @param {HTMLImageElement} img
 * @param {object} filters
 * @param {string} mimeType - only needed to know whether to flatten alpha
 * @returns {HTMLCanvasElement}
 */
function renderToCanvas(img, filters, mimeType = 'image/jpeg') {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width  = iw;
  canvas.height = ih;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.save();
  ctx.filter =
    `brightness(${getCssBrightness(filters.brightness)}%) ` +
    `contrast(${getCssContrast(filters.contrast)}%) ` +
    `saturate(${getCssSaturation(filters.saturation)}%) ` +
    `blur(${Number(filters.blur)}px)`;
  ctx.drawImage(img, 0, 0, iw, ih);
  ctx.restore();

  const temp = Number(filters.temperature);
  if (temp !== 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = Math.abs(temp) / 400;
    ctx.fillStyle   = temp > 0 ? 'rgb(255, 136, 0)' : 'rgb(0, 136, 255)';
    ctx.fillRect(0, 0, iw, ih);
    ctx.restore();
  }

  const fade = Number(filters.fade);
  if (fade > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighten';
    ctx.globalAlpha = fade / 200;
    ctx.fillStyle   = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, iw, ih);
    ctx.restore();
  }

  const vignette = Number(filters.vignette);
  if (vignette > 0) {
    const cx     = iw / 2;
    const cy     = ih / 2;
    const radius = Math.max(iw, ih) * 0.7;

    const gradient = ctx.createRadialGradient(
      cx, cy, radius * 0.4,
      cx, cy, radius * 1.2,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgb(0,0,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = vignette / 100;
    ctx.fillStyle   = gradient;
    ctx.fillRect(0, 0, iw, ih);
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(img, 0, 0, iw, ih);
  ctx.restore();

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, iw, ih);
    ctx.restore();
  }

  return canvas;
}

/**
 * Renders the image with all filters and returns a data-URL for live preview.
 * Call this whenever filter values change. Debounce on the caller side if needed.
 *
 * @param {string} imageUrl
 * @param {object} filters
 * @returns {Promise<string>} data-URL
 */
export const renderPreviewDataUrl = async (imageUrl, filters) => {
  const img    = await loadImage(imageUrl);
  const canvas = renderToCanvas(img, filters, 'image/png');
  return canvas.toDataURL('image/png');
};

/**
 * Renders the image with all filters and returns a Blob for download.
 *
 * @param {string} imageUrl
 * @param {object} filters
 * @param {object} exportOpts - { mimeType }
 * @returns {Promise<Blob>}
 */
export const processImageEditing = async (imageUrl, filters, exportOpts) => {
  const { mimeType = 'image/jpeg' } = exportOpts;
  const img    = await loadImage(imageUrl);
  const canvas = renderToCanvas(img, filters, mimeType);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))),
      mimeType,
      0.95,
    );
  });
};