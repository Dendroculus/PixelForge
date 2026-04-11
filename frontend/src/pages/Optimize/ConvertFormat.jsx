import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import FormatDropdown from '../../components/Workspace/controls/FormatDropdown';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import useImageConversion from '../../hooks/client/useImageConversion';
import { bytesToMB, generateSafeFilename } from '../../utils/fileUtils';

/**
 * React component for converting image formats on the client side.
 * @returns {JSX.Element} The ConvertFormat component.
 */
export default function ConvertFormat() {
  const fileInputRef = useRef(null);

  const [targetFormat, setTargetFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);

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

  const {
    isConverting,
    setIsConverting,
    convertImage,
  } = useImageConversion({
    file,
    targetFormat,
    quality,
    cleanupResult,
    setResultBlob,
    setResultUrl,
    setError,
  });

  const handleReset = useCallback(() => {
    resetAll();
    setIsConverting(false);
  }, [resetAll, setIsConverting]);

  const canConvert = useMemo(() => Boolean(file) && !isConverting, [file, isConverting]);
  const downloadName = useMemo(() => generateSafeFilename(file?.name, 'converted', targetFormat), [file?.name, targetFormat]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <>
            <div className="mb-4">
              <UploadCard
                inputId="convert-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`}
              />
              <WorkspaceFileSummary file={file} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-6">
              <FormatDropdown
                value={targetFormat}
                options={APP_CONFIG.ALLOWED_EXTENSIONS}
                onChange={setTargetFormat}
                label="Convert To"
                buttonClassName="flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none transition-all hover:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                optionClassName="font-bold"
              />

              <div className={`flex flex-col justify-center transition-opacity duration-300 ${targetFormat === 'png' ? 'pointer-events-none opacity-30' : 'opacity-100'}`}>
                <label className="mb-2 flex w-full items-center justify-between text-sm font-bold text-slate-700">
                  <span>Quality</span>
                  <span className="text-indigo-600">{Math.round(quality * 100)}%</span>
                </label>
                <div className="pt-1">
                  <input
                    id="quality-range"
                    type="range"
                    min="0.6"
                    max="1"
                    step="0.01"
                    value={quality}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <WorkspaceErrorAlert error={error} />
          </>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isConverting ? 'Converting...' : 'Convert Image'}
            secondaryLabel="Reset"
            onPrimaryClick={convertImage}
            onSecondaryClick={handleReset}
            primaryDisabled={!canConvert}
          />
        }
        rightHeader={
          <h3 className="flex items-center justify-between text-sm font-bold text-slate-800">
            Preview Workspace
            {resultBlob && (
              <span className="rounded-md border border-emerald-200 bg-emerald-100/50 px-2 py-1 text-xs font-semibold text-emerald-600">
                Ready: {bytesToMB(resultBlob.size)} MB
              </span>
            )}
          </h3>
        }
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox previewUrl={previewUrl} resultUrl={resultUrl} resultAlt="Converted output preview" />
            {resultUrl ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 shrink-0">
                <a
                  href={resultUrl}
                  download={downloadName}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
                >
                  Download {targetFormat.toUpperCase()}
                </a>
              </motion.div>
            ) : null}
          </div>
        }
      />
    </ToolPageWrapper>
  );
}