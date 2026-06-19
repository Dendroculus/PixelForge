import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import UploadCard from '@/components/Upload/UploadCard';
import ToolWorkspaceShell from '@/components/Layout/Tool/ToolWorkspaceShell';
import ToolPageWrapper from '@/components/Layout/Tool/ToolPageWrapper';
import PreviewImageBox from '@/components/Workspace/display/PreviewImageBox';
import WorkspaceErrorAlert from '@/components/Workspace/display/WorkspaceErrorAlert';
import PaletteSwatches from '@/components/Workspace/display/PaletteSwatches';
import ClientSideHeader from '@/components/Workspace/Header/ClientSideHeader';
import ColorPaletteControls from '@/components/Workspace/controls/Palette/ColorPaletteControls';

import { useWorkspaceFile } from '@/hooks/workspace/Core/useWorkspaceFile';
import usePaletteSampling from '@/hooks/client/usePaletteSampling';
import { useColorPaletteEditor } from '@/hooks/workspace/Utility/useColorPaletteEditor';

/**
 * Interactive color palette extraction tool.
 * Allows users to upload an image, position sampling points,
 * generate a color palette, and copy extracted colors.
 *
 * @returns {JSX.Element}
 */
export default function ColorPalette() {
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);

  const [copiedHex, setCopiedHex] = useState(null);
  const [paletteStyle, setPaletteStyle] = useState(() => {
    if (typeof window === 'undefined') return 'square';
    return localStorage.getItem('paletteStyle') || 'square';
  });

  const {
    file,
    previewUrl,
    error,
    setError,
    onFileChange,
    resetAll: resetWorkspaceFile,
  } = useWorkspaceFile(fileInputRef);

  const {
    isProcessing,
    setIsProcessing,
    palette,
    setPalette,
    samplePaletteFromPoints,
  } = usePaletteSampling({ previewUrl, setError });

  const {
    paletteCount,
    paletteVariation,
    points,
    imageRect,
    handlePaletteCountChange,
    handleVariationChange,
    onPointPointerDown,
    updateImageRect,
    resetEditor,
  } = useColorPaletteEditor({
    previewUrl,
    samplePaletteFromPoints,
    imageRef,
    previewContainerRef,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('paletteStyle', paletteStyle);
    }
  }, [paletteStyle]);

  /**
   * Resets the workspace to its initial state.
   * Clears the uploaded image, extracted palette,
   * copied color state, processing state, and editor data.
   */
  const handleReset = useCallback(() => {
    resetWorkspaceFile();
    setPalette([]);
    setIsProcessing(false);
    setCopiedHex(null);
    resetEditor();
  }, [resetWorkspaceFile, setIsProcessing, setPalette, resetEditor]);

  /**
   * Copies a color value to the clipboard and temporarily
   * marks it as the most recently copied color.
   *
   * @param {string} hex - Hex color value to copy.
   */
  const copyToClipboard = useCallback((hex) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  }, []);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <>
            {!file && (
              <div className="mb-4 min-h-32">
                <UploadCard
                  inputId="palette-file-input"
                  inputRef={fileInputRef}
                  onChange={onFileChange}
                  helperText="Any format up to 10MB"
                  maxSizeMB={10}
                  hasActiveFile={Boolean(file)}
                />
              </div>
            )}

            <ColorPaletteControls
              paletteCount={paletteCount}
              paletteVariation={paletteVariation}
              onCountChange={handlePaletteCountChange}
              onVariationChange={handleVariationChange}
              disabled={!file}
            />

            <AnimatePresence>
              {palette.length > 0 && (
                <motion.div
                  key="palette-wrapper"
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex flex-col"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-700">
                      Palette
                    </h3>
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('square')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'square'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Square
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaletteStyle('circle')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          paletteStyle === 'circle'
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Circle
                      </button>
                    </div>
                  </div>

                  <PaletteSwatches
                    palette={palette.map((hex, i) => ({
                      id: points[i]?.id ?? i,
                      hex,
                    }))}
                    paletteStyle={paletteStyle}
                    copiedHex={copiedHex}
                    onCopy={copyToClipboard}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <WorkspaceErrorAlert error={error} />
          </>
        }
        leftFooter={
          <div className="flex flex-col gap-3">
            {file && (
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200/60 bg-white/50 px-5 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-white hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Another Image
              </button>
            )}
          </div>
        }
        rightHeader={
          <h3 className="flex items-center justify-between text-sm font-bold text-slate-800">
            Preview Workspace
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              isProcessing={isProcessing}
              imageRef={imageRef}
              onImageLoad={updateImageRect}
              previewClassName="opacity-100 transition-all duration-200"
              containerRef={previewContainerRef}
            >
              {previewUrl &&
                points.map((p, i) => {
                  const hex = palette[i] || '#ffffff';
                  return (
                    <motion.button
                      key={`picker-${p.id}`}
                      onPointerDown={(e) => onPointPointerDown(e, p.id)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-white/90 shadow-[0_0_0_1px_rgba(15,23,42,0.55)] active:cursor-grabbing"
                      initial={false}
                      animate={{
                        left: imageRect.left + p.x * imageRect.width,
                        top: imageRect.top + p.y * imageRect.height,
                        backgroundColor: hex,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 200,
                        damping: 25,
                        mass: 0.8,
                      }}
                      style={{ width: 22, height: 22 }}
                      title={hex.toUpperCase()}
                      aria-label={`Move color picker ${i + 1}`}
                    />
                  );
                })}
            </PreviewImageBox>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}
