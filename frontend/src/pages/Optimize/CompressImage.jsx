import { useCallback, useMemo, useRef, useState } from 'react';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import useImageCompression from '../../hooks/client/useImageCompression';
import { generateSafeFilename } from '../../utils/file/fileUtils';

/**
 * React component for compressing image files on the client side.
 * @returns {JSX.Element} The CompressImage component.
 */
export default function CompressImage() {
  const fileInputRef = useRef(null);

  const {
    file,
    previewUrl,
    resultBlob,
    setResultBlob,
    resultUrl,
    setResultUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  const [quality, setQuality] = useState(0.6);

  const {
    isCompressing,
    setIsCompressing,
    compressImage,
  } = useImageCompression({
    file,
    quality,
    cleanupResult,
    setResultBlob,
    setResultUrl,
    setError,
  });

  const handleReset = useCallback(() => {
    resetAll();
    setIsCompressing(false);
  }, [resetAll, setIsCompressing]);

  const canCompress = useMemo(() => Boolean(file) && !isCompressing, [file, isCompressing]);
  const downloadName = useMemo(() => generateSafeFilename(file?.name, 'min', 'jpg'), [file?.name]);

  const savingsPercent = useMemo(() => {
    if (!file || !resultBlob) return 0;
    const diff = file.size - resultBlob.size;
    if (diff <= 0) return 0;
    return Math.round((diff / file.size) * 100);
  }, [file, resultBlob]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <>
            <div className="mb-4">
              <UploadCard
                inputId="compress-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.COMPRESS_MAX_SIZE_MB}MB`}
                maxSizeMB={APP_CONFIG.COMPRESS_MAX_SIZE_MB}
              />
              <WorkspaceFileSummary file={file} />
            </div>

            <div className="mb-4 flex flex-col justify-center">
              <label className="mb-4 flex w-full items-center justify-between text-sm font-bold text-slate-700">
                <span>Compression Level</span>
                <span className="text-indigo-600">{Math.round((1 - quality) * 100)}%</span>
              </label>
              <div className="px-1 pt-1">
                <input
                  id="compression-range"
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={1 - quality}
                  onChange={(e) => setQuality(1 - Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                />
                <div className="mt-2 flex w-full justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>High Quality</span>
                  <span>Small File</span>
                </div>
              </div>
            </div>

            <WorkspaceErrorAlert error={error} />
          </>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isCompressing ? 'Compressing...' : 'Compress Image'}
            secondaryLabel="Reset"
            onPrimaryClick={compressImage}
            onSecondaryClick={handleReset}
            primaryDisabled={!canCompress}
          />
        }
        rightHeader={
          <h3 className="flex items-center justify-between text-sm font-bold text-slate-800">
            Preview Workspace
            {resultBlob && savingsPercent > 0 && (
              <span className="rounded-md border border-emerald-200 bg-emerald-100/50 px-2 py-1 text-xs font-semibold text-emerald-600">
                Saved {savingsPercent}%
              </span>
            )}
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Compressed output preview"
            />
            <WorkspaceResultDownload
              resultUrl={resultUrl}
              resultBlob={resultBlob}
              originalFile={file}
              downloadName={downloadName}
              downloadLabel="Download Compressed Image"
            />
          </div>
        }
      />
    </ToolPageWrapper>
  );
}