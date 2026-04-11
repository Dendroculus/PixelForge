export default function StagedFileCard({ selectedFile, isProcessing, resultUrl }) {
  if (!selectedFile) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Staged File</h3>
        {isProcessing && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded-md border border-indigo-200 animate-pulse">Processing</span>}
        {resultUrl && <span className="text-[10px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">Completed</span>}
      </div>
      
      <div className="flex items-center p-3.5 bg-white/80 border border-white shadow-sm rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex shrink-0 items-center justify-center mr-3 border border-indigo-100/50">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden pr-2">
          <span className="font-bold text-slate-800 text-sm truncate">{selectedFile.name}</span>
          <span className="text-slate-500 text-xs font-medium mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        
        {!isProcessing && !resultUrl && (
          <div className="shrink-0 ml-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}