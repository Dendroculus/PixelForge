import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

const ObjectRemoveMaskCanvas = forwardRef(function ObjectRemoveMaskCanvas(
  {
    imageUrl,
    disabled = false,
    brushSize = 32,
    onMaskChange,
  },
  ref,
) {
  const imageCanvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const drawingRef = useRef(false);
  const hasMaskRef = useRef(false);

  const [isReady, setIsReady] = useState(false);

  const getMaskBlob = useCallback(() => {
    return new Promise((resolve) => {
      const maskCanvas = maskCanvasRef.current;

      if (!maskCanvas || !hasMaskRef.current) {
        resolve(null);
        return;
      }

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = maskCanvas.width;
      exportCanvas.height = maskCanvas.height;

      const exportCtx = exportCanvas.getContext('2d');

      exportCtx.fillStyle = 'black';
      exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      exportCtx.drawImage(maskCanvas, 0, 0);

      exportCanvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }, []);

  const clearMask = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    const ctx = maskCanvas.getContext('2d');
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);

    hasMaskRef.current = false;
    onMaskChange?.(false);
  }, [onMaskChange]);

  useImperativeHandle(
    ref,
    () => ({
      getMaskBlob,
      clearMask,
      hasMask: () => hasMaskRef.current,
    }),
    [getMaskBlob, clearMask],
  );

  useEffect(() => {
    if (!imageUrl) return undefined;

    const image = new Image();
    image.src = imageUrl;

    image.onload = () => {
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

      hasMaskRef.current = false;
      onMaskChange?.(false);
      setIsReady(true);
    };

    image.onerror = () => {
      hasMaskRef.current = false;
      onMaskChange?.(false);
      setIsReady(false);
    };

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [imageUrl, onMaskChange]);

  const getPoint = (event) => {
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const source = event.touches?.[0] ?? event;

    return {
      x: ((source.clientX - rect.left) / rect.width) * canvas.width,
      y: ((source.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const drawAt = useCallback(
    (event) => {
      if (disabled || !drawingRef.current || !isReady) return;

      event.preventDefault();

      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const { x, y } = getPoint(event);

      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();

      hasMaskRef.current = true;
      onMaskChange?.(true);
    },
    [brushSize, disabled, isReady, onMaskChange],
  );

  const handlePointerDown = (event) => {
    if (disabled || !isReady) return;

    drawingRef.current = true;
    drawAt(event);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
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
          className="absolute inset-0 w-full h-full opacity-55 cursor-crosshair touch-none"
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
        <span>
          {isReady
            ? 'Paint the object you want to remove.'
            : 'Preparing image canvas...'}
        </span>

        <button
          type="button"
          onClick={clearMask}
          disabled={disabled || !isReady}
          className="px-3 py-1.5 rounded-lg bg-white/70 border border-white text-slate-700 font-bold hover:bg-white disabled:opacity-50"
        >
          Clear Mask
        </button>
      </div>
    </div>
  );
});

ObjectRemoveMaskCanvas.propTypes = {
  imageUrl: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  brushSize: PropTypes.number,
  onMaskChange: PropTypes.func,
};

export default ObjectRemoveMaskCanvas;