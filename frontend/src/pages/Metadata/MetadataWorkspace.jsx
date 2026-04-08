import { useState, useEffect } from 'react';
import exifr from 'exifr';
import UploadDropzone from '../../components/UploadDropzone';

export default function MetadataWorkspace() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [strippedUrl, setStrippedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (strippedUrl) URL.revokeObjectURL(strippedUrl);
    };
  }, [previewUrl, strippedUrl]);

  /**
   * The Canvas Trick: Drawing an image to an HTML5 Canvas and exporting it 
   * automatically destroys all hidden EXIF metadata while keeping the pixels intact!
   */
  const stripMetadata = (file, fileUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(URL.createObjectURL(blob)),
          file.type || 'image/jpeg',
          1.0
        );
      };
      img.onerror = reject;
      img.src = fileUrl;
    });
  };
  const handleFileSelect = async (file) => {
    setIsProcessing(true);
    setSelectedFile(file);
    
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    try {
      // 1. Extract the Metadata using exifr
      const parsedData = await exifr.parse(file);
      setMetadata(parsedData || {}); 

      // 2. Only run the canvas stripper if metadata actually exists
      if (parsedData && Object.keys(parsedData).length > 0) {
        const cleanUrl = await stripMetadata(file, fileUrl);
        setStrippedUrl(cleanUrl);
      }
      
    } catch (error) {
      console.error("Failed to process metadata:", error);
      setMetadata({});
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadata(null);
    setStrippedUrl(null);
  };

  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

  // Determine UI State
  const isClean = metadata && Object.keys(metadata).length === 0;

  return (
    <div className="w-full">
      <section className="max-w-6xl mx-auto px-6 pt-4 pb-16 text-center relative z-10">

        <div>
          {!selectedFile ? (
            // STATE 1: Upload Dropzone
            <div className="bg-white/40 backdrop-blur-2xl p-2 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-2xl mx-auto">
              <UploadDropzone onFileSelect={handleFileSelect} />
            </div>
          ) : isProcessing ? (
            // STATE 2: Loading Status
            <div className="bg-white/40 backdrop-blur-2xl p-12 rounded-2xl border border-white/50 shadow-xl shadow-slate-900/5 max-w-md mx-auto flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 font-bold animate-pulse">Scanning pixels for hidden data...</p>
            </div>
          ) : isClean ? (
            // STATE 3: Single Card (No Metadata Found)
            <div className="bg-white/50 backdrop-blur-2xl p-8 rounded-2xl shadow-xl border border-emerald-100/60 max-w-2xl mx-auto text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-sm border border-emerald-200">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Already Clean!</h3>
              <p className="text-slate-600 font-medium mb-6">We scanned the file, and no EXIF data, location tags, or hidden metadata were found. It is already safe to share.</p>

              <div className="bg-white/50 rounded-xl p-2 border border-white/40 mb-8 w-full max-w-sm h-48 flex justify-center shadow-inner">
                <img src={previewUrl} alt="Original" className="h-full w-auto object-contain rounded-lg" />
              </div>

              <button
                onClick={handleCancel}
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
              >
                Scan Another Image
              </button>
            </div>
          ) : (
            // STATE 4: Two Cards (Metadata Found & Stripped)
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* LEFT CARD: Original + Metadata */}
              <div className="bg-white/50 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/60 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Original File</h3>
                  <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-md uppercase tracking-wider">Has Metadata</span>
                </div>
                
                <div className="bg-white/50 rounded-xl p-2 border border-white/40 flex justify-center mb-6 h-48 shrink-0 shadow-inner">
                  <img src={previewUrl} alt="Original" className="h-full w-auto object-contain rounded-lg" />
                </div>

                <div className="grow bg-white/60 rounded-xl border border-white/80 p-4 overflow-y-auto max-h-75 custom-scrollbar shadow-inner">
                  <h4 className="text-xs font-extrabold text-slate-900 bg-slate-100 uppercase tracking-widest text-center mb-4 py-2 px-4 rounded-lg border-b border-slate-200/60">
                  Extracted EXIF Data
                </h4>
                  <div className="space-y-2">
                    {Object.entries(metadata)
                      .filter(([val]) => typeof val === 'string' || typeof val === 'number')
                      .map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-1 last:border-0">
                        <span className="text-slate-500 font-medium">{formatKey(key)}</span>
                        <span className="text-slate-800 font-semibold text-right max-w-[50%] truncate" title={String(val)}>
                          {String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: Stripped + Download */}
              <div className="bg-white/50 backdrop-blur-2xl p-6 rounded-2xl shadow-xl border border-white/60 flex flex-col h-full">
                 <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800">Cleaned File</h3>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md uppercase tracking-wider">Metadata Stripped</span>
                </div>

                <div className="bg-white/50 rounded-xl p-2 border border-white/40 flex justify-center mb-6 h-48 shrink-0 shadow-inner">
                  <img src={strippedUrl} alt="Stripped" className="h-full w-auto object-contain rounded-lg" />
                </div>

                <div className="grow flex flex-col justify-center items-center text-center px-4 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-sm border border-emerald-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <h4 className="text-xl font-black text-slate-800">100% Clean & Private</h4>
                  <p className="text-sm text-slate-600 font-medium">All hidden location data, camera settings, and tracking timestamps have been permanently removed.</p>
                </div>

                <div className="flex gap-3 mt-6 pt-4 border-t border-slate-200/50">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm"
                  >
                    Start Over
                  </button>
                  <a
                    href={strippedUrl}
                    download={`Cleaned-${selectedFile.name}`}
                    className="flex-2 flex justify-center items-center py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md"
                  >
                    Download Clean Image
                  </a>
                </div>
              </div>

            </div>
          )}
        </div>
      </section>
    </div>
  );
}