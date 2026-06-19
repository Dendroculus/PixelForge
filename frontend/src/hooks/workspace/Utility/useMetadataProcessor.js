import { useState, useCallback } from 'react';
import { processImageWithCanvas } from '@/utils/image/imageUtils';
import exifr from 'exifr';

/**
 * Handles image metadata parsing and metadata stripping flow.
 * @returns {{
 * selectedFile: File|null,
 * previewUrl: string|null,
 * metadata: Object|null,
 * strippedUrl: string|null,
 * isProcessing: boolean,
 * isClean: boolean|null,
 * handleFileSelect: (file: File) => Promise<void>,
 * handleCancel: () => void
 * }}
 */
export function useMetadataProcessor() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [strippedUrl, setStrippedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (file) => {
    setIsProcessing(true);
    setSelectedFile(file);

    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);

    try {
      const parsedData = await exifr.parse(file);
      setMetadata(parsedData || {});

      if (parsedData && Object.keys(parsedData).length > 0) {
        const cleanBlob = await processImageWithCanvas(file, {
          mimeType: file.type || 'image/jpeg',
          quality: 1.0,
        });
        setStrippedUrl(URL.createObjectURL(cleanBlob));
      } else {
        setStrippedUrl(null);
      }
    } catch (error) {
      console.error('Failed to process metadata:', error);
      setMetadata({});
      setStrippedUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setMetadata(null);
    setStrippedUrl(null);
  }, []);

  const isClean = metadata && Object.keys(metadata).length === 0;

  return {
    selectedFile,
    previewUrl,
    metadata,
    strippedUrl,
    isProcessing,
    isClean,
    handleFileSelect,
    handleCancel,
  };
}
