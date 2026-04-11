import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import PaletteSwatches from '../../components/Workspace/display/PaletteSwatches';
import PaletteStyleToggle from '../../components/Workspace/controls/PaletteStyleToggle';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import usePaletteSampling from '../../hooks/client/usePaletteSampling';

/**
 * Clamps a numeric value to a min/max range.
 * @param {number} v - Value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} Clamped value.
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Builds initial evenly distributed color sampling points.
 * @param {number} count - Number of points.
 * @returns {Array<{id:number,x:number,y:number}>} Initial points.
 */
function makeInitialPoints(count) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = cols === 1 ? 0.5 : 0.12 + (c / (cols - 1)) * 0.76;
    const y = rows === 1 ? 0.5 : 0.12 + (r / (rows - 1)) * 0.76;
    pts.push({ id: i, x, y });
  }
  return pts;
}

/**
 * Resizes an existing points array to a target count while preserving current positions.
 * @param {Array<{id:number,x:number,y:number}>} prev - Existing points.
 * @param {number} nextCount - Desired points count.
 * @returns {Array<{id:number,x:number,y:number}>} Resized points.
 */
function resizePoints(prev, nextCount) {
  if (prev.length === nextCount) return prev;
  if (prev.length > nextCount) return prev.slice(0, nextCount);
  const extras = makeInitialPoints(nextCount).slice(prev.length);
  return [...prev, ...extras.map((p, i) => ({ ...p, id: prev.length + i }))];
}

/**
 * React component for extracting color palettes from images using interactive pickers.
 * @returns {JSX.Element} The ColorPalette component.
 */
