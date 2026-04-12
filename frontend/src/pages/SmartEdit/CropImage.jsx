import { useState, useRef, useCallback, useMemo } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { AnimatePresence } from 'framer-motion';
import 'react-image-crop/dist/ReactCrop.css';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/file/fileUtils';

/**
 * Builds a centered aspect crop in percent units.
 * @param {number} mediaWidth
 * @param {number} mediaHeight
 * @param {number} aspect
 * @returns {import('react-image-crop').Crop}
 */
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Safely creates a centered default crop (free or aspect-locked).
 * @param {number} width
 * @param {number} height
 * @param {number|null} aspect
 * @returns {import('react-image-crop').Crop}
 */
function buildDefaultCrop(width, height, aspect) {
  if (width <= 0 || height <= 0) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  }

  if (!aspect) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 };
  }

  return centerAspectCrop(width, height, aspect);
}

const ASPECT_OPTIONS = [
  { label: 'Free', value: null },
  { label: 'Square (1:1)', value: 1 },
  { label: 'Landscape (16:9)', value: 16 / 9 },
  { label: 'Portrait (9:16)', value: 9 / 16 },
  { label: 'Classic (4:3)', value: 4 / 3 },
  { label: 'Story (3:4)', value: 3 / 4 },
];

export default function CropImage() {
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);

  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

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

  /**
   * Handles image load and initializes crop box.
   * @param {React.SyntheticEvent<HTMLImageElement>} e
   */
function onImageLoad(e) {
    const img = e.currentTarget;
    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    setImageSize({ width: naturalWidth, height: naturalHeight });

    const displayWidth = img.width || 0;
    const displayHeight = img.height || 0;

    const defaultCrop = buildDefaultCrop(displayWidth, displayHeight, aspect);
    setCrop(defaultCrop);

    // Set the initial completed crop right away
    setCompletedCrop({
      unit: 'px',
      x: (defaultCrop.x * displayWidth) / 100,
      y: (defaultCrop.y * displayHeight) / 100,
      width: (defaultCrop.width * displayWidth) / 100,
      height: (defaultCrop.height * displayHeight) / 100,
    });
  }

