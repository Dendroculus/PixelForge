import { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AppConfig } from '@/config';
import UploadCard from '@/components/Upload/UploadCard';
import ToolWorkspaceShell from '@/components/Layout/Tool/ToolWorkspaceShell';
import ToolPageWrapper from '@/components/Layout/Tool/ToolPageWrapper';
import PreviewImageBox from '@/components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '@/components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '@/components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '@/components/Actions/WorkspaceActionRow';
import FormatDropdown from '@/components/Workspace/controls/Convert/FormatDropdown';
import ClientSideHeader from '@/components/Workspace/Header/ClientSideHeader';
import AppModals from '@/components/Common/AppModals';
import { useWorkspaceFile } from '@/hooks/workspace/Core/useWorkspaceFile';
import useImageConversion from '@/hooks/client/useImageConversion';
import {
  bytesToMB,
  generateSafeFilename,
  isSameExtension,
} from '@/utils/file/fileUtils';

/** @constant {string} DEFAULT_FORMAT - Default target format on mount and after reset. */
const DEFAULT_FORMAT = 'png';

/** @constant {number} DEFAULT_QUALITY - Default quality value (0–1 scale) on mount and after reset. */
const DEFAULT_QUALITY = 0.92;

/**
 * Page component for converting image formats entirely on the client side.
 *
 * Allows users to upload an image, select a target format, adjust output
 * quality, and download the converted result. Resetting clears only the
 * conversion output and control settings — the uploaded file is preserved
 * so the user can convert to a different format without re-uploading.
 *
 * Attempting to convert a file to the same format it was uploaded in opens
 * a confirmation modal rather than proceeding with a no-op conversion.
 *
 * @returns {JSX.Element}
 */
export default function ConvertFormat() {
  const fileInputRef = useRef(null);

  const [targetFormat, setTargetFormat] = useState(DEFAULT_FORMAT);
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  const { isConverting, setIsConverting, convertImage } = useImageConversion({
    file,
    targetFormat,
    quality,
    cleanupResult,
    setResultBlob,
    setResultUrl,
    setError,
  });

  /**
   * Handles the convert button click. Opens a warning modal if the selected
   * target format matches the uploaded file's current extension, otherwise
   * proceeds with the conversion.
   */
  const handleConvertClick = useCallback(() => {
    if (!file) return;

    if (isSameExtension(file.name, targetFormat)) {
      setIsModalOpen(true);
      return;
    }

    convertImage();
  }, [file, targetFormat, convertImage]);

  /**
   * Resets the conversion output, format selection, and quality slider back
   * to their defaults. The uploaded file and its preview are intentionally
   * preserved so the user can adjust settings and re-convert without
   * re-uploading.
   */
  const handleReset = useCallback(() => {
    cleanupResult();
    setResultBlob(null);
    setResultUrl(null);
    setError(null);
    setTargetFormat(DEFAULT_FORMAT);
    setQuality(DEFAULT_QUALITY);
    setIsConverting(false);
  }, [cleanupResult, setResultBlob, setResultUrl, setError, setIsConverting]);

  const canConvert = useMemo(
    () => Boolean(file) && !isConverting,
    [file, isConverting],
  );
  const downloadName = useMemo(
    () => generateSafeFilename(file?.name, 'converted', targetFormat),
    [file?.name, targetFormat],
  );

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
                helperText={`Any format up to ${AppConfig.MAX_FILE_SIZE_MB}MB`}
                hasActiveFile={Boolean(file)}
              />
              <WorkspaceFileSummary file={file} />
            </div>

            <div className="mb-4 grid grid-cols-2 gap-6">
              <FormatDropdown
                value={targetFormat}
                options={AppConfig.ALLOWED_EXTENSIONS}
                onChange={setTargetFormat}
                label="Convert To"
                buttonClassName="flex w-full items-center justify-between rounded-xl border border-white/60 bg-white/60 px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm outline-none transition-all hover:bg-white/80 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                optionClassName="font-bold"
              />

              <div
                className={`flex flex-col justify-center transition-opacity duration-300 ${targetFormat === 'png' ? 'pointer-events-none opacity-30' : 'opacity-100'}`}
              >
                <label className="mb-2 flex w-full items-center justify-between text-sm font-bold text-slate-700">
                  <span>Quality</span>
                  <span className="text-indigo-600">
                    {Math.round(quality * 100)}%
                  </span>
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
            onPrimaryClick={handleConvertClick}
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
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Converted output preview"
            />
            {resultUrl ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 shrink-0"
              >
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

      <AppModals
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invalid Conversion"
      >
        <p>
          You already uploaded a file with this extension. Converting to the
          same format is not allowed.
        </p>
      </AppModals>
    </ToolPageWrapper>
  );
}
