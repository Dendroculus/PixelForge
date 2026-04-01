import { useState, useRef, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { saveFileToIDB, loadFileFromIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';

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
  const sessionRestored = useRef(false);

  const resetTurnstile = useCallback(() => {
    if (turnstileRef.current) turnstileRef.current.reset();
    setTurnstileToken(null);
  }, []);

  const pollForResult = useCallback((id) => {
    setJobId(id);
    let errorCount = 0;
    let timeoutId = null;

    const poll = async () => {
        try {
            const result = await apiService.pollResult(id);

            if (result.success) {
                localStorage.removeItem('pf_job_id');
                localStorage.removeItem('pf_progress');
                localStorage.removeItem('pf_is_processing');
                localStorage.removeItem('pf_refresh_count');
                localStorage.setItem('pf_result_url', result.data.url);
                setProgress(100);
                
                setTimeout(() => {
                    setResultUrl(result.data.url);
                    setIsProcessing(false);
                    resetTurnstile();
                }, 400);
                return; 
            } 
            
            if (result.error) {
                if (result.status === 429) {
                    timeoutId = setTimeout(poll, 5000);
                    return;
                }

                errorCount++;
                if (errorCount > 5) {
                    await clearAppSession(previewUrl);
                    
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResultUrl(null);
                    setJobId(null);
                    
                    setIsProcessing(false);
                    resetTurnstile();
                    
                    localStorage.setItem('pf_alert', 'dos');
                    setAppAlert({ show: true, type: 'dos' });
                    return;
                }
            } else {
                errorCount = 0;
            }

            timeoutId = setTimeout(poll, 3000);

        } catch (err) {
            console.error("Polling crash:", err);
            timeoutId = setTimeout(poll, 3000); 
        }
    };
    poll(); 

    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [setProgress, resetTurnstile, previewUrl]);


  const handleUpscale = useCallback(async (overrideFile = null) => {
    const fileToUse = overrideFile instanceof Blob ? overrideFile : selectedFile;
    if (!fileToUse) return;
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
      const data = await apiService.uploadImage(fileToUse, modelType, currentToken);
      localStorage.setItem('pf_job_id', data.job_id);
      pollForResult(data.job_id);
    } catch (error) {
      alert(error.message);
      setIsProcessing(false);
      await clearAppSession(previewUrl);
      resetTurnstile();
    }
  }, [selectedFile, turnstileToken, modelType, pollForResult, previewUrl, resetTurnstile]);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

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

          if (savedJobId || isProcessingStored) {
            let refreshCount = parseInt(localStorage.getItem('pf_refresh_count') || '0', 10);
            refreshCount++;
            localStorage.setItem('pf_refresh_count', refreshCount.toString());

            if (refreshCount === 3) {
                localStorage.setItem('pf_alert', 'potato'); 
                setAppAlert({ show: true, type: 'potato' });
            }

            if (savedJobId) {
              setIsProcessing(true);
              pollForResult(savedJobId);
            } else if (isProcessingStored) {
              setIsProcessing(true);
              handleUpscale(savedFile);
            }
          }   else {
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
  }, [pollForResult, handleUpscale]);

  const handleFileSelect = async (file) => {
    localStorage.removeItem('pf_result_url');
    localStorage.removeItem('pf_job_id');
    localStorage.removeItem('pf_is_processing');
    localStorage.removeItem('pf_progress');
    localStorage.removeItem('pf_refresh_count')
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