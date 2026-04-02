import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { APP_CONFIG as config, STORAGE_KEYS } from '../config';

/**
 * React hook to persist and restore app session state across reloads.
 * @param {{
 *  setSelectedFile: (file: File|null) => void,
 *  setPreviewUrl: (url: string|null) => void,
 *  setResultUrl: (url: string|null) => void,
 *  setIsProcessing: (state: boolean) => void,
 *  setJobId: (id: string|null) => void,
 *  setAppAlert: (alert: {show: boolean, type: string}) => void,
 *  appAlert: {show: boolean},
 *  pollForResult: (jobId: string) => void,
 *  handleUpscale: (file: File) => void,
 *  resultUrl: string|null,
 *  previewUrl: string|null
 * }} params
 */
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
  previewUrl
}) {
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

    const restoreSession = async () => {
      try {
        const savedFile = await loadFileFromIDB();
        if (!savedFile) return;

        setSelectedFile(savedFile);
        setPreviewUrl(URL.createObjectURL(savedFile));

        const savedResult = localStorage.getItem(STORAGE_KEYS.RESULT_URL);
        const savedTimestamp = localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP);

        if (savedResult) {
          if (savedTimestamp && Date.now() - parseInt(savedTimestamp) > config.RESULT_EXPIRATION_TIME) {
            await clearAppSession();
            setSelectedFile(null);
            setPreviewUrl(null);

            localStorage.setItem(STORAGE_KEYS.ALERT, 'expired');
            setAppAlert({ show: true, type: 'expired' });
            return;
          } else {
            setResultUrl(savedResult);
            setIsProcessing(false);
            localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
            localStorage.removeItem(STORAGE_KEYS.PROGRESS);

            if (!appAlert.show) {
              setAppAlert({ show: true, type: 'reserved_warning' });
            }
            return;
          }
        }

        const savedJobId = localStorage.getItem(STORAGE_KEYS.JOB_ID);
        const isProcessingStored = localStorage.getItem(STORAGE_KEYS.IS_PROCESSING) === 'true';

        if (savedJobId || isProcessingStored) {
          let refreshCount = parseInt(localStorage.getItem(STORAGE_KEYS.REFRESH_COUNT) || '0', 10);
          refreshCount++;
          localStorage.setItem(STORAGE_KEYS.REFRESH_COUNT, refreshCount.toString());

          if (refreshCount === 3) {
            localStorage.setItem(STORAGE_KEYS.ALERT, 'potato');
            setAppAlert({ show: true, type: 'potato' });
          }

          if (savedJobId) {
            setIsProcessing(true);
            pollForResult(savedJobId);
          } else if (isProcessingStored) {
            setIsProcessing(true);
            handleUpscale(savedFile);
          }
        } else {
          setIsProcessing(false);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      }
    };

    restoreSession();
  }, [
    pollForResult,
    handleUpscale,
    appAlert.show,
    setAppAlert,
    setIsProcessing,
    setPreviewUrl,
    setResultUrl,
    setSelectedFile
  ]);

  useEffect(() => {
    let interval;

    if (resultUrl) {
      interval = setInterval(async () => {
        const savedTimestamp = localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP);

        if (savedTimestamp && Date.now() - parseInt(savedTimestamp) > config.RESULT_EXPIRATION_TIME) {
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
}