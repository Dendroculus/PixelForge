export default function ResultActions({ resultUrl, selectedFile, isResultLoaded, handleCancel, downloadPrefix = "Result-" }) {
  if (!resultUrl) return null;

  const handleDownloadClick = (e) => {
    if (!isResultLoaded) {
      e.preventDefault();
      return;
    }
    handleCancel();
  };

  const getDownloadFilename = () => {
    const baseName = selectedFile?.name?.split('.')[0] || 'image';
    return `${downloadPrefix}${baseName}.png`;
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <a 
        href={resultUrl} 
        download={getDownloadFilename()} 
        onClick={handleDownloadClick} 
        className={`w-full inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition-all ${!isResultLoaded ? 'bg-slate-400 pointer-events-none opacity-70' : 'bg-emerald-500 hover:bg-emerald-400 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isResultLoaded ? 'Save Result' : 'Loading Engine...'}
      </a>
      <button 
        onClick={handleCancel} 
        className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm"
      >
        Clear Workspace
      </button>
    </div>
  );
}