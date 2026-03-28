import PropTypes from 'prop-types';
import { Turnstile } from '@marsidev/react-turnstile';

/**
 * Provides model selection, action controls, and bot protection verification.
 */
export default function ActionControls({ 
  modelType, 
  setModelType, 
  isProcessing, 
  handleCancel, 
  handleUpscale,
  turnstileRef,
  setTurnstileToken,
  turnstileToken
}) {
  
  const isSubmitDisabled = isProcessing || !turnstileToken;

  const renderButtonContent = () => {
    if (isProcessing) return "Processing...";
    
    if (!turnstileToken) {
      return (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Verifying...
        </span>
      );
    }

    return "Upscale Image";
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
      
      {/* 
        CRITICAL: Turnstile must not be display: none. 
        If you want an invisible challenge, configure it in the Cloudflare dashboard.
      */}
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
  modelType: PropTypes.string.isRequired,
  setModelType: PropTypes.func.isRequired,
  isProcessing: PropTypes.bool.isRequired,
  handleCancel: PropTypes.func.isRequired,
  handleUpscale: PropTypes.func.isRequired,
  turnstileRef: PropTypes.object.isRequired,
  setTurnstileToken: PropTypes.func.isRequired,
  turnstileToken: PropTypes.string,
};