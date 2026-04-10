import { useState } from 'react';
import WorkspaceLayout from '../../components/Layout/WorkspaceLayout';
import UploadDropzone from '../../components/Upload/UploadDropzone';
import ResultViewer from '../../components/Workspace/ResultViewer';
import ProgressBar from '../../components/Common/ProgressBar';
import ActionControls from '../../components/Workspace/ActionControls';
import WorkspaceModals from '../../components/Workspace/WorkspaceModals';
import WorkspaceLimitCard from '../../components/Workspace/WorkspaceLimitCard';
import WorkspaceMarketing from '../../components/Workspace/WorkspaceMarketing';
import { useUpscalePipeline } from '../../hooks/pipeline/useUpscalePipeline';
import { useSimulatedProgress } from '../../hooks/useSimulatedProgress';
import { APP_CONFIG as config } from '../../config';

export default function UpscaleWorkspace() {
  const [isResultLoaded, setIsResultLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    selectedFile, previewUrl, isProcessing, resultUrl, jobId,
    handleFileSelect, handleCancel, handleUpscale,
    turnstileRef, setTurnstileToken, turnstileToken,
    appAlert, setAppAlert, usesRemaining, resetTimestamp, isLoading, scale, setScale, maxLimit,
  } = useUpscalePipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken, 'upscale');

  const showLimitCard = !selectedFile && !isProcessing && !jobId && !isLoading && usesRemaining <= 0;
  const showLoadingCard = !selectedFile && !isProcessing && !jobId && isLoading;

  const marketingProps = {
    subtitle: "Advanced AI upscaling optimized for photos and digital art.",
    features: [
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        title: 'Lightning Fast', desc: 'GPU-accelerated processing delivers 4x upscaled images in seconds, not minutes.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        title: 'Secure & Private', desc: 'Your images are processed securely and removed by automated retention cleanup. No data is sold or shared.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        title: 'Optimized AI Model', desc: 'A single tuned Real-ESRGAN pipeline delivers consistent quality without setup complexity.'
      }
    ],
    steps: [
      { step: '01', title: 'Upload', desc: 'Drag & drop or click to upload any PNG, JPG, or WEBP image.' },
      { step: '02', title: 'Enhance', desc: 'Our Real-ESRGAN model upscales your image to 4x resolution with AI.' },
      { step: '03', title: 'Download', desc: 'Compare the before & after, then download your enhanced image instantly.' },
    ]
  };

  return (
    <div className="w-full">
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
        {showLoadingCard || showLimitCard ? (
          <WorkspaceLimitCard showLoading={showLoadingCard} showLimit={showLimitCard} maxLimit={maxLimit} resetTimestamp={resetTimestamp} featureText="upscales" />
        ) : (
          <WorkspaceLayout
            leftPanel={
              <div className="flex flex-col h-full min-h-72">
                <div className="flex items-center gap-2 mb-5">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">AI Powered</span>
                </div>

                {!selectedFile ? (
                  <div className="flex flex-col flex-1 justify-center pb-4">
                    <UploadDropzone onFileSelect={handleFileSelect} />
                    {!isProcessing && !jobId && (
                      <div className="text-center mt-4 text-sm font-medium text-slate-500">
                        Free Uses Remaining: <span className="font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md border border-white/80 ml-1">{usesRemaining} / {maxLimit}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 justify-center relative w-full py-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-tr from-indigo-300/20 via-purple-300/10 to-emerald-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

                    <div className="relative bg-white/50 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-slate-200/50 rounded-4xl p-5 sm:p-6 overflow-hidden w-full max-w-md mx-auto">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNCkiLz48L3N2Zz4=')] opacity-60 pointer-events-none" />

                      <div className="relative z-10 flex flex-col gap-6">
                        
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

                        {/* 2. Action / Processing Section */}
                        <div className="bg-white/60 rounded-2xl p-4 border border-white shadow-sm">
                          {isProcessing && (
                            <div className="w-full py-1">
                              <ProgressBar progress={progress} />
                            </div>
                          )}

                          {!isProcessing && !resultUrl && (
                            <div className="flex flex-col gap-4">
                              <ActionControls jobId={jobId} isProcessing={isProcessing} handleCancel={handleCancel} handleUpscale={handleUpscale} turnstileRef={turnstileRef} setTurnstileToken={setTurnstileToken} scale={scale} setScale={setScale} />
                            </div>
                          )}

                          {resultUrl && (
                            <div className="flex flex-col gap-2.5 w-full">
                              <a href={resultUrl} download={`4K-${selectedFile.name}`} onClick={(e) => { if (!isResultLoaded) { e.preventDefault(); return; } handleCancel(); }} className={`w-full inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition-all ${!isResultLoaded ? 'bg-slate-400 pointer-events-none opacity-70' : 'bg-emerald-500 hover:bg-emerald-400 shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}>
                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                {isResultLoaded ? 'Save Result' : 'Loading Engine...'}
                              </a>
                              <button onClick={handleCancel} className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm">
                                Clear Workspace
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
            rightPanel={
              <div className="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner">
                {selectedFile ? (
                  resultUrl ? <div className="w-full h-full"><ResultViewer originalImage={previewUrl} upscaledImage={resultUrl} onImageLoad={() => setIsResultLoaded(true)} /></div>
                  : <img src={previewUrl} alt="Upload preview" className={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`} />
                ) : (
                  <div className="text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3 shadow-sm border border-white"><svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <p className="text-sm font-medium text-slate-400">Workspace is empty</p>
                  </div>
                )}
              </div>
            }
          />
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600 font-medium">
          <span>Supports:</span>
          {config.ALLOWED_EXTENSIONS.map((fmt) => <span key={fmt} className="px-2 py-0.5 rounded bg-white/40 border border-white/50 text-slate-600 font-mono">.{fmt.toLowerCase()}</span>)}
        </div>
      </section>

      <WorkspaceMarketing {...marketingProps} />
      <WorkspaceModals appAlert={appAlert} setAppAlert={setAppAlert} featureName="upscale" />
    </div>
  );
}