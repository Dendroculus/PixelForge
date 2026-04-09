import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import EmptyWorkspaceState from '../../components/Common/EmptyWorkspaceState';
import { useWorkspaceFile } from '../../hooks/useWorkspaceFile';

const OUTPUT_FORMATS = ['jpg', 'png', 'webp', 'jpeg'];

function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function makeDownloadName(originalName, targetExt) {
  const safeBase = (originalName || 'converted')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w-]+/g, '_')
    .slice(0, 80);
  return `${safeBase || 'converted'}.${targetExt}`;
}

function getMimeFromFormat(format) {
  if (format === 'jpg') return 'image/jpeg';
  if (format === 'png') return 'image/png';
  if (format === 'jpeg') return 'image/jpeg';
  return 'image/webp';
}

export default function ConvertFormat() {
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);
  const [isConverting, setIsConverting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  const {
    file,
    previewUrl,
    resultBlob,
    setResultBlob,
    resultUrl,
    setResultUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  useEffect(() => {
    function handleClickOutside(event) {
      const inTrigger = dropdownRef.current && dropdownRef.current.contains(event.target);
      const inMenu = dropdownMenuRef.current && dropdownMenuRef.current.contains(event.target);
      if (!inTrigger && !inMenu) setIsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = useCallback(() => {
    resetAll();
    setIsConverting(false);
    setIsDropdownOpen(false);
  }, [resetAll]);

  const convertImage = useCallback(async () => {
    if (!file || isConverting) return;

    setIsConverting(true);
    setError('');
    cleanupResult();

    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        throw new Error('Canvas context unavailable.');
      }

      if (targetFormat === 'jpg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const mime = getMimeFromFormat(targetFormat);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Conversion failed. Please try another file.'))),
          mime,
          targetFormat === 'png' ? undefined : quality
        );
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected conversion error.');
    } finally {
      setIsConverting(false);
    }
  }, [cleanupResult, file, isConverting, quality, targetFormat, setError, setResultBlob, setResultUrl]);

  const canConvert = useMemo(() => Boolean(file) && !isConverting, [file, isConverting]);
  const downloadName = useMemo(() => makeDownloadName(file?.name, targetFormat), [file?.name, targetFormat]);

  const updateDropdownPosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    setDropdownStyle({ position: 'fixed', top: rect.bottom + 6, left: rect.left, width: rect.width, zIndex: 9999 });
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    updateDropdownPosition();
    const onScroll = () => updateDropdownPosition();
    const onResize = () => updateDropdownPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [isDropdownOpen, updateDropdownPosition]);

  return (
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">Client-Side</span></div>}
        leftBody={
          <>
            <div className="mb-4">
              <UploadCard inputId="convert-file-input" inputRef={fileInputRef} onChange={onFileChange} helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`} />
              <AnimatePresence>
                {file && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex items-center justify-between overflow-hidden rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm shadow-sm">
                    <span className="mr-4 truncate font-medium text-slate-700">{file.name}</span>
                    <span className="whitespace-nowrap text-xs font-bold text-slate-400">{bytesToMB(file.size)} MB</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-6">
              <div className="relative" ref={dropdownRef}>
                <label className="mb-2 block text-sm font-bold text-slate-700">Convert To</label>
                <button type="button" onClick={() => { if (!isDropdownOpen) updateDropdownPosition(); setIsDropdownOpen(!isDropdownOpen); }} className="flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  {targetFormat.toUpperCase()}
                  <svg className={`h-4 w-4 text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && dropdownStyle && createPortal(
                  <motion.div ref={dropdownMenuRef} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15, ease: 'easeOut' }} style={dropdownStyle} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex flex-col p-2">
                      {OUTPUT_FORMATS.map((fmt) => (
                        <button key={fmt} type="button" onClick={() => { setTargetFormat(fmt); setIsDropdownOpen(false); }} className={`rounded-lg px-3 py-2 text-left text-sm font-bold transition-colors ${targetFormat === fmt ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'}`}>
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </motion.div>,
                  document.body
                )}
              </div>

              <div className={`flex flex-col justify-center transition-opacity duration-300 ${targetFormat === 'png' ? 'pointer-events-none opacity-30' : 'opacity-100'}`}>
                <label className="mb-2 flex w-full items-center justify-between text-sm font-bold text-slate-700">
                  <span>Quality</span>
                  <span className="text-indigo-600">{Math.round(quality * 100)}%</span>
                </label>
                <div className="pt-1">
                  <input id="quality-range" type="range" min="0.6" max="1" step="0.01" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-2 overflow-hidden">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm backdrop-blur-sm">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        }
        leftFooter={
          <div className="flex gap-3">
            <button type="button" onClick={convertImage} disabled={!canConvert} className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none">
              {isConverting ? 'Converting...' : 'Convert Image'}
            </button>
            <button type="button" onClick={handleReset} className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900">
              Reset
            </button>
          </div>
        }
        rightHeader={
          <h3 className="flex items-center justify-between text-sm font-bold text-slate-800">
            Preview Workspace
            {resultBlob && <span className="rounded-md border border-emerald-200 bg-emerald-100/50 px-2 py-1 text-xs font-semibold text-emerald-600">Ready: {bytesToMB(resultBlob.size)} MB</span>}
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <div className="relative flex-1 min-h-0 w-full rounded-xl border border-white/50 bg-white/20 overflow-hidden">
              {resultUrl ? (
                <motion.img initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} src={resultUrl} alt="Converted output preview" className="absolute inset-0 w-full h-full object-contain p-2" />
              ) : previewUrl ? (
                <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={previewUrl} alt="Original preview" className="absolute inset-0 w-full h-full object-contain p-2 opacity-70" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyWorkspaceState />
                </div>
              )}
            </div>

            <AnimatePresence>
              {resultUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 shrink-0">
                  <a href={resultUrl} download={downloadName} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
                    Download {targetFormat.toUpperCase()}
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />
    </section>
  );
}