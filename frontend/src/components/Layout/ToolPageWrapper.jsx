import PropTypes from 'prop-types';

/**
 * Standard layout wrapper for tool pages to enforce consistent dimensions and spacing.
 * @param {Object} props - Component properties.
 * @param {React.ReactNode} props.children - The inner content to wrap.
 * @returns {JSX.Element} The ToolPageWrapper component.
 */
export default function ToolPageWrapper({ children }) {
  return (
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      {children}
    </section>
  );
}

ToolPageWrapper.propTypes = {
  children: PropTypes.node.isRequired,
};