import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useWorkspaceFile } from '../Core/useWorkspaceFile';
import {
  calculateImageRect,
  loadImage,
} from '../../../utils/image/watermarkMath';
import { renderWatermarkToBlob } from '../../../utils/image/watermarkRender';
import { WatermarkDefaultImage, WatermarkDefaulText } from '../../../config';

/**
 * @returns {Object}
 */
export function useWatermark() {
  const fileInputRef = useRef(null);
  const watermarkImageRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);
  const overlayRef = useRef(null);

  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageRect, setImageRect] = useState({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
    scale: 1,
  });
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlaySize, setOverlaySize] = useState({ width: 1, height: 1 });
  const [isOverlaySelected, setIsOverlaySelected] = useState(false);

  const hasInitializedPos = useRef(false);

  const [textWm, setTextWm] = useState(WatermarkDefaulText);
  const [imgWm, setImgWm] = useState(WatermarkDefaultImage);

  const workspaceFile = useWorkspaceFile(fileInputRef);
  const {
    file,
    previewUrl,
    setResultBlob,
    resultUrl,
    setResultUrl,
    setError,
    cleanupResult,
    resetAll,
  } = workspaceFile;

  useEffect(() => {
    hasInitializedPos.current = false;
    setIsOverlaySelected(false);
  }, [previewUrl]);

  const updateImageRect = useCallback(() => {
    const rect = calculateImageRect(
      imageRef.current,
      previewContainerRef.current,
    );
    setImageRect(rect);

    if (!hasInitializedPos.current && rect.width > 1) {
      setOverlayPos({
        x: rect.left + rect.width / 2 - 80,
        y: rect.top + rect.height / 2 - 20,
      });
      hasInitializedPos.current = true;
    }
  }, []);

  useEffect(() => {
    const box = previewContainerRef.current;
    if (!box) return undefined;
    updateImageRect();
    const observer = new ResizeObserver(() => updateImageRect());
    observer.observe(box);
    return () => observer.disconnect();
  }, [updateImageRect, previewUrl]);

  useEffect(() => {
    const node = overlayRef.current;
    if (!node) return;
    const update = () => {
      const r = node.getBoundingClientRect();
      setOverlaySize({
        width: Math.max(1, r.width),
        height: Math.max(1, r.height),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [
    activeTab,
    textWm,
    imgWm.url,
    imgWm.scale,
    imgWm.naturalWidth,
    imgWm.naturalHeight,
    previewUrl,
  ]);

  const dragBounds = useMemo(() => {
    const maxX = Math.max(
      imageRect.left,
      imageRect.left + imageRect.width - overlaySize.width,
    );
    const maxY = Math.max(
      imageRect.top,
      imageRect.top + imageRect.height - overlaySize.height,
    );
    return {
      left: imageRect.left,
      top: imageRect.top,
      right: maxX,
      bottom: maxY,
    };
  }, [imageRect, overlaySize]);

  /**
   * @param {Event} e
   * @returns {Promise<void>}
   */
  const handleWatermarkImageUpload = useCallback(
    async (e) => {
      const wmFile = e.target.files?.[0];
      if (!wmFile) return;

      if (imgWm.url) URL.revokeObjectURL(imgWm.url);
      const nextUrl = URL.createObjectURL(wmFile);

      try {
        const loaded = await loadImage(nextUrl);
        setError('');
        setImgWm((prev) => ({
          ...prev,
          url: nextUrl,
          naturalWidth: loaded.naturalWidth || 1,
          naturalHeight: loaded.naturalHeight || 1,
        }));
        setActiveTab('image');
        setIsOverlaySelected(false);
        cleanupResult();
      } catch {
        URL.revokeObjectURL(nextUrl);
        setError('Failed to load watermark image.');
      }
    },
    [imgWm.url, cleanupResult, setError],
  );

  const handleRemoveWatermarkImage = useCallback(() => {
    if (imgWm.url) URL.revokeObjectURL(imgWm.url);
    setImgWm((prev) => ({
      ...prev,
      url: null,
      naturalWidth: 1,
      naturalHeight: 1,
    }));
    setIsOverlaySelected(false);
    cleanupResult();
  }, [imgWm.url, cleanupResult]);

  const handleClearTextWatermark = useCallback(() => {
    setTextWm((prev) => ({ ...prev, text: '', charStyles: [] }));
    setIsOverlaySelected(false);
    cleanupResult();
  }, [cleanupResult]);

  const handleDeleteSelected = useCallback(() => {
    if (activeTab === 'image') handleRemoveWatermarkImage();
    else handleClearTextWatermark();
  }, [activeTab, handleRemoveWatermarkImage, handleClearTextWatermark]);

  const applyWatermark = useCallback(async () => {
    if (!file || !previewUrl) return;
    if (activeTab === 'text' && !textWm.text.trim()) {
      setError('Please enter watermark text.');
      return;
    }

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await renderWatermarkToBlob({
        file,
        previewUrl,
        activeTab,
        textWm,
        imgWm,
        imageRect,
        overlayNode: overlayRef.current,
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch {
      setError('Failed to apply watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [
    file,
    previewUrl,
    cleanupResult,
    imageRect,
    activeTab,
    textWm,
    imgWm,
    setResultBlob,
    setResultUrl,
    setError,
  ]);

  const handleReset = useCallback(() => {
    if (imgWm.url) URL.revokeObjectURL(imgWm.url);
    resetAll();
    setIsProcessing(false);
    setActiveTab('text');
    setTextWm(WatermarkDefaulText);
    setImgWm(WatermarkDefaultImage);
    setOverlayPos({ x: 0, y: 0 });
    setOverlaySize({ width: 1, height: 1 });
    setIsOverlaySelected(false);
    hasInitializedPos.current = false;
  }, [imgWm.url, resetAll]);

  const canProcess = useMemo(
    () => Boolean(file) && !isProcessing && !resultUrl,
    [file, isProcessing, resultUrl],
  );

  return {
    refs: {
      fileInputRef,
      watermarkImageRef,
      imageRef,
      previewContainerRef,
      overlayRef,
    },
    workspaceFile,
    state: {
      activeTab,
      isProcessing,
      overlayPos,
      isOverlaySelected,
      textWm,
      imgWm,
      dragBounds,
      canProcess,
      imageRect,
    },
    actions: {
      setActiveTab,
      setTextWm,
      setImgWm,
      setIsOverlaySelected,
      updateImageRect,
      handleWatermarkImageUpload,
      handleRemoveWatermarkImage,
      handleDeleteSelected,
      applyWatermark,
      handleReset,
    },
  };
}
