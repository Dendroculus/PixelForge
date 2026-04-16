import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Core two-column layout component with staggered framer-motion entry animations.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.leftPanel - The entire content for the left column.
 * @param {React.ReactNode} props.rightPanel - The entire content for the right column.
 * @param {string} [props.minHeight='min-h-96'] - Minimum height CSS class for the container.
 * @returns {JSX.Element}
 */
export default function WorkspaceLayout({ leftPanel, rightPanel, minHeight = 'min-h-96' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`w-full ${minHeight} rounded-3xl border border-white/70 bg-white/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/40 flex-1 w-full">
        <div className="p-8 md:p-10 flex flex-col gap-6 bg-transparent">
          {leftPanel}
        </div>
        <div className="p-8 md:p-9 flex flex-col bg-white/20">
          {rightPanel}
        </div>
      </div>
    </motion.div>
  );
}

WorkspaceLayout.propTypes = {
  leftPanel: PropTypes.node.isRequired,
  rightPanel: PropTypes.node.isRequired,
  minHeight: PropTypes.string,
};