import { useCallback } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import PropTypes from 'prop-types';

/**
 * Handles API communication, uploading images, and polling for results.
 * * @param {Object} context - The shared state setters and variables from the main pipeline.
 * @returns {{ pollForResult: Function, handleUpscale: Function }}
 */
export function useUpscaleActions({
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
}) {

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
                
                const beginTime = Date.now().toString();
                localStorage.setItem('pf_result_url', result.data.url);
                localStorage.setItem('pf_result_timestamp', beginTime);
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
  }, [setProgress, resetTurnstile, previewUrl, setJobId, setResultUrl, setIsProcessing, setSelectedFile, setPreviewUrl, setAppAlert]);

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
  }, [selectedFile, turnstileToken, modelType, pollForResult, previewUrl, resetTurnstile, setIsProcessing, turnstileRef, setTurnstileToken]);

  return { pollForResult, handleUpscale };
}