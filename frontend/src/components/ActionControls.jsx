import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';

const SCALE_OPTIONS = [1, 2, 3, 4];

export default function ActionControls({
  jobId,
  isProcessing,
  handleCancel,
  handleUpscale,
  turnstileRef,
  setTurnstileToken,
  scale,
  setScale,
}) {
  const isSubmitDisabled = isProcessing || !!jobId;

  const renderButtonContent = () => {
    if (isProcessing || jobId) return 'Processing...';
    return 'Upscale Image';
  };

  const safeScale = Number.isInteger(scale) && scale >= 1 && scale <= 4 ? scale : 2;

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

      <div className="flex items-center rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
        {SCALE_OPTIONS.map((opt) => {
          const active = safeScale === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => !isProcessing && setScale(opt)}
              disabled={isProcessing}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                active
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-700 hover:bg-slate-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={active}
              aria-label={`Set upscale to ${opt}x`}
            >
              {opt}x
            </button>
          );
        })}
      </div>

      <button
        onClick={handleCancel}
        disabled={isProcessing}
        className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
      >
        Cancel
      </button>

      <button
        onClick={() => handleUpscale(safeScale)}
        disabled={isSubmitDisabled}
        className="flex items-center justify-center min-w-[155px] px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
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
  scale: PropTypes.number,
  setScale: PropTypes.func.isRequired,
};