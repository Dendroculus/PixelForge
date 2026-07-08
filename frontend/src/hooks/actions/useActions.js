/**
 * Shared action hook for AI processing workflows.
 *
 * Coordinates client-side upload preparation, backend job start calls, polling,
 * result handling, cancellation, and error state for AI tools.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { clearAppSession } from '@/utils/storage/session';

const DEFAULT_PROCESSING_FAILURE_MESSAGE =
  'Your image could not be processed. Please try a smaller image or lower upscale setting.';

/**
 * Create shared AI action handlers for upload, processing, polling, and cancellation.
 *
 * @returns {object} Hook state and handlers.
 */
export function useActions({
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
  apiCallFn,
  storageKeys,
  feature,
}) {
  const [isWaitingForToken, setIsWaitingForToken] = useState(false);

  const pendingFileRef = useRef(null);
  const pendingOptionsRef = useRef({});

  const clearPendingProcess = useCallback(() => {
    pendingFileRef.current = null;
    pendingOptionsRef.current = {};
    setIsWaitingForToken(false);
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      clearPendingProcess();
    }
  }, [selectedFile, clearPendingProcess]);

  const pollForResult = useCallback(
    (id) => {
      setJobId(id);

      let errorCount = 0;
      let timeoutId = null;
      let attemptCount = 0;
      const startedAt = Date.now();

      const maxAttempts = 120;
      const maxDurationMs = 600000;
      const alertMessageKey = `${storageKeys.ALERT}_message`;

      const handleFailure = async ({
        type = 'processing_failed',
        message = DEFAULT_PROCESSING_FAILURE_MESSAGE,
      } = {}) => {
        await clearAppSession(feature, previewUrl);

        setSelectedFile(null);
        setPreviewUrl(null);
        setResultUrl(null);
        setJobId(null);
        setIsProcessing(false);

        clearPendingProcess();
        resetTurnstile();

        localStorage.setItem(storageKeys.ALERT, type);

        if (message) {
          localStorage.setItem(alertMessageKey, message);
        } else {
          localStorage.removeItem(alertMessageKey);
        }

        setAppAlert({ show: true, type, message });
      };

      const poll = async () => {
        attemptCount++;

        if (
          attemptCount > maxAttempts ||
          Date.now() - startedAt > maxDurationMs
        ) {
          await handleFailure({
            message:
              'Processing took too long and was stopped. Please try a smaller image or lower upscale setting.',
          });
          return;
        }

        try {
          const result = await apiService.pollResult(id);

          if (result.failed) {
            const message = result.message || DEFAULT_PROCESSING_FAILURE_MESSAGE;

            console.error('Processing failed:', message);

            await handleFailure({
              type: 'processing_failed',
              message,
            });
            return;
          }

          if (result.success) {
            localStorage.removeItem(storageKeys.JOB_ID);
            localStorage.removeItem(storageKeys.PROGRESS);
            localStorage.removeItem(storageKeys.IS_PROCESSING);
            localStorage.removeItem(storageKeys.REFRESH_COUNT);
            localStorage.removeItem(alertMessageKey);

            const timestamp = Date.now().toString();
            localStorage.setItem(storageKeys.RESULT_URL, result.data.url);
            localStorage.setItem(storageKeys.RESULT_TIMESTAMP, timestamp);

            setProgress(100);
            recordUsage();

            setTimeout(() => {
              setResultUrl(result.data.url);
              setIsProcessing(false);
              clearPendingProcess();
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
              await handleFailure({
                message:
                  'We could not confirm the processing result. Please try again in a moment.',
              });
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
    },
    [
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
      storageKeys,
      feature,
      clearPendingProcess,
    ],
  );

  const handleProcess = useCallback(
    async (overrideFile = null, processOptions = {}) => {
      const fileToUse =
        overrideFile instanceof Blob ? overrideFile : selectedFile;

      if (!fileToUse) return;

      let token = turnstileToken;

      if (!token && turnstileRef.current) {
        token = turnstileRef.current.getResponse();

        if (token) {
          setTurnstileToken(token);
        }
      }

      if (!token) {
        pendingFileRef.current = fileToUse;
        pendingOptionsRef.current = processOptions;

        setIsWaitingForToken(true);
        setIsProcessing(false);
        localStorage.removeItem(storageKeys.IS_PROCESSING);

        return;
      }

      clearPendingProcess();

      setIsProcessing(true);
      localStorage.setItem(storageKeys.IS_PROCESSING, 'true');

      try {
        const data = await apiCallFn(fileToUse, token, processOptions);

        localStorage.setItem(storageKeys.JOB_ID, data.job_id);
        pollForResult(data.job_id);
      } catch (error) {
        if (error.message === 'LIMIT_REACHED') {
          forceMaxLimit();
          localStorage.setItem(storageKeys.ALERT, 'limit_reached');
          setAppAlert({ show: true, type: 'limit_reached' });
        } else {
          const message = error.message || DEFAULT_PROCESSING_FAILURE_MESSAGE;

          console.error(`${feature} processing failed:`, error);
          localStorage.setItem(storageKeys.ALERT, 'processing_failed');
          localStorage.setItem(`${storageKeys.ALERT}_message`, message);
          setAppAlert({ show: true, type: 'processing_failed', message });
        }

        setIsProcessing(false);

        await clearAppSession(feature, previewUrl);

        clearPendingProcess();
        resetTurnstile();
      }
    },
    [
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
      apiCallFn,
      storageKeys,
      feature,
      clearPendingProcess,
    ],
  );

  useEffect(() => {
    if (!isWaitingForToken || !turnstileToken || !pendingFileRef.current) {
      return;
    }

    handleProcess(pendingFileRef.current, pendingOptionsRef.current);
  }, [isWaitingForToken, turnstileToken, handleProcess]);

  return { pollForResult, handleProcess, isWaitingForToken };
}
