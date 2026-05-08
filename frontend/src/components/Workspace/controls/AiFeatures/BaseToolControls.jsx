import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';
import ProgressBar from '../../../Common/ProgressBar';

/**
 * Renders a generic tool controls component with Turnstile integration and background processing feedback.
 * @param {Object} props - The component props.
 * @param {boolean} props.isProcessing - Whether the tool is actively sending or polling a job.
 * @param {boolean} props.isWaitingForToken - Whether Turnstile is actively fetching a token.
 * @param {string|null} props.resultUrl - The object URL of the completed processed image.
 * @param {number} props.progress - The current percentage (0-100) of the processing job.
 * @param {string|null} props.jobId - The current active background job ID.
 * @param {Function} props.handleCancel - Callback to cancel the job or reset the workspace.
 * @param {Function} [props.handleProcess] - Callback to initiate standard tools.
 * @param {React.React.RefObject<HTMLDivElement>} props.turnstileRef - Ref attached to the Turnstile wrapper.
 * @param {Function} props.setTurnstileToken - Callback to update the Turnstile validation token.
 * @param {string} [props.progressText] - Custom text for the progress bar.
 * @param {string} [props.submitText] - Text for the standard submit button.
 * @param {boolean} [props.turnstileHidden] - Whether to render Turnstile out of view (e.g. Upscale).
 * @param {React.ReactNode} [props.children] - Used to inject custom button layouts.
 * @returns {JSX.Element}
 */
export default function BaseToolControls({
  isProcessing,
  isWaitingForToken,
  resultUrl,
  progress,
  jobId,
  handleCancel,
  handleProcess,
  turnstileRef,
  setTurnstileToken,
  progressText,
  submitText,
  turnstileHidden = false,
  children,
}) {
  const shouldHideTurnstile = turnstileHidden || isProcessing || !!resultUrl;

  return (
    <>
      <div 
        className={!shouldHideTurnstile ? "w-full flex justify-center -mb-1" : ""}
        style={shouldHideTurnstile ? { 
          position: 'absolute', 
          opacity: 0.01,
          width: '50px', 
          height: '50px', 
          pointerEvents: 'none', 
          zIndex: -1,
          overflow: 'hidden' 
        } : {}}
      >
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={setTurnstileToken}
        />
      </div>

      {(isProcessing || isWaitingForToken) && (
        <div className="w-full flex flex-col items-center justify-center">
          <ProgressBar
            progress={progress}
            customText={isWaitingForToken ? "Verifying connection..." : progressText}
          />
        </div>
      )}

      {!isProcessing && !resultUrl && (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
          {!isWaitingForToken && (
              children || (
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
                  {submitText}
                </button>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}

BaseToolControls.propTypes = {
  isProcessing: PropTypes.bool.isRequired,
  isWaitingForToken: PropTypes.bool.isRequired,
  resultUrl: PropTypes.string,
  progress: PropTypes.number.isRequired,
  jobId: PropTypes.string,
  handleCancel: PropTypes.func.isRequired,
  handleProcess: PropTypes.func,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
  progressText: PropTypes.string,
  submitText: PropTypes.string,
  turnstileHidden: PropTypes.bool,
  children: PropTypes.node,
};