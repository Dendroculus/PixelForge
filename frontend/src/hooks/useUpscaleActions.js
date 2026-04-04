import { useCallback } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import { STORAGE_KEYS } from '../config';

/**
 * React hook providing upscale-related actions including polling and upload handling.
 * @param {{
 *  setJobId: (id: string|null) => void,
 *  setProgress: (value: number) => void,
 *  setResultUrl: (url: string|null) => void,
 *  setIsProcessing: (state: boolean) => void,
 *  resetTurnstile: () => void,
 *  previewUrl: string|null,
 *  setSelectedFile: (file: File|null) => void,
 *  setPreviewUrl: (url: string|null) => void,
 *  setAppAlert: (alert: {show: boolean, type: string}) => void,
 *  turnstileToken: string|null,
 *  turnstileRef: { current: any },
 *  setTurnstileToken: (token: string|null) => void,
 *  modelType: string,
 *  selectedFile: File|null,
 *  recordUsage: () => void,
 *  forceMaxLimit: () => void
 * }} params
 * @returns {{ pollForResult: (id: string) => () => void, handleUpscale: (overrideFile?: Blob|null) => Promise<void> }}
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

  /**
   * Polls backend for job result until success or failure threshold.
   * @param {string} id
   * @returns {() => void} Cleanup function to cancel polling.
   */
  const pollForResult = useCallback((id) => {
    setJobId(id);
    let errorCount = 0;
    let timeoutId = null;

    const poll = async () => {
      try {
        const result = await apiService.pollResult(id);

        if (result.success) {
          localStorage.removeItem(STORAGE_KEYS.JOB_ID);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);

          const beginTime = Date.now().toString();
          localStorage.setItem(STORAGE_KEYS.RESULT_URL, result.data.url);
          localStorage.setItem(STORAGE_KEYS.RESULT_TIMESTAMP, beginTime);
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

            localStorage.setItem(STORAGE_KEYS.ALERT, 'dos');
            setAppAlert({ show: true, type: 'dos' });
            return;
          }
        } else {
          errorCount = 0;
        }

        timeoutId = setTimeout(poll, 3000);
      } catch (err) {
        console.error('Polling crash:', err);
        timeoutId = setTimeout(poll, 3000);
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    setProgress,
    resetTurnstile,
    previewUrl,
    setJobId,
    setResultUrl,
    setIsProcessing,
    setSelectedFile,
    setPreviewUrl,
    setAppAlert
  ]);

  /**
   * Handles image upload and triggers processing workflow.
   * @param {Blob|null} [overrideFile]
   */
  const handleUpscale = useCallback(async (overrideFile = null) => {
    const fileToUse = overrideFile instanceof Blob ? overrideFile : selectedFile;
    if (!fileToUse) return;

    setIsProcessing(true);
    localStorage.setItem(STORAGE_KEYS.IS_PROCESSING, 'true');

    let currentToken = turnstileToken;
    if (!currentToken && turnstileRef.current) {
      currentToken = turnstileRef.current.getResponse();
    }

    if (!currentToken) {
      for (let i = 0; i < 50; i++) {
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
      localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
      resetTurnstile();
      return;
    }

    try {
      const data = await apiService.uploadImage(fileToUse, modelType, currentToken);

      recordUsage();

      localStorage.setItem(STORAGE_KEYS.JOB_ID, data.job_id);
      pollForResult(data.job_id);
    } catch (error) {
      if (error.message === 'LIMIT_REACHED') {
        forceMaxLimit();
        localStorage.setItem(STORAGE_KEYS.ALERT, 'limit_reached');
        setAppAlert({ show: true, type: 'limit_reached' });
      } else {
        alert(error.message);
      }

      setIsProcessing(false);
      await clearAppSession(previewUrl);
      resetTurnstile();
    }
  }, [
    selectedFile,
    turnstileToken,
    modelType,
    pollForResult,
    previewUrl,
    resetTurnstile,
    setIsProcessing,
    turnstileRef,
    setTurnstileToken,
    recordUsage,
    forceMaxLimit,
    setAppAlert
  ]);

  return { pollForResult, handleUpscale };
}