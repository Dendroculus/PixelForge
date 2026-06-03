import { uploadImage } from './features/upscaleService';
import { removeBackgroundImage } from './features/rembgService';
import { colorRestoreImage } from './features/colorRestoreService';
import { submitFeedback } from './features/feedbackService';
import { pollResult } from './base/pollingService';

export const apiService = {
  uploadImage,
  removeBackgroundImage,
  colorRestoreImage,
  submitFeedback,
  pollResult
};