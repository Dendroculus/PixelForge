import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../../utils/storage/idb';
import { clearAppSession } from '../../utils/storage/session';
import { AppConfig as config } from '../../config';
import { isExpired } from '../../utils/time';

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
  storageKeys,
  feature
}) {
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

   const restoreSession = async () => {
      const resetState = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResultUrl(null);
        setJobId(null);
        setIsProcessing(false);
      };

      try {
        const savedFile = await loadFileFromIDB(feature);
        
        const uploadTimestamp = localStorage.getItem(storageKeys.UPLOAD_TIMESTAMP);
        const savedResult = localStorage.getItem(storageKeys.RESULT_URL);
        const savedJobId = localStorage.getItem(storageKeys.JOB_ID);
        const storedAlert = localStorage.getItem(storageKeys.ALERT);

        if (!savedFile) {
          if (uploadTimestamp || savedResult || savedJobId || storedAlert) {
            await clearAppSession(feature);
            localStorage.removeItem(storageKeys.ALERT);
          }
          return;
        }

        if (!savedResult && uploadTimestamp && isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession(feature);
          resetState();
          return;
        }

        setSelectedFile(savedFile);
        setPreviewUrl(URL.createObjectURL(savedFile));

        const savedTimestamp = localStorage.getItem(storageKeys.RESULT_TIMESTAMP);

        if (savedResult && savedTimestamp && isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
          await clearAppSession(feature);
          setSelectedFile(null);
          setPreviewUrl(null);
          setAppAlert({ show: true, type: 'expired' });
          return;
        }

        if (savedResult) {
          setResultUrl(savedResult);
          setIsProcessing(false);
          localStorage.removeItem(storageKeys.IS_PROCESSING);
          localStorage.removeItem(storageKeys.PROGRESS);

          setAppAlert({ show: true, type: 'reserved_warning' });
          return;
        }

        const isProcessingStored = localStorage.getItem(storageKeys.IS_PROCESSING) === 'true';

        if (savedJobId || isProcessingStored) {
          let refreshCount = parseInt(localStorage.getItem(storageKeys.REFRESH_COUNT) || '0', 10);
          refreshCount++;
          localStorage.setItem(storageKeys.REFRESH_COUNT, refreshCount.toString());

          if (refreshCount === 3) {
            localStorage.setItem(storageKeys.ALERT, 'potato');
            setAppAlert({ show: true, type: 'potato' });
          }

          setIsProcessing(true);
          if (savedJobId) {
            pollForResult(savedJobId);
          } else {
            handleUpscale(savedFile);
          }
          return;
        }

        setIsProcessing(false);
        localStorage.removeItem(storageKeys.IS_PROCESSING);
        localStorage.removeItem(storageKeys.PROGRESS);
      } catch (error) {
        console.error('Session restoration failed:', error);
      }
    };

    restoreSession();
  }, [
    pollForResult, handleUpscale, appAlert.show, setAppAlert,
    setIsProcessing, setPreviewUrl, setResultUrl, setSelectedFile,
    setJobId, storageKeys, feature
  ]);

  useEffect(() => {
    let interval;

    const shouldWatchDraft =
      Boolean(previewUrl) &&
      !resultUrl &&
      !localStorage.getItem(storageKeys.JOB_ID) &&
      localStorage.getItem(storageKeys.IS_PROCESSING) !== 'true';

    if (shouldWatchDraft) {
      interval = setInterval(async () => {
        const uploadTimestamp = localStorage.getItem(storageKeys.UPLOAD_TIMESTAMP);

        if (uploadTimestamp && isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession(feature, previewUrl);
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
    previewUrl, resultUrl, setIsProcessing, setJobId,
    setPreviewUrl, setResultUrl, setSelectedFile, storageKeys, feature
  ]);

  useEffect(() => {
    if (appAlert.show && appAlert.type === 'expired') {
      const performCleanup = async () => {
        await clearAppSession(feature, previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
        setResultUrl(null);
        setJobId(null);
        setIsProcessing(false);
      };
      performCleanup();
    }
  }, [
    appAlert.show, appAlert.type, feature, previewUrl, 
    setSelectedFile, setPreviewUrl, setResultUrl, setJobId, setIsProcessing
  ]);
}