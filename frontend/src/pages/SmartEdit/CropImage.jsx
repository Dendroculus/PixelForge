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

/**
 * Applies a subtle alpha feather to soften crop edges and reduce hard cut lines.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} featherPx
 */
function applyEdgeFeather(ctx, width, height, featherPx) {
  const f = Math.max(0, Math.floor(featherPx));
  if (f <= 0 || width <= 2 || height <= 2) return;

  const maxFeather = Math.floor(Math.min(width, height) / 6);
  const feather = Math.min(f, Math.max(1, maxFeather));
  if (feather <= 0) return;

  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';

  const cx = feather;
  const cy = feather;
  const cw = Math.max(0, width - feather * 2);
  const ch = Math.max(0, height - feather * 2);

  if (cw > 0 && ch > 0) {
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.fillRect(cx, cy, cw, ch);
  }

  if (cw > 0) {
    const gTop = ctx.createLinearGradient(0, 0, 0, feather);
    gTop.addColorStop(0, 'rgba(0,0,0,0)');
    gTop.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gTop;
    ctx.fillRect(cx, 0, cw, feather);

    const gBottom = ctx.createLinearGradient(0, height - feather, 0, height);
    gBottom.addColorStop(0, 'rgba(0,0,0,1)');
    gBottom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gBottom;
    ctx.fillRect(cx, height - feather, cw, feather);
  }

  if (ch > 0) {
    const gLeft = ctx.createLinearGradient(0, 0, feather, 0);
    gLeft.addColorStop(0, 'rgba(0,0,0,0)');
    gLeft.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = gLeft;
    ctx.fillRect(0, cy, feather, ch);

    const gRight = ctx.createLinearGradient(width - feather, 0, width, 0);
    gRight.addColorStop(0, 'rgba(0,0,0,1)');
    gRight.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gRight;
    ctx.fillRect(width - feather, cy, feather, ch);
  }

  const gTL = ctx.createRadialGradient(feather, feather, 0, feather, feather, feather);
  gTL.addColorStop(0, 'rgba(0,0,0,1)');
  gTL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gTL;
  ctx.fillRect(0, 0, feather, feather);

  const gTR = ctx.createRadialGradient(width - feather, feather, 0, width - feather, feather, feather);
  gTR.addColorStop(0, 'rgba(0,0,0,1)');
  gTR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gTR;
  ctx.fillRect(width - feather, 0, feather, feather);

  const gBL = ctx.createRadialGradient(feather, height - feather, 0, feather, height - feather, feather);
  gBL.addColorStop(0, 'rgba(0,0,0,1)');
  gBL.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gBL;
  ctx.fillRect(0, height - feather, feather, feather);

  const gBR = ctx.createRadialGradient(
    width - feather,
    height - feather,
    0,
    width - feather,
    height - feather,
    feather
  );
  gBR.addColorStop(0, 'rgba(0,0,0,1)');
  gBR.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gBR;
  ctx.fillRect(width - feather, height - feather, feather, feather);

  ctx.restore();
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
    const width = e.currentTarget.naturalWidth || e.currentTarget.width || 0;
    const height = e.currentTarget.naturalHeight || e.currentTarget.height || 0;
    setImageSize({ width, height });
    setCrop(buildDefaultCrop(width, height, aspect));
  }

  const applyAspect = useCallback(
    (nextAspect) => {
      setAspect(nextAspect);
      cleanupResult();

      if (!imgRef.current) return;

      const width = imgRef.current.naturalWidth || imgRef.current.width || 0;
      const height = imgRef.current.naturalHeight || imgRef.current.height || 0;
      setCrop(buildDefaultCrop(width, height, nextAspect));
      setCompletedCrop(null);
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

      applyEdgeFeather(ctx, outputWidth, outputHeight, 2);

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

                {cropSizeLabel && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selected Crop</span>
                    <div className="mt-1 text-xs font-semibold text-slate-700">{cropSizeLabel}</div>
                  </div>
                )}
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
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Crop Workspace</h3>}
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
                <div className="h-full w-full rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center">
                    <ReactCrop
                    crop={crop}
                    onChange={(nextCrop) => {
                        setCrop(nextCrop);
                        cleanupResult();
                    }}
                    onComplete={(nextCompletedCrop) => setCompletedCrop(nextCompletedCrop)}
                    aspect={aspect || undefined}
                    className="h-full w-full flex items-center justify-center"
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