import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../../utils/idb';
import { clearAppSession } from '../../utils/session';
import { useSessionPersistence } from '../workspace/useSessionPersistence';
import { useUsageLimit } from '../auth/useUsageLimit';
import { makeStorageKeys, migrateStorageKeys } from '../../utils/storageKeys';

export function usePipeline(setProgress, usePipelineActions, feature = 'upscale') {
  migrateStorageKeys(feature);
  const storageKeys = makeStorageKeys(feature);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState(null);
  
  const [scale, setScale] = useState(2);

  const [appAlert, setAppAlert] = useState(() => {
    const saved = localStorage.getItem(storageKeys.ALERT);
    return saved ? { show: true, type: saved } : { show: false, type: null };
  });

  const turnstileRef = useRef(null);

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  const { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit, isLoading, maxLimit } = useUsageLimit(feature);

  const { pollForResult, handleProcess, isWaitingForToken } = usePipelineActions({
    setJobId, setProgress, setResultUrl, setIsProcessing, resetTurnstile, previewUrl,
    setSelectedFile, setPreviewUrl, setAppAlert, turnstileToken, turnstileRef,
    setTurnstileToken, selectedFile, recordUsage, forceMaxLimit, scale, storageKeys, feature
  });

  useSessionPersistence({
    setSelectedFile, setPreviewUrl, setResultUrl, setIsProcessing, setJobId,
    setAppAlert, appAlert, pollForResult,
    handleUpscale: (...args) => {
      void handleProcess(...args).catch((err) => {
        console.error(`Pipeline execution error: ${err}`);
      });
    },
    resultUrl, previewUrl, storageKeys, feature
  });

  const handleFileSelect = async (file) => {
    localStorage.removeItem(storageKeys.RESULT_URL);
    localStorage.removeItem(storageKeys.JOB_ID);
    localStorage.removeItem(storageKeys.IS_PROCESSING);
    localStorage.removeItem(storageKeys.PROGRESS);
    localStorage.removeItem(storageKeys.REFRESH_COUNT);
    localStorage.removeItem(storageKeys.RESULT_TIMESTAMP);

    await saveFileToIDB(file, feature);
    localStorage.setItem(storageKeys.UPLOAD_TIMESTAMP, Date.now().toString());

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setJobId(null);
  };

  const handleCancel = async () => {
    await clearAppSession(previewUrl, feature);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setJobId(null);
    setIsProcessing(false);
    resetTurnstile();
    localStorage.removeItem(storageKeys.REFRESH_COUNT);
  };

  return {
    selectedFile, previewUrl, isProcessing, resultUrl, jobId,
    turnstileToken, setTurnstileToken, turnstileRef, handleFileSelect,
    handleCancel, handleProcess, appAlert, setAppAlert,
    usesRemaining, resetTimestamp, isLoading, scale, setScale, maxLimit, isWaitingForToken 
  };
}