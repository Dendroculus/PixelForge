import PropTypes from 'prop-types';

/**
 * Renders the palette style toggle buttons.
 * @param {{
 * paletteStyle: 'square' | 'circle',
 * setPaletteStyle: (value: 'square' | 'circle') => void
 * }} props
 * @returns {JSX.Element}
 */
export default function PaletteStyleToggle({ paletteStyle, setPaletteStyle }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
      <button
        type="button"
        onClick={() => setPaletteStyle('square')}
        className={`px-2.5 py-1 rounded-md transition ${
          paletteStyle === 'square'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Square
      </button>
      <button
        type="button"
        onClick={() => setPaletteStyle('circle')}
        className={`px-2.5 py-1 rounded-md transition ${
          paletteStyle === 'circle'
            ? 'bg-indigo-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        Circle
      </button>
    </div>
  );
}

PaletteStyleToggle.propTypes = {
  paletteStyle: PropTypes.oneOf(['square', 'circle']).isRequired,
  setPaletteStyle: PropTypes.func.isRequired,
};