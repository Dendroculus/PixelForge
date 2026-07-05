/**
 * Reusable progress bar for AI and client-side processing flows.
 *
 * Converts numeric progress into an accessible visual indicator and optional
 * status text.
 */

import PropTypes from 'prop-types';

function getStatusLabel(progress) {
  if (progress < 30) return "Uploading to Cloud GPUs...";
  if (progress < 50) return "Analyzing pixel structures...";
  if (progress < 70) return "Running Real-ESRGAN model...";
  if (progress < 90) return "Reconstructing fine details...";
  if (progress < 99) return "Polishing final 4K output...";
  return "Finalizing download...";
}

/**
 * Render a horizontal progress indicator with optional status text.
 *
 * @returns {JSX.Element} Rendered UI.
 */
export default function ProgressBar({ progress, customText }) {
  const displayText = customText || getStatusLabel(progress);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-700 px-1">
        <span className="whitespace-nowrap">{displayText}</span>
        <span className="shrink-0">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-white/50 rounded-full h-2.5 border border-white/40 shadow-inner">
        <div 
          className="bg-slate-800 h-2.5 rounded-full transition-all duration-300 ease-out shadow-sm" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}

ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  customText: PropTypes.string, 
};