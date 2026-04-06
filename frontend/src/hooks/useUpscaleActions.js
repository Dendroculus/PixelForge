import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import { STORAGE_KEYS } from '../config';

/**
 * Custom hook that manages the image upscale workflow:
 * - Handles upload with Turnstile token coordination
 * - Polls backend for results
 * - Manages retry, timeout, and failure states
 *
 * @param {Object} params
 * @param {(id: string | null) => void} params.setJobId - Updates current job ID state
 * @param {(progress: number) => void} params.setProgress - Updates progress percentage (0–100)
 * @param {(url: string | null) => void} params.setResultUrl - Sets final processed image URL
 * @param {(value: boolean) => void} params.setIsProcessing - Toggles processing/loading state
 * @param {() => void} params.resetTurnstile - Resets Turnstile widget/token
 * @param {string | null} params.previewUrl - Current preview image URL (used for cleanup)
 * @param {(file: File | null) => void} params.setSelectedFile - Updates selected file state
 * @param {(url: string | null) => void} params.setPreviewUrl - Updates preview URL state
 * @param {(alert: { show: boolean, type: string }) => void} params.setAppAlert - Triggers UI alert state
 * @param {string | null} params.turnstileToken - Current Turnstile verification token
 * @param {React.RefObject} params.turnstileRef - Ref to Turnstile widget instance
 * @param {(token: string) => void} params.setTurnstileToken - Stores Turnstile token
 * @param {File | Blob | null} params.selectedFile - Currently selected file for upload
 * @param {() => void} params.recordUsage - Tracks usage for rate limiting / analytics
 * @param {() => void} params.forceMaxLimit - Forces UI state when usage limit is reached
 * @param {number} params.scale - Current upscale scale factor (e.g., 2 for 2x)
 *
 * @returns {{
 *   pollForResult: (id: string) => (() => void) | void,
 *   handleUpscale: (overrideFile?: File | Blob | null) => Promise<void>
 * }}
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

  /**
   * Resets waiting state if selected file is cleared
   */
  useEffect(() => {
    if (!selectedFile) {
      setIsWaitingForToken(false);
      pendingFileRef.current = null;
    }
  }, [selectedFile]);

  /**
   * Polls backend for processing result using job ID.
   * Handles retries, rate limits, timeouts, and failure fallback.
   *
   * @param {string} id - Job ID returned from upload API
   * @returns {() => void | undefined} Cleanup function to stop polling
   */
  const pollForResult = useCallback((id) => {
    setJobId(id);

    let errorCount = 0;
    let timeoutId = null;
    let attemptCount = 0;
    const startedAt = Date.now();
    const maxAttempts = 120;
    const maxDurationMs = 10 * 60 * 1000;

    /**
     * Handles polling failure by resetting state and showing alert
     */
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

    /**
     * Recursive polling function
     */
    const poll = async () => {
      attemptCount++;

      if (attemptCount > maxAttempts || Date.now() - startedAt > maxDurationMs) {
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
    setAppAlert,
  ]);

  /**
   * Initiates upscale process:
   * - Ensures Turnstile token is available
   * - Uploads file to backend
   * - Starts polling for result
   *
   * @param {File | Blob | null} [overrideFile=null] - Optional file override (used when retrying after token is obtained)
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
      const data = await apiService.uploadImage(fileToUse, currentToken, scale);
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
    pollForResult,
    previewUrl,
    resetTurnstile,
    setIsProcessing,
    turnstileRef,
    setTurnstileToken,
    recordUsage,
    forceMaxLimit,
    setAppAlert,
    scale,
  ]);

  /**
   * Retries upload automatically once Turnstile token becomes available
   */
  useEffect(() => {
    if (isWaitingForToken && turnstileToken && pendingFileRef.current) {
      handleUpscale(pendingFileRef.current);
    }
  }, [isWaitingForToken, turnstileToken, handleUpscale]);

  return { pollForResult, handleUpscale };
}