import PropTypes from 'prop-types';

/**
 * A reusable toggle button to switch between image display modes (e.g., Fit vs Fill).
 * @param {Object} props - The component props.
 * @param {boolean} props.isFitMode - Whether the current active mode is 'fit/contain'.
 * @param {Function} props.onToggle - Callback fired when the button is clicked.
 * @param {string} [props.className] - Custom Tailwind CSS classes to override the default styling.
 * @param {string} [props.fitTitle='Fit to Screen'] - Tooltip text when hovering over the fit icon.
 * @param {string} [props.fillTitle='Fill Container'] - Tooltip text when hovering over the fill icon.
 * @returns {JSX.Element}
 */
export default function FitModeToggle({
  isFitMode,
  onToggle,
  className = "p-2 bg-white/90 backdrop-blur rounded-lg border border-slate-200 shadow-sm text-slate-600 hover:text-indigo-600 hover:bg-white transition-colors",
  fitTitle = "Fit to Screen",
  fillTitle = "Fill Container"
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={className}
      title={isFitMode ? fillTitle : fitTitle}
    >
      {isFitMode ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4v4H4m4-4L3 3m13 1v4h4m-4-4l5-5m-5 13v4h-4m4-4l5 5M8 20v-4H4m4 4l-5 5" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  );
}

FitModeToggle.propTypes = {
  isFitMode: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string,
  fitTitle: PropTypes.string,
  fillTitle: PropTypes.string,
};