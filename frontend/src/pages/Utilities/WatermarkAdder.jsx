import { useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppConfig, FontFamilies, WatermarkColors } from '@/config';

import UploadCard from '@/components/Upload/UploadCard';
import ToolWorkspaceShell from '@/components/Layout/Tool/ToolWorkspaceShell';
import ToolPageWrapper from '@/components/Layout/Tool/ToolPageWrapper';
import PreviewImageBox from '@/components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '@/components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '@/components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '@/components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '@/components/Workspace/display/WorkspaceResultDownload';
import ClientSideHeader from '@/components/Workspace/Header/ClientSideHeader';
import WatermarkModeTabs from '@/components/Workspace/controls/Watermark/WatermarkModeTabs';
import TextWatermarkControls from '@/components/Workspace/controls/Watermark/TextWatermarkControls';
import ImageWatermarkControls from '@/components/Workspace/controls/Watermark/ImageWatermarkControls';
import WatermarkPreviewOverlay from '@/components/Workspace/display/WatermarkPreviewOverlay';

import { useWatermark } from '@/hooks/workspace/Watermark/useWatermark';
import { generateSafeFilename } from '@/utils/file/fileUtils';

export default function WatermarkAdder() {
  const { refs, workspaceFile, state, actions } = useWatermark();
  const {
    fileInputRef,
    watermarkImageRef,
    imageRef,
    previewContainerRef,
    overlayRef,
  } = refs;
  const {
    file,
    previewUrl,
    resultBlob,
    resultUrl,
    error,
    setError,
    onFileChange,
  } = workspaceFile;
  const {
    activeTab,
    isProcessing,
    overlayPos,
    isOverlaySelected,
    textWm,
    imgWm,
    dragBounds,
    canProcess,
  } = state;

  useEffect(() => {
    const linkId = 'watermark-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Inter:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Nunito:wght@400;700&family=Open+Sans:wght@400;700&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Roboto:wght@400;700&family=Ubuntu:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const downloadName = useMemo(
    () => generateSafeFilename(file?.name, 'watermarked', 'jpg'),
    [file?.name],
  );

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-4">
            {!file ? (
              <UploadCard
                inputId="wm-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${AppConfig.MAX_FILE_SIZE_MB}MB`}
                hasActiveFile={false}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div
              className={`space-y-3 transition-opacity duration-300 ${!file || resultUrl ? 'pointer-events-none opacity-40' : 'opacity-100'}`}
            >
              <WatermarkModeTabs
                activeTab={activeTab}
                setActiveTab={actions.setActiveTab}
              />

              {activeTab === 'text' && (
                <TextWatermarkControls
                  textWm={textWm}
                  setTextWm={actions.setTextWm}
                  fontFamilies={FontFamilies}
                  watermarkColors={WatermarkColors}
                />
              )}

              {activeTab === 'image' && (
                <ImageWatermarkControls
                  watermarkImageRef={watermarkImageRef}
                  handleWatermarkImageUpload={
                    actions.handleWatermarkImageUpload
                  }
                  onRemoveWatermarkImage={actions.handleRemoveWatermarkImage}
                  imgWm={imgWm}
                  setImgWm={actions.setImgWm}
                  setError={setError}
                />
              )}
            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Applying...' : 'Add Watermark'}
            secondaryLabel="Reset"
            onPrimaryClick={actions.applyWatermark}
            onSecondaryClick={actions.handleReset}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={
          <h3 className="text-sm font-medium text-slate-700">
            Preview Workspace
          </h3>
        }
        rightBody={
          <div className="absolute inset-0 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Watermarked output preview"
              containerRef={previewContainerRef}
            >
              {previewUrl && !resultUrl && (
                <>
                  <img
                    src={previewUrl}
                    ref={imageRef}
                    alt="Base workspace"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
                    onLoad={actions.updateImageRect}
                  />

                  <WatermarkPreviewOverlay
                    overlayRef={overlayRef}
                    overlayPos={overlayPos}
                    activeTab={activeTab}
                    textWm={textWm}
                    imgWm={imgWm}
                    dragBounds={dragBounds}
                    imageRect={state.imageRect}
                    isSelected={isOverlaySelected}
                    onSelect={() => actions.setIsOverlaySelected(true)}
                    onDelete={actions.handleDeleteSelected}
                  />
                </>
              )}
            </PreviewImageBox>

            <AnimatePresence>
              {resultUrl && (
                <WorkspaceResultDownload
                  resultUrl={resultUrl}
                  resultBlob={resultBlob}
                  originalFile={file}
                  downloadName={downloadName}
                  downloadLabel="Download Protected Image"
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}
