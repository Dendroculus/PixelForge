import React from 'react';
import PropTypes from 'prop-types';

/**
 * @param {Object} props
 * @param {string} [props.cropSizeLabel]
 * @param {boolean} props.canApply
 * @param {Function} props.onCancel
 * @param {Function} props.applyCrop
 * @returns {JSX.Element}
 */
export default function CropHeader({
  cropSizeLabel,
  canApply,
  onCancel,
  applyCrop,
}) {
  return (
    <div className="flex-none flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 shadow-sm z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-white font-bold text-lg">Focus Crop</h2>
        {cropSizeLabel && (
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-indigo-400 text-[10px] font-black tracking-wider uppercase border border-slate-700">
            {cropSizeLabel}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={applyCrop}
          disabled={!canApply}
          className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          Apply Crop
        </button>
      </div>
    </div>
  );
}

CropHeader.propTypes = {
  cropSizeLabel: PropTypes.string,
  canApply: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  applyCrop: PropTypes.func.isRequired,
};

CropHeader.defaultProps = {
  cropSizeLabel: '',
};
