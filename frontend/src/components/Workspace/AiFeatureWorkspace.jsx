import { useState } from 'react';
import PropTypes from 'prop-types';
import WorkspaceLayout from '../Layout/Tool/WorkspaceLayout';
import UploadDropzone from '@/components/Upload/UploadDropzone';
import ResultViewer from '@/components/Workspace/display/ResultViewer/ResultViewer';
import WorkspaceModals from '@/content/modals/WorkspaceModals';
import WorkspaceLimitCard from './cards/WorkspaceLimitCard';
import WorkspaceMarketing from './cards/WorkspaceMarketing';
import StagedFileCard from './cards/StagedFileCard';
import ResultActions from '../Actions/ResultActions';
import { AppConfig as config, RESULT_LABELS } from '@/config';

/**
 * Reusable AI feature workspace shell for upload, processing, preview, and result actions.
 */
export default function AiFeatureWorkspace({
  selectedFile,
  previewUrl,
  isProcessing,
  resultUrl,
  jobId,
  usesRemaining,
  resetTimestamp,
  isLoading,
  maxLimit,
  appAlert,
  setAppAlert,
  featureName,
  featureText,
  marketingProps,
  onFileSelect,
  onCancel,
  leftControls,
  supportsList = config.ALLOWED_EXTENSIONS,
  downloadPrefix = 'Result-',
  emptyState = null,
  rightPanelClassName = 'flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner isolate',
  previewImageClassName = '',
  resultContainerClassName = 'w-full h-full rounded-2xl overflow-hidden',
  requireGrayscale = false,
  previewOverride = null,
}) {
  const [isResultLoaded, setIsResultLoaded] = useState(false);

  const showLimitCard =
    !selectedFile &&
    !isProcessing &&
    !jobId &&
    !isLoading &&
    usesRemaining <= 0;
  const showLoadingCard = !selectedFile && !isProcessing && !jobId && isLoading;

  let rightPanelContent = null;

  if (selectedFile) {
    if (resultUrl) {
      rightPanelContent = (
        <div className={resultContainerClassName}>
          <ResultViewer
            originalImage={previewUrl}
            processedImage={resultUrl}
            onImageLoad={() => setIsResultLoaded(true)}
            resultLabel={RESULT_LABELS[featureName] ?? 'Processed'}
          />
        </div>
      );
    } else {
      rightPanelContent = previewOverride || (
        <img
          src={previewUrl}
          alt="Upload preview"
          className={previewImageClassName}
        />
      );
    }
  } else {
    rightPanelContent = emptyState || (
      <div className="text-center px-4">
        <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mx-auto mb-3 shadow-sm border border-white">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-400">Workspace is empty</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="flex-1 w-full max-w-6xl mx-auto px-4 pt-6 pb-16">
        {showLoadingCard || showLimitCard ? (
          <WorkspaceLimitCard
            showLoading={showLoadingCard}
            showLimit={showLimitCard}
            maxLimit={maxLimit}
            resetTimestamp={resetTimestamp}
            featureText={featureText}
          />
        ) : (
          <WorkspaceLayout
            leftPanel={
              <div className="flex flex-col h-full min-h-72">
                <div className="flex items-center gap-2 mb-5">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black tracking-wider uppercase border border-indigo-200 shadow-sm">
                    AI Powered
                  </span>
                </div>

                {!selectedFile ? (
                  <div className="flex flex-col flex-1 justify-center pb-4">
                    <UploadDropzone
                      onFileSelect={onFileSelect}
                      requireGrayscale={requireGrayscale}
                    />
                    {!isProcessing && !jobId && (
                      <div className="text-center mt-5 text-sm font-medium text-slate-500">
                        Free Uses Remaining:{' '}
                        <span className="font-bold text-slate-700 bg-white/60 px-2 py-0.5 rounded-md border border-white/80 ml-1">
                          {usesRemaining} / {maxLimit}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 justify-center relative w-full py-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-linear-to-tr from-indigo-300/20 via-purple-300/10 to-emerald-300/20 blur-3xl rounded-full pointer-events-none -z-10" />

                    <div className="relative bg-white/50 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-slate-200/50 rounded-4xl p-5 sm:p-6 overflow-hidden w-full max-w-md mx-auto">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNCkiLz48L3N2Zz4=')] opacity-60 pointer-events-none" />

                      <div className="relative z-10 flex flex-col gap-6">
                        <StagedFileCard
                          selectedFile={selectedFile}
                          isProcessing={isProcessing}
                          resultUrl={resultUrl}
                        />

                        <div className="bg-white/60 rounded-2xl p-4 border border-white shadow-sm">
                          {leftControls}
                          <ResultActions
                            resultUrl={resultUrl}
                            selectedFile={selectedFile}
                            isResultLoaded={isResultLoaded}
                            handleCancel={onCancel}
                            downloadPrefix={downloadPrefix}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            }
            rightPanel={
              <div className={rightPanelClassName}>{rightPanelContent}</div>
            }
          />
        )}

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-600 font-medium">
          <span>Supports:</span>
          {supportsList.map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded bg-white/40 border border-white/50 text-slate-600 font-mono"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      <WorkspaceMarketing {...marketingProps} />
      <WorkspaceModals
        appAlert={appAlert}
        setAppAlert={setAppAlert}
        featureName={featureName}
      />
    </div>
  );
}

AiFeatureWorkspace.propTypes = {
  selectedFile: PropTypes.object,
  previewUrl: PropTypes.string,
  isProcessing: PropTypes.bool.isRequired,
  resultUrl: PropTypes.string,
  jobId: PropTypes.string,
  usesRemaining: PropTypes.number.isRequired,
  resetTimestamp: PropTypes.number,
  isLoading: PropTypes.bool.isRequired,
  maxLimit: PropTypes.number.isRequired,
  appAlert: PropTypes.object.isRequired,
  setAppAlert: PropTypes.func.isRequired,
  featureName: PropTypes.string.isRequired,
  featureText: PropTypes.string.isRequired,
  marketingProps: PropTypes.shape({
    subtitle: PropTypes.string.isRequired,
    features: PropTypes.array.isRequired,
    steps: PropTypes.array.isRequired,
  }).isRequired,
  onFileSelect: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  leftControls: PropTypes.node.isRequired,
  supportsList: PropTypes.arrayOf(PropTypes.string),
  downloadPrefix: PropTypes.string,
  emptyState: PropTypes.node,
  rightPanelClassName: PropTypes.string,
  previewImageClassName: PropTypes.string,
  resultContainerClassName: PropTypes.string,
  requireGrayscale: PropTypes.bool,
  previewOverride: PropTypes.node,
};
