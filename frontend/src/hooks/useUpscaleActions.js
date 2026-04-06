import { useCallback, useState, useEffect, useRef } from 'react';
import { apiService } from '../services/apiService';
import { clearAppSession } from '../utils/session';
import { STORAGE_KEYS } from '../config';

const JOB_STARTED_AT_KEY = 'JOB_STARTED_AT';

function sanitizeScale(scale) {
  const n = Number(scale);
  if (!Number.isFinite(n)) return 2;
  const i = Math.trunc(n);
  if (i < 1) return 1;
  if (i > 4) return 4;
  return i;
}

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
  forceMaxLimit,
}) {
  const [isWaitingForToken, setIsWaitingForToken] = useState(false);
  const pendingFileRef = useRef(null);
  const pendingScaleRef = useRef(2);

  const activePollTokenRef = useRef(0);
  const activeTimeoutRef = useRef(null);

  const clearPollTimeout = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
      activeTimeoutRef.current = null;
    }
  }, []);

  const clearProcessingStorage = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.JOB_ID);
    localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.RESULT_URL);
    localStorage.removeItem(STORAGE_KEYS.RESULT_TIMESTAMP);
    localStorage.removeItem(JOB_STARTED_AT_KEY);
  }, []);

  const resetPendingTokenWait = useCallback(() => {
    pendingFileRef.current = null;
    pendingScaleRef.current = 2;
    setIsWaitingForToken(false);
  }, []);

  const handlePollingFailure = useCallback(async () => {
    clearPollTimeout();
    activePollTokenRef.current += 1;
    clearProcessingStorage();
    resetPendingTokenWait();

    try {
      await clearAppSession(previewUrl);
    } catch (err) {
      console.error('Session clear failed:', err);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setResultUrl(null);
    setJobId(null);
    setIsProcessing(false);
    resetTurnstile();

    localStorage.setItem(STORAGE_KEYS.ALERT, 'dos');
    setAppAlert({ show: true, type: 'dos' });
  }, [
    clearPollTimeout,
    clearProcessingStorage,
    previewUrl,
    resetPendingTokenWait,
    resetTurnstile,
    setAppAlert,
    setIsProcessing,
    setJobId,
    setPreviewUrl,
    setResultUrl,
    setSelectedFile,
  ]);

  const pollForResult = useCallback((id) => {
    if (!id) return undefined;

    clearPollTimeout();
    activePollTokenRef.current += 1;
    const myPollToken = activePollTokenRef.current;

    setJobId(id);

    let terminalErrorCount = 0;
    let transientErrorCount = 0;
    let attemptCount = 0;

    const startedAt = Number(localStorage.getItem(JOB_STARTED_AT_KEY)) || Date.now();
    if (!localStorage.getItem(JOB_STARTED_AT_KEY)) {
      localStorage.setItem(JOB_STARTED_AT_KEY, String(startedAt));
    }

    const maxAttempts = 180;
    const maxDurationMs = 10 * 60 * 1000;
    const maxTransientErrors = 40;
    const maxTerminalErrors = 3;

    const scheduleNext = (fn, ms) => {
      clearPollTimeout();
      activeTimeoutRef.current = setTimeout(fn, ms);
    };

    const poll = async () => {
      if (myPollToken !== activePollTokenRef.current) return;

      attemptCount += 1;
      const elapsed = Date.now() - startedAt;

      if (attemptCount > maxAttempts || elapsed > maxDurationMs) {
        await handlePollingFailure();
        return;
      }

      const result = await apiService.pollResult(id);

      if (myPollToken !== activePollTokenRef.current) return;

      if (result.success) {
        console.log('READY branch hit', result.data.url);
        clearPollTimeout();

        localStorage.removeItem(STORAGE_KEYS.JOB_ID);
        localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_COUNT);
        localStorage.removeItem(JOB_STARTED_AT_KEY);

        const beginTime = Date.now().toString();
        localStorage.setItem(STORAGE_KEYS.RESULT_URL, result.data.url);
        localStorage.setItem(STORAGE_KEYS.RESULT_TIMESTAMP, beginTime);

        setProgress(100);
        setResultUrl(result.data.url);
        setIsProcessing(false);
        resetTurnstile();

        return;
      }

      if (result.transient) {
        transientErrorCount += 1;
        if (transientErrorCount > maxTransientErrors || Date.now() - startedAt > maxDurationMs) {
          await handlePollingFailure();
          return;
        }
        scheduleNext(() => {
          void poll();
        }, result.rateLimited ? 5000 : 3500);
        return;
      }

      if (result.error) {
        terminalErrorCount += 1;

        if (result.failed || terminalErrorCount >= maxTerminalErrors) {
          await handlePollingFailure();
          return;
        }

        scheduleNext(() => {
          void poll();
        }, 3000);
        return;
      }

      scheduleNext(() => {
        void poll();
      }, 3000);
    };

    void poll();

    return () => {
      if (myPollToken === activePollTokenRef.current) {
        clearPollTimeout();
        activePollTokenRef.current += 1;
      }
    };
  }, [
    clearPollTimeout,
    handlePollingFailure,
    resetTurnstile,
    setIsProcessing,
    setJobId,
    setProgress,
    setResultUrl,
  ]);

  const handleUpscale = useCallback(async (scale = 2, overrideFile = null) => {
    const fileToUse = overrideFile instanceof Blob ? overrideFile : selectedFile;
    if (!fileToUse) {
      resetPendingTokenWait();
      return;
    }

    const safeScale = sanitizeScale(scale);

    setIsProcessing(true);
    localStorage.setItem(STORAGE_KEYS.IS_PROCESSING, 'true');

    let currentToken = turnstileToken;

    if (!currentToken && turnstileRef.current) {
      try {
        currentToken = turnstileRef.current.getResponse();
      } catch (err) {
        console.error('Turnstile getResponse failed:', err);
        currentToken = null;
      }
      if (currentToken) setTurnstileToken(currentToken);
    }

    if (!currentToken) {
      pendingFileRef.current = fileToUse;
      pendingScaleRef.current = safeScale;
      setIsWaitingForToken(true);
      return;
    }

    resetPendingTokenWait();

    try {
      const data = await apiService.uploadImage(fileToUse, currentToken, safeScale);
      localStorage.setItem(STORAGE_KEYS.JOB_ID, data.job_id);
      localStorage.setItem(STORAGE_KEYS.IS_PROCESSING, 'true');

      if (!localStorage.getItem(JOB_STARTED_AT_KEY)) {
        localStorage.setItem(JOB_STARTED_AT_KEY, String(Date.now()));
      }

      pollForResult(data.job_id);
    } catch (error) {
      const message = error?.message || 'Upload failed';

      clearPollTimeout();
      activePollTokenRef.current += 1;

      if (message === 'LIMIT_REACHED') {
        forceMaxLimit();
        localStorage.setItem(STORAGE_KEYS.ALERT, 'limit_reached');
        setAppAlert({ show: true, type: 'limit_reached' });
      } else {
        alert(message);
      }

      setIsProcessing(false);
      clearProcessingStorage();
      resetPendingTokenWait();

      try {
        await clearAppSession(previewUrl);
      } catch (err) {
        console.error('Session clear after upload error failed:', err);
      }

      resetTurnstile();
    }
  }, [
    clearPollTimeout,
    clearProcessingStorage,
    forceMaxLimit,
    pollForResult,
    previewUrl,
    resetPendingTokenWait,
    resetTurnstile,
    selectedFile,
    setAppAlert,
    setIsProcessing,
    setTurnstileToken,
    turnstileRef,
    turnstileToken,
  ]);

  useEffect(() => {
    if (isWaitingForToken && turnstileToken && pendingFileRef.current) {
      void handleUpscale(pendingScaleRef.current, pendingFileRef.current);
    }
  }, [handleUpscale, isWaitingForToken, turnstileToken]);

  useEffect(() => {
    return () => {
      clearPollTimeout();
      activePollTokenRef.current += 1;
    };
  }, [clearPollTimeout]);

  return { pollForResult, handleUpscale };
}