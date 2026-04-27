import PropTypes from 'prop-types';
import BaseToolControls from './BaseToolControls';

/**
 * Renders Remove Background feature controls and localized progress tracking.
 * @param {Object} props - The component props.
 * @param {boolean} props.isProcessing - Whether the job is actively generating a mask.
 * @param {boolean} props.isWaitingForToken - Whether Turnstile is actively fetching a token.
 * @param {string|null} props.resultUrl - The object URL of the completed result.
 * @param {number} props.progress - The current percentage (0-100) of the background job.
 * @param {string|null} props.jobId - The current active background job ID.
 * @param {Function} props.handleCancel - Callback to cancel the job or reset the workspace.
 * @param {Function} props.handleProcess - Callback to initiate the background removal job.
 * @param {React.MutableRefObject} props.turnstileRef - Ref attached to the Turnstile wrapper.
 * @param {Function} props.setTurnstileToken - Callback to update the Turnstile validation token.
 * @returns {JSX.Element}
 */
export default function RemoveBgControls(props) {
  const getRemBGProgressText = () => {
    if (props.progress < 30) return 'Uploading to Cloud GPUs...';
    if (props.progress < 50) return 'Analyzing pixel structures...';
    if (props.progress < 70) return 'Running edge detection model...';
    if (props.progress < 90) return 'Generating transparency mask...';
    if (props.progress < 99) return 'Polishing final PNG output...';
    return 'Finalizing download...';
  };

  return (
    <BaseToolControls
      {...props}
      progressText={getRemBGProgressText()}
      submitText="Remove Background"
    />
  );
}

RemoveBgControls.propTypes = {
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