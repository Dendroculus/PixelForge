import { useState, useCallback, useEffect } from 'react';

/**
 * @param {Object} params
 * @param {File|null} params.file
 * @param {string|null} params.previewUrl
 * @param {Function} params.setResultBlob
 * @param {Function} params.setResultUrl
 * @param {Function} params.setError
 * @param {Function} params.cleanupResult
 */
export function useRotateFlip({
  file,
  previewUrl,
  setResultBlob,
  setResultUrl,
  setError,
  cleanupResult
}) {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(1);
  const [flipV, setFlipV] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetTransform = useCallback(() => {
    setRotation(0);
    setFlipH(1);
    setFlipV(1);
  }, []);

  useEffect(() => {
    resetTransform();
  }, [previewUrl, resetTransform]);

  const handleRotateLeft = useCallback(() => setRotation((r) => r - 90), []);
  const handleRotateRight = useCallback(() => setRotation((r) => r + 90), []);
  const handleFlipHorizontal = useCallback(() => setFlipH((h) => h * -1), []);
  const handleFlipVertical = useCallback(() => setFlipV((v) => v * -1), []);

  const applyTransform = useCallback(async () => {
    if (!file || !previewUrl) return;
    
    if (rotation === 0 && flipH === 1 && flipV === 1) {
      setError("Please rotate or flip the image before applying.");
      return;
    }

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = () => rej(new Error('Failed to load image for processing'));
        img.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      const isRotated90or270 = Math.abs(rotation) % 180 === 90;
      canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH, flipV);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Failed to export image.');
          setIsProcessing(false);
          return;
        }
        setResultBlob(blob);
        setResultUrl(URL.createObjectURL(blob));
        setIsProcessing(false);
      }, file.type || 'image/jpeg', 0.95);
    } catch (e) {
      console.error('Transformation Error:', e);
      setError(e.message || 'An unexpected error occurred during processing.');
      setIsProcessing(false);
    }
  }, [file, previewUrl, rotation, flipH, flipV, cleanupResult, setResultBlob, setResultUrl, setError]);

  return {
    rotation, 
    flipH, 
    flipV, 
    isProcessing, 
    applyTransform,
    setRotation, 
    setFlipH, 
    setFlipV,
    handleRotateLeft,
    handleRotateRight,
    handleFlipHorizontal,
    handleFlipVertical,
    resetTransform
  };
}