import PropTypes from 'prop-types';
import CountdownTimer from '@/components/Common/CountdownTimer';

/**
 * Displays a limit reached message or a loading state for AI workspace features.
 * @param {Object} props - The component props.
 * @param {boolean} props.showLoading - Whether to show the initial loading spinner.
 * @param {boolean} props.showLimit - Whether to show the daily limit reached card.
 * @param {number} props.maxLimit - The maximum allowed uses per day.
 * @param {number} [props.resetTimestamp] - Unix timestamp for when the limit resets.
 * @param {string} props.featureText - Descriptive text of the limited feature (e.g., "AI upscales").
 * @returns {JSX.Element|null}
 */
export default function WorkspaceLimitCard({
  showLoading,
  showLimit,
  maxLimit,
  resetTimestamp,
  featureText,
}) {
  if (showLoading) {
    return (
      <div className="w-full min-h-96 rounded-3xl border border-white/70 bg-white/50 backdrop-blur-xl shadow-xl shadow-indigo-500/5 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showLimit) {
    return (
      <div className="bg-rose-50/90 backdrop-blur-2xl p-10 sm:p-14 rounded-3xl border border-rose-200 shadow-xl text-center flex flex-col items-center justify-center max-w-2xl mx-auto transition-all duration-500">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-rose-100 text-rose-500">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">
          Daily Limit Reached
        </h3>
        <p className="text-slate-600 font-medium mb-8 max-w-md">
          You&apos;ve used all {maxLimit} free {featureText} today. This keeps
          our potato server alive for everyone!
        </p>
        <div className="bg-white/80 px-8 py-4 rounded-2xl border border-rose-100 shadow-sm w-full max-w-sm">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">
            You can use this again in
          </span>
          <div className="text-3xl font-black text-rose-600 font-mono tracking-tight mt-1">
            <CountdownTimer targetTimestamp={resetTimestamp} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

WorkspaceLimitCard.propTypes = {
  showLoading: PropTypes.bool.isRequired,
  showLimit: PropTypes.bool.isRequired,
  maxLimit: PropTypes.number.isRequired,
  resetTimestamp: PropTypes.number,
  featureText: PropTypes.string.isRequired,
};
