import PropTypes from 'prop-types';
import BaseToolControls from './BaseToolControls';
import ScaleSelector from './ScaleSelector';

/**
 * Renders a generic tool controls component with Turnstile integration and background processing feedback.
 * @param {Object} props - The component props.
 * @param {boolean} props.isProcessing - Whether the tool is actively sending or polling a job.
 * @param {boolean} props.isWaitingForToken - Whether Turnstile is actively fetching a token.
 * @param {string|null} props.resultUrl - The object URL of the completed processed image.
 * @param {number} props.progress - The current percentage (0-100) of the processing job.
 * @param {string|null} props.jobId - The current active background job ID.
 * @param {Function} props.handleCancel - Callback to cancel the job or reset the workspace.
 * @param {Function} props.handleUpscale - Callback to initiate the ESRGAN upscaling job.
 * @param {React.React.RefObject<HTMLDivElement>} props.turnstileRef - Ref attached to the Turnstile wrapper.
 * @param {Function} props.setTurnstileToken - Callback to update the Turnstile validation token.
 * @param {number} props.scale - The chosen upscale multiplier (1, 2, 3, or 4).
 * @param {Function} props.setScale - Callback to update the chosen upscale multiplier.
 * @returns {JSX.Element}
 */
export default function UpscaleControls({
  isProcessing,
  isWaitingForToken,
  resultUrl,
  progress,
  jobId,
  handleCancel,
  handleUpscale,
  turnstileRef,
  setTurnstileToken,
  scale,
  setScale,
}) {
  return (
    <BaseToolControls
      isProcessing={isProcessing}
      isWaitingForToken={isWaitingForToken}
      resultUrl={resultUrl}
      progress={progress}
      jobId={jobId}
      handleCancel={handleCancel}
      turnstileRef={turnstileRef}
      setTurnstileToken={setTurnstileToken}
      turnstileHidden={true}
    >
      <ScaleSelector
        jobId={jobId}
        isProcessing={isProcessing}
        handleCancel={handleCancel}
        handleUpscale={handleUpscale}
        scale={scale}
        setScale={setScale}
      />
    </BaseToolControls>
  );
}

UpscaleControls.propTypes = {
  isProcessing: PropTypes.bool.isRequired,
  isWaitingForToken: PropTypes.bool.isRequired,
  resultUrl: PropTypes.string,
  progress: PropTypes.number.isRequired,
  jobId: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
  handleUpscale: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
  scale: PropTypes.number.isRequired,
  setScale: PropTypes.func.isRequired,
};