import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Inner content logic for the interactive before/after image comparison slider.
 * @param {Object} props - The component props.
 * @param {string} props.originalImage - Object URL of the baseline image.
 * @param {string} props.processedImage - Object URL of the output image.
 * @param {Function} [props.onImageLoad] - Callback when the processed image finishes rendering.
 * @param {string} [props.originalLabel='Original'] - Text badge for the left side.
 * @param {string} [props.resultLabel='Result'] - Text badge for the right side.
 * @returns {JSX.Element}
 */
function ResultViewerContent({
  originalImage,
  processedImage,
  onImageLoad,
  originalLabel = 'Original',
  resultLabel = 'Result',
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('Downloading Results...');
  const [fitMode, setFitMode] = useState('cover');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (isLoaded) return undefined;
    const timeout = setTimeout(() => {
      setLoadingText('High-resolution file detected. Almost there...');
    }, 3000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  const handleProcessedLoad = () => {
    setIsLoaded(true);
    if (typeof onImageLoad === 'function') onImageLoad();
  };

  const toggleFitMode = (e) => {
    e.stopPropagation();
    setFitMode((prev) => (prev === 'cover' ? 'contain' : 'cover'));
    setIsZoomed(false);
  };

  const toggleZoom = (e) => {
    e.stopPropagation();
    setIsZoomed((prev) => !prev);
    if (!isZoomed) {
      setMousePos({ x: 50, y: 50 });
    }
  };

  const handleMouseMove = (e) => {
    if (!isZoomed) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setMousePos({ x, y });
  };

  const fitClass = fitMode === 'cover' ? 'object-cover object-top' : 'object-contain bg-slate-100';

  return (
    <div
      role='presentation'
      className={`relative w-full h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center min-h-96 group ${isZoomed ? 'cursor-crosshair' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isZoomed && setMousePos({ x: 50, y: 50 })}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 px-4 text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-700 animate-pulse transition-all duration-300">
            {loadingText}
          </p>
        </div>
      )}

      <div
        className="relative w-full h-full transition-transform duration-75 ease-out"
        style={{
          opacity: isLoaded ? 1 : 0,
          transform: isZoomed ? 'scale(2.5)' : 'scale(1)',
          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
        }}
      >
        <img
          src={processedImage}
          alt="Processed result"
          className={`absolute inset-0 w-full h-full ${fitClass}`}
          onLoad={handleProcessedLoad}
          onError={() => setIsLoaded(false)}
        />

        <div
          className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded border border-slate-800 pointer-events-none uppercase tracking-wide shadow-sm z-20 transition-transform"
          style={{ 
            transform: isZoomed ? 'scale(0.4)' : 'scale(1)', 
            transformOrigin: 'top right'
          }}
        >
          {resultLabel}
        </div>

        <div
          className="absolute top-3 left-3 bg-white/95 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-300 pointer-events-none uppercase tracking-wide shadow-sm z-20 transition-transform"
          style={{ 
            transform: isZoomed ? 'scale(0.4)' : 'scale(1)', 
            transformOrigin: 'top left'
          }}
        >
          {originalLabel}
        </div>

        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img
            src={originalImage}
            alt="Original input"
            className={`absolute inset-0 w-full h-full pointer-events-auto ${fitClass}`}
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300 pointer-events-none z-30"
          style={{ left: `${sliderPosition}%` }}
        >
          <div
            className="absolute top-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-200 transition-transform"
            style={{ left: '0', marginLeft: '-14px', transform: isZoomed ? 'scale(0.4)' : 'scale(1)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M9 18l-6-6 6-6" />
              <path d="M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-40"
          aria-label="Adjust comparison position"
        />
      </div>

      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex gap-2">
        <button
          onClick={toggleFitMode}
          className="p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors"
          title={fitMode === 'cover' ? 'Show full image' : 'Fill container'}
        >
          {fitMode === 'cover' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v4H4m4-4L3 3m13 1v4h4m-4-4l5-5m-5 13v4h-4m4-4l5 5M8 20v-4H4m4 4l-5 5" />
            </svg>
          )}
        </button>
        <button
          onClick={toggleZoom}
          className={`p-2 backdrop-blur rounded-lg border shadow-sm transition-colors ${isZoomed ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white/90 border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white'}`}
          title={isZoomed ? 'Zoom out' : 'Zoom in'}
        >
          {isZoomed ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

ResultViewerContent.propTypes = {
  originalImage: PropTypes.string.isRequired,
  processedImage: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func,
  originalLabel: PropTypes.string,
  resultLabel: PropTypes.string,
};

/**
 * Wrapper for the result viewer that forces re-mounts when the processed image changes.
 * @param {Object} props - Inherits props from ResultViewerContent.
 * @returns {JSX.Element}
 */
export default function ResultViewer(props) {
  return <ResultViewerContent key={props.processedImage} {...props} />;
}

ResultViewer.propTypes = { ...ResultViewerContent.propTypes };