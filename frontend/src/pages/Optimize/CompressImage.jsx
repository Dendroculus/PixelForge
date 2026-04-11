import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/PreviewImageBox';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/useWorkspaceFile';
import { bytesToMB, generateSafeFilename } from '../../utils/fileUtils';
import { processImageWithCanvas } from '../../utils/imageUtils';

/**
 * React component for compressing image files on the client side.
 * @returns {JSX.Element} The CompressImage component.
 */
export default function CompressImage() {
  const fileInputRef = useRef(null);
  const [quality, setQuality] = useState(0.6);
  const [isCompressing, setIsCompressing] = useState(false);

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

  const handleReset = useCallback(() => {
    resetAll();
    setIsCompressing(false);
  }, [resetAll]);

  const compressImage = useCallback(async () => {
    if (!file || isCompressing) return;

    setIsCompressing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await processImageWithCanvas(file, {
        mimeType: 'image/jpeg',
        quality: quality,
        fillBackground: true,
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected compression error.');
    } finally {
      setIsCompressing(false);
    }
  }, [cleanupResult, file, isCompressing, quality, setError, setResultBlob, setResultUrl]);

  const canCompress = useMemo(() => Boolean(file) && !isCompressing, [file, isCompressing]);
  const downloadName = useMemo(() => generateSafeFilename(file?.name, 'min', 'jpg'), [file?.name]);

  const savingsPercent = useMemo(() => {
    if (!file || !resultBlob) return 0;
    const diff = file.size - resultBlob.size;
    if (diff <= 0) return 0;
    return Math.round((diff / file.size) * 100);
  }, [file, resultBlob]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <>
            <div className="mb-4">
              <UploadCard
                inputId="compress-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.COMPRESS_MAX_SIZE_MB}MB`}
                maxSizeMB={APP_CONFIG.COMPRESS_MAX_SIZE_MB}
              />
              <AnimatePresence>
                {file && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-3 flex items-center justify-between overflow-hidden rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm shadow-sm">
                    <span className="mr-4 truncate font-medium text-slate-700">{file.name}</span>
                    <span className="whitespace-nowrap text-xs font-bold text-slate-400">{bytesToMB(file.size)} MB</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-4 flex flex-col justify-center">
              <label className="mb-4 flex w-full items-center justify-between text-sm font-bold text-slate-700">
                <span>Compression Level</span>
                <span className="text-indigo-600">{Math.round((1 - quality) * 100)}%</span>
              </label>
              <div className="px-1 pt-1">
                <input
                  id="compression-range"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={1 - quality}
                  onChange={(e) => setQuality(1 - Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                />
                <div className="mt-2 flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>High Quality</span>
                  <span>Small File</span>
                </div>
              </div>
            </div>

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
          <div className="flex gap-3">
            <button type="button" onClick={compressImage} disabled={!canCompress} className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none">
              {isCompressing ? 'Compressing...' : 'Compress Image'}
            </button>
            <button type="button" onClick={handleReset} className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900">
              Reset
            </button>
          </div>
        }
        rightHeader={
          <h3 className="flex items-center justify-between text-sm font-bold text-slate-800">
            Preview Workspace
            {resultBlob && savingsPercent > 0 && (
              <span className="rounded-md border border-emerald-200 bg-emerald-100/50 px-2 py-1 text-xs font-semibold text-emerald-600">
                Saved {savingsPercent}%
              </span>
            )}
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Compressed output preview"
            />
            <AnimatePresence>
              {resultUrl && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex shrink-0 flex-col gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/60 bg-white/40 px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-600 line-through decoration-rose-400">{bytesToMB(file.size)} MB</span>
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <span className="font-bold text-emerald-600">{bytesToMB(resultBlob.size)} MB</span>
                  </div>
                  <a href={resultUrl} download={downloadName} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20">
                    Download Compressed Image
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}