import PropTypes from 'prop-types';

/**
 * Icon container component used for card visual indicators.
 *
 * @param {Object} props - Component props.
 * @param {string} props.d - SVG path data for the icon.
 * @param {boolean} [props.isAi=false] - Whether to apply AI themed styling.
 *
 * @returns {JSX.Element} Styled icon container.
 */
export default function CardIcon({ d, isAi = false }) {
  const bgClass = isAi
    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20'
    : 'bg-white/80 border border-slate-200/60 shadow-sm';
  const colorClass = isAi ? 'text-white' : 'text-slate-700';

  return (
    <div
      className={`w-14 h-14 min-w-14 rounded-2xl flex items-center justify-center ${bgClass} ${colorClass} group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );
}

CardIcon.propTypes = {
  d: PropTypes.string.isRequired,
  isAi: PropTypes.bool,
};