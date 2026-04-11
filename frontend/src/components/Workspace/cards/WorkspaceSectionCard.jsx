/**
 * Provides a reusable section card container preserving existing workspace visual style.
 * @param {{
 *   children: React.ReactNode,
 *   className?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function WorkspaceSectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white/50 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/60 ${className}`}>
      {children}
    </div>
  );
}