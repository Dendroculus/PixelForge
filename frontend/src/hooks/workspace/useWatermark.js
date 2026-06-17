import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useWorkspaceFile } from './useWorkspaceFile';
import { calculateImageRect, loadImage } from '../../utils/image/watermarkMath';
import { parseWatermarkTextLines } from '../../utils/image/watermarkUtils';

export const DEFAULT_TEXT_WM = {
  text: 'Your Text Here',
  charStyles: Array('Your Text Here'.length).fill({ b: true, i: false, u: false }),
  fontFamily: 'Inter',
  color: '#ffffff',
  fontSize: 40,
  opacity: 0.8,
  isBold: true,
  isItalic: false,
  isUnderline: false,
};

export const DEFAULT_IMAGE_WM = {
  url: null,
  opacity: 0.8,
  scale: 0.3,
  naturalWidth: 1,
  naturalHeight: 1,
};

export function useWatermark() {
  const fileInputRef = useRef(null);
  const watermarkImageRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);
  const overlayRef = useRef(null);

  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 1, height: 1, scale: 1 });
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const [overlaySize, setOverlaySize] = useState({ width: 1, height: 1 });
  const [isOverlaySelected, setIsOverlaySelected] = useState(false);
  
  const hasInitializedPos = useRef(false);

  const [textWm, setTextWm] = useState(DEFAULT_TEXT_WM);
  const [imgWm, setImgWm] = useState(DEFAULT_IMAGE_WM);

  const workspaceFile = useWorkspaceFile(fileInputRef);
  const { file, previewUrl, setResultBlob, resultUrl, setResultUrl, setError, cleanupResult, resetAll } = workspaceFile;

  useEffect(() => {
    hasInitializedPos.current = false;
    setIsOverlaySelected(false);
  }, [previewUrl]);

  const updateImageRect = useCallback(() => {
    const rect = calculateImageRect(imageRef.current, previewContainerRef.current);
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
      setOverlaySize({ width: Math.max(1, r.width), height: Math.max(1, r.height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [activeTab, textWm, imgWm.url, imgWm.scale, imgWm.naturalWidth, imgWm.naturalHeight, previewUrl]);

  const dragBounds = useMemo(() => {
    const maxX = Math.max(imageRect.left, imageRect.left + imageRect.width - overlaySize.width);
    const maxY = Math.max(imageRect.top, imageRect.top + imageRect.height - overlaySize.height);
    return { left: imageRect.left, top: imageRect.top, right: maxX, bottom: maxY };
  }, [imageRect, overlaySize]);

  const handleWatermarkImageUpload = useCallback(async (e) => {
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
  }, [imgWm.url, cleanupResult, setError]);

  const handleRemoveWatermarkImage = useCallback(() => {
    if (imgWm.url) URL.revokeObjectURL(imgWm.url);
    setImgWm((prev) => ({ ...prev, url: null, naturalWidth: 1, naturalHeight: 1 }));
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
      const baseImg = await loadImage(previewUrl);
      const canvas = document.createElement('canvas');
      canvas.width = baseImg.naturalWidth || 1;
      canvas.height = baseImg.naturalHeight || 1;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(baseImg, 0, 0);

      const node = overlayRef.current;
      const transform = new DOMMatrix(window.getComputedStyle(node).transform);
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

        const lines = parseWatermarkTextLines(textWm.text, textWm.charStyles, { b: textWm.isBold, i: textWm.isItalic, u: textWm.isUnderline });
        const lineHeight = nativeFontSize * 1.2;

        lines.forEach((line, index) => {
          const currentY = targetY + (index * lineHeight);
          let currentX = targetX;

          if (!line.text) return;

          line.segments.forEach((seg) => {
            const fontStyle = seg.i ? 'italic ' : '';
            const fontWeight = seg.b ? 'bold ' : 'normal ';
            
            ctx.font = `${fontStyle}${fontWeight}${nativeFontSize}px "${textWm.fontFamily}", sans-serif`;
            ctx.fillStyle = textWm.color;

            const textW = Math.max(1, ctx.measureText(seg.text).width);

            if (seg.u) {
              ctx.save();
              ctx.shadowColor = 'transparent';
              ctx.fillStyle = textWm.color;
              ctx.fillRect(currentX, currentY + nativeFontSize * 1.08, textW, Math.max(2, nativeFontSize * 0.06));
              ctx.restore();
            }

            ctx.fillText(seg.text, currentX, currentY);
            currentX += textW;
          });
        });

      } else if (activeTab === 'image' && imgWm.url) {
        const markImg = await loadImage(imgWm.url);
        const nativeW = Math.max(1, markImg.naturalWidth * imgWm.scale * (canvas.width / Math.max(1, imageRect.width)));
        const nativeH = Math.max(1, markImg.naturalHeight * imgWm.scale * (canvas.height / Math.max(1, imageRect.height)));
        ctx.drawImage(markImg, targetX, targetY, nativeW, nativeH);
      }

      await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error('Canvas export failed'));
          else {
            setResultBlob(blob);
            setResultUrl(URL.createObjectURL(blob));
            resolve();
          }
        }, file.type || 'image/jpeg', 0.95);
      });
    } catch {
      setError('Failed to apply watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, previewUrl, cleanupResult, imageRect, activeTab, textWm, imgWm, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    if (imgWm.url) URL.revokeObjectURL(imgWm.url);
    resetAll();
    setIsProcessing(false);
    setActiveTab('text');
    setTextWm(DEFAULT_TEXT_WM);
    setImgWm(DEFAULT_IMAGE_WM);
    setOverlayPos({ x: 0, y: 0 });
    setOverlaySize({ width: 1, height: 1 });
    setIsOverlaySelected(false);
    hasInitializedPos.current = false;
  }, [imgWm.url, resetAll]);

  const canProcess = useMemo(() => Boolean(file) && !isProcessing && !resultUrl, [file, isProcessing, resultUrl]);

  return {
    refs: { fileInputRef, watermarkImageRef, imageRef, previewContainerRef, overlayRef },
    workspaceFile,
    state: { activeTab, isProcessing, overlayPos, isOverlaySelected, textWm, imgWm, dragBounds, canProcess },
    actions: { 
      setActiveTab, setTextWm, setImgWm, setIsOverlaySelected, updateImageRect,
      handleWatermarkImageUpload, handleRemoveWatermarkImage, handleDeleteSelected, 
      applyWatermark, handleReset 
    }
  };
}