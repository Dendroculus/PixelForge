import { useState } from 'react';
import WorkspaceLayout from '../../components/WorkspaceLayout';
import UploadDropzone from '../../components/UploadDropzone';
import ResultViewer from '../../components/UpscaleResultViewer';
import ProgressBar from '../../components/ProgressBar';
import ActionControls from '../../components/ActionControls';
import LegalModal from '../../components/LegalModal';
import { useUpscalePipeline } from '../../hooks/useUpscalePipeline';
import { useSimulatedProgress } from '../../hooks/useSimulatedProgress';
import { clearAppSession } from '../../utils/session';
import { APP_CONFIG as config, STORAGE_KEYS } from '../../config';
import CountdownTimer from '../../components/CountdownTimer';

export default function UpscaleWorkspace() {
  const [isResultLoaded, setIsResultLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    handleFileSelect,
    handleCancel,
    handleUpscale,
    turnstileRef,
    setTurnstileToken,
    turnstileToken,
    appAlert,
    setAppAlert,
    usesRemaining,
    resetTimestamp,
    isLoading,
    scale,
    setScale,
  } = useUpscalePipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken);

  const showLimitCard = !selectedFile && !isProcessing && !jobId && !isLoading && usesRemaining <= 0;
  const showLoadingCard = !selectedFile && !isProcessing && !jobId && isLoading;

  return (
    <div className="w-full">
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
        {showLoadingCard ? (
          <div className="bg-white/40 backdrop-blur-2xl p-10 sm:p-14 rounded-3xl border border-white/50 shadow-xl flex items-center justify-center min-h-75 max-w-2xl mx-auto">
            <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        ) : showLimitCard ? (
          <div className="bg-rose-50/90 backdrop-blur-2xl p-10 sm:p-14 rounded-3xl border border-rose-200 shadow-xl text-center flex flex-col items-center justify-center max-w-2xl mx-auto transition-all duration-500">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-5 shadow-sm border border-rose-100 text-rose-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Daily Limit Reached</h3>
            <p className="text-slate-600 font-medium mb-8 max-w-md">You've used all 3 free upscales today. This keeps our potato server alive for everyone!</p>
            <div className="bg-white/80 px-8 py-4 rounded-2xl border border-rose-100 shadow-sm w-full max-w-sm">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">You can upscale again in</span>
              <div className="text-3xl font-black text-rose-600 font-mono tracking-tight mt-1">
                <CountdownTimer targetTimestamp={resetTimestamp} />
              </div>
            </div>
          </div>
        ) : (
          <WorkspaceLayout
            leftPanel={
              <>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">
                    AI Powered
                  </span>
                </div>

                <UploadDropzone onFileSelect={handleFileSelect} />

                {selectedFile && (
                  <div className="mt-1 flex items-center justify-between px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm shadow-sm overflow-hidden">
                    <span className="font-medium text-slate-700 truncate mr-4">{selectedFile.name}</span>
                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                )}

                {!selectedFile && !isProcessing && !jobId && (
                  <div className="text-center mt-1 text-sm font-medium text-slate-500">
                    Free Uses Remaining: <span className="font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md border border-white/80 ml-1">{usesRemaining} / 3</span>
                  </div>
                )}

                {isProcessing && <ProgressBar progress={progress} />}

                {selectedFile && !resultUrl && (
                  <div className="flex flex-col gap-4 pt-2">
                    <ActionControls
                      jobId={jobId}
                      isProcessing={isProcessing}
                      handleCancel={handleCancel}
                      handleUpscale={handleUpscale}
                      turnstileRef={turnstileRef}
                      setTurnstileToken={setTurnstileToken}
                      scale={scale}
                      setScale={setScale}
                    />
                  </div>
                )}

                {resultUrl && selectedFile && (
                  <div className="flex gap-3 mt-auto pt-2">
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm"
                    >
                      Upload Another
                    </button>
                    <a
                      href={resultUrl}
                      download={`4K-${selectedFile.name}`}
                      onClick={(e) => {
                        if (!isResultLoaded) {
                          e.preventDefault();
                          return;
                        }
                        clearAppSession(previewUrl);
                        handleCancel();
                      }}
                      className={`flex-1 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-bold text-white transition-all ${
                        !isResultLoaded
                          ? 'bg-slate-400 pointer-events-none cursor-not-allowed opacity-70'
                          : 'bg-emerald-500 hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20'
                      }`}
                    >
                      {isResultLoaded ? 'Download Result' : 'Loading Image...'}
                    </a>
                  </div>
                )}
              </>
            }
            rightPanel={
              <>
                <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center justify-between">
                  Preview Workspace
                  {resultUrl && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-100/50 px-2 py-1 rounded-md border border-emerald-200">
                      Ready
                    </span>
                  )}
                </h3>

                <div className="flex-1 min-h-72 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner">
                  {selectedFile ? (
                    resultUrl ? (
                      <div className="w-full h-full">
                        <ResultViewer
                          originalImage={previewUrl}
                          upscaledImage={resultUrl}
                          onImageLoad={() => setIsResultLoaded(true)}
                        />
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Upload preview"
                        className={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
                      />
                    )
                  ) : (
                    <div className="text-center px-4">
                      <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3 shadow-sm">
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-slate-400">Workspace is empty</p>
                    </div>
                  )}
                </div>
              </>
            }
          />
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600 font-medium">
          <span>Supports:</span>
          {config.ALLOWED_EXTENSIONS.map((fmt) => (
            <span key={fmt} className="px-2 py-0.5 rounded bg-white/40 border border-white/50 text-slate-600 font-mono">
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-1">
        <h2 className="text-2xl font-bold text-center mb-2 text-slate-900">Why Pixel Forge?</h2>
        <p className="text-slate-700 text-center mb-12 max-w-xl mx-auto font-medium">Advanced AI upscaling optimized for photos and digital art.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Lightning Fast',
              desc: 'GPU-accelerated processing delivers 4x upscaled images in seconds, not minutes.'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Secure & Private',
              desc: 'Your images are processed securely and removed by automated retention cleanup. No data is sold or shared.'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Optimized AI Model',
              desc: 'A single tuned Real-ESRGAN pipeline delivers consistent quality without setup complexity.'
            }
          ].map((feature) => (
            <div key={feature.title} className="group p-6 rounded-2xl bg-white/40 border border-white/50 hover:border-white hover:bg-white/60 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-white/60 flex items-center justify-center text-slate-800 mb-4 group-hover:scale-105 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-2 text-slate-900">How It Works</h2>
        <p className="text-slate-700 text-center mb-12 font-medium">Three simple steps to enhance your images.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload', desc: 'Drag & drop or click to upload any PNG, JPG, or WEBP image.' },
            { step: '02', title: 'Enhance', desc: 'Our Real-ESRGAN model upscales your image to 4x resolution with AI.' },
            { step: '03', title: 'Download', desc: 'Compare the before & after, then download your enhanced image instantly.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl font-black text-white drop-shadow-md mb-3">{item.step}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-700 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'potato'}
        onClose={() => {
          setAppAlert({ show: false, type: null });
          localStorage.removeItem(STORAGE_KEYS.ALERT);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
        }}
        title="Whoa, slow down! 👀"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-slate-800 text-base">We're working on it!</p>
          <p>Please wait as your image is being processed on our potato server (●'◡'●)</p>
          <p>Since this is a free, open-source project, we are trying to save costs. Refreshing the page won't speed up the AI, but it might make our server cry.</p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'dos'}
        onClose={() => {
          setAppAlert({ show: false, type: null });
          localStorage.removeItem(STORAGE_KEYS.ALERT);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
        }}
        title="Processing Failed ❌"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-rose-600 text-base mb-2">Image failed to process.</p>
          <p>Sorry our servers are currently busy and cannot process your request at the moment.</p>
          <p>Please try again, we're really trying our best! 🥲</p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'reserved_warning'}
        onClose={() => setAppAlert({ show: false, type: null })}
        title="Session Restored 🔄"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-slate-800 text-base mb-2">We reserved your image!</p>
          <p>Just letting you know that your upscaled image won't stay here forever.</p>
          <p>
            Please remember to download it before it expires in{' '}
            <CountdownTimer
              targetTimestamp={Number(localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP)) + config.RESULT_EXPIRATION_TIME}
              isWarning={true}
              onExpire={() => {
                setAppAlert({ show: true, type: 'expired' });
              }}
            />
            {' '}minutes!
          </p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={appAlert.show && appAlert.type === 'expired'}
        onClose={() => {
          setAppAlert({ show: false, type: null });
          localStorage.removeItem(STORAGE_KEYS.ALERT);
        }}
        title="Session Expired ⏱️"
      >
        <div className="space-y-1.5 text-left">
          <p className="font-semibold text-rose-600 text-base mb-2">Image deleted for privacy.</p>
          <p>Your session timed out and your image was permanently deleted from your browser and our servers to protect your privacy.</p>
          <p>Please upload your image again if you still need to upscale it!</p>
        </div>
      </LegalModal>
    </div>
  );
}