import { useRef, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { useImageCrop } from '../../hooks/workspace/useImageCrop';
import { CROP_ASPECT_RATIOS } from '../../config';
import ToolStateWrapper from '../../components/Layout/ToolStateWrapper';
import WorkspaceSuccessCard from '../../components/Workspace/cards/WorkspaceSuccessCard';

export default function CropImage() {
  const fileInputRef = useRef(null);

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

  const {
    imgRef,
    crop,
    setCrop,
    setCompletedCrop,
    aspect,
    isProcessing,
    fitMode,
    setFitMode,
    imageSize,
    onImageLoad,
    applyAspect,
    applyCrop,
    handleReset,
    canApply,
    cropSizeLabel,
    downloadName,
    isFocusMode,
    imageAspect
  } = useImageCrop({
    file,
    error,
    resultUrl,
    cleanupResult,
    setResultBlob,
    setResultUrl,
    setError,
    resetAll
  });

  const handleFileSelectWrapper = useCallback((selectedFile) => {
    if (selectedFile) {
        onFileChange({ target: { files: [selectedFile] } });
    }
  }, [onFileChange]);

  const content = (() => {
    if (resultUrl) {
      return (
        <WorkspaceSuccessCard 
          title="Crop Successful!"
          description="Your image is ready to use."
          resultUrl={resultUrl}
          downloadName={downloadName}
          onReset={handleReset}
          resetText="Crop Another"
          downloadText="Download Image"
        />
      );
    }

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
            .custom-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scroll::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.4); 
              border-radius: 4px;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
              background: rgba(71, 85, 105, 0.8); 
              border-radius: 4px;
            }
            .custom-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(99, 102, 241, 0.9); 
            }
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
            onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
            onComplete={(pixelCrop, percentCrop) => {
              setCompletedCrop(percentCrop);
              cleanupResult();
            }}
            aspect={aspect || undefined}
            className={fitMode === 'fit' ? "flex items-center justify-center" : ""}
            style={
              fitMode === 'fit'
                ? {
                    width: imageSize.width > 0 ? `calc((100vh - 260px) * ${imageAspect})` : 'auto',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    margin: 'auto'
                  }
                : {
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

          <div className="absolute bottom-6 right-6 z-50 flex gap-2">
            <button
              onClick={() => setFitMode(prev => prev === 'fit' ? 'scroll' : 'fit')}
              className="p-2.5 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 transition-all"
              title={fitMode === 'fit' ? 'Switch to Scroll Mode for tall images' : 'Fit to Screen'}
            >
              {fitMode === 'fit' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v4H4m4-4L3 3m13 1v4h4m-4-4l5-5m-5 13v4h-4m4-4l5 5M8 20v-4H4m4 4l-5 5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex-none bg-slate-900 border-t border-slate-800 p-4 sm:p-5 overflow-x-auto z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-max mx-auto px-2">
            {CROP_ASPECT_RATIOS.map((option) => {
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
      <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} />
      <section 
        className={isFocusMode 
          ? "w-full mx-auto px-4 sm:px-6 pt-4 pb-6 relative z-10" 
          : "max-w-6xl mx-auto px-6 pt-4 pb-16 text-center relative z-10"
        }
      >
        <ToolStateWrapper
          file={file}
          error={error}
          isProcessing={isProcessing}
          processingText="Applying precision crop..."
          onFileSelect={handleFileSelectWrapper}
          onReset={handleReset}
        >
          {content}
        </ToolStateWrapper>
      </section>
    </div>
  );
}