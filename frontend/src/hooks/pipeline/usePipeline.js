import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../../utils/idb';
import { clearAppSession } from '../../utils/session';
import { useSessionPersistence } from '../useSessionPersistence';
import { useUsageLimit } from '../useUsageLimit';
import { STORAGE_KEYS } from '../../config';

export function usePipeline(setProgress, usePipelineActions, feature = 'upscale') {
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

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  // Pass the specific feature to the usage limit hook
  const { usesRemaining, resetTimestamp, recordUsage, forceMaxLimit, isLoading, maxLimit } = useUsageLimit(feature);

  const { pollForResult, handleProcess } = usePipelineActions({
    setJobId, setProgress, setResultUrl, setIsProcessing, resetTurnstile, previewUrl,
    setSelectedFile, setPreviewUrl, setAppAlert, turnstileToken, turnstileRef,
    setTurnstileToken, selectedFile, recordUsage, forceMaxLimit, scale, 
  });

  useSessionPersistence({
    setSelectedFile, setPreviewUrl, setResultUrl, setIsProcessing, setJobId,
    setAppAlert, appAlert, pollForResult,
    handleUpscale: (...args) => {
      void handleProcess(...args).catch((err) => {
        console.error(`Pipeline execution error: ${err}`);
      });
    },
    resultUrl, previewUrl,
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
    selectedFile, previewUrl, isProcessing, resultUrl, jobId,
    turnstileToken, setTurnstileToken, turnstileRef, handleFileSelect,
    handleCancel, handleProcess, appAlert, setAppAlert,
    usesRemaining, resetTimestamp, isLoading, scale, setScale, maxLimit, 
  };
}