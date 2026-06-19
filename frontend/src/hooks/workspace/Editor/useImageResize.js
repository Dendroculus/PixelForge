import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  loadImage,
  toSafeDimension,
  processImageResize,
} from '../../../utils/image/imageUtils';

export const MaxDimension = 5000;

/**
 * Calculates constrained dimensions while preserving aspect ratio and respecting maximum limits.
 * * @param {'width'|'height'} dimension - The dimension currently being modified.
 * @param {number} value - The new value for the modified dimension.
 * @param {number} ratio - The original aspect ratio (width / height).
 * @param {number} maxDim - The maximum allowed dimension size.
 * @returns {{width: number, height: number}} The calculated dimensions.
 */
const calculateLockedDimensions = (dimension, value, ratio, maxDim) => {
  const isWidth = dimension === 'width';
  let primary = value;
  let opposite = isWidth
    ? Math.round(value / ratio)
    : Math.round(value * ratio);

  if (opposite > maxDim) {
    opposite = maxDim;
    primary = isWidth
      ? Math.round(opposite * ratio)
      : Math.round(opposite / ratio);
  }

  return {
    width: isWidth ? primary : Math.max(1, opposite),
    height: isWidth ? Math.max(1, opposite) : primary,
  };
};

/**
 * Hook to manage image resize state, constraints, and processing.
 * * @param {Object} params
 * @param {File|null} params.file
 * @param {string|null} params.previewUrl
 * @param {string|null} params.resultUrl
 * @param {Function} params.setResultBlob
 * @param {Function} params.setResultUrl
 * @param {Function} params.setError
 * @param {Function} params.cleanupResult
 * @param {Function} params.resetAll
 * @returns {Object} Image resize state and handler functions.
 */
export function useImageResize({
  file,
  previewUrl,
  resultUrl,
  setResultBlob,
  setResultUrl,
  setError,
  cleanupResult,
  resetAll,
}) {
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const aspectRatio = useMemo(() => {
    if (origWidth <= 0 || origHeight <= 0) return 1;
    return origWidth / origHeight;
  }, [origWidth, origHeight]);

  const previewRatio = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0)
      return 1;
    return w / h;
  }, [targetWidth, targetHeight]);

  const canProcess = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    return Boolean(file) && !isProcessing && !resultUrl && w > 0 && h > 0;
  }, [file, isProcessing, resultUrl, targetWidth, targetHeight]);

  useEffect(() => {
    let active = true;

    if (!previewUrl) {
      setOrigWidth(0);
      setOrigHeight(0);
      setTargetWidth('');
      setTargetHeight('');
      return undefined;
    }

    loadImage(previewUrl)
      .then((img) => {
        if (!active) return;

        let w = img.naturalWidth || 0;
        let h = img.naturalHeight || 0;
        const ratio = h > 0 ? w / h : 1;

        if (w > MaxDimension || h > MaxDimension) {
          if (w >= h) {
            w = MaxDimension;
            h = Math.max(1, Math.round(MaxDimension / ratio));
          } else {
            h = MaxDimension;
            w = Math.max(1, Math.round(MaxDimension * ratio));
          }
        }

        setOrigWidth(img.naturalWidth || 0);
        setOrigHeight(img.naturalHeight || 0);
        setTargetWidth(w || '');
        setTargetHeight(h || '');
      })
      .catch(() => {
        if (!active) return;
        setError('Could not read image dimensions.');
      });

    return () => {
      active = false;
    };
  }, [previewUrl, setError]);

  const handleDimensionChange = useCallback(
    (dimension, value) => {
      const val = toSafeDimension(value, MaxDimension);
      const isWidth = dimension === 'width';

      if (val === '') {
        if (isWidth || lockAspect) setTargetWidth('');
        if (!isWidth || lockAspect) setTargetHeight('');
        cleanupResult();
        return;
      }

      if (!lockAspect || val <= 0) {
        isWidth ? setTargetWidth(val) : setTargetHeight(val);
        cleanupResult();
        return;
      }

      const { width, height } = calculateLockedDimensions(
        dimension,
        val,
        aspectRatio,
        MaxDimension,
      );

      setTargetWidth(width);
      setTargetHeight(height);
      cleanupResult();
    },
    [lockAspect, aspectRatio, cleanupResult],
  );

  const handleWidthChange = useCallback(
    (e) => handleDimensionChange('width', e.target.value),
    [handleDimensionChange],
  );

  const handleHeightChange = useCallback(
    (e) => handleDimensionChange('height', e.target.value),
    [handleDimensionChange],
  );

  const toggleLock = useCallback(() => {
    setLockAspect((prev) => {
      const next = !prev;
      if (next) {
        const w = Number(targetWidth);
        if (Number.isFinite(w) && w > 0) {
          let newHeight = Math.round(w / aspectRatio);
          let safeWidth = w;

          if (newHeight > MaxDimension) {
            newHeight = MaxDimension;
            safeWidth = Math.round(newHeight * aspectRatio);
          }

          setTargetWidth(Math.max(1, safeWidth));
          setTargetHeight(Math.max(1, newHeight));
          cleanupResult();
        }
      }
      return next;
    });
  }, [targetWidth, aspectRatio, cleanupResult]);

  const applyPreset = useCallback(
    (w, h) => {
      setTargetWidth(toSafeDimension(w, MaxDimension));
      setTargetHeight(toSafeDimension(h, MaxDimension));
      setLockAspect(false);
      cleanupResult();
    },
    [cleanupResult],
  );

  const applyResize = useCallback(async () => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);

    if (
      !file ||
      !previewUrl ||
      !Number.isFinite(w) ||
      !Number.isFinite(h) ||
      w <= 0 ||
      h <= 0
    )
      return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await processImageResize(
        previewUrl,
        w,
        h,
        file.type,
        MaxDimension,
      );
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError('Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    file,
    previewUrl,
    targetWidth,
    targetHeight,
    cleanupResult,
    setResultBlob,
    setResultUrl,
    setError,
  ]);

  const handleReset = useCallback(() => {
    resetAll();
    let w = origWidth;
    let h = origHeight;
    const ratio = h > 0 ? w / h : 1;

    if (w > MaxDimension || h > MaxDimension) {
      if (w >= h) {
        w = MaxDimension;
        h = Math.max(1, Math.round(MaxDimension / ratio));
      } else {
        h = MaxDimension;
        w = Math.max(1, Math.round(MaxDimension * ratio));
      }
    }

    setTargetWidth(w || '');
    setTargetHeight(h || '');
    setLockAspect(true);
    setIsProcessing(false);
  }, [resetAll, origWidth, origHeight]);

  return {
    origWidth,
    origHeight,
    targetWidth,
    targetHeight,
    lockAspect,
    isProcessing,
    canProcess,
    previewRatio,
    handleWidthChange,
    handleHeightChange,
    toggleLock,
    applyPreset,
    applyResize,
    handleReset,
  };
}
