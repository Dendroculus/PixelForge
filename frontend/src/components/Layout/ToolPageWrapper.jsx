/**
 * Standard layout wrapper for tool pages to enforce consistent dimensions and spacing.
 * @param {Object} props - Component properties.
 * @returns {JSX.Element} The ToolPageWrapper component.
 */
export default function ToolPageWrapper({ children }) {
  return (
    <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
      {children}
    </section>
  );
}