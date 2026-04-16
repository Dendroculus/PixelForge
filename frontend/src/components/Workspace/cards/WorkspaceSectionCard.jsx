import PropTypes from 'prop-types';

/**
 * Provides a reusable section card container preserving existing workspace visual style.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The content to wrap inside the card.
 * @param {string} [props.className=''] - Additional Tailwind CSS classes.
 * @returns {JSX.Element}
 */
export default function WorkspaceSectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white/50 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/60 ${className}`}>
      {children}
    </div>
  );
}

WorkspaceSectionCard.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};