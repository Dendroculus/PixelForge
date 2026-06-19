import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {number|null|undefined} props.aspect
 * @param {Function} props.onApplyAspect
 * @param {Array<{label: string, value: number|null}>} props.options
 * @returns {JSX.Element}
 */
export default function AspectRatioControls({ aspect, onApplyAspect, options }) {
  return (
    <div className="flex-none bg-slate-900 border-t border-slate-800 p-4 sm:p-5 overflow-x-auto z-10">
      <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-max mx-auto px-2">
        {options.map((option) => {
          const isSelected = aspect === option.value;
          return (
            <button
              key={option.label}
              onClick={() => onApplyAspect(option.value)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

AspectRatioControls.propTypes = {
  aspect: PropTypes.number,
  onApplyAspect: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number,
    })
  ).isRequired,
};

AspectRatioControls.defaultProps = {
  aspect: null,
};