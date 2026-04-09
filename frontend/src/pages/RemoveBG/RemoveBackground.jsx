import { useState, useCallback, useEffect } from 'react';
import WorkspaceLayout from '../../components/Layout/WorkspaceLayout';
import UploadDropzone from '../../components/Upload/UploadDropzone';
import EmptyWorkspaceState from '../../components/Common/EmptyWorkspaceState';

export default function RemoveBG() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Toggle between 'original' and 'result' to let users compare
  const [viewMode, setViewMode] = useState('result');

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl && resultUrl.startsWith('blob:')) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return;
    setError('');
    setResultUrl(null);
    setViewMode('result');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setError('');
    setIsProcessing(false);
  }, []);

  const handleRemoveBackground = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError('');

    try {
      // ====================================================================
      // 🔌 BACKEND INTEGRATION POINT
      // Replace with your FastAPI `rembg` call here
      // ====================================================================
      
      // Simulated network delay for UI testing purposes
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Simulated success (setting result to original just to show UI state changes)
      setResultUrl(previewUrl); 
      setViewMode('result');

    } catch (err) {
      console.error(err);
      setError('Failed to remove background. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `transparent_${file?.name || 'image.png'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultUrl, file]);

  return (
    <div className="w-full">
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
        <WorkspaceLayout
          leftPanel={
            <>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">
                  AI Powered
                </span>
              </div>

              {!file ? (
                <UploadDropzone onFileSelect={handleFileSelect} />
              ) : (
                <div className="flex flex-col animate-in fade-in duration-300">
                  <div className="mt-1 flex items-center justify-between px-4 py-2.5 bg-white/60 border border-white/60 rounded-xl text-sm shadow-sm overflow-hidden">
                    <span className="font-medium text-slate-700 truncate mr-4">{file.name}</span>
                    <span className="text-slate-400 text-xs font-bold whitespace-nowrap">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>

                  {resultUrl && (
                    <div className="mt-6 flex flex-col gap-2">
                      <label className="text-sm font-bold text-slate-700">View Mode</label>
                      <div className="flex rounded-lg border border-slate-200 bg-white/60 p-1 text-sm font-bold shadow-sm">
                        <button
                          onClick={() => setViewMode('original')}
                          className={`flex-1 rounded-md px-3 py-2 transition-all ${
                            viewMode === 'original' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                          }`}
                        >
                          Original
                        </button>
                        <button
                          onClick={() => setViewMode('result')}
                          className={`flex-1 rounded-md px-3 py-2 transition-all ${
                            viewMode === 'result' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'
                          }`}
                        >
                          Transparent
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm backdrop-blur-sm">
                  {error}
                </div>
              )}

              {file && !resultUrl && (
                <div className="flex gap-3 mt-auto pt-4">
                  <button
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRemoveBackground}
                    disabled={isProcessing}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-80"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Extracting Subject...
                      </span>
                    ) : (
                      'Remove Background'
                    )}
                  </button>
                </div>
              )}

              {resultUrl && file && (
                <div className="flex gap-3 mt-auto pt-4">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-slate-900 shadow-sm"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                  >
                    Download Result
                  </button>
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

              <div className="flex-1 min-h-72 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner touch-none">
                {/* Checkerboard background for transparency visibility */}
                <div 
                  className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)',
                    backgroundPosition: '0 0, 10px 10px',
                    backgroundSize: '20px 20px'
                  }}
                />

                {previewUrl ? (
                  <div className="relative z-10 w-full h-full p-2 flex items-center justify-center">
                    <img
                      src={viewMode === 'result' && resultUrl ? resultUrl : previewUrl}
                      alt="Workspace Preview"
                      className={`max-w-full max-h-full object-contain drop-shadow-2xl transition-all duration-300 ${
                        isProcessing ? 'scale-105 opacity-50 blur-sm grayscale-[0.5]' : 'opacity-100'
                      }`}
                    />
                    
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-indigo-600 shadow-xl backdrop-blur-md">
                          AI is working...
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative z-10 flex h-full w-full items-center justify-center bg-slate-50/50 backdrop-blur-sm pointer-events-none">
                    <EmptyWorkspaceState />
                  </div>
                )}
              </div>
            </>
          }
        />
      </section>

      {/* Matching Info Section from UpscaleWorkspace */}
      <section className="max-w-6xl mx-auto px-6 py-1">
        <h2 className="text-2xl font-bold text-center mb-2 text-slate-900">Why Pixel Forge?</h2>
        <p className="text-slate-700 text-center mb-12 max-w-xl mx-auto font-medium">Flawless background removal using the U-2-Net AI architecture.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              ),
              title: 'Pixel Perfect Edges',
              desc: 'Advanced edge detection handles difficult areas like hair, fur, and transparent objects with ease.'
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Lightning Fast',
              desc: 'GPU-accelerated processing isolates subjects and drops the background in a matter of seconds.'
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

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-center mb-2 text-slate-900">How It Works</h2>
        <p className="text-slate-700 text-center mb-12 font-medium">Three simple steps to extract your subject.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Upload', desc: 'Drag & drop or click to upload any photo with a clear subject.' },
            { step: '02', title: 'Extract', desc: 'Our AI model scans the image and automatically masks the background.' },
            { step: '03', title: 'Download', desc: 'Download your new image as a transparent PNG instantly.' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl font-black text-white drop-shadow-md mb-3">{item.step}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-700 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}