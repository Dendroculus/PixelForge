import logoIcon from './assets/PixelForge.png';
import logoTextBlack from './assets/PixelForgeAI_BlackText.png';
import logoTextWhite from './assets/PixelForgeAI_WhiteText.png';
import logoFullBlack from './assets/PixelForgeAI_Black.png';
import logoFullWhite from './assets/PixelForgeAI.png';
import logoSvg from './assets/PixelForge.svg';

export const APP_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"],
  RESULT_EXPIRATION_TIME: 10 * 60 * 1000, // 10 minutes
  UPSCALE_LIMIT: 3,
  DAY_MS: 24 * 60 * 60 * 1000, // 24 hours
  API_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  UPLOAD_DRAFT_EXPIRATION_TIME: 10 * 60 * 1000 // 10 minutes
};

export const STORAGE_KEYS = {
  JOB_ID: 'pf_job_id',
  PROGRESS: 'pf_progress',
  RESULT_URL: 'pf_result_url',
  IS_PROCESSING: 'pf_is_processing',
  REFRESH_COUNT: 'pf_refresh_count',
  RESULT_TIMESTAMP: 'pf_result_timestamp',
  ALERT: 'pf_alert',
  UPSCALE_HISTORY: 'pf_upscale_history',
  UPLOAD_TIMESTAMP: 'pf_upload_timestamp'
};

export const IMAGES = {
  icon: logoIcon,
  textBlack: logoTextBlack,
  textWhite: logoTextWhite,
  darkLogo: logoFullBlack,
  lightLogo: logoFullWhite,
  svg: logoSvg
};