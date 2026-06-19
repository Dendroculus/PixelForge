import { useState } from 'react';
import AiFeatureWorkspace from '@/components/Workspace/AiFeatureWorkspace';
import UpscaleControls from '@/components/Workspace/controls/AiFeatures/UpscaleControls';
import { useUpscalePipeline } from '@/hooks/pipeline/useUpscalePipeline';
import { useSimulatedProgress } from '@/hooks/workspace/Core/useSimulatedProgress';
import { marketingProps } from '@/data/feature/upscaleMarketing';

export default function UpscaleWorkspace() {
  const [progress, setProgress] = useState(0);

  const {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    handleFileSelect,
    handleCancel,
    handleUpscale,
    turnstileRef,
    setTurnstileToken,
    turnstileToken,
    appAlert,
    setAppAlert,
    usesRemaining,
    resetTimestamp,
    isLoading,
    scale,
    setScale,
    maxLimit,
    isWaitingForToken,
  } = useUpscalePipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken, 'upscale');

  return (
    <AiFeatureWorkspace
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
      featureName="upscale"
      featureText="upscales"
      marketingProps={marketingProps}
      onFileSelect={handleFileSelect}
      onCancel={handleCancel}
      leftControls={
        <UpscaleControls
          isProcessing={isProcessing}
          isWaitingForToken={isWaitingForToken}
          resultUrl={resultUrl}
          progress={progress}
          jobId={jobId}
          handleCancel={handleCancel}
          handleUpscale={handleUpscale}
          turnstileRef={turnstileRef}
          setTurnstileToken={setTurnstileToken}
          scale={scale}
          setScale={setScale}
        />
      }
      downloadPrefix="4K-"
      rightPanelClassName="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner"
      previewImageClassName={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
      resultContainerClassName="w-full h-full"
    />
  );
}
