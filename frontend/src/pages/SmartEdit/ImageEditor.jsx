/**
 * @module ImageEditor
 * @description Provides a comprehensive image editing interface allowing users to adjust
 * lighting, color, and effects using HTML5 Canvas rendering and live CSS previews.
 */

import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/file/fileUtils';

const DEFAULT_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  temperature: 0,
  blur: 0,
  vignette: 0,
  fade: 0,
};

/**
 * Loads an image element from a given URL.
 * @param {string} url - The object URL of the image.
 * @returns {Promise<HTMLImageElement>} A promise resolving to the loaded image element.
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export default function ImageEditor() {
  const fileInputRef = useRef(null);

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    file,
    previewUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, [previewUrl]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    cleanupResult();
  };

  const cssFilterString = useMemo(() => {
    return `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`;
  }, [filters.brightness, filters.contrast, filters.saturation, filters.blur]);

  const handleReset = useCallback(() => {
    resetAll();
    setFilters({ ...DEFAULT_FILTERS });
    setIsProcessing(false);
  }, [resetAll]);

  const applyFilters = useCallback(async () => {
    if (!file || !previewUrl) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const img = await loadImage(previewUrl);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) blur(${filters.blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      ctx.filter = 'none';

      if (filters.temperature !== 0) {
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = filters.temperature > 0 
          ? `rgba(255, 136, 0, ${filters.temperature / 400})` 
          : `rgba(0, 136, 255, ${Math.abs(filters.temperature) / 400})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (filters.fade > 0) {
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = `rgba(255, 255, 255, ${filters.fade / 200})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (filters.vignette > 0) {
        ctx.globalCompositeOperation = 'multiply';
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.max(cx, cy);
        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.2);
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.globalCompositeOperation = 'source-over';

      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Canvas export failed');
          
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = generateSafeFilename(file?.name, 'edited', 'jpg');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);

          handleReset();
        },
        file.type || 'image/jpeg',
        0.95
      );
    } catch (e) {
      console.error(e);
      setError('Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  }, [file, previewUrl, filters, cleanupResult, setError, handleReset]);

  const canProcess = useMemo(() => 
    Boolean(file) && !isProcessing, 
  [file, isProcessing]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!file ? (
              <UploadCard
                inputId="editor-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-6 transition-opacity duration-300 ${!file ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Light & Color</label>
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Brightness</span>
                    <span>{filters.brightness}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={filters.brightness} onChange={(e) => handleFilterChange('brightness', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Contrast</span>
                    <span>{filters.contrast}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={filters.contrast} onChange={(e) => handleFilterChange('contrast', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Saturation</span>
                    <span>{filters.saturation}%</span>
                  </div>
                  <input type="range" min="0" max="200" value={filters.saturation} onChange={(e) => handleFilterChange('saturation', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Temperature</span>
                    <span>{filters.temperature > 0 ? `+${filters.temperature}` : filters.temperature}</span>
                  </div>
                  <input type="range" min="-100" max="100" value={filters.temperature} onChange={(e) => handleFilterChange('temperature', Number(e.target.value))} className="w-full h-1.5 bg-linear-to-r from-blue-400 via-slate-200 to-orange-400 rounded-lg appearance-none cursor-pointer accent-slate-700" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2">Effects & Tone</label>
                
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Fade</span>
                    <span>{filters.fade}</span>
                  </div>
                  <input type="range" min="0" max="100" value={filters.fade} onChange={(e) => handleFilterChange('fade', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Vignette</span>
                    <span>{filters.vignette}</span>
                  </div>
                  <input type="range" min="0" max="100" value={filters.vignette} onChange={(e) => handleFilterChange('vignette', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                    <span>Blur</span>
                    <span>{filters.blur}px</span>
                  </div>
                  <input type="range" min="0" max="20" step="0.5" value={filters.blur} onChange={(e) => handleFilterChange('blur', Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>

            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <div className="flex gap-2 w-full">
            <button
              onClick={handleReset}
              disabled={!file}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                !file 
                  ? 'text-slate-300 cursor-not-allowed bg-transparent' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Edit Another
            </button>
            <button
              onClick={() => {
                setFilters({ ...DEFAULT_FILTERS });
                cleanupResult();
              }}
              disabled={!file}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                !file 
                  ? 'text-slate-300 cursor-not-allowed bg-transparent' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Reset Filters
            </button>
            <button
              onClick={applyFilters}
              disabled={!canProcess}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all ${
                canProcess
                  ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md hover:shadow-lg'
                  : 'bg-indigo-300 cursor-not-allowed'
              }`}
            >
              {isProcessing ? 'Exporting...' : 'Export Image'}
            </button>
          </div>
        }
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col bg-slate-100 rounded-xl overflow-hidden shadow-inner">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={null} 
              resultAlt="Edited output preview"
            >
              {previewUrl && (
                <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
                  <div className="relative h-full w-full">
                    
                    <img
                      src={previewUrl}
                      alt="Base Workspace"
                      className="absolute inset-0 h-full w-full object-contain pointer-events-none transition-all duration-150"
                      style={{ filter: cssFilterString }}
                    />
                    
                    <div 
                      className="absolute inset-0 pointer-events-none transition-all duration-150"
                      style={{
                        WebkitMaskImage: `url("${previewUrl}")`,
                        WebkitMaskSize: 'contain',
                        WebkitMaskPosition: 'center',
                        WebkitMaskRepeat: 'no-repeat',
                        maskImage: `url("${previewUrl}")`,
                        maskSize: 'contain',
                        maskPosition: 'center',
                        maskRepeat: 'no-repeat'
                      }}
                    >
                      {filters.temperature !== 0 && (
                        <div 
                          className="absolute inset-0 mix-blend-overlay"
                          style={{ 
                            backgroundColor: filters.temperature > 0 
                              ? `rgba(255, 136, 0, ${filters.temperature / 400})` 
                              : `rgba(0, 136, 255, ${Math.abs(filters.temperature) / 400})` 
                          }} 
                        />
                      )}

                      {filters.fade > 0 && (
                        <div 
                          className="absolute inset-0 mix-blend-lighten"
                          style={{ backgroundColor: `rgba(255, 255, 255, ${filters.fade / 200})` }} 
                        />
                      )}

                      {filters.vignette > 0 && (
                        <div 
                          className="absolute inset-0 mix-blend-multiply"
                          style={{
                            background: `radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,${filters.vignette / 100}) 120%)`
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </PreviewImageBox>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}