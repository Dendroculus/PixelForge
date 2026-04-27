import PropTypes from 'prop-types';

/**
 * Renders the primary action buttons, scale selection, and Turnstile integration for upscaling.
 * @param {Object} props - The component props.
 * @param {string|null} props.jobId - The current active job ID if processing.
 * @param {boolean} props.isProcessing - Whether a job is currently actively processing.
 * @param {Function} props.handleCancel - Callback to cancel the current job or clear workspace.
 * @param {Function} props.handleUpscale - Callback to trigger the upscale process.
 * @param {React.MutableRefObject} props.turnstileRef - Ref attached to the Turnstile component.
 * @param {Function} props.setTurnstileToken - Callback to update the Turnstile security token.
 * @param {number} props.scale - The currently selected scale multiplier (1, 2, 3, or 4).
 * @param {Function} props.setScale - Callback to update the selected scale multiplier.
 * @returns {JSX.Element}
 */
export default function ActionControls({
  jobId,
  isProcessing,
  handleCancel,
  handleUpscale,
  scale,
  setScale,
}) {
  const isSubmitDisabled = isProcessing || !!jobId;

  const renderButtonContent = () => {
    if (isProcessing || jobId) return 'Processing...';
    return 'Upscale Image';
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">

      <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-slate-200">
        {[1, 2, 3, 4].map((mult) => (
          <button
            key={mult}
            onClick={() => setScale(mult)}
            disabled={isSubmitDisabled}
            className={`px-3 py-1.5 text-sm font-bold rounded-md transition-colors ${
              scale === mult
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            {mult}x
          </button>
        ))}
      </div>

      <button
        onClick={handleCancel}
        disabled={isProcessing}
        className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        onClick={handleUpscale}
        disabled={isSubmitDisabled}
        className="flex items-center justify-center min-w-38.75 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all"
      >
        {renderButtonContent()}
      </button>
    </div>
  );
}

ActionControls.propTypes = {
  jobId: PropTypes.string,
  isProcessing: PropTypes.bool.isRequired,
  handleCancel: PropTypes.func.isRequired,
  handleUpscale: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
  scale: PropTypes.number.isRequired,
  setScale: PropTypes.func.isRequired,
};