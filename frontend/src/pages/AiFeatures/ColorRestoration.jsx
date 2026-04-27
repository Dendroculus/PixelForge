import { useState } from 'react';
import AiFeatureWorkspace from '../../components/Workspace/AiFeatureWorkspace';
import ColorRestoreControls from '../../components/Workspace/controls/ColorRestoreControls';
import { useColorRestorePipeline } from '../../hooks/pipeline/useColorRestorePipeline';
import { useSimulatedProgress } from '../../hooks/workspace/useSimulatedProgress';
import { marketingProps } from '../../data/feature/colorRestoreMarketing';

export default function ColorRestoration() {
  const [progress, setProgress] = useState(0);

  const {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    handleFileSelect,
    handleCancel,
    handleProcess,
    turnstileRef,
    setTurnstileToken,
    turnstileToken,
    appAlert,
    setAppAlert,
    usesRemaining,
    resetTimestamp,
    isLoading,
    maxLimit,
    isWaitingForToken,
  } = useColorRestorePipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken, 'colorrestore');

  return (
    <AiFeatureWorkspace
      rejectGrayscale={true}
      selectedFile={selectedFile}
      previewUrl={previewUrl}
      isProcessing={isProcessing}
      resultUrl={resultUrl}
      jobId={jobId}
      usesRemaining={usesRemaining}
      resetTimestamp={resetTimestamp}
      isLoading={isLoading}
      maxLimit={maxLimit}
      appAlert={appAlert}
      setAppAlert={setAppAlert}
      featureName="colorrestore"
      featureText="color restorations"
      marketingProps={marketingProps}
      onFileSelect={handleFileSelect}
      onCancel={handleCancel}
      leftControls={
        <ColorRestoreControls
          isProcessing={isProcessing}
          isWaitingForToken={isWaitingForToken}
          resultUrl={resultUrl}
          progress={progress}
          jobId={jobId}
          handleCancel={handleCancel}
          handleProcess={handleProcess}
          turnstileRef={turnstileRef}
          setTurnstileToken={setTurnstileToken}
        />
      }
      downloadPrefix="Colorized-"
      rightPanelClassName="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner"
      previewImageClassName={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
      resultContainerClassName="w-full h-full"
    />
  );
}