const applyAspect = useCallback(
    (nextAspect) => {
    setAspect(nextAspect);
    cleanupResult();

    if (!imgRef.current) return;

    // Use the displayed dimensions of the image
    const displayWidth = imgRef.current.width || 0;
    const displayHeight = imgRef.current.height || 0;
    
    const nextCrop = buildDefaultCrop(displayWidth, displayHeight, nextAspect);
    setCrop(nextCrop);
    
    // Calculate the actual pixel coordinates to keep the Apply button active
    setCompletedCrop({
        unit: 'px',
        x: (nextCrop.x * displayWidth) / 100,
        y: (nextCrop.y * displayHeight) / 100,
        width: (nextCrop.width * displayWidth) / 100,
        height: (nextCrop.height * displayHeight) / 100,
    });
    },
    [cleanupResult]
);

  const applyCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !file) return;

    const cropWidth = completedCrop.width || 0;
    const cropHeight = completedCrop.height || 0;
    if (cropWidth <= 0 || cropHeight <= 0) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');

      const scaleX = image.naturalWidth / Math.max(1, image.width);
      const scaleY = image.naturalHeight / Math.max(1, image.height);

      const outputWidth = Math.max(1, Math.floor(cropWidth * scaleX));
      const outputHeight = Math.max(1, Math.floor(cropHeight * scaleY));

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const sourceX = completedCrop.x * scaleX;
      const sourceY = completedCrop.y * scaleY;
      const sourceW = cropWidth * scaleX;
      const sourceH = cropHeight * scaleY;

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        0,
        0,
        outputWidth,
        outputHeight
      );

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
      setError('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [completedCrop, file, cleanupResult, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();
    setCrop(undefined);
    setCompletedCrop(null);
    setAspect(null);
    setImageSize({ width: 0, height: 0 });
    setIsProcessing(false);
  }, [resetAll]);

  const hasValidCrop = useMemo(() => {
    if (!completedCrop) return false;
    return completedCrop.width > 0 && completedCrop.height > 0;
  }, [completedCrop]);

  const canApply = useMemo(() => {
    return Boolean(file) && !isProcessing && !resultUrl && hasValidCrop;
  }, [file, isProcessing, resultUrl, hasValidCrop]);

  const cropSizeLabel = useMemo(() => {
    if (!completedCrop || !imgRef.current) return null;
    const scaleX = imgRef.current.naturalWidth / Math.max(1, imgRef.current.width);
    const scaleY = imgRef.current.naturalHeight / Math.max(1, imgRef.current.height);
    const w = Math.max(1, Math.round(completedCrop.width * scaleX));
    const h = Math.max(1, Math.round(completedCrop.height * scaleY));
    return `${w} × ${h}px`;
  }, [completedCrop]);

  const downloadName = useMemo(
    () => generateSafeFilename(file?.name, 'cropped', 'jpg'),
    [file?.name]
  );

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!file ? (
              <UploadCard inputId="crop-file-input" inputRef={fileInputRef} onChange={onFileChange} />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-6 transition-opacity duration-300 ${!file || resultUrl ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Crop Options</label>
                  {imageSize.width > 0 && imageSize.height > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                      Original: {imageSize.width} x {imageSize.height}
                    </span>
                  )}
                </div>

                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
                  Aspect Ratio Presets
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_OPTIONS.map((option) => {
                    const isSelected = aspect === option.value;
                    return (
                      <button
                        key={option.label}
                        onClick={() => applyAspect(option.value)}
                        className={`px-3 py-2 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                            : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-indigo-200 hover:shadow-sm'
                        }`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Cropping...' : 'Apply Crop'}
            secondaryLabel="Reset"
            onPrimaryClick={applyCrop}
            onSecondaryClick={handleReset}
            primaryDisabled={!canApply}
          />
        }
        rightHeader={
          <div className="flex items-center justify-between w-full">
            <h3 className="text-sm font-medium text-slate-700">Crop Workspace</h3>
            {cropSizeLabel && (
              <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">
                {cropSizeLabel}
              </span>
            )}
          </div>
        }
       rightBody={
    <div className="absolute inset-2 flex flex-col bg-white rounded-xl">
        <PreviewImageBox
        previewUrl={null}
        resultUrl={resultUrl}
        resultAlt="Cropped result preview"
        containerClassName="relative flex-1 min-h-0 w-full rounded-xl border border-slate-200 bg-white overflow-hidden"
        >
        {previewUrl && !resultUrl && (
            <div className="absolute inset-0 p-2 sm:p-3 bg-white">
            <div className="h-full w-full rounded-md border border-slate-200 bg-white overflow-hidden">
                
                <style>{`
                  /* 1. Stop the marching ants jiggle */
                  .ReactCrop__crop-selection {
                    animation: none !important;
                    background-image: none !important;
                    border: 2px solid white !important;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3) !important;
                  }
                  
                  /* 2. Hide the unnecessary middle edge boxes */
                  .ReactCrop__drag-handle.ord-n,
                  .ReactCrop__drag-handle.ord-e,
                  .ReactCrop__drag-handle.ord-s,
                  .ReactCrop__drag-handle.ord-w {
                    display: none !important;
                  }
                `}</style>

                <ReactCrop
                  crop={crop}
                  onChange={(nextCrop) => {
                    setCrop(nextCrop);
                    cleanupResult();
                  }}
                  onComplete={(nextCompletedCrop) => setCompletedCrop(nextCompletedCrop)}
                  aspect={aspect || undefined}
                  className="h-full w-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={previewUrl}
                    onLoad={onImageLoad}
                    className="block h-full w-full object-contain"
                  />
                </ReactCrop>
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
          downloadLabel="Download Cropped Image"
        />
      )}
    </AnimatePresence>
  </div>
}
      />
    </ToolPageWrapper>
  );
}