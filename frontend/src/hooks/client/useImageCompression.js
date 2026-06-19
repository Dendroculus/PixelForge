import { useCallback, useState } from 'react';
import { processImageWithCanvas } from '@/utils/image/imageUtils';

/**
 * Manages image compression task lifecycle and output generation.
 * @param {{
 *   file: File | null | undefined,
 *   quality: number,
 *   cleanupResult: () => void,
 *   setResultBlob: (blob: Blob) => void,
 *   setResultUrl: (url: string) => void,
 *   setError: (message: string) => void
 * }} params
 * @returns {{
 *   isCompressing: boolean,
 *   setIsCompressing: React.Dispatch<React.SetStateAction<boolean>>,
 *   compressImage: () => Promise<void>
 * }}
 */
export default function useImageCompression({
  file,
  quality,
  cleanupResult,
  setResultBlob,
  setResultUrl,
  setError,
}) {
  const [isCompressing, setIsCompressing] = useState(false);

  const compressImage = useCallback(async () => {
    if (!file || isCompressing) return;

    setIsCompressing(true);
    setError('');
    cleanupResult();

    try {
      const blob = await processImageWithCanvas(file, {
        mimeType: 'image/jpeg',
        quality,
        fillBackground: true,
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unexpected compression error.',
      );
    } finally {
      setIsCompressing(false);
    }
  }, [
    cleanupResult,
    file,
    isCompressing,
    quality,
    setError,
    setResultBlob,
    setResultUrl,
  ]);

  return {
    isCompressing,
    setIsCompressing,
    compressImage,
  };
}
