import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {boolean} props.isBold - Active state for bold
 * @param {boolean} props.isItalic - Active state for italic
 * @param {boolean} props.isUnderline - Active state for underline
 * @param {Function} props.onToggle - Handler passing the style key ('b', 'i', 'u')
 * @returns {JSX.Element}
 */
export default function TextStyleToggles({ isBold, isItalic, isUnderline, onToggle }) {
  const getBtnClass = (isActive) => 
    `rounded-md text-sm transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <div className="grid h-9 grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onToggle('b'); }}
        className={`${getBtnClass(isBold)} font-bold`}
      >
        B
      </button>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onToggle('i'); }}
        className={getBtnClass(isItalic)}
      >
        <span className="italic">I</span>
      </button>
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); onToggle('u'); }}
        className={getBtnClass(isUnderline)}
      >
        <span className="underline">U</span>
      </button>
    </div>
  );
}

TextStyleToggles.propTypes = {
  isBold: PropTypes.bool,
  isItalic: PropTypes.bool,
  isUnderline: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};