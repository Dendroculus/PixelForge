import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '@/services/apiService';
import { clearAppSession } from '@/utils/storage/session';

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

      const handleFailure = async () => {
        await clearAppSession(feature, previewUrl);

        setSelectedFile(null);
        setPreviewUrl(null);
        setResultUrl(null);
        setJobId(null);
        setIsProcessing(false);

        clearPendingProcess();
        resetTurnstile();

        localStorage.setItem(storageKeys.ALERT, 'dos');
        setAppAlert({ show: true, type: 'dos' });
      };

      const poll = async () => {
        attemptCount++;

        if (
          attemptCount > maxAttempts ||
          Date.now() - startedAt > maxDurationMs
        ) {
          await handleFailure();
          return;
        }

        try {
          const result = await apiService.pollResult(id);

          if (result.failed) {
            console.error('Processing failed:', result.message);
            await handleFailure();
            return;
          }

          if (result.success) {
            localStorage.removeItem(storageKeys.JOB_ID);
            localStorage.removeItem(storageKeys.PROGRESS);
            localStorage.removeItem(storageKeys.IS_PROCESSING);
            localStorage.removeItem(storageKeys.REFRESH_COUNT);

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
          console.error(`${feature} processing failed:`, error);
          setAppAlert({ show: true, type: 'dos' });
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