import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';
import ProgressBar from '../../Common/ProgressBar';
import ActionControls from './ActionControls';

/**
 * Renders Upscale feature controls without altering existing UI behavior.
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