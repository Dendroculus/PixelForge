import { useRef } from 'react';
import { AppConfig } from '../../config';

import UploadCard              from '../../components/Upload/UploadCard';
import ToolWorkspaceShell      from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper         from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox         from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary    from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert     from '../../components/Workspace/display/WorkspaceErrorAlert';
import ClientSideHeader        from '../../components/Workspace/Header/ClientSideHeader';
import FitModeToggle           from '../../components/Workspace/controls/FitModeToggle';
import Magnifier, { ZoomButton } from '../../components/Workspace/controls/Magnifier';
import ImageEditorFilters      from '../../components/Workspace/controls/ImageEditorFilters';

import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { useImageEditor   } from '../../hooks/workspace/useImageEditor';

export default function ImageEditor() {
  const fileInputRef  = useRef(null);
  const workspaceFile = useWorkspaceFile(fileInputRef);
  const { file, previewUrl, error, onFileChange } = workspaceFile;

  const {
    filters,
    isProcessing,
    isPreviewing,
    fitMode,
    previewDataUrl,
    canProcess,
    handleFilterChange,
    resetFilters,
    handleReset,
    toggleFitMode,
    applyFilters,
  } = useImageEditor(workspaceFile);

  // Show the canvas-rendered preview when ready, fall back to the raw source
  // while the first render is in flight.
  const displayUrl = previewDataUrl ?? previewUrl;

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
                helperText={`Any format up to ${AppConfig.MAX_FILE_SIZE_MB}MB`}
                hasActiveFile={Boolean(file)}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-6 transition-opacity duration-300 ${!file ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <ImageEditorFilters filters={filters} onFilterChange={handleFilterChange} />
            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <div className="flex gap-2 w-full">
            <button
              onClick={handleReset}
              disabled={!file || isProcessing}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                !file || isProcessing
                  ? 'text-slate-300 cursor-not-allowed bg-transparent'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              Edit Another
            </button>
            <button
              onClick={resetFilters}
              disabled={!file || isProcessing}
              className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                !file || isProcessing
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
              previewUrl={displayUrl}
              resultUrl={null}
              resultAlt="Edited output preview"
              previewClassName="hidden"
              processingClassName="hidden"
            >
              {displayUrl && (
                <Magnifier
                  containerClassName="absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
                  innerClassName={`relative h-full w-full transition-all duration-200 ${
                    isProcessing || isPreviewing
                      ? 'scale-105 opacity-60 blur-[1px] grayscale-[0.1]'
                      : ''
                  }`}
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
                          isZoomed
                            ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-white/90 border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white'
                        }`}
                      />
                    </div>
                  )}
                >
                  {() => (
                    <img
                      src={displayUrl}
                      alt="Edited preview"
                      className={`h-full w-full pointer-events-none ${
                        fitMode === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                    />
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