import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import UploadDropzone from '../../components/Upload/UploadDropzone';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/file/fileUtils';

/**
 * Builds a centered aspect crop in percent units.
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
  const [fitMode, setFitMode] = useState('fit');

  const {
    file,
    previewUrl,
    setResultBlob,
    resultUrl,
    setResultUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  const handleFileSelectWrapper = useCallback((selectedFile) => {
    if (selectedFile) {
        onFileChange({ target: { files: [selectedFile] } });
    }
  }, [onFileChange]);

  const onImageLoad = useCallback((e) => {
    const img = e.currentTarget;
    setImageSize({ 
      width: img.naturalWidth || 0, 
      height: img.naturalHeight || 0 
    });
  }, []);

  // Recalculates the crop box coordinates *after* the browser physically scales the image
  useEffect(() => {
    if (imgRef.current && imageSize.width > 0 && imageSize.height > 0) {
      const timer = setTimeout(() => {
        if (!imgRef.current) return;
        const displayWidth = imgRef.current.width || 0;
        const displayHeight = imgRef.current.height || 0;
        
        const defaultCrop = buildDefaultCrop(displayWidth, displayHeight, aspect);
        setCrop(defaultCrop);
        
        setCompletedCrop({
          unit: 'px',
          x: (defaultCrop.x * displayWidth) / 100,
          y: (defaultCrop.y * displayHeight) / 100,
          width: (defaultCrop.width * displayWidth) / 100,
          height: (defaultCrop.height * displayHeight) / 100,
        });
      }, 50); 
      return () => clearTimeout(timer);
    }
  }, [imageSize, aspect]);

  const applyAspect = useCallback(
    (nextAspect) => {
      setAspect(nextAspect);
      cleanupResult();
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
    setFitMode('fit'); // Reset to default mode when clearing the workspace
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

  const isFocusMode = Boolean(file && !error && !isProcessing && !resultUrl);

  const imageAspect = imageSize.width > 0 && imageSize.height > 0
    ? imageSize.width / imageSize.height
    : 1;

  const content = (() => {
    if (!file) {
      return (
        <div className="bg-white/40 backdrop-blur-2xl p-2 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-2xl mx-auto">
          <UploadDropzone onFileSelect={handleFileSelectWrapper} />
          {/* Hidden input kept in sync for hook compatibility if needed */}
          <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white/50 backdrop-blur-2xl p-8 rounded-2xl shadow-xl border border-rose-100/60 max-w-2xl mx-auto text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-rose-200">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
             </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h3>
          <p className="text-rose-600 font-medium mb-6">{error}</p>
          <button onClick={handleReset} className="px-8 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm">
             Try Again
          </button>
        </div>
      );
    }

    if (isProcessing) {
      return (
        <div className="bg-white/40 backdrop-blur-2xl p-12 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-md mx-auto flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-bold animate-pulse">Applying precision crop...</p>
        </div>
      );
    }

    if (resultUrl) {
      return (
        <div className="bg-white/50 backdrop-blur-2xl p-8 rounded-2xl shadow-xl border border-indigo-100/60 max-w-2xl mx-auto text-center flex flex-col items-center">
          <style>{`
            .result-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .result-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .result-scroll::-webkit-scrollbar-thumb {
              background: rgba(99, 102, 241, 0.6); /* Vibrant Indigo */
              border-radius: 20px;
            }
            .result-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(67, 56, 202, 1); /* Deep Indigo on hover */
            }
          `}</style>

          <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-indigo-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-2">Crop Successful!</h3>
          <p className="text-slate-600 font-medium mb-6">Your image is ready to use.</p>

          {/* Smart Grow Container: Naturally fits image height until it hits the 500px limit */}
          <div className="bg-white/50 rounded-xl border border-white/40 mb-8 w-full max-w-sm overflow-hidden shadow-inner">
             <div className="max-h-500px h-auto overflow-y-auto result-scroll p-2">
                <img 
                  src={resultUrl} 
                  alt="Cropped result" 
                  className="w-full h-auto rounded-lg block shadow-sm" 
                />
             </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2 w-full">
            <button
              onClick={handleReset}
              className="w-full sm:w-40 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
            >
              Crop Another
            </button>
            <a
              href={resultUrl}
              download={downloadName}
              className="w-full sm:w-48 flex justify-center items-center py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-md shadow-indigo-200"
            >
              Download Image
            </a>
          </div>
        </div>
      );
    }

    // FOCUS MODE
    return (
      <div 
        className="bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 flex flex-col w-full max-w-6xl mx-auto overflow-hidden relative text-left"
        style={{ height: 'calc(100vh - 60px)', minHeight: '600px' }}
      >
        <div className="flex-none flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-lg">Focus Crop</h2>
            {cropSizeLabel && (
              <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-slate-700">
                {cropSizeLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applyCrop}
              disabled={!canApply}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              Apply Crop
            </button>
          </div>
        </div>

        <div 
          className={`flex-1 min-h-0 w-full relative p-4 sm:p-8 bg-slate-950/50 ${
            fitMode === 'fit' 
              ? 'flex items-center justify-center overflow-hidden' 
              : 'overflow-y-auto overflow-x-hidden custom-scroll block'
          }`}
        >
          <style>{`
            /* Custom Scrollbar for Dark Mode */
            .custom-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.4); /* slate-900 */
              border-radius: 4px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: rgba(71, 85, 105, 0.8); /* slate-600 */
              border-radius: 4px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(99, 102, 241, 0.9); /* indigo-500 hover */
            }

            /* ReactCrop Overrides */
            .ReactCrop__crop-selection {
              animation: none !important;
              background-image: none !important;
              border: 2px solid white !important;
              box-shadow: 0 0 5px rgba(0,0,0,0.5) !important;
            }
            .ReactCrop__drag-handle.ord-n,
            .ReactCrop__drag-handle.ord-e,
            .ReactCrop__drag-handle.ord-s,
            .ReactCrop__drag-handle.ord-w {
              display: none !important;
            }
          `}</style>

          <ReactCrop
            crop={crop}
            onChange={(nextCrop) => setCrop(nextCrop)}
            onComplete={(nextCompletedCrop) => {
              setCompletedCrop(nextCompletedCrop);
              cleanupResult();
            }}
            aspect={aspect || undefined}
            className={fitMode === 'fit' ? "flex items-center justify-center" : ""}
            style={
              fitMode === 'fit'
                ? {
                    // Fit Mode: Dynamically calculate to touch vertical limits safely
                    width: imageSize.width > 0 ? `calc((100vh - 260px) * ${imageAspect})` : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    margin: 'auto'
                  }
                : {
                    // Scroll Mode: Take up horizontal space, allow infinite vertical growth
                    width: '100%',
                    maxWidth: '800px', 
                    height: 'max-content',
                    margin: '0 auto',
                    display: 'block'
                  }
            }
          >
            <img
              ref={imgRef}
              alt="Crop preview"
              src={previewUrl}
              onLoad={onImageLoad}
              className={`block ${fitMode === 'scroll' ? 'shadow-2xl' : ''}`}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </ReactCrop>

          {/* Floating Toggle Button */}
          <div className="absolute bottom-6 right-6 z-50 flex gap-2">
            <button
              onClick={() => setFitMode(prev => prev === 'fit' ? 'scroll' : 'fit')}
              className="p-2.5 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 transition-all"
              title={fitMode === 'fit' ? 'Switch to Scroll Mode for tall images' : 'Fit to Screen'}
            >
              {fitMode === 'fit' ? (
                // Expand Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                // Compress/Fit Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v4H4m4-4L3 3m13 1v4h4m-4-4l5-5m-5 13v4h-4m4-4l5 5M8 20v-4H4m4 4l-5 5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Footer Presets Strip */}
        <div className="flex-none bg-slate-900 border-t border-slate-800 p-4 sm:p-5 overflow-x-auto z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-max mx-auto px-2">
            {ASPECT_OPTIONS.map((option) => {
              const isSelected = aspect === option.value;
              return (
                <button
                  key={option.label}
                  onClick={() => applyAspect(option.value)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  })();

  return (
    <div className="w-full">
      <section 
        className={isFocusMode 
          ? "w-full mx-auto px-4 sm:px-6 pt-4 pb-6 relative z-10" 
          : "max-w-6xl mx-auto px-6 pt-4 pb-16 text-center relative z-10"
        }
      >
        <div>{content}</div>
      </section>
    </div>
  );
}