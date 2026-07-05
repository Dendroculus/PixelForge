/**
 * Background removal workspace page.
 *
 * This page wires the shared AI feature workspace to the background removal
 * pipeline. It provides feature-specific controls, a transparent-checkerboard
 * empty state, simulated progress, and download naming for no-background
 * results.
 */

import { useState } from 'react';
import AiFeatureWorkspace from '@/components/Workspace/AiFeatureWorkspace';
import RemoveBgControls from '@/components/Workspace/controls/AiFeatures/RemoveBgControls';
import { useRemBGPipeline } from '@/hooks/pipeline/useRemBGPipeline';
import { useSimulatedProgress } from '@/hooks/workspace/Core/useSimulatedProgress';
import { marketingProps } from '@/data/feature/remBgMarketing';

/**
 * Render the AI background removal tool.
 *
 * @returns {JSX.Element} Background removal workspace.
 */
export default function RemoveBG() {
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
  } = useRemBGPipeline(setProgress);

  useSimulatedProgress(isProcessing, setProgress, turnstileToken, 'rembg');

  const emptyState = (
    <div className="text-center px-4 z-10">
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
      featureName="rembg"
      featureText="background removals"
      marketingProps={marketingProps}
      onFileSelect={handleFileSelect}
      onCancel={handleCancel}
      leftControls={
        <RemoveBgControls
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
      downloadPrefix="NoBG-"
      rightPanelClassName="flex-1 min-h-105 relative rounded-2xl border border-white/50 bg-white/30 flex items-center justify-center overflow-hidden shadow-inner"
      previewImageClassName={`max-h-96 w-full object-contain p-2 z-10 transition-all duration-700 ${isProcessing ? 'scale-105 opacity-60 blur-sm' : 'opacity-100'}`}
      resultContainerClassName="w-full h-full z-10"
      emptyState={
        <>
          <div
            className="absolute inset-0 z-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), repeating-linear-gradient(45deg, #ccc 25%, #fff 25%, #fff 75%, #ccc 75%, #ccc)',
              backgroundPosition: '0 0, 10px 10px',
              backgroundSize: '20px 20px',
            }}
          />
          {emptyState}
        </>
      }
    />
  );
}
