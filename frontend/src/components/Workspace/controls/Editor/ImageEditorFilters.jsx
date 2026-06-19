/**
 * @module ImageEditorFilters
 * @description Provides the control panels for adjusting image filters in the Image Editor.
 */

import PropTypes from 'prop-types';

/**
 * Renders the filter adjustment sliders for Light & Color and Effects & Tone.
 *
 * @param {Object} props - Component properties.
 * @param {Object} props.filters - The current state of all image filters.
 * @param {number} props.filters.brightness - Brightness adjustment (-100 to 100).
 * @param {number} props.filters.contrast - Contrast adjustment (-100 to 100).
 * @param {number} props.filters.saturation - Saturation adjustment (-100 to 100).
 * @param {number} props.filters.temperature - Color temperature adjustment (-100 to 100).
 * @param {number} props.filters.fade - Fade effect intensity (0 to 100).
 * @param {number} props.filters.vignette - Vignette effect intensity (0 to 100).
 * @param {number} props.filters.blur - Blur radius in pixels (0 to 20).
 * @param {function(string, number): void} props.onFilterChange - Callback triggered when a filter value changes.
 * @returns {JSX.Element}
 */
export default function ImageEditorFilters({ filters, onFilterChange }) {
  // Helper to format values with a leading '+' for positive numbers
  const formatValue = (val, suffix = '') => (val > 0 ? `+${val}${suffix}` : `${val}${suffix}`);

  return (
    <>
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="block text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Light & Color</h3>
        
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Brightness</span>
            <span>{formatValue(filters.brightness)}</span>
          </div>
          <input aria-label="Brightness" type="range" min="-100" max="100" value={filters.brightness} onChange={(e) => onFilterChange('brightness', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Contrast</span>
            <span>{formatValue(filters.contrast)}</span>
          </div>
          <input aria-label="Contrast" type="range" min="-100" max="100" value={filters.contrast} onChange={(e) => onFilterChange('contrast', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Saturation</span>
            <span>{formatValue(filters.saturation)}</span>
          </div>
          <input aria-label="Saturation" type="range" min="-100" max="100" value={filters.saturation} onChange={(e) => onFilterChange('saturation', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Temperature</span>
            <span>{formatValue(filters.temperature)}</span>
          </div>
          <input aria-label="Temperature" type="range" min="-100" max="100" value={filters.temperature} onChange={(e) => onFilterChange('temperature', Number(e.target.value))} className="w-full h-1.5 bg-linear-to-r from-blue-400 via-slate-200 to-orange-400 rounded-lg appearance-none cursor-pointer accent-slate-700" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="block text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Effects & Tone</h3>
        
        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Fade</span>
            <span>{filters.fade}</span>
          </div>
          <input aria-label="Fade" type="range" min="0" max="100" value={filters.fade} onChange={(e) => onFilterChange('fade', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Vignette</span>
            <span>{filters.vignette}</span>
          </div>
          <input aria-label="Vignette" type="range" min="0" max="100" value={filters.vignette} onChange={(e) => onFilterChange('vignette', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-1" aria-hidden="true">
            <span>Blur</span>
            <span>{filters.blur}px</span>
          </div>
          <input aria-label="Blur" type="range" min="0" max="20" step="0.5" value={filters.blur} onChange={(e) => onFilterChange('blur', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
        </div>
      </div>
    </>
  );
}

ImageEditorFilters.propTypes = {
  filters: PropTypes.shape({
    brightness: PropTypes.number.isRequired,
    contrast: PropTypes.number.isRequired,
    saturation: PropTypes.number.isRequired,
    temperature: PropTypes.number.isRequired,
    fade: PropTypes.number.isRequired,
    vignette: PropTypes.number.isRequired,
    blur: PropTypes.number.isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
};