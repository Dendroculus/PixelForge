import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { useUpscaleActions } from './useUpscaleActions';
import { useSessionPersistence } from './useSessionPersistence';
import { useUsageLimit } from './useUsageLimit';
import { STORAGE_KEYS } from '../config';

export function useUpscalePipeline(setProgress) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);

  const [appAlert, setAppAlert] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERT);
    return saved ? { show: true, type: saved } : { show: false, type: null };
  });

  const turnstileRef = useRef(null);

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  const { usesRemaining, resetTimestamp, forceMaxLimit, isLoading } = useUsageLimit();

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
    forceMaxLimit,
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

  const handleFileSelect = async (file) => {
    localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
    localStorage.removeItem(STORAGE_KEYS.JOB_ID);
    localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
    localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP);

    await saveFileToIDB(file);
    localStorage.setItem(STORAGE_KEYS.UPLOAD_TIMESTAMP, Date.now().toString());

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setJobId(null);
  };

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
  };
} 