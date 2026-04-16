import PropTypes from 'prop-types';

/**
 * Renders reusable back button.
 * @param {Object} props - The component props.
 * @param {Function} props.onClick - Callback function triggered when the back button is clicked.
 * @returns {JSX.Element}
 */
export default function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all"
      style={{ color: 'rgba(124,58,237,0.7)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'rgba(109,40,217,1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'rgba(124,58,237,0.7)';
      }}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

BackButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};