export default function ColorPalette() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);

  const [paletteCount, setPaletteCount] = useState(5);
  const [copiedHex, setCopiedHex] = useState(null);
  const [points, setPoints] = useState(makeInitialPoints(5));
  const [activePointId, setActivePointId] = useState(null);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 1, height: 1 });
  const lastDragSampleAtRef = useRef(0);

  const [paletteStyle, setPaletteStyle] = useState(() => {
    if (typeof window === 'undefined') return 'square';
    return localStorage.getItem('paletteStyle') || 'square';
  });

  const {
    file,
    previewUrl,
    error,
    setError,
    onFileChange,
    resetAll: resetWorkspaceFile,
  } = useWorkspaceFile(fileInputRef);

  const {
    isProcessing,
    setIsProcessing,
    palette,
    setPalette,
    samplePaletteFromPoints,
  } = usePaletteSampling({ previewUrl, setError });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paletteStyle', paletteStyle);
    }
  }, [paletteStyle]);

  const handlePaletteCountChange = useCallback((e) => {
    const nextCount = Number(e.target.value);
    setPaletteCount(nextCount);
    setPoints((prev) => {
      const next = resizePoints(prev, nextCount);
      if (previewUrl) {
        samplePaletteFromPoints(next);
      }
      return next;
    });
  }, [previewUrl, samplePaletteFromPoints]);

  const updateImageRect = useCallback(() => {
    const img = imageRef.current;
    const box = previewContainerRef.current;
    if (!img || !box) return;

    const cw = box.clientWidth;
    const ch = box.clientHeight;
    const iw = img.naturalWidth || 1;
    const ih = img.naturalHeight || 1;

    const padding = 8;
    const availableWidth = cw - (padding * 2);
    const availableHeight = ch - (padding * 2);

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
  }, []);

  useEffect(() => {
    const box = previewContainerRef.current;
    if (!box) return;

    updateImageRect();

    const resizeObserver = new ResizeObserver(() => {
      updateImageRect();
    });

    resizeObserver.observe(box);
    return () => resizeObserver.disconnect();
  }, [updateImageRect, previewUrl]);

  const latestPointsRef = useRef(points);

  useEffect(() => {
    latestPointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!previewUrl || !latestPointsRef.current.length) return;
    samplePaletteFromPoints(latestPointsRef.current);
  }, [previewUrl, samplePaletteFromPoints]);

  const handleReset = useCallback(() => {
    resetWorkspaceFile();
    setPalette([]);
    setIsProcessing(false);
    setCopiedHex(null);
    setPoints(makeInitialPoints(paletteCount));
    setActivePointId(null);
  }, [paletteCount, resetWorkspaceFile, setIsProcessing, setPalette]);

  const copyToClipboard = useCallback((hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  }, []);

  const movePointFromClient = useCallback((id, clientX, clientY) => {
    const box = previewContainerRef.current;
    if (!box) return;

    const rect = box.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    const handleSize = 22;
    const handleRadius = handleSize / 2;

    const minX = imageRect.left + handleRadius;
    const maxX = imageRect.left + imageRect.width - handleRadius;
    const minY = imageRect.top + handleRadius;
    const maxY = imageRect.top + imageRect.height - handleRadius;

    const clampedX = clamp(localX, minX, maxX);
    const clampedY = clamp(localY, minY, maxY);

    const nx = (clampedX - imageRect.left) / imageRect.width;
    const ny = (clampedY - imageRect.top) / imageRect.height;

    setPoints((prev) => prev.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)));
  }, [imageRect]);

  const onPointPointerDown = useCallback((id) => (e) => {
    e.preventDefault();
    setActivePointId(id);

    const onMove = (ev) => {
      movePointFromClient(id, ev.clientX, ev.clientY);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setActivePointId(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [movePointFromClient]);

  useEffect(() => {
    if (activePointId == null || !previewUrl) return;

    let rafId = 0;
    rafId = requestAnimationFrame(async () => {
      const now = performance.now();
      if (now - lastDragSampleAtRef.current < 33) return;
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

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <>
            {!file && (
              <div className="mb-4 min-h-32">
                <UploadCard
                  inputId="palette-file-input"
                  inputRef={fileInputRef}
                  onChange={onFileChange}
                  helperText="Any format up to 10MB"
                  maxSizeMB={10}
                />
              </div>
            )}

            <div className={`mb-4 flex flex-col justify-center transition-opacity ${!file ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <label className="mb-4 flex w-full items-center justify-between text-left text-sm font-bold text-slate-700">
                <span>Colors to Extract</span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">{paletteCount}</span>
              </label>
              <div className="px-1 pt-1">
                <input
                  type="range"
                  min="3"
                  max="10"
                  step="1"
                  value={paletteCount}
                  onChange={handlePaletteCountChange}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                />
                <div className="mt-2 flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Basic</span>
                  <span>Detailed</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {palette.length > 0 && (
                <motion.div
                  key="palette-wrapper"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex flex-col"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-slate-700">Palette</label>
                    <PaletteStyleToggle paletteStyle={paletteStyle} setPaletteStyle={setPaletteStyle} />
                  </div>

                  <PaletteSwatches
                    palette={palette}
                    paletteStyle={paletteStyle}
                    copiedHex={copiedHex}
                    onCopy={copyToClipboard}
                    isDragging={activePointId != null}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <WorkspaceErrorAlert error={error} />
          </>
        }
        leftFooter={
          <div className="flex flex-col gap-3">
            {file && (
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Another Image
              </button>
            )}
            <button
              onClick={() => samplePaletteFromPoints(points)}
              disabled={!file || isProcessing}
              className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
            >
              {isProcessing ? 'Analyzing Pixels...' : 'Extract Palette'}
            </button>
          </div>
        }
        rightHeader={<h3 className="flex items-center justify-between text-sm font-bold text-slate-800">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              isProcessing={isProcessing}
              imageRef={imageRef}
              onImageLoad={updateImageRect}
              previewClassName="opacity-100 transition-all duration-200"
              containerClassName="relative flex-1 min-h-0 w-full rounded-xl overflow-hidden flex items-center justify-center bg-black/5 touch-none"
              containerRef={previewContainerRef}
            >
              {previewUrl &&
                points.map((p, i) => {
                  const hex = palette[i] || '#ffffff';
                  return (
                    <button
                      key={`picker-${p.id}`}
                      onPointerDown={onPointPointerDown(p.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.55)] cursor-grab active:cursor-grabbing"
                      style={{
                        left: `${imageRect.left + p.x * imageRect.width}px`,
                        top: `${imageRect.top + p.y * imageRect.height}px`,
                        width: 22,
                        height: 22,
                        backgroundColor: hex,
                      }}
                      title={hex.toUpperCase()}
                      aria-label={`Move color picker ${i + 1}`}
                    />
                  );
                })}
            </PreviewImageBox>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}