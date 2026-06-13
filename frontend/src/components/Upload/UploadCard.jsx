import PropTypes from 'prop-types';
import { useFileUpload } from '../../hooks/client/useFileUpload';
import { AcceptableImageMimeTypes } from '../../utils/file/fileUtils';

export default function UploadCard({
  inputId,
  inputRef: externalRef,
  onChange,
  onValidationError,
  helperText,
  accept = AcceptableImageMimeTypes,
  className = '',
  heightClass = 'h-36',
  validate = true,
  clearErrorAfterMs = 5000,
  maxSizeMB,
  hasActiveFile = false,
}) {
  const { isDragging, error, inputRef, handlers } = useFileUpload({
    externalInputRef: externalRef,
    validate,
    maxSizeMB,
    clearErrorAfterMs,
    onValidationError,
    onFileSelect: (file) => onChange?.({ target: { files: [file] } }),
  });

  let cardStateClass = 'border-indigo-200 bg-white/40 hover:bg-white/70 hover:border-indigo-400';
  let iconWrapClass = 'bg-white border-white/50 text-indigo-500';
  let titleClass = 'text-slate-700 group-hover:text-indigo-600';
  let helperClass = 'text-slate-500';
  
  let uploadStatusText = hasActiveFile ? 'Replace image' : 'Click, drop, drag or paste';
  let displayHelperText = hasActiveFile ? 'Drop a new file here' : helperText;

  if (error) {
    cardStateClass = 'border-rose-300 bg-rose-50/50 hover:border-rose-400 hover:bg-rose-50/60';
    iconWrapClass = 'bg-rose-100 border-rose-200 text-rose-600';
    titleClass = 'text-rose-600 group-hover:text-rose-600';
    helperClass = 'text-rose-500';
    uploadStatusText = error;
    displayHelperText = 'Please try another file';
  } else if (isDragging) {
    cardStateClass = 'border-indigo-500 bg-indigo-50/80 scale-[1.02]';
    uploadStatusText = 'Drop to upload';
  }

  const renderIcon = () => {
    if (error) {
      return (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (hasActiveFile) {
      return (
        <svg 
          className={`h-5 w-5 transition-transform ${isDragging ? '-rotate-180 text-indigo-600' : 'group-hover:-rotate-180'} duration-500`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    return (
      <svg
        className={`h-6 w-6 transition-transform ${isDragging ? 'scale-110 text-indigo-600' : 'group-hover:scale-110'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    );
  };

  return (
    <label
      htmlFor={inputId}
      aria-label={error || 'Upload image file'}
      onDragOver={handlers.onDragOver}
      onDragLeave={handlers.onDragLeave}
      onDrop={handlers.onDrop}
      className={`group relative flex w-full ${heightClass} flex-col items-center justify-center rounded-2xl border-2 border-dashed shadow-sm transition-all cursor-pointer hover:shadow-md ${cardStateClass} ${className}`}
    >
      <div className="flex flex-col items-center justify-center px-4 pt-5 pb-6 text-center pointer-events-none">
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${iconWrapClass}`}>
          {renderIcon()}
        </div>

        <p className={`mb-1 text-sm font-semibold transition-colors ${titleClass}`}>
          {uploadStatusText}
        </p>
        <p className={`text-xs font-medium ${helperClass}`}>
          {displayHelperText}
        </p>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handlers.onChange}
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
  hasActiveFile: PropTypes.bool,
};