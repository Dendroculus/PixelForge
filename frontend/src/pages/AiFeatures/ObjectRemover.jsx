import { useState } from 'react';
import AiFeatureWorkspace from '@/components/Workspace/AiFeatureWorkspace';
import ObjectRemoveControls from '@/components/Workspace/controls/AiFeatures/ObjectRemoveControls';
import ObjectRemoveMaskCanvas from '@/components/Workspace/display/ObjectRemoveMaskCanvas';
import { useObjectRemovePipeline } from '@/hooks/pipeline/useObjectRemovePipeline';
import { useSimulatedProgress } from '@/hooks/workspace/Core/useSimulatedProgress';
import { marketingProps } from '@/data/feature/remBgMarketing';

export default function ObjectRemover() {
  const [progress, setProgress] = useState(0);
  const [maskBlob, setMaskBlob] = useState(null);
  const [brushSize, setBrushSize] = useState(32);

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
  } = useObjectRemovePipeline(setProgress);

  useSimulatedProgress(
    isProcessing,
    setProgress,
    turnstileToken,
    'objectremove',
  );

  const handleObjectRemove = () => {
    if (!maskBlob) {
      setAppAlert({ show: true, type: 'dos' });
      return;
    }

    handleProcess(null, { maskBlob });
  };

  const handleObjectRemoveCancel = async () => {
    setMaskBlob(null);
    await handleCancel();
  };

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
      featureName="objectremove"
      featureText="object removals"
      marketingProps={marketingProps}
      onFileSelect={handleFileSelect}
      onCancel={handleObjectRemoveCancel}
      leftControls={
        <div className="flex flex-col gap-4">
          {!isProcessing && !resultUrl && (
            <div>
              <label htmlFor="brushSize" className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Brush Size
              </label>

              <input
                id="brushSize"
                type="range"
                min="8"
                max="96"
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="w-full"
              />

              <p className="text-xs text-slate-500 mt-1">
                Paint over the object you want PixelForge to remove.
              </p>
            </div>
          )}

          <ObjectRemoveControls
            isProcessing={isProcessing}
            isWaitingForToken={isWaitingForToken}
            resultUrl={resultUrl}
            progress={progress}
            jobId={jobId}
            handleCancel={handleObjectRemoveCancel}
            handleProcess={handleObjectRemove}
            turnstileRef={turnstileRef}
            setTurnstileToken={setTurnstileToken}
          />
        </div>
      }
      downloadPrefix="ObjectRemoved-"
      rightPanelClassName="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner"
      previewImageClassName={`max-h-96 w-full object-contain p-2 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
      resultContainerClassName="w-full h-full"
      previewOverride={
        previewUrl && !resultUrl ? (
          <ObjectRemoveMaskCanvas
            imageUrl={previewUrl}
            disabled={isProcessing}
            brushSize={brushSize}
            onMaskChange={setMaskBlob}
          />
        ) : null
      }
    />
  );
}