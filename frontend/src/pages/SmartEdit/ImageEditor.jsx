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
import FitModeToggle from '../../components/Workspace/controls/FitModeToggle';
import Magnifier, { ZoomButton } from '../../components/Workspace/controls/Magnifier';
import ImageEditorFilters from '../../components/Workspace/controls/ImageEditorFilters';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/file/fileUtils';

const DEFAULT_FILTERS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  blur: 0,
  vignette: 0,
  fade: 0,
};

const getCssBrightness = (val) => 100 + (val * 0.6); 
const getCssContrast = (val) => 100 + (val * 0.6);   
const getCssSaturation = (val) => 100 + val;         

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

/**
 * Renders the main Image Editor tool workspace.
 * @returns {JSX.Element}
 */
export default function ImageEditor() {
  const fileInputRef = useRef(null);

  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
  const [isProcessing, setIsProcessing] = useState(false);
  const [fitMode, setFitMode] = useState('contain'); 

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
    return `brightness(${getCssBrightness(filters.brightness)}%) contrast(${getCssContrast(filters.contrast)}%) saturate(${getCssSaturation(filters.saturation)}%) blur(${filters.blur}px)`;
  }, [filters.brightness, filters.contrast, filters.saturation, filters.blur]);

  const handleReset = useCallback(() => {
    resetAll();
    setFilters({ ...DEFAULT_FILTERS });
    setIsProcessing(false);
  }, [resetAll]);

  const toggleFitMode = (e) => {
    if (e) e.stopPropagation();
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  };

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

      ctx.save();
      ctx.filter = `brightness(${getCssBrightness(filters.brightness)}%) contrast(${getCssContrast(filters.contrast)}%) saturate(${getCssSaturation(filters.saturation)}%) blur(${filters.blur}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      if (filters.temperature !== 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = filters.temperature > 0 
          ? `rgba(255, 136, 0, ${filters.temperature / 400})` 
          : `rgba(0, 136, 255, ${Math.abs(filters.temperature) / 400})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (filters.fade > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighten';
        ctx.fillStyle = `rgba(255, 255, 255, ${filters.fade / 200})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

      if (filters.vignette > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = Math.max(cx, cy);
        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius * 1.2);
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette / 100})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
      }

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

          setIsProcessing(false);
        },
        file.type || 'image/jpeg',
        0.95
      );
    } catch (e) {
      console.error(e);
      setError('Failed to process image. Please try again.');
      setIsProcessing(false);
    }
  }, [file, previewUrl, filters, cleanupResult, setError]);

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
              <ImageEditorFilters 
                filters={filters} 
                onFilterChange={handleFilterChange} 
              />
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
          <div className="absolute inset-2 flex flex-col bg-slate-100 rounded-xl overflow-hidden shadow-inner group">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={null} 
              resultAlt="Edited output preview"
              previewClassName="hidden"
              processingClassName="hidden"
            >
              {previewUrl && (
                <Magnifier
                  containerClassName="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
                  innerClassName={`relative h-full w-full transition-all duration-200 ${isProcessing ? 'scale-105 opacity-60 blur-[1px] grayscale-[0.1]' : ''}`}
                  renderControls={({ isZoomed, toggleZoom }) => (
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 flex gap-2">
                      <FitModeToggle
                        isFitMode={fitMode === 'contain'}
                        onToggle={toggleFitMode}
                        fitTitle="Fill container"
                        fillTitle="Show full image"
                      />
                      <ZoomButton
                        isZoomed={isZoomed}
                        onToggle={toggleZoom}
                        className={`p-2 backdrop-blur rounded-lg border shadow-sm transition-colors ${
                          isZoomed ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white/90 border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white'
                        }`}
                      />
                    </div>
                  )}
                >
                  {() => (
                    <div className="relative h-full w-full">
                      <img
                        src={previewUrl}
                        alt="Base Workspace"
                        className={`absolute inset-0 h-full w-full pointer-events-none ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                        style={{ filter: cssFilterString }}
                      />
                      
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          WebkitMaskImage: `url("${previewUrl}")`,
                          WebkitMaskSize: fitMode,
                          WebkitMaskPosition: 'center',
                          WebkitMaskRepeat: 'no-repeat',
                          maskImage: `url("${previewUrl}")`,
                          maskSize: fitMode,
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
                  )}
                </Magnifier>
              )}
            </PreviewImageBox>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}

ImageEditor.propTypes = {};