import { useCallback } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';

/**
 * Handles API communication, uploading images, and polling for results.
 * * @param {Object} context - The shared state setters and variables.
 * @param {Function} context.setJobId - Sets the current active job ID.
 * @param {Function} context.setProgress - Updates the simulated progress bar.
 * @param {Function} context.setResultUrl - Sets the final upscaled image URL.
 * @param {Function} context.setIsProcessing - Toggles the processing state.
 * @param {Function} context.resetTurnstile - Resets the Cloudflare Turnstile widget.
 * @param {string|null} context.previewUrl - The local object URL of the selected file.
 * @param {Function} context.setSelectedFile - Sets the active File object.
 * @param {Function} context.setPreviewUrl - Sets the active preview URL.
 * @param {Function} context.setAppAlert - Triggers application-wide modals.
 * @param {string|null} context.turnstileToken - The current Turnstile validation token.
 * @param {Object} context.turnstileRef - Reference to the Turnstile component.
 * @param {Function} context.setTurnstileToken - Updates the Turnstile token.
 * @param {string} context.modelType - The selected AI model ('general' or 'anime').
 * @param {File|null} context.selectedFile - The user's chosen file.
 * @param {Function} context.recordUsage - Logs a successful upscale to local history.
 * @param {Function} context.forceMaxLimit - Instantly maxes out usage if the backend blocks the request.
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
  selectedFile,
  recordUsage,
  forceMaxLimit,
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
      
      recordUsage();
      
      localStorage.setItem('pf_job_id', data.job_id);
      pollForResult(data.job_id);
    } catch (error) {
      if (error.message === 'LIMIT_REACHED') {
        forceMaxLimit();
        localStorage.setItem('pf_alert', 'limit_reached');
        setAppAlert({ show: true, type: 'limit_reached' });
      } else {
        alert(error.message); 
      }
      
      setIsProcessing(false);
      await clearAppSession(previewUrl);
      resetTurnstile();
    }
  }, [selectedFile, turnstileToken, 
      modelType, pollForResult, 
      previewUrl, resetTurnstile, 
      setIsProcessing, turnstileRef, 
      setTurnstileToken, recordUsage, 
      forceMaxLimit, setAppAlert
    ]);

  return { pollForResult, handleUpscale };
}