import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { generateSafeFilename } from '../../utils/fileUtils';

export default function RotateFlip() {
  const fileInputRef = useRef(null);

  // Transformation State
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState(1); // 1 (normal) or -1 (flipped)
  const [flipV, setFlipV] = useState(1); // 1 (normal) or -1 (flipped)
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

  // Reset transforms when a new file is uploaded
  useEffect(() => {
    setRotation(0);
    setFlipH(1);
    setFlipV(1);
  }, [previewUrl]);

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
    cleanupResult(); // Clear previous result if user makes a new change
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
    cleanupResult();
  };

  const handleFlipHorizontal = () => {
    setFlipH((prev) => prev * -1);
    cleanupResult();
  };

  const handleFlipVertical = () => {
    setFlipV((prev) => prev * -1);
    cleanupResult();
  };

  const applyTransform = useCallback(async () => {
    if (!file || !previewUrl) return;
    
    // If no changes were made, don't do anything
    if (rotation === 0 && flipH === 1 && flipV === 1) {
      setError("Please rotate or flip the image before applying.");
      return;
    }

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = previewUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      // Calculate new dimensions based on rotation
      const isRotated90or270 = Math.abs(rotation) % 180 === 90;
      canvas.width = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
      canvas.height = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

      // FIX: Fill background with white to prevent black backgrounds on JPEG export or transparent gaps
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Move context to center, apply transforms, then draw
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH, flipV);
      
      // Draw image offset by half its width/height so it centers perfectly
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Canvas export failed');
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
          setIsProcessing(false);
        },
        file.type || 'image/jpeg',
        0.95
      );
    } catch (e) {
      console.error(e);
      setError('Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  }, [file, previewUrl, rotation, flipH, flipV, cleanupResult, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();
    setRotation(0);
    setFlipH(1);
    setFlipV(1);
    setIsProcessing(false);
  }, [resetAll]);

  const canProcess = useMemo(() => Boolean(file) && !isProcessing && !resultUrl, [file, isProcessing, resultUrl]);
  const downloadName = useMemo(() => generateSafeFilename(file?.name, 'rotated', 'jpg'), [file?.name]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!file ? (
              <UploadCard
                inputId="rf-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-6 transition-opacity duration-300 ${!file || resultUrl ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              
              {/* Rotation Controls */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="mb-3 block text-xs font-bold text-slate-700 uppercase tracking-wide">Rotate Image</label>
                <div className="flex gap-3">
                  <button
                    onClick={handleRotateLeft}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 transition-colors font-semibold text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Left
                  </button>
                  <button
                    onClick={handleRotateRight}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 transition-colors font-semibold text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                    </svg>
                    Right
                  </button>
                </div>
              </div>

              {/* Flip Controls */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="mb-3 block text-xs font-bold text-slate-700 uppercase tracking-wide">Flip Image</label>
                <div className="flex gap-3">
                  <button
                    onClick={handleFlipHorizontal}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 transition-colors font-semibold text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Horizontal
                  </button>
                  <button
                    onClick={handleFlipVertical}
                    className="flex-1 flex flex-col items-center justify-center gap-2 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-600 transition-colors font-semibold text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Vertical
                  </button>
                </div>
              </div>

            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Processing...' : 'Apply Transform'}
            secondaryLabel="Reset"
            onPrimaryClick={applyTransform}
            onSecondaryClick={handleReset}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Transformed output preview"
            >
              {previewUrl && !resultUrl && (
                 <div className="absolute inset-0 z-10 bg-white flex items-center justify-center overflow-hidden rounded-xl">
                   <img
                     src={previewUrl}
                     alt="Live CSS Preview"
                     className="h-full w-full object-contain pointer-events-none transition-transform duration-300 ease-out"
                     style={{
                       transform: `rotate(${rotation}deg) scaleX(${flipH}) scaleY(${flipV})`
                     }}
                   />
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
                  downloadLabel="Download Transformed Image"
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}