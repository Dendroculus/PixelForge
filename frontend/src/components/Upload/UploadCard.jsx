import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { validateImageUpload } from '../../utils/file/fileValidation';

const AcceptableImageMimeTypes = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

/**
 * Renders a customizable upload card for file selection with validation.
 * @param {Object} props - The component props.
 * @param {string} props.inputId - HTML id attribute for the file input element.
 * @param {React.MutableRefObject} [props.inputRef] - Ref attached to the hidden file input.
 * @param {Function} [props.onChange] - Callback fired when a file is selected.
 * @param {Function} [props.onValidationError] - Callback fired if file validation fails.
 * @param {string} [props.helperText] - Text to display below the main upload instruction.
 * @param {string} [props.accept='.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'] - Accepted file mime types.
 * @param {string} [props.className=''] - Additional CSS classes for the card container.
 * @param {string} [props.heightClass='h-36'] - CSS class to control the card's height.
 * @param {boolean} [props.validate=true] - Whether to validate the file before triggering onChange.
 * @param {number} [props.clearErrorAfterMs=5000] - Time in ms to clear validation error messages.
 * @param {number} [props.maxSizeMB] - Maximum allowed file size in MB.
 * @returns {JSX.Element}
 */
export default function UploadCard({
  inputId,
  inputRef,
  onChange,
  onValidationError,
  helperText,
  accept = AcceptableImageMimeTypes,
  className = '',
  heightClass = 'h-36',
  validate = true,
  clearErrorAfterMs = 5000,
  maxSizeMB,
}) {
  const [localError, setLocalError] = useState('');
  const timeoutRef = useRef(null);

  const clearLocalError = useCallback(() => {
    setLocalError('');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setErrorWithTimer = useCallback(
    (message) => {
      setLocalError(message);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (clearErrorAfterMs > 0) {
        timeoutRef.current = setTimeout(() => {
          setLocalError('');
          timeoutRef.current = null;
        }, clearErrorAfterMs);
      }
    },
    [clearErrorAfterMs]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      clearLocalError();

      if (!validate) {
        onChange?.(event);
        return;
      }

      const result = await validateImageUpload(file, maxSizeMB);

      if (!result.isValid) {
        const msg = result.error || 'Invalid file.';
        setErrorWithTimer(msg);
        onValidationError?.(msg);
        if (inputRef?.current) inputRef.current.value = '';
        return;
      }

      const syntheticEvent = {
        ...event,
        target: {
          ...event.target,
          files: [result.file || file],
        },
      };

      onChange?.(syntheticEvent);
    },
    [validate, onChange, onValidationError, inputRef, clearLocalError, setErrorWithTimer, maxSizeMB]
  );

  const cardStateClass = localError
    ? 'border-rose-300 bg-rose-50/50 hover:border-rose-400 hover:bg-rose-50/60'
    : 'border-indigo-200 bg-white/40 hover:bg-white/70 hover:border-indigo-400';

  const iconWrapClass = localError
    ? 'bg-rose-100 border-rose-200 text-rose-600'
    : 'bg-white border-white/50 text-indigo-500';

  const titleClass = localError
    ? 'text-rose-600 group-hover:text-rose-600'
    : 'text-slate-700 group-hover:text-indigo-600';

  const helperClass = localError ? 'text-rose-500' : 'text-slate-500';

  return (
    <label
      htmlFor={inputId}
      aria-label={localError ? localError : 'Upload image file'}
      className={`group relative flex w-full ${heightClass} flex-col items-center justify-center rounded-2xl border-2 border-dashed shadow-sm transition-all cursor-pointer hover:shadow-md ${cardStateClass} ${className}`}
    >
      <div className="flex flex-col items-center justify-center px-4 pt-5 pb-6 text-center">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border ${iconWrapClass}`}>
          {localError ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg
              className="h-6 w-6 transition-transform group-hover:scale-110"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          )}
        </div>

        <p className={`mb-1 text-sm font-semibold transition-colors ${titleClass}`}>
          {localError ? localError : 'Click to upload image'}
        </p>
        <p className={`text-xs font-medium ${helperClass}`}>
          {localError ? 'Please try another file' : helperText}
        </p>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        className="hidden"
      />
    </label>
  );
}

UploadCard.propTypes = {
  inputId: PropTypes.string.isRequired,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ]),
  onChange: PropTypes.func,
  onValidationError: PropTypes.func,
  helperText: PropTypes.string,
  accept: PropTypes.string,
  className: PropTypes.string,
  heightClass: PropTypes.string,
  validate: PropTypes.bool,
  clearErrorAfterMs: PropTypes.number,
  maxSizeMB: PropTypes.number,
};