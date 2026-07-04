import { useRef, useState } from 'react';
import AiFeatureWorkspace from '@/components/Workspace/AiFeatureWorkspace';
import ObjectRemoveControls from '@/components/Workspace/controls/AiFeatures/ObjectRemoveControls';
import ObjectRemoveMaskCanvas from '@/components/Workspace/display/ObjectRemoveMaskCanvas';
import { useObjectRemovePipeline } from '@/hooks/pipeline/useObjectRemovePipeline';
import { useSimulatedProgress } from '@/hooks/workspace/Core/useSimulatedProgress';
import { marketingProps } from '@/data/feature/remBgMarketing';

const BRUSH_MIN = 8;
const BRUSH_MAX = 96;

const BRUSH_PRESETS = [
  { label: 'Fine', value: 16 },
  { label: 'Normal', value: 32 },
  { label: 'Wide', value: 64 },
];

export default function ObjectRemover() {
  const [progress, setProgress] = useState(0);
  const [hasMask, setHasMask] = useState(false);
  const [brushSize, setBrushSize] = useState(32);

  const maskCanvasRef = useRef(null);

  const brushProgress =
    ((brushSize - BRUSH_MIN) / (BRUSH_MAX - BRUSH_MIN)) * 100;

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

  const handleObjectRemove = async () => {
    const maskBlob = await maskCanvasRef.current?.getMaskBlob();

    if (!maskBlob) {
      setAppAlert({ show: true, type: 'missing_mask' });
      return;
    }

    handleProcess(null, { maskBlob });
  };

  const handleObjectRemoveCancel = async () => {
    setHasMask(false);
    maskCanvasRef.current?.clearMask();
    await handleCancel();
  };

  const handleObjectRemoveFileSelect = async (file) => {
    setHasMask(false);
    await handleFileSelect(file);
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
      onFileSelect={handleObjectRemoveFileSelect}
      onCancel={handleObjectRemoveCancel}
      leftControls={
        <div className="flex flex-col gap-4">
          {!isProcessing && !resultUrl && (
            <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <label
                    htmlFor="brushSize"
                    className="text-xs font-black uppercase tracking-[0.18em] text-slate-500"
                  >
                    Brush Size
                  </label>

                  <p className="mt-1 text-xs text-slate-500">
                    {hasMask
                      ? 'Mask ready. Refine if needed.'
                      : 'Paint the object area first.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                  <span
                    className="rounded-full bg-blue-500"
                    style={{
                      width: `${Math.max(8, Math.min(18, brushSize / 4))}px`,
                      height: `${Math.max(8, Math.min(18, brushSize / 4))}px`,
                    }}
                  />

                  <span className="text-xs font-bold text-slate-600">
                    {brushSize}px
                  </span>
                </div>
              </div>

              <input
                id="brushSize"
                type="range"
                min={BRUSH_MIN}
                max={BRUSH_MAX}
                value={brushSize}
                aria-label="Brush size"
                aria-valuetext={`${brushSize}px brush size`}
                onChange={(event) => setBrushSize(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600 outline-none"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${brushProgress}%, #e2e8f0 ${brushProgress}%, #e2e8f0 100%)`,
                }}
              />

              <div className="mt-3 flex gap-2">
                {BRUSH_PRESETS.map((preset) => {
                  const isActive = brushSize === preset.value;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setBrushSize(preset.value)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                        isActive
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
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
            key={previewUrl}
            ref={maskCanvasRef}
            imageUrl={previewUrl}
            disabled={isProcessing}
            brushSize={brushSize}
            onMaskChange={setHasMask}
          />
        ) : null
      }
    />
  );
}