import logoIcon from './assets/PixelForge.png';
import logoTextBlack from './assets/PixelForgeAI_BlackText.png';
import logoTextWhite from './assets/PixelForgeAI_WhiteText.png';
import logoFullBlack from './assets/PixelForgeAI_Black.png';
import logoFullWhite from './assets/PixelForgeAI.png';
import logoSvg from './assets/PixelForge.svg';
import PixelForgeChatbot from './assets/PixelForgeChatbot.png'

export const APP_CONFIG = {
  MAX_FILE_SIZE_MB: 10,
  COMPRESS_MAX_SIZE_MB: 15,
  ALLOWED_EXTENSIONS: ["jpg", "jpeg", "png", "webp"],
  RESULT_EXPIRATION_TIME: 10 * 60 * 1000, // 10 minutes
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
  svg: logoSvg,
  chatbotIcon: PixelForgeChatbot
};

export const FEATURE_LIMITS = {
  default: 3,
  upscale: 3,
  rembg: 10,
  colorrestore: 10,
};

export const RESULT_LABELS = {
  upscale: 'Upscaled',
  rembg: 'Background Removed',
  colorrestore: 'Color Restored',
};