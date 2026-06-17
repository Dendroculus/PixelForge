import React from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import FitModeToggle from '../controls/FitModeToggle';
import Magnifier, { ZoomButton } from '../controls/Magnifier';
import AspectRatioControls from '../controls/AspectRatioControls';
import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {string} props.previewUrl
 * @param {Object} props.crop
 * @param {Function} props.setCrop
 * @param {Function} props.setCompletedCrop
 * @param {number|null|undefined} props.aspect
 * @param {Function} props.applyAspect
 * @param {Function} props.applyCrop
 * @param {boolean} props.canApply
 * @param {string} props.cropSizeLabel
 * @param {Function} props.onImageLoad
 * @param {React.MutableRefObject} props.imgRef
 * @param {string} props.fitMode
 * @param {Function} props.setFitMode
 * @param {Object} props.imageSize
 * @param {number} props.imageSize.width
 * @param {number} props.imageSize.height
 * @param {number} props.imageAspect
 * @param {Function} props.onCancel
 * @param {Function} props.cleanupResult
 * @param {Array<{label: string, value: number|null}>} props.aspectRatioOptions
 * @returns {JSX.Element}
 */
export default function CropEditor({
  previewUrl,
  crop,
  setCrop,
  setCompletedCrop,
  aspect,
  applyAspect,
  applyCrop,
  canApply,
  cropSizeLabel,
  onImageLoad,
  imgRef,
  fitMode,
  setFitMode,
  imageSize,
  imageAspect,
  onCancel,
  cleanupResult,
  aspectRatioOptions
}) {
  /**
   * @returns {void}
   */
  const handleToggleFitMode = () => {
    setFitMode((prev) => (prev === 'fit' ? 'scroll' : 'fit'));
  };

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
            onClick={onCancel}
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

      <div className="flex-1 min-h-0 w-full relative bg-slate-950/50 flex flex-col overflow-hidden">
        <Magnifier
          containerClassName={`flex-1 w-full h-full p-4 sm:p-8 ${
            fitMode === 'fit' 
              ? 'flex items-center justify-center overflow-hidden' 
              : 'overflow-y-auto overflow-x-hidden custom-scroll block'
          }`}
          innerClassName={fitMode === 'fit' ? 'flex items-center justify-center w-full h-full' : 'w-full h-full'}
          renderControls={({ isZoomed, toggleZoom }) => (
            <div className="absolute bottom-6 right-6 z-50 flex gap-2">
              <FitModeToggle
                isFitMode={fitMode === 'fit'}
                onToggle={handleToggleFitMode}
                className="p-2.5 bg-slate-800/90 backdrop-blur rounded-lg border border-slate-700 shadow-lg text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500 transition-all"
                fitTitle="Fit to Screen"
                fillTitle="Switch to Scroll Mode for tall images"
              />
              <ZoomButton
                isZoomed={isZoomed}
                onToggle={toggleZoom}
                className={`p-2.5 backdrop-blur rounded-lg border shadow-lg transition-all ${
                  isZoomed 
                    ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500' 
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-slate-500'
                }`}
              />
            </div>
          )}
        >
          {() => (
            <>
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
            </>
          )}
        </Magnifier>
      </div>

      <AspectRatioControls 
        aspect={aspect} 
        onApplyAspect={applyAspect} 
        options={aspectRatioOptions} 
      />
    </div>
  );
}

CropEditor.propTypes = {
  previewUrl: PropTypes.string.isRequired,
  crop: PropTypes.object,
  setCrop: PropTypes.func.isRequired,
  setCompletedCrop: PropTypes.func.isRequired,
  aspect: PropTypes.number,
  applyAspect: PropTypes.func.isRequired,
  applyCrop: PropTypes.func.isRequired,
  canApply: PropTypes.bool.isRequired,
  cropSizeLabel: PropTypes.string,
  onImageLoad: PropTypes.func.isRequired,
  imgRef: PropTypes.shape({
    current: PropTypes.any
  }).isRequired,
  fitMode: PropTypes.oneOf(['fit', 'scroll']).isRequired,
  setFitMode: PropTypes.func.isRequired,
  imageSize: PropTypes.shape({
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired
  }).isRequired,
  imageAspect: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  cleanupResult: PropTypes.func.isRequired,
  aspectRatioOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number
    })
  ).isRequired
};

CropEditor.defaultProps = {
  crop: undefined,
  aspect: null,
  cropSizeLabel: ''
};