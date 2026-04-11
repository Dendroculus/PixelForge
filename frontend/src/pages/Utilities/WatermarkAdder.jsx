import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { APP_CONFIG } from '../../config';
import UploadCard from '../../components/Upload/UploadCard';
import ToolWorkspaceShell from '../../components/Layout/ToolWorkspaceShell';
import ToolPageWrapper from '../../components/Layout/ToolPageWrapper';
import PreviewImageBox from '../../components/Workspace/display/PreviewImageBox';
import WorkspaceFileSummary from '../../components/Workspace/display/WorkspaceFileSummary';
import WorkspaceErrorAlert from '../../components/Workspace/display/WorkspaceErrorAlert';
import WorkspaceActionRow from '../../components/Actions/WorkspaceActionRow';
import WorkspaceResultDownload from '../../components/Workspace/display/WorkspaceResultDownload';
import FormatDropdown from '../../components/Workspace/controls/FormatDropdown';
import ClientSideHeader from '../../components/Workspace/Header/ClientSideHeader';
import { useWorkspaceFile } from '../../hooks/workspace/useWorkspaceFile';
import { generateSafeFilename } from '../../utils/fileUtils';

const FONT_FAMILIES = [
  'Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Nunito', 'Arial', 'Georgia', 'Impact'
];

