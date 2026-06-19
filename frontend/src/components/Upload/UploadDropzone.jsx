import PropTypes from 'prop-types';
import { AppConfig as config } from '@/config';
import { useFileUpload } from '@/hooks/client/useFileUpload';
import { AcceptableImageMimeTypes } from '@/utils/file/fileUtils';

const AllowedFormatsText = config.ALLOWED_EXTENSIONS.map((e) =>
  e.toUpperCase(),
).join(', ');

/**
 * Image upload dropzone component supporting click, drag & drop, and clipboard paste.
 * Enforces allowed file types via native OS file picker and internal validation hook.
 *
 * @param {Object} props
 * @param {(file: File) => void} props.onFileSelect - Callback executed when a valid image file is selected.
 * @param {boolean} [props.requireGrayscale=false] - Whether uploaded images must pass grayscale validation.
 * @returns {JSX.Element}
 */
export default function UploadDropzone({
  onFileSelect,
  requireGrayscale = false,
}) {
  const { isDragging, error, inputRef, handlers } = useFileUpload({
    onFileSelect,
    requireGrayscale,
    clearErrorAfterMs: 5000,
  });

  const getDropzoneStateClasses = () => {
    if (isDragging) return 'border-slate-800 bg-white/60 scale-[1.02]';
    if (error) return 'border-rose-400 bg-rose-50/50 hover:bg-rose-50';
    return 'border-white/60 bg-white/30 hover:border-white hover:bg-white/50';
  };

  return (
    <button
      type="button"
      aria-label="Upload image file"
      className={`w-full border-2 border-dashed rounded-xl p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 ease-in-out ${getDropzoneStateClasses()}`}
      onDragOver={handlers.onDragOver}
      onDragLeave={handlers.onDragLeave}
      onDrop={handlers.onDrop}
      onClick={handlers.onClick}
    >
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept={AcceptableImageMimeTypes}
        onChange={handlers.onChange}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
        <div
          className={`w-14 h-14 rounded-2xl shadow-sm border flex items-center justify-center transition-colors duration-300
          ${error ? 'bg-rose-100 border-rose-200 text-rose-600' : 'bg-white border-white/50 text-slate-700'}`}
        >
          {error ? (
            <svg
              className="w-7 h-7 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}
        </div>

        <div>
          {error ? (
            <>
              <p className="font-bold text-base sm:text-lg text-rose-600 max-w-100 mx-auto leading-snug px-4">
                {error}
              </p>
              <p className="text-sm mt-2 text-rose-500 font-medium">
                Strictly {AllowedFormatsText} only!
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-lg text-slate-800">
                Upload an image by clicking, dragging, or pasting
              </p>
              <p className="text-sm mt-1.5 text-slate-600 font-medium">
                Max {config.MAX_FILE_SIZE_MB}MB
              </p>
            </>
          )}
        </div>
      </div>
    </button>
  );
}

UploadDropzone.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  requireGrayscale: PropTypes.bool,
};
