import { useCallback, useState, useRef } from 'react';
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

export default function ColorPalette() {
  const fileInputRef = useRef(null);
  const [paletteCount, setPaletteCount] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [palette, setPalette] = useState([]);
  const [copiedHex, setCopiedHex] = useState(null);

  const {
    file,
    previewUrl,
    error,
    setError,
    onFileChange,
    resetAll: resetWorkspaceFile,
  } = useWorkspaceFile(fileInputRef);

  const handleReset = useCallback(() => {
    resetWorkspaceFile();
    setPalette([]);
    setIsProcessing(false);
    setCopiedHex(null);
  }, [resetWorkspaceFile]);

  const extractColors = useCallback(async () => {
    if (!previewUrl || isProcessing) return;
    setIsProcessing(true);
    setPalette([]);
    setCopiedHex(null);

    try {
      const img = new Image();
      img.crossOrigin = 'Anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      const MAX_DIM = 150;
      let w = img.width;
      let h = img.height;
      if (w > h && w > MAX_DIM) {
        h = Math.round(h * (MAX_DIM / w));
        w = MAX_DIM;
      } else if (h > MAX_DIM) {
        w = Math.round(w * (MAX_DIM / h));
        h = MAX_DIM;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h).data;
      const colorCounts = {};

      for (let i = 0; i < imgData.length; i += 4) {
        const a = imgData[i + 3];
        if (a < 128) continue;
        const r = Math.round(imgData[i] / 24) * 24;
        const g = Math.round(imgData[i + 1] / 24) * 24;
        const b = Math.round(imgData[i + 2] / 24) * 24;
        const rgb = `${r},${g},${b}`;
        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, paletteCount * 5);

      const finalPalette = [];
      for (const [rgbStr] of sortedColors) {
        const [r, g, b] = rgbStr.split(',').map(Number);
        const isSimilar = finalPalette.some((existing) => {
          const [er, eg, eb] = existing.split(',').map(Number);
          const dist = Math.sqrt((r - er) ** 2 + (g - eg) ** 2 + (b - eb) ** 2);
          return dist < 45;
        });
        if (!isSimilar) finalPalette.push(rgbStr);
        if (finalPalette.length >= paletteCount) break;
      }

      const rgbToHex = (r, g, b) =>
        '#' +
        [r, g, b]
          .map((x) => {
            const hex = Math.max(0, Math.min(255, x)).toString(16);
            return hex.length === 1 ? `0${hex}` : hex;
          })
          .join('');

      setPalette(finalPalette.map((rgb) => {
        const [r, g, b] = rgb.split(',').map(Number);
        return rgbToHex(r, g, b);
      }));
    } catch {
      setError('Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  }, [previewUrl, isProcessing, paletteCount, setError]);

  const copyToClipboard = useCallback((hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  }, []);

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
                  <label className="mb-2 w-full text-left text-sm font-bold text-slate-700">Palette</label>
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
            <button onClick={extractColors} disabled={!file || isProcessing} className="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none">
              {isProcessing ? 'Analyzing Pixels...' : 'Extract Palette'}
            </button>
          </div>
        }
        rightHeader={<h3 className="flex items-center justify-between text-sm font-bold text-slate-800">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Original"
                className={`max-h-full max-w-full object-contain ${isProcessing ? 'scale-105 opacity-60 blur-md grayscale transition-all duration-700' : 'transition-all duration-700 opacity-100'}`}
              />
            ) : (
              <EmptyWorkspaceState />
            )}
          </div>
        }
      />
    </section>
  );
}