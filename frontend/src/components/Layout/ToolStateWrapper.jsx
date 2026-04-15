import PropTypes from 'prop-types';
import UploadDropzone from '../../components/Upload/UploadDropzone';

export default function ToolStateWrapper({
  file,
  error,
  isProcessing,
  processingText = "Processing...",
  onFileSelect,
  onReset,
  children
}) {
  if (!file) {
    return (
      <div className="bg-white/40 backdrop-blur-2xl p-2 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-2xl mx-auto">
        <UploadDropzone onFileSelect={onFileSelect} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/50 backdrop-blur-2xl p-8 rounded-2xl shadow-xl border border-rose-100/60 max-w-2xl mx-auto text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-rose-200">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
           </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h3>
        <p className="text-rose-600 font-medium mb-6">{error}</p>
        <button onClick={onReset} className="px-8 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm">
           Try Again
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="bg-white/40 backdrop-blur-2xl p-12 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-md mx-auto flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-bold animate-pulse">{processingText}</p>
      </div>
    );
  }

  return children;
}

ToolStateWrapper.propTypes = {
  file: PropTypes.object,
  error: PropTypes.string,
  isProcessing: PropTypes.bool,
  processingText: PropTypes.string,
  onFileSelect: PropTypes.func.isRequired,
  onReset: PropTypes.func,
  children: PropTypes.node.isRequired,
};