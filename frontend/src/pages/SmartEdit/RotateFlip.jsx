import { useMemo, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppConfig } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import RotateFlipControls from '../../components/Workspace/controls/RotateFlipControls';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { useRotateFlip } from '../../hooks/workspace/useRotateFlip';
import { generateSafeFilename } from '../../utils/file/fileUtils';

export default function RotateFlip() {
  const fileInputRef = useRef(null);

  const workspaceState = useWorkspaceFile(fileInputRef);
  
  const {
    rotation,
    flipH,
    flipV,
    isProcessing,
    handleRotateLeft,
    handleRotateRight,
    handleFlipHorizontal,
    handleFlipVertical,
    applyTransform,
    resetTransform
  } = useRotateFlip({
    file: workspaceState.file,
    previewUrl: workspaceState.previewUrl,
    setResultBlob: workspaceState.setResultBlob,
    setResultUrl: workspaceState.setResultUrl,
    setError: workspaceState.setError,
    cleanupResult: workspaceState.cleanupResult
  });

  const handleResetAll = useCallback(() => {
    workspaceState.resetAll();
    resetTransform();
  }, [workspaceState, resetTransform]);

  const canProcess = useMemo(() => 
    Boolean(workspaceState.file) && !isProcessing && !workspaceState.resultUrl, 
  [workspaceState.file, isProcessing, workspaceState.resultUrl]);
  
  const downloadName = useMemo(() => 
    generateSafeFilename(workspaceState.file?.name, 'rotated', 'jpg'), 
  [workspaceState.file?.name]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!workspaceState.file ? (
              <UploadCard
                inputId="rf-file-input"
                inputRef={fileInputRef}
                onChange={workspaceState.onFileChange}
                helperText={`Any format up to ${AppConfig.MAX_FILE_SIZE_MB}MB`}
                hasActiveFile={Boolean(workspaceState.file)}
              />
            ) : (
              <WorkspaceFileSummary file={workspaceState.file} />
            )}

            <RotateFlipControls 
              onRotateLeft={handleRotateLeft}
              onRotateRight={handleRotateRight}
              onFlipHorizontal={handleFlipHorizontal}
              onFlipVertical={handleFlipVertical}
              disabled={!workspaceState.file || workspaceState.resultUrl}
            />

            <WorkspaceErrorAlert error={workspaceState.error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Processing...' : 'Apply Transform'}
            secondaryLabel="Upload Other Image"
            onPrimaryClick={applyTransform}
            onSecondaryClick={handleResetAll}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={workspaceState.previewUrl}
              resultUrl={workspaceState.resultUrl}
              resultAlt="Transformed output preview"
            >
              {workspaceState.previewUrl && !workspaceState.resultUrl && (
                 <div className="absolute inset-0 z-10 bg-white flex items-center justify-center overflow-hidden rounded-xl">
                   <img
                     src={workspaceState.previewUrl}
                     alt="Live CSS Preview"
                     className="h-full w-full object-contain pointer-events-none transition-transform duration-300 ease-out"
                     style={{
                       transform: `rotate(${rotation}deg) scaleX(${flipH}) scaleY(${flipV})`
                     }}
                   />
                 </div>
              )}
            </PreviewImageBox>

            <AnimatePresence>
              {workspaceState.resultUrl && (
                <WorkspaceResultDownload
                  resultUrl={workspaceState.resultUrl}
                  resultBlob={workspaceState.resultBlob}
                  originalFile={workspaceState.file}
                  downloadName={downloadName}
                  downloadLabel="Download Transformed Image"
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}