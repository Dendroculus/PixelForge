import UploadCard from '../../Upload/UploadCard';
import { APP_CONFIG } from '../../../config';

export default function ImageWatermarkControls({
  watermarkImageRef,
  handleWatermarkImageUpload,
  imgWm,
  setImgWm,
}) {
  return (
    <div className="space-y-4 pb-2">
      <UploadCard
        inputId="wm-logo-input"
        inputRef={watermarkImageRef}
        onChange={handleWatermarkImageUpload}
        helperText={imgWm.url ? 'Replace logo image' : 'Upload logo image (.png, .jpg, .webp)'}
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        maxSizeMB={APP_CONFIG.MAX_FILE_SIZE_MB}
        heightClass="h-28"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wide">Scale</label>
          <input type="range" min="0.1" max="2" step="0.1" value={imgWm.scale} onChange={(e) => setImgWm((prev) => ({ ...prev, scale: Number(e.target.value) }))} className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
        </div>
        <div>
          <label className="mb-1.5 flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wide">
            <span>Opacity</span>
            <span className="text-indigo-600">{Math.round(imgWm.opacity * 100)}%</span>
          </label>
          <input type="range" min="0.1" max="1" step="0.05" value={imgWm.opacity} onChange={(e) => setImgWm((prev) => ({ ...prev, opacity: Number(e.target.value) }))} className="h-1.5 w-full appearance-none rounded-lg bg-indigo-100 accent-indigo-600" />
        </div>
      </div>
    </div>
  );
}