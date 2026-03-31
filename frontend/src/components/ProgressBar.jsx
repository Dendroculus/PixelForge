import PropTypes from 'prop-types';

function getStatusLabel(progress) {
  if (progress === 0) return "Verifying secure connection, don't refresh...";
  if (progress < 15) return "Preparing image payload...";
  if (progress < 30) return "Uploading to Cloud GPUs...";
  if (progress < 50) return "Analyzing pixel structures...";
  if (progress < 70) return "Running Real-ESRGAN model...";
  if (progress < 90) return "Reconstructing fine details...";
  if (progress < 99) return "Polishing final 4K output...";
  return "Finalizing download...";
}
export default function ProgressBar({ progress }) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-bold text-slate-700 px-1">
        <span>{getStatusLabel(progress)}</span>
        <span>{Math.round(progress)}%</span>
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
};