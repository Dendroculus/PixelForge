import PropTypes from 'prop-types';
import WorkspaceLayout from './WorkspaceLayout';

/**
 * Shell component that structures the left and right panels of a tool workspace.
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.leftHeader - The header content for the left panel.
 * @param {React.ReactNode} props.leftBody - The main body content for the left panel.
 * @param {React.ReactNode} props.leftFooter - The footer content for the left panel.
 * @param {React.ReactNode} props.rightHeader - The header content for the right panel.
 * @param {React.ReactNode} props.rightBody - The main body content for the right panel.
 * @param {string} [props.minHeight='min-h-96'] - Minimum height CSS class for the workspace.
 * @returns {JSX.Element}
 */
export default function ToolWorkspaceShell({
  leftHeader,
  leftBody,
  leftFooter,
  rightHeader,
  rightBody,
  minHeight = 'min-h-96',
}) {
  return (
    <WorkspaceLayout
      minHeight={minHeight}
      leftPanel={
        <div className="flex h-full flex-col">
          <div className="mb-4">{leftHeader}</div>
          <div className="flex-1 min-h-0">{leftBody}</div>
          <div className="mt-auto pt-2">{leftFooter}</div>
        </div>
      }
      rightPanel={
        <div className="flex h-full w-full flex-col">
          <div className="mb-4">{rightHeader}</div>
          <div className="relative flex min-h-72 flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/50 bg-white/30 p-2 shadow-inner">
            {rightBody}
          </div>
        </div>
      }
    />
  );
}

ToolWorkspaceShell.propTypes = {
  leftHeader: PropTypes.node.isRequired,
  leftBody: PropTypes.node.isRequired,
  leftFooter: PropTypes.node.isRequired,
  rightHeader: PropTypes.node.isRequired,
  rightBody: PropTypes.node.isRequired,
  minHeight: PropTypes.string,
};