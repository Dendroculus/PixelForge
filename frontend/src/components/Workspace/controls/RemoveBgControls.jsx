import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';
import ProgressBar from '../../Common/ProgressBar';

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
export default function RemoveBgControls({
  isProcessing,
  isWaitingForToken,
  resultUrl,
  progress,
  jobId,
  handleCancel,
  handleProcess,
  turnstileRef,
  setTurnstileToken,
}) {
  const getRemBGProgressText = () => {
    if (isWaitingForToken) return "Verifying secure connection, don't refresh...";
    if (progress < 30) return 'Uploading to Cloud GPUs...';
    if (progress < 50) return 'Analyzing pixel structures...';
    if (progress < 70) return 'Running edge detection model...';
    if (progress < 90) return 'Generating transparency mask...';
    if (progress < 99) return 'Polishing final PNG output...';
    return 'Finalizing download...';
  };

  return (
    <>
      {(isProcessing || isWaitingForToken) && (
        <div className="w-full py-1">
          <ProgressBar progress={progress} customText={getRemBGProgressText()} />
        </div>
      )}

      {!isProcessing && !resultUrl && (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          <div className="w-full flex justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
            />
          </div>

          {!isWaitingForToken && (
            <div className="flex gap-2 w-full">
              <button
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleProcess}
                disabled={!!jobId}
                className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
              >
                Remove Background
              </button>
            </div>
          )}
        </div>
      )}
    </>
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