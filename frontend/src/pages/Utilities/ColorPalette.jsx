import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import PaletteSwatches from '../../components/Workspace/display/PaletteSwatches';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import usePaletteSampling from '../../hooks/client/usePaletteSampling';

/**
 * Clamps a number between a minimum and maximum value.
 * @param {number} v - The value to clamp.
 * @param {number} min - The minimum allowed value.
 * @param {number} max - The maximum allowed value.
 * @returns {number} The clamped value.
 */
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Generates a deterministic pseudo-random number based on a seed.
 * @param {number} seed - The input seed.
 * @returns {number} A float between 0 and 1.
 */
const pseudoRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Generates coordinate points with organic, seeded scatter for color sampling.
 * @param {number} count - The number of points to generate.
 * @param {number} [variation=1] - The variation index to organically scatter points.
 * @returns {Array<{id: number, x: number, y: number}>} Array of point objects with relative coordinates.
 */
function makeInitialPoints(count, variation = 1) {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const pts = [];

  for (let i = 0; i < count; i += 1) {
    const c = i % cols;
    const r = Math.floor(i / cols);

    const baseX = cols === 1 ? 0.5 : 0.15 + (c / (cols - 1)) * 0.7;
    const baseY = rows === 1 ? 0.5 : 0.15 + (r / (rows - 1)) * 0.7;

    const noiseX = pseudoRandom(variation * 100 + i);
    const noiseY = pseudoRandom(variation * 200 + i);

    const scatterX = (noiseX - 0.5) * 0.5;
    const scatterY = (noiseY - 0.5) * 0.5;

    const x = clamp(baseX + scatterX, 0.08, 0.92);
    const y = clamp(baseY + scatterY, 0.08, 0.92);

    pts.push({ id: i, x, y });
  }
  return pts;
}

/**
 * Resizes the array of sampling points while preserving existing points when possible.
 * @param {Array<{id: number, x: number, y: number}>} prev - The previous array of points.
 * @param {number} nextCount - The desired number of points.
 * @param {number} [variation=1] - The variation index used if new points are generated.
 * @returns {Array<{id: number, x: number, y: number}>} The updated array of points.
 */
function resizePoints(prev, nextCount, variation = 1) {
  if (prev.length === nextCount) return prev;
  if (prev.length > nextCount) return prev.slice(0, nextCount);

  const extras = makeInitialPoints(nextCount, variation).slice(prev.length);
  return [...prev, ...extras.map((p, i) => ({ ...p, id: prev.length + i }))];
}

/**
 * Color Palette Tool component allowing users to extract colors from uploaded images.
 * @returns {JSX.Element}
 */
export default function ColorPalette() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);
  const lastDragSampleAtRef = useRef(0);

  const [paletteCount, setPaletteCount] = useState(5);
  const [paletteVariation, setPaletteVariation] = useState(1);
  const [copiedHex, setCopiedHex] = useState(null);
  const [points, setPoints] = useState(makeInitialPoints(5, 1));
  const [activePointId, setActivePointId] = useState(null);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 1, height: 1 });

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
      const next = resizePoints(prev, nextCount, paletteVariation);
      if (previewUrl) samplePaletteFromPoints(next);
      return next;
    });
  }, [previewUrl, paletteVariation, samplePaletteFromPoints]);

  const handleVariationChange = useCallback((e) => {
    const nextVar = Number(e.target.value);
    setPaletteVariation(nextVar);
    setPoints(() => {
      const next = makeInitialPoints(paletteCount, nextVar);
      if (previewUrl) samplePaletteFromPoints(next);
      return next;
    });
  }, [paletteCount, previewUrl, samplePaletteFromPoints]);

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
  }, []);

  useEffect(() => {
    const box = previewContainerRef.current;
    if (!box) return undefined;

    updateImageRect();
    const resizeObserver = new ResizeObserver(() => updateImageRect());
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
    setPoints(makeInitialPoints(paletteCount, paletteVariation));
    setActivePointId(null);
  }, [paletteCount, paletteVariation, resetWorkspaceFile, setIsProcessing, setPalette]);

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

    const handleRadius = 11;

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

  const onPointPointerDown = useCallback((e, id) => {
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
  }, [movePointFromClient]);

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
                  hasActiveFile={Boolean(file)}
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

            <div className={`mb-6 flex flex-col justify-center transition-opacity ${!file ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <label className="mb-4 flex w-full items-center justify-between text-left text-sm font-bold text-slate-700">
                <span>Picked palettes</span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">{paletteVariation}</span>
              </label>
              <div className="px-1 pt-1">
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={paletteVariation}
                  onChange={handleVariationChange}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                />
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
                    <h3 className="text-sm font-bold text-slate-700">Palette</h3>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('square')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'square' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('circle')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'circle' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Circle
                      </button>
                    </div>
                  </div>

                  <PaletteSwatches
                    palette={palette.map((hex, i) => ({
                      id: points[i]?.id ?? i,
                      hex,
                    }))}
                    paletteStyle={paletteStyle}
                    copiedHex={copiedHex}
                    onCopy={copyToClipboard}
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
              containerRef={previewContainerRef}
            >
              {previewUrl &&
                points.map((p, i) => {
                  const hex = palette[i] || '#ffffff';
                  return (
                    <motion.button
                      key={`picker-${p.id}`}
                      onPointerDown={(e) => onPointPointerDown(e, p.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.55)] active:cursor-grabbing"
                      initial={false}
                      animate={{
                        left: imageRect.left + p.x * imageRect.width,
                        top: imageRect.top + p.y * imageRect.height,
                        backgroundColor: hex,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 25,
                        mass: 0.8,
                      }}
                      style={{
                        width: 22,
                        height: 22,
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