const WATERMARK_COLORS = ['#ffffff', '#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

/**
 * Calculates a precise bounding box of the rendered image to restrict dragging.
 */
function calculateImageRect(img, box) {
  if (!img || !box) return { left: 0, top: 0, width: 1, height: 1, scale: 1 };

  const cw = box.clientWidth || 1;
  const ch = box.clientHeight || 1;
  const iw = img.naturalWidth || 1;
  const ih = img.naturalHeight || 1;

  // Maximize the image size to its container bounds
  const scale = Math.min(cw / iw, ch / ih);
  const width = Math.max(1, iw * scale);
  const height = Math.max(1, ih * scale);
  const left = (cw - width) / 2;
  const top = (ch - height) / 2;

  return { left, top, width, height, scale };
}

/**
 * Loads an image element from a URL.
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });
}

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

  // Reset starting position whenever a new base image is uploaded
  useEffect(() => {
    hasInitializedPos.current = false;
  }, [previewUrl]);

  const updateImageRect = useCallback(() => {
    const rect = calculateImageRect(imageRef.current, previewContainerRef.current);
    setImageRect(rect);

    // Drop the watermark in the center on first load
    if (!hasInitializedPos.current && rect.width > 1) {
      setOverlayPos({ x: rect.left + rect.width / 2 - 80, y: rect.top + rect.height / 2 - 20 });
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

  const handleWatermarkImageUpload = useCallback((e) => {
    const wmFile = e.target.files?.[0];
    if (!wmFile) return;

    if (imgWm.url) URL.revokeObjectURL(imgWm.url);
    const nextUrl = URL.createObjectURL(wmFile);

    setImgWm((prev) => ({ ...prev, url: nextUrl }));
    setActiveTab('image');
    cleanupResult();
  }, [imgWm.url, cleanupResult]);

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

      // Extract accurate visual position using DOMMatrix
      const node = overlayRef.current;
      const transform = new DOMMatrix(window.getComputedStyle(node).transform);
      
      // Because motion.div initial={{x,y}} applies a translate3d, m41/m42 contain the absolute X/Y.
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

        const nativeW = Math.max(1, markImg.naturalWidth * imgWm.scale * (canvas.width / Math.max(1, imageRect.width)));
        const nativeH = Math.max(1, markImg.naturalHeight * imgWm.scale * (canvas.height / Math.max(1, imageRect.height)));

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
  }, [
    file,
    previewUrl,
    cleanupResult,
    imageRect,
    activeTab,
    textWm,
    imgWm,
    setResultBlob,
    setResultUrl,
    setError,
  ]);

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
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all ${
                    activeTab === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Text Overlay
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('image')}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-all ${
                    activeTab === 'image' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Image Logo
                </button>
              </div>

              {activeTab === 'text' && (
                <div className="space-y-3 pb-1">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Watermark Text</label>
                    <input
                      type="text"
                      value={textWm.text}
                      onChange={(e) => setTextWm((prev) => ({ ...prev, text: e.target.value }))}
                      placeholder="Enter watermark text"
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col justify-end">
                      <FormatDropdown
                        value={textWm.fontFamily}
                        options={FONT_FAMILIES}
                        onChange={(val) => setTextWm((prev) => ({ ...prev, fontFamily: val }))}
                        label="Font Family"
                        transform="none"
                        labelClassName="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide"
                        buttonClassName="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 h-9 text-sm font-semibold text-slate-700 shadow-sm outline-none transition-all hover:bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        getOptionStyle={(opt) => ({ fontFamily: opt })}
                      />
                    </div>

                    <div className="flex flex-col justify-end pb-0.5">
                      <div className="grid h-9 grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setTextWm((prev) => ({ ...prev, isBold: !prev.isBold }))}
                          className={`rounded-md text-sm font-bold transition-colors ${
                            textWm.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextWm((prev) => ({ ...prev, isItalic: !prev.isItalic }))}
                          className={`rounded-md text-sm transition-colors ${
                            textWm.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="italic">I</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextWm((prev) => ({ ...prev, isUnderline: !prev.isUnderline }))}
                          className={`rounded-md text-sm transition-colors ${
                            textWm.isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="underline">U</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Text Color</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {WATERMARK_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setTextWm((prev) => ({ ...prev, color }))}
                          className={`h-7 w-7 shrink-0 rounded-full shadow-sm transition-all ${
                            textWm.color === color
                              ? 'ring-2 ring-indigo-500 ring-offset-2'
                              : 'border border-slate-200 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                      <div className={`relative h-7 w-7 shrink-0 rounded-full bg-linear-to-tr from-rose-400 via-fuchsia-500 to-indigo-500 shadow-sm transition-all flex items-center justify-center cursor-pointer ${!WATERMARK_COLORS.includes(textWm.color) ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:scale-105'}`}>
                        <svg className="w-3.5 h-3.5 text-white drop-shadow-md pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                        <input
                          type="color"
                          value={textWm.color}
                          onChange={(e) => setTextWm((prev) => ({ ...prev, color: e.target.value }))}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          title="Custom color"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <span>Size</span>
                        <span className="text-indigo-600">{textWm.fontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="120"
                        value={textWm.fontSize}
                        onChange={(e) => setTextWm((prev) => ({ ...prev, fontSize: Number(e.target.value) }))}
                        className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <span>Opacity</span>
                        <span className="text-indigo-600">{Math.round(textWm.opacity * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={textWm.opacity}
                        onChange={(e) => setTextWm((prev) => ({ ...prev, opacity: Number(e.target.value) }))}
                        className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'image' && (
                <div className="space-y-4 pb-2">
                  <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer shadow-sm">
                    <input
                      type="file"
                      ref={watermarkImageRef}
                      onChange={handleWatermarkImageUpload}
                      accept="image/png, image/jpeg, image/webp"
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-semibold text-slate-700">
                        {imgWm.url ? 'Replace logo image' : 'Upload logo image (.png)'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Scale</label>
                      <input
                        type="range"
                        min="0.1"
                        max="2"
                        step="0.1"
                        value={imgWm.scale}
                        onChange={(e) => setImgWm((prev) => ({ ...prev, scale: Number(e.target.value) }))}
                        className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
                        <span>Opacity</span>
                        <span className="text-indigo-600">{Math.round(imgWm.opacity * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={imgWm.opacity}
                        onChange={(e) => setImgWm((prev) => ({ ...prev, opacity: Number(e.target.value) }))}
                        className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600"
                      />
                    </div>
                  </div>
                </div>
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

                  {/* THE INVISIBLE BRICK WALL */}
                  <div
                    ref={dragConstraintsRef}
                    className="absolute pointer-events-none"
                    style={{
                      left: imageRect.left,
                      top: imageRect.top,
                      width: imageRect.width,
                      height: imageRect.height
                    }}
                  />

                  {/* DRAG ELASTIC = 0 */}
                  {overlayPos.x !== 0 && overlayPos.y !== 0 && (
                    <motion.div
                      ref={overlayRef}
                      drag
                      dragMomentum={false}
                      dragElastic={0} 
                      dragConstraints={dragConstraintsRef}
                      initial={{ x: overlayPos.x, y: overlayPos.y }}
                      className="absolute z-50 cursor-grab active:cursor-grabbing rounded-md border border-dashed border-transparent hover:border-indigo-400 hover:bg-white/10"
                      style={{
                        opacity: activeTab === 'text' ? textWm.opacity : imgWm.opacity,
                        padding: '4px',
                        left: 0,
                        top: 0
                      }}
                    >
                      {activeTab === 'text' ? (
                        <span
                          style={{
                            fontFamily: `"${textWm.fontFamily}", sans-serif`,
                            color: textWm.color,
                            fontSize: `${textWm.fontSize}px`,
                            fontWeight: textWm.isBold ? 'bold' : 'normal',
                            fontStyle: textWm.isItalic ? 'italic' : 'normal',
                            textDecoration: textWm.isUnderline ? 'underline' : 'none',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.45)',
                            lineHeight: 1,
                            whiteSpace: 'nowrap',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        >
                          {textWm.text}
                        </span>
                      ) : imgWm.url ? (
                        <img
                          src={imgWm.url}
                          alt="Logo overlay"
                          style={{
                            transform: `scale(${imgWm.scale})`,
                            transformOrigin: 'top left',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            display: 'block',
                          }}
                        />
                      ) : null}
                    </motion.div>
                  )}
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