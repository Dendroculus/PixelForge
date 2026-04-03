import { useState } from 'react';
import UploadDropzone from '../components/UploadDropzone';
import ResultViewer from '../components/ResultViewer';
import Header from '../components/Header';
import ProgressBar from '../components/ProgressBar';
import ActionControls from '../components/ActionControls';
import LegalModal from '../components/LegalModal'; 
import { useUpscalePipeline } from '../hooks/useUpscalePipeline';
import { useSimulatedProgress } from '../hooks/useSimulatedProgress';
import { clearAppSession } from '../utils/session';
import { APP_CONFIG as config, STORAGE_KEYS } from '../config';
import CountdownTimer from '../components/CountdownTimer';

export default function Home() {
  const [progress, setProgress] = useState(0);
  
  const {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    modelType,
    setModelType,
    handleFileSelect,
    handleCancel,
    handleUpscale,
    turnstileRef,        
    setTurnstileToken,
    turnstileToken,
    appAlert,      
    setAppAlert,
    usesRemaining,
    resetTimestamp
  } = useUpscalePipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken);

  return (
    <div className="w-full">
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 border border-white/60 text-slate-700 text-xs font-semibold mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#EEAECA] animate-pulse" />
          <span>Free & Open Source — No sign-up required</span>
        </div>
        
        <Header />

        <div className="mt-12">
          {!selectedFile && !isProcessing && !jobId && (
            usesRemaining <= 0 ? (
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
              <div className="bg-white/40 backdrop-blur-2xl p-2 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5">
                <UploadDropzone onFileSelect={handleFileSelect} />
                <div className="text-center mt-4 mb-2 text-sm font-medium text-slate-500">
                  Free Uses Remaining: <span className="font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md border border-white/80 ml-1">{usesRemaining} / 3</span>
                </div>
              </div>
            )
          )}

          {selectedFile && (
            <div className="bg-white/50 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/60 space-y-6">
              {!resultUrl ? (
                <div className="bg-white/50 rounded-xl p-2 border border-white/40 flex justify-center overflow-hidden">
                  <img 
                    src={previewUrl} 
                    alt="Upload preview" 
                    className={`max-h-[400px] w-auto object-contain rounded-lg transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
                  />
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-white/60 shadow-sm">
                  <ResultViewer originalImage={previewUrl} upscaledImage={resultUrl} />
                </div>
              )}
              
              {isProcessing && <ProgressBar progress={progress} />}

              {!resultUrl && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                  <p className="text-sm text-slate-700 font-medium truncate max-w-[250px]">
                    {selectedFile.name}
                  </p>
                  
                  <ActionControls 
                    modelType={modelType}
                    setModelType={setModelType}
                    isProcessing={isProcessing}
                    handleCancel={handleCancel}
                    handleUpscale={handleUpscale}
                    turnstileRef={turnstileRef}
                    setTurnstileToken={setTurnstileToken}
                  />
                </div>
              )}

              {resultUrl && (
                <div className="flex justify-between items-center pt-2">
                  <button 
                    onClick={handleCancel}
                    className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    Upload Another Image
                  </button>
                  <a 
                    href={resultUrl}
                    download={`4K-${selectedFile.name}`}
                    onClick={() => {
                      clearAppSession(previewUrl);
                      handleCancel();
                    }}
                    className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-all shadow-md"
                  >
                    Download Result
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

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
              desc: 'Your images are processed and immediately deleted. No data is ever stored or shared.'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: 'Two AI Models',
              desc: 'Choose between General (photos) and Anime/Art models for optimal results on any image type.'
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

      {/* --- MODALS --- */}
      <LegalModal 
        isOpen={appAlert.show && appAlert.type === 'limit_reached'} 
        onClose={() => {
          setAppAlert({ show: false, type: null });
          localStorage.removeItem(STORAGE_KEYS.ALERT);
        }}
        title="Daily Limit Reached 🛑"
      >
        <div className="space-y-3 text-left">
          <p className="font-semibold text-slate-800 text-base">Whoa there! You've used up your 3 free upscales for today.</p>
          <p>Pixel Forge is powered by a "potato server" and expensive AI GPUs. To keep this tool free and open-source for everyone, we have to limit usage so the servers don't melt.</p>
          <p className="font-bold text-slate-900 pt-2">See you tomorrow! Your limit resets 24 hours from your first upscale.</p>
        </div>
      </LegalModal>

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
          <p>Since you kept refreshing and impatiently waiting, the image failed to be processed.</p>
          <p>Please try again and be patient next time!</p>
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