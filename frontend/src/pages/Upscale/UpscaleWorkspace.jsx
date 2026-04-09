import { useState } from 'react';
import WorkspaceLayout from '../../components/Layout/WorkspaceLayout';
import UploadDropzone from '../../components/Upload/UploadDropzone';
import ResultViewer from '../../components/Upscale/UpscaleResultViewer';
import ProgressBar from '../../components/Common/ProgressBar';
import ActionControls from '../../components/Upscale/ActionControls';
import WorkspaceModals from '../../components/Workspace/WorkspaceModals';
import WorkspaceLimitCard from '../../components/Workspace/WorkspaceLimitCard';
import WorkspaceMarketing from '../../components/Workspace/WorkspaceMarketing';
import { useUpscalePipeline } from '../../hooks/pipeline/useUpscalePipeline';
import { useSimulatedProgress } from '../../hooks/useSimulatedProgress';
import { clearAppSession } from '../../utils/session';
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

  useSimulatedProgress(isProcessing, setProgress, turnstileToken);

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

                {isProcessing && <ProgressBar progress={progress} />}

                {selectedFile && !resultUrl && (
                  <div className="flex flex-col gap-4 pt-2">
                    <ActionControls jobId={jobId} isProcessing={isProcessing} handleCancel={handleCancel} handleUpscale={handleUpscale} turnstileRef={turnstileRef} setTurnstileToken={setTurnstileToken} scale={scale} setScale={setScale} />
                  </div>
                )}

                {resultUrl && selectedFile && (
                  <div className="flex gap-3 mt-auto pt-2">
                    <button onClick={handleCancel} className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm">Upload Another</button>
                    <a href={resultUrl} download={`4K-${selectedFile.name}`} onClick={(e) => { if (!isResultLoaded) { e.preventDefault(); return; } clearAppSession(previewUrl); handleCancel(); }} className={`flex-1 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${!isResultLoaded ? 'bg-slate-400 pointer-events-none opacity-70' : 'bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg'}`}>
                      {isResultLoaded ? 'Download Result' : 'Loading Image...'}
                    </a>
                  </div>
                )}
              </>
            }
            rightPanel={
                <div className="flex-1 min-h-72 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner">
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