import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';
import ProgressBar from '../../Common/ProgressBar';

export default function ColorRestoreControls({
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
  const getProgressText = () => {
    if (isWaitingForToken) return "Verifying secure connection, don't refresh...";
    if (progress < 30) return 'Uploading to Cloud GPUs...';
    if (progress < 50) return 'Detecting luminance and contrast...';
    if (progress < 70) return 'Running DDColor model...';
    if (progress < 90) return 'Blending realistic color tones...';
    if (progress < 99) return 'Refining final color output...';
    return 'Finalizing download...';
  };

  return (
    <>
      {(isProcessing || isWaitingForToken) && (
        <div className="w-full py-1">
          <ProgressBar progress={progress} customText={getProgressText()} />
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
                Restore Color
              </button>
            </div>
          )}
        </div>
      )}
    </>
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