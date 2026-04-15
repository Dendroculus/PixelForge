import PropTypes from 'prop-types';

export default function WorkspaceSuccessCard({
  title = 'Task Successful!',
  description = 'Your file is ready to use.',
  resultUrl,
  downloadName,
  onReset,
  resetText = 'Start Over',
  downloadText = 'Download File',
  icon,
  imageContainerStyle = 'max-h-[500px] h-auto overflow-y-auto result-scroll p-2'
}) {
  const DefaultIcon = (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
  );

  return (
    <div className="bg-white/50 backdrop-blur-2xl p-8 rounded-2xl shadow-xl border border-indigo-100/60 max-w-2xl mx-auto text-center flex flex-col items-center">
      <style>{`
        .result-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .result-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .result-scroll::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.6); 
          border-radius: 20px;
        }
        .result-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(67, 56, 202, 1); 
        }
      `}</style>

      <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-indigo-200">
        {icon || DefaultIcon}
      </div>
      
      <h3 className="text-2xl font-black text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 font-medium mb-6">{description}</p>

      {resultUrl && (
        <div className="bg-white/50 rounded-xl border border-white/40 mb-8 w-full max-w-sm overflow-hidden shadow-inner flex flex-col items-center">
           <div className={`w-full ${imageContainerStyle}`}>
              <img 
                src={resultUrl} 
                alt="Result preview" 
                className="w-full h-auto rounded-lg block shadow-sm" 
              />
           </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2 w-full">
        <button
          onClick={onReset}
          className="w-full sm:w-40 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
        >
          {resetText}
        </button>
        <a
          href={resultUrl}
          download={downloadName}
          className="w-full sm:w-48 flex justify-center items-center py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all shadow-md shadow-indigo-200"
        >
          {downloadText}
        </a>
      </div>
    </div>
  );
}

WorkspaceSuccessCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  resultUrl: PropTypes.string,
  downloadName: PropTypes.string,
  onReset: PropTypes.func.isRequired,
  resetText: PropTypes.string,
  downloadText: PropTypes.string,
  icon: PropTypes.node,
  imageContainerStyle: PropTypes.string,
};