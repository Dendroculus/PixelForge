import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../../utils/storage/idb';
import { clearAppSession } from '../../utils/storage/session';
import { APP_CONFIG as config } from '../../config';
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
      try {
        const savedFile = await loadFileFromIDB(feature);
        if (!savedFile) return;

        const uploadTimestamp = localStorage.getItem(storageKeys.UPLOAD_TIMESTAMP);
        const savedResult = localStorage.getItem(storageKeys.RESULT_URL);

        if (!savedResult && isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession(null, feature);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);
          setIsProcessing(false);
          return;
        }

        setSelectedFile(savedFile);
        setPreviewUrl(URL.createObjectURL(savedFile));

        const savedTimestamp = localStorage.getItem(storageKeys.RESULT_TIMESTAMP);

        if (savedResult) {
          if (isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
            await clearAppSession(null, feature);
            setSelectedFile(null);
            setPreviewUrl(null);

            localStorage.setItem(storageKeys.ALERT, 'expired');
            setAppAlert({ show: true, type: 'expired' });
            return;
          }

          setResultUrl(savedResult);
          setIsProcessing(false);
          localStorage.removeItem(storageKeys.IS_PROCESSING);
          localStorage.removeItem(storageKeys.PROGRESS);

          if (!appAlert.show) {
            setAppAlert({ show: true, type: 'reserved_warning' });
          }
          return;
        }

        const savedJobId = localStorage.getItem(storageKeys.JOB_ID);
        const isProcessingStored = localStorage.getItem(storageKeys.IS_PROCESSING) === 'true';

        if (savedJobId || isProcessingStored) {
          let refreshCount = parseInt(localStorage.getItem(storageKeys.REFRESH_COUNT) || '0', 10);
          refreshCount++;
          localStorage.setItem(storageKeys.REFRESH_COUNT, refreshCount.toString());

          if (refreshCount === 3) {
            localStorage.setItem(storageKeys.ALERT, 'potato');
            setAppAlert({ show: true, type: 'potato' });
          }

          if (savedJobId) {
            setIsProcessing(true);
            pollForResult(savedJobId);
          } else {
            setIsProcessing(true);
            handleUpscale(savedFile);
          }
        } else {
          setIsProcessing(false);
          localStorage.removeItem(storageKeys.IS_PROCESSING);
          localStorage.removeItem(storageKeys.PROGRESS);
        }
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

    if (resultUrl) {
      interval = setInterval(async () => {
        const savedTimestamp = localStorage.getItem(storageKeys.RESULT_TIMESTAMP);

        if (isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
          await clearAppSession(previewUrl, feature);
          setSelectedFile(null);
          setPreviewUrl(null);
          setResultUrl(null);
          setJobId(null);

          localStorage.setItem(storageKeys.ALERT, 'expired');
          setAppAlert({ show: true, type: 'expired' });
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [resultUrl, previewUrl, setAppAlert, setJobId, setPreviewUrl, setResultUrl, setSelectedFile, storageKeys, feature]);

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

        if (isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
          await clearAppSession(previewUrl, feature);
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
}