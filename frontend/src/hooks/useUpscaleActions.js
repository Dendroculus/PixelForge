import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import { STORAGE_KEYS } from '../config';

/**
 * Hook to handle image upscale workflow including upload, polling, and Turnstile token handling.
 * @param {Object} params
 * @param {Function} params.setJobId
 * @param {Function} params.setProgress
 * @param {Function} params.setResultUrl
 * @param {Function} params.setIsProcessing
 * @param {Function} params.resetTurnstile
 * @param {string|null} params.previewUrl
 * @param {Function} params.setSelectedFile
 * @param {Function} params.setPreviewUrl
 * @param {Function} params.setAppAlert
 * @param {string|null} params.turnstileToken
 * @param {Object} params.turnstileRef
 * @param {Function} params.setTurnstileToken
 * @param {string} params.modelType
 * @param {File|Blob|null} params.selectedFile
 * @param {Function} params.recordUsage
 * @param {Function} params.forceMaxLimit
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
  const [isWaitingForToken, setIsWaitingForToken] = useState(false);
  const pendingFileRef = useRef(null);

  useEffect(() => {
    if (!selectedFile) {
      setIsWaitingForToken(false);
      pendingFileRef.current = null;
    }
  }, [selectedFile]);

  /**
   * Polls backend for job result until success or failure.
   * @param {string} id
   * @returns {Function} cleanup function
   */
  const pollForResult = useCallback((id) => {
    setJobId(id);

    let errorCount = 0;
    let timeoutId = null;
    let attemptCount = 0;
    const startedAt = Date.now();
    const maxAttempts = 120;
    const maxDurationMs = 10 * 60 * 1000;

    const handlePollingFailure = async () => {
      await clearAppSession(previewUrl);

      setSelectedFile(null);
      setPreviewUrl(null);
      setResultUrl(null);
      setJobId(null);

      setIsProcessing(false);
      resetTurnstile();

      localStorage.setItem(STORAGE_KEYS.ALERT, 'dos');
      setAppAlert({ show: true, type: 'dos' });
    };

    const poll = async () => {
      attemptCount++;
      if (attemptCount > maxAttempts || (Date.now() - startedAt) > maxDurationMs) {
        await handlePollingFailure();
        return;
      }

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
            await handlePollingFailure();
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
   * Handles image upload and triggers polling.
   * Waits for Turnstile token if not immediately available.
   * @param {File|Blob|null} overrideFile
   * @returns {Promise<void>}
   */
  const handleUpscale = useCallback(async (overrideFile = null) => {
    const fileToUse = overrideFile instanceof Blob ? overrideFile : selectedFile;
    if (!fileToUse) return;

    setIsProcessing(true);
    localStorage.setItem(STORAGE_KEYS.IS_PROCESSING, 'true');

    let currentToken = turnstileToken;

    if (!currentToken && turnstileRef.current) {
      currentToken = turnstileRef.current.getResponse();
      if (currentToken) setTurnstileToken(currentToken);
    }

    if (!currentToken) {
      pendingFileRef.current = fileToUse;
      setIsWaitingForToken(true);
      return;
    }

    setIsWaitingForToken(false);
    pendingFileRef.current = null;

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

  useEffect(() => {
    if (isWaitingForToken && turnstileToken && pendingFileRef.current) {
      handleUpscale(pendingFileRef.current);
    }
  }, [isWaitingForToken, turnstileToken, handleUpscale]);

  return { pollForResult, handleUpscale };
}