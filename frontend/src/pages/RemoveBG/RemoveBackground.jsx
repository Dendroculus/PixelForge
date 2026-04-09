import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import WorkspaceLayout from '../../components/Layout/WorkspaceLayout';
import UploadDropzone from '../../components/Upload/UploadDropzone';
import ResultViewer from '../../components/Upscale/UpscaleResultViewer';
import ProgressBar from '../../components/Common/ProgressBar';
import WorkspaceModals from '../../components/Workspace/WorkspaceModals';
import WorkspaceLimitCard from '../../components/Workspace/WorkspaceLimitCard';
import WorkspaceMarketing from '../../components/Workspace/WorkspaceMarketing';
import { useRemBGPipeline } from '../../hooks/pipeline/useRemBGPipeline';
import { useSimulatedProgress } from '../../hooks/useSimulatedProgress';
import { clearAppSession } from '../../utils/session';
import { APP_CONFIG as config } from '../../config';

export default function RemoveBG() {
  const [isResultLoaded, setIsResultLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    selectedFile, previewUrl, isProcessing, resultUrl, jobId,
    handleFileSelect, handleCancel, handleProcess,
    turnstileRef, setTurnstileToken, turnstileToken,
    appAlert, setAppAlert, usesRemaining, resetTimestamp, isLoading, maxLimit,
  } = useRemBGPipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken);

  const showLimitCard = !selectedFile && !isProcessing && !jobId && !isLoading && usesRemaining <= 0;
  const showLoadingCard = !selectedFile && !isProcessing && !jobId && isLoading;

  const getRemBGProgressText = () => {
    if (progress === 0) return "Verifying secure connection, don't refresh...";
    if (progress < 30) return "Uploading to Cloud GPUs...";
    if (progress < 50) return "Analyzing pixel structures...";
    if (progress < 70) return "Running edge detection model...";
    if (progress < 90) return "Generating transparency mask...";
    if (progress < 99) return "Polishing final PNG output...";
    return "Finalizing download...";
  };

  const marketingProps = {
    subtitle: "Flawless background removal powered by state-of-the-art vision AI.",
    features: [
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>,
        title: 'Precision Edge Detection', desc: 'Advanced segmentation models cleanly isolate tricky subjects like hair, fur, and intricate edges.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        title: 'Secure & Private', desc: 'Your images are processed securely and removed by automated retention cleanup. No data is sold or shared.'
      },
      {
        icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
        title: 'Fast & Automated', desc: 'Our cloud-accelerated pipeline isolates your subject and drops the background in seconds.'
      }
    ],
    steps: [
      { step: '01', title: 'Upload', desc: 'Drag & drop or click to upload any photo with a clear subject.' },
      { step: '02', title: 'Extract', desc: 'Our AI model scans the image and automatically masks the background.' },
      { step: '03', title: 'Download', desc: 'Download your new image as a transparent PNG instantly.' },
    ]
  };

  return (
    <div className="w-full">
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
        
        {showLoadingCard || showLimitCard ? (
          <WorkspaceLimitCard showLoading={showLoadingCard} showLimit={showLimitCard} maxLimit={maxLimit} resetTimestamp={resetTimestamp} featureText="background removals" />
        ) : (
          <WorkspaceLayout
            leftPanel={
              <>
                <div className="flex items-center gap-2"><span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">AI Powered</span></div>
                <UploadDropzone onFileSelect={handleFileSelect} />
                
                {selectedFile && (
                  <div className="mt-1 flex items-center justify-between px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm shadow-sm overflow-hidden">
                    <span className="font-medium text-slate-700 truncate mr-4">{selectedFile.name}</span>
                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                )}

                {!selectedFile && !isProcessing && !jobId && (
                  <div className="text-center mt-1 text-sm font-medium text-slate-500">Free Uses Remaining: <span className="font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md border border-white/80 ml-1">{usesRemaining} / {maxLimit}</span></div>
                )}

                {isProcessing && <ProgressBar progress={progress} customText={getRemBGProgressText()} />}

                {selectedFile && !resultUrl && (
                  <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col items-center justify-center gap-3 w-full sm:w-auto">
                      <div className="flex justify-center w-full mb-1">
                        <Turnstile ref={turnstileRef} siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                      </div>
                      <div className="flex gap-3 w-full">
                        <button onClick={handleCancel} disabled={isProcessing} className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50">Cancel</button>
                        <button onClick={handleProcess} disabled={isProcessing || !!jobId} className="flex-1 flex items-center justify-center min-w-38.75 px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all">
                          {isProcessing || jobId ? 'Processing...' : 'Remove Background'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {resultUrl && selectedFile && (
                  <div className="flex gap-3 mt-auto pt-2">
                    <button onClick={handleCancel} className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm">Upload Another</button>
                    <a href={resultUrl} download={`NoBG-${selectedFile.name.split('.')[0]}.png`} onClick={(e) => { if (!isResultLoaded) { e.preventDefault(); return; } clearAppSession(previewUrl); handleCancel(); }} className={`flex-1 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${!isResultLoaded ? 'bg-slate-400 pointer-events-none opacity-70' : 'bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg'}`}>
                      {isResultLoaded ? 'Download Result' : 'Loading Image...'}
                    </a>
                  </div>
                )}
              </>
            }
            rightPanel={
               <div className="flex-1 min-h-72 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="absolute inset-0 z-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)', backgroundPosition: '0 0, 10px 10px', backgroundSize: '20px 20px' }} />
                  {selectedFile ? (
                    resultUrl ? <div className="w-full h-full z-10"><ResultViewer originalImage={previewUrl} upscaledImage={resultUrl} onImageLoad={() => setIsResultLoaded(true)} /></div> 
                    : <img src={previewUrl} alt="Upload preview" className={`max-h-96 w-full object-contain p-2 z-10 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`} />
                  ) : (
                    <div className="text-center px-4 z-10">
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
      <WorkspaceModals appAlert={appAlert} setAppAlert={setAppAlert} featureName="rembg" />
    </div>
  );
}