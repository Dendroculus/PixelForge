import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import WorkspaceLayout from '../../components/WorkspaceLayout';

const SUPPORTED_INPUT = new Set(APP_CONFIG.ALLOWED_EXTENSIONS);

function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

function getExt(filename = '') {
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function makeDownloadName(originalName) {
  const safeBase = (originalName || 'compressed')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w-]+/g, '_')
    .slice(0, 80);
  return `${safeBase || 'compressed'}_min.jpg`; 
}

export default function CompressImage() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [quality, setQuality] = useState(0.6); 
  const [isCompressing, setIsCompressing] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');

  const revokeUrl = useCallback((url) => {
    if (url) URL.revokeObjectURL(url);
  }, []);

  const cleanupResult = useCallback(() => {
    revokeUrl(resultUrl);
    setResultBlob(null);
    setResultUrl('');
  }, [resultUrl, revokeUrl]);

  const cleanupPreview = useCallback(() => {
    revokeUrl(previewUrl);
    setPreviewUrl('');
  }, [previewUrl, revokeUrl]);

  const resetAll = useCallback(() => {
    cleanupResult();
    cleanupPreview();
    setFile(null);
    setError('');
    setIsCompressing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [cleanupPreview, cleanupResult]);

  const validateFile = useCallback((pickedFile) => {
    if (!pickedFile) return 'No file selected.';
    const ext = getExt(pickedFile.name);
    if (!SUPPORTED_INPUT.has(ext)) {
      return `Unsupported file type. Allowed: ${Array.from(SUPPORTED_INPUT).join(', ')}`;
    }
    const maxBytes = APP_CONFIG.COMPRESS_MAX_SIZE_MB * 1024 * 1024;
    if (pickedFile.size > maxBytes) {
      return `File too large. Max ${APP_CONFIG.COMPRESS_MAX_SIZE_MB}MB.`;
    }
    return '';
  }, []);

  const onFileChange = useCallback(
    (event) => {
      const picked = event.target.files?.[0];
      setError('');
      cleanupResult();

      const validationError = validateFile(picked);
      if (validationError) {
        setFile(null);
        cleanupPreview();
        setError(validationError);
        return;
      }

      setFile(picked);
      cleanupPreview();
      setPreviewUrl(URL.createObjectURL(picked));
    },
    [cleanupPreview, cleanupResult, validateFile]
  );

  const compressImage = useCallback(async () => {
    if (!file || isCompressing) return;

    setIsCompressing(true);
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

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Compression failed. Please try another file.'));
              return;
            }
            resolve(b);
          },
          'image/jpeg',
          quality 
        );
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected compression error.');
    } finally {
      setIsCompressing(false);
    }
  }, [cleanupResult, file, isCompressing, quality]);

  const canCompress = useMemo(() => Boolean(file) && !isCompressing, [file, isCompressing]);
  const downloadName = useMemo(() => makeDownloadName(file?.name), [file?.name]);
  
  const savingsPercent = useMemo(() => {
    if (!file || !resultBlob) return 0;
    const diff = file.size - resultBlob.size;
    if (diff <= 0) return 0;
    return Math.round((diff / file.size) * 100);
  }, [file, resultBlob]);

  useEffect(() => () => {
    revokeUrl(previewUrl);
    revokeUrl(resultUrl);
  }, [previewUrl, resultUrl, revokeUrl]);

  return (
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      <WorkspaceLayout
        leftPanel={
          <>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">
                Client-Side
              </span>
            </div>

            <div>
              <label 
                htmlFor="compress-file-input" 
                className="group relative flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-indigo-200 bg-white/40 hover:bg-white/70 hover:border-indigo-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-indigo-400 group-hover:text-indigo-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="mb-1 text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                    Click to upload image
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Any format up to {APP_CONFIG.COMPRESS_MAX_SIZE_MB}MB</p>
                </div>
                <input
                  id="compress-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="hidden"
                />
              </label>
              
              <AnimatePresence>
                {file && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center justify-between px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm shadow-sm overflow-hidden"
                  >
                    <span className="font-medium text-slate-700 truncate mr-4">{file.name}</span>
                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">{bytesToMB(file.size)} MB</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col justify-center mb-6">
              <label className="w-full flex justify-between items-center text-sm font-bold text-slate-700 mb-4">
                <span>Compression Level</span>
                <span className="text-indigo-600">{Math.round((1 - quality) * 100)}%</span>
              </label>
              
              <div className="pt-1 px-1">
                <input
                  id="compression-range"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={1 - quality} 
                  onChange={(e) => setQuality(1 - Number(e.target.value))}
                  className="w-full h-1.5 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between w-full mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <span>High Quality</span>
                  <span>Small File</span>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 backdrop-blur-sm px-4 py-3 text-sm text-rose-700 font-medium shadow-sm">
                    {error}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3 mt-auto pt-2">
              <button
                type="button"
                onClick={compressImage}
                disabled={!canCompress}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
              >
                {isCompressing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Compressing...
                  </span>
                ) : 'Compress Image'}
              </button>

              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm"
              >
                Reset
              </button>
            </div>
          </>
        }
        rightPanel={
          <>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
              Preview Workspace
              {resultBlob && savingsPercent > 0 && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200">
                  Saved {savingsPercent}%
                </span>
              )}
            </h3>
            
            <div className="flex-1 min-h-72 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner">
              {resultUrl ? (
                <motion.img 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={resultUrl} 
                  alt="Compressed output preview" 
                  className="max-h-96 w-full object-contain p-2" 
                />
              ) : previewUrl ? (
                <motion.img 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={previewUrl} 
                  alt="Original preview" 
                  className="max-h-96 w-full object-contain p-2 opacity-70" 
                />
              ) : (
                <div className="text-center px-4">
                  <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-slate-400">Workspace is empty</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {resultUrl && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex flex-col gap-3"
                >
                  <div className="flex justify-between items-center px-4 py-3 bg-white/40 rounded-xl border border-white/60 text-sm">
                     <span className="font-semibold text-slate-600 line-through decoration-rose-400">{bytesToMB(file.size)} MB</span>
                     <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                     <span className="font-bold text-emerald-600">{bytesToMB(resultBlob.size)} MB</span>
                  </div>

                  <a
                    href={resultUrl}
                    download={downloadName}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Compressed Image
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        }
      />
    </section>
  );
}