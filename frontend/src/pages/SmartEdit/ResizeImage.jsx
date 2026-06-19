import { useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppConfig } from '../../config';

import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/Tool/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/Tool/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import ResizeControls from '../../components/Workspace/controls/Editor/ResizeControls';

import { useWorkspaceFile } from '../../hooks/workspace/Core/useWorkspaceFile';
import { useImageResize } from '../../hooks/workspace/Editor/useImageResize';
import { generateSafeFilename } from '../../utils/file/fileUtils';

export default function ResizeImage() {
  const fileInputRef = useRef(null);

  const workspaceFile = useWorkspaceFile(fileInputRef);
  const { file, previewUrl, resultBlob, resultUrl, error, onFileChange } =
    workspaceFile;

  const {
    origWidth,
    origHeight,
    targetWidth,
    targetHeight,
    lockAspect,
    isProcessing,
    canProcess,
    previewRatio,
    handleWidthChange,
    handleHeightChange,
    toggleLock,
    applyPreset,
    applyResize,
    handleReset,
  } = useImageResize(workspaceFile);

  const downloadName = useMemo(
    () =>
      generateSafeFilename(file?.name, `${targetWidth}x${targetHeight}`, 'jpg'),
    [file?.name, targetWidth, targetHeight],
  );

  const showLiveStage =
    Boolean(previewUrl) &&
    !resultUrl &&
    Number(targetWidth) > 0 &&
    Number(targetHeight) > 0;

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-6">
            {!file ? (
              <UploadCard
                inputId="resize-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${AppConfig.MAX_FILE_SIZE_MB}MB`}
                hasActiveFile={Boolean(file)}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <ResizeControls
              origWidth={origWidth}
              origHeight={origHeight}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
              lockAspect={lockAspect}
              onWidthChange={handleWidthChange}
              onHeightChange={handleHeightChange}
              onToggleLock={toggleLock}
              onApplyPreset={applyPreset}
              disabled={!file || Boolean(resultUrl)}
            />

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Resizing...' : 'Apply Resize'}
            secondaryLabel="Upload Other Image"
            onPrimaryClick={applyResize}
            onSecondaryClick={handleReset}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={
          <h3 className="text-sm font-medium text-slate-700">
            Preview Workspace
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col bg-white rounded-xl">
            <PreviewImageBox
              previewUrl={showLiveStage ? null : previewUrl}
              resultUrl={resultUrl}
              resultAlt="Resized output preview"
            >
              {showLiveStage && (
                <div className="absolute inset-0 flex items-center justify-center p-3 pointer-events-none bg-white">
                  <div
                    className="relative max-w-full max-h-full border border-slate-200 bg-white rounded-md overflow-hidden"
                    style={{
                      aspectRatio: `${previewRatio}`,
                      width: 'min(100%, calc(100% - 8px))',
                      height: 'auto',
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="Live resize preview"
                      className="absolute inset-0 w-full h-full transition-all duration-300"
                      style={{ objectFit: lockAspect ? 'contain' : 'fill' }}
                    />
                  </div>
                </div>
              )}
            </PreviewImageBox>

            <AnimatePresence>
              {resultUrl && (
                <WorkspaceResultDownload
                  resultUrl={resultUrl}
                  resultBlob={resultBlob}
                  originalFile={file}
                  downloadName={downloadName}
                  downloadLabel={`Download ${targetWidth}x${targetHeight} Image`}
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}
