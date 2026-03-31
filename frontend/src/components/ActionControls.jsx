import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';

export default function ActionControls({ 
  jobId,
  modelType, 
  setModelType, 
  isProcessing, 
  handleCancel, 
  handleUpscale,
  turnstileRef,
  setTurnstileToken,
}) {
  /**
   * Provides model selection, action controls, and bot verification state handling.
   */
  const isSubmitDisabled = isProcessing || !!jobId;

  const renderButtonContent = () => {
    if (isProcessing || jobId) return "Processing...";
    return "Upscale Image";
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
      
      <div>
        <Turnstile
          ref={turnstileRef}
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setTurnstileToken(token)}
          onError={() => console.error("Turnstile failed to initialize or verify.")}
        />
      </div>

      <select 
        value={modelType}
        onChange={(e) => setModelType(e.target.value)}
        disabled={isProcessing}
        className="bg-white/60 backdrop-blur-sm border border-white text-slate-800 font-medium text-sm rounded-lg focus:ring-slate-400 focus:border-slate-400 block px-3 py-2.5 disabled:opacity-50 outline-none shadow-sm"
      >
        <option value="general">General Model</option>
        <option value="anime">Anime / Art Model</option>
      </select>

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
  modelType: PropTypes.string.isRequired,
  setModelType: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  handleCancel: PropTypes.func.isRequired,
  handleUpscale: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
};