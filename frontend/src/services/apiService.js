import { uploadImage } from './features/upscaleService';
import { removeBackgroundImage } from './features/rembgService';
import { colorRestoreImage } from './features/colorRestoreService';
import { removeObjectFromImage } from './features/objectRemoveService';
import { submitFeedback } from './features/feedbackService';
import { pollResult } from './base/pollingService';

export const apiService = {
  uploadImage,
  removeBackgroundImage,
  colorRestoreImage,
  removeObjectFromImage,
  submitFeedback,
  pollResult,
};