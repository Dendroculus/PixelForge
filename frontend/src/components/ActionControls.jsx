import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ActionControls({
  jobId,
  isProcessing,
  handleCancel,
  handleUpscale,
  turnstileRef,
  setTurnstileToken,
}) {
  const isSubmitDisabled = isProcessing || !!jobId;

  const renderButtonContent = () => {
    if (isProcessing || jobId) return 'Processing...';
    return 'Upscale Image';
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
      <div>
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setTurnstileToken(token)}
          onError={() => console.error('Turnstile failed to initialize or verify.')}
        />
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
        className="flex items-center justify-center min-w-[155px] px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all"
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
};