import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import EmptyWorkspaceState from '../../components/Common/EmptyWorkspaceState';
import { useWorkspaceFile } from '../../hooks/useWorkspaceFile';

function getContrastYIQ(hexcolor) {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? 'text-slate-900' : 'text-white';
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const rgbToHex = (r, g, b) =>
  '#' +
  [r, g, b]
    .map((x) => {
      const hex = Math.max(0, Math.min(255, x)).toString(16);
      return hex.length === 1 ? `0${hex}` : hex;
    })
    .join('');

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

export default function ColorPalette() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);
  const canvasRef = useRef(null);

  const [paletteCount, setPaletteCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [palette, setPalette] = useState([]);
  const [copiedHex, setCopiedHex] = useState(null);

  const [points, setPoints] = useState(makeInitialPoints(5));
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paletteStyle', paletteStyle);
    }
  }, [paletteStyle]);

  useEffect(() => {
    setPoints((prev) => {
      if (prev.length === paletteCount) return prev;
      if (prev.length > paletteCount) return prev.slice(0, paletteCount);
      const extras = makeInitialPoints(paletteCount).slice(prev.length);
      return [...prev, ...extras.map((p, i) => ({ ...p, id: prev.length + i }))];
    });
  }, [paletteCount]);

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

    setImageRect({ left, top, width, height });
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

  const buildSamplingCanvas = useCallback(async () => {
    if (!previewUrl) return null;

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = previewUrl;
    });

    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas context unavailable');

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return { canvas, ctx };
  }, [previewUrl]);

  const samplePaletteFromPoints = useCallback(async (inputPoints) => {
    if (!previewUrl || !inputPoints?.length) return;
    setIsProcessing(true);
    setError('');

    try {
      const built = await buildSamplingCanvas();
      if (!built) return;
      const { canvas, ctx } = built;

      const nextPalette = inputPoints.map((p) => {
        const px = Math.round(clamp(p.x, 0, 1) * (canvas.width - 1));
        const py = Math.round(clamp(p.y, 0, 1) * (canvas.height - 1));
        const d = ctx.getImageData(px, py, 1, 1).data;
        return rgbToHex(d[0], d[1], d[2]);
      });

      setPalette(nextPalette);
    } catch {
      setError('Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl, setError, buildSamplingCanvas]);

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
  }, [resetWorkspaceFile, paletteCount]);

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

    const HANDLE_SIZE = 22;
    const HANDLE_RADIUS = HANDLE_SIZE / 2;

    const minX = imageRect.left + HANDLE_RADIUS;
    const maxX = imageRect.left + imageRect.width - HANDLE_RADIUS;
    const minY = imageRect.top + HANDLE_RADIUS;
    const maxY = imageRect.top + imageRect.height - HANDLE_RADIUS;

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
      setPoints((latest) => {
        samplePaletteFromPoints(latest);
        return latest;
      });
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }, [movePointFromClient, samplePaletteFromPoints]);

  useEffect(() => {
    if (activePointId == null) return;
    const t = setTimeout(() => samplePaletteFromPoints(points), 16);
    return () => clearTimeout(t);
  }, [points, activePointId, samplePaletteFromPoints]);

  return (
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">Client-Side</span></div>}
        leftBody={
          <>
            {!file && (
              <div className="mb-4 min-h-32">
                <UploadCard inputId="palette-file-input" inputRef={fileInputRef} onChange={onFileChange} helperText="Any format up to 10MB" maxSizeMB={10} />
              </div>
            )}

            <div className={`mb-4 flex flex-col justify-center transition-opacity ${!file ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <label className="mb-4 flex w-full items-center justify-between text-left text-sm font-bold text-slate-700">
                <span>Colors to Extract</span>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">{paletteCount}</span>
              </label>
              <div className="px-1 pt-1">
                <input type="range" min="3" max="10" step="1" value={paletteCount} onChange={(e) => setPaletteCount(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
                <div className="mt-2 flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Basic</span>
                  <span>Detailed</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {palette.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0, scale: 0.95 }} animate={{ opacity: 1, height: 'auto', scale: 1 }} exit={{ opacity: 0, height: 0 }} className="mb-4 flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-slate-700">Palette</label>

                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('square')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'square'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('circle')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'circle'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Circle
                      </button>
                    </div>
                  </div>

                  {paletteStyle === 'square' ? (
                    <div className="flex h-14 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
                      {palette.map((hex, i) => (
                        <motion.button
                          key={`palette-block-${hex}-${i}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => copyToClipboard(hex)}
                          className="group relative flex-1 transition-all duration-300 ease-in-out hover:flex-[1.5] focus:outline-none"
                          style={{ backgroundColor: hex }}
                          title={`Copy ${hex.toUpperCase()}`}
                        >
                          <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
                            {copiedHex === hex ? (
                              <svg className={`h-5 w-5 ${getContrastYIQ(hex)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className={`hidden whitespace-nowrap text-[10px] font-black tracking-wider sm:block ${getContrastYIQ(hex)}`}>{hex.toUpperCase()}</span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {palette.map((hex, i) => (
                        <motion.button
                          key={`palette-circle-${hex}-${i}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04 }}
                          onClick={() => copyToClipboard(hex)}
                          className="group relative h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-slate-200/70 shadow-sm transition-transform hover:scale-110 focus:outline-none"
                          style={{ backgroundColor: hex }}
                          title={`Copy ${hex.toUpperCase()}`}
                        >
                          <span className="absolute inset-0 grid place-items-center">
                            {copiedHex === hex ? (
                              <svg className={`h-4 w-4 ${getContrastYIQ(hex)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <span className={`hidden text-[9px] font-black tracking-wider group-hover:block ${getContrastYIQ(hex)}`}>
                                {hex.replace('#', '')}
                              </span>
                            )}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2 overflow-hidden">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm backdrop-blur-sm">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        }
        leftFooter={
          <div className="flex flex-col gap-3">
            {file && (
              <button onClick={handleReset} disabled={isProcessing} className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50">
                Upload Another Image
              </button>
            )}
            <button onClick={() => samplePaletteFromPoints(points)} disabled={!file || isProcessing} className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none">
              {isProcessing ? 'Analyzing Pixels...' : 'Extract Palette'}
            </button>
          </div>
        }
        rightHeader={<h3 className="flex items-center justify-between text-sm font-bold text-slate-800">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <div
              ref={previewContainerRef}
              className="relative flex-1 min-h-0 w-full rounded-xl overflow-hidden flex items-center justify-center bg-black/5 touch-none"
            >
              {previewUrl ? (
                <>
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Original"
                    onLoad={updateImageRect}
                    className={`absolute inset-0 w-full h-full object-contain p-2 ${
                      isProcessing ? 'scale-105 opacity-60 blur-[1px] grayscale-[0.1] transition-all duration-200' : 'transition-all duration-200 opacity-100'
                    }`}
                  />

                  {points.map((p, i) => {
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
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyWorkspaceState />
                </div>
              )}
            </div>
          </div>
        }
      />
    </section>
  );
}