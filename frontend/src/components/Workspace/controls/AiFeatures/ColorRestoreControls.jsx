import PropTypes from 'prop-types';
import BaseToolControls from './BaseToolControls';

/**
 * Renders the action controls and progress bar specifically for the Color Restoration tool.
 * @param {Object} props - The component props.
 * @param {boolean} props.isProcessing - Whether the tool is currently processing.
 * @param {boolean} props.isWaitingForToken - Whether Turnstile is actively fetching a token.
 * @param {string|null} props.resultUrl - The URL of the completed result.
 * @param {number} props.progress - The current percentage (0-100) of the background job.
 * @param {string|null} props.jobId - The current active background job ID.
 * @param {Function} props.handleCancel - Callback to cancel the job or reset the workspace.
 * @param {Function} props.handleProcess - Callback to initiate the color restoration job.
 * @param {React.MutableRefObject} props.turnstileRef - Ref attached to the Turnstile wrapper.
 * @param {Function} props.setTurnstileToken - Callback to update the Turnstile validation token.
 * @returns {JSX.Element}
 */
export default function ColorRestoreControls(props) {
  const getProgressText = () => {
    if (props.progress < 30) return 'Uploading to Cloud GPUs...';
    if (props.progress < 50) return 'Detecting luminance and contrast...';
    if (props.progress < 70) return 'Running DDColor model...';
    if (props.progress < 90) return 'Blending realistic color tones...';
    if (props.progress < 99) return 'Refining final color output...';
    return 'Finalizing download...';
  };

  return (
    <BaseToolControls
      {...props}
      progressText={getProgressText()}
      submitText="Restore Color"
    />
  );
}

ColorRestoreControls.propTypes = {
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