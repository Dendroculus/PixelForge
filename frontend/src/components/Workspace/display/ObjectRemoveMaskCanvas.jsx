import { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';

export default function ObjectRemoveMaskCanvas({
  imageUrl,
  disabled = false,
  brushSize = 32,
  onMaskChange,
}) {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const imageRef = useRef(null);
  const drawingRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageUrl;

    image.onload = () => {
      imageRef.current = image;

      const imageCanvas = imageCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;

      if (!imageCanvas || !maskCanvas) return;

      imageCanvas.width = image.naturalWidth;
      imageCanvas.height = image.naturalHeight;
      maskCanvas.width = image.naturalWidth;
      maskCanvas.height = image.naturalHeight;

      const imageCtx = imageCanvas.getContext('2d');
      const maskCtx = maskCanvas.getContext('2d');

      imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
      imageCtx.drawImage(image, 0, 0);

      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

      setIsReady(true);
    };
  }, [imageUrl]);

  const emitMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || !onMaskChange) return;

    maskCanvas.toBlob((blob) => {
      if (blob) onMaskChange(blob);
    }, 'image/png');
  }, [onMaskChange]);

  const getPoint = (event) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const clientY = event.touches?.[0]?.clientY ?? event.clientY;

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawAt = (event) => {
    if (disabled || !drawingRef.current) return;

    event.preventDefault();

    const canvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPoint(event);

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePointerDown = (event) => {
    if (disabled || !isReady) return;

    drawingRef.current = true;
    drawAt(event);
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;

    drawingRef.current = false;
    emitMask();
  };

  const handleClear = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    emitMask();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
      <div className="relative max-w-full max-h-112 rounded-2xl overflow-hidden shadow-inner border border-white/70 bg-white/30">
        <canvas
          ref={imageCanvasRef}
          className="block max-w-full max-h-112 object-contain"
        />

        <canvas
          ref={maskCanvasRef}
          className="absolute inset-0 w-full h-full opacity-45 cursor-crosshair touch-none"
          onMouseDown={handlePointerDown}
          onMouseMove={drawAt}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={drawAt}
          onTouchEnd={handlePointerUp}
        />
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
        <span>Paint the object you want to remove.</span>

        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="px-3 py-1.5 rounded-lg bg-white/70 border border-white text-slate-700 font-bold hover:bg-white disabled:opacity-50"
        >
          Clear Mask
        </button>
      </div>
    </div>
  );
}

ObjectRemoveMaskCanvas.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  brushSize: PropTypes.number,
  onMaskChange: PropTypes.func.isRequired,
};