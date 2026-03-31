// hooks/useUpscalePipeline.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { saveFileToIDB, loadFileFromIDB, clearIDB } from '../utils/idb';

export function useUpscalePipeline(setProgress) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [modelType, setModelType] = useState('general');
  const [turnstileToken, setTurnstileToken] = useState(null);
  const turnstileRef = useRef(null);

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) {
      turnstileRef.current.reset();
    }
    setTurnstileToken(null);
  }, []);

  const pollForResult = useCallback((id) => {
    setJobId(id);
    const interval = setInterval(async () => {
      try {
        const result = await apiService.pollResult(id);
        if (result.success) {
          clearInterval(interval);
          localStorage.removeItem('pf_job_id');
          localStorage.removeItem('pf_progress');
          localStorage.removeItem('pf_is_processing');
          localStorage.setItem('pf_result_url', result.data.url);
          setProgress(100);
          setTimeout(() => {
            setResultUrl(result.data.url);
            setIsProcessing(false);
            resetTurnstile();
          }, 400);
        } else if (result.error) {
          clearInterval(interval);
          localStorage.removeItem('pf_job_id');
          localStorage.removeItem('pf_progress');
          localStorage.removeItem('pf_is_processing');
          await clearIDB();
          setIsProcessing(false);
          resetTurnstile();
          alert("Server error processing image.");
        }
      } catch (err) {
        if (err && err.status === 429) return;
        clearInterval(interval);
        localStorage.removeItem('pf_job_id');
        localStorage.removeItem('pf_progress');
        localStorage.removeItem('pf_is_processing');
        await clearIDB();
        setIsProcessing(false);
        resetTurnstile();
        alert(err?.message || "Error polling for result.");
      }
    }, 3000);
  }, [setProgress, resetTurnstile]);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedFile = await loadFileFromIDB();
        if (savedFile) {
          setSelectedFile(savedFile);
          setPreviewUrl(URL.createObjectURL(savedFile));
          
          const savedResult = localStorage.getItem('pf_result_url');
          if (savedResult) {
            setResultUrl(savedResult);
            setIsProcessing(false);
            localStorage.removeItem('pf_is_processing');
            localStorage.removeItem('pf_progress');
            return;
          }

          const savedJobId = localStorage.getItem('pf_job_id');
          const isProcessingStored = localStorage.getItem('pf_is_processing') === 'true';

          if (savedJobId) {
            setIsProcessing(true);
            pollForResult(savedJobId);
          } else if (isProcessingStored) {
            // If processing was stored but there's no Job ID, the user refreshed 
            // during the actual file upload before the server responded.
            // Uploads cannot survive a refresh, so we must reset to prevent infinite hanging.
            setIsProcessing(false);
            localStorage.removeItem('pf_is_processing');
            localStorage.removeItem('pf_progress');
          } else {
            setIsProcessing(false);
            localStorage.removeItem('pf_is_processing');
            localStorage.removeItem('pf_progress');
          }
        }
      } catch (error) {
        console.error("Session restoration failed:", error);
      }
    };
    restoreSession();
  }, [pollForResult]);

  const handleFileSelect = async (file) => {
    localStorage.removeItem('pf_result_url');
    localStorage.removeItem('pf_job_id');
    localStorage.removeItem('pf_is_processing');
    localStorage.removeItem('pf_progress');
    await saveFileToIDB(file);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setJobId(null);
  };

  const handleCancel = async () => {
    try {
      await clearIDB();
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('pf_job_id');
    localStorage.removeItem('pf_progress');
    localStorage.removeItem('pf_result_url');
    localStorage.removeItem('pf_is_processing');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setJobId(null);
    setIsProcessing(false);
    resetTurnstile();
  };

  const handleUpscale = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    localStorage.setItem('pf_is_processing', 'true');
    let currentToken = turnstileToken;
    if (!currentToken && turnstileRef.current) {
      currentToken = turnstileRef.current.getResponse();
    }
    if (!currentToken) {
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        if (turnstileRef.current) {
          currentToken = turnstileRef.current.getResponse();
          if (currentToken) {
            setTurnstileToken(currentToken);
            break;
          }
        }
      }
    }
    if (!currentToken) {
      setIsProcessing(false);
      localStorage.removeItem('pf_is_processing');
      resetTurnstile();
      return;
    }
    try {
      const data = await apiService.uploadImage(selectedFile, modelType, currentToken);
      localStorage.setItem('pf_job_id', data.job_id);
      pollForResult(data.job_id);
    } catch (error) {
      alert(error.message);
      setIsProcessing(false);
      localStorage.removeItem('pf_is_processing');
      try { await clearIDB(); } catch (e) { console.error(e); }
      resetTurnstile();
    }
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
    handleUpscale
  };
}