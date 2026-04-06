import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function ResultViewerContent({ originalImage, upscaledImage, onImageLoad }) {
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
    if (typeof onImageLoad === 'function') {
      onImageLoad();
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
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
        <img
          src={upscaledImage}
          alt="Upscaled result"
          className="absolute top-0 left-0 w-full h-full object-contain"
          onLoad={handleUpscaledLoad}
          onError={() => setIsLoaded(false)}
        />

        <img
          src={originalImage}
          alt="Original input"
          className="absolute top-0 left-0 w-full h-full object-contain"
          style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
        />

        <div
          className="absolute top-0 bottom-0 w-px bg-slate-300 pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-200">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
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
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-ew-resize m-0 z-10"
        />

        <div className="absolute top-3 left-3 bg-white/90 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 pointer-events-none z-0 uppercase tracking-wide shadow-sm">
          Original
        </div>
        <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-[10px] font-medium px-2 py-0.5 rounded border border-slate-800 pointer-events-none z-0 uppercase tracking-wide shadow-sm">
          Upscaled
        </div>
      </div>
    </div>
  );
}

ResultViewerContent.propTypes = {
  originalImage: PropTypes.string.isRequired,
  upscaledImage: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func,
};

ResultViewerContent.defaultProps = {
  onImageLoad: undefined,
};

export default function ResultViewer({ originalImage, upscaledImage, onImageLoad }) {
  return (
    <ResultViewerContent
      key={upscaledImage}
      originalImage={originalImage}
      upscaledImage={upscaledImage}
      onImageLoad={onImageLoad}
    />
  );
}

ResultViewer.propTypes = {
  originalImage: PropTypes.string.isRequired,
  upscaledImage: PropTypes.string.isRequired,
  onImageLoad: PropTypes.func,
};

ResultViewer.defaultProps = {
  onImageLoad: undefined,
};