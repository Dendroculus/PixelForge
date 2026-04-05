import { useEffect, useRef } from 'react';
import { loadFileFromIDB } from '../utils/idb';
import { clearAppSession } from '../utils/session';
import { APP_CONFIG as config, STORAGE_KEYS } from '../config';
import { isExpired } from '../utils/time';

/**
 * React hook to persist and restore app session state across reloads.
 * Also enforces timeout for:
 * - uploaded-but-not-upscaled image drafts
 * - completed result availability
 *
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
 * @returns {void}
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
  previewUrl,
}) {
  const sessionRestored = useRef(false);

  useEffect(() => {
    if (sessionRestored.current) return;
    sessionRestored.current = true;

    const restoreSession = async () => {
      try {
        const savedFile = await loadFileFromIDB();
        if (!savedFile) return;

        const uploadTimestamp = localStorage.getItem(STORAGE_KEYS.UPLOAD_TIMESTAMP);
        const savedResult = localStorage.getItem(STORAGE_KEYS.RESULT_URL);

        if (!savedResult && isExpired(uploadTimestamp, config.UPLOAD_DRAFT_EXPIRATION_TIME)) {
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

        const savedTimestamp = localStorage.getItem(STORAGE_KEYS.RESULT_TIMESTAMP);

        if (savedResult) {
          if (isExpired(savedTimestamp, config.RESULT_EXPIRATION_TIME)) {
            await clearAppSession();
            setSelectedFile(null);
            setPreviewUrl(null);

            localStorage.setItem(STORAGE_KEYS.ALERT, 'expired');
            setAppAlert({ show: true, type: 'expired' });
            return;
          }

          setResultUrl(savedResult);
          setIsProcessing(false);
          localStorage.removeItem(STORAGE_KEYS.IS_PROCESSING);
          localStorage.removeItem(STORAGE_KEYS.PROGRESS);

          if (!appAlert.show) {
            setAppAlert({ show: true, type: 'reserved_warning' });
          }
          return;
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
          } else {
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
    setSelectedFile,
    setJobId,
  ]);

  /**
   * Live result expiration watcher:
   * Clears state while user remains on page once result TTL passes.
   */
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

  /**
   * Live draft expiration watcher:
   * If user uploaded a file but did not upscale, clear it automatically after TTL
   * even without refresh.
   */
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