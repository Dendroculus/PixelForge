import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/file/fileUtils';

const MAX_DIMENSION = 5000;

const RESIZE_PRESETS = [
  { label: 'IG Square', width: 1080, height: 1080 },
  { label: 'IG Story / TikTok', width: 1080, height: 1920 },
  { label: 'Social Post', width: 1200, height: 630 },
  { label: 'Full HD (1080p)', width: 1920, height: 1080 },
  { label: 'HD (720p)', width: 1280, height: 720 },
  { label: 'Standard SD', width: 640, height: 480 },
];

/**
 * Loads an image element from URL.
 * @param {string} url
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('Missing image URL'));
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Converts a value into a safe integer dimension.
 * @param {string|number} value
 * @returns {number|string}
 */
function toSafeDimension(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1) return '';
  return Math.min(parsed, MAX_DIMENSION);
}

export default function ResizeImage() {
  const fileInputRef = useRef(null);

  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);

  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);

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
    let active = true;

    if (!previewUrl) {
      setOrigWidth(0);
      setOrigHeight(0);
      setTargetWidth('');
      setTargetHeight('');
      return undefined;
    }

    loadImage(previewUrl)
      .then((img) => {
        if (!active) return;

        let w = img.naturalWidth || 0;
        let h = img.naturalHeight || 0;
        const ratio = h > 0 ? w / h : 1;

        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
          if (w >= h) {
            w = MAX_DIMENSION;
            h = Math.max(1, Math.round(MAX_DIMENSION / ratio));
          } else {
            h = MAX_DIMENSION;
            w = Math.max(1, Math.round(MAX_DIMENSION * ratio));
          }
        }

        setOrigWidth(img.naturalWidth || 0);
        setOrigHeight(img.naturalHeight || 0);
        setTargetWidth(w || '');
        setTargetHeight(h || '');
      })
      .catch(() => {
        if (!active) return;
        setError('Could not read image dimensions.');
      });

    return () => {
      active = false;
    };
  }, [previewUrl, setError]);

  const aspectRatio = useMemo(() => {
    if (origWidth <= 0 || origHeight <= 0) return 1;
    return origWidth / origHeight;
  }, [origWidth, origHeight]);

  const previewRatio = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return 1;
    return w / h;
  }, [targetWidth, targetHeight]);

  const handleWidthChange = (e) => {
    let val = toSafeDimension(e.target.value);
    if (val === '') {
      setTargetWidth('');
      if (lockAspect) setTargetHeight('');
      cleanupResult();
      return;
    }

    if (lockAspect && val > 0) {
      let newHeight = Math.round(val / aspectRatio);
      if (newHeight > MAX_DIMENSION) {
        newHeight = MAX_DIMENSION;
        val = Math.round(newHeight * aspectRatio);
      }
      if (newHeight < 1) newHeight = 1;
      setTargetHeight(newHeight);
    }

    setTargetWidth(val);
    cleanupResult();
  };

  const handleHeightChange = (e) => {
    let val = toSafeDimension(e.target.value);
    if (val === '') {
      setTargetHeight('');
      if (lockAspect) setTargetWidth('');
      cleanupResult();
      return;
    }

    if (lockAspect && val > 0) {
      let newWidth = Math.round(val * aspectRatio);
      if (newWidth > MAX_DIMENSION) {
        newWidth = MAX_DIMENSION;
        val = Math.round(newWidth / aspectRatio);
      }
      if (newWidth < 1) newWidth = 1;
      setTargetWidth(newWidth);
    }

    setTargetHeight(val);
    cleanupResult();
  };

  const toggleLock = () => {
    setLockAspect((prev) => {
      const next = !prev;

      if (next) {
        const w = Number(targetWidth);
        if (Number.isFinite(w) && w > 0) {
          let newHeight = Math.round(w / aspectRatio);
          let safeWidth = w;

          if (newHeight > MAX_DIMENSION) {
            newHeight = MAX_DIMENSION;
            safeWidth = Math.round(newHeight * aspectRatio);
          }

          if (newHeight < 1) newHeight = 1;
          if (safeWidth < 1) safeWidth = 1;

          setTargetWidth(safeWidth);
          setTargetHeight(newHeight);
          cleanupResult();
        }
      }

      return next;
    });
  };

  const applyPreset = (w, h) => {
    const safeW = toSafeDimension(w);
    const safeH = toSafeDimension(h);
    setTargetWidth(safeW);
    setTargetHeight(safeH);
    setLockAspect(false);
    cleanupResult();
  };

  const applyResize = useCallback(async () => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);

    if (!file || !previewUrl || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const img = await loadImage(previewUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      const finalW = Math.min(Math.max(1, Math.round(w)), MAX_DIMENSION);
      const finalH = Math.min(Math.max(1, Math.round(h)), MAX_DIMENSION);

      canvas.width = finalW;
      canvas.height = finalH;
      ctx.drawImage(img, 0, 0, finalW, finalH);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (nextBlob) => {
            if (!nextBlob) {
              reject(new Error('Canvas export failed'));
              return;
            }
            resolve(nextBlob);
          },
          file.type || 'image/jpeg',
          0.95
        );
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
      setError('Failed to resize image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, previewUrl, targetWidth, targetHeight, cleanupResult, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();

    let w = origWidth;
    let h = origHeight;
    const ratio = h > 0 ? w / h : 1;

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      if (w >= h) {
        w = MAX_DIMENSION;
        h = Math.max(1, Math.round(MAX_DIMENSION / ratio));
      } else {
        h = MAX_DIMENSION;
        w = Math.max(1, Math.round(MAX_DIMENSION * ratio));
      }
    }

    setTargetWidth(w || '');
    setTargetHeight(h || '');
    setLockAspect(true);
    setIsProcessing(false);
  }, [resetAll, origWidth, origHeight]);

  const canProcess = useMemo(() => {
    const w = Number(targetWidth);
    const h = Number(targetHeight);
    return Boolean(file) && !isProcessing && !resultUrl && w > 0 && h > 0;
  }, [file, isProcessing, resultUrl, targetWidth, targetHeight]);

  const downloadName = useMemo(
    () => generateSafeFilename(file?.name, `${targetWidth}x${targetHeight}`, 'jpg'),
    [file?.name, targetWidth, targetHeight]
  );

  const showLiveStage = Boolean(previewUrl) && !resultUrl && Number(targetWidth) > 0 && Number(targetHeight) > 0;

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!file ? (
              <UploadCard
                inputId="resize-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-6 transition-opacity duration-300 ${!file || resultUrl ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Custom Dimensions</h3>
                  {origWidth > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      Original: {origWidth} x {origHeight}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <label htmlFor="targetWidth" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 absolute -top-2 left-2 bg-white px-1">Width</label>
                    <input
                      id="targetWidth"
                      type="number"
                      value={targetWidth}
                      onChange={handleWidthChange}
                      min="1"
                      max={MAX_DIMENSION}
                      placeholder="Width"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">px</span>
                  </div>

                  <button
                    onClick={toggleLock}
                    title={lockAspect ? 'Unlock Aspect Ratio' : 'Lock Aspect Ratio'}
                    className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                      lockAspect
                        ? 'bg-indigo-100 text-indigo-600 shadow-inner'
                        : 'bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-500 hover:bg-slate-100'
                    }`}
                  >
                    {lockAspect ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 relative">
                    <label htmlFor="targetHeight" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1 absolute -top-2 left-2 bg-white px-1">Height</label>
                    <input
                      id="targetHeight"
                      type="number"
                      value={targetHeight}
                      onChange={handleHeightChange}
                      min="1"
                      max={MAX_DIMENSION}
                      placeholder="Height"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">px</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <h3 className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Quick Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {RESIZE_PRESETS.map((preset) => {
                      const isSelected = Number(targetWidth) === preset.width && Number(targetHeight) === preset.height;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => applyPreset(preset.width, preset.height)}
                          className={`flex flex-col items-start px-3 py-2 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                              : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-200 hover:shadow-sm'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {preset.label}
                          </span>
                          <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                            {preset.width} × {preset.height} px
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Resizing...' : 'Apply Resize'}
            secondaryLabel="Reset"
            onPrimaryClick={applyResize}
            onSecondaryClick={handleReset}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col bg-white rounded-xl">
            <PreviewImageBox
              previewUrl={showLiveStage ? null : previewUrl}
              resultUrl={resultUrl}
              resultAlt="Resized output preview"
            >
              {showLiveStage && (
                <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none bg-white">
                  <div
                    className="relative max-w-full max-h-full border border-slate-200 bg-white rounded-md overflow-hidden"
                    style={{
                      aspectRatio: `${previewRatio}`,
                      width: 'min(100%, calc(100% - 8px))',
                      height: 'auto',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Live resize preview"
                      className="absolute inset-0 w-full h-full transition-all duration-300"
                      style={{ objectFit: lockAspect ? 'contain' : 'fill' }}
                    />
                  </div>
                </div>
              )}
            </PreviewImageBox>

            <AnimatePresence>
              {resultUrl && (
                <WorkspaceResultDownload
                  resultUrl={resultUrl}
                  resultBlob={resultBlob}
                  originalFile={file}
                  downloadName={downloadName}
                  downloadLabel={`Download ${targetWidth}x${targetHeight} Image`}
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}