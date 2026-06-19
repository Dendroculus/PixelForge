import { useState, useCallback, useEffect, useRef } from 'react';
import {
  clamp,
  makeInitialPoints,
  resizePoints,
} from '@/utils/image/paletteMath';

/**
 * @param {Object} params
 * @param {string|null} params.previewUrl
 * @param {Function} params.samplePaletteFromPoints
 * @param {import('react').RefObject} params.imageRef
 * @param {import('react').RefObject} params.previewContainerRef
 */
export function useColorPaletteEditor({
  previewUrl,
  samplePaletteFromPoints,
  imageRef,
  previewContainerRef,
}) {
  const lastDragSampleAtRef = useRef(0);
  const latestPointsRef = useRef([]);

  const [paletteCount, setPaletteCount] = useState(5);
  const [paletteVariation, setPaletteVariation] = useState(1);
  const [points, setPoints] = useState(() => makeInitialPoints(5, 1));
  const [activePointId, setActivePointId] = useState(null);
  const [imageRect, setImageRect] = useState({
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });

  const updateImageRect = useCallback(() => {
    const img = imageRef.current;
    const box = previewContainerRef.current;
    if (!img || !box) return;

    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const iw = img.naturalWidth || 1;
    const ih = img.naturalHeight || 1;

    const padding = 8;
    const availableWidth = cw - padding * 2;
    const availableHeight = ch - padding * 2;

    const scale = Math.min(availableWidth / iw, availableHeight / ih);
    const width = iw * scale;
    const height = ih * scale;

    const left = padding + (availableWidth - width) / 2;
    const top = padding + (availableHeight - height) / 2;

    setImageRect((prev) => {
      if (
        Math.abs(prev.left - left) < 0.5 &&
        Math.abs(prev.top - top) < 0.5 &&
        Math.abs(prev.width - width) < 0.5 &&
        Math.abs(prev.height - height) < 0.5
      ) {
        return prev;
      }
      return { left, top, width, height };
    });
  }, [imageRef, previewContainerRef]);

  useEffect(() => {
    const box = previewContainerRef.current;
    if (!box) return undefined;

    updateImageRect();
    const resizeObserver = new ResizeObserver(() => updateImageRect());
    resizeObserver.observe(box);

    return () => resizeObserver.disconnect();
  }, [updateImageRect, previewUrl, previewContainerRef]);

  useEffect(() => {
    latestPointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!previewUrl || !latestPointsRef.current.length) return;
    samplePaletteFromPoints(latestPointsRef.current);
  }, [previewUrl, samplePaletteFromPoints]);

  const handlePaletteCountChange = useCallback(
    (e) => {
      const nextCount = Number(e.target.value);
      setPaletteCount(nextCount);
      setPoints((prev) => {
        const next = resizePoints(prev, nextCount, paletteVariation);
        if (previewUrl) samplePaletteFromPoints(next);
        return next;
      });
    },
    [previewUrl, paletteVariation, samplePaletteFromPoints],
  );

  const handleVariationChange = useCallback(
    (e) => {
      const nextVar = Number(e.target.value);
      setPaletteVariation(nextVar);
      setPoints(() => {
        const next = makeInitialPoints(paletteCount, nextVar);
        if (previewUrl) samplePaletteFromPoints(next);
        return next;
      });
    },
    [paletteCount, previewUrl, samplePaletteFromPoints],
  );

  const movePointFromClient = useCallback(
    (id, clientX, clientY) => {
      const box = previewContainerRef.current;
      if (!box) return;

      const rect = box.getBoundingClientRect();
      const localX = clientX - rect.left;
      const localY = clientY - rect.top;

      const handleRadius = 11;
      const minX = imageRect.left + handleRadius;
      const maxX = imageRect.left + imageRect.width - handleRadius;
      const minY = imageRect.top + handleRadius;
      const maxY = imageRect.top + imageRect.height - handleRadius;

      const clampedX = clamp(localX, minX, maxX);
      const clampedY = clamp(localY, minY, maxY);

      const nx = (clampedX - imageRect.left) / imageRect.width;
      const ny = (clampedY - imageRect.top) / imageRect.height;

      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)),
      );
    },
    [imageRect, previewContainerRef],
  );

  const onPointPointerDown = useCallback(
    (e, id) => {
      e.preventDefault();
      setActivePointId(id);

      let rafId = null;
      let pendingEvent = null;

      const runMoveInFrame = () => {
        if (!pendingEvent) return;
        movePointFromClient(id, pendingEvent.clientX, pendingEvent.clientY);
        rafId = null;
        pendingEvent = null;
      };

      const onMove = (ev) => {
        pendingEvent = ev;
        if (rafId) return;
        rafId = requestAnimationFrame(runMoveInFrame);
      };

      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        setActivePointId(null);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp, { once: true });
    },
    [movePointFromClient],
  );

  useEffect(() => {
    if (activePointId == null || !previewUrl) return undefined;

    const rafId = requestAnimationFrame(async () => {
      const now = performance.now();
      if (now - lastDragSampleAtRef.current < 16) return;
      lastDragSampleAtRef.current = now;

      const activePoint = points.find((p) => p.id === activePointId);
      if (!activePoint) return;

      await samplePaletteFromPoints([activePoint], {
        replaceIndexById: activePointId,
        allPoints: points,
        silent: true,
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [activePointId, points, previewUrl, samplePaletteFromPoints]);

  const resetEditor = useCallback(() => {
    setPoints(makeInitialPoints(paletteCount, paletteVariation));
    setActivePointId(null);
  }, [paletteCount, paletteVariation]);

  return {
    paletteCount,
    paletteVariation,
    points,
    imageRect,
    handlePaletteCountChange,
    handleVariationChange,
    onPointPointerDown,
    updateImageRect,
    resetEditor,
  };
}
