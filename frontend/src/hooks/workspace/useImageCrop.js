import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { buildDefaultCrop, generateCroppedImageBlob } from '../../utils/image/cropUtils';
import { generateSafeFilename } from '../../utils/file/fileUtils';

/**
 * Hook to manage react-image-crop state and canvas processing logic.
 */
export function useImageCrop({
  file,
  error,
  resultUrl,
  cleanupResult,
  setResultBlob,
  setResultUrl,
  setError,
  resetAll
}) {
  const imgRef = useRef(null);

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [fitMode, setFitMode] = useState('fit');

  const onImageLoad = useCallback((e) => {
    const img = e.currentTarget;
    setImageSize({ 
      width: img.naturalWidth || 0, 
      height: img.naturalHeight || 0 
    });
  }, []);

  useEffect(() => {
    if (imgRef.current && imageSize.width > 0 && imageSize.height > 0) {
      const timer = setTimeout(() => {
        if (!imgRef.current) return;
        const displayWidth = imgRef.current.width || 0;
        const displayHeight = imgRef.current.height || 0;
        
        const defaultCrop = buildDefaultCrop(displayWidth, displayHeight, aspect);
        setCrop(defaultCrop);
        setCompletedCrop(defaultCrop);
      }, 50); 
      return () => clearTimeout(timer);
    }
  }, [imageSize, aspect]);

  const applyAspect = useCallback((nextAspect) => {
    setAspect(nextAspect);
    cleanupResult();
  }, [cleanupResult]);

  const applyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !file) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await generateCroppedImageBlob(
        imgRef.current, 
        completedCrop, 
        file.type || 'image/jpeg'
      );
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, file, cleanupResult, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();
    setCrop(undefined);
    setCompletedCrop(null);
    setAspect(null);
    setImageSize({ width: 0, height: 0 });
    setIsProcessing(false);
    setFitMode('fit'); 
  }, [resetAll]);

  const hasValidCrop = useMemo(() => {
    if (!completedCrop) return false;
    return completedCrop.width > 0 && completedCrop.height > 0;
  }, [completedCrop]);

  const canApply = useMemo(() => {
    return Boolean(file) && !isProcessing && !resultUrl && hasValidCrop;
  }, [file, isProcessing, resultUrl, hasValidCrop]);

  const cropSizeLabel = useMemo(() => {
    if (!completedCrop || !imgRef.current) return null;
    const w = Math.max(1, Math.round((completedCrop.width * imgRef.current.naturalWidth) / 100));
    const h = Math.max(1, Math.round((completedCrop.height * imgRef.current.naturalHeight) / 100));
    return `${w} × ${h}px`;
  }, [completedCrop]);

  const downloadName = useMemo(
    () => generateSafeFilename(file?.name, 'cropped', 'jpg'),
    [file?.name]
  );

  const isFocusMode = Boolean(file && !error && !isProcessing && !resultUrl);

  const imageAspect = imageSize.width > 0 && imageSize.height > 0
    ? imageSize.width / imageSize.height
    : 1;

  return {
    imgRef,
    crop,
    setCrop,
    completedCrop,
    setCompletedCrop,
    aspect,
    isProcessing,
    fitMode,
    setFitMode,
    imageSize,
    onImageLoad,
    applyAspect,
    applyCrop,
    handleReset,
    canApply,
    cropSizeLabel,
    downloadName,
    isFocusMode,
    imageAspect
  };
}