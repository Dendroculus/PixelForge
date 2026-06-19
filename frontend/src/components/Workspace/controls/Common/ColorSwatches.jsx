import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {string[]} props.colors - Array of hex color strings
 * @param {string} props.selectedColor - Currently selected hex color
 * @param {Function} props.onColorChange - Color change handler
 * @returns {JSX.Element}
 */
export default function ColorSwatches({ colors, selectedColor, onColorChange }) {
  const isCustomColor = !colors.includes(selectedColor);

  return (
    <div>
      <h3 className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">
        Text Color
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={`h-7 w-7 shrink-0 rounded-full shadow-sm transition-all ${selectedColor === color ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border border-slate-200 hover:scale-105'}`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}

        <div
          className={`relative h-7 w-7 shrink-0 rounded-full shadow-sm transition-all flex items-center justify-center cursor-pointer ${isCustomColor ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105 border border-slate-200'}`}
          style={{ background: isCustomColor ? 'linear-gradient(to top right, #fb7185, #d946ef, #6366f1)' : selectedColor }}
          title="Custom color"
        >
          <input
            aria-label="Custom text color"
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    </div>
  );
}

ColorSwatches.propTypes = {
  colors: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedColor: PropTypes.string.isRequired,
  onColorChange: PropTypes.func.isRequired,
};