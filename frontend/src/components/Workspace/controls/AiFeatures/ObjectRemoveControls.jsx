/**
 * Control panel for the Object Remover AI workflow.
 *
 * Renders the action buttons, progress state, Turnstile widget mount point, and
 * cancel/process controls used by the object removal page.
 */

import PropTypes from 'prop-types';
import BaseToolControls from './BaseToolControls';

/**
 * Render Object Remover action controls and progress feedback.
 *
 * @returns {JSX.Element} Rendered UI.
 */
export default function ObjectRemoveControls(props) {
  const getProgressText = () => {
    if (props.progress < 30) return 'Uploading image and mask...';
    if (props.progress < 50) return 'Reading selected object area...';
    if (props.progress < 70) return 'Running object removal model...';
    if (props.progress < 90) return 'Reconstructing background pixels...';
    if (props.progress < 99) return 'Polishing final image...';
    return 'Finalizing download...';
  };

  return (
    <BaseToolControls
      {...props}
      progressText={getProgressText()}
      submitText="Remove Object"
    />
  );
}

ObjectRemoveControls.propTypes = {
  isProcessing: PropTypes.bool.isRequired,
  isWaitingForToken: PropTypes.bool.isRequired,
  resultUrl: PropTypes.string,
  progress: PropTypes.number.isRequired,
  jobId: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
  handleProcess: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
};