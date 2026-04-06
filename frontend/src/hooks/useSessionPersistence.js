import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { APP_CONFIG as config, STORAGE_KEYS } from '../config';
import { isExpired } from '../utils/time';

export function useSessionPersistence({
  setSelectedFile,
  setPreviewUrl,
  setResultUrl,
  setIsProcessing,
  setJobId,
  setAppAlert,
  appAlert,
  pollForResult,
  handleUpscale,
  resultUrl,
  previewUrl,
}) {
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

    const restoreSession = async () => {
      try {
        const savedJobId = localStorage.getItem(STORAGE_KEYS.JOB_ID);
        const isProcessingStored = localStorage.getItem(STORAGE_KEYS.IS_PROCESSING) === 'true';
        const savedResult = localStorage.getItem(STORAGE_KEYS.RESULT_URL);
        const savedTimestamp = localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP);

        // 1) If result exists, restore result first (highest priority)
        if (savedResult) {
          if (isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
            await clearAppSession();
            setSelectedFile(null);
            setPreviewUrl(null);
            setResultUrl(null);
            setJobId(null);
            setIsProcessing(false);

            localStorage.setItem(STORAGE_KEYS.ALERT, 'expired');
            setAppAlert({ show: true, type: 'expired' });
            return;
          }

          setResultUrl(savedResult);
          setIsProcessing(false);
          setJobId(null);
          localStorage.removeItem(STORAGE_KEYS.JOB_ID);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);

          if (!appAlert.show) {
            setAppAlert({ show: true, type: 'reserved_warning' });
          }
          return;
        }

        // 2) If job exists, resume polling even without saved file
        if (savedJobId || isProcessingStored) {
          if (savedJobId) {
            setJobId(savedJobId);
            setIsProcessing(true);
            pollForResult(savedJobId);
            return;
          }
        }

        // 3) Load file only for preview/draft cases
        const savedFile = await loadFileFromIDB();
        if (!savedFile) {
          setIsProcessing(false);
          return;
        }

        const uploadTimestamp = localStorage.getItem(STORAGE_KEYS.UPLOAD_TIMESTAMP);
        if (isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession();
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);
          setIsProcessing(false);
          return;
        }

        setSelectedFile(savedFile);
        setPreviewUrl(URL.createObjectURL(savedFile));

        if (isProcessingStored) {
          setIsProcessing(true);
          void handleUpscale(savedFile);
        } else {
          setIsProcessing(false);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      }
    };

    void restoreSession();
  }, [
    pollForResult,
    handleUpscale,
    appAlert.show,
    setAppAlert,
    setIsProcessing,
    setPreviewUrl,
    setResultUrl,
    setSelectedFile,
    setJobId,
  ]);

  useEffect(() => {
    let interval;

    if (resultUrl) {
      interval = setInterval(async () => {
        const savedTimestamp = localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP);

        if (isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
          await clearAppSession(previewUrl);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);

          localStorage.setItem(STORAGE_KEYS.ALERT, 'expired');
          setAppAlert({ show: true, type: 'expired' });
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [resultUrl, previewUrl, setAppAlert, setJobId, setPreviewUrl, setResultUrl, setSelectedFile]);

  useEffect(() => {
    let interval;

    const shouldWatchDraft =
      Boolean(previewUrl) &&
      !resultUrl &&
      !localStorage.getItem(STORAGE_KEYS.JOB_ID) &&
      localStorage.getItem(STORAGE_KEYS.IS_PROCESSING) !== 'true';

    if (shouldWatchDraft) {
      interval = setInterval(async () => {
        const uploadTimestamp = localStorage.getItem(STORAGE_KEYS.UPLOAD_TIMESTAMP);

        if (isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession(previewUrl);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);
          setIsProcessing(false);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [
    previewUrl,
    resultUrl,
    setIsProcessing,
    setJobId,
    setPreviewUrl,
    setResultUrl,
    setSelectedFile,
  ]);
}