import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {number} props.paletteCount
 * @param {number} props.paletteVariation
 * @param {Function} props.onCountChange
 * @param {Function} props.onVariationChange
 * @param {boolean} props.disabled
 */
export default function ColorPaletteControls({
  paletteCount,
  paletteVariation,
  onCountChange,
  onVariationChange,
  disabled
}) {
  return (
    <>
      <div className={`mb-4 flex flex-col justify-center transition-opacity ${disabled ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
        <label className="mb-4 flex w-full items-center justify-between text-left text-sm font-bold text-slate-700">
          <span>Colors to Extract</span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">{paletteCount}</span>
        </label>
        <div className="px-1 pt-1">
          <input
            type="range"
            min="3"
            max="10"
            step="1"
            value={paletteCount}
            onChange={onCountChange}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
          />
          <div className="mt-2 flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Basic</span>
            <span>Detailed</span>
          </div>
        </div>
      </div>

      <div className={`mb-6 flex flex-col justify-center transition-opacity ${disabled ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
        <label className="mb-4 flex w-full items-center justify-between text-left text-sm font-bold text-slate-700">
          <span>Picked palettes</span>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-600">{paletteVariation}</span>
        </label>
        <div className="px-1 pt-1">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={paletteVariation}
            onChange={onVariationChange}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
          />
        </div>
      </div>
    </>
  );
}

ColorPaletteControls.propTypes = {
  paletteCount: PropTypes.number.isRequired,
  paletteVariation: PropTypes.number.isRequired,
  onCountChange: PropTypes.func.isRequired,
  onVariationChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};