import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import { STORAGE_KEYS } from '../config';

/**
 * Handles upload + polling flow for image upscaling.
 *
 * @param {Function} setJobId
 * @param {Function} setProgress
 * @param {Function} setResultUrl
 * @param {Function} setIsProcessing
 * @param {Function} resetTurnstile
 * @param {string|null} previewUrl
 * @param {Function} setSelectedFile
 * @param {Function} setPreviewUrl
 * @param {Function} setAppAlert
 * @param {string|null} turnstileToken
 * @param {Object} turnstileRef
 * @param {Function} setTurnstileToken
 * @param {File|null} selectedFile
 * @param {Function} recordUsage
 * @param {Function} forceMaxLimit
 * @param {number} scale
 *
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
  selectedFile,
  recordUsage,
  forceMaxLimit,
  scale,
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
   * Polls backend until job completes or fails.
   *
   * @param {string} id - Job ID
   */
  const pollForResult = useCallback((id) => {
    setJobId(id);

    let errorCount = 0;
    let timeoutId = null;
    let attemptCount = 0;
    const startedAt = Date.now();

    const maxAttempts = 120;
    const maxDurationMs = 600000;

    const handleFailure = async () => {
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

      if (attemptCount > maxAttempts || Date.now() - startedAt > maxDurationMs) {
        await handleFailure();
        return;
      }

      try {
        const result = await apiService.pollResult(id);

        if (result.success) {
          localStorage.removeItem(STORAGE_KEYS.JOB_ID);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);

          const timestamp = Date.now().toString();
          localStorage.setItem(STORAGE_KEYS.RESULT_URL, result.data.url);
          localStorage.setItem(STORAGE_KEYS.RESULT_TIMESTAMP, timestamp);

          setProgress(100);
          recordUsage();

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
            await handleFailure();
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
    setAppAlert,
    recordUsage,
  ]);

  /**
   * Initiates upload and starts polling flow.
   *
   * @param {File|Blob|null} overrideFile - Optional override file
   */
  const handleUpscale = useCallback(async (overrideFile = null) => {
    const fileToUse = overrideFile instanceof Blob ? overrideFile : selectedFile;
    if (!fileToUse) return;

    setIsProcessing(true);
    localStorage.setItem(STORAGE_KEYS.IS_PROCESSING, 'true');

    let token = turnstileToken;

    if (!token && turnstileRef.current) {
      token = turnstileRef.current.getResponse();
      if (token) setTurnstileToken(token);
    }

    if (!token) {
      pendingFileRef.current = fileToUse;
      setIsWaitingForToken(true);
      return;
    }

    setIsWaitingForToken(false);
    pendingFileRef.current = null;

    try {
      const data = await apiService.uploadImage(fileToUse, token, scale);
      localStorage.setItem(STORAGE_KEYS.JOB_ID, data.job_id);
      pollForResult(data.job_id);
    } catch (error) {
      if (error.message === 'LIMIT_REACHED') {
        forceMaxLimit();
        localStorage.setItem(STORAGE_KEYS.ALERT, 'limit_reached');
        setAppAlert({ show: true, type: 'limit_reached' });
      } else {
        setAppAlert({ show: true, type: 'dos' });
      }

      setIsProcessing(false);
      await clearAppSession(previewUrl);
      resetTurnstile();
    }
  }, [
    selectedFile,
    turnstileToken,
    pollForResult,
    previewUrl,
    resetTurnstile,
    setIsProcessing,
    turnstileRef,
    setTurnstileToken,
    forceMaxLimit,
    setAppAlert,
    scale,
  ]);

  useEffect(() => {
    if (isWaitingForToken && turnstileToken && pendingFileRef.current) {
      handleUpscale(pendingFileRef.current);
    }
  }, [isWaitingForToken, turnstileToken, handleUpscale]);

  return { pollForResult, handleUpscale };
}