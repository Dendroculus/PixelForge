import { useCallback, useRef, useState } from 'react';

/**
 * Clamps a numeric value to a min/max range.
 * @param {number} v - Value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Clamped value.
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Converts RGB channels to a hex color string.
 * @param {number} r - Red channel.
 * @param {number} g - Green channel.
 * @param {number} b - Blue channel.
 * @returns {string} Hex color.
 */
function rgbToHex(r, g, b) {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
      })
      .join('')
  );
}

/**
 * Handles palette sampling from image points using canvas.
 * @param {{
 * previewUrl: string | null | undefined,
 * setError: (value: string) => void
 * }} params
 * @returns {{
 * isProcessing: boolean,
 * setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>,
 * palette: string[],
 * setPalette: React.Dispatch<React.SetStateAction<string[]>>,
 * samplePaletteFromPoints: (inputPoints: Array<{x:number,y:number}>) => Promise<void>
 * }}
 */
export default function usePaletteSampling({ previewUrl, setError }) {
  const canvasRef = useRef(null);
  const cachedUrlRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [palette, setPalette] = useState([]);

  const buildSamplingCanvas = useCallback(async () => {
    if (!previewUrl) return null;

    if (canvasRef.current && cachedUrlRef.current === previewUrl) {
      return {
        canvas: canvasRef.current,
        ctx: canvasRef.current.getContext('2d', { willReadFrequently: true }),
      };
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = previewUrl;
    });

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    cachedUrlRef.current = previewUrl;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context unavailable');

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return { canvas, ctx };
  }, [previewUrl]);

  const samplePaletteFromPoints = useCallback(async (inputPoints, options = {}) => {
    if (!previewUrl || !inputPoints?.length) return;

    const {
      replaceIndexById = null,
      allPoints = null,
      silent = false,
    } = options;

    if (!silent) {
      setIsProcessing(true);
      setError('');
    }

    try {
      const built = await buildSamplingCanvas();
      if (!built) return;
      const { canvas, ctx } = built;

      const sampled = inputPoints.map((p) => {
        const px = Math.round(clamp(p.x, 0, 1) * (canvas.width - 1));
        const py = Math.round(clamp(p.y, 0, 1) * (canvas.height - 1));
        const d = ctx.getImageData(px, py, 1, 1).data;
        return rgbToHex(d[0], d[1], d[2]);
      });

      if (replaceIndexById != null && Array.isArray(allPoints)) {
        const idx = allPoints.findIndex((p) => p.id === replaceIndexById);
        if (idx >= 0) {
          setPalette((prev) => {
            const base = prev.length ? [...prev] : allPoints.map(() => '#ffffff');
            base[idx] = sampled[0];
            return base;
          });
          return;
        }
      }

      setPalette(sampled);
    } catch {
      if (!silent) setError('Failed to process image.');
    } finally {
      if (!silent) setIsProcessing(false);
    }
  }, [previewUrl, buildSamplingCanvas, setError]);

  return {
    isProcessing,
    setIsProcessing,
    palette,
    setPalette,
    samplePaletteFromPoints,
  };
}