/**
 * Client-side palette sampling hook.
 *
 * Builds and caches a canvas representation of an image, then samples selected
 * points to produce palette colors.
 */

import { useCallback, useRef, useState } from 'react';

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

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
 * Provide palette sampling helpers for image-based color picking.
 *
 * @returns {object} Hook state and handlers.
 */
export default function usePaletteSampling({ previewUrl, setError }) {
  const canvasRef = useRef(null);
  const cachedUrlRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [palette, setPalette] = useState([]);

  const getCachedCanvas = useCallback(() => {
    if (canvasRef.current && cachedUrlRef.current === previewUrl) {
      return {
        canvas: canvasRef.current,
        ctx: canvasRef.current.getContext('2d', { willReadFrequently: true }),
      };
    }
    return null;
  }, [previewUrl]);

  const buildSamplingCanvas = useCallback(async () => {
    if (!previewUrl) return null;

    const cached = getCachedCanvas();
    if (cached) return cached;

    const img = new Image();

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
  }, [previewUrl, getCachedCanvas]);

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
      let built = getCachedCanvas();
      if (!built) {
        built = await buildSamplingCanvas();
      }
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
  }, [previewUrl, buildSamplingCanvas, getCachedCanvas, setError]);

  return {
    isProcessing,
    setIsProcessing,
    palette,
    setPalette,
    samplePaletteFromPoints,
  };
}