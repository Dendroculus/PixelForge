import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';
import ProgressBar from '../../Common/ProgressBar';
import ActionControls from './ActionControls';

/**
 * Renders Upscale feature controls with Turnstile integration and background processing feedback.
 * @param {Object} props - The component props.
 * @param {boolean} props.isProcessing - Whether the tool is actively sending or polling a job.
 * @param {boolean} props.isWaitingForToken - Whether Turnstile is actively fetching a token.
 * @param {string|null} props.resultUrl - The object URL of the completed upscaled image.
 * @param {number} props.progress - The current percentage (0-100) of the upscale job.
 * @param {string|null} props.jobId - The current active background job ID.
 * @param {Function} props.handleCancel - Callback to cancel the job or reset the workspace.
 * @param {Function} props.handleUpscale - Callback to initiate the ESRGAN upscaling job.
 * @param {React.MutableRefObject} props.turnstileRef - Ref attached to the Turnstile wrapper.
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
    <>
      <div style={{ position: 'absolute', left: '-99999px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
        />
      </div>

      {(isProcessing || isWaitingForToken) && (
        <div className="w-full py-1">
          <ProgressBar
            progress={progress}
            customText={isWaitingForToken ? "Verifying secure connection, don't refresh..." : undefined}
          />
        </div>
      )}

      {!isProcessing && !isWaitingForToken && !resultUrl && (
        <div className="flex flex-col gap-4">
          <ActionControls
            jobId={jobId}
            isProcessing={isProcessing}
            handleCancel={handleCancel}
            handleUpscale={handleUpscale}
            turnstileRef={turnstileRef}
            setTurnstileToken={setTurnstileToken}
            scale={scale}
            setScale={setScale}
          />
        </div>
      )}
    </>
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