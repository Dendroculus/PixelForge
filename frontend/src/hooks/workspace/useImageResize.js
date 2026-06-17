import { useState, useEffect, useCallback, useMemo } from 'react';
import { loadImage, toSafeDimension, processImageResize } from '../../utils/image/imageUtils';

export const MAX_DIMENSION = 5000;

/**
 * @param {Object} params
 * @param {File|null} params.file
 * @param {string|null} params.previewUrl
 * @param {string|null} params.resultUrl
 * @param {Function} params.setResultBlob
 * @param {Function} params.setResultUrl
 * @param {Function} params.setError
 * @param {Function} params.cleanupResult
 * @param {Function} params.resetAll
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

        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
          if (w >= h) {
            w = MAX_DIMENSION;
            h = Math.max(1, Math.round(MAX_DIMENSION / ratio));
          } else {
            h = MAX_DIMENSION;
            w = Math.max(1, Math.round(MAX_DIMENSION * ratio));
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

    return () => { active = false; };
  }, [previewUrl, setError]);

  const aspectRatio = useMemo(() => {
    if (origWidth <= 0 || origHeight <= 0) return 1;
    return origWidth / origHeight;
  }, [origWidth, origHeight]);

  const previewRatio = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
    return w / h;
  }, [targetWidth, targetHeight]);

  const canProcess = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    return Boolean(file) && !isProcessing && !resultUrl && w > 0 && h > 0;
  }, [file, isProcessing, resultUrl, targetWidth, targetHeight]);

  const handleWidthChange = useCallback((e) => {
    let val = toSafeDimension(e.target.value, MAX_DIMENSION);
    
    if (val === '') {
      setTargetWidth('');
      if (lockAspect) setTargetHeight('');
      cleanupResult();
      return;
    }

    if (lockAspect && val > 0) {
      let newHeight = Math.round(val / aspectRatio);
      if (newHeight > MAX_DIMENSION) {
        newHeight = MAX_DIMENSION;
        val = Math.round(newHeight * aspectRatio);
      }
      setTargetHeight(Math.max(1, newHeight));
    }

    setTargetWidth(val);
    cleanupResult();
  }, [lockAspect, aspectRatio, cleanupResult]);

  const handleHeightChange = useCallback((e) => {
    let val = toSafeDimension(e.target.value, MAX_DIMENSION);
    
    if (val === '') {
      setTargetHeight('');
      if (lockAspect) setTargetWidth('');
      cleanupResult();
      return;
    }

    if (lockAspect && val > 0) {
      let newWidth = Math.round(val * aspectRatio);
      if (newWidth > MAX_DIMENSION) {
        newWidth = MAX_DIMENSION;
        val = Math.round(newWidth / aspectRatio);
      }
      setTargetWidth(Math.max(1, newWidth));
    }

    setTargetHeight(val);
    cleanupResult();
  }, [lockAspect, aspectRatio, cleanupResult]);

  const toggleLock = useCallback(() => {
    setLockAspect((prev) => {
      const next = !prev;
      if (next) {
        const w = Number(targetWidth);
        if (Number.isFinite(w) && w > 0) {
          let newHeight = Math.round(w / aspectRatio);
          let safeWidth = w;

          if (newHeight > MAX_DIMENSION) {
            newHeight = MAX_DIMENSION;
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

  const applyPreset = useCallback((w, h) => {
    setTargetWidth(toSafeDimension(w, MAX_DIMENSION));
    setTargetHeight(toSafeDimension(h, MAX_DIMENSION));
    setLockAspect(false);
    cleanupResult();
  }, [cleanupResult]);

  const applyResize = useCallback(async () => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);

    if (!file || !previewUrl || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await processImageResize(previewUrl, w, h, file.type, MAX_DIMENSION);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError('Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, previewUrl, targetWidth, targetHeight, cleanupResult, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();
    let w = origWidth;
    let h = origHeight;
    const ratio = h > 0 ? w / h : 1;

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      if (w >= h) {
        w = MAX_DIMENSION;
        h = Math.max(1, Math.round(MAX_DIMENSION / ratio));
      } else {
        h = MAX_DIMENSION;
        w = Math.max(1, Math.round(MAX_DIMENSION * ratio));
      }
    }

    setTargetWidth(w || '');
    setTargetHeight(h || '');
    setLockAspect(true);
    setIsProcessing(false);
  }, [resetAll, origWidth, origHeight]);

  return {
    origWidth, origHeight,
    targetWidth, targetHeight,
    lockAspect, isProcessing, canProcess, previewRatio,
    handleWidthChange, handleHeightChange, toggleLock, applyPreset,
    applyResize, handleReset
  };
}