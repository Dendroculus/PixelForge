import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { useUpscaleActions } from './useUpscaleActions';
import { useSessionPersistence } from './useSessionPersistence';
import { useUsageLimit } from './useUsageLimit';
import { STORAGE_KEYS } from '../config';

/**
 * Orchestrates the full client-side upscale pipeline state:
 * - selected file and preview
 * - processing state/result state
 * - turnstile token and reset behavior
 * - session persistence integration
 * - usage-limit integration
 *
 * @param {(value: number | ((prev: number) => number)) => void} setProgress - Setter for global progress percentage.
 * @returns {{
 *   selectedFile: File|null,
 *   previewUrl: string|null,
 *   isProcessing: boolean,
 *   resultUrl: string|null,
 *   jobId: string|null,
 *   turnstileToken: string|null,
 *   setTurnstileToken: (token: string|null) => void,
 *   turnstileRef: import('react').MutableRefObject<any>,
 *   handleFileSelect: (file: File) => Promise<void>,
 *   handleCancel: () => Promise<void>,
 *   handleUpscale: (...args: any[]) => Promise<void>
 *   appAlert: {show: boolean, type: string|null},
 *   setAppAlert: (value: {show: boolean, type: string|null}) => void,
 *   usesRemaining: number,
 *   resetTimestamp: number|null,
 *   isLoading: boolean
 * }}
 */
export function useUpscalePipeline(setProgress) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [scale, setScale] = useState(2);

  const [appAlert, setAppAlert] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERT);
    return saved ? { show: true, type: saved } : { show: false, type: null };
  });

  const turnstileRef = useRef(null);

  /**
   * Resets Cloudflare Turnstile widget and clears cached token.
   *
   * @returns {void}
   */
  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  const { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit, isLoading } = useUsageLimit();

  const { pollForResult, handleUpscale } = useUpscaleActions({
    setJobId,
    setProgress,
    setResultUrl,
    setIsProcessing,
    resetTurnstile,
    previewUrl,
    setSelectedFile,
    setPreviewUrl,
    setAppAlert,
    turnstileToken,
    turnstileRef,
    setTurnstileToken,
    selectedFile,
    recordUsage,
    forceMaxLimit,
    scale,
  });

  useSessionPersistence({
    setSelectedFile,
    setPreviewUrl,
    setResultUrl,
    setIsProcessing,
    setJobId,
    setAppAlert,
    appAlert,
    pollForResult,
    handleUpscale: (...args) => {
      void handleUpscale(...args).catch((err) => {
        console.error(`Upscale error : ${err}`);
      });
    },
    resultUrl,
    previewUrl,
  });

  /**
   * Handles file selection:
   * - clears transient prior processing state
   * - saves file to IndexedDB for reload persistence
   * - stores upload timestamp for 10-minute "draft upload" expiration
   * - prepares preview URL
   *
   * @param {File} file - The selected image file.
   * @returns {Promise<void>}
   */
  const handleFileSelect = async (file) => {
    localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
    localStorage.removeItem(STORAGE_KEYS.JOB_ID);
    localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
    localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP);

    await saveFileToIDB(file);
    localStorage.setItem(STORAGE_KEYS.UPLOAD_TIMESTAMP, Date.now().toString()); // NEW

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setJobId(null);
  };

  /**
   * Cancels current workflow and clears all persisted state.
   *
   * @returns {Promise<void>}
   */
  const handleCancel = async () => {
    await clearAppSession(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setJobId(null);
    setIsProcessing(false);
    resetTurnstile();
    localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
  };

  return {
    selectedFile,
    previewUrl,
    isProcessing,
    resultUrl,
    jobId,
    turnstileToken,
    setTurnstileToken,
    turnstileRef,
    handleFileSelect,
    handleCancel,
    handleUpscale,
    appAlert,
    setAppAlert,
    usesRemaining,
    resetTimestamp,
    isLoading,
    scale,
    setScale,
  };
}