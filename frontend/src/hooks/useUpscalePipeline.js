import { useState, useRef, useCallback } from 'react';
import { saveFileToIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { useUpscaleActions } from './useUpscaleActions';
import { useSessionPersistence } from './useSessionPersistence';

/**
 * The master orchestrator hook that combines state, API actions, and storage persistence.
 * * @param {Function} setProgress - UI progress bar state setter.
 * @returns {Object} Destructured UI state and action handlers.
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
    const saved = localStorage.getItem('pf_alert');
    return saved ? { show: true, type: saved } : { show: false, type: null };
  });
  
  const turnstileRef = useRef(null);

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

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
    selectedFile
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

  const handleFileSelect = async (file) => {
    localStorage.removeItem('pf_result_url');
    localStorage.removeItem('pf_job_id');
    localStorage.removeItem('pf_is_processing');
    localStorage.removeItem('pf_progress');
    localStorage.removeItem('pf_refresh_count');
    localStorage.removeItem('pf_result_timestamp');
    
    await saveFileToIDB(file);
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
    localStorage.removeItem('pf_refresh_count');
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
    setAppAlert
  };
}