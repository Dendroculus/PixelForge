import { MAX_DIMENSION } from '../../../hooks/workspace/useImageResize';
import PropTypes from 'prop-types';

const RESIZE_PRESETS = [
  { label: 'IG Square', width: 1080, height: 1080 },
  { label: 'IG Story / TikTok', width: 1080, height: 1920 },
  { label: 'Social Post', width: 1200, height: 630 },
  { label: 'Full HD (1080p)', width: 1920, height: 1080 },
  { label: 'HD (720p)', width: 1280, height: 720 },
  { label: 'Standard SD', width: 640, height: 480 },
];

/**
 * @param {Object} props
 * @param {number} props.origWidth
 * @param {number} props.origHeight
 * @param {string|number} props.targetWidth
 * @param {string|number} props.targetHeight
 * @param {boolean} props.lockAspect
 * @param {Function} props.onWidthChange
 * @param {Function} props.onHeightChange
 * @param {Function} props.onToggleLock
 * @param {Function} props.onApplyPreset
 * @param {boolean} props.disabled
 */
export default function ResizeControls({
  origWidth,
  origHeight,
  targetWidth,
  targetHeight,
  lockAspect,
  onWidthChange,
  onHeightChange,
  onToggleLock,
  onApplyPreset,
  disabled
}) {
  return (
    <div className={`space-y-6 transition-opacity duration-300 ${disabled ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
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
              onChange={onWidthChange}
              min="1"
              max={MAX_DIMENSION}
              placeholder="Width"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">px</span>
          </div>

          <button
            onClick={onToggleLock}
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
              onChange={onHeightChange}
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
                  onClick={() => onApplyPreset(preset.width, preset.height)}
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
  );
}

ResizeControls.propTypes = {
  origWidth: PropTypes.number.isRequired,
  origHeight: PropTypes.number.isRequired,
  targetWidth: PropTypes.string.isRequired,
  targetHeight: PropTypes.string.isRequired,
  lockAspect: PropTypes.bool.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  canProcess: PropTypes.bool.isRequired,
  previewRatio: PropTypes.number.isRequired,
  onWidthChange: PropTypes.func.isRequired,
  onHeightChange: PropTypes.func.isRequired,
  onToggleLock: PropTypes.func.isRequired,
  onApplyPreset: PropTypes.func.isRequired,
  onApplyResize: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};