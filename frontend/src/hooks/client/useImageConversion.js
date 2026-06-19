import { useCallback, useState } from 'react';
import { processImageWithCanvas } from '@/utils/image/imageUtils';

/**
 * Maps output format to MIME type.
 * @param {string} format - Output format extension.
 * @returns {string} MIME type.
 */
function getMimeFromFormat(format) {
  if (format === 'jpg') return 'image/jpeg';
  if (format === 'png') return 'image/png';
  if (format === 'jpeg') return 'image/jpeg';
  return 'image/webp';
}

/**
 * Manages image conversion task lifecycle and output generation.
 * @param {{
 *   file: File | null | undefined,
 *   targetFormat: string,
 *   quality: number,
 *   cleanupResult: () => void,
 *   setResultBlob: (blob: Blob) => void,
 *   setResultUrl: (url: string) => void,
 *   setError: (message: string) => void
 * }} params
 * @returns {{
 *   isConverting: boolean,
 *   setIsConverting: React.Dispatch<React.SetStateAction<boolean>>,
 *   convertImage: () => Promise<void>
 * }}
 */
export default function useImageConversion({
  file,
  targetFormat,
  quality,
  cleanupResult,
  setResultBlob,
  setResultUrl,
  setError,
}) {
  const [isConverting, setIsConverting] = useState(false);

  const convertImage = useCallback(async () => {
    if (!file || isConverting) return;

    setIsConverting(true);
    setError('');
    cleanupResult();

    try {
      const blob = await processImageWithCanvas(file, {
        mimeType: getMimeFromFormat(targetFormat),
        quality: targetFormat === 'png' ? undefined : quality,
        fillBackground: targetFormat === 'jpg' || targetFormat === 'jpeg',
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected conversion error.');
    } finally {
      setIsConverting(false);
    }
  }, [
    cleanupResult,
    file,
    isConverting,
    quality,
    setError,
    setResultBlob,
    setResultUrl,
    targetFormat,
  ]);

  return {
    isConverting,
    setIsConverting,
    convertImage,
  };
}
