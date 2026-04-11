import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ResultViewerContent({
  originalImage,
  upscaledImage,
  onImageLoad,
  originalLabel = 'Original', 
  resultLabel = 'Result',  
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingText, setLoadingText] = useState('Downloading Results...');

  useEffect(() => {
    if (isLoaded) return undefined;

    const timeout = setTimeout(() => {
      setLoadingText('High-resolution file detected. Almost there...');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isLoaded]);

  const handleUpscaledLoad = () => {
    setIsLoaded(true);
    if (typeof onImageLoad === 'function') onImageLoad();
  };

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 px-4 text-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-bold text-slate-700 animate-pulse transition-all duration-300">
            {loadingText}
          </p>
        </div>
      )}

      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-700"
        style={{ opacity: isLoaded ? 1 : 0 }}
      >
        {/* ✅ FIX 2: BASE LAYER (Result Image + Result Label) */}
        {/* This sits on the bottom. When the slider moves left, it reveals this layer. */}
        <img
          src={upscaledImage}
          alt="Processed result"
          className="absolute top-0 left-0 w-full h-full object-cover"
          onLoad={handleUpscaledLoad}
          onError={() => setIsLoaded(false)}
        />
        <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded border border-slate-800 pointer-events-none uppercase tracking-wide shadow-sm">
          {resultLabel}
        </div>

        {/* ✅ FIX 2: TOP LAYER (Original Image + Original Label) */}
        {/* We moved the clipPath to a wrapper div so it slices BOTH the image AND the label! */}
        <div 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        >
          <img
            src={originalImage}
            alt="Original input"
            className="absolute top-0 left-0 w-full h-full object-cover pointer-events-auto"
          />
          <div className="absolute top-3 left-3 bg-white/95 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-300 pointer-events-none uppercase tracking-wide shadow-sm">
            {originalLabel}
          </div>
        </div>

        {/* Slider Line & Handle */}
        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300 pointer-events-none z-30"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M9 18l-6-6 6-6" />
              <path d="M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>

        {/* Slider Input */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-40"
        />
      </div>
    </div>
  );
}

ResultViewerContent.propTypes = {
  originalImage: PropTypes.string.isRequired,
  upscaledImage: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func,
  originalLabel: PropTypes.string,
  resultLabel: PropTypes.string,
};

export default function ResultViewer(props) {
  return <ResultViewerContent key={props.upscaledImage} {...props} />;
}

ResultViewer.propTypes = { ...ResultViewerContent.propTypes };