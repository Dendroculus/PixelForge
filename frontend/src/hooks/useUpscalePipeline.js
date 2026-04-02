import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { useUpscaleActions } from './useUpscaleActions';
import { useSessionPersistence } from './useSessionPersistence';
import { useUsageLimit } from './useUsageLimit';
import { STORAGE_KEYS } from '../config';

/**
 * Main hook orchestrating the full upscale pipeline including state,
 * persistence, usage limits, and actions.
 * @param {(value: number) => void} setProgress
 * @returns {{
 *  selectedFile: File|null,
 *  previewUrl: string|null,
 *  isProcessing: boolean,
 *  resultUrl: string|null,
 *  jobId: string|null,
 *  modelType: string,
 *  setModelType: (type: string) => void,
 *  turnstileToken: string|null,
 *  setTurnstileToken: (token: string|null) => void,
 *  turnstileRef: { current: any },
 *  handleFileSelect: (file: File) => Promise<void>,
 *  handleCancel: () => Promise<void>,
 *  handleUpscale: (overrideFile?: Blob|null) => Promise<void>,
 *  appAlert: {show: boolean, type: string|null},
 *  setAppAlert: (alert: {show: boolean, type: string|null}) => void,
 *  usesRemaining: number,
 *  timeUntilReset: string|null
 * }}
 */
export function useUpscalePipeline(setProgress) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [modelType, setModelType] = useState('general');
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [appAlert, setAppAlert] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERT);
    return saved ? { show: true, type: saved } : { show: false, type: null };
  });

  const turnstileRef = useRef(null);

  /**
   * Resets turnstile widget and token.
   */
  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  const { usesRemaining, timeUntilReset, recordUsage, forceMaxLimit } = useUsageLimit();

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
    modelType,
    selectedFile,
    recordUsage,
    forceMaxLimit
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
    handleUpscale,
    resultUrl,
    previewUrl
  });

  /**
   * Handles file selection and initializes new session state.
   * @param {File} file
   */
  const handleFileSelect = async (file) => {
    localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
    localStorage.removeItem(STORAGE_KEYS.JOB_ID);
    localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
    localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP);

    await saveFileToIDB(file);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setJobId(null);
  };

  /**
   * Cancels current process and clears session state.
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
    modelType,
    setModelType,
    turnstileToken,
    setTurnstileToken,
    turnstileRef,
    handleFileSelect,
    handleCancel,
    handleUpscale,
    appAlert,
    setAppAlert,
    usesRemaining,
    timeUntilReset
  };
}