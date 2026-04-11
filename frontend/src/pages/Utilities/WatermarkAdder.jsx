import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/fileUtils';
import { calculateImageRect, loadImage } from '../../utils/watermarkMath';
import WatermarkModeTabs from '../../components/Workspace/controls/WatermarkModeTabs';
import TextWatermarkControls from '../../components/Workspace/controls/TextWatermarkControls';
import ImageWatermarkControls from '../../components/Workspace/controls/ImageWatermarkControls';
import WatermarkPreviewOverlay from '../../components/Workspace/display/WatermarkPreviewOverlay';

const FONT_FAMILIES = [
  'Inter',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Nunito',
  'Anton',
  'Caveat',
  'Dancing Script',
  'Merriweather',
  'Oswald',
  'Pacifico',
  'Playfair Display',
  'Raleway',
  'Ubuntu',
  'Arial',
  'Georgia',
  'Impact',
];

const WATERMARK_COLORS = ['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export default function WatermarkAdder() {
  const fileInputRef = useRef(null);
  const watermarkImageRef = useRef(null);
  const imageRef = useRef(null);
  const previewContainerRef = useRef(null);
  const dragConstraintsRef = useRef(null);
  const overlayRef = useRef(null);

  const [activeTab, setActiveTab] = useState('text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 1, height: 1, scale: 1 });
  const [overlayPos, setOverlayPos] = useState({ x: 0, y: 0 });
  const hasInitializedPos = useRef(false);

  const [textWm, setTextWm] = useState({
    text: 'Your Text Here',
    fontFamily: 'Inter',
    color: '#ffffff',
    fontSize: 40,
    opacity: 0.8,
    isBold: true,
    isItalic: false,
    isUnderline: false,
  });

  const [imgWm, setImgWm] = useState({
    url: null,
    opacity: 0.8,
    scale: 0.3,
  });

  const {
    file,
    previewUrl,
    resultBlob,
    setResultBlob,
    resultUrl,
    setResultUrl,
    error,
    setError,
    onFileChange,
    resetAll,
    cleanupResult,
  } = useWorkspaceFile(fileInputRef);

  useEffect(() => {
    const linkId = 'watermark-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Inter:wght@400;700&family=Lato:wght@400;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;700&family=Nunito:wght@400;700&family=Open+Sans:wght@400;700&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Roboto:wght@400;700&family=Ubuntu:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    hasInitializedPos.current = false;
  }, [previewUrl]);

  const updateImageRect = useCallback(() => {
    const rect = calculateImageRect(imageRef.current, previewContainerRef.current);
    setImageRect(rect);

    if (!hasInitializedPos.current && rect.width > 1) {
      setOverlayPos({
        x: rect.left + rect.width / 2 - 80,
        y: rect.top + rect.height / 2 - 20,
      });
      hasInitializedPos.current = true;
    }
  }, []);

  useEffect(() => {
    const box = previewContainerRef.current;
    if (!box) return undefined;

    updateImageRect();
    const observer = new ResizeObserver(() => updateImageRect());
    observer.observe(box);
    return () => observer.disconnect();
  }, [updateImageRect, previewUrl]);

  const handleWatermarkImageUpload = useCallback(
    (e) => {
      const wmFile = e.target.files?.[0];
      if (!wmFile) return;

      if (imgWm.url) URL.revokeObjectURL(imgWm.url);
      const nextUrl = URL.createObjectURL(wmFile);

      setImgWm((prev) => ({ ...prev, url: nextUrl }));
      setActiveTab('image');
      cleanupResult();
    },
    [imgWm.url, cleanupResult]
  );

  const applyWatermark = useCallback(async () => {
    if (!file || !previewUrl) return;

    setIsProcessing(true);
    setError('');
    cleanupResult();

    try {
      const baseImg = await loadImage(previewUrl);

      const canvas = document.createElement('canvas');
      canvas.width = baseImg.naturalWidth || 1;
      canvas.height = baseImg.naturalHeight || 1;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      ctx.drawImage(baseImg, 0, 0);

      const node = overlayRef.current;
      const transform = new DOMMatrix(window.getComputedStyle(node).transform);

      const visualX = transform.m41;
      const visualY = transform.m42;

      const pctX = (visualX - imageRect.left) / Math.max(1, imageRect.width);
      const pctY = (visualY - imageRect.top) / Math.max(1, imageRect.height);

      const targetX = pctX * canvas.width;
      const targetY = pctY * canvas.height;

      ctx.globalAlpha = activeTab === 'text' ? textWm.opacity : imgWm.opacity;

      if (activeTab === 'text') {
        const nativeFontSize = Math.max(1, textWm.fontSize / Math.max(imageRect.scale, 0.0001));
        const fontStyle = textWm.isItalic ? 'italic ' : '';
        const fontWeight = textWm.isBold ? 'bold ' : 'normal ';

        ctx.font = `${fontStyle}${fontWeight}${nativeFontSize}px "${textWm.fontFamily}", sans-serif`;
        ctx.fillStyle = textWm.color;
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = nativeFontSize * 0.08;
        ctx.shadowOffsetX = nativeFontSize * 0.04;
        ctx.shadowOffsetY = nativeFontSize * 0.04;

        ctx.fillText(textWm.text, targetX, targetY);

        if (textWm.isUnderline) {
          const metrics = ctx.measureText(textWm.text || '');
          const textW = Math.max(1, metrics.width);
          ctx.shadowColor = 'transparent';
          ctx.fillRect(targetX, targetY + nativeFontSize * 1.08, textW, Math.max(2, nativeFontSize * 0.06));
        }
      } else if (activeTab === 'image' && imgWm.url) {
        const markImg = await loadImage(imgWm.url);

        const nativeW = Math.max(
          1,
          markImg.naturalWidth * imgWm.scale * (canvas.width / Math.max(1, imageRect.width))
        );
        const nativeH = Math.max(
          1,
          markImg.naturalHeight * imgWm.scale * (canvas.height / Math.max(1, imageRect.height))
        );

        ctx.drawImage(markImg, targetX, targetY, nativeW, nativeH);
      }

      await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas export failed'));
              return;
            }
            setResultBlob(blob);
            setResultUrl(URL.createObjectURL(blob));
            resolve();
          },
          file.type || 'image/jpeg',
          0.95
        );
      });
    } catch {
      setError('Failed to apply watermark. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [file, previewUrl, cleanupResult, imageRect, activeTab, textWm, imgWm, setResultBlob, setResultUrl, setError]);

  const handleReset = useCallback(() => {
    resetAll();
    setIsProcessing(false);
    setActiveTab('text');
  }, [resetAll]);

  const canProcess = useMemo(() => Boolean(file) && !isProcessing && !resultUrl, [file, isProcessing, resultUrl]);
  const downloadName = useMemo(() => generateSafeFilename(file?.name, 'watermarked', 'jpg'), [file?.name]);

  return (
    <ToolPageWrapper>
      <ToolWorkspaceShell
        minHeight="min-h-96"
        leftHeader={<ClientSideHeader />}
        leftBody={
          <div className="space-y-4">
            {!file ? (
              <UploadCard
                inputId="wm-file-input"
                inputRef={fileInputRef}
                onChange={onFileChange}
                helperText={`Any format up to ${APP_CONFIG.MAX_FILE_SIZE_MB}MB`}
              />
            ) : (
              <WorkspaceFileSummary file={file} />
            )}

            <div className={`space-y-3 transition-opacity duration-300 ${!file || resultUrl ? 'pointer-events-none opacity-40' : 'opacity-100'}`}>
              <WatermarkModeTabs activeTab={activeTab} setActiveTab={setActiveTab} />

              {activeTab === 'text' && (
                <TextWatermarkControls
                  textWm={textWm}
                  setTextWm={setTextWm}
                  fontFamilies={FONT_FAMILIES}
                  watermarkColors={WATERMARK_COLORS}
                />
              )}

              {activeTab === 'image' && (
                <ImageWatermarkControls
                  watermarkImageRef={watermarkImageRef}
                  handleWatermarkImageUpload={handleWatermarkImageUpload}
                  imgWm={imgWm}
                  setImgWm={setImgWm}
                />
              )}
            </div>

            <WorkspaceErrorAlert error={error} />
          </div>
        }
        leftFooter={
          <WorkspaceActionRow
            primaryLabel={isProcessing ? 'Applying...' : 'Add Watermark'}
            secondaryLabel="Reset"
            onPrimaryClick={applyWatermark}
            onSecondaryClick={handleReset}
            primaryDisabled={!canProcess}
          />
        }
        rightHeader={<h3 className="text-sm font-medium text-slate-700">Preview Workspace</h3>}
        rightBody={
          <div className="absolute inset-2 flex flex-col">
            <PreviewImageBox
              previewUrl={previewUrl}
              resultUrl={resultUrl}
              resultAlt="Watermarked output preview"
              containerRef={previewContainerRef}
            >
              {previewUrl && !resultUrl && (
                <>
                  <img
                    src={previewUrl}
                    ref={imageRef}
                    alt="Base workspace"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
                    onLoad={updateImageRect}
                  />

                  <div
                    ref={dragConstraintsRef}
                    className="absolute pointer-events-none"
                    style={{
                      left: imageRect.left,
                      top: imageRect.top,
                      width: imageRect.width,
                      height: imageRect.height,
                    }}
                  />

                  <WatermarkPreviewOverlay
                    overlayRef={overlayRef}
                    dragConstraintsRef={dragConstraintsRef}
                    overlayPos={overlayPos}
                    activeTab={activeTab}
                    textWm={textWm}
                    imgWm={imgWm}
                  />
                </>
              )}
            </PreviewImageBox>

            <AnimatePresence>
              {resultUrl && (
                <WorkspaceResultDownload
                  resultUrl={resultUrl}
                  resultBlob={resultBlob}
                  originalFile={file}
                  downloadName={downloadName}
                  downloadLabel="Download Protected Image"
                />
              )}
            </AnimatePresence>
          </div>
        }
      />
    </ToolPageWrapper>
  );
}